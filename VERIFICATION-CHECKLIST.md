# E2E Verification Checklist
## Customer Portal Flow

Use this checklist to verify the customer portal end-to-end flow.

## Prerequisites Setup

- [ ] PostgreSQL running on localhost:5432
- [ ] Database `neff_paving_admin` exists
- [ ] Run database setup: `cd api && node setup-test-data.cjs`
- [ ] Backend server started: `cd api && node server.js`
- [ ] Frontend server started: `npm run dev`

## 1. Login Flow ✓

- [ ] Navigate to http://localhost:5173/customer-portal.html
- [ ] Page renders without console errors
- [ ] Login form is visible
- [ ] Enter credentials:
  - Email: `test@example.com`
  - Password: `testpass123`
- [ ] Click "Log In" button
- [ ] Loading indicator appears
- [ ] No error messages
- [ ] Redirect to dashboard occurs
- [ ] JWT token stored in localStorage

**DevTools Check:**
```javascript
localStorage.getItem('auth_token') // Should return JWT token
localStorage.getItem('auth_user')  // Should return user data
```

## 2. Dashboard Display ✓

### Overview Tab
- [ ] Customer name displays in header
- [ ] Project summary card visible
- [ ] Stats cards show:
  - [ ] Estimate amount: $20,000.00
  - [ ] Contract status: Active
  - [ ] Payment status: $5,000.00 paid
  - [ ] Schedule progress indicator

### Estimate Tab
- [ ] Property address: "123 Main St, Springfield, IL"
- [ ] Square footage: 2,500 sq ft
- [ ] Material type: Asphalt
- [ ] Base cost: $5,000.00
- [ ] Material cost: $8,000.00
- [ ] Labor cost: $7,000.00
- [ ] Total cost: $20,000.00
- [ ] Estimated duration: 5 days
- [ ] Status badge: "Approved"

### Contract Tab
- [ ] Total amount: $20,000.00
- [ ] Deposit amount: $5,000.00
- [ ] Start date displayed
- [ ] End date: 7 days from start
- [ ] Status: "Active"
- [ ] Terms text visible

### Payment Tab
- [ ] Payment amount: $5,000.00
- [ ] Payment method: Card
- [ ] Status: "Succeeded"
- [ ] Payment date displayed
- [ ] Remaining balance: $15,000.00

### Schedule Tab
- [ ] Start date displayed
- [ ] End date: 7 days from start
- [ ] Status: "In Progress"
- [ ] Milestones list:
  - [ ] ✓ Site Preparation (completed)
  - [ ] Base Installation (pending)
  - [ ] Asphalt Paving (pending)

### Updates Tab
- [ ] Updates list displays
- [ ] Recent activity shown

## 3. Tab Navigation ✓

- [ ] Click each tab
- [ ] Active tab highlighted
- [ ] Tab content switches correctly
- [ ] No console errors during tab switching

## 4. Logout Functionality ✓

- [ ] Click "Logout" button in header
- [ ] Immediate redirect to login page (customer-portal.html)
- [ ] localStorage cleared

**DevTools Check:**
```javascript
localStorage.getItem('auth_token') // Should return null
localStorage.getItem('auth_user')  // Should return null
```

## 5. Protected Route Validation ✓

### Test Unauthenticated Access
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Navigate to dashboard page directly
- [ ] Immediate redirect to login page occurs
- [ ] No dashboard content shown
- [ ] No error messages displayed

### Test Invalid Token
- [ ] Set invalid token: `localStorage.setItem('auth_token', 'invalid')`
- [ ] Navigate to dashboard
- [ ] API request fails with 401/403
- [ ] Redirect to login page occurs
- [ ] Token cleared from localStorage

## 6. API Integration Tests ✓

### Login Endpoint
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```
- [ ] Returns 200 status
- [ ] Response contains `"success": true`
- [ ] Response contains JWT `token`
- [ ] Response contains `customer` object

### Project Data Endpoint
```bash
TOKEN="<from_login_response>"
curl -X GET http://localhost:3001/api/customer/project \
  -H "Authorization: Bearer $TOKEN"
```
- [ ] Returns 200 status
- [ ] Response contains estimates array
- [ ] Response contains contracts array
- [ ] Response contains payments array
- [ ] Response contains schedules array

### Token Verification
```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```
- [ ] Returns 200 status
- [ ] Response contains customer data
- [ ] No password_hash in response

### Invalid Credentials
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}'
```
- [ ] Returns 401 status
- [ ] Response contains error message
- [ ] No token returned

## 7. CORS Verification ✓

```bash
curl -X OPTIONS http://localhost:3001/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v
```
- [ ] Returns 200 or 204 status
- [ ] Response headers include:
  - [ ] `Access-Control-Allow-Origin: http://localhost:5173`
  - [ ] `Access-Control-Allow-Credentials: true`
  - [ ] `Access-Control-Allow-Methods: ...POST...`
  - [ ] `Access-Control-Allow-Headers: ...Authorization...`

## 8. Security Checks ✓

### No Hardcoded Secrets
```bash
grep -r "password.*=" --include="*.js" src/ | grep -v "//"
```
- [ ] No actual passwords found (only field names)
- [ ] No API keys in frontend code
- [ ] No JWT secrets exposed

### Password Hashing
- [ ] Passwords stored as bcrypt hashes in database
- [ ] No plain text passwords in database
- [ ] password_hash never returned in API responses

## 9. Error Handling ✓

### Network Errors
- [ ] Stop backend server
- [ ] Try to login from frontend
- [ ] Appropriate error message shown
- [ ] No application crash

### Session Expiration
- [ ] Set expired token (old/invalid)
- [ ] Try to access protected endpoint
- [ ] Redirect to login occurs
- [ ] Token cleared

## 10. Browser Console ✓

Throughout all tests:
- [ ] No JavaScript errors
- [ ] No 404 errors for resources
- [ ] No CORS errors
- [ ] API requests complete successfully
- [ ] Proper loading states shown

## Success Criteria

All checkboxes above must be checked for E2E verification to pass.

## Automated Verification

Run the automated script to test API endpoints:

```bash
./run-e2e-verification.sh
```

This will:
1. Check prerequisites
2. Setup database and test data
3. Start backend and frontend servers
4. Run automated API tests
5. Provide instructions for manual browser testing

## Notes

- **Default Port:** Backend runs on 3001 (configured in api/.env)
- **Test User:** test@example.com / testpass123
- **JWT Expiration:** 7 days (no auto-refresh)
- **Logs:** Check backend.log and frontend.log if issues occur

## Cleanup

After verification:

```bash
# Stop servers
kill <backend_pid> <frontend_pid>

# Or if using run-e2e-verification.sh, press Ctrl+C

# Optional: Remove test data
cd api
node -e "const {Pool} = require('pg'); require('dotenv').config(); const p = new Pool({host: process.env.DB_HOST, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD}); p.query('DELETE FROM customers WHERE email=$1', ['test@example.com']).then(() => p.end());"
```
