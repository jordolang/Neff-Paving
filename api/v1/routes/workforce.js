'use strict';

/**
 * Employee self-service: clock in/out + location tracking, time sheets, schedule, crews,
 * time off, pay stubs, tax/payment prefs, raise requests, contacts, and messaging threads.
 */

const express = require('express');
const H = require('../http');
const S = require('../serialize');
const C = require('../context');
const svc = require('../services');

const { wrap, ok, list, q, one, required, badRequest, notFound, conflict, intParam, ApiError } = H;
const r = express.Router();
r.use(C.authenticate);

const PING_INTERVAL_SECONDS = Number(process.env.TRACKING_PING_SECONDS || 60);
const MAX_POINTS_PER_BATCH = 500;

const openEntry = (userId) => one(
  `SELECT t.*, j.title AS job_title FROM app.time_entries t LEFT JOIN app.jobs j ON j.id = t.job_id
   WHERE t.user_id = $1 AND t.clock_out IS NULL`, [userId],
);

// ── Clock & tracking ─────────────────────────────────────────────────────
r.get('/time/status', C.requirePerm('time.clock'), wrap(async (req, res) => {
  const e = await openEntry(req.auth.user.id);
  ok(res, {
    clockedIn: !!e, entry: e ? S.timeEntry(e) : null,
    trackingRequired: req.auth.isInternal, pingIntervalSeconds: PING_INTERVAL_SECONDS,
  });
}));

r.post('/time/clock-in', C.requirePerm('time.clock'), wrap(async (req, res) => {
  const b = req.body;
  if (req.auth.isInternal && b.trackingConsent !== true) {
    throw badRequest('Location sharing must be accepted to clock in. Tracking stops when you clock out.');
  }
  const lat = H.coord(b.latitude, 'latitude', 90);
  const lng = H.coord(b.longitude, 'longitude', 180);
  let jobId = null;
  if (b.jobId) jobId = (await svc.loadInternalJob(req, intParam(b.jobId, 'jobId'))).id;
  let entry;
  try {
    entry = await one(
      `INSERT INTO app.time_entries (company_id, user_id, job_id, clock_in_lat, clock_in_lng, tracking_consent_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 THEN now() END) RETURNING *`,
      [req.company.id, req.auth.user.id, jobId, lat, lng, b.trackingConsent === true],
    );
  } catch (e) {
    if (e.code === '23505') throw conflict('You are already clocked in');
    throw e;
  }
  if (lat !== null && lng !== null) {
    await q(
      `INSERT INTO app.location_points (time_entry_id, user_id, latitude, longitude, recorded_at) VALUES ($1,$2,$3,$4,now())`,
      [entry.id, req.auth.user.id, lat, lng],
    );
  }
  ok(res, S.timeEntry(await openEntry(req.auth.user.id)), 201);
}));

r.post('/time/clock-out', C.requirePerm('time.clock'), wrap(async (req, res) => {
  const e = await openEntry(req.auth.user.id);
  if (!e) throw new ApiError(409, 'not_clocked_in', 'You are not clocked in');
  const row = await one(
    `UPDATE app.time_entries SET clock_out = now(), clock_out_lat = $1, clock_out_lng = $2,
       notes = COALESCE($3, notes) WHERE id = $4 RETURNING *`,
    [H.coord(req.body.latitude, 'latitude', 90), H.coord(req.body.longitude, 'longitude', 180), req.body.notes ?? null, e.id],
  );
  ok(res, S.timeEntry({ ...row, job_title: e.job_title }));
}));

/**
 * Batch location upload. Points are only accepted for the caller's OPEN shift and only
 * when recorded during it — nothing is ever stored off the clock.
 */
