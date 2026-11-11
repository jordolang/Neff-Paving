'use strict';

/** /portal — the customer side: jobs, timeline, photos, sharing, reviews, estimates, billing. */

const express = require('express');
const H = require('../http');
const S = require('../serialize');
const C = require('../context');
const svc = require('../services');

const { wrap, ok, list, q, one, required, badRequest, notFound, conflict, intParam } = H;
const r = express.Router();
r.use(C.authenticate, C.requirePerm('portal.use'));

// ── Jobs ─────────────────────────────────────────────────────────────────
r.get('/jobs', wrap(async (req, res) => {
  const rows = await q(`${svc.JOB_SELECT} WHERE j.company_id = $1 AND j.customer_id = $2 ORDER BY j.created_at DESC`, [req.company.id, req.auth.user.id]);
  list(res, rows.map((j) => S.job(j, req.base)));
}));

r.get('/jobs/:id', wrap(async (req, res) => {
  ok(res, S.job(await svc.loadCustomerJob(req, intParam(req.params.id)), req.base));
}));

async function timeline(jobId, base, customerOnly) {
  const updates = await q(
    `SELECT s.*, TRIM(u.first_name || ' ' || u.last_name) AS author_name, m.role AS author_role
     FROM app.status_updates s
     JOIN app.jobs j ON j.id = s.job_id
     LEFT JOIN app.users u ON u.id = s.author_id
     LEFT JOIN app.memberships m ON m.user_id = s.author_id AND m.company_id = j.company_id
     WHERE s.job_id = $1 ${customerOnly ? 'AND s.visible_to_customer' : ''} ORDER BY s.created_at DESC`,
    [jobId],
  );
  const ids = updates.map((u) => u.id);
  const media = ids.length ? await q('SELECT * FROM app.media WHERE status_update_id = ANY($1)', [ids]) : [];
  return updates.map((u) => S.statusUpdate(u, base, media.filter((m) => m.status_update_id === u.id)));
}

r.get('/jobs/:id/timeline', wrap(async (req, res) => {
  const j = await svc.loadCustomerJob(req, intParam(req.params.id));
  list(res, await timeline(j.id, req.base, true));
}));

const MEDIA_SELECT = `SELECT m.*, TRIM(u.first_name || ' ' || u.last_name) AS uploader_name
  FROM app.media m LEFT JOIN app.users u ON u.id = m.uploaded_by`;

r.get('/jobs/:id/media', wrap(async (req, res) => {
  const j = await svc.loadCustomerJob(req, intParam(req.params.id));
  // Everything on the job except media attached to an internal-only status update.
  const rows = await q(
    `${MEDIA_SELECT} LEFT JOIN app.status_updates s ON s.id = m.status_update_id
     WHERE m.job_id = $1 AND (m.status_update_id IS NULL OR s.visible_to_customer)
     ORDER BY m.created_at DESC`,
    [j.id],
  );
  list(res, rows.map((m) => S.media(m, req.base)));
}));

