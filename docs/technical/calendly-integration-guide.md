# Calendly Integration Guide - Neff Paving Scheduling System

## Overview

This guide provides step-by-step instructions for integrating Calendly with the Neff Paving scheduling system, including API setup, webhook configuration, and event synchronization.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Calendly Account Setup](#calendly-account-setup)
3. [API Configuration](#api-configuration)
4. [Webhook Setup](#webhook-setup)
5. [Event Type Configuration](#event-type-configuration)
6. [Integration Testing](#integration-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the integration, ensure you have:

- [ ] Calendly Premium or higher account
- [ ] Admin access to your Calendly organization
- [ ] Developer access to the Neff Paving application
- [ ] SSL certificate for webhook endpoints
- [ ] Database access for storing event data

### Required Tools

- Node.js (v16+)
- PostgreSQL database
- Text editor or IDE
- Terminal/command line access

---

## Calendly Account Setup

### 1. Organization Setup

1. **Log into Calendly** with admin credentials
2. **Navigate to Organization Settings**
   - Go to Settings → Organization
   - Note your organization URI (needed for API calls)
3. **Enable API Access**
   - Go to Integrations & Apps → API & Webhooks
   - Enable API access for your organization

### 2. Create Event Types

Create separate event types for different service categories:

#### Residential Services Event Type
```
Name: Residential Consultation
Duration: 60 minutes
Location: Customer Location
Buffer Time: 15 minutes before/after
Questions:
- Project Address (required)
- Project Type (Driveway, Walkway, Patio, Other)
- Estimated Square Footage
- Preferred Start Date
- Special Requirements
```

#### Commercial Services Event Type
```
Name: Commercial Consultation
Duration: 90 minutes
Location: Customer Location
Buffer Time: 30 minutes before/after
Questions:
- Business Name (required)
- Project Address (required)
- Project Type (Parking Lot, Sidewalk, Loading Dock, Other)
- Estimated Square Footage
- Deadline Requirements
- Contact Person on Site
```

#### Emergency Services Event Type
```
Name: Emergency Service Call
Duration: 30 minutes
Location: Customer Location
Buffer Time: 0 minutes
Questions:
- Emergency Type (required)
- Project Address (required)
- Urgency Level (Immediate, Same Day, Next Day)
- Safety Concerns
- Contact Number for Immediate Response
```

### 3. Custom Fields Setup

Add custom fields to capture project-specific information:

```javascript
// Custom fields for all event types
{
  "contract_id": "Contract ID",
  "estimate_id": "Estimate ID", 
  "payment_status": "Payment Status",
  "crew_preference": "Preferred Crew",
  "weather_dependent": "Weather Dependent (Yes/No)"
}
```

---

## API Configuration

### 1. Generate API Access Token

1. **Go to Calendly Developer Console**
   - Visit: https://developer.calendly.com/
   - Sign in with your Calendly admin account

2. **Create New Application**
   - Click "Create App"
   - Fill in application details:
     ```
     App Name: Neff Paving Scheduling System
     Description: Integration for automated job scheduling
     Redirect URI: https://your-domain.com/calendly/callback
     ```

3. **Generate Personal Access Token**
   - Go to your app dashboard
   - Generate a Personal Access Token
   - **Save this token securely** - it won't be shown again

### 2. Environment Configuration

Add the following environment variables to your application:

```bash
# .env file
CALENDLY_API_BASE=https://api.calendly.com
CALENDLY_ACCESS_TOKEN=your_personal_access_token_here
CALENDLY_WEBHOOK_SECRET=your_webhook_signing_key_here
CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_id

# Event Type URIs (get these from Calendly API or dashboard)
CALENDLY_RESIDENTIAL_EVENT_TYPE=https://api.calendly.com/event_types/AAAAAAAAAAAAAAAA
CALENDLY_COMMERCIAL_EVENT_TYPE=https://api.calendly.com/event_types/BBBBBBBBBBBBBBBB
CALENDLY_MAINTENANCE_EVENT_TYPE=https://api.calendly.com/event_types/CCCCCCCCCCCCCCCC
CALENDLY_EMERGENCY_EVENT_TYPE=https://api.calendly.com/event_types/DDDDDDDDDDDDDDDD
```

### 3. Verify API Connection

Test your API configuration:

```javascript
// test-calendly-connection.js
import { CalendlySync } from './src/services/sync/calendly-sync.js';

async function testConnection() {
  const sync = new CalendlySync();
  
  try {
    const user = await sync._getCurrentUser();
    console.log('✅ Calendly API connection successful');
    console.log(`Connected as: ${user.name} (${user.email})`);
    console.log(`Organization: ${user.current_organization}`);
  } catch (error) {
    console.error('❌ Calendly API connection failed:', error.message);
  }
}

testConnection();
```

---

## Webhook Setup

### 1. Create Webhook Endpoint

Create an endpoint in your application to receive Calendly webhooks:

```javascript
// routes/webhooks/calendly.js
import express from 'express';
import crypto from 'crypto';
import { WebhookHandler } from '../../src/services/webhook-handler.js';

const router = express.Router();
const webhookHandler = new WebhookHandler();

// Middleware to verify webhook signature
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['calendly-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
}

// Calendly webhook endpoint
router.post('/calendly', express.json(), verifyWebhookSignature, async (req, res) => {
  try {
    console.log('Received Calendly webhook:', req.body.event);
    
    await webhookHandler.processEvent(req.body);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

### 2. Register Webhook with Calendly

Use the Calendly API to register your webhook endpoint:

```javascript
// setup-webhook.js
async function registerWebhook() {
  const webhookData = {
    url: 'https://your-domain.com/api/webhooks/calendly',
    events: [
      'invitee.created',
      'invitee.canceled',
      'invitee.rescheduled'
    ],
    organization: process.env.CALENDLY_ORG_URI,
    scope: 'organization'
  };
  
  const response = await fetch('https://api.calendly.com/webhook_subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookData)
  });
  
  if (response.ok) {
    const webhook = await response.json();
    console.log('✅ Webhook registered successfully:', webhook.resource.uri);
    
    // Save webhook signing key
    console.log('🔑 Webhook signing key:', webhook.resource.signing_key);
    console.log('Add this to your environment as CALENDLY_WEBHOOK_SECRET');
  } else {
    console.error('❌ Webhook registration failed:', await response.text());
  }
}

registerWebhook();
```

### 3. Webhook Event Handling

Configure handlers for different webhook events:

```javascript
// webhook-event-handlers.js
export class CalendlyWebhookHandlers {
  
  async handleInviteeCreated(event) {
    console.log('New appointment scheduled:', event.payload.event.uri);
    
    // Extract appointment data
    const appointmentData = {
      calendlyUri: event.payload.event.uri,
      eventType: event.payload.event_type.name,
      startTime: event.payload.event.start_time,
      endTime: event.payload.event.end_time,
      inviteeName: event.payload.invitee.name,
      inviteeEmail: event.payload.invitee.email,
      questions: event.payload.questions_and_answers
    };
    
    // Save to database
    await this.saveAppointment(appointmentData);
    
    // Update job schedule
    await this.updateJobSchedule(appointmentData);
    
    // Send notifications
    await this.sendNotifications(appointmentData);
  }
  
  async handleInviteeCanceled(event) {
    console.log('Appointment canceled:', event.payload.event.uri);
    
    // Update database
    await this.cancelAppointment(event.payload.event.uri);
    
    // Free up crew schedule
    await this.freeCrewSchedule(event.payload.event);
    
    // Send cancellation notifications
    await this.sendCancellationNotifications(event.payload);
  }
  
  async handleInviteeRescheduled(event) {
    console.log('Appointment rescheduled:', event.payload.event.uri);
    
    // Update appointment time
    await this.rescheduleAppointment(
      event.payload.event.uri,
      event.payload.event.start_time,
      event.payload.event.end_time
    );
    
    // Update crew assignments
    await this.updateCrewAssignments(event.payload.event);
    
    // Send reschedule notifications
    await this.sendRescheduleNotifications(event.payload);
  }
}
```

---

## Event Type Configuration

### 1. Get Event Type URIs

Retrieve event type URIs programmatically:

```javascript
// get-event-types.js
async function getEventTypes() {
  const response = await fetch(`${process.env.CALENDLY_API_BASE}/event_types?user=${userUri}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_ACCESS_TOKEN}`
    }
  });
  
  const data = await response.json();
  
  data.collection.forEach(eventType => {
    console.log(`${eventType.name}: ${eventType.uri}`);
  });
}
```

### 2. Configure Event Type Mapping

Map your service types to Calendly event types:

```javascript
// event-type-mapping.js
export const EVENT_TYPE_MAPPING = {
  'residential_driveway': process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
  'residential_walkway': process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
  'residential_patio': process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
  'commercial_parking': process.env.CALENDLY_COMMERCIAL_EVENT_TYPE,
  'commercial_sidewalk': process.env.CALENDLY_COMMERCIAL_EVENT_TYPE,
  'emergency_repair': process.env.CALENDLY_EMERGENCY_EVENT_TYPE,
  'maintenance_sealcoating': process.env.CALENDLY_MAINTENANCE_EVENT_TYPE
};

export function getEventTypeForService(serviceType) {
  return EVENT_TYPE_MAPPING[serviceType] || process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE;
}
```

### 3. Dynamic Scheduling URLs

Generate scheduling URLs with pre-filled data:

```javascript
// calendly-url-generator.js
export function generateCalendlyUrl(serviceType, customerData, projectData) {
  const eventTypeUri = getEventTypeForService(serviceType);
  const baseUrl = eventTypeUri.replace('api.calendly.com/event_types', 'calendly.com');
  
  const params = new URLSearchParams({
    // Pre-fill customer information
    name: customerData.name,
    email: customerData.email,
    
    // Custom questions
    'a1': projectData.address,           // Project address
    'a2': projectData.type,              // Project type
    'a3': projectData.squareFootage,     // Square footage
    'a4': projectData.preferredDate,     // Preferred start date
    'a5': projectData.specialRequests,   // Special requirements
    
    // Internal tracking
    'a6': projectData.contractId,        // Contract ID
    'a7': projectData.estimateId,        // Estimate ID
  });
  
  return `${baseUrl}?${params.toString()}`;
}
```

---

## Integration Testing

### 1. Unit Tests

```javascript
// tests/calendly-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { CalendlySync } from '../src/services/sync/calendly-sync.js';

describe('Calendly Integration', () => {
  let calendlySync;
  
  beforeEach(() => {
    calendlySync = new CalendlySync();
  });
  
  it('should connect to Calendly API', async () => {
    const user = await calendlySync._getCurrentUser();
    expect(user).toBeDefined();
    expect(user.email).toContain('@');
  });
  
  it('should sync events successfully', async () => {
    const result = await calendlySync.sync();
    expect(result.eventsProcessed).toBeGreaterThanOrEqual(0);
    expect(result.errors).toEqual([]);
  });
  
  it('should handle webhook events', async () => {
    const mockWebhookPayload = {
      event: 'invitee.created',
      payload: {
        event: { uri: 'test-event-uri' },
        invitee: { name: 'Test User', email: 'test@example.com' }
      }
    };
    
    const result = await calendlySync.processWebhook(mockWebhookPayload);
    expect(result.status).toBe('processed');
  });
});
```

### 2. Integration Tests

```javascript
// tests/calendly-e2e.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Calendly Webhook Integration', () => {
  it('should process invitee.created webhook', async () => {
    const webhookPayload = {
      event: 'invitee.created',
      time: new Date().toISOString(),
      payload: {
        event: {
          uri: 'https://api.calendly.com/scheduled_events/test123',
          name: 'Test Consultation',
          start_time: '2024-07-15T10:00:00.000000Z',
          end_time: '2024-07-15T11:00:00.000000Z'
        },
        event_type: {
          uri: 'https://api.calendly.com/event_types/residential',
          name: 'Residential Consultation'
        },
        invitee: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    };
    
    const response = await request(app)
      .post('/api/webhooks/calendly')
      .set('calendly-webhook-signature', generateTestSignature(webhookPayload))
      .send(webhookPayload);
    
    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
  });
});
```

### 3. Manual Testing Checklist

- [ ] **API Connection Test**
  - Verify API credentials work
  - Test rate limiting behavior
  - Confirm organization access

- [ ] **Webhook Test**
  - Create test appointment in Calendly
  - Verify webhook is received
  - Check webhook signature validation
  - Test webhook retry logic

- [ ] **Event Synchronization Test**
  - Schedule appointment through widget
  - Verify data sync to database
  - Test cancellation sync
  - Test rescheduling sync

- [ ] **Error Handling Test**
  - Test with invalid API key
  - Test webhook with invalid signature
  - Test network failure scenarios
  - Verify graceful error handling

---

## Troubleshooting

### Common Issues

#### 1. API Authentication Errors

**Error:** `401 Unauthorized`

**Causes:**
- Invalid or expired access token
- Incorrect API endpoint
- Missing authorization header

**Solutions:**
```javascript
// Verify token validity
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.calendly.com/users/me

// Regenerate token if expired
// Check environment variable spelling
console.log('Token:', process.env.CALENDLY_ACCESS_TOKEN?.substring(0, 10) + '...');
```

#### 2. Webhook Not Receiving Events

**Causes:**
- Webhook URL not accessible
- SSL certificate issues
- Firewall blocking requests
- Incorrect webhook registration

**Solutions:**
```bash
# Test webhook endpoint accessibility
curl -X POST https://your-domain.com/api/webhooks/calendly \
     -H "Content-Type: application/json" \
     -d '{"test": true}'

# Check webhook registration
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.calendly.com/webhook_subscriptions
```

#### 3. Event Data Missing

**Causes:**
- Incorrect event type configuration
- Missing custom questions
- Data parsing errors

**Solutions:**
```javascript
// Log full webhook payload for debugging
console.log('Full webhook payload:', JSON.stringify(req.body, null, 2));

// Verify event type configuration
const eventTypes = await calendlySync._getEventTypes();
console.log('Available event types:', eventTypes);
```

#### 4. Rate Limiting Issues

**Error:** `429 Too Many Requests`

**Solutions:**
```javascript
// Implement exponential backoff
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// Enable debug mode
process.env.DEBUG = 'calendly:*';

// Add detailed logging
import debug from 'debug';
const log = debug('calendly:integration');

log('Processing webhook event: %s', event.type);
log('Event payload: %O', event.payload);
```

### Health Check Endpoint

Create a health check endpoint to monitor integration status:

```javascript
// routes/health/calendly.js
router.get('/health/calendly', async (req, res) => {
  try {
    const sync = new CalendlySync();
    const status = sync.getStatus();
    
    // Test API connection
    await sync._getCurrentUser();
    
    res.json({
      status: 'healthy',
      lastSync: status.lastSync,
      eventsTracked: status.eventsTracked,
      apiConnected: true,
      webhookConfigured: status.webhookConfigured
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## Support and Resources

### Documentation Links
- [Calendly API Documentation](https://developer.calendly.com/api-docs)
- [Calendly Webhook Guide](https://developer.calendly.com/api-docs/webhooks)
- [Calendly Widget Documentation](https://help.calendly.com/hc/en-us/articles/223147027)

### Support Contacts
- **Calendly Support**: support@calendly.com
- **Development Team**: dev-team@neffpaving.com
- **Emergency Contact**: emergency@neffpaving.com

### Monitoring and Alerts

Set up monitoring for:
- API response times
- Webhook delivery failures
- Event sync errors
- Rate limit approaching

```javascript
// Example monitoring setup
import { AlertService } from '../services/alert-service.js';

const alertService = new AlertService();

// Monitor API health
setInterval(async () => {
  try {
    await testCalendlyConnection();
  } catch (error) {
    await alertService.sendAlert({
      type: 'calendly_api_down',
      message: 'Calendly API connection failed',
      error: error.message
    });
  }
}, 300000); // Check every 5 minutes
```
