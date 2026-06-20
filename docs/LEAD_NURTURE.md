# Automated Lead Nurturing (Email/SMS)

Automatically follow up with prospects through email and SMS to recover abandoned estimates, confirm bookings, and request reviews. The system respects opt-in consent, handles unsubscribes, and tracks campaign performance.

---

## How it works

```
Customer fills estimate form with email/SMS consent
            │
            ▼
Lead stored in localStorage with status='new'
            │
            ▼
Daily Cron Job (10:00 UTC)  ──►  /api/nurture/check-abandoned
            │                        • Find leads >24h old, status='new'
            │                        • Check email consent
            │                        • Send abandoned_estimate email
            │                        • Update status to 'contacted'
            ▼
Customer receives follow-up email with booking link
            │
            ▼
Customer books via Calendly
            │
            ▼
Webhook Handler  ──►  /api/nurture/send-email (booking_confirmation)
            │
            ▼
Daily Cron Job (14:00 UTC)  ──►  /api/nurture/check-review-requests
            │                        • Find leads >7 days after job_completed_at
            │                        • Check email consent
            │                        • Send review_request email
            ▼
Customer receives review request with Google/Yelp links
```

| Component | File/Endpoint |
|---|---|
| Lead storage | `src/utils/lead-storage.js` |
| Lead tracking service | `src/services/lead-nurture-service.js` |
| Consent management | `src/services/consent-service.js` |
| Email API | `api/nurture/send-email.js` |
| SMS API | `api/nurture/send-sms.js` |
| Abandoned estimate checker | `api/nurture/check-abandoned.js` |
| Review request checker | `api/nurture/check-review-requests.js` |
| Unsubscribe handler | `api/nurture/unsubscribe.js` |
| Analytics tracker | `api/nurture/track-event.js` |
| Analytics dashboard | `api/nurture/analytics.js` |
| Email templates | `api/nurture/templates.js` |
| Cron schedule | `vercel.json` |

---

## Environment Variables

### Required for Production

Add these to your Vercel project settings (Settings → Environment Variables):

```bash
# SendGrid Email Service
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@neffpaving.co

# Twilio SMS Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_PHONE=+15551234567

# Cron Job Security (generate a secure random string)
CRON_SECRET=your-secure-random-string-here
```

### Development/Testing

For local development, create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env with your development credentials
```

**⚠️ Never commit `.env` to version control!** The `.env` file is in `.gitignore`.

---

## One-time Setup (≈30 minutes)

### 1. SendGrid Setup

SendGrid sends the email campaigns (abandoned estimates, booking confirmations, review requests).

1. **Create SendGrid account**
   - Go to https://sendgrid.com/
   - Sign up for a free account (100 emails/day free tier)
   - Verify your email address

2. **Create API Key**
   - In SendGrid dashboard, go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Neff Paving Lead Nurture"
   - Permissions: "Full Access" (or "Mail Send" minimum)
   - Copy the API key immediately (won't be shown again)
   - Save as `SENDGRID_API_KEY` environment variable

3. **Verify sender email**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your business email (e.g., noreply@neffpaving.co)
   - Complete verification process
   - Save as `SENDGRID_FROM_EMAIL` environment variable

### 2. Twilio Setup

Twilio sends SMS notifications for booking confirmations and urgent follow-ups.

1. **Create Twilio account**
   - Go to https://www.twilio.com/
   - Sign up for a free trial ($15 credit)
   - Verify your phone number

2. **Get credentials**
   - In Twilio Console, find "Account SID" and "Auth Token"
   - Save as `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` environment variables

3. **Get phone number**
   - In Twilio Console, go to Phone Numbers → Manage → Buy a number
   - Choose a number with SMS capability
   - Free trial provides one number
   - Save as `TWILIO_FROM_PHONE` (format: +15551234567)

4. **Configure incoming SMS (for STOP handling)**
   - In Twilio Console, go to your phone number settings
   - Under Messaging → "A message comes in"
   - Set webhook URL: `https://your-domain.vercel.app/api/nurture/send-sms`
   - Method: HTTP POST
   - This handles automatic unsubscribe when users text "STOP"

### 3. Cron Secret Setup

The cron jobs need authentication to prevent unauthorized access.

1. **Generate a secure secret**
   ```bash
   # On macOS/Linux:
   openssl rand -base64 32
   
   # Or use any secure password generator
   ```

2. **Add to Vercel**
   - In Vercel project settings → Environment Variables
   - Name: `CRON_SECRET`
   - Value: Your generated secret
   - Save for all environments (Production, Preview, Development)

### 4. Configure Vercel Cron Jobs

The cron schedule is already configured in `vercel.json`, but you need to ensure it's enabled:

1. **Deploy to Vercel**
   - Push code to your connected Git repository
   - Vercel will auto-deploy

