# End-to-End Tests: Lead Nurturing

This directory contains end-to-end tests for the automated lead nurturing feature.

## Test Coverage

### Abandoned Estimate Flow Test

Tests the complete flow from estimate creation to automated follow-up:

1. **Create estimate** - Simulates a user creating an estimate with email consent
2. **Verify lead storage** - Confirms lead is stored with correct data and status='new'
3. **Trigger abandoned check** - Simulates the cron job that checks for abandoned estimates
4. **Verify email API** - Confirms the email API can be called with the abandoned_estimate template
5. **Verify status update** - Confirms lead status updates from 'new' to 'contacted'
6. **Verify analytics** - Confirms nurture events are tracked in analytics

### Booking Confirmation Flow Test

Tests the complete flow from Calendly booking webhook to confirmation delivery:

1. **Simulate webhook** - Creates a Calendly booking webhook event
2. **Verify booking storage** - Confirms booking is stored in calendly_bookings
3. **Verify email sent** - Confirms booking confirmation email API called
4. **Verify SMS sent** - Confirms SMS sent when phone consent exists
5. **Verify analytics** - Confirms booking confirmation events are tracked

## Running the Tests

### Option 1: Browser-Based Interactive Test

Open the HTML test page in your browser:

```bash
# Start the dev server
npm run dev

# Open Abandoned Estimate test in browser
open http://localhost:3000/tests/e2e/abandoned-estimate.html

# Open Booking Confirmation test in browser
open http://localhost:3000/tests/e2e/booking-confirmation.html
```

The interactive test page allows you to:
- Run individual steps or the full test suite
- View detailed results for each step
- Inspect lead storage
- Configure test parameters
- Clear test data

### Option 2: Command-Line Automated Test

Run the Node.js test scripts:

```bash
# Prerequisites: Start dev server in another terminal
npm run dev

# Run Abandoned Estimate test (in dry-run mode by default)
node tests/e2e/abandoned-estimate.test.js

# Run Booking Confirmation test
node tests/e2e/booking-confirmation.test.js

# Run in live mode (requires API keys)
DRY_RUN=false node tests/e2e/booking-confirmation.test.js

# Run with custom API URL
API_BASE_URL=https://your-app.vercel.app node tests/e2e/booking-confirmation.test.js

# Keep test data for inspection
SKIP_CLEANUP=true node tests/e2e/booking-confirmation.test.js
```

## Prerequisites

### Required

1. **Dev server running**: The tests require the API endpoints to be available
   ```bash
   npm run dev
   ```

2. **Storage directory**: The backend storage path must be writable
   - Default: `/tmp/nurture_leads.json`

### Optional (for non-dry-run mode)

3. **SendGrid API Key**: To send actual emails
   ```bash
   export SENDGRID_API_KEY="your-api-key"
   export SENDGRID_FROM_EMAIL="noreply@neffpaving.com"
   ```

4. **Cron Secret**: For authenticating with cron endpoints
   ```bash
   export CRON_SECRET="your-secret-key"
   ```

## Test Modes

### Dry-Run Mode (Default)

In dry-run mode:
- No actual emails are sent
- API calls are simulated
- All validations still run
- Safe for testing without API keys

```bash
node tests/e2e/abandoned-estimate.test.js
```

### Live Mode

In live mode:
- Real emails are sent via SendGrid
- API calls are executed fully
- Requires valid API keys
- Use with caution

```bash
DRY_RUN=false SENDGRID_API_KEY="your-key" node tests/e2e/abandoned-estimate.test.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:3000` | Base URL for API calls |
| `CRON_SECRET` | `test-secret-123` | Secret for cron authentication |
| `DRY_RUN` | `true` | Run in dry-run mode |
| `SKIP_CLEANUP` | `false` | Keep test data after completion |
| `SENDGRID_API_KEY` | - | SendGrid API key (for live mode) |
| `SENDGRID_FROM_EMAIL` | - | SendGrid sender email (for live mode) |

## Understanding the Results

### Command-Line Test Output

```
=== E2E TEST: ABANDONED ESTIMATE FLOW ===
STEP 1: Create Estimate with Email Consent
✅ PASS - Step 1: Lead created and stored

STEP 2: Verify Lead Stored with Correct Data
✅ PASS - Step 2: Lead data verified correctly

[... additional steps ...]

=== TEST SUMMARY ===
Total Steps:   6
Passed:        6
Failed:        0
Success Rate:  100%

✅ ALL TESTS PASSED
```

### Browser Test Output

The browser test provides:
- Visual status indicators for each step
- Detailed JSON output for each API call
- Interactive controls to run steps individually
- Summary with pass/fail counts

## Troubleshooting

### "Error: ECONNREFUSED"

The dev server is not running. Start it with:
```bash
npm run dev
```

### "Error: Unauthorized" (Step 3)

The CRON_SECRET doesn't match. Either:
1. Set the environment variable: `export CRON_SECRET="your-secret"`
2. Update the test configuration in the HTML file
3. Update the `verifyCronAuth()` function to accept your secret

### "Lead not found in storage"

The lead storage file doesn't exist or is empty. The test should create it automatically, but you can manually create it:
```bash
echo '[]' > /tmp/nurture_leads.json
```

### "SendGrid API Key not configured"

This is expected in dry-run mode. To send real emails:
1. Get a SendGrid API key from https://sendgrid.com
2. Set the environment variable: `export SENDGRID_API_KEY="your-key"`
3. Run in live mode: `DRY_RUN=false node tests/e2e/abandoned-estimate.test.js`

## Production Deployment Testing

To test the deployed production environment:

```bash
# Test production deployment
API_BASE_URL=https://neffpaving.vercel.app \
CRON_SECRET="production-secret" \
DRY_RUN=true \
node tests/e2e/abandoned-estimate.test.js
```

Note: Always run in dry-run mode against production to avoid sending test emails to real users.

## Next Steps

After the E2E tests pass:

1. **Review the implementation**: Check the code changes in the build-progress.txt
2. **Test other flows**: Run tests for booking confirmation and review requests
3. **Manual verification**: Create a real estimate through the UI and verify the email
4. **Deploy to staging**: Test in a staging environment before production
5. **Monitor in production**: Watch for abandoned estimate emails being sent

## Related Tests

- ✅ `abandoned-estimate.test.js` - Tests the abandoned estimate nurture flow (completed)
- ✅ `booking-confirmation.test.js` - Tests the booking confirmation flow (completed)
- ⏳ `review-request.test.js` - Tests the post-job review request flow (pending)
- ⏳ `consent-unsubscribe.test.js` - Tests consent management and unsubscribe (pending)

## Documentation

- [Lead Nurture Documentation](../../docs/LEAD_NURTURE.md)
- [API Documentation](../../docs/API.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)
