'use strict';

/** /auth, /me, /company, /gallery, /reviews, /notifications */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const H = require('../http');
const S = require('../serialize');
const C = require('../context');
const svc = require('../services');

const { wrap, ok, list, q, one, required, badRequest, ApiError } = H;
const REFRESH_DAYS = 30;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function issueTokens(userId, client) {
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  await q(
    `INSERT INTO app.refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '${REFRESH_DAYS} days')`,
    [userId, sha(refreshToken)], client,
  );
  return { accessToken: C.signAccess(userId), refreshToken };
}

async function authResponse(req, res, user, status = 200) {
  await q('UPDATE app.users SET last_login_at = now() WHERE id = $1', [user.id]);
  const auth = await C.buildAuth(user, req.company);
  const tokens = await issueTokens(user.id);
  return ok(res, { ...tokens, user: C.serializeMe(req, auth) }, status);
}

function validatePassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw badRequest('Password must be at least 8 characters');
}

// ── /auth ────────────────────────────────────────────────────────────────
const auth = express.Router();

auth.post('/signup', wrap(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  required(req.body, ['email', 'password', 'firstName', 'lastName']);
  if (!EMAIL_RE.test(email)) throw badRequest('Enter a valid email address');
  validatePassword(password);
  const exists = await one('SELECT id FROM app.users WHERE lower(email) = lower($1)', [email]);
  if (exists) throw new ApiError(409, 'conflict', 'An account with that email already exists. Try signing in.');
  const user = await one(
    `INSERT INTO app.users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email.trim().toLowerCase(), await bcrypt.hash(password, 12), firstName.trim(), lastName.trim(), phone || null],
  );
  return authResponse(req, res, user, 201);
}));

auth.post('/login', wrap(async (req, res) => {
  required(req.body, ['email', 'password']);
  const user = await one('SELECT * FROM app.users WHERE lower(email) = lower($1)', [req.body.email]);
  const okPw = user && user.password_hash && (await bcrypt.compare(req.body.password, user.password_hash));
  if (!okPw) throw new ApiError(401, 'unauthorized', 'Email or password is incorrect');
  if (!user.is_active) throw new ApiError(403, 'forbidden', 'This account is disabled');
  return authResponse(req, res, user);
}));

auth.post('/google', wrap(async (req, res) => {
  required(req.body, ['idToken']);
  let p;
  try {
    p = await svc.verifyGoogle(req.body.idToken);
  } catch (e) {
    throw new ApiError(401, 'unauthorized', 'Google sign-in could not be verified');
  }
  if (!p || !p.email || p.email_verified === false) throw new ApiError(401, 'unauthorized', 'Google account email is not verified');
  let user = await one('SELECT * FROM app.users WHERE google_sub = $1 OR lower(email) = lower($2) ORDER BY google_sub NULLS LAST LIMIT 1', [p.sub, p.email]);
  if (!user) {
    user = await one(
      `INSERT INTO app.users (email, google_sub, first_name, last_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [p.email.toLowerCase(), p.sub, p.given_name || '', p.family_name || '', p.picture || null],
    );
  } else if (!user.google_sub) {
    user = await one('UPDATE app.users SET google_sub = $1 WHERE id = $2 RETURNING *', [p.sub, user.id]);
  }
  if (!user.is_active) throw new ApiError(403, 'forbidden', 'This account is disabled');
  return authResponse(req, res, user);
}));

auth.post('/refresh', wrap(async (req, res) => {
  required(req.body, ['refreshToken']);
  const out = await H.tx(async (client) => {
    const row = await one(
      `UPDATE app.refresh_tokens SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now() RETURNING user_id`,
      [sha(req.body.refreshToken)], client,
    );
    if (!row) throw new ApiError(401, 'unauthorized', 'Session expired, please sign in again');
    const user = await one('SELECT is_active FROM app.users WHERE id = $1', [row.user_id], client);
    if (!user || !user.is_active) throw new ApiError(401, 'unauthorized', 'Account disabled');
    return issueTokens(row.user_id, client);
  });
  ok(res, out);
}));

auth.post('/logout', wrap(async (req, res) => {
  if (req.body.refreshToken) {
    await q('UPDATE app.refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [sha(req.body.refreshToken)]);
  }
  ok(res, { ok: true });
}));

auth.post('/forgot-password', wrap(async (req, res) => {
  const user = req.body.email && await one('SELECT id, email FROM app.users WHERE lower(email) = lower($1)', [req.body.email]);
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    await q(`INSERT INTO app.password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')`, [user.id, sha(token)]);
    // Delivery goes through the same email relay the website forms use, when configured.
    const link = `${process.env.PASSWORD_RESET_URL || `${req.base}/reset-password`}?token=${token}`;
    if (process.env.RESEND_API_KEY && process.env.FORM_FROM_EMAIL) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.FORM_FROM_EMAIL, to: user.email,
          subject: `${req.company.name}: reset your password`,
          text: `Reset your password within the next hour:\n\n${link}\n\nIf you didn't ask for this, ignore this email.`,
        }),
      }).catch((e) => console.error('reset email failed:', e.message));
    }
  }
  ok(res, { ok: true }); // never reveal whether the email exists
}));

