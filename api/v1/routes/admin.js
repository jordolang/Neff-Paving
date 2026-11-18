'use strict';

/** /admin — owners and office: users & roles, live tracking, approvals, dispatch, billing, payroll, back office. */

const express = require('express');
const H = require('../http');
const S = require('../serialize');
const C = require('../context');
const svc = require('../services');
const P = require('../permissions');
const { INV_SELECT } = require('./portal');
const { SCHED_SELECT, CREW_SELECT, TIMEOFF_SELECT, RAISE_SELECT, crewsWithMembers } = require('./workforce');

const { wrap, ok, list, q, one, required, badRequest, notFound, conflict, forbidden, intParam } = H;
const r = express.Router();
r.use(C.authenticate);
const need = C.requirePerm;

// ── Dashboard ────────────────────────────────────────────────────────────
r.get('/dashboard', need('users.manage', 'invoices.manage'), wrap(async (req, res) => {
  const c = req.company.id;
  const row = await one(
    `SELECT
      (SELECT COUNT(*) FROM app.jobs WHERE company_id = $1 AND status IN ('scheduled','in_progress'))::int AS active_jobs,
      (SELECT COUNT(*) FROM app.time_entries WHERE company_id = $1 AND clock_out IS NULL)::int AS clocked_in,
      (SELECT COUNT(*) FROM app.estimates WHERE company_id = $1 AND status IN ('requested','in_review'))::int AS pending_estimates,
      (SELECT COUNT(*) FROM app.time_off_requests WHERE company_id = $1 AND status = 'pending')::int AS pending_time_off,
      (SELECT COUNT(*) FROM app.invoices WHERE company_id = $1 AND (status = 'overdue' OR (status IN ('sent','partial') AND due_at < now())))::int AS overdue_invoices,
      (SELECT COALESCE(SUM(p.amount), 0) FROM app.payments p JOIN app.invoices i ON i.id = p.invoice_id
        WHERE i.company_id = $1 AND p.status = 'succeeded' AND p.created_at >= date_trunc('month', now())) AS revenue_mtd`,
    [c],
  );
  ok(res, {
    activeJobs: row.active_jobs, clockedIn: row.clocked_in, pendingEstimates: row.pending_estimates,
    pendingTimeOff: row.pending_time_off, overdueInvoices: row.overdue_invoices, revenueMtd: S.money(row.revenue_mtd),
  });
}));

