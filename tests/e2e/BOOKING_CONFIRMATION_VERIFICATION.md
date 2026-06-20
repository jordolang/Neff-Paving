# Booking Confirmation Flow - E2E Verification

This document provides manual verification steps for the booking confirmation flow.

## Overview

The booking confirmation flow is triggered when a Calendly booking webhook is received. The flow:

1. Receives webhook from Calendly
2. Stores booking in `calendly_bookings`
3. Sends email confirmation to customer
4. Sends SMS confirmation if phone consent exists
5. Tracks analytics events

## Automated Test

Run the automated test (requires dev server):

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run test
node tests/e2e/booking-confirmation.test.js
```

Or use the interactive browser test:

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:3000/tests/e2e/booking-confirmation.html
```

## Manual Verification Steps

### Prerequisites

1. Dev server running: `npm run dev`
2. (Optional) SendGrid API key configured for email testing
3. (Optional) Twilio credentials configured for SMS testing

### Step 1: Simulate Calendly Booking Webhook

Create a test webhook event:

```bash
curl -X POST http://localhost:3000/api/webhooks/calendly \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invitee.created",
    "time": "2026-06-20T12:00:00Z",
    "payload": {
      "uri": "https://api.calendly.com/scheduled_events/test-123",
      "event_type": {
        "name": "Paving Consultation",
        "uri": "https://api.calendly.com/event_types/consultation"
      },
      "start_time": "2026-06-22T14:00:00Z",
      "end_time": "2026-06-22T14:30:00Z",
      "invitees": [
        {
          "email": "test@example.com",
          "name": "Test Customer",
          "uri": "https://api.calendly.com/invitees/test-456"
        }
      ],
      "location": {
        "type": "physical",
        "location": "123 Main St, Anytown, USA"
      },
      "cancel_url": "https://calendly.com/cancellations/test-123",
      "reschedule_url": "https://calendly.com/reschedulings/test-123"
    }
  }'
```

**Expected Result:** HTTP 200 response

### Step 2: Verify Booking Storage

Check localStorage (browser console) or file storage:

**Browser (localStorage):**
```javascript
// In browser console
const bookings = JSON.parse(localStorage.getItem('calendly_bookings') || '{}');
console.log(bookings);
// Should show the booking with URI: https://api.calendly.com/scheduled_events/test-123
```

**File storage (if applicable):**
```bash
cat $TMPDIR/calendly_bookings.json
```

**Expected Data:**
```json
{
  "https://api.calendly.com/scheduled_events/test-123": {
    "calendly_uri": "https://api.calendly.com/scheduled_events/test-123",
    "event_type": "Paving Consultation",
    "start_time": "2026-06-22T14:00:00Z",
    "end_time": "2026-06-22T14:30:00Z",
    "invitee_email": "test@example.com",
    "invitee_name": "Test Customer",
    "status": "scheduled",
    "created_at": "..."
  }
}
```

### Step 3: Verify Email Sent

Call the email API directly:

```bash
curl -X POST http://localhost:3000/api/nurture/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "booking_confirmation",
    "data": {
      "customer_name": "Test Customer",
      "event_type": "Paving Consultation",
      "start_time": "June 22, 2026 at 2:00 PM",
      "end_time": "June 22, 2026 at 2:30 PM",
      "duration": 30,
      "location": "123 Main St, Anytown, USA",
      "event_uri": "https://api.calendly.com/scheduled_events/test-123",
      "cancel_url": "https://calendly.com/cancellations/test-123",
      "reschedule_url": "https://calendly.com/reschedulings/test-123",
      "unsubscribeUrl": "http://localhost:3000/api/nurture/unsubscribe?lead=test-123&type=email"
    }
  }'
```

**Expected Results:**

**Without SendGrid configured:**
```json
{
  "success": false,
  "error": "SendGrid API key not configured. Set SENDGRID_API_KEY environment variable."
}
```

**With SendGrid configured:**
```json
{
  "success": true,
  "messageId": "...",
  "to": "test@example.com",
  "template": "booking_confirmation"
}
```

Check email inbox for booking confirmation with:
- Customer name
- Event type
- Appointment date/time
- Location
- Cancel/reschedule links
- Unsubscribe link