r.post('/time/locations', C.requirePerm('time.clock'), wrap(async (req, res) => {
  const e = await openEntry(req.auth.user.id);
  if (!e) throw new ApiError(409, 'not_clocked_in', 'You are not clocked in; stop location tracking');
  const points = Array.isArray(req.body.points) ? req.body.points.slice(0, MAX_POINTS_PER_BATCH) : [];
  const start = new Date(e.clock_in).getTime() - 5 * 60e3;
  const end = Date.now() + 5 * 60e3;
  const rows = [];
  for (const p of points) {
    const lat = Number(p.latitude); const lng = Number(p.longitude);
    const t = new Date(p.recordedAt || Date.now()).getTime();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    if (!Number.isFinite(t) || t < start || t > end) continue;
    const f = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
    rows.push([lat, lng, f(p.accuracy), f(p.speed), f(p.heading), f(p.batteryLevel), new Date(t).toISOString()]);
  }
  if (rows.length) {
    await q(
      `INSERT INTO app.location_points (time_entry_id, user_id, latitude, longitude, accuracy, speed, heading, battery_level, recorded_at)
       SELECT $1, $2, x.lat, x.lng, x.acc, x.spd, x.hdg, x.bat, x.at
       FROM jsonb_to_recordset($3::jsonb) AS x(lat float8, lng float8, acc real, spd real, hdg real, bat real, at timestamptz)`,
      [e.id, req.auth.user.id, JSON.stringify(rows.map(([lat, lng, acc, spd, hdg, bat, at]) => ({ lat, lng, acc, spd, hdg, bat, at })))],
    );
  }
  ok(res, { accepted: rows.length, rejected: points.length - rows.length });
}));

r.get('/time/entries', C.requirePerm('time.view_own', 'time.clock'), wrap(async (req, res) => {
  const { from, to } = H.dateRange(req.query, 31);
  const rows = await q(
    `SELECT t.*, j.title AS job_title FROM app.time_entries t LEFT JOIN app.jobs j ON j.id = t.job_id
     WHERE t.user_id = $1 AND t.company_id = $2 AND t.clock_in BETWEEN $3 AND $4 ORDER BY t.clock_in DESC`,
    [req.auth.user.id, req.company.id, from, to],
  );
  list(res, rows.map(S.timeEntry));
}));

r.post('/time/entries/:id/submit', C.requirePerm('time.clock'), wrap(async (req, res) => {
  const row = await one(
    `UPDATE app.time_entries SET status = 'submitted' WHERE id = $1 AND user_id = $2
       AND clock_out IS NOT NULL AND status IN ('open','rejected') RETURNING *`,
    [intParam(req.params.id), req.auth.user.id],
  );
  if (!row) throw conflict('Only a completed, unsubmitted shift can be submitted');
  ok(res, S.timeEntry(row));
}));

// ── Schedule & crews ─────────────────────────────────────────────────────
const SCHED_SELECT = `SELECT s.*, j.title AS job_title, j.service_address,
    TRIM(u.first_name || ' ' || u.last_name) AS user_name
  FROM app.schedule_entries s LEFT JOIN app.jobs j ON j.id = s.job_id LEFT JOIN app.users u ON u.id = s.user_id`;

r.get('/schedule', C.requirePerm('schedule.view'), wrap(async (req, res) => {
  const { from, to } = H.dateRange(req.query);
  const rows = await q(
    `${SCHED_SELECT} WHERE s.company_id = $1 AND s.user_id = $2 AND s.ends_at >= $3 AND s.starts_at <= $4 ORDER BY s.starts_at`,
    [req.company.id, req.auth.user.id, from, to],
  );
  list(res, rows.map(S.schedule));
}));

async function crewsWithMembers(companyId, crewRows) {
  const ids = crewRows.map((c) => c.id);
  const members = ids.length ? await q(
    `SELECT cm.crew_id, u.id, u.first_name, u.last_name, u.phone, m.role FROM app.crew_members cm
     JOIN app.users u ON u.id = cm.user_id
     LEFT JOIN app.memberships m ON m.user_id = u.id AND m.company_id = $2
     WHERE cm.crew_id = ANY($1) ORDER BY u.first_name`, [ids, companyId],
  ) : [];
  return crewRows.map((c) => S.crew(c, members.filter((m) => m.crew_id === c.id)));
}
const CREW_SELECT = `SELECT c.*, TRIM(u.first_name || ' ' || u.last_name) AS lead_name
  FROM app.crews c LEFT JOIN app.users u ON u.id = c.lead_id`;