// ── Users & roles ────────────────────────────────────────────────────────
r.get('/users', need('users.manage'), wrap(async (req, res) => {
  const params = [req.company.id];
  const where = ['m.company_id = $1'];
  if (req.query.role) { params.push(String(req.query.role).split(',')); where.push(`m.role = ANY($${params.length})`); }
  if (req.query.q) {
    params.push(`%${req.query.q}%`);
    where.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  const rows = await q(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.is_active, u.pay_rate, u.last_login_at,
       m.role, m.closed_at, r.rank
     FROM app.memberships m JOIN app.users u ON u.id = m.user_id JOIN app.roles r ON r.key = m.role
     WHERE ${where.join(' AND ')} ORDER BY r.rank DESC, u.last_name, u.first_name LIMIT 1000`, params,
  );
  list(res, rows.map((u) => ({
    id: u.id, email: u.email, name: S.fullName(u.first_name, u.last_name), firstName: u.first_name, lastName: u.last_name,
    phone: u.phone || '', avatarUrl: S.absUrl(req.base, u.avatar_url), role: u.role, isActive: u.is_active,
    closed: !!u.closed_at, payRate: S.money(u.pay_rate), lastLoginAt: S.iso(u.last_login_at),
  })));
}));

async function targetMembership(req) {
  const m = await one(
    `SELECT m.*, r.rank FROM app.memberships m JOIN app.roles r ON r.key = m.role WHERE m.user_id = $1 AND m.company_id = $2`,
    [intParam(req.params.id), req.company.id],
  );
  if (!m) throw notFound('User not found');
  return m;
}

/**
 * Role elevation rules:
 *  - roles.assign is required.
 *  - Nobody can change their own role.
 *  - Only a super admin may grant or revoke admin/super_admin, or change a super admin.
 */
r.put('/users/:id/role', need('roles.assign'), wrap(async (req, res) => {
  const role = req.body.role;
  H.oneOf(role, P.ROLE_KEYS, 'role');
  required(req.body, ['role']);
  const m = await targetMembership(req);
  if (m.user_id === req.auth.user.id) throw forbidden('You cannot change your own role');
  const touchesPrivileged = P.PRIVILEGED_ROLES.includes(role) || P.PRIVILEGED_ROLES.includes(m.role);
  if (touchesPrivileged && req.auth.role !== 'super_admin') throw forbidden('Only the super admin can grant or remove admin access');
  await q('UPDATE app.memberships SET role = $1 WHERE user_id = $2 AND company_id = $3', [role, m.user_id, req.company.id]);
  if (req.body.payRate !== undefined) await q('UPDATE app.users SET pay_rate = $1 WHERE id = $2', [H.decimal(req.body.payRate, 'payRate'), m.user_id]);
  await svc.audit(req, 'user.role', 'user', m.user_id, { from: m.role, to: role });
  const roleName = P.ROLES.find((x) => x.key === role).name;
  await svc.notify(req.company.id, [m.user_id], {
    type: 'role', title: `Your ${req.company.name} access was updated`, body: `You are now: ${roleName}. Sign out and back in if menus look out of date.`, data: { role },
  });
  ok(res, { id: m.user_id, role });
}));

r.put('/users/:id/active', need('users.manage'), wrap(async (req, res) => {
  const m = await targetMembership(req);
  if (m.user_id === req.auth.user.id) throw forbidden('You cannot deactivate yourself');
  if (m.role === 'super_admin' || (m.role === 'admin' && req.auth.role !== 'super_admin')) throw forbidden('Only the super admin can deactivate an admin');
  const active = req.body.active === true;
  await q('UPDATE app.users SET is_active = $1 WHERE id = $2', [active, m.user_id]);
  if (!active) await q('UPDATE app.refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [m.user_id]);
  await svc.audit(req, active ? 'user.activate' : 'user.deactivate', 'user', m.user_id);
  ok(res, { id: m.user_id, isActive: active });
}));

r.put('/users/:id/pay-rate', need('payroll.manage'), wrap(async (req, res) => {
  const m = await targetMembership(req);
  await q('UPDATE app.users SET pay_rate = $1 WHERE id = $2', [H.decimal(req.body.payRate, 'payRate'), m.user_id]);
  await svc.audit(req, 'user.pay_rate', 'user', m.user_id, { payRate: req.body.payRate });
  ok(res, { id: m.user_id, payRate: H.decimal(req.body.payRate, 'payRate') });
}));

r.get('/roles', need('roles.manage', 'roles.assign'), wrap(async (req, res) => {
  const rows = await q('SELECT * FROM app.roles ORDER BY rank DESC');
  list(res, rows.map((x) => ({ key: x.key, name: x.name, rank: x.rank, isInternal: x.is_internal, permissions: x.permissions, editable: x.key !== 'super_admin' })));
}));

r.get('/permissions', need('roles.manage'), (req, res) => list(res, P.ALL_PERMISSIONS));

r.put('/roles/:key', need('roles.manage'), wrap(async (req, res) => {
  const key = req.params.key;
  if (key === 'super_admin') throw forbidden('The super admin role always has every permission');
  if (key === 'admin' && req.auth.role !== 'super_admin') throw forbidden('Only the super admin can edit the admin role');
  if (!P.ROLE_KEYS.includes(key)) throw notFound('Role not found');
  const perms = req.body.permissions;
  if (!Array.isArray(perms)) throw badRequest('permissions must be an array');
  const unknown = perms.filter((p) => !P.ALL_PERMISSIONS.includes(p));
  if (unknown.length) throw badRequest(`Unknown permission(s): ${unknown.join(', ')}`);
  const row = await one('UPDATE app.roles SET permissions = $1 WHERE key = $2 RETURNING *', [[...new Set(perms)].sort(), key]);
  C.invalidateRoles();
  await svc.audit(req, 'role.update', 'role', null, { key, permissions: row.permissions });
  ok(res, { key: row.key, name: row.name, rank: row.rank, isInternal: row.is_internal, permissions: row.permissions, editable: true });
}));

// ── Live tracking ────────────────────────────────────────────────────────
r.get('/tracking/live', need('tracking.view_live'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT t.id AS entry_id, t.clock_in, t.clock_in_lat, t.clock_in_lng, t.job_id, j.title AS job_title,
       u.id AS user_id, u.first_name, u.last_name, u.avatar_url, m.role,
       lp.latitude, lp.longitude, lp.accuracy, lp.speed, lp.heading, lp.battery_level, lp.recorded_at
     FROM app.time_entries t
     JOIN app.users u ON u.id = t.user_id
     LEFT JOIN app.memberships m ON m.user_id = u.id AND m.company_id = t.company_id
     LEFT JOIN app.jobs j ON j.id = t.job_id
     LEFT JOIN LATERAL (SELECT * FROM app.location_points p WHERE p.time_entry_id = t.id ORDER BY p.recorded_at DESC LIMIT 1) lp ON true
     WHERE t.company_id = $1 AND t.clock_out IS NULL ORDER BY u.first_name`, [req.company.id],
  );
  list(res, rows.map((x) => ({
    userId: x.user_id, name: S.fullName(x.first_name, x.last_name), role: x.role, avatarUrl: S.absUrl(req.base, x.avatar_url),
    latitude: x.latitude ?? x.clock_in_lat, longitude: x.longitude ?? x.clock_in_lng,
    accuracy: x.accuracy, speed: x.speed, heading: x.heading, batteryLevel: x.battery_level,
    recordedAt: S.iso(x.recorded_at || x.clock_in), clockedInAt: S.iso(x.clock_in),
    currentJob: x.job_id ? { id: x.job_id, title: x.job_title } : null,
  })).filter((x) => x.latitude !== null && x.longitude !== null));
}));

r.get('/tracking/:userId/trail', need('tracking.view_live'), wrap(async (req, res) => {
  const userId = intParam(req.params.userId, 'userId');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : new Date().toISOString().slice(0, 10);
  const tz = process.env.COMPANY_TIMEZONE || 'America/New_York';
  const rows = await q(
    `SELECT p.latitude, p.longitude, p.recorded_at FROM app.location_points p
     JOIN app.time_entries t ON t.id = p.time_entry_id
     WHERE p.user_id = $1 AND t.company_id = $2 AND (p.recorded_at AT TIME ZONE $4)::date = $3::date
     ORDER BY p.recorded_at LIMIT 5000`, [userId, req.company.id, date, tz],
  );
  await svc.audit(req, 'tracking.trail_view', 'user', userId, { date });
  list(res, rows.map((p) => ({ latitude: p.latitude, longitude: p.longitude, recordedAt: S.iso(p.recorded_at) })));
}));

// ── Time approvals ───────────────────────────────────────────────────────
r.get('/time', need('time.view_all'), wrap(async (req, res) => {
  const { from, to } = H.dateRange(req.query, 14);
  const params = [req.company.id, from, to];
  let extra = '';
  if (req.query.status) { params.push(String(req.query.status).split(',')); extra = `AND t.status = ANY($${params.length})`; }
  if (req.query.userId) { params.push(intParam(req.query.userId, 'userId')); extra += ` AND t.user_id = $${params.length}`; }
  const rows = await q(
    `SELECT t.*, j.title AS job_title, TRIM(u.first_name || ' ' || u.last_name) AS user_name
     FROM app.time_entries t JOIN app.users u ON u.id = t.user_id LEFT JOIN app.jobs j ON j.id = t.job_id
     WHERE t.company_id = $1 AND t.clock_in BETWEEN $2 AND $3 ${extra} ORDER BY t.clock_in DESC`, params,
  );
  list(res, rows.map(S.timeEntry));
}));

for (const [action, status] of [['approve', 'approved'], ['reject', 'rejected']]) {
  r.post(`/time/:id/${action}`, need('time.approve'), wrap(async (req, res) => {
    const row = await one(
      `UPDATE app.time_entries SET status = $1, approved_by = $2
       WHERE id = $3 AND company_id = $4 AND clock_out IS NOT NULL AND paystub_id IS NULL RETURNING *`,
      [status, req.auth.user.id, intParam(req.params.id), req.company.id],
    );
    if (!row) throw conflict('Only a completed shift that has not been paid can be approved or rejected');
    if (status === 'rejected') {
      await svc.notify(req.company.id, [row.user_id], { type: 'time', title: 'A shift was sent back', body: req.body.note || 'Please review and resubmit.', data: { timeEntryId: row.id } });
    }
    ok(res, S.timeEntry(row));
  }));
}

// ── Time off ─────────────────────────────────────────────────────────────
r.get('/timeoff', need('timeoff.approve'), wrap(async (req, res) => {
  const params = [req.company.id];
  let extra = '';
  if (req.query.status) { params.push(req.query.status); extra = 'AND t.status = $2'; }
  list(res, (await q(`${TIMEOFF_SELECT} WHERE t.company_id = $1 ${extra} ORDER BY t.start_date`, params)).map(S.timeOff));
}));

for (const [action, status] of [['approve', 'approved'], ['deny', 'denied']]) {
  r.post(`/timeoff/:id/${action}`, need('timeoff.approve'), wrap(async (req, res) => {
    const row = await one(
      `UPDATE app.time_off_requests SET status = $1, reviewed_by = $2 WHERE id = $3 AND company_id = $4 AND status = 'pending' RETURNING id, user_id`,
      [status, req.auth.user.id, intParam(req.params.id), req.company.id],
    );
    if (!row) throw conflict('This request was already reviewed');
    await svc.notify(req.company.id, [row.user_id], { type: 'timeoff', title: `Time off ${status}`, body: req.body.note || '', data: { timeOffId: row.id } });
    ok(res, S.timeOff(await one(`${TIMEOFF_SELECT} WHERE t.id = $1`, [row.id])));
  }));
}

// ── Raise / position requests ────────────────────────────────────────────
r.get('/raise-requests', need('raise.review'), wrap(async (req, res) => {
  list(res, (await q(`${RAISE_SELECT} WHERE r.company_id = $1 ORDER BY r.status = 'pending' DESC, r.created_at DESC`, [req.company.id])).map(S.raise));
}));

for (const [action, status] of [['approve', 'approved'], ['deny', 'denied']]) {
  r.post(`/raise-requests/:id/${action}`, need('raise.review'), wrap(async (req, res) => {
    const rr = await one(`SELECT * FROM app.raise_requests WHERE id = $1 AND company_id = $2 AND status = 'pending'`, [intParam(req.params.id), req.company.id]);
    if (!rr) throw conflict('This request was already reviewed');
    await H.tx(async (c) => {
      await q('UPDATE app.raise_requests SET status = $1, review_note = $2, reviewed_by = $3 WHERE id = $4', [status, req.body.note || '', req.auth.user.id, rr.id], c);
      if (status === 'approved' && rr.kind === 'raise' && rr.requested_rate) await q('UPDATE app.users SET pay_rate = $1 WHERE id = $2', [rr.requested_rate, rr.user_id], c);
      if (status === 'approved' && rr.kind === 'position_change' && rr.requested_position) {
        await q('UPDATE app.memberships SET role = $1 WHERE user_id = $2 AND company_id = $3', [rr.requested_position, rr.user_id, req.company.id], c);
      }
    });
    await svc.audit(req, `raise.${status}`, 'raise_request', rr.id);
    await svc.notify(req.company.id, [rr.user_id], {
      type: 'raise', title: `Your ${rr.kind === 'raise' ? 'raise' : 'position change'} request was ${status}`, body: req.body.note || '', data: { raiseRequestId: rr.id },
    });
    ok(res, S.raise(await one(`${RAISE_SELECT} WHERE r.id = $1`, [rr.id])));
  }));
}

// ── Scheduling & dispatch ────────────────────────────────────────────────
async function assertEmployee(companyId, userId) {
  const m = await one(`SELECT 1 FROM app.memberships m JOIN app.roles r ON r.key = m.role WHERE m.company_id = $1 AND m.user_id = $2 AND r.is_internal`, [companyId, userId]);
  if (!m) throw badRequest('userId is not an employee of this company');
}
async function assertJob(companyId, jobId) {
  if (!jobId) return null;
  const j = await one('SELECT * FROM app.jobs WHERE id = $1 AND company_id = $2', [jobId, companyId]);
  if (!j) throw badRequest('jobId is not a job of this company');
  return j;
}

r.post('/schedule', need('schedule.manage'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['userId', 'start', 'end']);
  await assertEmployee(req.company.id, intParam(b.userId, 'userId'));
  await assertJob(req.company.id, b.jobId);
  const row = await one(
    `INSERT INTO app.schedule_entries (company_id, user_id, crew_id, job_id, starts_at, ends_at, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.company.id, b.userId, b.crewId || null, b.jobId || null, b.start, b.end, b.notes || '', req.auth.user.id],
  );
  await svc.notify(req.company.id, [b.userId], { type: 'schedule', title: 'New shift scheduled', body: new Date(b.start).toLocaleString('en-US', { timeZone: process.env.COMPANY_TIMEZONE || 'America/New_York' }), data: { scheduleId: row.id } });
  ok(res, S.schedule(await one(`${SCHED_SELECT} WHERE s.id = $1`, [row.id])), 201);
}));

r.put('/schedule/:id', need('schedule.manage'), wrap(async (req, res) => {
  const cur = await one('SELECT * FROM app.schedule_entries WHERE id = $1 AND company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!cur) throw notFound('Schedule entry not found');
  const b = req.body;
  if (b.userId) await assertEmployee(req.company.id, intParam(b.userId, 'userId'));
  if (b.jobId) await assertJob(req.company.id, b.jobId);
  await q(
    'UPDATE app.schedule_entries SET user_id=$1, job_id=$2, starts_at=$3, ends_at=$4, notes=$5 WHERE id=$6',
    [b.userId ?? cur.user_id, b.jobId ?? cur.job_id, b.start ?? cur.starts_at, b.end ?? cur.ends_at, b.notes ?? cur.notes, cur.id],
  );
  ok(res, S.schedule(await one(`${SCHED_SELECT} WHERE s.id = $1`, [cur.id])));
}));

r.delete('/schedule/:id', need('schedule.manage'), wrap(async (req, res) => {
  const row = await one('DELETE FROM app.schedule_entries WHERE id = $1 AND company_id = $2 RETURNING id, user_id', [intParam(req.params.id), req.company.id]);
  if (!row) throw notFound('Schedule entry not found');
  if (row.user_id) await svc.notify(req.company.id, [row.user_id], { type: 'schedule', title: 'A shift was removed from your schedule', data: {} });
  ok(res, { ok: true });
}));

/** Dispatch a crew to a job: assign the crew, schedule every member + lead, notify them. */
r.post('/dispatch', need('dispatch.manage'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['jobId', 'crewId', 'start', 'end']);
  const job = await assertJob(req.company.id, intParam(b.jobId, 'jobId'));
  const crew = await one('SELECT * FROM app.crews WHERE id = $1 AND company_id = $2', [intParam(b.crewId, 'crewId'), req.company.id]);
  if (!crew) throw badRequest('crewId is not a crew of this company');
  const memberIds = [...new Set([crew.lead_id, ...(await q('SELECT user_id FROM app.crew_members WHERE crew_id = $1', [crew.id])).map((m) => m.user_id)].filter(Boolean))];
  if (!memberIds.length) throw badRequest('This crew has no members');
  const created = await H.tx(async (c) => {
    await q(`UPDATE app.jobs SET crew_id = $1, scheduled_start = $2, scheduled_end = $3,
               status = CASE WHEN status IN ('lead','estimating') THEN 'scheduled' ELSE status END WHERE id = $4`,
    [crew.id, b.start, b.end, job.id], c);
    return q(
      `INSERT INTO app.schedule_entries (company_id, user_id, crew_id, job_id, starts_at, ends_at, notes, created_by)
       SELECT $1, uid, $2, $3, $4, $5, $6, $7 FROM unnest($8::int[]) uid RETURNING id`,
      [req.company.id, crew.id, job.id, b.start, b.end, b.notes || '', req.auth.user.id, memberIds], c,
    );
  });
  await svc.notify(req.company.id, memberIds, { type: 'schedule', title: `Dispatched: ${job.title}`, body: S.address(job.service_address).line1, data: { jobId: job.id } });
  if (job.customer_id) {
    await svc.notify(req.company.id, [job.customer_id], { type: 'status_update', title: `${job.title} is scheduled`, body: `Crew arrives ${new Date(b.start).toLocaleDateString('en-US')}`, data: { jobId: job.id } });
  }
  const rows = await q(`${SCHED_SELECT} WHERE s.id = ANY($1) ORDER BY s.id`, [created.map((x) => x.id)]);
  list(res.status(201), rows.map(S.schedule));
}));

// ── Crews ────────────────────────────────────────────────────────────────
r.get('/crews', need('crews.manage'), wrap(async (req, res) => {
  list(res, await crewsWithMembers(req.company.id, await q(`${CREW_SELECT} WHERE c.company_id = $1 ORDER BY c.name`, [req.company.id])));
}));

async function saveCrew(req, id) {
  const b = req.body;
  const memberIds = (b.memberIds || []).map((x) => intParam(x, 'memberIds'));
  for (const uid of [...memberIds, ...(b.leadId ? [b.leadId] : [])]) await assertEmployee(req.company.id, uid);
  return H.tx(async (c) => {
    let crewId = id;
    if (id) {
      const cur = await one('SELECT * FROM app.crews WHERE id = $1 AND company_id = $2', [id, req.company.id], c);
      if (!cur) throw notFound('Crew not found');
      await q('UPDATE app.crews SET name = $1, lead_id = $2, color = $3 WHERE id = $4', [b.name ?? cur.name, b.leadId === undefined ? cur.lead_id : b.leadId, b.color ?? cur.color, id], c);
    } else {
      required(b, ['name']);
      crewId = (await one('INSERT INTO app.crews (company_id, name, lead_id, color) VALUES ($1,$2,$3,COALESCE($4, \'#FF7A00\')) RETURNING id', [req.company.id, b.name, b.leadId || null, b.color || null], c)).id;
    }
    if (b.memberIds) {
      await q('DELETE FROM app.crew_members WHERE crew_id = $1', [crewId], c);
      if (memberIds.length) await q('INSERT INTO app.crew_members (crew_id, user_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING', [crewId, memberIds], c);
    }
    return crewId;
  });
}

r.post('/crews', need('crews.manage'), wrap(async (req, res) => {
  if (req.auth.rank < 60) throw forbidden('Only office staff and admins can create crews');
  const id = await saveCrew(req, null);
  ok(res, (await crewsWithMembers(req.company.id, [await one(`${CREW_SELECT} WHERE c.id = $1`, [id])]))[0], 201);
}));

r.put('/crews/:id', need('crews.manage'), wrap(async (req, res) => {
  if (req.auth.rank < 60) throw forbidden('Crew leads change members via PUT /crews/:id/members');
  const id = await saveCrew(req, intParam(req.params.id));
  ok(res, (await crewsWithMembers(req.company.id, [await one(`${CREW_SELECT} WHERE c.id = $1`, [id])]))[0]);
}));

r.delete('/crews/:id', need('crews.manage'), wrap(async (req, res) => {
  if (req.auth.rank < 60) throw forbidden();
  const row = await one('DELETE FROM app.crews WHERE id = $1 AND company_id = $2 RETURNING id', [intParam(req.params.id), req.company.id]);
  if (!row) throw notFound('Crew not found');
  ok(res, { ok: true });
}));

// ── Invoices & payments ──────────────────────────────────────────────────
function invoiceItems(items) {
  if (!Array.isArray(items) || !items.length) throw badRequest('lineItems must be a non-empty array');
  return items.map((li, i) => {
    if (!li.description) throw badRequest(`lineItems[${i}].description is required`);
    const qty = Number(li.quantity ?? 1); const price = Number(H.decimal(li.unitPrice ?? 0, 'unitPrice'));
    if (!(qty > 0)) throw badRequest(`lineItems[${i}].quantity must be positive`);
    return { description: String(li.description), quantity: String(qty), unitPrice: price.toFixed(2), total: (qty * price).toFixed(2) };
  });
}

async function recomputeInvoice(invoiceId, client) {
  await q(
    `UPDATE app.invoices i SET status = CASE
       WHEN i.status IN ('void','draft') THEN i.status
       WHEN paid.s >= i.total THEN 'paid'
       WHEN paid.s > 0 THEN 'partial'
       WHEN i.due_at < now() THEN 'overdue'
       ELSE 'sent' END
     FROM (SELECT COALESCE(SUM(amount), 0) AS s FROM app.payments WHERE invoice_id = $1 AND status = 'succeeded') paid
     WHERE i.id = $1`, [invoiceId], client,
  );
}

r.get('/invoices', need('invoices.manage'), wrap(async (req, res) => {
  const params = [req.company.id];
  let extra = '';
  if (req.query.status) { params.push(String(req.query.status).split(',')); extra = `AND i.status = ANY($2)`; }
  list(res, (await q(`${INV_SELECT} WHERE i.company_id = $1 ${extra} ORDER BY i.created_at DESC LIMIT 1000`, params)).map(S.invoice));
}));

r.get('/invoices/:id', need('invoices.manage'), wrap(async (req, res) => {
  const inv = await one(`${INV_SELECT} WHERE i.id = $1 AND i.company_id = $2`, [intParam(req.params.id), req.company.id]);
  if (!inv) throw notFound('Invoice not found');
  const payments = await q('SELECT * FROM app.payments WHERE invoice_id = $1 ORDER BY created_at', [inv.id]);
  ok(res, { ...S.invoice(inv), payments: payments.map(S.payment) });
}));

r.post('/invoices', need('invoices.manage'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['customerId', 'lineItems']);
  const cust = await one('SELECT 1 FROM app.memberships WHERE user_id = $1 AND company_id = $2', [intParam(b.customerId, 'customerId'), req.company.id]);
  if (!cust) throw badRequest('customerId is not a customer of this company');
  if (b.jobId) await assertJob(req.company.id, intParam(b.jobId, 'jobId'));
  const items = invoiceItems(b.lineItems);
  const subtotal = items.reduce((s, li) => s + Number(li.total), 0);
  const tax = Number(H.decimal(b.tax ?? 0, 'tax'));
  const id = (await one(`SELECT nextval('app.invoices_id_seq') AS id`)).id;
  const number = `${req.company.invoice_prefix}-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
  await q(
    `INSERT INTO app.invoices (id, company_id, number, customer_id, job_id, status, due_at, line_items, subtotal, tax, total)
     VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10)`,
    [id, req.company.id, number, b.customerId, b.jobId || null, b.dueAt || null, JSON.stringify(items), subtotal.toFixed(2), tax.toFixed(2), (subtotal + tax).toFixed(2)],
  );
  ok(res, S.invoice(await one(`${INV_SELECT} WHERE i.id = $1`, [id])), 201);
}));

