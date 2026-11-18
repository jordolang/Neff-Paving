'use strict';

/**
 * Cross-cutting services: notifications (+ push fan-out), uploads, field encryption,
 * Google ID-token verification, audit log, and job access rules.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { q, one, badRequest, notFound, forbidden } = require('./http');

// ── Notifications ─────────────────────────────────────────────────────────
/**
 * Push delivery is pluggable: when PUSH_WEBHOOK_URL is set, each notification is POSTed
 * there with the recipient's device tokens (point it at an FCM/APNs relay such as a
 * Firebase Cloud Function). Without it, notifications are stored in-app only.
 */
async function sendPush(userIds, payload) {
  const url = process.env.PUSH_WEBHOOK_URL;
  if (!url || !userIds.length) return;
  const devices = await q('SELECT user_id, token, platform FROM app.devices WHERE user_id = ANY($1)', [userIds]);
  if (!devices.length) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PUSH_WEBHOOK_SECRET || ''}` },
      body: JSON.stringify({ devices, notification: payload }),
    });
  } catch (e) {
    console.error('push relay failed:', e.message);
  }
}

async function notify(companyId, userIds, { type, title, body = '', data = {} }) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  await q(
    `INSERT INTO app.notifications (company_id, user_id, type, title, body, data)
     SELECT $1, uid, $3, $4, $5, $6 FROM unnest($2::int[]) AS uid`,
    [companyId, ids, type, title, body, data],
  );
  await sendPush(ids, { type, title, body, data });
}

/** User ids holding any of the given roles in a company. */
async function usersWithRoles(companyId, roleKeys) {
  const rows = await q(
    `SELECT m.user_id FROM app.memberships m JOIN app.users u ON u.id = m.user_id
     WHERE m.company_id = $1 AND m.role = ANY($2) AND u.is_active AND m.closed_at IS NULL`,
    [companyId, roleKeys],
  );
  return rows.map((r) => r.user_id);
}

const adminIds = (companyId) => usersWithRoles(companyId, ['super_admin', 'admin']);

async function audit(req, action, target, targetId, detail = {}) {
  await q(
    'INSERT INTO app.audit_log (company_id, actor_id, action, target, target_id, detail) VALUES ($1,$2,$3,$4,$5,$6)',
    [req.company?.id || null, req.auth?.user.id || null, action, target, targetId, detail],
  );
}

// ── Uploads ────────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
// Serverless filesystems are read-only; there uploads go to Supabase Storage instead.
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { if (!process.env.VERCEL) throw e; }

const MEDIA_TYPES = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/heic': '.heic', 'image/heif': '.heif',
  'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/3gpp': '.3gp', 'video/webm': '.webm',
};

/** Headers for serving uploads: never sniff, never run as a document. */
function uploadHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
}

const fileFilter = (req, file, cb) => {
  if (Object.prototype.hasOwnProperty.call(MEDIA_TYPES, file.mimetype)) return cb(null, true);
  cb(badRequest('Only photos and videos can be uploaded'));
};
// The stored name comes from an allow-list keyed by MIME type, never from the client's
// filename, so an upload can't be served back as HTML/SVG/JS.
const storedName = (file) => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${MEDIA_TYPES[file.mimetype]}`;

/**
 * Object storage. With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set (hosted / serverless),
 * uploads go to the public Supabase Storage bucket MEDIA_BUCKET; otherwise to UPLOAD_DIR on disk.
 */
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = process.env.MEDIA_BUCKET || 'media';
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

let bucketReady = null;
function ensureBucket() {
  bucketReady ??= fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, allowed_mime_types: Object.keys(MEDIA_TYPES) }),
  }).then(async (r) => {
    // 409 / "already exists" is fine.
    if (!r.ok && r.status !== 409 && !/exist/i.test(await r.text())) throw new Error(`bucket setup failed (${r.status})`);
  }).catch((e) => { bucketReady = null; throw e; });
  return bucketReady;
}