2. **Verify cron jobs are enabled**
   - In Vercel dashboard, go to your project
   - Click on Settings → Cron Jobs
   - You should see:
     - `check-abandoned`: Daily at 10:00 UTC
     - `check-review-requests`: Daily at 14:00 UTC

3. **Test cron authentication**
   ```bash
   # Should return 401 Unauthorized (correct behavior)
   curl https://your-domain.vercel.app/api/nurture/check-abandoned
   
   # Should return 200 OK with summary (correct behavior)
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.vercel.app/api/nurture/check-abandoned
   ```

---

## Cron Job Schedule

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| Abandoned Estimates | Daily at 10:00 UTC (3am PT / 6am ET) | `/api/nurture/check-abandoned` | Send follow-up emails to leads who requested an estimate >24 hours ago but haven't booked |
| Review Requests | Daily at 14:00 UTC (7am PT / 10am ET) | `/api/nurture/check-review-requests` | Send review request emails to customers >7 days after job completion |

**Why these times?**
- **10:00 UTC (morning in US)**: Catch leads from previous day, arrive in inbox early morning
- **14:00 UTC (late morning in US)**: Good time for review requests when customers are active

**To change the schedule:**

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/nurture/check-abandoned",
      "schedule": "0 10 * * *"  // Cron format: minute hour day month day-of-week
    }
  ]
}
```

Cron format guide:
- `0 10 * * *` = Daily at 10:00 UTC
- `0 */6 * * *` = Every 6 hours
- `0 9 * * 1` = Every Monday at 9:00 UTC
- Use https://crontab.guru/ to build custom schedules

---

## Testing Locally

### Test without sending real emails/SMS

All API endpoints support dry-run mode for safe testing:

```bash
# Test abandoned estimate checker (dry-run mode)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "http://localhost:3000/api/nurture/check-abandoned?DRY_RUN=true"

# Test review request checker (dry-run mode)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "http://localhost:3000/api/nurture/check-review-requests?DRY_RUN=true"
```

In dry-run mode:
- ✅ Reads leads from storage
- ✅ Filters eligible leads
- ✅ Logs what would be sent
- ❌ Does NOT send actual emails/SMS
- ❌ Does NOT update lead status

### Test email sending

```bash
# Send a test abandoned estimate email
curl -X POST http://localhost:3000/api/nurture/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@example.com",
    "template": "abandoned_estimate",
    "data": {
      "firstName": "John",
      "estimateAmount": 5000,
      "bookingUrl": "https://calendly.com/neff-paving"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "msg_xxxxx",
  "to": "your-test-email@example.com"
}
```

### Test SMS sending

```bash
# Send a test SMS
curl -X POST http://localhost:3000/api/nurture/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "template": "booking_confirmation",
    "data": {
      "firstName": "John",
      "appointmentDate": "Monday, Jan 15 at 2:00 PM"
    },
    "consentSms": true
  }'
```

### Test unsubscribe flow

```bash
# Simulate clicking unsubscribe link
curl "http://localhost:3000/api/nurture/unsubscribe?lead=test-lead-123&type=email"
```

You should see a confirmation page in the response.

### Run Vercel dev server

To test serverless functions locally with environment variables:

```bash
# Install Vercel CLI
npm install -g vercel

# Run dev server (reads .env automatically)
vercel dev

# API endpoints available at:
# http://localhost:3000/api/nurture/*
```

---

## Deploying to Vercel

### Initial Deployment

1. **Connect repository**
   - Go to https://vercel.com/
   - Click "New Project"
   - Import your Git repository
   - Select the repository containing this code

2. **Configure environment variables**
   - Before deploying, add all environment variables in Vercel dashboard
   - Settings → Environment Variables
   - Add each variable from the "Environment Variables" section above
   - Important: Add to all environments (Production, Preview, Development)

3. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - First deployment takes ~2-3 minutes

4. **Verify deployment**
   - Check deployment logs for errors
   - Visit your domain to verify site works
   - Test an API endpoint: `https://your-domain.vercel.app/api/nurture/analytics`

### Continuous Deployment

After initial setup, deployments are automatic:

```bash
git add .
git commit -m "Update nurture campaign templates"
git push origin main
```

Vercel automatically:
- ✅ Detects the push
- ✅ Builds the project
- ✅ Runs checks
- ✅ Deploys to production
- ✅ Enables cron jobs

### Rollback

If a deployment breaks something:

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback (< 1 minute)

---

## Monitoring Campaigns

### View analytics dashboard

```bash
# Get campaign performance summary
curl https://your-domain.vercel.app/api/nurture/analytics

# Filter by date range
curl "https://your-domain.vercel.app/api/nurture/analytics?since=2024-01-01&until=2024-01-31"

# Filter by campaign
curl "https://your-domain.vercel.app/api/nurture/analytics?campaign=abandoned_estimate"
```

