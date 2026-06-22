# End-to-End Verification Guide
## Customer Portal Flow

This document describes the complete end-to-end verification process for the customer portal feature.

## Prerequisites

Before starting the verification, ensure:

1. **PostgreSQL** is running on localhost:5432
2. **Database** `neff_paving_admin` exists
3. **Node.js** v16+ is installed
4. **Environment variables** are configured in `api/.env`

## Step 1: Database Setup

Run the database migrations and create test data:

```bash
# Navigate to the API directory
cd api

# Run the setup script
node setup-test-data.cjs
```

Expected output:
```
=================================
Customer Portal Test Data Setup
=================================

Testing database connection...
✓ Database connection successful

Running database migrations...
Running 001_create_customers.sql...
✓ 001_create_customers.sql completed
Running 002_link_existing_data.sql...
✓ 002_link_existing_data.sql completed

Creating test customer account...
✓ Test customer created (test@example.com)

Creating test project data...
✓ Test estimate created
✓ Test contract created
✓ Test payment created
✓ Test schedule created

=================================
Setup Complete!
=================================

Test credentials:
  Email:    test@example.com
  Password: testpass123
```

## Step 2: Start Backend Server

```bash
# From the api directory
cd api
node server.js
```

Expected output:
```
Database pool created
Server listening on port 3001
```

Verify backend health:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}

curl http://localhost:3001/health/db
# Expected: {"status":"ok","database":"connected","timestamp":"..."}
```

## Step 3: Start Frontend Dev Server

```bash
# From project root
npm run dev
```

Expected output:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Verify Login Flow

### 4.1 Navigate to Portal

Open browser to: http://localhost:5173/customer-portal.html

**Expected:**
- Login page renders without errors
- Email and password fields are visible
- "Log In" button is present
- No console errors in browser DevTools

### 4.2 Test Authentication

**Login with test credentials:**
- Email: `test@example.com`
- Password: `testpass123`

**Expected:**
- Loading indicator appears during authentication
- No error messages
- Redirect to dashboard (customer-dashboard.html or dashboard view)
- JWT token stored in localStorage

**Verify in DevTools Console:**
```javascript
localStorage.getItem('auth_token')
// Should return a JWT token string
localStorage.getItem('auth_user')
// Should return customer data JSON
```

## Step 5: Verify Dashboard Display

After successful login, verify the dashboard shows:

### 5.1 Overview Tab
- Customer name displayed in header
- Project summary visible
- Quick stats cards:
  - Estimate amount
  - Contract status
  - Payment status
  - Schedule progress

### 5.2 Estimate Tab
- Property address: "123 Main St, Springfield, IL"
- Square footage: 2,500 sq ft
- Material type: Asphalt
- Cost breakdown:
  - Base cost: $5,000.00
  - Material cost: $8,000.00
  - Labor cost: $7,000.00
  - Total: $20,000.00
- Estimated duration: 5 days
- Status: Approved

### 5.3 Contract Tab
- Total amount: $20,000.00
- Deposit amount: $5,000.00
- Start date: (current date)
- End date: (7 days from start)
- Status: Active
- Terms: "Standard terms and conditions"

### 5.4 Payment Tab
- Payment amount: $5,000.00
- Payment method: Card
- Status: Succeeded
- Payment date: (current date)
- Remaining balance: $15,000.00

### 5.5 Schedule Tab
- Start date: (current date)
- End date: (7 days from start)
- Status: In Progress
- Milestones:
  - ✓ Site Preparation (completed)
  - ⏳ Base Installation (pending)
  - ⏳ Asphalt Paving (pending)

### 5.6 Updates Tab
- Status update list
- Recent activity notifications

## Step 6: Verify Logout Functionality

**Steps:**
1. Click "Logout" button in dashboard header
2. Observe redirect to login page
3. Verify localStorage is cleared

**Expected:**
- Immediate redirect to `/customer-portal.html`
- localStorage cleared (no auth_token or auth_user)
- Backend logout endpoint called (`POST /api/auth/logout`)

**Verify in DevTools Console:**
```javascript
localStorage.getItem('auth_token')
// Should return null
```

## Step 7: Verify Protected Routes

### 7.1 Test Unauthenticated Access

**Steps:**
1. Clear localStorage: `localStorage.clear()`
2. Navigate directly to dashboard: `http://localhost:5173/customer-dashboard.html`

