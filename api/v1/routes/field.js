'use strict';

/** Field & office work: jobs, status updates, media, job logs, customers, estimates, calendar. */

const express = require('express');
const H = require('../http');
const S = require('../serialize');
const C = require('../context');
const svc = require('../services');
const { timeline, MEDIA_SELECT, EST_SELECT, INV_SELECT, withMedia } = require('./portal');
const { SCHED_SELECT } = require('./workforce');

const { wrap, ok, list, q, one, required, badRequest, notFound, intParam } = H;
const r = express.Router();
r.use(C.authenticate);

const JOB_STATUSES = ['lead', 'estimating', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const STATUS_LABEL = {
  lead: 'New lead', estimating: 'Estimating', scheduled: 'Scheduled', in_progress: 'In progress',
  on_hold: 'On hold', completed: 'Completed', cancelled: 'Cancelled',
};

// ── Jobs ─────────────────────────────────────────────────────────────────
r.get('/jobs', C.requirePerm('jobs.view_all', 'jobs.view_assigned'), wrap(async (req, res) => {
  const params = [req.company.id];
  const where = ['j.company_id = $1'];
  if (req.query.status) {
    params.push(String(req.query.status).split(','));
    where.push(`j.status = ANY($${params.length})`);
  }
  if (!req.auth.can('jobs.view_all') || req.query.mine === '1') {
    params.push(req.auth.user.id);
    where.push(svc.assignedPredicate(params.length));
  }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(j.title ILIKE $${params.length} OR j.service_address->>'line1' ILIKE $${params.length} OR cu.last_name ILIKE $${params.length})`);
  }
  const rows = await q(`${svc.JOB_SELECT} WHERE ${where.join(' AND ')}
    ORDER BY CASE j.status WHEN 'in_progress' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, j.scheduled_start NULLS LAST, j.created_at DESC
    LIMIT 500`, params);
  list(res, rows.map((j) => S.job(j, req.base)));
}));

r.get('/jobs/:id', wrap(async (req, res) => {
  ok(res, S.job(await svc.loadInternalJob(req, intParam(req.params.id)), req.base));
}));

function jobFields(b, existing = {}) {
  const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
  if (has('status')) H.oneOf(b.status, JOB_STATUSES, 'status');
  if (has('progress') && (!Number.isInteger(b.progress) || b.progress < 0 || b.progress > 100)) throw badRequest('progress must be 0-100');
  return {
    title: has('title') ? String(b.title).slice(0, 200) : existing.title,
    description: has('description') ? b.description : existing.description ?? '',
    customer_id: has('customerId') ? b.customerId : existing.customer_id ?? null,
    crew_id: has('crewId') ? b.crewId : existing.crew_id ?? null,
    status: has('status') ? b.status : existing.status ?? 'lead',
    service_address: has('serviceAddress') ? S.address(b.serviceAddress) : existing.service_address ?? {},
    latitude: has('latitude') ? H.coord(b.latitude, 'latitude', 90) : existing.latitude ?? null,
    longitude: has('longitude') ? H.coord(b.longitude, 'longitude', 180) : existing.longitude ?? null,
    scheduled_start: has('scheduledStart') ? b.scheduledStart : existing.scheduled_start ?? null,
    scheduled_end: has('scheduledEnd') ? b.scheduledEnd : existing.scheduled_end ?? null,
    estimate_total: has('estimateTotal') ? H.decimal(b.estimateTotal, 'estimateTotal') : existing.estimate_total ?? null,
    progress: has('progress') ? b.progress : existing.progress ?? 0,
  };
}

async function assertCompanyRefs(req, f) {
  if (f.customer_id && !(await one('SELECT 1 FROM app.memberships WHERE user_id = $1 AND company_id = $2', [f.customer_id, req.company.id]))) {
    throw badRequest('customerId is not a customer of this company');
  }
  if (f.crew_id && !(await one('SELECT 1 FROM app.crews WHERE id = $1 AND company_id = $2', [f.crew_id, req.company.id]))) {
    throw badRequest('crewId is not a crew of this company');
  }
}

r.post('/jobs', C.requirePerm('jobs.manage'), wrap(async (req, res) => {
  required(req.body, ['title']);
  const f = jobFields(req.body);
  await assertCompanyRefs(req, f);
  const row = await one(
    `INSERT INTO app.jobs (company_id, title, description, customer_id, crew_id, status, service_address, latitude, longitude,
       scheduled_start, scheduled_end, estimate_total, progress)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [req.company.id, f.title, f.description, f.customer_id, f.crew_id, f.status, f.service_address, f.latitude, f.longitude,
      f.scheduled_start, f.scheduled_end, f.estimate_total, f.progress],
  );
  await svc.audit(req, 'job.create', 'job', row.id);
  ok(res, S.job(await svc.loadInternalJob(req, row.id), req.base), 201);
}));