auth.post('/reset-password', wrap(async (req, res) => {
  required(req.body, ['token', 'newPassword']);
  validatePassword(req.body.newPassword);
  const row = await one(
    `UPDATE app.password_resets SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id`,
    [sha(req.body.token)],
  );
  if (!row) throw badRequest('This reset link is invalid or has expired');
  await q('UPDATE app.users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(req.body.newPassword, 12), row.user_id]);
  await q('UPDATE app.refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [row.user_id]);
  ok(res, { ok: true });
}));

auth.post('/device', C.authenticate, wrap(async (req, res) => {
  required(req.body, ['token', 'platform']);
  H.oneOf(req.body.platform, ['ios', 'android'], 'platform');
  await q(
    `INSERT INTO app.devices (user_id, token, platform) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = now()`,
    [req.auth.user.id, req.body.token, req.body.platform],
  );
  ok(res, { ok: true });
}));

// ── /me ──────────────────────────────────────────────────────────────────
const me = express.Router();
me.use(C.authenticate);

me.get('/', wrap(async (req, res) => ok(res, C.serializeMe(req))));

me.put('/', wrap(async (req, res) => {
  const b = req.body;
  const u = req.auth.user;
  const prefs = b.notificationPrefs ? { ...u.notification_prefs, ...b.notificationPrefs } : u.notification_prefs;
  const updated = await one(
    `UPDATE app.users SET first_name = $1, last_name = $2, phone = $3, address = $4,
       notification_prefs = $5, public_profile = $6 WHERE id = $7 RETURNING *`,
    [
      b.firstName ?? u.first_name, b.lastName ?? u.last_name, b.phone ?? u.phone,
      b.address ? S.address(b.address) : u.address, prefs,
      typeof b.publicProfile === 'boolean' ? b.publicProfile : u.public_profile, u.id,
    ],
  );
  req.auth.user = updated;
  ok(res, C.serializeMe(req));
}));

me.post('/avatar', svc.upload.single('file'), wrap(async (req, res) => {
  if (!req.file || svc.mediaKind(req.file) !== 'photo') throw badRequest('Upload a photo in the "file" field');
  req.auth.user = await one('UPDATE app.users SET avatar_url = $1 WHERE id = $2 RETURNING *', [svc.uploadedPath(req.file), req.auth.user.id]);
  ok(res, C.serializeMe(req));
}));

me.put('/password', wrap(async (req, res) => {
  required(req.body, ['newPassword']);
  validatePassword(req.body.newPassword);
  const u = req.auth.user;
  if (u.password_hash && !(await bcrypt.compare(req.body.currentPassword || '', u.password_hash))) {
    throw badRequest('Current password is incorrect');
  }
  await q('UPDATE app.users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(req.body.newPassword, 12), u.id]);
  ok(res, { ok: true });
}));

// ── Public-ish: /company (no auth), /gallery, /reviews ───────────────────
const pub = express.Router();

pub.get('/company', (req, res) => ok(res, S.company(req.company)));

pub.get('/gallery', C.authenticate, wrap(async (req, res) => {
  const jobs = await q(
    `SELECT j.id, j.title, j.service_address, j.created_at, u.first_name, u.last_name
     FROM app.jobs j JOIN app.users u ON u.id = j.customer_id
     WHERE j.company_id = $1 AND j.shared_publicly ORDER BY j.updated_at DESC LIMIT 100`,
    [req.company.id],
  );
  const ids = jobs.map((j) => j.id);
  const media = ids.length ? await q('SELECT * FROM app.media WHERE job_id = ANY($1) AND is_public ORDER BY created_at', [ids]) : [];
  const reviews = ids.length ? await q(
    `SELECT r.*, u.first_name AS customer_first, u.last_name AS customer_last
     FROM app.reviews r LEFT JOIN app.users u ON u.id = r.customer_id WHERE r.job_id = ANY($1) AND r.is_published`, [ids],
  ) : [];
  list(res, jobs.map((j) => {
    const rv = reviews.find((r) => r.job_id === j.id);
    return {
      id: j.id, jobId: j.id, jobTitle: j.title,
      customerName: `${j.first_name} ${j.last_name ? `${j.last_name[0]}.` : ''}`.trim(),
      city: (j.service_address || {}).city || '',
      media: media.filter((m) => m.job_id === j.id).map((m) => S.media(m, req.base)),
      review: rv ? S.review(rv) : null, createdAt: S.iso(j.created_at),
    };
  }).filter((g) => g.media.length));
}));

pub.get('/reviews', C.authenticate, wrap(async (req, res) => {
  const rows = await q(
    `SELECT r.*, u.first_name AS customer_first, u.last_name AS customer_last
     FROM app.reviews r JOIN app.jobs j ON j.id = r.job_id LEFT JOIN app.users u ON u.id = r.customer_id
     WHERE j.company_id = $1 AND r.is_published ORDER BY r.created_at DESC LIMIT 200`,
    [req.company.id],
  );
  list(res, rows.map(S.review));
}));

// ── /notifications ───────────────────────────────────────────────────────
const notifications = express.Router();
notifications.use(C.authenticate);

notifications.get('/', wrap(async (req, res) => {
  const rows = await q(
    'SELECT * FROM app.notifications WHERE user_id = $1 AND company_id = $2 ORDER BY created_at DESC LIMIT 200',
    [req.auth.user.id, req.company.id],
  );
  list(res, rows.map(S.notification));
}));
notifications.post('/read-all', wrap(async (req, res) => {
  await q('UPDATE app.notifications SET read_at = now() WHERE user_id = $1 AND company_id = $2 AND read_at IS NULL', [req.auth.user.id, req.company.id]);
  ok(res, { ok: true });
}));
notifications.post('/:id/read', wrap(async (req, res) => {
  await q('UPDATE app.notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2', [H.intParam(req.params.id), req.auth.user.id]);
  ok(res, { ok: true });
}));

module.exports = { auth, me, pub, notifications };
