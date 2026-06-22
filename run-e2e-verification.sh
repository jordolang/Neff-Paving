#!/bin/bash

# End-to-End Verification Script
# Customer Portal Flow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================================"
echo "Customer Portal E2E Verification"
echo "================================================"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check PostgreSQL
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "  Start it with: brew services start postgresql (macOS)"
    echo "  or: sudo service postgresql start (Ubuntu)"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed: $(node --version)${NC}"

# Check database exists
if ! psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw neff_paving_admin; then
    echo -e "${YELLOW}⚠ Database 'neff_paving_admin' not found${NC}"
    echo "  Creating database..."
    createdb -h localhost -U postgres neff_paving_admin || {
        echo -e "${RED}✗ Failed to create database${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database 'neff_paving_admin' exists${NC}"
fi

echo ""

# Step 1: Setup database and test data
echo -e "${BLUE}Step 1: Setting up database and test data...${NC}"
cd api
node setup-test-data.cjs || {
    echo -e "${RED}✗ Failed to setup test data${NC}"
    exit 1
}
cd ..
echo ""

# Step 2: Start backend server
echo -e "${BLUE}Step 2: Starting backend server...${NC}"
cd api
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "  Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "  Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend server is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend server failed to start${NC}"
        echo "  Check backend.log for errors"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Step 3: Start frontend server
echo -e "${BLUE}Step 3: Starting frontend dev server...${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "  Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend server is running${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Frontend server failed to start${NC}"
        echo "  Check frontend.log for errors"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Step 4: Test API endpoints
echo -e "${BLUE}Step 4: Testing API endpoints...${NC}"

# Test login
echo "  Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "  Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "  Response: $LOGIN_RESPONSE"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Test project data endpoint
echo "  Testing project data endpoint..."
PROJECT_RESPONSE=$(curl -s -X GET http://localhost:3001/api/customer/project \
    -H "Authorization: Bearer $TOKEN")

if echo "$PROJECT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Project data retrieved${NC}"
else
    echo -e "${RED}✗ Project data retrieval failed${NC}"
    echo "  Response: $PROJECT_RESPONSE"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Test token verification
echo "  Testing token verification..."
VERIFY_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/verify \
    -H "Authorization: Bearer $TOKEN")

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Token verification successful${NC}"
else
    echo -e "${RED}✗ Token verification failed${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Step 5: Test CORS
echo -e "${BLUE}Step 5: Testing CORS configuration...${NC}"
CORS_RESPONSE=$(curl -s -X OPTIONS http://localhost:3001/api/auth/login \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -w "\n%{http_code}" \
    -o /dev/null)

if [ "$CORS_RESPONSE" = "204" ] || [ "$CORS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ CORS configured correctly${NC}"
else
    echo -e "${YELLOW}⚠ CORS response: $CORS_RESPONSE${NC}"
fi
echo ""

# Step 6: Security check
echo -e "${BLUE}Step 6: Checking for hardcoded secrets...${NC}"
if grep -r "password.*=.*['\"]" --include="*.js" --include="*.html" src/ customer-portal.html 2>/dev/null | grep -v "password_hash" | grep -v "Password" | grep -v "password:" | grep -v "// " | grep -q ""; then
    echo -e "${YELLOW}⚠ Potential hardcoded secrets found${NC}"
else
    echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}E2E Verification Complete!${NC}"
echo "================================================"
echo ""
echo "Servers running:"
echo "  Backend:  http://localhost:3001 (PID: $BACKEND_PID)"
echo "  Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo "  Portal:   http://localhost:5173/customer-portal.html"
echo ""
echo "Test credentials:"
echo "  Email:    test@example.com"
echo "  Password: testpass123"
echo ""
echo "Manual verification steps:"
echo "  1. Open http://localhost:5173/customer-portal.html in browser"
echo "  2. Login with test credentials"
echo "  3. Verify dashboard displays all data correctly"
echo "  4. Check all 6 tabs (Overview, Estimate, Contract, Schedule, Payment, Updates)"
echo "  5. Test logout functionality"
echo "  6. Test protected route (clear localStorage and access dashboard)"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  backend.log"
echo "  Frontend: frontend.log"
echo ""

# Keep script running
echo -e "${BLUE}Press Ctrl+C to stop servers and exit${NC}"
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Done'; exit 0" INT

# Wait for user interrupt
while true; do
    sleep 1
done