r.put('/jobs/:id', C.requirePerm('jobs.edit'), wrap(async (req, res) => {
  const existing = await svc.loadInternalJob(req, intParam(req.params.id));
  const f = jobFields(req.body, existing);
  await assertCompanyRefs(req, f);
  await q(
    `UPDATE app.jobs SET title=$1, description=$2, customer_id=$3, crew_id=$4, service_address=$5, latitude=$6, longitude=$7,
       scheduled_start=$8, scheduled_end=$9, estimate_total=$10, progress=$11 WHERE id=$12`,
    [f.title, f.description, f.customer_id, f.crew_id, f.service_address, f.latitude, f.longitude,
      f.scheduled_start, f.scheduled_end, f.estimate_total, f.progress, existing.id],
  );
  // Status changes go through the status endpoint so the timeline + notifications stay consistent.
  if (f.status !== existing.status) await applyStatus(req, existing, f.status, '', true);
  ok(res, S.job(await svc.loadInternalJob(req, existing.id), req.base));
}));

/**
 * Record a status update. Completing a job stamps completed_at and notifies the customer
 * plus every admin/super admin ("When job is finished, notification sent to …").
 */
async function applyStatus(req, job, status, message, visible) {
  const su = await one(
    'INSERT INTO app.status_updates (job_id, author_id, status, message, visible_to_customer) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [job.id, req.auth.user.id, status, message || '', visible],
  );
  await q(
    `UPDATE app.jobs SET status = $1::varchar,
       completed_at = CASE WHEN $1::varchar = 'completed' THEN COALESCE(completed_at, now()) ELSE NULL END,
       progress = CASE WHEN $1::varchar = 'completed' THEN 100 ELSE progress END WHERE id = $2`,
    [status, job.id],
  );
  const author = S.fullName(req.auth.user.first_name, req.auth.user.last_name);
  if (status === 'completed') {
    if (job.customer_id) {
      await svc.notify(req.company.id, [job.customer_id], {
        type: 'job_completed', title: `${job.title} is complete`,
        // An internal-only completion note never reaches the customer.
        body: (visible && message) || `Your ${req.company.name} project is finished. Tap to see photos and leave a review.`, data: { jobId: job.id },
      });
    }
    const staff = await svc.usersWithRoles(req.company.id, ['super_admin', 'admin', 'office_staff']);
    await svc.notify(req.company.id, staff.filter((id) => id !== req.auth.user.id), {
      type: 'job_completed', title: `Job completed: ${job.title}`, body: `Marked complete by ${author}`, data: { jobId: job.id },
    });
  } else if (visible && job.customer_id && job.status !== status) {
    await svc.notify(req.company.id, [job.customer_id], {
      type: 'status_update', title: `${job.title}: ${STATUS_LABEL[status]}`, body: message || '', data: { jobId: job.id },
    });
  } else if (visible && job.customer_id && message) {
    await svc.notify(req.company.id, [job.customer_id], {
      type: 'status_update', title: `Update on ${job.title}`, body: message, data: { jobId: job.id },
    });
  }
  return { ...su, author_name: author, author_role: req.auth.role };
}

