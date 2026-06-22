# End-to-End Funnel Verification Guide

## Overview

This document provides a comprehensive checklist for verifying that all analytics events in the estimate-to-booking funnel are firing correctly with the expected properties.

## Prerequisites

- Development server running (`npm run dev`)
- Browser with Developer Tools (Chrome/Firefox/Safari)
- Network tab ready to monitor requests
- Console tab ready to monitor logs

## Setup Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Enable debug mode** (optional but recommended):
   - Open browser console
   - Run: `localStorage.setItem('analytics_debug', 'true')`
   - Refresh the page
   - You should see analytics debug logs in the console

3. **Open Network tab:**
   - Press F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
   - Go to Network tab
   - Filter by 'vercel' or 'analytics' to see only analytics requests

4. **Clear existing session data:**
   ```javascript
   // Run in console to start with clean state
   sessionStorage.clear();
   localStorage.removeItem('measurementData');
   ```

## Verification Checklist

### Step 1: Homepage Visit

**Action:** Navigate to `http://localhost:3000/`

**Expected Event:** `page_visit`

**Verification:**
- [ ] Event fires on page load
- [ ] Network tab shows analytics request to Vercel
- [ ] Console shows debug log (if debug mode enabled)

**Expected Properties:**
```javascript
{
  page_type: "homepage",
  has_measurement_data: false,
  referrer: document.referrer,
  timestamp: <ISO timestamp>,
  url: "http://localhost:3000/",
  userAgent: <browser user agent>
}
```

**How to verify:**
- Open Network tab, filter by 'vercel' or 'analytics'
- Look for POST request to Vercel Analytics endpoint
- Check request payload contains event name and properties
- If debug mode enabled, check console for: `[Analytics] Tracking page_view: ...`

---

### Step 2: Estimate Form Page Visit

**Action:** Navigate to `http://localhost:3000/estimate-form.html`

**Expected Event:** `page_visit`

**Verification:**
- [ ] Event fires on page load
- [ ] Network tab shows analytics request
- [ ] Page type is "estimate-form"

**Expected Properties:**
```javascript
{
  page_type: "estimate-form",
  has_measurement_data: false, // or true if carried over from session
  referrer: "http://localhost:3000/", // previous page
  timestamp: <ISO timestamp>,
  url: "http://localhost:3000/estimate-form.html",
  userAgent: <browser user agent>
}
```

**How to verify:**
- Same as Step 1
- Note that `has_measurement_data` may be `true` if you've previously drawn on the map in this session

---

### Step 3: Estimate Started

**Action:** Click into the first form field (e.g., First Name input)

**Expected Event:** `estimate_started`

**Verification:**
- [ ] Event fires on first field focus
- [ ] Event fires only ONCE (subsequent field focuses should NOT trigger it)
- [ ] Network tab shows analytics request
- [ ] Console shows debug log

**Expected Properties:**
```javascript
{
  first_field: "firstName", // or the ID/name of the field you focused
  has_measurement_data: false, // or true if map measurement exists
  timestamp: <ISO timestamp>
}
```

**How to verify:**
- Focus the first form field (firstName input)
- Check Network tab for new analytics request
- If debug mode enabled, check console for: `[Analytics] Tracking estimate_started: ...`
- Try focusing another field - NO new event should fire

**Common Issues:**
- If event fires multiple times, check `hasTrackedEstimateStarted` flag logic in estimate-form.js
- If event doesn't fire, check focus event listener is attached

---

### Step 4: Area Measured

**Action:** Draw an area on the map measurement tool

**Steps:**
1. Scroll to the "Measure Your Area" section
2. Click the map to start drawing
3. Click multiple points to create a polygon
4. Complete the measurement (double-click or click first point)
5. The measurement should display and be saved

**Expected Event:** `area_measured`

**Verification:**
- [ ] Event fires after measurement completes
- [ ] Network tab shows analytics request
- [ ] Event includes square footage and measurement data
- [ ] Console shows debug log

