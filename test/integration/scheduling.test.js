/**
 * Job Scheduling Integration Tests
 * Tests the complete workflow from contract creation to job scheduling
 */

import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { JobSchedulingService } from '../../src/services/job-scheduling-service.js';
import { ContractService } from '../../src/services/contract-service.js';
import { PaymentService } from '../../src/services/payment-service.js';
import { WebhookHandler } from '../../src/services/webhook-handler.js';
import { AlertService } from '../../src/services/alert-service.js';
import { SyncService } from '../../src/services/sync-service.js';

describe('Job Scheduling Integration', () => {
  let jobSchedulingService;
  let contractService;
  let paymentService;
  let webhookHandler;
  let alertService;
  let syncService;
  let mockCalendlyApi;
  let mockStripeApi;

  beforeEach(() => {
    // Initialize services
    jobSchedulingService = new JobSchedulingService();
    contractService = new ContractService();
    paymentService = new PaymentService();
    webhookHandler = new WebhookHandler();
    alertService = new AlertService();
    syncService = new SyncService();

    // Mock external APIs
    mockCalendlyApi = {
      getAvailability: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      cancelEvent: jest.fn()
    };

    mockStripeApi = {
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      retrievePayment: jest.fn()
    };

    // Mock environment variables
    process.env.CALENDLY_API_KEY = 'test_calendly_key';
    process.env.CALENDLY_WEBHOOK_KEY = 'test_webhook_key';
    process.env.STRIPE_SECRET_KEY = 'test_stripe_key';
    process.env.CALENDLY_ORG_URI = 'https://api.calendly.com/organizations/test';

    // Setup localStorage mock for browser environment
    if (typeof window !== 'undefined') {
      global.localStorage = {
        getItem: jest.fn(() => '{}'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (syncService.scheduler) {
      syncService.destroy();
    }
  });

  test('Complete workflow: contract -> payment -> scheduling', async () => {
    // Test data
    const estimateData = {
      totalCost: 15000,
      timeline: { days: 7 },
      materials: [
        { type: 'asphalt', coverage: 2000, quantity: 2 }
      ],
      laborCost: 8000,
      materialCost: 7000
    };

    const clientData = {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Springfield, IL 62701'
    };

    const projectData = {
      type: 'residential',
      squareFootage: 2000,
      location: clientData.address,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      duration: 3 // days
    };

    // Step 1: Generate contract
    const contractPdfBytes = await contractService.generateContract(
      estimateData,
      'residential',
      clientData
    );

    expect(contractPdfBytes).toBeDefined();
    expect(contractPdfBytes.length).toBeGreaterThan(0);

    // Step 2: Create payment intent
    mockStripeApi.createPaymentIntent.mockResolvedValue({
      id: 'pi_test_payment_intent',
      status: 'requires_payment_method',
      amount: estimateData.totalCost * 100,
      currency: 'usd',
      metadata: {
        contract_id: 'contract_123',
        project_type: projectData.type
      }
    });

    const paymentIntent = await mockStripeApi.createPaymentIntent({
      amount: estimateData.totalCost * 100,
      currency: 'usd',
      metadata: {
        contract_id: 'contract_123',
        project_type: projectData.type,
        customer_email: clientData.email
      }
    });

    expect(paymentIntent.id).toBe('pi_test_payment_intent');
    expect(paymentIntent.amount).toBe(estimateData.totalCost * 100);

    // Step 3: Simulate payment success webhook
    const paymentSuccessEvent = {
      id: 'evt_test_webhook',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntent.id,
          status: 'succeeded',
          amount: paymentIntent.amount,
          currency: 'usd',
          receipt_email: clientData.email,
          metadata: paymentIntent.metadata
        }
      }
    };

    await webhookHandler.processEvent(paymentSuccessEvent);

    // Verify payment status was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'payments',
      expect.stringContaining(paymentIntent.id)
    );

    // Step 4: Get available time slots
    mockCalendlyApi.getAvailability.mockResolvedValue({
      collection: [
        {
          start_time: '2024-02-15T09:00:00Z',
          end_time: '2024-02-15T10:00:00Z',
          status: 'available'
        },
        {
          start_time: '2024-02-15T14:00:00Z',
          end_time: '2024-02-15T15:00:00Z',
          status: 'available'
        }
      ]
    });

    const availability = await mockCalendlyApi.getAvailability({
      event_type: 'residential',
      start_date: '2024-02-15',
      end_date: '2024-02-16'
    });

    expect(availability.collection).toHaveLength(2);
    expect(availability.collection[0].status).toBe('available');

    // Step 5: Schedule job
    mockCalendlyApi.createEvent.mockResolvedValue({
      resource: {
        uri: 'https://api.calendly.com/scheduled_events/test_event',
        name: 'Residential Paving Project',
        start_time: '2024-02-15T09:00:00Z',
        end_time: '2024-02-15T10:00:00Z',
        status: 'active',
        event_type: {
          name: 'Residential Site Consultation'
        },
        invitees: [{
          uri: 'https://api.calendly.com/invitees/test_invitee',
          email: clientData.email,
          name: clientData.name
        }]
      }
    });

    const scheduledEvent = await mockCalendlyApi.createEvent({
      event_type: process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
      start_time: '2024-02-15T09:00:00Z',
      invitee_email: clientData.email,
      invitee_name: clientData.name
    });

    expect(scheduledEvent.resource.uri).toBeDefined();
    expect(scheduledEvent.resource.status).toBe('active');

    // Step 6: Process Calendly webhook for scheduled event
    const calendlyWebhookEvent = {
      event: 'calendly.event_scheduled',
      time: new Date().toISOString(),
      payload: {
        uri: scheduledEvent.resource.uri,
        start_time: scheduledEvent.resource.start_time,
        end_time: scheduledEvent.resource.end_time,
        event_type: {
          name: 'Residential Site Consultation'
        },
        invitees: [{
          email: clientData.email,
          name: clientData.name
        }]
      }
    };

    await webhookHandler.handleEventScheduled(calendlyWebhookEvent);

    // Verify booking was stored
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'calendly_bookings',
      expect.stringContaining(scheduledEvent.resource.uri)
    );

    // Step 7: Verify data synchronization
    const syncResult = await syncService.syncAll();

    expect(syncResult).toBeDefined();
    expect(syncResult.calendly.status).toBe('success');
    expect(syncResult.contracts.status).toBe('success');
    expect(syncResult.payments.status).toBe('success');
    expect(syncResult.jobSchedules.status).toBe('success');

    // Step 8: Verify alerts were generated
    const alertSpy = jest.spyOn(alertService, 'sendJobScheduledAlert');
    
    await alertService.sendJobScheduledAlert({
      projectType: projectData.type,
      startDate: scheduledEvent.resource.start_time,
      duration: projectData.duration,
      customer: clientData,
      contractId: 'contract_123',
      paymentId: paymentIntent.id,
      notes: 'Integration test job'
    });

    expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({
      projectType: projectData.type,
      customer: clientData,
      contractId: 'contract_123',
      paymentId: paymentIntent.id
    }));
  });

  test('Calendly webhook handling', async () => {
    const testEvents = [
      {
        type: 'calendly.event_scheduled',
        payload: {
          uri: 'https://api.calendly.com/scheduled_events/event_1',
          start_time: '2024-02-20T10:00:00Z',
          end_time: '2024-02-20T11:00:00Z',
          event_type: { name: 'Commercial Consultation' },
          invitees: [{ email: 'test@company.com', name: 'Test Company' }]
        }
      },
      {
        type: 'calendly.event_canceled',
        payload: {
          uri: 'https://api.calendly.com/scheduled_events/event_1',
          start_time: '2024-02-20T10:00:00Z',
          end_time: '2024-02-20T11:00:00Z',
          event_type: { name: 'Commercial Consultation' },
          invitees: [{ email: 'test@company.com', name: 'Test Company' }]
        }
      },
      {
        type: 'calendly.event_rescheduled',
        payload: {
          uri: 'https://api.calendly.com/scheduled_events/event_1',
          start_time: '2024-02-21T14:00:00Z',
          end_time: '2024-02-21T15:00:00Z',
          old_start_time: '2024-02-20T10:00:00Z',
          event_type: { name: 'Commercial Consultation' },
          invitees: [{ email: 'test@company.com', name: 'Test Company' }]
        }
      }
    ];

    for (const event of testEvents) {
      await expect(webhookHandler.processEvent(event)).resolves.not.toThrow();
    }

    // Verify event logging
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'calendly_bookings',
      expect.any(String)
    );
  });

  test('Alert generation', async () => {
    const jobData = {
      projectType: 'commercial',
      startDate: '2024-03-01T08:00:00Z',
      duration: 5,
      customer: {
        name: 'ABC Corporation',
        email: 'contact@abc-corp.com',
        phone: '(555) 987-6543'
      },
      contractId: 'contract_456',
      paymentId: 'pi_commercial_payment',
      notes: 'Large parking lot resurfacing project'
    };

    // Mock alert channels
    const emailSpy = jest.spyOn(alertService.channels.email, 'send').mockResolvedValue(true);
    const smsSpy = jest.spyOn(alertService.channels.sms, 'send').mockResolvedValue(true);
    const dashboardSpy = jest.spyOn(alertService.channels.dashboard, 'send').mockResolvedValue(true);

    await alertService.sendJobScheduledAlert(jobData);

    // Verify all channels were notified
    expect(emailSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Job Scheduled: commercial',
      customer: jobData.customer,
      contract: jobData.contractId,
      payment: jobData.paymentId
    }));

    expect(smsSpy).toHaveBeenCalled();
    expect(dashboardSpy).toHaveBeenCalled();
  });

  test('Data synchronization', async () => {
    // Test individual system sync
    const calendlyResult = await syncService.syncSystem('calendly');
    expect(calendlyResult.system).toBe('calendly');
    expect(calendlyResult.result).toBeDefined();

    const contractsResult = await syncService.syncSystem('contracts');
    expect(contractsResult.system).toBe('contracts');
    expect(contractsResult.result).toBeDefined();

    const paymentsResult = await syncService.syncSystem('payments');
    expect(paymentsResult.system).toBe('payments');
    expect(paymentsResult.result).toBeDefined();

    const jobSchedulesResult = await syncService.syncSystem('jobSchedules');
    expect(jobSchedulesResult.system).toBe('jobSchedules');
    expect(jobSchedulesResult.result).toBeDefined();

    // Test full sync
    const fullSyncResult = await syncService.syncAll();
    expect(fullSyncResult.calendly).toBeDefined();
    expect(fullSyncResult.contracts).toBeDefined();
    expect(fullSyncResult.payments).toBeDefined();
    expect(fullSyncResult.jobSchedules).toBeDefined();
    expect(fullSyncResult.duration).toBeGreaterThan(0);
    expect(fullSyncResult.timestamp).toBeDefined();

    // Test sync status
    const status = syncService.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.lastSync).toBeDefined();
    expect(status.systemsStatus).toBeDefined();
  });

  test('Error handling and recovery', async () => {
    // Test webhook processing with invalid data
    const invalidWebhookEvent = {
      type: 'unknown_event_type',
      data: { invalid: 'data' }
    };

    await expect(webhookHandler.processEvent(invalidWebhookEvent))
      .resolves.not.toThrow();

    // Test sync failure recovery
    const originalSync = syncService.systems.calendly.sync;
    syncService.systems.calendly.sync = jest.fn().mockRejectedValue(new Error('Calendly API error'));

    const syncResult = await syncService.syncAll();
    expect(syncResult.calendly.status).toBe('error');
    expect(syncResult.calendly.error).toContain('Calendly API error');

    // Restore original method
    syncService.systems.calendly.sync = originalSync;

    // Test payment failure handling
    const paymentFailureEvent = {
      id: 'evt_payment_failed',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed_payment',
          status: 'failed',
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined.',
            type: 'card_error'
          }
        }
      }
    };

    await expect(webhookHandler.processEvent(paymentFailureEvent))
      .resolves.not.toThrow();
  });

  test('Scheduled sync automation', async () => {
    const scheduler = syncService.scheduleSync(1000); // 1 second for testing
    
    expect(scheduler.isActive()).toBe(true);

    // Wait for at least one sync cycle
    await new Promise(resolve => setTimeout(resolve, 1100));

    scheduler.stop();
    expect(scheduler.isActive()).toBe(false);
  });

  test('Concurrent workflow handling', async () => {
    // Simulate multiple concurrent workflows
    const workflows = Array.from({ length: 3 }, (_, i) => ({
      estimateData: {
        totalCost: 10000 + i * 1000,
        timeline: { days: 5 + i },
        materials: [{ type: 'asphalt', coverage: 1000 + i * 100, quantity: 1 }]
      },
      clientData: {
        name: `Client ${i + 1}`,
        email: `client${i + 1}@example.com`,
        phone: `(555) 100-000${i + 1}`,
        address: `${123 + i} Test St, Test City, TS 1234${i + 1}`
      }
    }));

    // Process all workflows concurrently
    const results = await Promise.allSettled(
      workflows.map(async (workflow, index) => {
        const contract = await contractService.generateContract(
          workflow.estimateData,
          'residential',
          workflow.clientData
        );

        expect(contract).toBeDefined();
        return { workflowId: index, success: true };
      })
    );

    // Verify all workflows completed successfully
    results.forEach((result, index) => {
      expect(result.status).toBe('fulfilled');
      expect(result.value.workflowId).toBe(index);
      expect(result.value.success).toBe(true);
    });
  });
});
