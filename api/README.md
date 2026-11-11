# Neff Paving Customer Portal API

Express.js API server for the customer portal backend.

## Setup

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database
- npm >= 9.0.0

### Installation

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials and secrets:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neff_paving_admin
DB_USER=postgres
DB_PASSWORD=your_actual_password
JWT_SECRET=your_actual_secret_key_here
NODE_ENV=development
PORT=3000
```

3. Install dependencies:
```bash
npm install
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 3000 (or the PORT specified in .env).

## API Endpoints

### Health Checks
- `GET /health` - Server health check
- `GET /health/db` - Database connection health check

### Authentication (Coming Soon)
- `POST /api/auth/login` - Customer login
- `POST /api/auth/logout` - Customer logout
- `GET /api/auth/verify` - Verify JWT token

### Customer Data (Coming Soon)
- `GET /api/customer/project` - Get customer project data
- `GET /api/customer/estimate` - Get customer estimate
- `GET /api/customer/contract` - Get customer contract
- `GET /api/customer/payments` - Get customer payment history
- `GET /api/customer/schedule` - Get project schedule

## Project Structure

```
api/
├── config/
│   └── database.js       # PostgreSQL connection pool
├── middleware/           # (Coming soon) Authentication middleware
├── models/              # (Coming soon) Database models
├── routes/              # (Coming soon) API route handlers
├── migrations/          # Database migration files
├── server.js            # Express server entry point
├── package.json         # Node.js dependencies
├── .env.example         # Environment template
└── README.md           # This file
```

## Database Migrations

Migrations are located in the `migrations/` directory:
- `001_create_customers.sql` - Customer accounts table
- `002_link_existing_data.sql` - Estimates, contracts, payments, schedules tables

Run migrations using PostgreSQL:
```bash
psql -h localhost -U postgres -d neff_paving_admin -f migrations/001_create_customers.sql
psql -h localhost -U postgres -d neff_paving_admin -f migrations/002_link_existing_data.sql
```

## Development Status

### Completed ✅
- [x] Express server setup with CORS and JSON middleware
- [x] PostgreSQL database connection pool
- [x] Health check endpoints
- [x] Environment configuration
- [x] Error handling middleware
- [x] Graceful shutdown handling

### In Progress 🔄
- [ ] JWT authentication middleware
- [ ] Authentication endpoints
- [ ] Customer data endpoints

### Blocked ⚠️
**Current Blocker:** npm install failing with 403 Forbidden errors from npm registry.

This is a network/firewall/authentication issue at the system level. Once resolved, run:
```bash
cd api
npm install
```

Then verify the server starts:
```bash
node server.js
```

Expected output: `Server listening on port 3000`

## Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing
- **jsonwebtoken** - JWT authentication
- **nodemon** (dev) - Auto-reload during development

## Mobile apps API (`/api/v1`)

The iOS (Swift) and Android (Flutter) apps for Neff Paving, Muskingum Materials and Austin
Trucking share one multi-company API, mounted at `/api/v1`. The full contract is in
[`mobile/API_CONTRACT.md`](../mobile/API_CONTRACT.md).

- **Schema**: `migrations/003_mobile_platform.sql` creates everything in a separate `app`
  schema (it never touches the website tables). It is applied automatically on start
  (`AUTO_MIGRATE=false` to disable) and is idempotent.
- **Roles**: `super_admin`, `admin`, `office_staff`, `estimator`, `crew_lead`, `mechanic`,
  `employee`, `customer`. Defaults live in `v1/permissions.js`; admins can edit them in the app.
- **Owner accounts**: set `SUPER_ADMIN_EMAIL` (enforced as super admin on every start) and
  `ADMIN_EMAILS`, then run `npm run seed:admins` once. Accounts that don't exist yet are created
  without a password — sign in with Google or use "Forgot password".
- **Location tracking**: points are accepted only while the employee has an open shift
  (`/time/clock-in` → `/time/clock-out`) and only after they accept the tracking disclosure.
  Admins see live positions at `/admin/tracking/live`; trail views are audit-logged.
- **Uploads**: stored on disk in `UPLOAD_DIR` and served at `/uploads`. Run the API on a host
  with a persistent disk (Render, Fly.io, a VM). Vercel's serverless functions have no persistent
  filesystem, so this server is not deployed there.
- **Push**: notifications are always stored in-app. To deliver pushes, set `PUSH_WEBHOOK_URL`
  to a relay (e.g. a Firebase Cloud Function using FCM for Android and APNs for iOS); it receives
  `{ devices: [{ user_id, token, platform }], notification: { type, title, body, data } }`.
- **Payments**: with `STRIPE_SECRET_KEY` set, customers pay invoices through Stripe Checkout;
  point a Stripe webhook at `/api/v1/webhooks/stripe` with `STRIPE_WEBHOOK_SECRET`.

### Tests

```bash
createdb neff_test                       # disposable database; its `app` schema is reset
DB_PASSWORD=postgres npm test            # TEST_DB_NAME / DB_HOST / DB_USER override defaults
```