r.put('/invoices/:id', need('invoices.manage'), wrap(async (req, res) => {
  const inv = await one('SELECT * FROM app.invoices WHERE id = $1 AND company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!inv) throw notFound('Invoice not found');
  const b = req.body;
  if (b.status === 'void') {
    await q(`UPDATE app.invoices SET status = 'void' WHERE id = $1`, [inv.id]);
  } else {
    if (!['draft', 'sent', 'overdue'].includes(inv.status)) throw conflict('Paid or partially paid invoices can only be voided');
    const items = b.lineItems ? invoiceItems(b.lineItems) : inv.line_items;
    const subtotal = items.reduce((s, li) => s + Number(li.total), 0);
    const tax = Number(b.tax !== undefined ? H.decimal(b.tax, 'tax') : inv.tax);
    await q('UPDATE app.invoices SET line_items = $1, subtotal = $2, tax = $3, total = $4, due_at = $5 WHERE id = $6',
      [JSON.stringify(items), subtotal.toFixed(2), tax.toFixed(2), (subtotal + tax).toFixed(2), b.dueAt ?? inv.due_at, inv.id]);
  }
  ok(res, S.invoice(await one(`${INV_SELECT} WHERE i.id = $1`, [inv.id])));
}));

r.post('/invoices/:id/send', need('invoices.manage'), wrap(async (req, res) => {
  const inv = await one(`UPDATE app.invoices SET status = 'sent', issued_at = COALESCE(issued_at, now()),
      due_at = COALESCE(due_at, now() + interval '30 days') WHERE id = $1 AND company_id = $2 AND status = 'draft' RETURNING *`,
  [intParam(req.params.id), req.company.id]);
  if (!inv) throw conflict('Only a draft invoice can be sent');
  await svc.notify(req.company.id, [inv.customer_id], {
    type: 'invoice', title: `Invoice ${inv.number}`, body: `$${Number(inv.total).toFixed(2)} due ${new Date(inv.due_at).toLocaleDateString('en-US')}`, data: { invoiceId: inv.id },
  });
  ok(res, S.invoice(await one(`${INV_SELECT} WHERE i.id = $1`, [inv.id])));
}));

r.post('/payments', need('invoices.manage'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['invoiceId', 'amount', 'method']);
  H.oneOf(b.method, ['card', 'ach', 'check', 'cash'], 'method');
  const inv = await one(`${INV_SELECT} WHERE i.id = $1 AND i.company_id = $2`, [intParam(b.invoiceId, 'invoiceId'), req.company.id]);
  if (!inv) throw notFound('Invoice not found');
  if (['void', 'draft'].includes(inv.status)) throw conflict(`Cannot record a payment on a ${inv.status} invoice`);
  const amount = H.decimal(b.amount, 'amount');
  if (!(Number(amount) > 0)) throw badRequest('amount must be positive');
  const p = await H.tx(async (c) => {
    const row = await one(`INSERT INTO app.payments (invoice_id, amount, method, status, recorded_by) VALUES ($1,$2,$3,'succeeded',$4) RETURNING *`,
      [inv.id, amount, b.method, req.auth.user.id], c);
    await recomputeInvoice(inv.id, c);
    return row;
  });
  await svc.audit(req, 'payment.record', 'invoice', inv.id, { amount, method: b.method });
  ok(res, S.payment(p), 201);
}));

