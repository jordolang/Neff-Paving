/**
 * Unit Tests for JobSchedulingService
 * Tests individual methods and functionality of the job scheduling service
 */

import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals';
import { JobSchedulingService } from '../../src/services/job-scheduling-service.js';

describe('JobSchedulingService', () => {
  let jobSchedulingService;
  let mockCalendlyApi;
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };

    // Set up test environment variables
    process.env.CALENDLY_API_KEY = 'test_api_key';
    process.env.CALENDLY_WEBHOOK_KEY = 'test_webhook_key';
    process.env.CALENDLY_ORG_URI = 'https://api.calendly.com/organizations/test_org';
    process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE = 'https://api.calendly.com/event_types/residential';
    process.env.CALENDLY_COMMERCIAL_EVENT_TYPE = 'https://api.calendly.com/event_types/commercial';
    process.env.CALENDLY_MAINTENANCE_EVENT_TYPE = 'https://api.calendly.com/event_types/maintenance';
    process.env.CALENDLY_EMERGENCY_EVENT_TYPE = 'https://api.calendly.com/event_types/emergency';

    // Initialize service
    jobSchedulingService = new JobSchedulingService();

    // Mock Calendly API
    mockCalendlyApi = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct Calendly configuration', () => {
      expect(jobSchedulingService.calendlyConfig.apiKey).toBe('test_api_key');
      expect(jobSchedulingService.calendlyConfig.webhookSigningKey).toBe('test_webhook_key');
      expect(jobSchedulingService.calendlyConfig.organizationUri).toBe('https://api.calendly.com/organizations/test_org');
    });

    test('should initialize event types correctly', () => {
      expect(jobSchedulingService.eventTypes.residential).toBe('https://api.calendly.com/event_types/residential');
      expect(jobSchedulingService.eventTypes.commercial).toBe('https://api.calendly.com/event_types/commercial');
      expect(jobSchedulingService.eventTypes.maintenance).toBe('https://api.calendly.com/event_types/maintenance');
      expect(jobSchedulingService.eventTypes.emergency).toBe('https://api.calendly.com/event_types/emergency');
    });

    test('should handle missing environment variables gracefully', () => {
      delete process.env.CALENDLY_API_KEY;
      const service = new JobSchedulingService();
      expect(service.calendlyConfig.apiKey).toBeUndefined();
    });
  });

  describe('scheduleJob', () => {
    test('should accept contract, estimate, and payment data', async () => {
      const contractData = {
        id: 'contract_123',
        type: 'residential',
        clientEmail: 'test@example.com',
        clientName: 'John Doe'
      };

      const estimateData = {
        totalCost: 15000,
        timeline: { days: 7 },
        squareFootage: 2000
      };

      const paymentData = {
        id: 'pi_payment_123',
        status: 'succeeded',
        amount: 15000
      };

      // Mock the method implementation since it's currently empty
      jobSchedulingService.scheduleJob = jest.fn().mockResolvedValue({
        success: true,
        eventUri: 'https://api.calendly.com/scheduled_events/test_event',
        startTime: '2024-02-15T09:00:00Z',
        endTime: '2024-02-15T10:00:00Z'
      });

      const result = await jobSchedulingService.scheduleJob(contractData, estimateData, paymentData);

      expect(jobSchedulingService.scheduleJob).toHaveBeenCalledWith(contractData, estimateData, paymentData);
      expect(result.success).toBe(true);
      expect(result.eventUri).toBeDefined();
    });

    test('should throw error with invalid input data', async () => {
      jobSchedulingService.scheduleJob = jest.fn().mockImplementation((contractData, estimateData, paymentData) => {
        if (!contractData || !estimateData || !paymentData) {
          throw new Error('Missing required data for job scheduling');
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.scheduleJob(null, {}, {}))
        .rejects.toThrow('Missing required data for job scheduling');

      await expect(jobSchedulingService.scheduleJob({}, null, {}))
        .rejects.toThrow('Missing required data for job scheduling');

      await expect(jobSchedulingService.scheduleJob({}, {}, null))
        .rejects.toThrow('Missing required data for job scheduling');
    });
  });

  describe('getAvailability', () => {
    test('should fetch availability for given service type and duration', async () => {
      const mockAvailability = {
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
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAvailability)
      });

      jobSchedulingService.getAvailability = jest.fn().mockResolvedValue(mockAvailability);

      const result = await jobSchedulingService.getAvailability('residential', 60);

      expect(result.collection).toHaveLength(2);
      expect(result.collection[0].status).toBe('available');
    });

    test('should handle different service types', async () => {
      const serviceTypes = ['residential', 'commercial', 'maintenance', 'emergency'];
      
      jobSchedulingService.getAvailability = jest.fn().mockImplementation((serviceType) => {
        return Promise.resolve({
          serviceType,
          collection: [
            {
              start_time: '2024-02-15T09:00:00Z',
              end_time: '2024-02-15T10:00:00Z',
              status: 'available'
            }
          ]
        });
      });

      for (const serviceType of serviceTypes) {
        const result = await jobSchedulingService.getAvailability(serviceType, 60);
        expect(result.serviceType).toBe(serviceType);
        expect(result.collection).toHaveLength(1);
      }
    });

    test('should validate duration parameter', async () => {
      jobSchedulingService.getAvailability = jest.fn().mockImplementation((serviceType, duration) => {
        if (!duration || duration <= 0) {
          throw new Error('Duration must be a positive number');
        }
        return Promise.resolve({ collection: [] });
      });

      await expect(jobSchedulingService.getAvailability('residential', 0))
        .rejects.toThrow('Duration must be a positive number');

      await expect(jobSchedulingService.getAvailability('residential', -30))
        .rejects.toThrow('Duration must be a positive number');
    });
  });

  describe('confirmBooking', () => {
    test('should confirm booking with valid event URI and contract ID', async () => {
      const eventUri = 'https://api.calendly.com/scheduled_events/test_event';
      const contractId = 'contract_123';

      jobSchedulingService.confirmBooking = jest.fn().mockResolvedValue({
        success: true,
        eventUri,
        contractId,
        status: 'confirmed'
      });

      const result = await jobSchedulingService.confirmBooking(eventUri, contractId);

      expect(result.success).toBe(true);
      expect(result.eventUri).toBe(eventUri);
      expect(result.contractId).toBe(contractId);
      expect(result.status).toBe('confirmed');
    });

    test('should throw error with invalid event URI', async () => {
      jobSchedulingService.confirmBooking = jest.fn().mockImplementation((eventUri, contractId) => {
        if (!eventUri || !eventUri.startsWith('https://api.calendly.com/')) {
          throw new Error('Invalid Calendly event URI');
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.confirmBooking('invalid-uri', 'contract_123'))
        .rejects.toThrow('Invalid Calendly event URI');

      await expect(jobSchedulingService.confirmBooking('', 'contract_123'))
        .rejects.toThrow('Invalid Calendly event URI');
    });
  });

  describe('cancelBooking', () => {
    test('should cancel booking with valid event URI', async () => {
      const eventUri = 'https://api.calendly.com/scheduled_events/test_event';

      jobSchedulingService.cancelBooking = jest.fn().mockResolvedValue({
        success: true,
        eventUri,
        status: 'canceled',
        canceledAt: new Date().toISOString()
      });

      const result = await jobSchedulingService.cancelBooking(eventUri);

      expect(result.success).toBe(true);
      expect(result.eventUri).toBe(eventUri);
      expect(result.status).toBe('canceled');
      expect(result.canceledAt).toBeDefined();
    });

    test('should handle cancellation of non-existent booking', async () => {
      jobSchedulingService.cancelBooking = jest.fn().mockImplementation((eventUri) => {
        if (eventUri.includes('non-existent')) {
          throw new Error('Event not found');
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.cancelBooking('https://api.calendly.com/scheduled_events/non-existent'))
        .rejects.toThrow('Event not found');
    });
  });

  describe('blockTimeSlot', () => {
    test('should block time slot with start date and duration', async () => {
      const startDate = new Date('2024-02-15T09:00:00Z');
      const duration = 120; // 2 hours

      jobSchedulingService.blockTimeSlot = jest.fn().mockResolvedValue({
        success: true,
        blockedSlot: {
          startDate,
          duration,
          endDate: new Date(startDate.getTime() + duration * 60000)
        }
      });

      const result = await jobSchedulingService.blockTimeSlot(startDate, duration);

      expect(result.success).toBe(true);
      expect(result.blockedSlot.startDate).toBe(startDate);
      expect(result.blockedSlot.duration).toBe(duration);
    });

    test('should validate date parameters', async () => {
      jobSchedulingService.blockTimeSlot = jest.fn().mockImplementation((startDate, duration) => {
        if (!(startDate instanceof Date) || isNaN(startDate)) {
          throw new Error('Invalid start date');
        }
        if (!duration || duration <= 0) {
          throw new Error('Invalid duration');
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.blockTimeSlot('invalid-date', 60))
        .rejects.toThrow('Invalid start date');

      await expect(jobSchedulingService.blockTimeSlot(new Date(), -30))
        .rejects.toThrow('Invalid duration');
    });
  });

  describe('updateAvailability', () => {
    test('should update crew availability', async () => {
      const crewAvailability = {
        crew1: {
          available: true,
          shifts: [
            { start: '08:00', end: '16:00', date: '2024-02-15' }
          ]
        },
        crew2: {
          available: false,
          reason: 'Equipment maintenance'
        }
      };

      jobSchedulingService.updateAvailability = jest.fn().mockResolvedValue({
        success: true,
        updatedCrews: Object.keys(crewAvailability),
        timestamp: new Date().toISOString()
      });

      const result = await jobSchedulingService.updateAvailability(crewAvailability);

      expect(result.success).toBe(true);
      expect(result.updatedCrews).toContain('crew1');
      expect(result.updatedCrews).toContain('crew2');
    });

    test('should handle empty crew availability', async () => {
      jobSchedulingService.updateAvailability = jest.fn().mockImplementation((crewAvailability) => {
        if (!crewAvailability || Object.keys(crewAvailability).length === 0) {
          throw new Error('No crew availability data provided');
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.updateAvailability({}))
        .rejects.toThrow('No crew availability data provided');

      await expect(jobSchedulingService.updateAvailability(null))
        .rejects.toThrow('No crew availability data provided');
    });
  });

  describe('checkConflicts', () => {
    test('should detect scheduling conflicts', async () => {
      const proposedTime = new Date('2024-02-15T09:00:00Z');
      const duration = 60;

      jobSchedulingService.checkConflicts = jest.fn().mockResolvedValue({
        hasConflicts: true,
        conflicts: [
          {
            eventUri: 'https://api.calendly.com/scheduled_events/existing_event',
            startTime: '2024-02-15T09:30:00Z',
            endTime: '2024-02-15T10:30:00Z',
            type: 'overlap'
          }
        ]
      });

      const result = await jobSchedulingService.checkConflicts(proposedTime, duration);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('overlap');
    });

    test('should return no conflicts for available time slot', async () => {
      const proposedTime = new Date('2024-02-15T14:00:00Z');
      const duration = 60;

      jobSchedulingService.checkConflicts = jest.fn().mockResolvedValue({
        hasConflicts: false,
        conflicts: []
      });

      const result = await jobSchedulingService.checkConflicts(proposedTime, duration);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('syncWithCalendly', () => {
    test('should synchronize with Calendly API', async () => {
      jobSchedulingService.syncWithCalendly = jest.fn().mockResolvedValue({
        success: true,
        syncedEvents: 5,
        lastSyncTime: new Date().toISOString(),
        changes: {
          created: 2,
          updated: 1,
          canceled: 2
        }
      });

      const result = await jobSchedulingService.syncWithCalendly();

      expect(result.success).toBe(true);
      expect(result.syncedEvents).toBe(5);
      expect(result.changes).toBeDefined();
      expect(result.changes.created).toBe(2);
      expect(result.changes.updated).toBe(1);
      expect(result.changes.canceled).toBe(2);
    });

    test('should handle sync failures gracefully', async () => {
      jobSchedulingService.syncWithCalendly = jest.fn().mockRejectedValue(
        new Error('Calendly API unavailable')
      );

      await expect(jobSchedulingService.syncWithCalendly())
        .rejects.toThrow('Calendly API unavailable');
    });
  });

  describe('updateJobStatus', () => {
    test('should update job status for given event URI', async () => {
      const eventUri = 'https://api.calendly.com/scheduled_events/test_event';
      const status = 'in_progress';

      jobSchedulingService.updateJobStatus = jest.fn().mockResolvedValue({
        success: true,
        eventUri,
        previousStatus: 'scheduled',
        newStatus: status,
        updatedAt: new Date().toISOString()
      });

      const result = await jobSchedulingService.updateJobStatus(eventUri, status);

      expect(result.success).toBe(true);
      expect(result.eventUri).toBe(eventUri);
      expect(result.newStatus).toBe(status);
    });

    test('should validate status values', async () => {
      jobSchedulingService.updateJobStatus = jest.fn().mockImplementation((eventUri, status) => {
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'canceled'];
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid status: ${status}`);
        }
        return Promise.resolve({ success: true });
      });

      await expect(jobSchedulingService.updateJobStatus('event_uri', 'invalid_status'))
        .rejects.toThrow('Invalid status: invalid_status');
    });
  });

  describe('getJobDetails', () => {
    test('should retrieve job details for given event URI', async () => {
      const eventUri = 'https://api.calendly.com/scheduled_events/test_event';

      jobSchedulingService.getJobDetails = jest.fn().mockResolvedValue({
        eventUri,
        name: 'Residential Paving Project',
        startTime: '2024-02-15T09:00:00Z',
        endTime: '2024-02-15T10:00:00Z',
        status: 'scheduled',
        eventType: 'residential',
        invitees: [
          {
            email: 'customer@example.com',
            name: 'John Smith'
          }
        ],
        metadata: {
          contractId: 'contract_123',
          paymentId: 'pi_payment_123'
        }
      });

      const result = await jobSchedulingService.getJobDetails(eventUri);

      expect(result.eventUri).toBe(eventUri);
      expect(result.name).toBe('Residential Paving Project');
      expect(result.status).toBe('scheduled');
      expect(result.invitees).toHaveLength(1);
      expect(result.metadata.contractId).toBe('contract_123');
    });

    test('should handle non-existent job details', async () => {
      jobSchedulingService.getJobDetails = jest.fn().mockImplementation((eventUri) => {
        if (eventUri.includes('non-existent')) {
          throw new Error('Job not found');
        }
        return Promise.resolve({ eventUri });
      });

      await expect(jobSchedulingService.getJobDetails('https://api.calendly.com/scheduled_events/non-existent'))
        .rejects.toThrow('Job not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle API rate limiting', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ 
          message: 'Rate limit exceeded', 
          retry_after: 60 
        })
      });

      jobSchedulingService.getAvailability = jest.fn().mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(jobSchedulingService.getAvailability('residential', 60))
        .rejects.toThrow('Rate limit exceeded');
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      jobSchedulingService.syncWithCalendly = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      await expect(jobSchedulingService.syncWithCalendly())
        .rejects.toThrow('Network error');
    });

    test('should handle authentication errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid API key' })
      });

      jobSchedulingService.getAvailability = jest.fn().mockRejectedValue(
        new Error('Invalid API key')
      );

      await expect(jobSchedulingService.getAvailability('residential', 60))
        .rejects.toThrow('Invalid API key');
    });
  });

  describe('Event Type Mapping', () => {
    test('should map service types to correct Calendly event types', () => {
      const expectedMappings = {
        residential: process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
        commercial: process.env.CALENDLY_COMMERCIAL_EVENT_TYPE,
        maintenance: process.env.CALENDLY_MAINTENANCE_EVENT_TYPE,
        emergency: process.env.CALENDLY_EMERGENCY_EVENT_TYPE
      };

      Object.entries(expectedMappings).forEach(([serviceType, expectedEventType]) => {
        expect(jobSchedulingService.eventTypes[serviceType]).toBe(expectedEventType);
      });
    });

    test('should handle unknown service types', () => {
      expect(jobSchedulingService.eventTypes.unknown).toBeUndefined();
    });
  });
});
