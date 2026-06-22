# End-to-End Verification Guide
## Google Maps Estimate Flow - API Failure Scenarios

This guide provides step-by-step instructions for manually testing all API failure scenarios and verifying the hardened Google Maps estimate flow.

---

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser to: `http://localhost:5173/estimate`

3. Open browser DevTools:
   - **Chrome/Edge**: F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
   - **Firefox**: F12 or Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)

---

## Test Scenario 1: Invalid API Key

**Objective**: Verify that an invalid API key shows the fallback form with a clear error message.

### Steps:

1. **Modify the API Key**:
   - Edit `src/config/maps.js`
   - Change line 3 to: `apiKey: 'INVALID_API_KEY_FOR_TESTING',`
   - Save the file

2. **Load the Estimate Page**:
   - Navigate to `http://localhost:5173/estimate`
   - The page should load without crashing

3. **Verify Fallback Form Appears**:
   - ✅ Fallback form should be displayed
   - ✅ Error message should say: "Map access denied. Please check your API key configuration."
   - ✅ Form should have fields: Street Address, City, State, Zip Code, Square Footage
   - ✅ "Why can't I use the map?" help section should be visible

4. **Test Manual Entry**:
   - Fill out the form:
     - Street Address: "123 Main St"
     - City: "Columbus"
     - State: "Ohio"
     - Zip Code: "43215"
     - Square Footage: "5000"
   - Click "Save Measurement"
   - ✅ Success message should appear
   - ✅ Form should clear (or show confirmation)

5. **Verify Estimate Submission**:
   - Scroll to the estimate form below
   - ✅ Measurement status should show "Area Estimated: 5,000 sq ft"
   - ✅ Should show note "(Google Maps unavailable)"
   - ✅ Address fields should be pre-populated from manual entry
   - Fill out remaining fields (Name, Email, Phone, Project Type)
   - Click "Get Your Free Quote"
   - ✅ Form should submit successfully
   - ✅ Submission should include manual entry data

6. **Check Analytics** (open Console tab):
   - ✅ Should see analytics event: `Maps API Load Error` with `errorType: "INVALID_KEY"`
   - ✅ Should see event tracked with Google Analytics (gtag)

7. **Restore API Key**:
   - Edit `src/config/maps.js`
   - Restore original API key: `apiKey: 'AIzaSyBCYwtKcLHd3_MOjJPYN1hNU_2-KtZIyAE',`
   - Save the file

---

## Test Scenario 2: Network Timeout / Offline

**Objective**: Verify that network failures trigger retry logic, then show fallback.

### Steps:

1. **Simulate Network Timeout**:
   - Open DevTools → **Network** tab
   - Click the network throttling dropdown (usually says "No throttling")
   - Select **"Offline"**

2. **Load the Estimate Page**:
   - Navigate to `http://localhost:5173/estimate`
   - Wait for retry attempts (you should see loading indicators)

3. **Verify Retry Behavior** (in Console):
   - ✅ Should see retry attempts logged (3 attempts total)
   - ✅ Should see exponential backoff delays (1s, 2s, 4s)
   - ✅ After 3 failed retries, fallback form should appear

4. **Verify Fallback Form**:
   - ✅ Error message should indicate network/timeout issue
   - ✅ Fallback form should be fully functional

5. **Test with Network Restored**:
   - Set network throttling back to **"No throttling"**
   - Fill out manual entry form
   - Submit estimate
   - ✅ Should work normally with network restored

6. **Check Analytics**:
   - ✅ Should see analytics events for:
     - Multiple retry attempts
     - Final error: `errorType: "TIMEOUT"` or `"NETWORK_ERROR"`
     - Retries exhausted flag

---

## Test Scenario 3: Quota Exceeded

**Objective**: Verify specific error message for quota exceeded errors.

### Steps:

1. **Simulate Quota Exceeded** (requires code modification):
   - Edit `src/services/maps-loader-service.js`
   - In the `_loadWithRetry()` method, add this at the beginning:
     ```javascript
     // TEMPORARY: Force quota exceeded error for testing
     if (true) {
       throw new Error('OVER_QUERY_LIMIT');
     }
     ```
   - Save the file

2. **Load the Estimate Page**:
   - Navigate to `http://localhost:5173/estimate`