r.post('/jobs/:id/media', svc.upload.single('file'), wrap(async (req, res) => {
  const j = await svc.loadCustomerJob(req, intParam(req.params.id));
  if (!req.file) throw badRequest('Attach a photo or video in the "file" field');
  const m = await one(
    `INSERT INTO app.media (company_id, job_id, kind, url, caption, uploaded_by, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.company.id, j.id, svc.mediaKind(req.file), svc.uploadedPath(req.file), req.body.caption || '', req.auth.user.id, j.shared_publicly],
  );
  ok(res, S.media(m, req.base), 201);
}));

r.post('/jobs/:id/share', wrap(async (req, res) => {
  const j = await svc.loadCustomerJob(req, intParam(req.params.id));
  const share = req.body.share === true;
  await H.tx(async (c) => {
    await q('UPDATE app.jobs SET shared_publicly = $1 WHERE id = $2', [share, j.id], c);
    await q(`UPDATE app.media m SET is_public = $1 WHERE m.job_id = $2 AND ($1 = false OR ${svc.CUSTOMER_VISIBLE_MEDIA})`, [share, j.id], c);
  });
  ok(res, S.job(await svc.loadCustomerJob(req, j.id), req.base));
}));

r.post('/jobs/:id/review', wrap(async (req, res) => {
  const j = await svc.loadCustomerJob(req, intParam(req.params.id));
  if (j.status !== 'completed') throw badRequest('You can leave a review once the job is completed');
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw badRequest('rating must be 1-5');
  const row = await one(
    `INSERT INTO app.reviews (job_id, customer_id, rating, comment) VALUES ($1, $2, $3, $4)
     ON CONFLICT (job_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment RETURNING *`,
    [j.id, req.auth.user.id, rating, String(req.body.comment || '').slice(0, 4000)],
  );
  await svc.notify(req.company.id, await svc.adminIds(req.company.id), {
    type: 'review', title: `New ${rating}★ review`, body: j.title, data: { jobId: j.id },
  });
  ok(res, S.review({ ...row, customer_first: req.auth.user.first_name, customer_last: req.auth.user.last_name }), 201);
}));

// ── Estimates ────────────────────────────────────────────────────────────
const EST_SELECT = `SELECT e.*, TRIM(cu.first_name || ' ' || cu.last_name) AS customer_name,
    TRIM(es.first_name || ' ' || es.last_name) AS estimator_name
  FROM app.estimates e LEFT JOIN app.users cu ON cu.id = e.customer_id
  LEFT JOIN app.users es ON es.id = e.estimator_id`;

async function withMedia(rows, base) {
  const ids = rows.map((e) => e.id);
  const media = ids.length ? await q('SELECT * FROM app.media WHERE estimate_id = ANY($1)', [ids]) : [];
  return rows.map((e) => S.estimate(e, base, media.filter((m) => m.estimate_id === e.id)));
}

async function myEstimate(req) {
  const e = await one(`${EST_SELECT} WHERE e.id = $1 AND e.company_id = $2 AND e.customer_id = $3`, [intParam(req.params.id), req.company.id, req.auth.user.id]);
  if (!e) throw notFound('Estimate not found');
  return e;
}

r.get('/estimates', wrap(async (req, res) => {
  const rows = await q(`${EST_SELECT} WHERE e.company_id = $1 AND e.customer_id = $2 ORDER BY e.created_at DESC`, [req.company.id, req.auth.user.id]);
  list(res, await withMedia(rows, req.base));
}));

r.post('/estimates', C.requirePerm('estimates.request'), wrap(async (req, res) => {
  required(req.body, ['serviceType', 'description']);
  const b = req.body;
  const row = await one(
    `INSERT INTO app.estimates (company_id, customer_id, service_type, description, service_address, square_feet, preferred_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [req.company.id, req.auth.user.id, String(b.serviceType).slice(0, 100), b.description,
      S.address(b.serviceAddress || req.auth.user.address), H.decimal(b.squareFeet, 'squareFeet'), b.preferredDate || null],
  );
  const staff = await svc.usersWithRoles(req.company.id, ['super_admin', 'admin', 'office_staff', 'estimator']);
  await svc.notify(req.company.id, staff, {
    type: 'estimate', title: 'New estimate request',
    body: `${S.fullName(req.auth.user.first_name, req.auth.user.last_name)} — ${b.serviceType}`, data: { estimateId: row.id },
  });
  req.params.id = row.id;
  ok(res, (await withMedia([await myEstimate(req)], req.base))[0], 201);
}));

r.post('/estimates/:id/photos', svc.upload.single('file'), wrap(async (req, res) => {
  const e = await myEstimate(req);
  if (!req.file) throw badRequest('Attach a photo or video in the "file" field');
  const m = await one(
    `INSERT INTO app.media (company_id, estimate_id, job_id, kind, url, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.company.id, e.id, e.job_id, svc.mediaKind(req.file), svc.uploadedPath(req.file), req.auth.user.id],
  );
  ok(res, S.media(m, req.base), 201);
}));

for (const [action, status] of [['accept', 'accepted'], ['decline', 'declined']]) {
  r.post(`/estimates/:id/${action}`, wrap(async (req, res) => {
    const e = await myEstimate(req);
    if (e.status !== 'sent') throw conflict('Only an estimate that has been sent to you can be accepted or declined');
    await q('UPDATE app.estimates SET status = $1 WHERE id = $2', [status, e.id]);
    if (status === 'accepted' && e.job_id) {
      await q(`UPDATE app.jobs SET status = 'scheduled', estimate_total = $1 WHERE id = $2 AND status IN ('lead','estimating')`, [e.total, e.job_id]);
    }
    const staff = await svc.usersWithRoles(req.company.id, ['super_admin', 'admin', 'office_staff']);
    await svc.notify(req.company.id, [...staff, e.estimator_id], {
      type: 'estimate', title: `Estimate ${status}`, body: `${e.customer_name} ${status} estimate #${e.id}`, data: { estimateId: e.id },
    });
    ok(res, (await withMedia([await myEstimate(req)], req.base))[0]);
  }));
}