// ── Payroll ──────────────────────────────────────────────────────────────
r.get('/payroll/runs', need('payroll.manage'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT pr.*, COUNT(ps.id)::int AS stub_count, COALESCE(SUM(ps.gross), 0) AS gross, COALESCE(SUM(ps.net), 0) AS net
     FROM app.payroll_runs pr LEFT JOIN app.paystubs ps ON ps.payroll_run_id = pr.id
     WHERE pr.company_id = $1 GROUP BY pr.id ORDER BY pr.period_end DESC`, [req.company.id],
  );
  list(res, rows.map((x) => ({
    id: x.id, periodStart: S.day(x.period_start), periodEnd: S.day(x.period_end), stubCount: x.stub_count,
    gross: S.money(x.gross), net: S.money(x.net), createdAt: S.iso(x.created_at),
  })));
}));

/**
 * Build pay stubs from APPROVED, unpaid shifts in the period. Overtime is 1.5x for hours over
 * 40 in a Mon-Sun week. Deductions are an estimate (PAYROLL_WITHHOLDING_RATE × gross + the
 * employee's extra withholding) — file actual payroll taxes through your payroll provider.
 */
r.post('/payroll/runs', need('payroll.manage'), wrap(async (req, res) => {
  required(req.body, ['periodStart', 'periodEnd']);
  const { periodStart, periodEnd } = req.body;
  if (periodEnd < periodStart) throw badRequest('periodEnd must be on or after periodStart');
  const rate = Number(process.env.PAYROLL_WITHHOLDING_RATE || 0);
  const tz = process.env.COMPANY_TIMEZONE || 'America/New_York';
  const out = await H.tx(async (c) => {
    // One payroll run per company at a time, so two runs can't both claim the same shifts.
    await q('SELECT pg_advisory_xact_lock(hashtext($1))', [`payroll:${req.company.id}`], c);
    const run = await one('INSERT INTO app.payroll_runs (company_id, period_start, period_end, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.company.id, periodStart, periodEnd, req.auth.user.id], c);
    const weeks = await q(
      `SELECT t.user_id, date_trunc('week', t.clock_in AT TIME ZONE $4) AS wk,
         SUM(EXTRACT(EPOCH FROM (t.clock_out - t.clock_in)) / 3600) AS hours, array_agg(t.id) AS ids
       FROM app.time_entries t
       WHERE t.company_id = $1 AND t.status = 'approved' AND t.paystub_id IS NULL
         AND (t.clock_in AT TIME ZONE $4)::date BETWEEN $2 AND $3
       GROUP BY t.user_id, wk`, [req.company.id, periodStart, periodEnd, tz], c,
    );
    const byUser = new Map();
    for (const w of weeks) {
      const u = byUser.get(w.user_id) || { hours: 0, regular: 0, overtime: 0, ids: [] };
      const h = Number(w.hours);
      u.hours += h; u.regular += Math.min(h, 40); u.overtime += Math.max(0, h - 40); u.ids.push(...w.ids);
      byUser.set(w.user_id, u);
    }
    const stubs = [];
    for (const [userId, u] of byUser) {
      const usr = await one('SELECT pay_rate FROM app.users WHERE id = $1', [userId], c);
      const tp = await one('SELECT extra_withholding FROM app.tax_prefs WHERE user_id = $1', [userId], c);
      const payRate = Number(usr.pay_rate || 0);
      const gross = u.regular * payRate + u.overtime * payRate * 1.5;
      const deductions = Math.min(gross, gross * rate + Number(tp?.extra_withholding || 0));
      const stub = await one(
        `INSERT INTO app.paystubs (company_id, payroll_run_id, user_id, period_start, period_end, pay_date, hours, gross, deductions, net)
         VALUES ($1,$2,$3,$4,$5,COALESCE($6::date, $5::date + 5),$7,$8,$9,$10) RETURNING *`,
        [req.company.id, run.id, userId, periodStart, periodEnd, req.body.payDate || null, u.hours.toFixed(2), gross.toFixed(2), deductions.toFixed(2), (gross - deductions).toFixed(2)], c,
      );
      await q('UPDATE app.time_entries SET paystub_id = $1 WHERE id = ANY($2)', [stub.id, u.ids], c);
      stubs.push(stub);
    }
    return { run, stubs };
  });
  await svc.notify(req.company.id, out.stubs.map((s) => s.user_id), { type: 'paystub', title: 'New pay stub available', body: `${periodStart} – ${periodEnd}`, data: {} });
  await svc.audit(req, 'payroll.run', 'payroll_run', out.run.id, { stubs: out.stubs.length });
  ok(res, {
    id: out.run.id, periodStart, periodEnd, stubCount: out.stubs.length,
    gross: S.money(out.stubs.reduce((s, x) => s + Number(x.gross), 0)), net: S.money(out.stubs.reduce((s, x) => s + Number(x.net), 0)),
    paystubs: out.stubs.map(S.paystub),
  }, 201);
}));

// ── Simple back-office CRUD: suppliers, equipment, job postings ──────────
function crud(path, table, perm, fields, serialize, opts = {}) {
  const cols = Object.keys(fields);
  const readPerm = opts.readPerm || perm;
  r.get(`/${path}`, need(...[readPerm, perm].flat()), wrap(async (req, res) => {
    list(res, (await q(`SELECT * FROM app.${table} WHERE company_id = $1 ORDER BY ${opts.order || 'created_at DESC'}`, [req.company.id])).map(serialize));
  }));
  r.post(`/${path}`, need(perm), wrap(async (req, res) => {
    required(req.body, opts.required || []);
    const vals = cols.map((c) => fields[c](req.body));
    const row = await one(
      `INSERT INTO app.${table} (company_id, ${cols.join(', ')}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
      [req.company.id, ...vals.map((v, i) => (v === undefined ? opts.defaults?.[cols[i]] ?? '' : v))],
    );
    ok(res, serialize(row), 201);
  }));
  r.put(`/${path}/:id`, need(perm), wrap(async (req, res) => {
    const cur = await one(`SELECT * FROM app.${table} WHERE id = $1 AND company_id = $2`, [intParam(req.params.id), req.company.id]);
    if (!cur) throw notFound();
    const vals = cols.map((c) => { const v = fields[c](req.body); return v === undefined ? cur[c] : v; });
    const row = await one(`UPDATE app.${table} SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`, [cur.id, ...vals]);
    ok(res, serialize(row));
  }));
  r.delete(`/${path}/:id`, need(perm), wrap(async (req, res) => {
    const row = await one(`DELETE FROM app.${table} WHERE id = $1 AND company_id = $2 RETURNING id`, [intParam(req.params.id), req.company.id]);
    if (!row) throw notFound();
    ok(res, { ok: true });
  }));
}
const str = (k) => (b) => (b[k] === undefined ? undefined : String(b[k] ?? ''));
const bool = (k) => (b) => (b[k] === undefined ? undefined : b[k] === true);

