'use strict';

/**
 * Mobile platform API v1 — mounted at /api/v1 by server.js.
 * Contract: mobile/API_CONTRACT.md
 */

const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ApiError, wrap, q, one } = require('./http');
const C = require('./context');
const account = require('./routes/account');
const portal = require('./routes/portal');
const workforce = require('./routes/workforce');
const field = require('./routes/field');
const admin = require('./routes/admin');

const router = express.Router();

/** Stripe webhook: marks card payments succeeded/failed. Needs req.rawBody (see server.js). */
router.post('/webhooks/stripe', wrap(async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new ApiError(404, 'not_found', 'Not found');
  const sig = String(req.get('Stripe-Signature') || '');
  const parts = Object.fromEntries(sig.split(',').map((kv) => kv.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${req.rawBody || ''}`).digest('hex');
  const valid = parts.v1 && parts.v1.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))
    && Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  if (!valid) throw new ApiError(400, 'bad_request', 'Invalid signature');
  const event = req.body;
  const session = event.data && event.data.object;
  const paymentId = Number(session && session.metadata && session.metadata.paymentId);
  if (paymentId && ['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) {
    const status = event.type === 'checkout.session.completed' && session.payment_status === 'paid' ? 'succeeded' : 'failed';
    const p = await one(`UPDATE app.payments SET status = $1 WHERE id = $2 AND status = 'pending' RETURNING invoice_id`, [status, paymentId]);
    if (p) await admin.recomputeInvoice(p.invoice_id);
  }
  res.json({ received: true });
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT || 60), standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { code: 'rate_limited', message: 'Too many attempts, please try again later.' } }),
});

router.use(C.tenant);
router.use('/auth', authLimiter, account.auth);
router.use('/me', account.me);
router.use('/notifications', account.notifications);
router.use('/portal', portal.router);
router.use('/admin', admin.router);
router.use('/', account.pub);
router.use('/', workforce.router);
router.use('/', field.router);

router.use((req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Not found' } }));

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: { code: 'bad_request', message: 'File is too large (200 MB max)' } });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'bad_request', message: 'Malformed JSON' } });
  if (err && ['22P02', '22007', '22008', '23514'].includes(err.code)) {
    return res.status(400).json({ error: { code: 'bad_request', message: 'One of the values is not valid' } });
  }
  console.error('[api/v1]', err);
  res.status(500).json({ error: { code: 'server_error', message: 'Something went wrong' } });
});

/** Apply migration 003 (idempotent) and sync role defaults. Called at server start. */
async function init() {
  const fs = require('fs');
  const path = require('path');
  if (process.env.AUTO_MIGRATE !== 'false') {
    await q(fs.readFileSync(path.join(__dirname, '..', 'migrations', '003_mobile_platform.sql'), 'utf8'));
  }
  await require('./permissions').syncRoles(require('../config/database'));
  await require('./bootstrap').ensureSuperAdmins((m) => console.log(`[bootstrap] ${m}`));
  C.invalidateRoles();
  C.invalidateCompanies();
}

module.exports = { router, init };
