const { Pool } = require('pg');
require('dotenv').config();

// DATABASE_URL (e.g. a Supabase connection string) wins over the DB_* variables.
// DB_SSL=true turns on TLS, which hosted Postgres requires.
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
const serverless = !!process.env.VERCEL;

const pool = new Pool({
  ...(process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }),
  ssl,
  // Serverless instances each hold their own pool, so keep it small there.
  max: Number(process.env.DB_POOL_MAX || (serverless ? 3 : 20)),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || (serverless ? 10000 : 2000)),
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // A long-running server restarts cleanly; a serverless instance just drops the client.
  if (!serverless) process.exit(-1);
});

module.exports = pool;