r.post('/jobs/:id/status', C.requirePerm('jobs.status_update'), wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  const status = req.body.status || job.status;
  H.oneOf(status, JOB_STATUSES, 'status');
  if (!req.body.message && status === job.status) throw badRequest('Add a message or change the status');
  const su = await applyStatus(req, job, status, req.body.message, req.body.visibleToCustomer !== false);
  ok(res, S.statusUpdate(su, req.base, []), 201);
}));

r.get('/jobs/:id/timeline', wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  list(res, await timeline(job.id, req.base, false));
}));

r.get('/jobs/:id/media', wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  const rows = await q(`${MEDIA_SELECT} WHERE m.job_id = $1 ORDER BY m.created_at DESC`, [job.id]);
  list(res, rows.map((m) => S.media(m, req.base)));
}));

r.post('/jobs/:id/media', C.requirePerm('jobs.media_upload'), svc.upload.single('file'), wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  if (!req.file) throw badRequest('Attach a photo or video in the "file" field');
  let suId = null;
  let visible = true;
  if (req.body.statusUpdateId) {
    const su = await one('SELECT id, visible_to_customer FROM app.status_updates WHERE id = $1 AND job_id = $2', [intParam(req.body.statusUpdateId, 'statusUpdateId'), job.id]);
    if (!su) throw badRequest('statusUpdateId does not belong to this job');
    suId = su.id;
    visible = su.visible_to_customer;
  }
  const m = await one(
    `INSERT INTO app.media (company_id, job_id, status_update_id, kind, url, caption, uploaded_by, latitude, longitude, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.company.id, job.id, suId, svc.mediaKind(req.file), svc.uploadedPath(req.file), req.body.caption || '', req.auth.user.id,
      H.coord(req.body.latitude, 'latitude', 90), H.coord(req.body.longitude, 'longitude', 180), job.shared_publicly && visible],
  );
  ok(res, S.media({ ...m, uploader_name: S.fullName(req.auth.user.first_name, req.auth.user.last_name) }, req.base), 201);
}));

const LOG_SELECT = `SELECT l.*, TRIM(u.first_name || ' ' || u.last_name) AS author_name
  FROM app.job_logs l LEFT JOIN app.users u ON u.id = l.author_id`;

r.get('/jobs/:id/logs', C.requirePerm('joblogs.view'), wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  list(res, (await q(`${LOG_SELECT} WHERE l.job_id = $1 ORDER BY l.log_date DESC, l.created_at DESC`, [job.id])).map(S.jobLog));
}));

r.post('/jobs/:id/logs', C.requirePerm('joblogs.edit'), wrap(async (req, res) => {
  const job = await svc.loadInternalJob(req, intParam(req.params.id));
  const b = req.body;
  if (!b.notes && !b.hours && !b.materials) throw badRequest('Add notes, hours or materials');
  const row = await one(
    `INSERT INTO app.job_logs (job_id, author_id, log_date, notes, hours, materials, weather)
     VALUES ($1,$2,COALESCE($3::date, CURRENT_DATE),$4,$5,$6,$7) RETURNING id`,
    [job.id, req.auth.user.id, b.date || null, b.notes || '', H.decimal(b.hours, 'hours'), b.materials || '', b.weather || ''],
  );
  ok(res, S.jobLog(await one(`${LOG_SELECT} WHERE l.id = $1`, [row.id])), 201);
}));

// ── Customers ────────────────────────────────────────────────────────────
const customerSummary = (u) => ({
  id: u.id, name: S.fullName(u.first_name, u.last_name), email: u.email, phone: u.phone || '',
  address: S.address(u.address), closed: !!u.closed_at, jobCount: u.job_count ?? undefined, createdAt: S.iso(u.created_at),
});

r.get('/customers', C.requirePerm('customers.view'), wrap(async (req, res) => {
  const params = [req.company.id];
  let filter = '';
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    filter = `AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR u.email ILIKE $2 OR u.phone ILIKE $2)`;
  }
  const rows = await q(
    `SELECT u.*, m.closed_at, (SELECT COUNT(*)::int FROM app.jobs j WHERE j.customer_id = u.id AND j.company_id = $1) AS job_count
     FROM app.memberships m JOIN app.users u ON u.id = m.user_id
     WHERE m.company_id = $1 AND m.role = 'customer' ${filter} ORDER BY u.last_name, u.first_name LIMIT 500`, params,
  );
  list(res, rows.map(customerSummary));
}));

r.get('/customers/:id', C.requirePerm('customers.view'), wrap(async (req, res) => {
  const id = intParam(req.params.id);
  const u = await one(
    `SELECT u.*, m.closed_at FROM app.memberships m JOIN app.users u ON u.id = m.user_id
     WHERE m.company_id = $1 AND m.user_id = $2 AND m.role = 'customer'`, [req.company.id, id],
  );
  if (!u) throw notFound('Customer not found');
  const [jobs, estimates, invoices] = await Promise.all([
    q(`${svc.JOB_SELECT} WHERE j.company_id = $1 AND j.customer_id = $2 ORDER BY j.created_at DESC`, [req.company.id, id]),
    q(`${EST_SELECT} WHERE e.company_id = $1 AND e.customer_id = $2 ORDER BY e.created_at DESC`, [req.company.id, id]),
    q(`${INV_SELECT} WHERE i.company_id = $1 AND i.customer_id = $2 ORDER BY i.created_at DESC`, [req.company.id, id]),
  ]);
  ok(res, {
    ...customerSummary(u),
    jobs: jobs.map((j) => S.job(j, req.base)),
    estimates: await withMedia(estimates, req.base),
    invoices: invoices.map(S.invoice),
  });
}));

// ── Estimates (staff side) ───────────────────────────────────────────────
r.get('/estimates', C.requirePerm('estimates.create', 'estimates.manage'), wrap(async (req, res) => {
  const params = [req.company.id];
  let where = 'e.company_id = $1';
  if (req.query.status) { params.push(String(req.query.status).split(',')); where += ` AND e.status = ANY($${params.length})`; }
  if (!req.auth.can('estimates.manage')) { params.push(req.auth.user.id); where += ` AND (e.estimator_id = $${params.length} OR e.estimator_id IS NULL)`; }
  const rows = await q(`${EST_SELECT} WHERE ${where} ORDER BY e.created_at DESC LIMIT 500`, params);
  list(res, await withMedia(rows, req.base));
}));

function normalizeLineItems(items) {
  if (!Array.isArray(items)) return null;
  return items.map((li, i) => {
    if (!li.description) throw badRequest(`lineItems[${i}].description is required`);
    const quantity = Number(li.quantity ?? 1);
    const unitPrice = Number(H.decimal(li.unitPrice ?? 0, `lineItems[${i}].unitPrice`));
    if (!Number.isFinite(quantity) || quantity <= 0) throw badRequest(`lineItems[${i}].quantity must be positive`);
    return { description: String(li.description), quantity: String(quantity), unitPrice: unitPrice.toFixed(2), total: (quantity * unitPrice).toFixed(2) };
  });
}
const sumItems = (items) => items.reduce((s, li) => s + Number(li.total), 0).toFixed(2);

r.post('/estimates', C.requirePerm('estimates.create'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['customerId', 'serviceType']);
  const cust = await one(`SELECT u.* FROM app.memberships m JOIN app.users u ON u.id = m.user_id WHERE m.company_id = $1 AND m.user_id = $2`, [req.company.id, intParam(b.customerId, 'customerId')]);
  if (!cust) throw badRequest('customerId is not a customer of this company');
  let jobId = null;
  if (b.jobId) jobId = (await svc.loadInternalJob(req, intParam(b.jobId, 'jobId'))).id;
  const items = normalizeLineItems(b.lineItems) || [];
  const total = b.total !== undefined ? H.decimal(b.total, 'total') : (items.length ? sumItems(items) : null);
  const row = await one(
    `INSERT INTO app.estimates (company_id, customer_id, job_id, estimator_id, status, service_type, description, service_address,
       square_feet, line_items, total, valid_until, notes)
     VALUES ($1,$2,$3,$4,'in_review',$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [req.company.id, cust.id, jobId, req.auth.user.id, b.serviceType, b.description || '', S.address(b.serviceAddress || cust.address),
      H.decimal(b.squareFeet, 'squareFeet'), JSON.stringify(items), total, b.validUntil || null, b.notes || ''],
  );
  ok(res, (await withMedia([await one(`${EST_SELECT} WHERE e.id = $1`, [row.id])], req.base))[0], 201);
}));