r.get('/crews', C.requirePerm('crews.view', 'crews.manage'), wrap(async (req, res) => {
  const all = req.auth.can('crews.manage') && req.auth.rank >= 60; // office & admins see every crew
  const rows = all
    ? await q(`${CREW_SELECT} WHERE c.company_id = $1 ORDER BY c.name`, [req.company.id])
    : await q(
      `${CREW_SELECT} WHERE c.company_id = $1 AND (c.lead_id = $2 OR c.id IN (SELECT crew_id FROM app.crew_members WHERE user_id = $2)) ORDER BY c.name`,
      [req.company.id, req.auth.user.id],
    );
  list(res, await crewsWithMembers(req.company.id, rows));
}));

/** Crew leads manage the members of crews they lead (admins use /admin/crews). */
r.put('/crews/:id/members', C.requirePerm('crews.manage'), wrap(async (req, res) => {
  const crew = await one(`${CREW_SELECT} WHERE c.id = $1 AND c.company_id = $2`, [intParam(req.params.id), req.company.id]);
  if (!crew) throw notFound('Crew not found');
  if (crew.lead_id !== req.auth.user.id && req.auth.rank < 60) throw H.forbidden('Only this crew\'s lead can change its members');
  const ids = (req.body.memberIds || []).map((x) => intParam(x, 'memberIds'));
  const valid = await q(
    `SELECT m.user_id FROM app.memberships m JOIN app.roles r ON r.key = m.role
     WHERE m.company_id = $1 AND m.user_id = ANY($2) AND r.is_internal`, [req.company.id, ids],
  );
  if (valid.length !== new Set(ids).size) throw badRequest('Crew members must be employees of this company');
  await H.tx(async (c) => {
    await q('DELETE FROM app.crew_members WHERE crew_id = $1', [crew.id], c);
    if (ids.length) await q('INSERT INTO app.crew_members (crew_id, user_id) SELECT $1, unnest($2::int[]) ON CONFLICT DO NOTHING', [crew.id, ids], c);
  });
  ok(res, (await crewsWithMembers(req.company.id, [crew]))[0]);
}));

// ── Time off ─────────────────────────────────────────────────────────────
const TIMEOFF_SELECT = `SELECT t.*, TRIM(u.first_name || ' ' || u.last_name) AS user_name,
    TRIM(rv.first_name || ' ' || rv.last_name) AS reviewer_name
  FROM app.time_off_requests t JOIN app.users u ON u.id = t.user_id LEFT JOIN app.users rv ON rv.id = t.reviewed_by`;

r.get('/timeoff', C.requirePerm('timeoff.request'), wrap(async (req, res) => {
  const rows = await q(`${TIMEOFF_SELECT} WHERE t.company_id = $1 AND t.user_id = $2 ORDER BY t.start_date DESC`, [req.company.id, req.auth.user.id]);
  list(res, rows.map(S.timeOff));
}));

