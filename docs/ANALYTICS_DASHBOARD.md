# Vercel Analytics Dashboard Access Guide

## Overview

This document provides instructions for accessing and using the Vercel Analytics dashboard to monitor the estimate-to-booking funnel for Neff Paving.

## What We Track

The application tracks a complete conversion funnel from initial page visit through payment completion:

1. **page_visit** - User lands on the homepage or estimate form
2. **estimate_started** - User begins filling out the estimate form
3. **area_measured** - User completes area measurement on the map
4. **estimate_submitted** - User submits a completed estimate request
5. **consultation_booked** - User schedules a Calendly consultation
6. **payment_complete** - User completes payment via Stripe

## Accessing the Vercel Analytics Dashboard

### Prerequisites

- You must have access to the Vercel project for Neff Paving
- You must be logged into your Vercel account

### Steps to Access

1. **Navigate to Vercel Dashboard**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign in with your Vercel account credentials

2. **Select the Neff Paving Project**
   - From your dashboard, click on the Neff Paving project
   - If you have multiple projects, use the search or filter to find it

3. **Open Analytics Tab**
   - In the project dashboard, click on the **"Analytics"** tab in the navigation menu
   - This will show you the Vercel Analytics overview

4. **View Custom Events**
   - Within the Analytics tab, look for the **"Events"** or **"Custom Events"** section
   - Here you'll see all the funnel events being tracked

## Funnel Events Reference

### 1. page_visit

**When it fires:** On page load (homepage, estimate form, etc.)

**Properties tracked:**
- `page_type` - Type of page (e.g., "estimate-form", "homepage")
- `has_measurement_data` - Whether measurement data exists in session
- `referrer` - Where the user came from
- `timestamp` - Event timestamp
- `url` - Current page URL
- `userAgent` - Browser user agent

**What to look for:**
- Total page visits as the top-of-funnel metric
- Referrer sources to understand traffic origins
- Drop-off between homepage visits and estimate form visits

### 2. estimate_started

**When it fires:** When user focuses any form field for the first time

**Properties tracked:**
- `first_field` - Name of the first field the user interacted with
- `has_measurement_data` - Whether area measurement exists
- `timestamp` - Event timestamp

**What to look for:**
- Conversion rate from page_visit to estimate_started
- Which form field users typically start with
- Time between page visit and form interaction

### 3. area_measured

**When it fires:** When user completes drawing an area on the map

**Properties tracked:**
- `square_footage` - Measured area in square feet
- `area_acres` - Measured area in acres
- `perimeter_ft` - Perimeter in feet
- `measurement_tool` - Always "google-maps"
- `timestamp` - Event timestamp