**Expected:**
- Immediate redirect to `/customer-portal.html` (login page)
- No dashboard content displayed
- No error messages shown

### 7.2 Test Invalid Token

**Steps:**
1. Set invalid token: `localStorage.setItem('auth_token', 'invalid_token')`
2. Navigate to dashboard

**Expected:**
- API returns 401 or 403 error
- Frontend redirects to login page
- Token cleared from localStorage

## Step 8: API Integration Tests

### 8.1 Test Login Endpoint

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "customer": {
      "id": 1,
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "555-123-4567"
    }
  }
}
```

### 8.2 Test Project Data Endpoint

```bash
# First, get the token from login response
TOKEN="<token_from_login>"

curl -X GET http://localhost:3001/api/customer/project \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "estimates": [...],
    "contracts": [...],
    "payments": [...],
    "schedules": [...]
  }
}
```

### 8.3 Test Token Verification

```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Step 9: CORS Verification

### 9.1 Test Preflight Request

```bash
curl -X OPTIONS http://localhost:3001/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Expected Headers in Response:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
```

## Step 10: Security Checks

### 10.1 Verify No Hardcoded Secrets

```bash
# Search for potential secrets in frontend code
grep -r "password\|secret\|api_key" --include="*.js" --include="*.html" src/ customer-portal.html

# Should only find references, not actual values
```

### 10.2 Verify Password Hashing

```bash
# Check database - password should be hashed
# This should be done via database query tool, not exposed in API
```

### 10.3 Test Invalid Credentials

Login with wrong password:
- Email: `test@example.com`
- Password: `wrongpassword`

**Expected:**
- Error message: "Invalid email or password"
- No sensitive information leaked
- No JWT token returned

## Success Criteria

All the following must be verified:

- [x] Backend server starts successfully on port 3001
- [x] Frontend dev server starts successfully on port 5173
- [x] Login page renders without errors
- [x] Authentication succeeds with valid credentials
- [x] Dashboard displays all customer data correctly
  - [x] Estimate information
  - [x] Contract details
  - [x] Payment status
  - [x] Schedule with milestones
- [x] All six tabs render and switch correctly
- [x] Logout clears session and redirects to login
- [x] Protected routes redirect unauthenticated users
- [x] API endpoints return correct data
- [x] CORS is properly configured
- [x] No secrets exposed in frontend code
- [x] Invalid credentials are rejected
- [x] No console errors during normal flow

## Troubleshooting

### Backend Won't Start

**Error:** `Error: listen EADDRINUSE`
**Solution:** Port 3001 is in use. Find and kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

**Error:** `Error: connect ECONNREFUSED` (database)
**Solution:** Start PostgreSQL:
```bash
# macOS
brew services start postgresql

# Ubuntu
sudo service postgresql start
```

### Frontend Won't Start

**Error:** `EPERM: operation not permitted`
**Solution:** Clear Vite cache:
```bash
rm -rf node_modules/.vite
npm run dev
```

### Login Fails

**Error:** "Invalid email or password"
**Solution:** Verify test customer exists:
```bash
cd api
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
pool.query('SELECT email FROM customers').then(r => console.log(r.rows));
"
```

### CORS Errors

**Error:** "has been blocked by CORS policy"
**Solution:** Verify FRONTEND_URL in api/.env or check allowed origins in api/server.js

## Notes

- **Test Credentials:**
  - Email: `test@example.com`
  - Password: `testpass123`

- **Ports:**
  - Backend API: http://localhost:3001
  - Frontend: http://localhost:5173

- **API Base URL:**
  - Backend uses `/api/auth/*` and `/api/customer/*` routes

- **JWT Expiration:**
  - Tokens expire after 7 days
  - No automatic refresh implemented

## Cleanup

After verification, stop the servers:

```bash
# Find and stop backend process
lsof -ti:3001 | xargs kill

# Stop frontend (Ctrl+C in terminal)

# Optional: Clean up test data
cd api
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
pool.query('DELETE FROM customers WHERE email = \$1', ['test@example.com'])
  .then(() => console.log('Test customer deleted'))
  .finally(() => pool.end());
"
```