r.post('/timeoff', C.requirePerm('timeoff.request'), wrap(async (req, res) => {
  required(req.body, ['startDate', 'endDate', 'type']);
  H.oneOf(req.body.type, ['vacation', 'sick', 'personal', 'unpaid'], 'type');
  if (req.body.endDate < req.body.startDate) throw badRequest('End date must be on or after the start date');
  const row = await one(
    `INSERT INTO app.time_off_requests (company_id, user_id, start_date, end_date, type, reason) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.company.id, req.auth.user.id, req.body.startDate, req.body.endDate, req.body.type, req.body.reason || ''],
  );
  const approvers = await svc.usersWithRoles(req.company.id, ['super_admin', 'admin', 'office_staff']);
  await svc.notify(req.company.id, approvers, {
    type: 'timeoff', title: 'Time off request',
    body: `${S.fullName(req.auth.user.first_name, req.auth.user.last_name)}: ${req.body.startDate} → ${req.body.endDate}`,
    data: { timeOffId: row.id },
  });
  ok(res, S.timeOff(await one(`${TIMEOFF_SELECT} WHERE t.id = $1`, [row.id])), 201);
}));

// ── Pay ──────────────────────────────────────────────────────────────────
r.get('/paystubs', C.requirePerm('paystubs.view_own'), wrap(async (req, res) => {
  const rows = await q('SELECT * FROM app.paystubs WHERE user_id = $1 AND company_id = $2 ORDER BY pay_date DESC', [req.auth.user.id, req.company.id]);
  list(res, rows.map(S.paystub));
}));

r.get('/tax-prefs', C.requirePerm('taxprefs.edit'), wrap(async (req, res) => {
  ok(res, S.taxPrefs(await one('SELECT * FROM app.tax_prefs WHERE user_id = $1', [req.auth.user.id])));
}));

r.put('/tax-prefs', C.requirePerm('taxprefs.edit'), wrap(async (req, res) => {
  const b = req.body;
  const cur = (await one('SELECT * FROM app.tax_prefs WHERE user_id = $1', [req.auth.user.id])) || {};
  H.oneOf(b.filingStatus, ['single', 'married', 'head'], 'filingStatus');
  H.oneOf(b.payMethod, ['direct_deposit', 'check'], 'payMethod');
  const digits = (v, field) => {
    const d = String(v).replace(/\D/g, '');
    if (d.length < 4 || d.length > 17) throw badRequest(`${field} looks invalid`);
    return d;
  };
  let accountEnc = cur.account_enc || null; let account4 = cur.account_last4 || null;
  let routingEnc = cur.routing_enc || null; let routing4 = cur.routing_last4 || null;
  if (b.accountNumber) { const d = digits(b.accountNumber, 'accountNumber'); accountEnc = svc.encrypt(d); account4 = d.slice(-4); }
  if (b.routingNumber) {
    const d = digits(b.routingNumber, 'routingNumber');
    if (d.length !== 9) throw badRequest('routingNumber must be 9 digits');
    routingEnc = svc.encrypt(d); routing4 = d.slice(-4);
  }
  const payMethod = b.payMethod ?? cur.pay_method ?? 'check';
  if (payMethod === 'direct_deposit' && (!accountEnc || !routingEnc)) throw badRequest('Direct deposit needs an account and routing number');
  const allowances = b.allowances ?? cur.allowances ?? 0;
  if (!Number.isInteger(Number(allowances)) || Number(allowances) < 0) throw badRequest('allowances must be a whole number');
  const row = await one(
    `INSERT INTO app.tax_prefs (user_id, filing_status, allowances, extra_withholding, pay_method, bank_name,
       account_enc, routing_enc, account_last4, routing_last4, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
     ON CONFLICT (user_id) DO UPDATE SET filing_status = EXCLUDED.filing_status, allowances = EXCLUDED.allowances,
       extra_withholding = EXCLUDED.extra_withholding, pay_method = EXCLUDED.pay_method, bank_name = EXCLUDED.bank_name,
       account_enc = EXCLUDED.account_enc, routing_enc = EXCLUDED.routing_enc, account_last4 = EXCLUDED.account_last4,
       routing_last4 = EXCLUDED.routing_last4, updated_at = now()
     RETURNING *`,
    [req.auth.user.id, b.filingStatus ?? cur.filing_status ?? 'single', Number(allowances),
      H.decimal(b.extraWithholding ?? cur.extra_withholding ?? 0, 'extraWithholding'), payMethod,
      b.bankName ?? cur.bank_name ?? '', accountEnc, routingEnc, account4, routing4],
  );
  await svc.audit(req, 'tax_prefs.update', 'user', req.auth.user.id);
  ok(res, S.taxPrefs(row));
}));

// ── Raise / position change requests ─────────────────────────────────────
const RAISE_SELECT = `SELECT r.*, TRIM(u.first_name || ' ' || u.last_name) AS user_name
  FROM app.raise_requests r JOIN app.users u ON u.id = r.user_id`;

r.get('/raise-requests', C.requirePerm('raise.request'), wrap(async (req, res) => {
  const rows = await q(`${RAISE_SELECT} WHERE r.company_id = $1 AND r.user_id = $2 ORDER BY r.created_at DESC`, [req.company.id, req.auth.user.id]);
  list(res, rows.map(S.raise));
}));

r.post('/raise-requests', C.requirePerm('raise.request'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['kind', 'justification']);
  H.oneOf(b.kind, ['raise', 'position_change'], 'kind');
  if (b.kind === 'raise' && !b.requestedRate) throw badRequest('requestedRate is required for a raise');
  if (b.kind === 'position_change') {
    if (!b.requestedPosition) throw badRequest('requestedPosition is required for a position change');
    if (['super_admin', 'admin', 'customer'].includes(b.requestedPosition)) throw badRequest('That position cannot be requested');
    H.oneOf(b.requestedPosition, ['office_staff', 'estimator', 'crew_lead', 'mechanic', 'employee'], 'requestedPosition');
  }
  const row = await one(
    `INSERT INTO app.raise_requests (company_id, user_id, kind, current_rate, requested_rate, requested_position, justification)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.company.id, req.auth.user.id, b.kind, req.auth.user.pay_rate, H.decimal(b.requestedRate, 'requestedRate'),
      b.kind === 'position_change' ? b.requestedPosition : null, b.justification],
  );
  await svc.notify(req.company.id, await svc.adminIds(req.company.id), {
    type: 'raise', title: b.kind === 'raise' ? 'Raise request' : 'Position change request',
    body: S.fullName(req.auth.user.first_name, req.auth.user.last_name), data: { raiseRequestId: row.id },
  });
  ok(res, S.raise(await one(`${RAISE_SELECT} WHERE r.id = $1`, [row.id])), 201);
}));