// ── Billing ──────────────────────────────────────────────────────────────
const INV_SELECT = `SELECT i.*, TRIM(u.first_name || ' ' || u.last_name) AS customer_name,
    (SELECT COALESCE(SUM(amount), 0) FROM app.payments p WHERE p.invoice_id = i.id AND p.status = 'succeeded') AS paid
  FROM app.invoices i LEFT JOIN app.users u ON u.id = i.customer_id`;

r.get('/invoices', wrap(async (req, res) => {
  const rows = await q(`${INV_SELECT} WHERE i.company_id = $1 AND i.customer_id = $2 AND i.status <> 'draft' ORDER BY i.issued_at DESC NULLS LAST`, [req.company.id, req.auth.user.id]);
  list(res, rows.map(S.invoice));
}));

r.get('/payments', wrap(async (req, res) => {
  const rows = await q(
    `SELECT p.*, i.number AS invoice_number FROM app.payments p JOIN app.invoices i ON i.id = p.invoice_id
     WHERE i.company_id = $1 AND i.customer_id = $2 ORDER BY p.created_at DESC`, [req.company.id, req.auth.user.id],
  );
  list(res, rows.map(S.payment));
}));

r.post('/invoices/:id/pay', C.requirePerm('payments.make'), wrap(async (req, res) => {
  const inv = await one(`${INV_SELECT} WHERE i.id = $1 AND i.company_id = $2 AND i.customer_id = $3`, [intParam(req.params.id), req.company.id, req.auth.user.id]);
  if (!inv || inv.status === 'draft') throw notFound('Invoice not found');
  if (['paid', 'void'].includes(inv.status)) throw conflict(`This invoice is ${inv.status}`);
  const balance = Number(inv.total) - Number(inv.paid);
  const amount = Number(H.decimal(req.body.amount ?? balance, 'amount'));
  if (!(amount > 0) || amount > balance + 0.001) throw badRequest(`Amount must be between 0.01 and ${balance.toFixed(2)}`);

  const payment = await one(
    `INSERT INTO app.payments (invoice_id, amount, method, status) VALUES ($1, $2, 'card', 'pending') RETURNING *`,
    [inv.id, amount.toFixed(2)],
  );
  let checkoutUrl = null;
  if (process.env.STRIPE_SECRET_KEY) {
    const form = new URLSearchParams({
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL || `${req.base}/payment-complete`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${req.base}/payment-cancelled`,
      client_reference_id: String(payment.id),
      customer_email: req.auth.user.email,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][price_data][product_data][name]': `${req.company.name} invoice ${inv.number}`,
      'metadata[paymentId]': String(payment.id),
    });
    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const session = await resp.json();
    if (!resp.ok) {
      await q(`UPDATE app.payments SET status = 'failed' WHERE id = $1`, [payment.id]);
      throw new H.ApiError(502, 'server_error', 'The payment provider is unavailable, please try again');
    }
    await q('UPDATE app.payments SET external_ref = $1 WHERE id = $2', [session.id, payment.id]);
    checkoutUrl = session.url;
  }
  ok(res, { checkoutUrl, payment: S.payment(payment) }, 201);
}));

module.exports = { router: r, timeline, MEDIA_SELECT, EST_SELECT, INV_SELECT, withMedia };