Response includes:
- **Summary**: Total leads, emails sent, SMS sent, conversions, conversion rate
- **Engagement**: Open rates, click rates, delivery rates
- **Campaigns**: Breakdown by campaign type
- **Lead Status**: Distribution of lead statuses
- **Consent**: Opt-in statistics

### View Vercel logs

Real-time logs for debugging:

1. Go to Vercel dashboard → your project
2. Click "Logs" tab
3. Filter by:
   - Function: Select a specific API endpoint
   - Time range: Last hour, day, week
   - Status: Errors, warnings, all

### Monitor cron job execution

In Vercel dashboard:
1. Go to Settings → Cron Jobs
2. View execution history
3. See success/failure status
4. Click on individual executions to see logs

### Check email delivery (SendGrid)

1. Log into SendGrid dashboard
2. Go to Activity
3. Filter by:
   - Recipient email
   - Date range
   - Status (delivered, bounced, opened, clicked)

### Check SMS delivery (Twilio)

1. Log into Twilio Console
2. Go to Monitor → Logs → Messaging
3. View:
   - Sent messages
   - Delivery status
   - Errors
   - Incoming messages (STOP commands)

---

## Campaign Templates

Three email templates are configured in `api/nurture/templates.js`:

### 1. Abandoned Estimate (`abandoned_estimate`)

**Trigger**: 24 hours after estimate created, status='new', has email consent  
**Purpose**: Remind prospect to book an appointment

Data required:
```javascript
{
  firstName: "John",
  estimateAmount: 5000,
  bookingUrl: "https://calendly.com/neff-paving"
}
```

### 2. Booking Confirmation (`booking_confirmation`)

**Trigger**: Immediately after Calendly booking webhook  
**Purpose**: Confirm appointment details

Data required:
```javascript
{
  firstName: "John",
  eventType: "Site Visit",
  appointmentDate: "Monday, Jan 15 at 2:00 PM",
  location: "123 Main St, City, State",
  cancelUrl: "https://calendly.com/cancellations/...",
  rescheduleUrl: "https://calendly.com/reschedulings/..."
}
```

### 3. Review Request (`review_request`)

**Trigger**: 7 days after job_completed_at, has email consent  
**Purpose**: Request customer review on Google/Yelp

Data required:
```javascript
{
  firstName: "John",
  googleReviewUrl: "https://g.page/r/...",
  yelpReviewUrl: "https://www.yelp.com/biz/..."
}
```

### Customizing Templates

Edit `api/nurture/templates.js`:

```javascript
export const abandoned_estimate = {
  subject: 'Your paving estimate from Neff Paving',
  getHtml: (data) => `
    <h1>Hi ${data.firstName},</h1>
    <p>Your custom message here...</p>
  `,
  getText: (data) => `
    Hi ${data.firstName},
    Your custom message here...
  `
};
```

After editing:
1. Commit changes
2. Push to repository
3. Vercel auto-deploys
4. New templates active in ~2 minutes

---

## Compliance & Best Practices

### Legal Requirements

✅ **Obtain consent**: Estimate form includes opt-in checkboxes for email and SMS  
✅ **Unsubscribe links**: All emails include unsubscribe link in footer  
✅ **STOP keyword**: SMS messages include STOP instructions, automatically handled  
✅ **Privacy policy**: Consent form links to privacy policy  
✅ **Consent storage**: All consent records stored with timestamps

### CAN-SPAM Compliance

- ✅ Sender email verified with SendGrid
- ✅ Physical business address in email footer (add to templates)
- ✅ Clear unsubscribe mechanism
- ✅ Unsubscribe requests honored immediately
- ✅ Subject lines not deceptive

### TCPA Compliance (SMS)

- ✅ Prior express written consent obtained
- ✅ SMS opt-in separate from email opt-in
- ✅ Clear disclosure of message frequency and rates
- ✅ STOP keyword automatically processed
- ✅ Opt-out requests honored immediately

### Best Practices

1. **Test before scaling**: Use dry-run mode to verify logic
2. **Monitor deliverability**: Check SendGrid/Twilio dashboards weekly
3. **Respect unsubscribes**: Never override consent revocations
4. **Timing matters**: Send at appropriate times (avoid nights/weekends)
5. **Personalize content**: Use customer names and relevant details
6. **Track performance**: Review analytics monthly, optimize underperforming campaigns
7. **Avoid spam triggers**: Don't use all caps, excessive punctuation, or spammy words
8. **Mobile-friendly**: All email templates are responsive

---

## Troubleshooting

### Emails not sending

