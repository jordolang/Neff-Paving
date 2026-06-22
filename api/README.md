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
