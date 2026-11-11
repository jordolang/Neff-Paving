'use strict';

/**
 * End-to-end tests for the mobile API (/api/v1) against a real PostgreSQL database.
 * Needs a disposable database: TEST_DB_NAME (default neff_test) on DB_HOST/DB_USER/DB_PASSWORD.
 * The `app` schema in that database is dropped and recreated.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'neff_test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATA_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.SUPER_ADMIN_EMAIL = 'owner@example.test';
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'neff-uploads-'));
process.env.MOBILE_RATE_LIMIT = '100000';
process.env.AUTH_RATE_LIMIT = '100000';
delete process.env.STRIPE_SECRET_KEY;
delete process.env.PUSH_WEBHOOK_URL;

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const svc = require('../v1/services');
const { init } = require('../v1');
const app = require('../server');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const api = (company = 'neff') => {
  const wrap = (method) => (url, token) => {
    const r = request(app)[method](`/api/v1${url}`).set('X-Company', company);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };
  return { get: wrap('get'), post: wrap('post'), put: wrap('put'), del: wrap('delete') };
};
const neff = api('neff');

const S = {}; // shared state across ordered tests

async function signup(email, firstName = 'Test') {
  const res = await neff.post('/auth/signup').send({ email, password: 'password123', firstName, lastName: 'User', phone: '740-555-0100' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data;
}

before(async () => {
  await pool.query('DROP SCHEMA IF EXISTS app CASCADE');
  await init();
  await pool.query('UPDATE app.users SET password_hash = $1, first_name = $2, last_name = $3 WHERE email = $4',
    [await bcrypt.hash('ownerpass1', 4), 'Owner', 'Neff', 'owner@example.test']);
});

after(async () => { await pool.end(); });

test('requires a known X-Company header', async () => {
  const res = await request(app).get('/api/v1/company');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'bad_request');
  const ok = await neff.get('/company');
  assert.equal(ok.body.data.name, 'Neff Paving');
});

test('sign up creates a customer and returns tokens', async () => {
  const d = await signup('jo@example.test', 'Jo');
  assert.ok(d.accessToken && d.refreshToken);
  assert.equal(d.user.role, 'customer');
  assert.equal(d.user.isInternal, false);
  assert.ok(d.user.permissions.includes('portal.use'));
  assert.ok(!d.user.permissions.includes('time.clock'));
  S.customer = d;
  const dup = await neff.post('/auth/signup').send({ email: 'JO@example.test', password: 'password123', firstName: 'x', lastName: 'y' });
  assert.equal(dup.status, 409);
});

test('login, /me and refresh rotation', async () => {
  const bad = await neff.post('/auth/login').send({ email: 'jo@example.test', password: 'nope' });
  assert.equal(bad.status, 401);
  const res = await neff.post('/auth/login').send({ email: 'jo@example.test', password: 'password123' });
  assert.equal(res.status, 200);
  const me = await neff.get('/me', res.body.data.accessToken);
  assert.equal(me.body.data.email, 'jo@example.test');
  const r1 = await neff.post('/auth/refresh').send({ refreshToken: res.body.data.refreshToken });
  assert.equal(r1.status, 200);
  const reuse = await neff.post('/auth/refresh').send({ refreshToken: res.body.data.refreshToken });
  assert.equal(reuse.status, 401, 'a rotated refresh token cannot be reused');
  const noAuth = await neff.get('/me');
  assert.equal(noAuth.status, 401);
});

test('super admin is bootstrapped and controls role elevation', async () => {
  const owner = await neff.post('/auth/login').send({ email: 'owner@example.test', password: 'ownerpass1' });
  assert.equal(owner.body.data.user.role, 'super_admin');
  S.owner = owner.body.data.accessToken;

  S.clint = await signup('clint@example.test', 'Clint');
  S.lead = await signup('lead@example.test', 'Lena');
  S.worker = await signup('worker@example.test', 'Wes');
  S.estimator = await signup('est@example.test', 'Erin');

  const up = await neff.put(`/admin/users/${S.clint.user.id}/role`, S.owner).send({ role: 'admin' });
  assert.equal(up.status, 200, JSON.stringify(up.body));
  const clint = await neff.post('/auth/login').send({ email: 'clint@example.test', password: 'password123' });
  S.admin = clint.body.data.accessToken;
  assert.ok(clint.body.data.user.permissions.includes('tracking.view_live'));

  // Admin may elevate customers to staff roles…
  for (const [u, role] of [[S.lead, 'crew_lead'], [S.worker, 'employee'], [S.estimator, 'estimator']]) {
    const r = await neff.put(`/admin/users/${u.user.id}/role`, S.admin).send({ role, payRate: '20.00' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  // …but not grant admin, touch the super admin, or change their own role.
  assert.equal((await neff.put(`/admin/users/${S.worker.user.id}/role`, S.admin).send({ role: 'admin' })).status, 403);
  const owner2 = await neff.get('/me', S.owner);
  assert.equal((await neff.put(`/admin/users/${owner2.body.data.id}/role`, S.admin).send({ role: 'employee' })).status, 403);
  assert.equal((await neff.put(`/admin/users/${S.clint.user.id}/role`, S.admin).send({ role: 'employee' })).status, 403);
  // Customers can't use admin endpoints at all.
  assert.equal((await neff.get('/admin/users', S.customer.accessToken)).status, 403);
  // Super admin role permissions are immutable.
  assert.equal((await neff.put('/admin/roles/super_admin', S.owner).send({ permissions: [] })).status, 403);

  for (const k of ['lead', 'worker', 'estimator']) {
    const email = { lead: 'lead@example.test', worker: 'worker@example.test', estimator: 'est@example.test' }[k];
    S[`${k}Token`] = (await neff.post('/auth/login').send({ email, password: 'password123' })).body.data.accessToken;
  }
});

test('crews, jobs and dispatch', async () => {
  const crew = await neff.post('/admin/crews', S.admin).send({ name: 'Crew A', leadId: S.lead.user.id, memberIds: [S.worker.user.id] });
  assert.equal(crew.status, 201, JSON.stringify(crew.body));
  assert.equal(crew.body.data.members.length, 1);
  S.crewId = crew.body.data.id;

  const job = await neff.post('/jobs', S.admin).send({
    title: 'Driveway reseal', description: 'Seal + crack fill', customerId: S.customer.user.id,
    serviceAddress: { line1: '1 Main St', city: 'Zanesville', state: 'OH', zip: '43701' }, latitude: 39.94, longitude: -82.01,
  });
  assert.equal(job.status, 201, JSON.stringify(job.body));
  assert.equal(job.body.data.customer.name, 'Jo User');
  S.jobId = job.body.data.id;

  // Crew lead can't see it until dispatched.
  assert.equal((await neff.get(`/jobs/${S.jobId}`, S.leadToken)).status, 404);
  const start = new Date(Date.now() + 864e5).toISOString();
  const end = new Date(Date.now() + 864e5 + 8 * 36e5).toISOString();
  const d = await neff.post('/admin/dispatch', S.admin).send({ jobId: S.jobId, crewId: S.crewId, start, end });
  assert.equal(d.status, 201, JSON.stringify(d.body));
  assert.equal(d.body.data.length, 2); // lead + member
  const seen = await neff.get('/jobs?mine=1', S.leadToken);
  assert.deepEqual(seen.body.data.map((j) => j.id), [S.jobId]);
  assert.equal(seen.body.data[0].status, 'scheduled');
  const sched = await neff.get('/schedule', S.workerToken);
  assert.equal(sched.body.data[0].jobId, S.jobId);

  // Crew lead manages members of their own crew.
  const m = await request(app).put(`/api/v1/crews/${S.crewId}/members`).set('X-Company', 'neff').set('Authorization', `Bearer ${S.leadToken}`).send({ memberIds: [S.worker.user.id] });
  assert.equal(m.status, 200, JSON.stringify(m.body));
});

test('tenant isolation: another company cannot see the job', async () => {
  const austin = api('austin');
  const r = await austin.get(`/jobs/${S.jobId}`, S.admin);
  // Clint is only an admin at Neff (customer elsewhere), so this is forbidden or not found.
  assert.ok([403, 404].includes(r.status));
  const owner = await austin.get(`/jobs/${S.jobId}`, S.owner);
  assert.equal(owner.status, 404);
});

test('clock in requires consent; locations only accepted while clocked in', async () => {
  const noConsent = await neff.post('/time/clock-in', S.workerToken).send({ latitude: 39.9, longitude: -82 });
  assert.equal(noConsent.status, 400);
  const ci = await neff.post('/time/clock-in', S.workerToken).send({ latitude: 39.9, longitude: -82, jobId: S.jobId, trackingConsent: true });
  assert.equal(ci.status, 201, JSON.stringify(ci.body));
  assert.equal((await neff.post('/time/clock-in', S.workerToken).send({ trackingConsent: true })).status, 409);

  const status = await neff.get('/time/status', S.workerToken);
  assert.equal(status.body.data.clockedIn, true);
  assert.equal(status.body.data.trackingRequired, true);

  const now = Date.now();
  const pts = await neff.post('/time/locations', S.workerToken).send({ points: [
    { latitude: 39.95, longitude: -82.02, accuracy: 5, speed: 1, heading: 90, batteryLevel: 0.8, recordedAt: new Date(now).toISOString() },
    { latitude: 999, longitude: 0, recordedAt: new Date(now).toISOString() },
    { latitude: 39.9, longitude: -82, recordedAt: new Date(now - 864e5).toISOString() }, // before the shift
  ] });
  assert.deepEqual(pts.body.data, { accepted: 1, rejected: 2 });

  const live = await neff.get('/admin/tracking/live', S.admin);
  assert.equal(live.status, 200);
  const me = live.body.data.find((x) => x.userId === S.worker.user.id);
  assert.equal(me.latitude, 39.95);
  assert.equal(me.currentJob.id, S.jobId);
  assert.equal((await neff.get('/admin/tracking/live', S.leadToken)).status, 403, 'crew leads cannot see live locations');
  const trail = await neff.get(`/admin/tracking/${S.worker.user.id}/trail`, S.admin);
  assert.ok(trail.body.data.length >= 1);

  const co = await neff.post('/time/clock-out', S.workerToken).send({ latitude: 39.9, longitude: -82 });
  assert.equal(co.status, 200);
  assert.ok(co.body.data.clockOut);
  S.timeEntryId = co.body.data.id;
  const after = await neff.post('/time/locations', S.workerToken).send({ points: [{ latitude: 1, longitude: 1 }] });
  assert.equal(after.status, 409);
  assert.equal(after.body.error.code, 'not_clocked_in');
  const live2 = await neff.get('/admin/tracking/live', S.admin);
  assert.equal(live2.body.data.length, 0);
});

test('field updates, media, logs and job completion notifications', async () => {
  const up = await neff.post(`/jobs/${S.jobId}/status`, S.leadToken).send({ status: 'in_progress', message: 'Crack fill done', visibleToCustomer: true });
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const media = await neff.post(`/jobs/${S.jobId}/media`, S.workerToken).field('caption', 'Before').field('latitude', '39.9').field('longitude', '-82').attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
  assert.equal(media.status, 201, JSON.stringify(media.body));
  assert.match(media.body.data.url, /^http:\/\/127\.0\.0\.1:\d+\/uploads\//);
  const fetched = await request(app).get(new URL(media.body.data.url).pathname);
  assert.equal(fetched.status, 200);

  assert.equal((await neff.post(`/jobs/${S.jobId}/logs`, S.workerToken).send({ notes: 'x' })).status, 403, 'employees read logs only');
  const log = await neff.post(`/jobs/${S.jobId}/logs`, S.leadToken).send({ notes: 'Applied sealer', hours: 6, materials: '30 gal', weather: 'Sunny' });
  assert.equal(log.status, 201);
  assert.equal((await neff.get(`/jobs/${S.jobId}/logs`, S.workerToken)).body.data.length, 1);

  const internal = await neff.post(`/jobs/${S.jobId}/status`, S.leadToken).send({ message: 'Internal note', visibleToCustomer: false });
  assert.equal(internal.status, 201);
  const done = await neff.post(`/jobs/${S.jobId}/status`, S.leadToken).send({ status: 'completed', message: 'All done!' });
  assert.equal(done.status, 201);

  const custNotes = await neff.get('/notifications', S.customer.accessToken);
  assert.ok(custNotes.body.data.some((n) => n.type === 'job_completed' && n.data.jobId === S.jobId));
  const adminNotes = await neff.get('/notifications', S.admin);
  assert.ok(adminNotes.body.data.some((n) => n.type === 'job_completed'));
  const ownerNotes = await neff.get('/notifications', S.owner);
  assert.ok(ownerNotes.body.data.some((n) => n.type === 'job_completed'));
});

test('customer portal: jobs, timeline, photos, sharing, reviews, gallery', async () => {
  const t = S.customer.accessToken;
  const jobs = await neff.get('/portal/jobs', t);
  assert.equal(jobs.body.data.length, 1);
  assert.equal(jobs.body.data[0].status, 'completed');
  const tl = await neff.get(`/portal/jobs/${S.jobId}/timeline`, t);
  assert.ok(!tl.body.data.some((u) => u.message === 'Internal note'), 'internal updates are hidden from customers');
  assert.ok(tl.body.data.some((u) => u.status === 'completed'));
  assert.equal((await neff.get(`/portal/jobs/${S.jobId}/media`, t)).body.data.length, 1);

  const share = await neff.post(`/portal/jobs/${S.jobId}/share`, t).send({ share: true });
  assert.equal(share.body.data.sharedPublicly, true);
  const rv = await neff.post(`/portal/jobs/${S.jobId}/review`, t).send({ rating: 5, comment: 'Great crew' });
  assert.equal(rv.status, 201);
  assert.equal(rv.body.data.customer.name, 'Jo U.');
  const gallery = await neff.get('/gallery', S.workerToken);
  assert.equal(gallery.body.data.length, 1);
  assert.equal(gallery.body.data[0].review.rating, 5);
  assert.equal((await neff.get('/reviews', t)).body.data.length, 1);

  // Someone else's job is invisible.
  const other = await signup('other@example.test', 'Ollie');
  assert.equal((await neff.get(`/portal/jobs/${S.jobId}`, other.accessToken)).status, 404);
  assert.equal((await neff.get(`/jobs/${S.jobId}`, other.accessToken)).status, 403);
});

test('estimates: request → price → send → accept', async () => {
  const t = S.customer.accessToken;
  const req1 = await neff.post('/portal/estimates', t).send({ serviceType: 'Sealcoating', description: 'Parking lot', squareFeet: 5000, serviceAddress: { line1: '9 Elm', city: 'Zanesville', state: 'OH', zip: '43701' } });
  assert.equal(req1.status, 201, JSON.stringify(req1.body));
  S.estimateId = req1.body.data.id;
  const photo = await neff.post(`/portal/estimates/${S.estimateId}/photos`, t).attach('file', PNG, { filename: 'lot.png', contentType: 'image/png' });
  assert.equal(photo.status, 201);
  assert.equal((await neff.post(`/portal/estimates/${S.estimateId}/accept`, t)).status, 409, 'cannot accept before it is sent');

  const list = await neff.get('/estimates?status=requested', S.estimatorToken);
  assert.ok(list.body.data.some((e) => e.id === S.estimateId));
  const priced = await neff.put(`/estimates/${S.estimateId}`, S.estimatorToken).send({ lineItems: [{ description: 'Sealcoat', quantity: 5000, unitPrice: '0.25' }, { description: 'Striping', quantity: 1, unitPrice: '150' }] });
  assert.equal(priced.status, 200, JSON.stringify(priced.body));
  assert.equal(priced.body.data.total, '1400.00');
  assert.equal((await neff.post(`/estimates/${S.estimateId}/send`, S.estimatorToken)).status, 200);
  const acc = await neff.post(`/portal/estimates/${S.estimateId}/accept`, t);
  assert.equal(acc.status, 200);
  assert.equal(acc.body.data.status, 'accepted');
  assert.equal(acc.body.data.media.length, 1);
});

test('invoices and payments', async () => {
  const inv = await neff.post('/admin/invoices', S.admin).send({ customerId: S.customer.user.id, jobId: S.jobId, lineItems: [{ description: 'Reseal', quantity: 1, unitPrice: '1000' }], tax: '72.50' });
  assert.equal(inv.status, 201, JSON.stringify(inv.body));
  assert.match(inv.body.data.number, /^NP-\d{4}-\d{4}$/);
  assert.equal(inv.body.data.total, '1072.50');
  const t = S.customer.accessToken;
  assert.equal((await neff.get('/portal/invoices', t)).body.data.length, 0, 'drafts are hidden');
  await neff.post(`/admin/invoices/${inv.body.data.id}/send`, S.admin);
  assert.equal((await neff.get('/portal/invoices', t)).body.data[0].balance, '1072.50');

  const pay = await neff.post(`/portal/invoices/${inv.body.data.id}/pay`, t).send({ amount: '500' });
  assert.equal(pay.status, 201);
  assert.equal(pay.body.data.checkoutUrl, null); // no Stripe key in tests
  assert.equal(pay.body.data.payment.status, 'pending');

  const rec = await neff.post('/admin/payments', S.admin).send({ invoiceId: inv.body.data.id, amount: '1072.50', method: 'check' });
  assert.equal(rec.status, 201);
  const after = await neff.get('/portal/invoices', t);
  assert.equal(after.body.data[0].status, 'paid');
  assert.equal(after.body.data[0].balance, '0.00');
});

test('employee self-service: tax prefs, time off, raises, approvals, payroll', async () => {
  const w = S.workerToken;
  const bad = await neff.put('/tax-prefs', w).send({ payMethod: 'direct_deposit' });
  assert.equal(bad.status, 400);
  const tp = await neff.put('/tax-prefs', w).send({ filingStatus: 'married', allowances: 2, payMethod: 'direct_deposit', bankName: 'Park National', accountNumber: '123456789', routingNumber: '044000037' });
  assert.equal(tp.status, 200, JSON.stringify(tp.body));
  assert.equal(tp.body.data.accountLast4, '6789');
  assert.ok(!JSON.stringify(tp.body).includes('123456789'));
  const raw = await pool.query('SELECT account_enc FROM app.tax_prefs');
  assert.ok(raw.rows[0].account_enc.startsWith('v1:') && !raw.rows[0].account_enc.includes('123456789'));
  assert.equal(svc.decrypt(raw.rows[0].account_enc), '123456789');

  const to = await neff.post('/timeoff', w).send({ startDate: '2026-12-24', endDate: '2026-12-26', type: 'vacation', reason: 'Holidays' });
  assert.equal(to.status, 201);
  assert.equal((await neff.post(`/admin/timeoff/${to.body.data.id}/approve`, S.admin)).body.data.status, 'approved');

  const rr = await neff.post('/raise-requests', w).send({ kind: 'position_change', requestedPosition: 'crew_lead', justification: '2 years' });
  assert.equal(rr.status, 201);
  assert.equal((await neff.post('/raise-requests', w).send({ kind: 'position_change', requestedPosition: 'admin', justification: 'x' })).status, 400);

  assert.equal((await neff.post(`/time/entries/${S.timeEntryId}/submit`, w)).status, 200);
  assert.equal((await neff.post(`/admin/time/${S.timeEntryId}/approve`, S.admin)).status, 200);
  const today = new Date().toISOString().slice(0, 10);
  const run = await neff.post('/admin/payroll/runs', S.admin).send({ periodStart: '2026-01-01', periodEnd: today > '2026-01-01' ? today : '2026-12-31' });
  assert.equal(run.status, 201, JSON.stringify(run.body));
  assert.equal(run.body.data.stubCount, 1);
  const stubs = await neff.get('/paystubs', w);
  assert.equal(stubs.body.data.length, 1);
  assert.equal((await neff.post(`/admin/time/${S.timeEntryId}/reject`, S.admin)).status, 409, 'paid shifts are locked');
});

test('messaging: customer → office, employee → owners', async () => {
  const th = await neff.post('/threads', S.customer.accessToken).send({ subject: 'Question', body: 'When do you start?', jobId: S.jobId });
  assert.equal(th.status, 201, JSON.stringify(th.body));
  const adminThreads = await neff.get('/threads', S.admin);
  assert.equal(adminThreads.body.data[0].unreadCount, 1);
  const reply = await neff.post(`/threads/${th.body.data.id}/messages`, S.admin).send({ body: 'Monday!' });
  assert.equal(reply.status, 201);
  const msgs = await neff.get(`/threads/${th.body.data.id}/messages`, S.customer.accessToken);
  assert.deepEqual(msgs.body.data.map((m) => m.body), ['When do you start?', 'Monday!']);
  assert.equal((await neff.get(`/threads/${th.body.data.id}/messages`, S.workerToken)).status, 404);
  const emp = await neff.post('/threads', S.workerToken).send({ subject: 'Truck', body: 'Brakes squeal', toRole: 'admin' });
  assert.equal(emp.status, 201);
});

test('Google sign-in creates or links an account', async () => {
  svc.setGoogleVerifier(async (tok) => {
    if (tok !== 'good') throw new Error('bad');
    return { sub: 'g-123', email: 'gina@example.test', email_verified: true, given_name: 'Gina', family_name: 'Gee' };
  });
  assert.equal((await neff.post('/auth/google').send({ idToken: 'bad' })).status, 401);
  const g = await neff.post('/auth/google').send({ idToken: 'good' });
  assert.equal(g.status, 200, JSON.stringify(g.body));
  assert.equal(g.body.data.user.firstName, 'Gina');
  assert.equal(g.body.data.user.role, 'customer');
  const again = await neff.post('/auth/google').send({ idToken: 'good' });
  assert.equal(again.body.data.user.id, g.body.data.user.id);
});

test('closing a customer account blocks access', async () => {
  const c = await signup('closeme@example.test', 'Cal');
  const r = await neff.post(`/admin/accounts/${c.user.id}/close`, S.admin).send({ reason: 'moved' });
  assert.equal(r.status, 200);
  assert.equal((await neff.get('/me', c.accessToken)).status, 403);
});

test('admin dashboard and back office', async () => {
  const d = await neff.get('/admin/dashboard', S.admin);
  assert.equal(d.status, 200);
  assert.equal(d.body.data.revenueMtd, '1072.50');
  const s = await neff.post('/admin/suppliers', S.admin).send({ name: 'Shelly Materials', materials: 'Asphalt' });
  assert.equal(s.status, 201);
  const e = await neff.post('/admin/equipment', S.admin).send({ name: 'Paver 1', kind: 'Paver' });
  const m = await neff.post(`/admin/equipment/${e.body.data.id}/maintenance`, S.admin).send({ description: 'Oil change', cost: '120', nextDueAt: '2027-03-01' });
  assert.equal(m.status, 201);
  assert.equal((await neff.get('/admin/equipment', S.admin)).body.data[0].nextDueAt, '2027-03-01');
  const jp = await neff.post('/admin/job-postings', S.admin).send({ title: 'CDL Driver', payRange: '$25-30/hr' });
  assert.equal(jp.body.data.isOpen, true);
  const roles = await neff.get('/admin/roles', S.admin);
  assert.equal(roles.body.data[0].key, 'super_admin');
  const edit = await neff.put('/admin/roles/employee', S.admin).send({ permissions: ['time.clock', 'schedule.view'] });
  assert.equal(edit.status, 200);
  assert.equal((await neff.put('/admin/roles/admin', S.admin).send({ permissions: [] })).status, 403);
});