1. **Check SendGrid API key**
   ```bash
   # Verify environment variable is set
   curl https://your-domain.vercel.app/api/nurture/send-email \
     -X POST -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","template":"abandoned_estimate","data":{}}'
   ```
   
   Error: `SendGrid API key not configured` → Add `SENDGRID_API_KEY` to Vercel

2. **Check sender email verification**
   - Log into SendGrid dashboard
   - Verify sender email is verified
   - Check spam folder for verification email

3. **Check SendGrid Activity**
   - Go to SendGrid dashboard → Activity
   - Look for bounces, blocks, or drops
   - Common issues: Invalid recipient email, domain reputation

### SMS not sending

1. **Check Twilio credentials**
   ```bash
   curl https://your-domain.vercel.app/api/nurture/send-sms \
     -X POST -H "Content-Type: application/json" \
     -d '{"to":"+15551234567","template":"booking_confirmation","data":{},"consentSms":true}'
   ```
   
   Error: `Twilio credentials not configured` → Add `TWILIO_*` vars to Vercel

2. **Check phone number format**
   - Must be E.164 format: `+15551234567`
   - Country code required
   - No spaces, dashes, or parentheses

3. **Check Twilio balance**
   - Trial accounts: $15 credit, can only send to verified numbers
   - Upgrade to paid account for unrestricted sending

### Cron jobs not running

1. **Check Vercel cron configuration**
   - Vercel dashboard → Settings → Cron Jobs
   - Ensure jobs are listed and enabled
   - Check execution history for errors

2. **Check cron authentication**
   ```bash
   # This should return 401
   curl https://your-domain.vercel.app/api/nurture/check-abandoned
   
   # This should return 200
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.vercel.app/api/nurture/check-abandoned
   ```

3. **Check Vercel logs**
   - Go to Deployments → Select deployment → Functions
   - Filter by function name (e.g., `api/nurture/check-abandoned`)
   - Look for errors in execution logs

### Leads not being tracked

1. **Check localStorage**
   - Open browser DevTools → Application → Local Storage
   - Look for `nurture_leads` key
   - Should contain array of lead objects

2. **Check estimate form integration**
   - Fill out estimate form with email
   - Check consent checkboxes
   - Submit form
   - Verify lead appears in localStorage

3. **Check browser console for errors**
   - Open DevTools → Console
   - Look for JavaScript errors
   - Check network tab for failed API calls

### Consent not being recorded

1. **Check ConsentService**
   ```javascript
   // In browser console:
   const {ConsentService} = require('./src/services/consent-service.js');
   const consent = new ConsentService();
   consent.getConsentStats();
   ```

2. **Check localStorage**
   - DevTools → Application → Local Storage
   - Look for `consent_records` key

---

## Production Migration

**⚠️ Current limitation**: File-based storage (`/tmp`) is ephemeral in Vercel serverless functions. Data is lost between function invocations.

**For production**, migrate to persistent storage:

### Option 1: Vercel KV (Redis)

```bash
# Install Vercel KV
npm install @vercel/kv

# Add to Vercel project
vercel link
vercel storage create kv
```

Update storage calls in:
- `api/nurture/check-abandoned.js`
- `api/nurture/check-review-requests.js`
- `api/nurture/track-event.js`
- `api/nurture/analytics.js`

```javascript
// Before (file-based):
const leads = JSON.parse(fs.readFileSync('/tmp/nurture_leads.json'));

// After (Vercel KV):
import { kv } from '@vercel/kv';
const leads = await kv.get('nurture_leads') || [];
```

### Option 2: PostgreSQL Database

```bash
# Install PostgreSQL client
npm install pg

# Add to .env
DATABASE_URL=postgresql://user:password@host:5432/database
```

Create tables:
```sql
CREATE TABLE nurture_leads (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  consent_email BOOLEAN,
  consent_sms BOOLEAN,
  status TEXT,
  estimate_created_at TIMESTAMP,
  last_contact_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nurture_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT,
  campaign TEXT,
  lead_id TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Option 3: Frontend-Only (Current)

Keep localStorage-based tracking for frontend data, but store campaign history in external analytics:

- Use Google Analytics for event tracking (already integrated)
- Use SendGrid webhook events for email delivery tracking
- Use Twilio callback URLs for SMS delivery tracking
- Analytics API becomes read-only aggregator

---

## Support

For issues or questions:

1. **Check logs**: Vercel dashboard → Logs
2. **Check docs**: SendGrid/Twilio documentation
3. **Test in dry-run mode**: Isolate the issue
4. **Review environment variables**: Ensure all are set correctly

Common support resources:
- SendGrid docs: https://docs.sendgrid.com/
- Twilio docs: https://www.twilio.com/docs
- Vercel docs: https://vercel.com/docs
- Vercel cron docs: https://vercel.com/docs/cron-jobs
