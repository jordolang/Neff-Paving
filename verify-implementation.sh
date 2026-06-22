#!/bin/bash

# Verification script for Google Maps hardening implementation
# This script performs automated checks that can complement manual testing

echo "=== Google Maps Hardening Implementation Verification ==="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

check_pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((PASS_COUNT++))
}

check_fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((FAIL_COUNT++))
}

check_info() {
  echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

echo "=== Phase 1: Maps Loader Service ==="
echo ""

# Check if MapsLoaderService exists
if [ -f "src/services/maps-loader-service.js" ]; then
  check_pass "MapsLoaderService file exists"

  # Check for retry logic
  if grep -q "maxRetries" "src/services/maps-loader-service.js"; then
    check_pass "Retry logic implemented"
  else
    check_fail "Retry logic not found"
  fi

  # Check for error types
  if grep -q "QUOTA_EXCEEDED\|INVALID_KEY\|TIMEOUT\|NETWORK_ERROR" "src/services/maps-loader-service.js"; then
    check_pass "Error type detection implemented"
  else
    check_fail "Error type detection not found"
  fi

  # Check for exponential backoff
  if grep -q "Math.pow\|exponential\|backoff" "src/services/maps-loader-service.js"; then
    check_pass "Exponential backoff implemented"
  else
    check_fail "Exponential backoff not found"
  fi
else
  check_fail "MapsLoaderService file not found"
fi

echo ""
echo "=== Phase 2: Fallback UI ==="
echo ""

# Check if MapsFallbackForm exists
if [ -f "src/components/maps-fallback-form.js" ]; then
  check_pass "MapsFallbackForm component exists"

  # Check for form fields
  if grep -q "streetAddress\|city\|state\|zipCode\|squareFootage" "src/components/maps-fallback-form.js"; then
    check_pass "Manual entry form fields implemented"
  else
    check_fail "Form fields not found"
  fi

  # Check for validation
  if grep -q "validateForm\|validation" "src/components/maps-fallback-form.js"; then
    check_pass "Form validation implemented"
  else
    check_fail "Form validation not found"
  fi

  # Check for error messaging
  if grep -q "errorType\|errorMessage" "src/components/maps-fallback-form.js"; then
    check_pass "Context-aware error messaging implemented"
  else
    check_fail "Error messaging not found"
  fi
else
  check_fail "MapsFallbackForm file not found"
fi

echo ""
echo "=== Phase 3: Integration ==="
echo ""

# Check AreaFinder integration
if grep -q "MapsLoaderService\|maps-loader-service" "src/components/area-finder.js"; then
  check_pass "AreaFinder uses MapsLoaderService"
else
  check_fail "AreaFinder not integrated with MapsLoaderService"
fi

if grep -q "MapsFallbackForm\|maps-fallback-form\|showFallbackForm" "src/components/area-finder.js"; then
  check_pass "AreaFinder has fallback integration"
else
  check_fail "AreaFinder fallback not integrated"
fi

# Check EnhancedAreaFinder integration
if grep -q "result.success\|mapsLoadFailed\|fallback" "src/components/enhanced-area-finder.js"; then
  check_pass "EnhancedAreaFinder supports fallback mode"
else
  check_fail "EnhancedAreaFinder fallback support not found"
fi

# Check EstimateForm integration
if grep -q "manual-entry\|manualEntry\|measurementSource" "src/components/estimate-form.js"; then
  check_pass "EstimateForm accepts manual entry data"
else
  check_fail "EstimateForm manual entry integration not found"
fi

echo ""
echo "=== Phase 4: Analytics ==="
echo ""

# Check analytics in MapsLoaderService
if grep -q "trackError\|analytics\|gtag" "src/services/maps-loader-service.js"; then
  check_pass "MapsLoaderService has analytics tracking"
else
  check_fail "MapsLoaderService analytics not found"
fi

# Check analytics in ErrorHandler
if grep -q "map_error\|drawing_error\|maps_load_error" "src/components/error-handler.js"; then
  check_pass "ErrorHandler has map/drawing error analytics"
else
  check_fail "ErrorHandler analytics not found"
fi

# Check drawing error handlers (multiline pattern)
if grep -q "try" "src/components/area-finder.js" && grep -q "catch" "src/components/area-finder.js" && grep -q "initDrawingManager\|handleShapeComplete\|calculateArea" "src/components/area-finder.js"; then
  check_pass "AreaFinder has drawing error handlers"
else
  check_fail "AreaFinder drawing error handlers not comprehensive"
fi

echo ""
echo "=== Code Quality Checks ==="
echo ""

# Check for console.log (should be removed in production)
CONSOLE_LOGS=$(grep -r "console.log" src/components/area-finder.js src/components/enhanced-area-finder.js src/components/estimate-form.js src/components/maps-fallback-form.js src/services/maps-loader-service.js 2>/dev/null | grep -v "// console.log" | wc -l)
if [ "$CONSOLE_LOGS" -eq 0 ]; then
  check_pass "No console.log statements found"
else
  check_fail "Found $CONSOLE_LOGS console.log statements (should be removed)"
fi

# Check for error handler imports
if grep -q "import.*ErrorHandler\|from.*error-handler" "src/components/area-finder.js" "src/components/enhanced-area-finder.js"; then
  check_pass "Components import ErrorHandler"
else
  check_info "Some components may not import ErrorHandler (check manually)"
fi

echo ""
echo "=== Summary ==="
echo ""
echo -e "Total Checks: $((PASS_COUNT + FAIL_COUNT))"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ All automated checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Follow E2E_VERIFICATION_GUIDE.md for manual testing"
  echo "2. Test all API failure scenarios"
  echo "3. Verify analytics logging in browser console"
  echo "4. Document test results"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some checks failed. Please review and fix issues.${NC}"
  echo ""
  exit 1
fi
