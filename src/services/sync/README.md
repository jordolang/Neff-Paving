# Data Synchronization Service

The Data Synchronization Service provides a comprehensive system for maintaining consistency across all business systems including Calendly, contracts, payments, and job schedules.

## Overview

The sync service is designed to:
- Maintain data consistency across multiple systems
- Handle real-time synchronization events
- Provide conflict resolution for scheduling
- Offer comprehensive error handling and logging
- Support webhook integration for external services

## Architecture

```
SyncService (Main Orchestrator)
├── CalendlySync (Calendar management)
├── ContractSync (Contract lifecycle)
├── PaymentSync (Payment processing)
└── JobScheduleSync (Job scheduling)
```

## Quick Start

```javascript
import SyncService from './services/sync-service.js';

// Initialize the service
const syncService = new SyncService();

// Perform full synchronization
const results = await syncService.syncAll();

// Sync a specific job
const jobResult = await syncService.syncJob('job_123');

// Schedule automatic sync every 5 minutes
const scheduler = syncService.scheduleSync(300000);
```

## Individual Services

### SyncService (Main Service)

The main orchestrator that coordinates all sync operations.

#### Key Methods:
- `syncAll()` - Synchronize all systems
- `syncJob(jobId)` - Sync specific job across systems
- `syncSystem(systemName)` - Sync individual system
- `getStatus()` - Get current sync status
- `scheduleSync(intervalMs)` - Schedule automatic sync

### CalendlySync

Manages synchronization with Calendly API for scheduling events.

#### Features:
- Event creation and cancellation
- Webhook processing for real-time updates
- Event status tracking
- Integration with job scheduling

#### Key Methods:
- `sync()` - Full Calendly sync
- `syncEvent(eventUri)` - Sync specific event
- `createEvent(eventData)` - Create new event
- `cancelEvent(eventUri)` - Cancel event
- `processWebhook(payload)` - Handle webhooks

### ContractSync

Manages contract lifecycle and data consistency.

#### Features:
- Contract creation and updates
- Digital signature support
- Status tracking and validation
- Change history logging

#### Key Methods:
- `sync()` - Full contract sync
- `syncContract(contractId)` - Sync specific contract
- `createContract(contractData)` - Create new contract
- `signContract(contractId, signatureData)` - Sign contract
- `cancelContract(contractId, reason)` - Cancel contract

### PaymentSync

Handles payment processing and reconciliation.

#### Features:
- Payment gateway integration
- Automatic reconciliation
- Refund processing
- Payment history tracking
- Webhook support

#### Key Methods:
- `sync()` - Full payment sync
- `syncPayment(paymentId)` - Sync specific payment
- `processPayment(paymentData)` - Process new payment
- `refundPayment(paymentId, amount, reason)` - Process refund
- `capturePayment(paymentId, amount)` - Capture pre-auth

### JobScheduleSync

Manages job scheduling and conflict resolution.

#### Features:
- Scheduling conflict detection
- Resource allocation (crew, equipment)
- Time slot management
- Job status tracking
- Dependency management

#### Key Methods:
- `sync()` - Full job schedule sync
- `get(jobId)` - Get specific job
- `createJob(jobData)` - Create new job
- `updateJob(jobId, updates)` - Update job
- `rescheduleJob(jobId, newSchedule)` - Reschedule job
- `getAvailableTimeSlots(date, duration)` - Find available slots

## Configuration

### Environment Variables

```bash
# Calendly Configuration
CALENDLY_API_BASE=https://api.calendly.com
CALENDLY_ACCESS_TOKEN=your_token_here
CALENDLY_WEBHOOK_SECRET=your_webhook_secret

# Payment Gateway Configuration
PAYMENT_GATEWAY_API_KEY=your_api_key
PAYMENT_GATEWAY_SECRET=your_secret
```

### System Integration

Each sync service can be configured to integrate with your specific systems:

1. **Database Integration**: Replace placeholder methods with actual database calls
2. **API Integration**: Configure external API endpoints and credentials
3. **Webhook Endpoints**: Set up webhook handling for real-time updates

## Error Handling

The sync service provides comprehensive error handling:

```javascript
try {
  await syncService.syncAll();
} catch (error) {
  console.error('Sync failed:', error);
  
  // Check detailed error status
  const status = syncService.getStatus();
  console.log('Error details:', status.errors);
}
```

## Webhook Integration

### Calendly Webhooks

```javascript
// In your webhook endpoint
app.post('/webhooks/calendly', async (req, res) => {
  try {
    const result = await syncService.systems.calendly.processWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Payment Gateway Webhooks

```javascript
// In your webhook endpoint
app.post('/webhooks/payments', async (req, res) => {
  try {
    const result = await syncService.systems.payments.processWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Monitoring and Logging

Monitor sync operations with built-in status reporting:

```javascript
// Get overall status
const status = syncService.getStatus();
console.log('Sync Status:', status);

// Get individual system status
const calendlyStatus = syncService.systems.calendly.getStatus();
const contractStatus = syncService.systems.contracts.getStatus();
const paymentStatus = syncService.systems.payments.getStatus();
const jobStatus = syncService.systems.jobSchedules.getStatus();
```

## Automatic Synchronization

Set up automatic synchronization for real-time data consistency:

```javascript
// Schedule sync every 5 minutes
const scheduler = syncService.scheduleSync(300000);

// Stop automatic sync when needed
scheduler.stop();

// Check if automatic sync is active
if (scheduler.isActive()) {
  console.log('Automatic sync is running');
}
```

## Best Practices

1. **Error Handling**: Always wrap sync operations in try-catch blocks
2. **Logging**: Enable comprehensive logging for troubleshooting
3. **Monitoring**: Regularly check sync status and error rates
4. **Testing**: Use the example file to test sync operations
5. **Resource Cleanup**: Call `destroy()` when shutting down

## Example Usage

See `src/examples/sync-service-example.js` for comprehensive usage examples including:
- Full system synchronization
- Individual service operations
- Error handling patterns
- Webhook processing
- Resource cleanup

## Integration Points

The sync service integrates with:
- Existing job scheduling service
- Contract management system
- Payment processing service
- Alert/notification system
- Database layer
- External APIs (Calendly, payment gateways)

## Troubleshooting

Common issues and solutions:

1. **Sync Conflicts**: Check scheduling conflicts and resource allocation
2. **API Failures**: Verify credentials and network connectivity
3. **Data Inconsistency**: Review sync logs and run manual reconciliation
4. **Performance Issues**: Adjust sync intervals and batch sizes

## Future Enhancements

Planned improvements:
- Advanced conflict resolution algorithms
- Machine learning for optimal scheduling
- Enhanced webhook security
- Real-time dashboard integration
- Mobile app synchronization