async function staffEstimate(req) {
  const e = await one(`${EST_SELECT} WHERE e.id = $1 AND e.company_id = $2`, [intParam(req.params.id), req.company.id]);
  if (!e) throw notFound('Estimate not found');
  if (!req.auth.can('estimates.manage') && e.estimator_id && e.estimator_id !== req.auth.user.id) throw H.forbidden('This estimate is assigned to another estimator');
  return e;
}

r.put('/estimates/:id', C.requirePerm('estimates.create', 'estimates.manage'), wrap(async (req, res) => {
  const e = await staffEstimate(req);
  const b = req.body;
  H.oneOf(b.status, ['requested', 'in_review', 'sent', 'accepted', 'declined', 'expired'], 'status');
  const items = normalizeLineItems(b.lineItems);
  const total = b.total !== undefined ? H.decimal(b.total, 'total') : (items ? sumItems(items) : e.total);
  await q(
    `UPDATE app.estimates SET line_items = $1, total = $2, valid_until = $3, notes = $4, status = $5,
       service_type = $6, description = $7, square_feet = $8, estimator_id = COALESCE(estimator_id, $9) WHERE id = $10`,
    [JSON.stringify(items || e.line_items), total, b.validUntil ?? e.valid_until, b.notes ?? e.notes,
      b.status ?? (e.status === 'requested' ? 'in_review' : e.status), b.serviceType ?? e.service_type,
      b.description ?? e.description, b.squareFeet !== undefined ? H.decimal(b.squareFeet, 'squareFeet') : e.square_feet,
      req.auth.user.id, e.id],
  );
  ok(res, (await withMedia([await one(`${EST_SELECT} WHERE e.id = $1`, [e.id])], req.base))[0]);
}));

