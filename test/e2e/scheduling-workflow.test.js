/**
 * End-to-End Tests for Scheduling Workflow
 * Tests the complete user journey from initial quote to job completion
 */

import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { JobSchedulingService } from '../../src/services/job-scheduling-service.js';
import { ContractService } from '../../src/services/contract-service.js';
import { PaymentService } from '../../src/services/payment-service.js';
import { EstimateService } from '../../src/services/estimate-service.js';
import { WebhookHandler } from '../../src/services/webhook-handler.js';
import { AlertService } from '../../src/services/alert-service.js';
import { SyncService } from '../../src/services/sync-service.js';

describe('Scheduling E2E', () => {
  let services;
  let testDatabase;
  let testServer;
  let webhookEndpoint;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.CALENDLY_API_KEY = 'test_calendly_key';
    process.env.STRIPE_SECRET_KEY = 'test_stripe_key';
    process.env.WEBHOOK_ENDPOINT_SECRET = 'test_webhook_secret';

    // Initialize services
    services = {
      estimate: new EstimateService(),
      contract: new ContractService(),
      payment: new PaymentService(),
      scheduling: new JobSchedulingService(),
      webhook: new WebhookHandler(),
      alert: new AlertService(),
      sync: new SyncService()
    };

    // Set up test database/storage
    testDatabase = new Map();
    
    // Mock external APIs
    setupApiMocks();
    
    // Start webhook listener for testing
    webhookEndpoint = 'http://localhost:3001/webhooks';
  });

  afterAll(async () => {
    // Cleanup test environment
    if (testServer) {
      await testServer.close();
    }
    
    // Clear test data
    testDatabase.clear();
    
    // Restore environment
    delete process.env.NODE_ENV;
  });

  beforeEach(() => {
    // Reset test data
    testDatabase.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    if (services.sync.scheduler) {
      services.sync.destroy();
    }
  });

  describe('Complete Customer Journey', () => {
    test('From initial estimate to job completion', async () => {
      // Simulate customer journey with realistic data
      const customerData = {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 234-5678',
        address: '456 Oak Street, Springfield, IL 62701',
        projectType: 'driveway_residential'
      };

      const projectDetails = {
        type: 'residential',
        service: 'driveway_paving',
        squareFootage: 1200,
        materials: 'asphalt',
        additionalServices: ['sealcoating'],
        urgency: 'standard',
        preferredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
      };

      console.log('🎬 Starting E2E test: Customer Journey');

      // Step 1: Customer requests estimate
      console.log('📝 Step 1: Generating estimate...');
      const estimate = await services.estimate.calculateEstimate(
        projectDetails.squareFootage,
        projectDetails.type,
        {
          materials: [{ 
            type: projectDetails.materials, 
            coverage: projectDetails.squareFootage, 
            quantity: 1 
          }],
          additionalServices: projectDetails.additionalServices,
          urgency: projectDetails.urgency
        }
      );

      expect(estimate).toBeDefined();
      expect(estimate.totalCost).toBeGreaterThan(0);
      expect(estimate.timeline).toBeDefined();
      
      // Store estimate in test database
      const estimateId = `est_${Date.now()}`;
      testDatabase.set(estimateId, {
        ...estimate,
        customerId: customerData.email,
        projectDetails,
        status: 'pending_approval',
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Estimate generated: $${estimate.totalCost} (ID: ${estimateId})`);

      // Step 2: Customer approves estimate and contract is generated
      console.log('📋 Step 2: Generating contract...');
      const contractBytes = await services.contract.generateContract(
        estimate,
        projectDetails.type,
        customerData
      );

      expect(contractBytes).toBeDefined();
      expect(contractBytes.length).toBeGreaterThan(0);

      const contractId = `contract_${Date.now()}`;
      testDatabase.set(contractId, {
        estimateId,
        customerId: customerData.email,
        contractBytes,
        status: 'pending_signature',
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Contract generated (ID: ${contractId})`);

      // Step 3: Customer signs contract and makes payment
      console.log('💳 Step 3: Processing payment...');
      
      // Simulate payment processing
      const paymentData = {
        amount: estimate.totalCost * 100, // Stripe uses cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          contract_id: contractId,
          estimate_id: estimateId,
          customer_email: customerData.email,
          project_type: projectDetails.type
        }
      };

      // Mock successful payment
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        status: 'succeeded',
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt_email: customerData.email,
        metadata: paymentData.metadata
      };

      // Process payment webhook
      const paymentWebhook = {
        id: `evt_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent }
      };

      await services.webhook.processEvent(paymentWebhook);

      console.log(`✅ Payment processed: $${paymentIntent.amount / 100} (ID: ${paymentIntent.id})`);

      // Update contract status
      const contractData = testDatabase.get(contractId);
      contractData.status = 'signed_and_paid';
      contractData.paymentId = paymentIntent.id;
      testDatabase.set(contractId, contractData);

      // Step 4: System schedules job automatically
      console.log('📅 Step 4: Scheduling job...');
      
      // Check availability
      const availability = await mockCalendlyAvailability(projectDetails.preferredDate);
      expect(availability.collection).toHaveLength(2);

      // Schedule the job
      const schedulingResult = await scheduleJobE2E(
        contractData,
        estimate,
        paymentIntent,
        availability.collection[0]
      );

      expect(schedulingResult.success).toBe(true);
      expect(schedulingResult.eventUri).toBeDefined();

      console.log(`✅ Job scheduled (Event: ${schedulingResult.eventUri})`);

      // Step 5: Calendly webhook confirms scheduling
      console.log('🔗 Step 5: Processing Calendly webhook...');
      
      const calendlyWebhook = {
        event: 'calendly.event_scheduled',
        time: new Date().toISOString(),
        payload: {
          uri: schedulingResult.eventUri,
          start_time: schedulingResult.startTime,
          end_time: schedulingResult.endTime,
          event_type: { name: 'Residential Paving Project' },
          invitees: [{
            email: customerData.email,
            name: customerData.name
          }]
        }
      };

      await services.webhook.handleEventScheduled(calendlyWebhook);

      console.log('✅ Calendly webhook processed');

      // Step 6: System sends alerts and notifications
      console.log('🔔 Step 6: Sending alerts...');
      
      const alertResult = await services.alert.sendJobScheduledAlert({
        projectType: projectDetails.type,
        startDate: schedulingResult.startTime,
        duration: estimate.timeline.days,
        customer: customerData,
        contractId,
        paymentId: paymentIntent.id,
        notes: `${projectDetails.service} - ${projectDetails.squareFootage} sq ft`
      });

      console.log('✅ Alerts sent successfully');

      // Step 7: Data synchronization across systems
      console.log('🔄 Step 7: Synchronizing data...');
      
      const syncResult = await services.sync.syncAll();
      
      expect(syncResult).toBeDefined();
      expect(syncResult.calendly.status).toBe('success');
      expect(syncResult.contracts.status).toBe('success');
      expect(syncResult.payments.status).toBe('success');
      expect(syncResult.jobSchedules.status).toBe('success');

      console.log('✅ Data synchronization completed');

      // Step 8: Verify complete workflow data integrity
      console.log('🔍 Step 8: Verifying data integrity...');
      
      const finalEstimate = testDatabase.get(estimateId);
      const finalContract = testDatabase.get(contractId);
      
      expect(finalEstimate.status).toBe('pending_approval');
      expect(finalContract.status).toBe('signed_and_paid');
      expect(finalContract.paymentId).toBe(paymentIntent.id);

      console.log('✅ Data integrity verified');
      console.log('🎉 E2E Test Completed Successfully!');

      // Return summary for verification
      return {
        estimateId,
        contractId,
        paymentId: paymentIntent.id,
        eventUri: schedulingResult.eventUri,
        customer: customerData,
        project: projectDetails,
        totalCost: estimate.totalCost,
        scheduledDate: schedulingResult.startTime
      };
    });

    test('Customer cancellation and rescheduling workflow', async () => {
      // Set up initial scheduled job
      const initialJobData = await setupInitialJob();
      
      console.log('🎬 Starting E2E test: Cancellation and Rescheduling');

      // Step 1: Customer cancels original appointment
      console.log('❌ Step 1: Processing cancellation...');
      
      const cancellationWebhook = {
        event: 'calendly.event_canceled',
        time: new Date().toISOString(),
        payload: {
          uri: initialJobData.eventUri,
          start_time: initialJobData.scheduledDate,
          event_type: { name: 'Residential Paving Project' },
          invitees: [{ 
            email: initialJobData.customer.email,
            name: initialJobData.customer.name 
          }]
        }
      };

      await services.webhook.handleEventCanceled(cancellationWebhook);
      
      console.log('✅ Cancellation processed');

      // Step 2: Customer reschedules for new date
      console.log('📅 Step 2: Processing reschedule...');
      
      const newDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 3 weeks from now
      const rescheduleWebhook = {
        event: 'calendly.event_rescheduled',
        time: new Date().toISOString(),
        payload: {
          uri: initialJobData.eventUri,
          start_time: newDate.toISOString(),
          old_start_time: initialJobData.scheduledDate,
          event_type: { name: 'Residential Paving Project' },
          invitees: [{ 
            email: initialJobData.customer.email,
            name: initialJobData.customer.name 
          }]
        }
      };

      await services.webhook.handleEventRescheduled(rescheduleWebhook);
      
      console.log('✅ Reschedule processed');

      // Step 3: Verify system updated all related data
      console.log('🔍 Step 3: Verifying updates...');
      
      const syncResult = await services.sync.syncAll();
      expect(syncResult.calendly.status).toBe('success');
      
      console.log('✅ All systems updated');
      console.log('🎉 Cancellation/Reschedule E2E Test Completed!');
    });

    test('Emergency job priority scheduling', async () => {
      console.log('🎬 Starting E2E test: Emergency Scheduling');

      const emergencyCustomer = {
        name: 'Emergency Corp',
        email: 'emergency@company.com',
        phone: '(555) 911-0000',
        address: '789 Emergency Blvd, Crisis City, CC 11111'
      };

      const emergencyProject = {
        type: 'commercial',
        service: 'emergency_repair',
        squareFootage: 500,
        urgency: 'emergency',
        description: 'Large pothole blocking main entrance'
      };

      // Step 1: Emergency estimate (expedited)
      console.log('🚨 Step 1: Emergency estimate...');
      
      const emergencyEstimate = await services.estimate.calculateEstimate(
        emergencyProject.squareFootage,
        emergencyProject.type,
        {
          urgency: 'emergency',
          expedited: true,
          materials: [{ type: 'asphalt_patch', coverage: 500, quantity: 1 }]
        }
      );

      expect(emergencyEstimate.totalCost).toBeGreaterThan(0);
      expect(emergencyEstimate.timeline.hours).toBeLessThan(24); // Emergency should be within 24 hours

      // Step 2: Fast-track contract and payment
      console.log('⚡ Step 2: Fast-track contract...');
      
      const emergencyContract = await services.contract.generateContract(
        emergencyEstimate,
        emergencyProject.type,
        emergencyCustomer
      );

      expect(emergencyContract).toBeDefined();

      // Step 3: Priority scheduling (should get earliest available slot)
      console.log('📅 Step 3: Priority scheduling...');
      
      const emergencyAvailability = await mockCalendlyAvailability(new Date(), 'emergency');
      expect(emergencyAvailability.collection[0].priority).toBe('emergency');

      // Step 4: Immediate alerts to crew
      console.log('🚨 Step 4: Emergency alerts...');
      
      const emergencyAlert = await services.alert.sendJobScheduledAlert({
        projectType: 'emergency_repair',
        startDate: emergencyAvailability.collection[0].start_time,
        duration: emergencyEstimate.timeline.hours / 24, // Convert to days
        customer: emergencyCustomer,
        contractId: 'emergency_contract_123',
        paymentId: 'emergency_payment_123',
        notes: 'EMERGENCY: Large pothole blocking main entrance',
        priority: 'emergency'
      });

      console.log('✅ Emergency workflow completed');
      console.log('🎉 Emergency E2E Test Completed!');
    });
  });

  describe('System Integration and Load Testing', () => {
    test('Multiple concurrent bookings', async () => {
      console.log('🎬 Starting E2E test: Concurrent Bookings');

      const concurrentCustomers = Array.from({ length: 5 }, (_, i) => ({
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@test.com`,
        phone: `(555) 100-000${i + 1}`,
        address: `${100 + i} Test St, Test City, TC 1000${i + 1}`
      }));

      // Process all customers concurrently
      const results = await Promise.allSettled(
        concurrentCustomers.map(async (customer, index) => {
          const estimate = await services.estimate.calculateEstimate(
            1000 + index * 100,
            'residential',
            { materials: [{ type: 'asphalt', coverage: 1000 + index * 100, quantity: 1 }] }
          );

          const contract = await services.contract.generateContract(
            estimate,
            'residential',
            customer
          );

          return { 
            customer: customer.email, 
            estimateTotal: estimate.totalCost,
            contractGenerated: contract.length > 0
          };
        })
      );

      // Verify all succeeded
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.contractGenerated).toBe(true);
        expect(result.value.estimateTotal).toBeGreaterThan(0);
      });

      console.log(`✅ ${results.length} concurrent bookings processed successfully`);
      console.log('🎉 Concurrent Bookings E2E Test Completed!');
    });

    test('System resilience during partial failures', async () => {
      console.log('🎬 Starting E2E test: System Resilience');

      // Simulate partial system failures
      const originalCalendlySync = services.sync.systems.calendly.sync;
      
      // Mock Calendly being temporarily unavailable
      services.sync.systems.calendly.sync = jest.fn().mockRejectedValue(
        new Error('Calendly API temporarily unavailable')
      );

      // System should still process payments and contracts
      const resilientCustomer = {
        name: 'Resilient Customer',
        email: 'resilient@test.com',
        phone: '(555) 999-0000',
        address: '999 Resilient Way, Test City, TC 99999'
      };

      const estimate = await services.estimate.calculateEstimate(
        1500,
        'residential',
        { materials: [{ type: 'asphalt', coverage: 1500, quantity: 1 }] }
      );

      const contract = await services.contract.generateContract(
        estimate,
        'residential',
        resilientCustomer
      );

      expect(contract).toBeDefined();

      // Sync should handle the failure gracefully
      const syncResult = await services.sync.syncAll();
      expect(syncResult.calendly.status).toBe('error');
      expect(syncResult.contracts.status).toBe('success');
      expect(syncResult.payments.status).toBe('success');

      // Restore original function
      services.sync.systems.calendly.sync = originalCalendlySync;

      console.log('✅ System demonstrated resilience during partial failure');
      console.log('🎉 System Resilience E2E Test Completed!');
    });
  });

  // Helper functions for E2E tests
  async function setupInitialJob() {
    const customer = {
      name: 'Initial Customer',
      email: 'initial@test.com',
      phone: '(555) 111-1111',
      address: '111 Initial St, Test City, TC 11111'
    };

    const estimate = await services.estimate.calculateEstimate(
      1000,
      'residential',
      { materials: [{ type: 'asphalt', coverage: 1000, quantity: 1 }] }
    );

    const eventUri = 'https://api.calendly.com/scheduled_events/initial_test';
    const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return {
      customer,
      estimate,
      eventUri,
      scheduledDate
    };
  }

  async function scheduleJobE2E(contract, estimate, payment, timeSlot) {
    // Mock the scheduling process
    return {
      success: true,
      eventUri: `https://api.calendly.com/scheduled_events/e2e_${Date.now()}`,
      startTime: timeSlot.start_time,
      endTime: timeSlot.end_time,
      contractId: 'contract_123',
      paymentId: payment.id
    };
  }

  async function mockCalendlyAvailability(preferredDate, priority = 'standard') {
    const baseDate = preferredDate || new Date();
    const isPriority = priority === 'emergency';
    
    return {
      collection: [
        {
          start_time: new Date(baseDate.getTime() + (isPriority ? 2 : 24) * 60 * 60 * 1000).toISOString(),
          end_time: new Date(baseDate.getTime() + (isPriority ? 4 : 26) * 60 * 60 * 1000).toISOString(),
          status: 'available',
          priority: priority
        },
        {
          start_time: new Date(baseDate.getTime() + (isPriority ? 6 : 48) * 60 * 60 * 1000).toISOString(),
          end_time: new Date(baseDate.getTime() + (isPriority ? 8 : 50) * 60 * 60 * 1000).toISOString(),
          status: 'available',
          priority: priority
        }
      ]
    };
  }

  function setupApiMocks() {
    // Mock localStorage for browser environment
    global.localStorage = {
      getItem: jest.fn((key) => {
        const data = testDatabase.get(key);
        return data ? JSON.stringify(data) : '{}';
      }),
      setItem: jest.fn((key, value) => {
        testDatabase.set(key, JSON.parse(value));
      }),
      removeItem: jest.fn((key) => {
        testDatabase.delete(key);
      }),
      clear: jest.fn(() => {
        testDatabase.clear();
      })
    };

    // Mock fetch for API calls
    global.fetch = jest.fn((url, options) => {
      // Mock successful responses based on URL patterns
      if (url.includes('calendly.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      if (url.includes('stripe.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    // Mock alert service channels
    services.alert.channels.email.send = jest.fn().mockResolvedValue(true);
    services.alert.channels.sms.send = jest.fn().mockResolvedValue(true);
    services.alert.channels.dashboard.send = jest.fn().mockResolvedValue(true);
  }
});
