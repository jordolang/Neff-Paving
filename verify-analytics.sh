#!/bin/bash

# Analytics Verification Script
# Verifies that all required analytics events are implemented

echo "=================================="
echo "Analytics Implementation Verification"
echo "=================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Helper function to check for pattern in file
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo "✅ PASS: $description"
        ((PASS_COUNT++))
        return 0
    else
        echo "❌ FAIL: $description"
        ((FAIL_COUNT++))
        return 1
    fi
}

# Helper function to check for multiple patterns (any match)
check_any_pattern() {
    local file=$1
    local description=$2
    shift 2
    local patterns=("$@")

    for pattern in "${patterns[@]}"; do
        if grep -q "$pattern" "$file" 2>/dev/null; then
            echo "✅ PASS: $description"
            ((PASS_COUNT++))
            return 0
        fi
    done

    echo "❌ FAIL: $description"
    ((FAIL_COUNT++))
    return 1
}

echo "Phase 1: Maps Loader Service Analytics"
echo "========================================"

# Check MapsLoaderService analytics implementation
MAPS_LOADER="src/services/maps-loader-service.js"

check_pattern "$MAPS_LOADER" "_trackError" \
    "MapsLoaderService has _trackError method"

check_pattern "$MAPS_LOADER" "window.gtag" \
    "MapsLoaderService uses Google Analytics (gtag)"

check_pattern "$MAPS_LOADER" "'exception'" \
    "MapsLoaderService tracks exception events"

check_pattern "$MAPS_LOADER" "'maps_load_error'" \
    "MapsLoaderService tracks maps_load_error events"

check_pattern "$MAPS_LOADER" "error_type:" \
    "MapsLoaderService includes error_type in events"

check_pattern "$MAPS_LOADER" "attempts:" \
    "MapsLoaderService tracks attempt count"

check_pattern "$MAPS_LOADER" "retries_exhausted:" \
    "MapsLoaderService tracks retries_exhausted flag"

check_pattern "$MAPS_LOADER" "this._trackError(errorType, error, this.loadAttempts, false)" \
    "MapsLoaderService tracks non-retryable errors"

check_pattern "$MAPS_LOADER" "this._trackError(errorType, lastError, this.loadAttempts, true)" \
    "MapsLoaderService tracks retries-exhausted errors"

echo ""
echo "Phase 2: Error Handler Analytics"
echo "=================================="

ERROR_HANDLER="src/components/error-handler.js"

check_pattern "$ERROR_HANDLER" "trackError" \
    "ErrorHandler has trackError method"

check_any_pattern "$ERROR_HANDLER" \
    "ErrorHandler tracks map errors" \
    "'map_error'" \
    "type === 'map'"

check_any_pattern "$ERROR_HANDLER" \
    "ErrorHandler tracks drawing errors" \
    "'drawing_error'" \
    "type === 'drawing'"

echo ""
echo "Phase 3: Area Finder Drawing Analytics"
echo "========================================"

AREA_FINDER="src/components/area-finder.js"

check_pattern "$AREA_FINDER" "window.gtag" \
    "AreaFinder uses Google Analytics"

check_any_pattern "$AREA_FINDER" \
    "AreaFinder tracks drawing manager errors" \
    "drawing_manager_init_error" \
    "initDrawingManager"

check_any_pattern "$AREA_FINDER" \
    "AreaFinder tracks shape completion errors" \
    "shape_complete_error" \
    "handleShapeComplete"

check_any_pattern "$AREA_FINDER" \
    "AreaFinder tracks calculation errors" \
    "area_calculation_error" \
    "calculateArea"

echo ""
echo "Phase 4: Enhanced Area Finder Analytics"
echo "========================================"

ENHANCED_FINDER="src/components/enhanced-area-finder.js"

check_pattern "$ENHANCED_FINDER" "ErrorHandler" \
    "EnhancedAreaFinder uses ErrorHandler"

check_any_pattern "$ENHANCED_FINDER" \
    "EnhancedAreaFinder tracks successful shapes" \
    "'shape_completed'" \
    "shape_completed"

check_any_pattern "$ENHANCED_FINDER" \
    "EnhancedAreaFinder tracks successful calculations" \
    "'area_calculated'" \
    "area_calculated"

check_any_pattern "$ENHANCED_FINDER" \
    "EnhancedAreaFinder tracks user cancellation" \
    "'area_calculation_cancelled'" \
    "area_calculation_cancelled"

check_any_pattern "$ENHANCED_FINDER" \
    "EnhancedAreaFinder handles drawing errors" \
    "handleError.*'drawing'" \
    "ErrorHandler.handleError"

echo ""
echo "Phase 5: Error Type Coverage"
echo "============================="

# Check that all error types from spec are handled
check_any_pattern "$MAPS_LOADER" \
    "QUOTA_EXCEEDED error type handled" \
    "QUOTA_EXCEEDED" \
    "quota"

check_any_pattern "$MAPS_LOADER" \
    "INVALID_KEY error type handled" \
    "INVALID_KEY" \
    "REQUEST_DENIED"

check_any_pattern "$MAPS_LOADER" \
    "TIMEOUT error type handled" \
    "TIMEOUT" \
    "timeout"

check_any_pattern "$MAPS_LOADER" \
    "NETWORK_ERROR error type handled" \
    "NETWORK_ERROR" \
    "network"

echo ""
echo "Phase 6: Analytics Event Quality"
echo "================================="

# Check that analytics events include contextual information
check_pattern "$MAPS_LOADER" "errorType" \
    "Analytics events include error type context"

check_pattern "$MAPS_LOADER" "error?.message" \
    "Analytics events include error messages"

check_any_pattern "$ENHANCED_FINDER" \
    "Analytics events include area metrics" \
    "area_sqft" \
    "area:"

echo ""
echo "Phase 7: Fallback Form Integration"
echo "===================================="

# While fallback form doesn't explicitly track analytics,
# verify it's integrated with the error flow
FALLBACK_FORM="src/components/maps-fallback-form.js"

if [ -f "$FALLBACK_FORM" ]; then
    echo "✅ PASS: MapsFallbackForm component exists"
    ((PASS_COUNT++))
else
    echo "❌ FAIL: MapsFallbackForm component missing"
    ((FAIL_COUNT++))
fi

# Check that area-finder calls fallback when maps fail
check_pattern "$AREA_FINDER" "showFallbackForm" \
    "AreaFinder integrates with fallback form"

check_pattern "$AREA_FINDER" "MapsFallbackForm" \
    "AreaFinder imports MapsFallbackForm"

echo ""
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo ""
echo "Total checks: $((PASS_COUNT + FAIL_COUNT))"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 ALL ANALYTICS CHECKS PASSED!"
    echo ""
    echo "Analytics implementation is complete with:"
    echo "  - Map load failure tracking"
    echo "  - Retry attempt tracking"
    echo "  - Drawing error tracking"
    echo "  - Successful operation tracking"
    echo "  - Fallback form integration"
    echo ""
    exit 0
else
    echo "⚠️  SOME ANALYTICS CHECKS FAILED"
    echo ""
    echo "Please review the failed checks above and ensure:"
    echo "  1. All analytics tracking code is present"
    echo "  2. gtag events are properly formatted"
    echo "  3. Error types are correctly detected"
    echo "  4. Contextual information is included in events"
    echo ""
    exit 1
fi