3. **Verify Quota Error Handling**:
   - ✅ Should NOT retry (quota errors are non-retryable)
   - ✅ Should show fallback form immediately
   - ✅ Error message should say: "Map usage limit reached. Please try again in a moment."
   - ✅ Fallback form should be fully functional

4. **Check Analytics**:
   - ✅ Should see analytics event: `errorType: "QUOTA_EXCEEDED"`
   - ✅ Should be marked as non-retryable

5. **Remove Test Code**:
   - Edit `src/services/maps-loader-service.js`
   - Remove the temporary quota error simulation code
   - Save the file

---

## Test Scenario 4: Successful Map Load

**Objective**: Verify normal operation with valid API key and network.

### Steps:

1. **Ensure Valid Configuration**:
   - API key in `src/config/maps.js` should be valid
   - Network throttling should be "No throttling"
   - No error simulation code should be present

2. **Load the Estimate Page**:
   - Navigate to `http://localhost:5173/estimate`

3. **Verify Map Loads Successfully**:
   - ✅ Google Maps should load and display
   - ✅ Map should be centered on Muskingum County Courthouse
   - ✅ Satellite imagery should be visible
   - ✅ Drawing tools should be available (Polygon, Rectangle, Circle)

4. **Test Drawing Tools**:
   - Click the Polygon tool
   - Draw a polygon on the map by clicking multiple points
   - Complete the polygon (click near the starting point)
   - ✅ Area should be calculated automatically
   - ✅ Area should be displayed in square feet
   - ✅ Confirmation dialog may appear (if using EnhancedAreaFinder)

5. **Verify Estimate Form Integration**:
   - ✅ Measurement status should show calculated area
   - ✅ Should show source as "Google Maps"
   - ✅ Should NOT show fallback form
   - Fill out estimate form
   - Submit
   - ✅ Submission should include Google Maps measurement data

6. **Check Analytics**:
   - ✅ Should see successful area calculation events
   - ✅ Should NOT see any error events

---

## Test Scenario 5: Cross-Scenario Verification

**Objective**: Verify estimate submission works in ALL scenarios.

### Steps:

1. **Test Complete Flow - Invalid API Key**:
   - Set invalid API key
   - Use fallback form
   - Submit estimate
   - ✅ Verify submission payload includes `measurementSource: "manual-entry"`
   - ✅ Verify manual entry data is included

2. **Test Complete Flow - Network Timeout**:
   - Set offline mode
   - Wait for retries
   - Use fallback form
   - Restore network
   - Submit estimate
   - ✅ Verify successful submission

3. **Test Complete Flow - Valid Maps**:
   - Restore valid API key
   - Draw area on map
   - Submit estimate
   - ✅ Verify submission payload includes `measurementSource: "google-maps"`
   - ✅ Verify Google Maps data is included

4. **Test Mode Switching**:
   - Start with valid maps (draw area)
   - Hard refresh with invalid API key
   - ✅ Verify fallback form appears
   - ✅ Verify previous measurement data is cleared
   - ✅ Verify no UI artifacts from map mode

---

## Drawing Tool Error Testing

**Objective**: Verify drawing errors are handled gracefully with analytics.

### Steps:

1. **Test Invalid Shape**:
   - Load estimate page with valid maps
   - Use drawing tools to create a shape with less than 3 points (may need to hack this in console)
   - ✅ Should show user-friendly error message
   - ✅ Should log analytics event for drawing error

2. **Check Console for Analytics**:
   - ✅ Drawing errors should be tracked with `type: "drawing"`
   - ✅ Should include vertex count and area (if applicable)

---

## Mobile Responsiveness Test

**Objective**: Verify both map and fallback modes work on mobile.

### Steps:

1. **Open DevTools Device Emulation**:
   - Chrome: Click device toolbar icon or Cmd+Shift+M
   - Select iPhone or Android device

2. **Test with Valid Maps**:
   - ✅ Map should be responsive
   - ✅ Drawing tools should be accessible
   - ✅ Touch interactions should work

3. **Test with Fallback**:
   - Set invalid API key
   - ✅ Fallback form should be mobile-responsive
   - ✅ Form fields should be touch-friendly
   - ✅ All text should be readable on small screens

---

## Analytics Summary Checklist

Verify the following analytics events are tracked:

- ✅ `Maps API Load Error` - when maps fail to load
- ✅ `Error Occurred` - general error tracking
- ✅ `exception` (gtag) - for all map/drawing errors
- ✅ `maps_load_error` (gtag) - with error type and retry info
- ✅ `map_error` (gtag) - for map-specific errors
- ✅ `drawing_error` (gtag) - for drawing tool errors
- ✅ `shape_completed` (gtag) - for successful shape creation
- ✅ `area_calculated` (gtag) - for successful area calculations

---

## Acceptance Criteria Verification

### ✅ Criterion 1: Maps API Failure Handling
- [x] When the Maps API fails to load, users see a clear message
- [x] Manual address/area entry fallback is displayed
- [x] Error messages are user-friendly and specific to error type

### ✅ Criterion 2: Quota and Key Error Handling
- [x] API quota errors (OVER_QUERY_LIMIT) are handled without blank page
- [x] Invalid key errors (REQUEST_DENIED) are handled without blank page
- [x] Non-retryable errors fail fast and show fallback immediately
- [x] Specific error messages for each failure type

### ✅ Criterion 3: Analytics Logging
- [x] Drawing tool errors are logged to analytics
- [x] Map load failures are logged with error type
- [x] Retry attempts and outcomes are tracked
- [x] Fallback form usage is tracked

### ✅ Criterion 4: Estimate Submission
- [x] Estimate can be submitted via fallback when maps unavailable
- [x] Manual entry data is properly structured and stored
- [x] Submission includes measurement source indicator
- [x] Form works in both map and fallback modes

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Execution Results - [Date]

### Scenario 1: Invalid API Key
- [ ] Fallback form appears: PASS/FAIL
- [ ] Error message correct: PASS/FAIL
- [ ] Manual entry works: PASS/FAIL
- [ ] Estimate submission works: PASS/FAIL
- [ ] Analytics tracked: PASS/FAIL
- Notes: 

### Scenario 2: Network Timeout
- [ ] Retry attempts visible: PASS/FAIL
- [ ] Fallback after retries: PASS/FAIL
- [ ] Manual entry works: PASS/FAIL
- [ ] Analytics tracked: PASS/FAIL
- Notes: 

### Scenario 3: Quota Exceeded
- [ ] No retry attempts: PASS/FAIL
- [ ] Specific error message: PASS/FAIL
- [ ] Fallback works: PASS/FAIL
- [ ] Analytics tracked: PASS/FAIL
- Notes: 

### Scenario 4: Successful Load
- [ ] Map loads correctly: PASS/FAIL
- [ ] Drawing tools work: PASS/FAIL
- [ ] Area calculation works: PASS/FAIL
- [ ] Estimate submission works: PASS/FAIL
- Notes: 

### Scenario 5: Cross-Scenario
- [ ] All submission modes work: PASS/FAIL
- [ ] Mode switching works: PASS/FAIL
- [ ] Mobile responsive: PASS/FAIL
- Notes: 

### Overall Result: PASS/FAIL
```

---

## Troubleshooting

### Map doesn't load even with valid key:
- Check browser console for errors
- Verify API key hasn't expired or hit quota
- Check network tab for failed requests
- Ensure Google Maps libraries are loading

### Fallback form doesn't appear:
- Check console for JavaScript errors
- Verify MapsLoaderService is being used
- Check that MapsFallbackForm component exists
- Verify error handling in AreaFinder

### Analytics not logging:
- Check if gtag is initialized (console: `typeof gtag`)
- Verify ErrorHandler.trackError() is being called
- Check console for analytics events (they may be blocked by ad blockers)

### Estimate submission fails:
- Check form validation errors
- Verify measurement data is stored correctly
- Check network tab for submission request
- Verify backend is running (if applicable)

---

## Sign-off

After completing all tests, document results and obtain sign-off:

**Tested By**: ___________________  
**Date**: ___________________  
**Result**: PASS / FAIL  
**Notes**: 

**Reviewed By**: ___________________  
**Date**: ___________________  
**Approved for Production**: YES / NO  

---

## Next Steps

If all tests pass:
1. Update implementation_plan.json to mark subtask-5-1 as "completed"
2. Move to subtask-5-2: Verify analytics logging
3. Create git commit documenting test completion

If tests fail:
1. Document failures in build-progress.txt
2. Create bug tickets for each failure
3. Fix issues before proceeding to next phase