// ── Directory ────────────────────────────────────────────────────────────
r.get('/contacts', C.requirePerm('contacts.view'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT u.id, u.first_name, u.last_name, u.phone, u.email, m.role, r.rank FROM app.memberships m
     JOIN app.users u ON u.id = m.user_id JOIN app.roles r ON r.key = m.role
     WHERE m.company_id = $1 AND r.is_internal AND u.is_active AND m.closed_at IS NULL
     ORDER BY r.rank DESC, u.first_name`, [req.company.id],
  );
  list(res, rows.map((u) => ({ id: u.id, name: S.fullName(u.first_name, u.last_name), role: u.role, phone: u.phone || '', email: u.email })));
}));

// ── Messaging ────────────────────────────────────────────────────────────
r.get('/threads', C.requirePerm('messages.send'), wrap(async (req, res) => {
  const rows = await q(
    `SELECT t.*, tp.last_read_at,
       (SELECT COUNT(*)::int FROM app.messages m WHERE m.thread_id = t.id AND m.sender_id IS DISTINCT FROM $1
          AND (tp.last_read_at IS NULL OR m.created_at > tp.last_read_at)) AS unread
     FROM app.threads t JOIN app.thread_participants tp ON tp.thread_id = t.id AND tp.user_id = $1
     WHERE t.company_id = $2 ORDER BY t.updated_at DESC`, [req.auth.user.id, req.company.id],
  );
  const ids = rows.map((t) => t.id);
  const parts = ids.length ? await q(
    `SELECT tp.thread_id, u.id, u.first_name, u.last_name, m.role FROM app.thread_participants tp
     JOIN app.users u ON u.id = tp.user_id
     LEFT JOIN app.memberships m ON m.user_id = u.id AND m.company_id = $2 WHERE tp.thread_id = ANY($1)`, [ids, req.company.id],
  ) : [];
  const last = ids.length ? await q(
    `SELECT DISTINCT ON (m.thread_id) m.*, TRIM(u.first_name || ' ' || u.last_name) AS sender_name
     FROM app.messages m LEFT JOIN app.users u ON u.id = m.sender_id WHERE m.thread_id = ANY($1)
     ORDER BY m.thread_id, m.created_at DESC`, [ids],
  ) : [];
  list(res, rows.map((t) => {
    const lm = last.find((m) => m.thread_id === t.id);
    return {
      id: t.id, subject: t.subject, jobId: t.job_id,
      participants: parts.filter((p) => p.thread_id === t.id).map((p) => ({ id: p.id, name: S.fullName(p.first_name, p.last_name), role: p.role })),
      lastMessage: lm ? S.message(lm) : null, unreadCount: t.unread, updatedAt: S.iso(t.updated_at),
    };
  }));
}));

r.post('/threads', C.requirePerm('messages.send'), wrap(async (req, res) => {
  const b = req.body;
  required(b, ['subject', 'body']);
  let recipients = [];
  if (b.toUserId) {
    const target = await one(
      `SELECT m.user_id, r.is_internal FROM app.memberships m JOIN app.roles r ON r.key = m.role
       WHERE m.company_id = $1 AND m.user_id = $2`, [req.company.id, intParam(b.toUserId, 'toUserId')],
    );
    // Customers may only message staff; staff can message anyone in the company.
    if (!target || (!req.auth.isInternal && !target.is_internal)) throw notFound('Recipient not found');
    recipients = [target.user_id];
  } else {
    const role = b.toRole || (req.auth.isInternal ? 'admin' : 'office_staff');
    H.oneOf(role, ['admin', 'office_staff'], 'toRole');
    recipients = await svc.usersWithRoles(req.company.id, role === 'admin' ? ['super_admin', 'admin'] : ['office_staff', 'admin', 'super_admin']);
  }
  let jobId = null;
  if (b.jobId) {
    const j = req.auth.isInternal ? await svc.loadInternalJob(req, intParam(b.jobId, 'jobId')) : await svc.loadCustomerJob(req, intParam(b.jobId, 'jobId'));
    jobId = j.id;
  }
  const threadId = await H.tx(async (c) => {
    const t = await one('INSERT INTO app.threads (company_id, subject, job_id, created_by) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.company.id, String(b.subject).slice(0, 200), jobId, req.auth.user.id], c);
    await q(`INSERT INTO app.thread_participants (thread_id, user_id, last_read_at)
             SELECT $1, uid, CASE WHEN uid = $3 THEN now() END FROM unnest($2::int[]) uid ON CONFLICT DO NOTHING`,
    [t.id, [...new Set([req.auth.user.id, ...recipients])], req.auth.user.id], c);
    await q('INSERT INTO app.messages (thread_id, sender_id, body) VALUES ($1,$2,$3)', [t.id, req.auth.user.id, b.body], c);
    return t.id;
  });
  await svc.notify(req.company.id, recipients.filter((id) => id !== req.auth.user.id), {
    type: 'message', title: `Message from ${S.fullName(req.auth.user.first_name, req.auth.user.last_name)}`, body: b.subject, data: { threadId },
  });
  ok(res, { id: threadId, subject: b.subject, jobId }, 201);
}));

async function participant(req) {
  const id = intParam(req.params.id);
  const p = await one(
    `SELECT t.* FROM app.threads t JOIN app.thread_participants tp ON tp.thread_id = t.id
     WHERE t.id = $1 AND tp.user_id = $2 AND t.company_id = $3`, [id, req.auth.user.id, req.company.id],
  );
  if (!p) throw notFound('Conversation not found');
  return p;
}

r.get('/threads/:id/messages', C.requirePerm('messages.send'), wrap(async (req, res) => {
  const t = await participant(req);
  const rows = await q(
    `SELECT m.*, TRIM(u.first_name || ' ' || u.last_name) AS sender_name, mem.role AS sender_role
     FROM app.messages m LEFT JOIN app.users u ON u.id = m.sender_id
     LEFT JOIN app.memberships mem ON mem.user_id = m.sender_id AND mem.company_id = $2
     WHERE m.thread_id = $1 ORDER BY m.created_at`, [t.id, req.company.id],
  );
  await q('UPDATE app.thread_participants SET last_read_at = now() WHERE thread_id = $1 AND user_id = $2', [t.id, req.auth.user.id]);
  list(res, rows.map(S.message));
}));

r.post('/threads/:id/messages', C.requirePerm('messages.send'), wrap(async (req, res) => {
  const t = await participant(req);
  required(req.body, ['body']);
  const m = await one('INSERT INTO app.messages (thread_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *', [t.id, req.auth.user.id, req.body.body]);
  await q('UPDATE app.threads SET updated_at = now() WHERE id = $1', [t.id]);
  await q('UPDATE app.thread_participants SET last_read_at = now() WHERE thread_id = $1 AND user_id = $2', [t.id, req.auth.user.id]);
  const others = (await q('SELECT user_id FROM app.thread_participants WHERE thread_id = $1 AND user_id <> $2', [t.id, req.auth.user.id])).map((x) => x.user_id);
  await svc.notify(req.company.id, others, {
    type: 'message', title: S.fullName(req.auth.user.first_name, req.auth.user.last_name), body: String(req.body.body).slice(0, 140), data: { threadId: t.id },
  });
  ok(res, S.message({ ...m, sender_name: S.fullName(req.auth.user.first_name, req.auth.user.last_name), sender_role: req.auth.role }), 201);
}));

module.exports = { router: r, SCHED_SELECT, CREW_SELECT, TIMEOFF_SELECT, RAISE_SELECT, crewsWithMembers };
