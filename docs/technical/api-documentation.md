# API Documentation - Neff Paving Scheduling System

## Overview

This document provides comprehensive API documentation for the Neff Paving scheduling system services, including job scheduling, Calendly integration, alerts, and webhook handling.

## Table of Contents

1. [Job Scheduling Service](#job-scheduling-service)
2. [Calendly Synchronization Service](#calendly-synchronization-service)
3. [Alert Service](#alert-service)
4. [Webhook Handler Service](#webhook-handler-service)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)

---

## Job Scheduling Service

### Base Class: `JobSchedulingService`

The core service for managing job scheduling operations and Calendly integration.

#### Configuration

```javascript
// Environment variables required
CALENDLY_API_KEY=your_api_key_here
CALENDLY_WEBHOOK_KEY=your_webhook_signing_key
CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_id

// Event type URIs for different service categories
CALENDLY_RESIDENTIAL_EVENT_TYPE=https://api.calendly.com/event_types/residential_id
CALENDLY_COMMERCIAL_EVENT_TYPE=https://api.calendly.com/event_types/commercial_id
CALENDLY_MAINTENANCE_EVENT_TYPE=https://api.calendly.com/event_types/maintenance_id
CALENDLY_EMERGENCY_EVENT_TYPE=https://api.calendly.com/event_types/emergency_id
```

#### Core Methods

##### `scheduleJob(contractData, estimateData, paymentData)`

Schedules a new job with the provided contract, estimate, and payment information.

**Parameters:**
- `contractData` (Object): Contract information
  - `id` (string): Contract ID
  - `clientName` (string): Client name
  - `clientEmail` (string): Client email
  - `serviceType` (string): Type of service (residential, commercial, etc.)
- `estimateData` (Object): Estimate details
  - `timeline` (Object): Project timeline
    - `days` (number): Estimated duration in days
  - `totalCost` (number): Total project cost
  - `address` (string): Project address
- `paymentData` (Object): Payment information

**Returns:** `Promise<Object>` - Scheduling result

**Example:**
```javascript
const scheduler = new JobSchedulingService();
const result = await scheduler.scheduleJob(
  {
    id: "contract_123",
    clientName: "John Doe",
    clientEmail: "john@example.com",
    serviceType: "residential"
  },
  {
    timeline: { days: 3 },
    totalCost: 5000,
    address: "123 Main St, City, State"
  },
  {
    paymentId: "payment_456"
  }
);
```

##### `getAvailability(serviceType, duration)`

Retrieves available time slots for scheduling.

**Parameters:**
- `serviceType` (string): Service category
- `duration` (number): Required duration in hours

**Returns:** `Promise<Array>` - Available time slots

##### `confirmBooking(eventUri, contractId)`

Confirms a booking using Calendly event URI.

**Parameters:**
- `eventUri` (string): Calendly event URI
- `contractId` (string): Associated contract ID

**Returns:** `Promise<Object>` - Confirmation result

##### `cancelBooking(eventUri)`

Cancels an existing booking.

**Parameters:**
- `eventUri` (string): Calendly event URI to cancel

**Returns:** `Promise<Object>` - Cancellation result

#### Calendar Management Methods

##### `blockTimeSlot(startDate, duration)`

Blocks a time slot to prevent scheduling conflicts.

**Parameters:**
- `startDate` (Date): Start date/time
- `duration` (number): Duration in hours

**Returns:** `Promise<Object>` - Block result

##### `updateAvailability(crewAvailability)`

Updates crew availability for scheduling.

**Parameters:**
- `crewAvailability` (Array): Crew availability data

**Returns:** `Promise<Object>` - Update result

##### `checkConflicts(proposedTime, duration)`

Checks for scheduling conflicts.

**Parameters:**
- `proposedTime` (Date): Proposed start time
- `duration` (number): Duration in hours

**Returns:** `Promise<Array>` - Array of conflicts

---

## Calendly Synchronization Service

### Base Class: `CalendlySync`

Manages synchronization between the system and Calendly API.

#### Configuration

```javascript
// Environment variables
CALENDLY_API_BASE=https://api.calendly.com
CALENDLY_ACCESS_TOKEN=your_access_token
CALENDLY_WEBHOOK_SECRET=your_webhook_secret
```

#### Core Methods

##### `sync()`

Performs full synchronization of Calendly events.

**Returns:** `Promise<Object>` - Sync results
```javascript
{
  eventsProcessed: number,
  eventsUpdated: number,
  eventsCreated: number,
  errors: Array
}
```

##### `syncEvent(eventUri)`

Synchronizes a specific Calendly event.

**Parameters:**
- `eventUri` (string): Calendly event URI

**Returns:** `Promise<Object>` - Event sync result

##### `createEvent(eventData)`

Creates a new Calendly event.

**Parameters:**
- `eventData` (Object): Event creation data
  - `eventType` (string): Event type URI
  - `invitee` (Object): Invitee information
  - `startTime` (string): ISO timestamp
  - `endTime` (string): ISO timestamp
  - `location` (Object): Location details

**Returns:** `Promise<Object>` - Created event

##### `cancelEvent(eventUri)`

Cancels a Calendly event.

**Parameters:**
- `eventUri` (string): Event URI to cancel

**Returns:** `Promise<Object>` - Cancellation result

##### `processWebhook(payload)`

Processes incoming webhook from Calendly.

**Parameters:**
- `payload` (Object): Webhook payload

**Returns:** `Promise<Object>` - Processing result

#### Webhook Event Types

- `invitee.created` - New appointment scheduled
- `invitee.canceled` - Appointment canceled
- `invitee.rescheduled` - Appointment rescheduled

---

## Alert Service

### Base Class: `AlertService`

Manages notifications across multiple channels.

#### Configuration

The service supports three notification channels:
- Email notifications
- SMS notifications  
- Dashboard notifications

#### Core Methods

##### `sendJobScheduledAlert(jobData)`

Sends alerts when a new job is scheduled.

**Parameters:**
- `jobData` (Object): Job information
  - `projectType` (string): Type of project
  - `startDate` (Date): Scheduled start date
  - `duration` (number): Duration in hours
  - `customer` (Object): Customer information
  - `contractId` (string): Contract ID
  - `paymentId` (string): Payment ID
  - `notes` (string): Special notes

**Returns:** `Promise<void>`

**Example:**
```javascript
const alertService = new AlertService();
await alertService.sendJobScheduledAlert({
  projectType: "Residential Driveway",
  startDate: new Date("2024-07-15T09:00:00Z"),
  duration: 8,
  customer: { name: "John Doe", email: "john@example.com" },
  contractId: "contract_123",
  paymentId: "payment_456",
  notes: "Customer requests early start"
});
```

##### `formatJobAlert(jobData)`

Formats job data for alert notifications.

**Parameters:**
- `jobData` (Object): Raw job data

**Returns:** `Object` - Formatted alert data

---

## Webhook Handler Service

### Base Class: `WebhookHandler`

Handles webhooks from external services (Stripe, Calendly).

#### Supported Event Types

#### Stripe Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`
- `payment_intent.requires_action`
- `payment_method.attached`
- `charge.succeeded`
- `charge.failed`
- `charge.dispute.created`

#### Calendly Events
- `calendly.event_scheduled`
- `calendly.event_canceled`
- `calendly.event_rescheduled`

#### Core Methods

##### `processEvent(event)`

Processes incoming webhook events.

**Parameters:**
- `event` (Object): Webhook event data
  - `type` (string): Event type
  - `data` (Object): Event payload

**Returns:** `Promise<void>`

##### `addHandler(eventType, handler)`

Adds a custom event handler.

**Parameters:**
- `eventType` (string): Event type to handle
- `handler` (Function): Handler function

**Returns:** `void`

**Example:**
```javascript
const webhookHandler = new WebhookHandler();
webhookHandler.addHandler('custom.event', async (event) => {
  console.log('Handling custom event:', event);
});
```

---

## Authentication

### API Keys

All services require proper API key configuration:

```javascript
// Calendly Authentication
headers: {
  'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
}

// Webhook Signature Verification
const signature = req.headers['calendly-webhook-signature'];
const isValid = verifyWebhookSignature(payload, signature, CALENDLY_WEBHOOK_SECRET);
```

### Environment Variables

Required environment variables for each service:

```bash
# Calendly Configuration
CALENDLY_API_KEY=cal_live_...
CALENDLY_WEBHOOK_KEY=webhook_...
CALENDLY_ORG_URI=https://api.calendly.com/organizations/...
CALENDLY_ACCESS_TOKEN=eyJ...

# Service Event Types
CALENDLY_RESIDENTIAL_EVENT_TYPE=https://api.calendly.com/event_types/...
CALENDLY_COMMERCIAL_EVENT_TYPE=https://api.calendly.com/event_types/...
CALENDLY_MAINTENANCE_EVENT_TYPE=https://api.calendly.com/event_types/...
CALENDLY_EMERGENCY_EVENT_TYPE=https://api.calendly.com/event_types/...

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/neff_paving

# Email Configuration (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@neffpaving.com
SMTP_PASS=app_password

# SMS Configuration (for alerts)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## Error Handling

### Standard Error Response Format

```javascript
{
  "error": {
    "code": "SCHEDULING_CONFLICT",
    "message": "The requested time slot conflicts with an existing appointment",
    "details": {
      "conflictingEventId": "event_123",
      "suggestedAlternatives": ["2024-07-16T10:00:00Z", "2024-07-16T14:00:00Z"]
    },
    "timestamp": "2024-07-15T12:00:00Z"
  }
}
```

### Common Error Codes

- `INVALID_API_KEY` - API key is missing or invalid
- `SCHEDULING_CONFLICT` - Time slot conflicts with existing booking
- `EVENT_NOT_FOUND` - Requested Calendly event doesn't exist
- `VALIDATION_ERROR` - Required fields are missing or invalid
- `WEBHOOK_VERIFICATION_FAILED` - Webhook signature verification failed
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `SERVICE_UNAVAILABLE` - External service (Calendly) is unavailable

### Error Handling Best Practices

1. **Retry Logic**: Implement exponential backoff for transient failures
2. **Graceful Degradation**: Continue operation when non-critical services fail
3. **Logging**: Log all errors with sufficient context for debugging
4. **User Feedback**: Provide meaningful error messages to users

**Example Error Handler:**
```javascript
try {
  await scheduler.scheduleJob(contractData, estimateData, paymentData);
} catch (error) {
  if (error.code === 'SCHEDULING_CONFLICT') {
    // Show alternative time slots
    const alternatives = error.details.suggestedAlternatives;
    showAlternativeSlots(alternatives);
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Retry after delay
    setTimeout(() => retryScheduling(), 60000);
  } else {
    // Log error and show generic message
    console.error('Scheduling failed:', error);
    showErrorMessage('Unable to schedule appointment. Please try again.');
  }
}
```

---

## Rate Limits

### Calendly API Limits
- 10,000 requests per hour per organization
- Burst limit: 100 requests per minute

### Best Practices
- Implement request queuing for high-volume operations
- Cache frequently accessed data
- Use webhooks instead of polling when possible
- Monitor usage and implement alerts for approaching limits

---

## Testing

### Unit Tests
Each service should have comprehensive unit tests covering:
- All public methods
- Error scenarios
- Edge cases

### Integration Tests
- Calendly API integration
- Database operations
- Webhook processing
- Alert delivery

### Example Test
```javascript
describe('JobSchedulingService', () => {
  it('should schedule a job successfully', async () => {
    const scheduler = new JobSchedulingService();
    const result = await scheduler.scheduleJob(mockContractData, mockEstimateData, mockPaymentData);
    
    expect(result).toBeDefined();
    expect(result.status).toBe('scheduled');
    expect(result.eventUri).toMatch(/^https:\/\/api\.calendly\.com\/scheduled_events\//);
  });
});
```

---

For additional support or questions about the API, please contact the development team or refer to the troubleshooting guide.
