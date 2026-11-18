'use strict';

const pool = require('../config/database');

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const badRequest = (m) => new ApiError(400, 'bad_request', m);
const forbidden = (m = 'You do not have permission to do that') => new ApiError(403, 'forbidden', m);
const notFound = (m = 'Not found') => new ApiError(404, 'not_found', m);
const conflict = (m) => new ApiError(409, 'conflict', m);

/** Wrap an async route so thrown errors reach the v1 error handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data, status = 200) => res.status(status).json({ data });
const list = (res, rows) => res.json({ data: rows, meta: { total: rows.length } });

async function q(text, params = [], client = pool) {
  const { rows } = await client.query(text, params);
  return rows;
}
async function one(text, params = [], client = pool) {
  return (await q(text, params, client))[0] || null;
}

/** Run fn inside a transaction; fn receives a client. */
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function required(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
}

function oneOf(value, allowed, field) {
  if (value !== undefined && !allowed.includes(value)) {
    throw badRequest(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function intParam(v, field = 'id') {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`Invalid ${field}`);
  return n;
}

/** Parse a decimal-ish input (number or string) into a fixed-2 string, or null. */
function decimal(v, field) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/[$,]/g, ''));
  if (!Number.isFinite(n)) throw badRequest(`${field} must be a number`);
  return n.toFixed(2);
}

function coord(v, field, limit) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > limit) throw badRequest(`Invalid ${field}`);
  return n;
}

function dateRange(query, defaultDays = 14) {
  const from = query.from ? new Date(query.from) : new Date(Date.now() - defaultDays * 864e5);
  const to = query.to ? new Date(query.to) : new Date(Date.now() + defaultDays * 864e5);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw badRequest('Invalid from/to');
  return { from, to };
}

module.exports = {
  ApiError, badRequest, forbidden, notFound, conflict,
  wrap, ok, list, q, one, tx, required, oneOf, intParam, decimal, coord, dateRange, pool,
};
