'use strict';

/**
 * Account bootstrap for the owner roles.
 *  - SUPER_ADMIN_EMAIL: guaranteed super_admin in every company (enforced on every start,
 *    so the owner can never be locked out or demoted).
 *  - ADMIN_EMAILS: comma-separated (Clint, Austin). Granted admin in every company by
 *    `npm run seed:admins` — run once; afterwards the super admin manages them in the app.
 * Accounts that don't exist yet are created without a password: the person signs in with
 * Google, or uses "Forgot password" to set one.
 */

const { q, one } = require('./http');

const emails = (v) => String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

async function ensureRole(email, role, log = () => {}) {
  let user = await one('SELECT id FROM app.users WHERE lower(email) = $1', [email]);
  if (!user) {
    user = await one('INSERT INTO app.users (email) VALUES ($1) RETURNING id', [email]);
    log(`created account ${email}`);
  }
  await q(
    `INSERT INTO app.memberships (user_id, company_id, role, closed_at)
     SELECT $1, c.id, $2, NULL FROM app.companies c
     ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role, closed_at = NULL`,
    [user.id, role],
  );
  await q('UPDATE app.users SET is_active = true WHERE id = $1', [user.id]);
  log(`${email} -> ${role} (all companies)`);
  return user.id;
}

async function ensureSuperAdmins(log) {
  for (const e of emails(process.env.SUPER_ADMIN_EMAIL)) await ensureRole(e, 'super_admin', log);
}

async function seedAdmins(log) {
  for (const e of emails(process.env.ADMIN_EMAILS)) await ensureRole(e, 'admin', log);
}

module.exports = { ensureRole, ensureSuperAdmins, seedAdmins };