async function putObject(file) {
  await ensureBucket();
  const name = storedName(file);
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY,
      'Content-Type': file.mimetype, 'cache-control': '604800', 'x-upsert': 'false',
    },
    body: file.buffer,
  });
  if (!r.ok) throw new Error(`storage upload failed (${r.status})`);
  file.filename = name;
  file.storedUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`;
  file.buffer = null;
}

const diskUpload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, storedName(file)) }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter,
});
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 }, fileFilter });

/** Drop-in for multer: `upload.single('file')` returns the middleware(s) for the active backend. */
const upload = {
  single(field) {
    if (!useSupabase) return diskUpload.single(field);
    return [memoryUpload.single(field), (req, res, next) => {
      if (!req.file) return next();
      putObject(req.file).then(() => next(), next);
    }];
  },
};

const uploadedPath = (file) => file.storedUrl || `/uploads/${file.filename}`;
const mediaKind = (file) => (file.mimetype.startsWith('video/') ? 'video' : 'photo');

// ── Field encryption (bank numbers) ────────────────────────────────────────
function encKey() {
  const k = process.env.DATA_ENCRYPTION_KEY;
  if (!k) throw new Error('DATA_ENCRYPTION_KEY not configured (32-byte hex or base64)');
  const buf = /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, 'hex') : Buffer.from(k, 'base64');
  if (buf.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must decode to 32 bytes');
  return buf;
}
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const ct = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return `v1:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${ct.toString('base64')}`;
}
function decrypt(blob) {
  const [, iv, tag, ct] = blob.split(':');
  const d = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8');
}

// ── Google sign-in ─────────────────────────────────────────────────────────
let googleVerifier = async (idToken) => {
  const { OAuth2Client } = require('google-auth-library');
  const audience = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!audience.length) throw new Error('GOOGLE_CLIENT_IDS not configured');
  const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience });
  return ticket.getPayload();
};
const verifyGoogle = (t) => googleVerifier(t);
/** Test hook. */
const setGoogleVerifier = (fn) => { googleVerifier = fn; };

// ── Job access ─────────────────────────────────────────────────────────────
/** Predicate (alias m): media not attached to an internal-only status update. */
const CUSTOMER_VISIBLE_MEDIA = `NOT EXISTS (SELECT 1 FROM app.status_updates su
  WHERE su.id = m.status_update_id AND NOT su.visible_to_customer)`;

const JOB_SELECT = `
  SELECT j.*, TRIM(cu.first_name || ' ' || cu.last_name) AS customer_name,
         cu.phone AS customer_phone, cu.email AS customer_email, cr.name AS crew_name,
         (SELECT url FROM app.media m WHERE m.job_id = j.id AND m.kind = 'photo' AND ${CUSTOMER_VISIBLE_MEDIA}
          ORDER BY m.created_at DESC LIMIT 1) AS cover_photo_url
  FROM app.jobs j
  LEFT JOIN app.users cu ON cu.id = j.customer_id
  LEFT JOIN app.crews cr ON cr.id = j.crew_id`;

/** SQL predicate (on alias j) limiting jobs to those assigned to user $N. */
const assignedPredicate = (n) => `(
  j.crew_id IN (SELECT crew_id FROM app.crew_members WHERE user_id = $${n}
                UNION SELECT id FROM app.crews WHERE lead_id = $${n})
  OR j.id IN (SELECT job_id FROM app.schedule_entries WHERE user_id = $${n} AND job_id IS NOT NULL))`;

/**
 * Load a job the caller may see through the internal (non-portal) API. Customers must
 * use /portal/jobs. Throws 404 rather than 403 so ids don't leak across tenants.
 */
async function loadInternalJob(req, id) {
  const { auth, company } = req;
  if (auth.can('jobs.view_all')) {
    const j = await one(`${JOB_SELECT} WHERE j.id = $1 AND j.company_id = $2`, [id, company.id]);
    if (!j) throw notFound('Job not found');
    return j;
  }
  if (auth.can('jobs.view_assigned')) {
    const j = await one(
      `${JOB_SELECT} WHERE j.id = $1 AND j.company_id = $2 AND ${assignedPredicate(3)}`,
      [id, company.id, auth.user.id],
    );
    if (!j) throw notFound('Job not found');
    return j;
  }
  throw forbidden();
}

async function loadCustomerJob(req, id) {
  const j = await one(
    `${JOB_SELECT} WHERE j.id = $1 AND j.company_id = $2 AND j.customer_id = $3`,
    [id, req.company.id, req.auth.user.id],
  );
  if (!j) throw notFound('Job not found');
  return j;
}

module.exports = {
  notify, usersWithRoles, adminIds, audit, upload, uploadedPath, mediaKind, UPLOAD_DIR, uploadHeaders, MEDIA_TYPES,
  encrypt, decrypt, verifyGoogle, setGoogleVerifier, JOB_SELECT, assignedPredicate,
  loadInternalJob, loadCustomerJob, CUSTOMER_VISIBLE_MEDIA,
};