**Expected Properties:**
```javascript
{
  square_footage: <number>, // e.g., 5000
  area_acres: <number>,     // e.g., 0.11
  perimeter_ft: <number>,   // e.g., 320
  measurement_tool: "google-maps",
  timestamp: <ISO timestamp>
}
```

**How to verify:**
- Draw area on map and complete the measurement
- Check Network tab for new analytics request immediately after completion
- If debug mode enabled, check console for: `[Analytics] Tracking area_measured: ...`
- Verify the square_footage value matches what's displayed on screen

**Common Issues:**
- Event doesn't fire: Check if `trackAreaMeasured()` is called in `calculateArea()` method
- Missing properties: Verify measurement data is being captured correctly

---

### Step 5: Estimate Submitted

**Action:** Complete and submit the estimate form

**Steps:**
1. Fill in all required fields:
   - First Name
   - Last Name
   - Email
   - Phone
   - Address
   - City
   - State
   - Zip Code
   - Service Type (select one)
   - Additional Notes (optional)
2. Ensure area measurement is complete (from Step 4)
3. Click "Submit Request" button
4. Wait for success message

**Expected Event:** `estimate_submitted`

**Verification:**
- [ ] Event fires after successful form submission
- [ ] Network tab shows analytics request
- [ ] Event includes reference number and estimate data
- [ ] Console shows debug log

**Expected Properties:**
```javascript
{
  reference_number: <string>,    // e.g., "EST-20260622-ABC123"
  service_type: <string>,        // e.g., "asphalt-paving"
  square_footage: <number>,      // from map measurement
  estimated_cost: <number>,      // from backend response
  has_measurement_data: true,
  measurement_tool: "google-maps",
  customer_email: <string>,      // sanitized (hashed or domain only)
  customer_state: <string>,      // e.g., "CA"
  timestamp: <ISO timestamp>
}
```

**How to verify:**
- Submit the complete form
- Wait for success message to appear
- Check Network tab for analytics request immediately after submission
- If debug mode enabled, check console for: `[Analytics] Tracking estimate_submitted: ...`
- Verify reference_number is included in the event properties

**Common Issues:**
- Event doesn't fire: Check if form submission was successful (backend returned 200)
- Missing properties: Verify `trackEstimateSubmitted()` is called in `handleSubmitSuccess()`

---

### Step 6: Consultation Booked (Optional)

**Action:** Schedule a Calendly appointment

**Prerequisites:**
- Complete Steps 1-5 first
- Calendly scheduling widget should appear after estimate submission

**Steps:**
1. After submitting estimate, the Calendly widget should appear
2. Select a date and time
3. Fill in your details (if prompted)
4. Confirm the booking

**Expected Event:** `consultation_booked`

**Verification:**
- [ ] Event fires when Calendly appointment is confirmed
- [ ] Network tab shows analytics request
- [ ] Event includes consultation details
- [ ] Console shows debug log

**Expected Properties:**
```javascript
{
  contract_id: <string>,           // or estimate reference number
  calendly_event_uri: <string>,    // Calendly event URI
  scheduled_time: <ISO timestamp>, // appointment date/time
  end_time: <ISO timestamp>,       // appointment end time
  client_name: <string>,           // from Calendly
  client_email: <string>,          // from Calendly
  meeting_type: <string>,          // "consultation"
  service_type: <string>,          // from estimate
  estimated_cost: <number>,        // from estimate
  timestamp: <ISO timestamp>
}
```

**How to verify:**
- Complete the Calendly booking flow
- Check Network tab for analytics request after confirmation
- If debug mode enabled, check console for: `[Analytics] Tracking consultation_booked: ...`
- Event should fire when Calendly webhook message is received

**Common Issues:**
- Event doesn't fire: Check if Calendly widget is properly initialized
- Missing properties: Verify webhook handler is receiving Calendly event data