crud('suppliers', 'suppliers', 'suppliers.manage', {
  name: str('name'), contact_name: str('contactName'), phone: str('phone'), email: str('email'), materials: str('materials'), notes: str('notes'),
}, (s) => ({ id: s.id, name: s.name, contactName: s.contact_name, phone: s.phone, email: s.email, materials: s.materials, notes: s.notes, createdAt: S.iso(s.created_at) }),
{ required: ['name'], order: 'name' });

crud('job-postings', 'job_postings', 'job_postings.manage', {
  title: str('title'), description: str('description'), pay_range: str('payRange'), is_open: bool('isOpen'),
}, (p) => ({ id: p.id, title: p.title, description: p.description, payRange: p.pay_range, isOpen: p.is_open, createdAt: S.iso(p.created_at) }),
{ required: ['title'], defaults: { is_open: true } });

const equipmentOut = (e, records = []) => ({
  id: e.id, name: e.name, kind: e.kind, identifier: e.identifier, status: e.status, notes: e.notes,
  lastServiceAt: S.day(e.last_service_at), nextDueAt: S.day(e.next_due_at),
  maintenance: records.map((m) => ({ id: m.id, description: m.description, cost: S.money(m.cost), performedAt: S.day(m.performed_at), nextDueAt: S.day(m.next_due_at), createdAt: S.iso(m.created_at) })),
  createdAt: S.iso(e.created_at),
});
r.get('/equipment', need('maintenance.view'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT e.*, (SELECT MAX(performed_at) FROM app.maintenance_records m WHERE m.equipment_id = e.id) AS last_service_at,
       (SELECT next_due_at FROM app.maintenance_records m WHERE m.equipment_id = e.id ORDER BY performed_at DESC, id DESC LIMIT 1) AS next_due_at
     FROM app.equipment e WHERE e.company_id = $1 ORDER BY e.name`, [req.company.id],
  );
  const recs = rows.length ? await q('SELECT * FROM app.maintenance_records WHERE equipment_id = ANY($1) ORDER BY performed_at DESC', [rows.map((e) => e.id)]) : [];
  list(res, rows.map((e) => equipmentOut(e, recs.filter((m) => m.equipment_id === e.id))));
}));
r.post('/equipment', need('maintenance.manage'), wrap(async (req, res) => {
  required(req.body, ['name']);
  H.oneOf(req.body.status, ['active', 'in_shop', 'retired'], 'status');
  const b = req.body;
  ok(res, equipmentOut(await one(
    'INSERT INTO app.equipment (company_id, name, kind, identifier, status, notes) VALUES ($1,$2,$3,$4,COALESCE($5,\'active\'),$6) RETURNING *',
    [req.company.id, b.name, b.kind || '', b.identifier || '', b.status || null, b.notes || ''],
  )), 201);
}));
r.put('/equipment/:id', need('maintenance.manage'), wrap(async (req, res) => {
  const cur = await one('SELECT * FROM app.equipment WHERE id = $1 AND company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!cur) throw notFound('Equipment not found');
  const b = req.body;
  H.oneOf(b.status, ['active', 'in_shop', 'retired'], 'status');
  ok(res, equipmentOut(await one('UPDATE app.equipment SET name=$1, kind=$2, identifier=$3, status=$4, notes=$5 WHERE id=$6 RETURNING *',
    [b.name ?? cur.name, b.kind ?? cur.kind, b.identifier ?? cur.identifier, b.status ?? cur.status, b.notes ?? cur.notes, cur.id])));
}));
r.post('/equipment/:id/maintenance', need('maintenance.manage'), wrap(async (req, res) => {
  const eq = await one('SELECT * FROM app.equipment WHERE id = $1 AND company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!eq) throw notFound('Equipment not found');
  required(req.body, ['description']);
  const m = await one(
    `INSERT INTO app.maintenance_records (equipment_id, description, cost, performed_at, next_due_at, performed_by)
     VALUES ($1,$2,$3,COALESCE($4::date, CURRENT_DATE),$5,$6) RETURNING *`,
    [eq.id, req.body.description, H.decimal(req.body.cost, 'cost'), req.body.performedAt || null, req.body.nextDueAt || null, req.auth.user.id],
  );
  ok(res, { id: m.id, description: m.description, cost: S.money(m.cost), performedAt: S.day(m.performed_at), nextDueAt: S.day(m.next_due_at), createdAt: S.iso(m.created_at) }, 201);
}));

// ── Reviews & media moderation ───────────────────────────────────────────
r.get('/reviews', need('reviews.manage'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT r.*, u.first_name AS customer_first, u.last_name AS customer_last, j.title AS job_title
     FROM app.reviews r JOIN app.jobs j ON j.id = r.job_id LEFT JOIN app.users u ON u.id = r.customer_id
     WHERE j.company_id = $1 ORDER BY r.created_at DESC`, [req.company.id],
  );
  list(res, rows.map((x) => ({ ...S.review(x), jobTitle: x.job_title })));
}));
r.put('/reviews/:id', need('reviews.manage'), wrap(async (req, res) => {
  const cur = await one('SELECT r.* FROM app.reviews r JOIN app.jobs j ON j.id = r.job_id WHERE r.id = $1 AND j.company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!cur) throw notFound('Review not found');
  const row = await one('UPDATE app.reviews SET is_published = $1, response = $2 WHERE id = $3 RETURNING *',
    [typeof req.body.isPublished === 'boolean' ? req.body.isPublished : cur.is_published, req.body.response ?? cur.response, cur.id]);
  if (req.body.response && req.body.response !== cur.response && cur.customer_id) {
    await svc.notify(req.company.id, [cur.customer_id], { type: 'review', title: `${req.company.name} replied to your review`, body: req.body.response, data: { jobId: cur.job_id } });
  }
  ok(res, S.review(row));
}));

r.put('/media/:id', need('gallery.manage'), wrap(async (req, res) => {
  const cur = await one('SELECT * FROM app.media WHERE id = $1 AND company_id = $2', [intParam(req.params.id), req.company.id]);
  if (!cur) throw notFound('Media not found');
  const row = await one('UPDATE app.media SET is_public = $1, caption = $2 WHERE id = $3 RETURNING *',
    [typeof req.body.isPublic === 'boolean' ? req.body.isPublic : cur.is_public, req.body.caption ?? cur.caption, cur.id]);
  ok(res, S.media(row, req.base));
}));
r.delete('/media/:id', need('gallery.manage'), wrap(async (req, res) => {
  const row = await one('DELETE FROM app.media WHERE id = $1 AND company_id = $2 RETURNING *', [intParam(req.params.id), req.company.id]);
  if (!row) throw notFound('Media not found');
  await svc.audit(req, 'media.delete', 'media', row.id, { url: row.url });
  ok(res, { ok: true });
}));

// ── Account close-out ────────────────────────────────────────────────────
r.post('/accounts/:customerId/close', need('accounts.close'), wrap(async (req, res) => {
  const id = intParam(req.params.customerId, 'customerId');
  const m = await one(`SELECT * FROM app.memberships WHERE user_id = $1 AND company_id = $2 AND role = 'customer'`, [id, req.company.id]);
  if (!m) throw notFound('Customer not found');
  const open = await one(`SELECT COUNT(*)::int AS n FROM app.invoices WHERE customer_id = $1 AND company_id = $2 AND status IN ('sent','partial','overdue')`, [id, req.company.id]);
  if (open.n && req.body.force !== true) throw conflict(`This customer has ${open.n} unpaid invoice(s). Resend with { "force": true } to close anyway.`);
  await q('UPDATE app.memberships SET closed_at = now() WHERE user_id = $1 AND company_id = $2', [id, req.company.id]);
  await svc.audit(req, 'account.close', 'user', id, { reason: req.body.reason || '' });
  ok(res, { id, closed: true });
}));

module.exports = { router: r, recomputeInvoice };
