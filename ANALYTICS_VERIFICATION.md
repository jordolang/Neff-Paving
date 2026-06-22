# Analytics Verification Checklist
## Google Maps Estimate Flow - Analytics Events

This document provides a comprehensive checklist for verifying that all analytics events are properly logged for the hardened Google Maps estimate flow.

---

## Analytics Implementation Overview

Analytics tracking is implemented across the following files:
- **`src/services/maps-loader-service.js`** - Map load failures and retry attempts
- **`src/components/error-handler.js`** - General error tracking and drawing errors
- **`src/components/area-finder.js`** - Drawing operation errors
- **`src/components/enhanced-area-finder.js`** - Enhanced drawing operation errors

---

## Event Categories to Verify

### 1. Map Load Failures

**Location**: `src/services/maps-loader-service.js` → `_trackError()` method

**Events to verify in browser console**:

#### A. Non-retryable Errors (Quota/Key)
When the API key is invalid or quota is exceeded, these events should fire immediately:

```javascript
// Google Analytics Events
gtag('event', 'exception', {
  description: 'Maps API Error: INVALID_KEY',  // or QUOTA_EXCEEDED
  fatal: true  // true for non-retryable errors
})

gtag('event', 'maps_load_error', {
  error_type: 'INVALID_KEY',  // or 'QUOTA_EXCEEDED'
  attempts: 1,  // First attempt only, no retries
  retries_exhausted: false,  // Not retried
  error_message: '...'
})
```

**Custom Analytics Event**:
```javascript
// If custom analytics system exists (e.g., window.analytics.track)
{
  event: 'Maps API Load Error',
  properties: {
    errorType: 'INVALID_KEY',  // or 'QUOTA_EXCEEDED'
    errorMessage: '...',
    attempts: 1,
    retriesExhausted: false,
    retryable: false,
    timestamp: '...'
  }
}
```

**Test Scenarios**:
- ✅ Invalid API key (errorType: 'INVALID_KEY')
- ✅ Quota exceeded (errorType: 'QUOTA_EXCEEDED')

---

#### B. Retryable Errors (Network/Timeout)
When network or timeout errors occur, these events should fire after retries are exhausted:

```javascript
// Google Analytics Events
gtag('event', 'exception', {
  description: 'Maps API Error: TIMEOUT',  // or NETWORK_ERROR
  fatal: false  // false for retryable errors
})

gtag('event', 'maps_load_error', {
  error_type: 'TIMEOUT',  // or 'NETWORK_ERROR'
  attempts: 4,  // 1 initial + 3 retries
  retries_exhausted: true,
  error_message: '...'
})
```

**Test Scenarios**:
- ✅ Network offline (errorType: 'NETWORK_ERROR', attempts: 4)
- ✅ Slow network timeout (errorType: 'TIMEOUT', attempts: 4)

---

### 2. Fallback Form Usage

**Location**: `src/components/maps-fallback-form.js`

**Expected behavior**: When the fallback form is displayed, no explicit analytics event is tracked. However, the map load failure event (above) indicates fallback was triggered.

**Indirect verification**:
- Map load error event = Fallback form shown
- Form submission = User successfully used fallback

---

### 3. Drawing Errors

**Location**: 
- `src/components/area-finder.js`
- `src/components/enhanced-area-finder.js`

**Events to verify in browser console**:

#### A. Drawing Manager Initialization Errors
If the drawing manager fails to initialize:

```javascript
// Google Analytics Event (area-finder.js)
gtag('event', 'exception', {
  description: 'Drawing manager initialization failed',
  fatal: false
})

// OR ErrorHandler integration (enhanced-area-finder.js)
ErrorHandler.handleError('drawing', 'Drawing manager initialization failed', {
  component: 'EnhancedAreaFinder',
  method: 'initDrawingManager',
  error: error
})
```

**Test Scenario**:
- ✅ Trigger drawing manager initialization error (simulate by modifying code or API)

---

#### B. Shape Completion Errors
If shape drawing fails during completion:

```javascript
// Google Analytics Event (area-finder.js)
gtag('event', 'exception', {
  description: 'Shape completion failed: [shapeType]',
  fatal: false
})

// Enhanced version (enhanced-area-finder.js)
ErrorHandler.handleError('drawing', 'Shape completion failed', {
  component: 'EnhancedAreaFinder',
  method: 'handleShapeComplete',
  shapeType: 'polygon',  // or 'rectangle', 'circle'
  error: error
})
```

**Test Scenario**:
- ✅ Draw polygon with insufficient points
- ✅ Simulate shape completion error

---

#### C. Area Calculation Errors
If area calculation fails:

```javascript
// Google Analytics Events

// Validation error (< 3 points)
gtag('event', 'exception', {
  description: 'Area calculation failed: INSUFFICIENT_POINTS',
  fatal: false
})

// API error
gtag('event', 'exception', {
  description: 'Area calculation failed: API_ERROR',
  fatal: false
})

// Enhanced version tracks successful calculations too
gtag('event', 'area_calculated', {
  area_sqft: 5000,
  imagery_type: 'satellite',
  quality_score: 0.95
})

gtag('event', 'area_calculation_cancelled', {
  reason: 'user_cancelled',
  timestamp: '...'
})
```