### Step 4: Verify SMS Sent (If Consent Exists)

First, grant SMS consent:

```bash
# Store consent (browser)
const consents = JSON.parse(localStorage.getItem('consent_records') || '{}');
consents['test-123'] = {
  lead_id: 'test-123',
  email: 'test@example.com',
  phone: '+15555551234',
  consent_email: true,
  consent_sms: true,
  granted_at: new Date().toISOString()
};
localStorage.setItem('consent_records', JSON.stringify(consents));
```

Then send SMS:

```bash
curl -X POST http://localhost:3000/api/nurture/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15555551234",
    "template": "booking_confirmation",
    "data": {
      "customer_name": "Test Customer",
      "event_type": "Paving Consultation",
      "start_time": "June 22, 2026 at 2:00 PM"
    },
    "consentSms": true
  }'
```

**Expected Results:**

**Without Twilio configured:**
```json
{
  "success": false,
  "error": "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE environment variables."
}
```

**With Twilio configured:**
```json
{
  "success": true,
  "messageSid": "SM...",
  "to": "+15555551234"
}
```

### Step 5: Verify Analytics Tracking

Track events:

```bash
# Track email sent
curl -X POST http://localhost:3000/api/nurture/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "email_sent",
    "campaign": "booking_confirmation",
    "lead_id": "test-123",
    "metadata": {
      "email": "test@example.com",
      "template": "booking_confirmation",
      "booking_uri": "https://api.calendly.com/scheduled_events/test-123"
    }
  }'

# Track SMS sent
curl -X POST http://localhost:3000/api/nurture/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "sms_sent",
    "campaign": "booking_confirmation",
    "lead_id": "test-123",
    "metadata": {
      "phone": "+15555551234",
      "template": "booking_confirmation",
      "booking_uri": "https://api.calendly.com/scheduled_events/test-123"
    }
  }'
```

**Expected Results:**
```json
{
  "success": true,
  "event": "email_sent",
  "campaign": "booking_confirmation",
  "lead_id": "test-123",
  "timestamp": "..."
}
```

Verify events in storage:

```bash
# Check events file
cat $TMPDIR/nurture_events.jsonl | grep "test-123"
```

Should show both `email_sent` and `sms_sent` events.

### Step 6: Verify Browser Analytics

Check browser console for Google Analytics tracking:

```javascript
// In browser console after events are triggered
// Should see gtag calls with:
// - event_category: 'nurture'
// - event_action: 'email_sent' or 'sms_sent'
// - event_label: 'booking_confirmation'
```

## Success Criteria

All steps should pass:

- ✅ **Step 1:** Webhook received and processed
- ✅ **Step 2:** Booking stored in `calendly_bookings`
- ✅ **Step 3:** Email API called with `booking_confirmation` template
- ✅ **Step 4:** SMS API called when consent exists
- ✅ **Step 5:** Analytics events tracked

## Troubleshooting

### "fetch failed" errors

The dev server is not running. Start it with:
```bash
npm run dev
```

### "SendGrid API key not configured"

This is expected in test mode. To send real emails:
1. Get SendGrid API key
2. Set environment variables:
   ```bash
   export SENDGRID_API_KEY="your-key"
   export SENDGRID_FROM_EMAIL="noreply@neffpaving.com"
   ```

### "Twilio credentials not configured"

This is expected in test mode. To send real SMS:
1. Get Twilio credentials
2. Set environment variables:
   ```bash
   export TWILIO_ACCOUNT_SID="your-sid"
   export TWILIO_AUTH_TOKEN="your-token"
   export TWILIO_FROM_PHONE="+1234567890"
   ```

### No booking in storage

Check that localStorage is enabled in browser, or verify file permissions for temp directory.

## Production Verification

After deploying to production:

1. Create a real Calendly test booking
2. Check Vercel logs for webhook processing
3. Verify email received in inbox
4. Check analytics dashboard for tracking events
5. Verify booking appears in database

## Related Documentation

- [Lead Nurture Documentation](../../docs/LEAD_NURTURE.md)
- [E2E Tests README](./README.md)
- [Abandoned Estimate Verification](./abandoned-estimate.test.js)