**Note:** This step requires actual Calendly integration to be active. In development, Calendly events may not fire without proper configuration.

---

### Step 7: Payment Complete (Optional)

**Action:** Complete a Stripe payment

**Prerequisites:**
- Complete Steps 1-6 first
- Payment form should be available after consultation booking

**Steps:**
1. Navigate to payment page (if redirected) or payment form
2. Enter test card details:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
3. Submit payment
4. Wait for payment confirmation

**Expected Event:** `payment_complete`

**Verification:**
- [ ] Event fires when payment succeeds
- [ ] Network tab shows analytics request
- [ ] Event includes payment details
- [ ] Console shows debug log

**Expected Properties:**
```javascript
{
  payment_id: <string>,          // Stripe payment intent ID
  amount: <number>,              // payment amount in cents
  currency: "usd",
  status: "succeeded",
  payment_method: <string>,      // e.g., "card"
  metadata: {
    contract_id: <string>,
    service_type: <string>,
    // ... other metadata
  },
  timestamp: <ISO timestamp>
}
```

**How to verify:**
- Complete the payment flow with test card
- Check Network tab for analytics request after payment confirmation
- If debug mode enabled, check console for: `[Analytics] Tracking payment_complete: ...`
- Event should fire when Stripe payment succeeds

**Common Issues:**
- Event doesn't fire: Check if payment was successful (Stripe returned succeeded status)
- Missing properties: Verify `confirmPayment()` or `handlePaymentSuccess()` is tracking the event

**Note:** This step requires Stripe integration to be active. In development, you'll need:
- Valid Stripe test API keys configured
- Test mode enabled
- Payment intent created successfully

---

## Vercel Analytics Dashboard Verification

After completing all manual steps above, verify that events appear in the Vercel Analytics dashboard:

### Access the Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in to your account
3. Select the Neff Paving project
4. Click the "Analytics" tab
5. Navigate to "Events" or "Custom Events"

### Verify Events

**Check for all funnel events:**
- [ ] `page_visit` - Should show multiple events (homepage + estimate form)
- [ ] `estimate_started` - Should show 1 event
- [ ] `area_measured` - Should show 1 event
- [ ] `estimate_submitted` - Should show 1 event
- [ ] `consultation_booked` - Should show 1 event (if Step 6 completed)
- [ ] `payment_complete` - Should show 1 event (if Step 7 completed)

**For each event, verify:**
- [ ] Event name is correct
- [ ] Event count matches your test sessions
- [ ] Event properties contain expected data
- [ ] Timestamps are recent and accurate
- [ ] No PII (names, emails, addresses) in event properties

### Calculate Funnel Conversion Rates

Use the event counts to calculate conversion rates:

```
Conversion Rates:
- Visit → Started:    (estimate_started / page_visit_estimate_form) * 100%
- Started → Measured: (area_measured / estimate_started) * 100%
- Measured → Submit:  (estimate_submitted / area_measured) * 100%
- Submit → Booking:   (consultation_booked / estimate_submitted) * 100%
- Booking → Payment:  (payment_complete / consultation_booked) * 100%

Overall Conversion Rate:
- Visit → Payment:    (payment_complete / page_visit_total) * 100%
```

**Example:**
```
If you have:
- 10 page visits
- 8 estimate_started
- 7 area_measured
- 6 estimate_submitted
- 4 consultation_booked
- 3 payment_complete

Then:
- Visit → Started:    80%
- Started → Measured: 87.5%
- Measured → Submit:  85.7%
- Submit → Booking:   66.7%
- Booking → Payment:  75%
- Overall:            30%
```

---

## Troubleshooting

### Events Not Appearing in Network Tab

**Possible Causes:**
1. Analytics service not initialized
2. Localhost analytics disabled (this is expected behavior)
3. Network filter too restrictive

