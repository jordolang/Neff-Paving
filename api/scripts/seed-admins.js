#!/usr/bin/env node
'use strict';
/** One-time: apply the mobile schema, then grant SUPER_ADMIN_EMAIL and ADMIN_EMAILS their roles. */
require('dotenv').config();
const pool = require('../config/database');
const { init } = require('../v1');
const { ensureSuperAdmins, seedAdmins } = require('../v1/bootstrap');

(async () => {
  if (!process.env.SUPER_ADMIN_EMAIL && !process.env.ADMIN_EMAILS) {
    console.error('Set SUPER_ADMIN_EMAIL and/or ADMIN_EMAILS (comma-separated) first.');
    process.exit(1);
  }
  await init();
  await ensureSuperAdmins(console.log);
  await seedAdmins(console.log);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