**What to look for:**
- What percentage of users who start the form actually measure an area
- Distribution of property sizes (square footage)
- Drop-off after area measurement (users who measure but don't submit)

### 4. estimate_submitted

**When it fires:** When user successfully submits the estimate form

**Properties tracked:**
- `reference_number` - Unique estimate reference number
- `service_type` - Type of service requested
- `square_footage` - Measured area
- `estimated_cost` - Cost estimate from backend
- `has_measurement_data` - Whether measurement was included
- `measurement_tool` - Tool used for measurement
- `customer_state` - State/region (if applicable)
- `timestamp` - Event timestamp

**Privacy note:** Customer email is NOT tracked (excluded for privacy compliance)

**What to look for:**
- Conversion rate from estimate_started to estimate_submitted
- Most popular service types
- Average property size for submitted estimates
- Estimated cost distribution

### 5. consultation_booked

**When it fires:** When user completes Calendly appointment scheduling

**Properties tracked:**
- `contract_id` - Associated contract ID
- `calendly_event_uri` - Calendly event reference
- `scheduled_time` - Appointment date/time
- `end_time` - Appointment end time
- `meeting_type` - Type of consultation
- `service_type` - Service from estimate
- `estimated_cost` - Cost from estimate
- `timestamp` - Event timestamp

**What to look for:**
- Conversion rate from estimate_submitted to consultation_booked
- Time between estimate submission and booking
- Most popular consultation times
- Correlation between estimated cost and booking rate

### 6. payment_complete

**When it fires:** When user successfully completes Stripe payment

**Properties tracked:**
- `payment_id` - Stripe payment intent ID
- `amount` - Payment amount (in cents)
- `currency` - Payment currency (typically USD)
- `status` - Payment status (typically "succeeded")
- `payment_method` - Payment method type
- `source` - Event source ("client" or "webhook")
- `timestamp` - Event timestamp

**What to look for:**
- Final conversion rate (page_visit → payment_complete)
- Average payment amounts
- Payment success rate
- Time from consultation booking to payment

## Analyzing the Funnel

### Calculating Conversion Rates

To analyze funnel performance, calculate conversion rates between stages:

```
Stage 1→2: (estimate_started / page_visit) × 100%
Stage 2→3: (area_measured / estimate_started) × 100%
Stage 3→4: (estimate_submitted / area_measured) × 100%
Stage 4→5: (consultation_booked / estimate_submitted) × 100%
Stage 5→6: (payment_complete / consultation_booked) × 100%

Overall: (payment_complete / page_visit) × 100%
```

### Identifying Drop-off Points

Compare event counts to find where users are dropping off:

1. Export event data for a specific time period
2. Count occurrences of each event type
3. Calculate the drop-off percentage between consecutive stages
4. Focus optimization efforts on stages with the highest drop-off

### Filtering and Segmentation

Use Vercel Analytics filters to segment your data:

- **By time period** - Compare weekdays vs weekends, different months
- **By referrer** - Analyze which traffic sources convert best
- **By service type** - See which services drive the most conversions
- **By property size** - Identify if larger/smaller projects convert differently

## Privacy Compliance

### What We DON'T Track

To maintain privacy and comply with regulations:

- ❌ Customer names (firstName, lastName, client_name)
- ❌ Email addresses (customer_email, client_email)
- ❌ Phone numbers
- ❌ Street addresses
- ❌ Personal identification information

**Privacy Protection Mechanisms:**
1. **Automatic PII Filtering**: The analytics service automatically filters out blocked properties (email, name, phone, address) before sending events
2. **beforeSend Callback**: Vercel Analytics inject() includes a beforeSend callback as a last-resort PII filter
3. **BLOCKED_PROPERTIES Config**: Centralized configuration defines all blocked PII terms

### What We DO Track

- ✅ Aggregate behavior (page views, form interactions)
- ✅ Technical metrics (square footage, service type)
- ✅ Business metrics (estimated cost, payment amount)
- ✅ Timestamps and user agents (for fraud prevention)
- ✅ Geographic region (state level only)
- ✅ Reference numbers and IDs (non-PII identifiers)

### Privacy Policy Alignment

All analytics tracking complies with the privacy commitments stated in `/privacy.html`. Vercel Analytics is GDPR-compliant and privacy-friendly by default.

**Implementation Details:**
- Email addresses are collected for business purposes (estimates, scheduling) but are NEVER sent to analytics
- Multiple layers of PII filtering ensure privacy compliance even if a developer accidentally includes PII in an event

## Troubleshooting

### Events Not Appearing

If you don't see events in the dashboard:

1. **Check time range** - Vercel Analytics may default to last 24 hours
   - Expand the time range to include your test period

2. **Verify deployment** - Ensure the latest code is deployed to production
   ```bash
   # Check if analytics code is in production build
   npm run build:vercel
   # Look for @vercel/analytics in the bundle
   ```

3. **Check browser console** - Look for analytics-related errors
   - Open DevTools → Console
   - Filter by "Analytics" or "Vercel"
   - Verify no error messages appear

4. **Test in production** - Analytics may be disabled on localhost
   - The analytics service automatically disables tracking on `localhost` unless debug mode is enabled
   - Test on your production Vercel URL instead

### Debug Mode

To enable debug logging during development:

1. **Edit analytics-service.js**
   ```javascript
   const analyticsService = new AnalyticsService({
     debug: true  // Set to true
   });
   ```

2. **Check browser console** - You'll see detailed logs:
   - `[Analytics] Tracking event: event_name {...properties}`
   - Event confirmation messages
   - Any errors that occur

3. **Don't forget to disable debug mode** before deploying to production

### Event Properties Missing

If event properties are incomplete:

1. **Check the event implementation** - Review the tracking code in:
   - `src/components/estimate-form.js` - Form events
   - `src/components/area-finder.js` - Measurement events
   - `src/components/calendly-scheduler.js` - Consultation events
   - `src/services/payment-service.js` - Payment events

2. **Verify data availability** - Ensure the data exists before tracking:
   ```javascript
   // Good: Check before tracking
   if (measurementData && measurementData.squareFeet) {
     analyticsService.track('area_measured', {
       square_footage: measurementData.squareFeet
     });
   }
   ```

3. **Review analytics-config.js** - Check that properties are in `ALLOWED_PROPERTIES`

### Common Issues

**Issue:** Events fire multiple times
- **Cause:** Event listener not properly guarded
- **Solution:** Check for `hasTrackedEventName` flags in component code

**Issue:** Events don't fire on localhost
- **Cause:** Analytics disabled in development
- **Solution:** Enable debug mode or test on production URL

**Issue:** Payment events missing
- **Cause:** Webhook handler not configured
- **Solution:** Verify Stripe webhook configuration includes payment success events

## Best Practices

### Regular Monitoring

- **Weekly:** Review conversion rates between stages
- **Monthly:** Analyze trends and seasonal patterns
- **Quarterly:** Identify optimization opportunities based on drop-off points

### A/B Testing

When making changes to improve conversion:

1. Record baseline metrics before changes
2. Deploy changes and monitor for 2-4 weeks
3. Compare new metrics to baseline
4. Document successful optimizations

### Data Export

To export data for deeper analysis:

1. Use Vercel Analytics export feature (if available)
2. Or integrate with Google Analytics/Mixpanel for additional analysis
3. Store historical data for long-term trend analysis

## Getting Help

If you encounter issues accessing the dashboard or interpreting data:

1. **Vercel Support** - [vercel.com/support](https://vercel.com/support)
2. **Analytics Documentation** - [vercel.com/docs/analytics](https://vercel.com/docs/analytics)
3. **Check Implementation** - Review `/src/config/analytics-config.js` and `/src/services/analytics-service.js`

## Related Documentation

- [Analytics Configuration](../src/config/analytics-config.js) - Event definitions and configuration
- [Analytics Service](../src/services/analytics-service.js) - Service implementation
- [Privacy Policy](../privacy.html) - Privacy commitments
- [Vercel Configuration](../vercel.json) - Deployment settings

---

**Last Updated:** 2026-06-22  
**Maintained By:** Engineering Team  
**Version:** 1.0.0