**Solutions:**
1. Check console for initialization messages
2. Enable debug mode: `localStorage.setItem('analytics_debug', 'true')`
3. Remove network filters and look for all requests
4. Check if Vercel Analytics is actually loaded: `console.log(typeof window.va)`

### Events Not Appearing in Dashboard

**Possible Causes:**
1. Events only tracked in production (localhost disabled)
2. Time delay before events appear in dashboard
3. Project not properly configured in Vercel

**Solutions:**
1. Deploy to production/staging and test there
2. Wait 5-10 minutes for events to propagate
3. Verify Vercel Analytics is enabled for the project
4. Check Vercel project settings and domain configuration

### Duplicate Events Firing

**Possible Causes:**
1. Event listener attached multiple times
2. Component initialized multiple times
3. Debug mode causing double logging

**Solutions:**
1. Check for duplicate event listeners in code
2. Ensure components are only initialized once
3. Add one-time flags (like `hasTrackedEstimateStarted`) for single-fire events

### Missing Event Properties

**Possible Causes:**
1. Data not available at time of tracking
2. Property name typo
3. Data retrieval logic failing silently

**Solutions:**
1. Add console.log before tracking to verify data exists
2. Check property names match expected schema
3. Add error handling around data retrieval
4. Use optional chaining: `data?.property`

### Console Errors

**Possible Issues:**
- `analyticsService is not defined` → Import missing or incorrect
- `Cannot read property 'track' of undefined` → Service not initialized
- `Network error` → Analytics endpoint unreachable
- `CORS error` → Vercel Analytics configuration issue

**Solutions:**
1. Verify all imports are correct
2. Check service initialization in main.js
3. Check network connectivity
4. Verify Vercel project domain configuration

---

## Privacy Compliance Verification

After testing all events, verify that no PII is being tracked:

**What we DON'T track (must be absent from all events):**
- [ ] Full customer names
- [ ] Email addresses (unless hashed or domain-only)
- [ ] Phone numbers
- [ ] Street addresses
- [ ] IP addresses (explicitly)
- [ ] Payment card details

**What we DO track (should be present):**
- [ ] Event names and timestamps
- [ ] Page types and URLs
- [ ] Square footage and measurements
- [ ] Service types and costs
- [ ] State/region (not full address)
- [ ] Reference numbers (anonymized IDs)
- [ ] Browser/device metadata (user agent)

**Privacy Policy Alignment:**
Verify that the implementation matches the privacy policy statement:
> "We use privacy-friendly analytics via Vercel to understand how visitors use our site."

Reference: `privacy.html`

---

## Sign-off Checklist

Before marking this verification as complete, confirm:

- [ ] All 7 steps completed (Steps 1-5 required, 6-7 optional but recommended)
- [ ] All required events fire correctly (page_visit, estimate_started, area_measured, estimate_submitted)
- [ ] Optional events fire when triggered (consultation_booked, payment_complete)
- [ ] All event properties contain expected data
- [ ] No console errors related to analytics
- [ ] No duplicate events (except page_visit which fires on each page)
- [ ] Vercel Analytics dashboard shows events (may require production deployment)
- [ ] Privacy compliance verified (no PII in events)
- [ ] Conversion funnel calculable from event data
- [ ] Documentation reviewed and updated if needed

---

## Next Steps

After completing this verification:

1. **Document any issues found** in build-progress.txt
2. **Fix any failing verifications** before proceeding
3. **Update implementation_plan.json** to mark subtask-4-2 as "completed"
4. **Proceed to subtask-4-3** (Privacy policy alignment verification)
5. **Prepare for production deployment** to verify events in live environment

---

## Related Documentation

- [Analytics Dashboard Access Guide](./ANALYTICS_DASHBOARD.md)
- [Analytics Configuration](../src/config/analytics-config.js)
- [Analytics Service](../src/services/analytics-service.js)
- [Privacy Policy](../privacy.html)

---

**Last Updated:** 2026-06-22  
**Version:** 1.0  
**Maintainer:** Development Team