**Test Scenarios**:
- ✅ Draw shape with < 3 points (validation error)
- ✅ Simulate geometry API failure
- ✅ Successfully calculate area (positive analytics event)
- ✅ User cancels calculation via confirmation dialog

---

### 4. Retry Attempts

**Location**: `src/services/maps-loader-service.js` → `_loadWithRetry()` method

**Expected behavior**: Each retry attempt is NOT individually tracked. Only the final outcome (success or exhausted retries) is tracked via the events above.

**Indirect verification**:
- Check `attempts` field in `maps_load_error` event
- For retryable errors: `attempts` should be 4 (1 initial + 3 retries)
- For non-retryable errors: `attempts` should be 1 (no retries)

---

## Verification Procedure

### Step 1: Enable Console Logging

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Clear console (click 🚫 icon or Cmd+K / Ctrl+L)
4. Enable "Preserve log" to keep logs across page reloads

---

### Step 2: Verify Map Load Failure Events

#### Test 1: Invalid API Key

1. Edit `src/config/maps.js` → Set `apiKey: 'INVALID_KEY'`
2. Reload estimate page: `http://localhost:5173/estimate`
3. **Expected console output**:

```
❌ Maps API Load Error
   errorType: "INVALID_KEY"
   attempts: 1
   retriesExhausted: false
   
✅ gtag event: exception
   description: "Maps API Error: INVALID_KEY"
   fatal: true
   
✅ gtag event: maps_load_error
   error_type: "INVALID_KEY"
   attempts: 1
   retries_exhausted: false
```

4. **Verification**:
   - [ ] `maps_load_error` event logged
   - [ ] `attempts` = 1 (no retries for invalid key)
   - [ ] `fatal` = true
   - [ ] Fallback form displayed

---

#### Test 2: Network Timeout

1. Restore API key in `src/config/maps.js`
2. Open DevTools → **Network** tab → Set to **"Offline"**
3. Reload estimate page
4. **Expected console output** (after ~40 seconds):

```
❌ Maps API Load Error
   errorType: "TIMEOUT" or "NETWORK_ERROR"
   attempts: 4
   retriesExhausted: true
   
✅ gtag event: exception
   description: "Maps API Error: TIMEOUT"
   fatal: false
   
✅ gtag event: maps_load_error
   error_type: "TIMEOUT"
   attempts: 4  // 1 initial + 3 retries
   retries_exhausted: true
```

5. **Verification**:
   - [ ] `maps_load_error` event logged
   - [ ] `attempts` = 4 (initial + 3 retries)
   - [ ] `retries_exhausted` = true
   - [ ] `fatal` = false
   - [ ] Fallback form displayed after retries

---

### Step 3: Verify Drawing Error Events

#### Test 1: Successful Map Load

1. Restore network (DevTools → Network → "No throttling")
2. Ensure valid API key in `src/config/maps.js`
3. Reload estimate page
4. Map should load successfully

---

#### Test 2: Successful Area Calculation

1. Draw a polygon on the map (3+ points)
2. Complete the shape (click starting point)
3. **Expected console output**:

```
✅ gtag event: shape_completed
   shape_type: "polygon"
   timestamp: "..."
   
✅ gtag event: area_calculated
   area_sqft: 5000
   imagery_type: "satellite"
   quality_score: 0.95
```

4. **Verification**:
   - [ ] `shape_completed` event logged
   - [ ] `area_calculated` event logged with area value
   - [ ] No error events logged

---

#### Test 3: Insufficient Points Error

1. Draw a polygon with < 3 points
2. Try to complete (this should be prevented by UI, but if forced)
3. **Expected console output**:

```
❌ gtag event: exception
   description: "Area calculation failed: INSUFFICIENT_POINTS"
   fatal: false
```

4. **Verification**:
   - [ ] Error event logged
   - [ ] User-friendly error message displayed

---

### Step 4: Verify Fallback Form Analytics

1. Set invalid API key (from Test 2-1)
2. Reload page → Fallback form appears
3. Fill out manual entry form
4. Click "Save Measurement"
5. **Expected behavior**:
   - Form submission works
   - No separate "fallback used" event (map load error already indicates this)
   - Estimate form shows manual entry data

6. **Verification**:
   - [ ] Map load error event triggered (indicates fallback shown)
   - [ ] No duplicate/redundant fallback events
   - [ ] Manual entry data stored correctly

---

### Step 5: Verify User Cancellation

1. Ensure valid API key and network
2. Reload page → Map loads
3. Draw a polygon
4. If confirmation dialog appears, click "Cancel"
5. **Expected console output**:

```
✅ gtag event: area_calculation_cancelled
   reason: "user_cancelled"
   timestamp: "..."
```

6. **Verification**:
   - [ ] Cancellation event logged
   - [ ] User returned to drawing mode