r.post('/estimates/:id/send', C.requirePerm('estimates.create', 'estimates.manage'), wrap(async (req, res) => {
  const e = await staffEstimate(req);
  if (!e.total) throw badRequest('Add a total or line items before sending');
  await q(`UPDATE app.estimates SET status = 'sent', valid_until = COALESCE(valid_until, CURRENT_DATE + 30) WHERE id = $1`, [e.id]);
  await svc.notify(req.company.id, [e.customer_id], {
    type: 'estimate', title: `Your ${req.company.name} estimate is ready`, body: `${e.service_type}: $${Number(e.total).toFixed(2)}`, data: { estimateId: e.id },
  });
  ok(res, (await withMedia([await one(`${EST_SELECT} WHERE e.id = $1`, [e.id])], req.base))[0]);
}));

// ── Calendar ─────────────────────────────────────────────────────────────
r.get('/calendar', C.requirePerm('calendar.view'), wrap(async (req, res) => {
  const { from, to } = H.dateRange(req.query, 31);
  const rows = await q(
    `${SCHED_SELECT} WHERE s.company_id = $1 AND s.ends_at >= $2 AND s.starts_at <= $3 ORDER BY s.starts_at`,
    [req.company.id, from, to],
  );
  list(res, rows.map(S.schedule));
}));

module.exports = { router: r, applyStatus };
