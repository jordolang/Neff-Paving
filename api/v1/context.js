'use strict';

/**
 * Request context middleware: tenant resolution (X-Company), JWT authentication, and
 * permission checks. After `authenticate`, `req.auth` holds:
 *   { user, role, rank, isInternal, permissions: string[], can(perm) }
 */

const jwt = require('jsonwebtoken');
const { ApiError, forbidden, one, q } = require('./http');
const S = require('./serialize');

const ACCESS_TTL = '12h';
const ROLE_CACHE_MS = 30 * 1000;

let companyCache = null;
let roleCache = null;
let roleCacheAt = 0;

async function companies() {
  if (!companyCache) {
    const rows = await q('SELECT * FROM app.companies');
    companyCache = new Map(rows.map((c) => [c.key, c]));
  }
  return companyCache;
}

async function roles() {
  if (!roleCache || Date.now() - roleCacheAt > ROLE_CACHE_MS) {
    const rows = await q('SELECT * FROM app.roles');
    roleCache = new Map(rows.map((r) => [r.key, r]));
    roleCacheAt = Date.now();
  }
  return roleCache;
}

function invalidateRoles() { roleCache = null; }
function invalidateCompanies() { companyCache = null; }

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not configured');
  return s;
}

function signAccess(userId) {
  return jwt.sign({ sub: userId, typ: 'access' }, jwtSecret(), { expiresIn: ACCESS_TTL });
}

function baseUrl(req) {
  return (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

/** Resolve X-Company into req.company (required on every v1 route). */
async function tenant(req, res, next) {
  try {
    const key = String(req.get('X-Company') || req.query.company || '').toLowerCase();
    const c = (await companies()).get(key);
    if (!c) throw new ApiError(400, 'bad_request', 'X-Company header must be one of: neff, muskingum, austin');
    req.company = c;
    req.base = baseUrl(req);
    next();
  } catch (e) { next(e); }
}

/** Load the membership for (user, company), creating a customer membership on first visit. */
async function membershipFor(userId, companyId) {
  let m = await one('SELECT * FROM app.memberships WHERE user_id = $1 AND company_id = $2', [userId, companyId]);
  if (!m) {
    m = await one(
      `INSERT INTO app.memberships (user_id, company_id, role) VALUES ($1, $2, 'customer')
       ON CONFLICT (user_id, company_id) DO UPDATE SET role = app.memberships.role RETURNING *`,
      [userId, companyId],
    );
  }
  return m;
}

async function buildAuth(user, company) {
  const m = await membershipFor(user.id, company.id);
  if (m.closed_at) throw new ApiError(403, 'forbidden', 'This account has been closed. Please contact the office.');
  const r = (await roles()).get(m.role);
  const permissions = r ? [...r.permissions] : [];
  const set = new Set(permissions);
  return {
    user, role: m.role, rank: r ? r.rank : 0, isInternal: r ? r.is_internal : false, permissions,
    can: (...perms) => perms.some((p) => set.has(p)),
  };
}

async function authenticate(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'unauthorized', 'Sign in required');
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret());
    } catch {
      throw new ApiError(401, 'unauthorized', 'Session expired, please sign in again');
    }
    if (payload.typ !== 'access') throw new ApiError(401, 'unauthorized', 'Invalid token');
    const user = await one('SELECT * FROM app.users WHERE id = $1', [payload.sub]);
    if (!user || !user.is_active) throw new ApiError(401, 'unauthorized', 'Account disabled');
    req.auth = await buildAuth(user, req.company);
    next();
  } catch (e) { next(e); }
}

/** Require ANY of the given permissions. */
const requirePerm = (...perms) => (req, res, next) => {
  if (!req.auth || !req.auth.can(...perms)) return next(forbidden());
  next();
};

function serializeMe(req, auth = req.auth) {
  return S.user(auth.user, {
    base: req.base, role: auth.role, isInternal: auth.isInternal,
    permissions: auth.permissions, company: req.company,
  });
}

module.exports = {
  tenant, authenticate, requirePerm, buildAuth, signAccess, serializeMe,
  roles, companies, invalidateRoles, invalidateCompanies, membershipFor,
};