---

## Analytics Coverage Summary

| Event Type | Implementation File | gtag Event | Verified |
|-----------|-------------------|-----------|----------|
| **Map Load Failures** | | | |
| Invalid API Key | maps-loader-service.js | `exception`, `maps_load_error` | ⬜ |
| Quota Exceeded | maps-loader-service.js | `exception`, `maps_load_error` | ⬜ |
| Network Error | maps-loader-service.js | `exception`, `maps_load_error` | ⬜ |
| Timeout Error | maps-loader-service.js | `exception`, `maps_load_error` | ⬜ |
| **Drawing Operations** | | | |
| Shape Completed | enhanced-area-finder.js | `shape_completed` | ⬜ |
| Area Calculated | enhanced-area-finder.js | `area_calculated` | ⬜ |
| Drawing Manager Error | area-finder.js, enhanced-area-finder.js | `exception` | ⬜ |
| Shape Completion Error | area-finder.js, enhanced-area-finder.js | `exception` | ⬜ |
| Calculation Error | area-finder.js, enhanced-area-finder.js | `exception` | ⬜ |
| User Cancellation | enhanced-area-finder.js | `area_calculation_cancelled` | ⬜ |
| **Retry Logic** | | | |
| Retry Attempts Count | maps-loader-service.js | (via `attempts` field) | ⬜ |
| Retries Exhausted | maps-loader-service.js | (via `retries_exhausted` field) | ⬜ |

---

## Verification Results

**Date**: _________________  
**Tester**: _________________  

### Map Load Failures
- [ ] Invalid API Key - Events logged correctly
- [ ] Quota Exceeded - Events logged correctly
- [ ] Network Error - Events logged correctly (4 attempts)
- [ ] Timeout Error - Events logged correctly (4 attempts)

### Drawing Operations
- [ ] Successful shape completion - Event logged
- [ ] Successful area calculation - Event logged
- [ ] Drawing errors - Event logged
- [ ] User cancellation - Event logged

### Retry Logic
- [ ] Non-retryable errors have `attempts: 1`
- [ ] Retryable errors have `attempts: 4`
- [ ] `retries_exhausted` flag is correct

### Overall Assessment
- [ ] All required analytics events are present
- [ ] Event data includes necessary context (error type, attempts, etc.)
- [ ] No console errors during testing
- [ ] Analytics work in both normal and fallback modes

---

## Notes

- **Google Analytics Setup**: Ensure `window.gtag` is available in the browser console. If not present, analytics events won't fire but application will still work.
- **Custom Analytics**: If using a custom analytics system (e.g., Segment, Mixpanel), check for `window.analytics.track()` calls in addition to gtag.
- **Event Naming**: All events use consistent naming conventions (`maps_load_error`, `area_calculated`, etc.)
- **Error Context**: Events include rich context (error type, attempts, retryable status) for debugging

---

## Troubleshooting

### Analytics Events Not Appearing

1. **Check gtag availability**:
   ```javascript
   // In browser console
   typeof window.gtag
   // Should return 'function', not 'undefined'
   ```

2. **Check console for errors**:
   - Look for JavaScript errors that might prevent analytics code from running
   - Verify all files are loaded correctly (Network tab)

3. **Verify analytics code is reached**:
   - Add temporary console.log before gtag calls to ensure code path is executed
   - Check that error conditions are actually triggered

### Map Not Loading

1. Verify API key is correct in `src/config/maps.js`
2. Check browser console for specific error messages
3. Verify network connection
4. Check Google Cloud Console for API quota/billing issues

### Drawing Tools Not Working

1. Ensure map loaded successfully first
2. Check that Google Maps drawing library is included
3. Verify no JavaScript errors in console
4. Test with simple shapes (rectangle) before complex polygons

---

## Acceptance Criteria Mapping

This verification directly addresses the acceptance criterion:

> **"Drawing tool errors are logged to analytics for monitoring"**

Additionally verifies:
- Map load failures are logged
- Retry attempts are tracked
- Fallback usage is indicated via map load error events
- Successful operations are tracked for insights

**Status**: ⬜ PENDING / ✅ VERIFIED / ❌ FAILED

---

## Next Steps

After completing this verification:

1. Check all boxes in "Analytics Coverage Summary" table
2. Fill out "Verification Results" section
3. Document any issues found in build-progress.txt
4. Update implementation_plan.json:
   - Set `subtask-5-2` status to `"completed"`
   - Add verification notes
5. If issues found, create follow-up tasks
6. Commit verification documentation

---

## Related Documentation

- **E2E Verification Guide**: `E2E_VERIFICATION_GUIDE.md` - Comprehensive end-to-end testing
- **Verification Script**: `verify-implementation.sh` - Automated code verification
- **Implementation Plan**: `.auto-claude/specs/004-harden-the-google-maps-estimate-flow/implementation_plan.json`
- **Spec**: `.auto-claude/specs/004-harden-the-google-maps-estimate-flow/spec.md`
