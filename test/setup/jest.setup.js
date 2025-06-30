/**
 * Global Jest Setup
 * Common setup for all test types
 */

import { jest } from '@jest/globals';

// Global test environment setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.CALENDLY_API_KEY = 'test_calendly_api_key';
  process.env.CALENDLY_WEBHOOK_KEY = 'test_calendly_webhook_key';
  process.env.CALENDLY_ORG_URI = 'https://api.calendly.com/organizations/test_org';
  process.env.STRIPE_SECRET_KEY = 'test_stripe_secret_key';
  process.env.STRIPE_WEBHOOK_SECRET = 'test_stripe_webhook_secret';
  
  // Mock global objects
  global.console = {
    ...console,
    // Suppress console.log in tests unless needed
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
  
  // Mock localStorage
  global.localStorage = {
    getItem: jest.fn(() => '{}'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('success')
    })
  );
  
  // Mock PDF generation library if needed
  global.PDFDocument = jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    end: jest.fn(),
    text: jest.fn(),
    fontSize: jest.fn(),
    font: jest.fn()
  }));
});

// Global cleanup
afterAll(() => {
  // Clean up any global state
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Common test utilities
global.testUtils = {
  /**
   * Create a mock customer for testing
   */
  createMockCustomer: (overrides = {}) => ({
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '(555) 123-4567',
    address: '123 Test Street, Test City, TS 12345',
    ...overrides
  }),
  
  /**
   * Create a mock estimate for testing
   */
  createMockEstimate: (overrides = {}) => ({
    totalCost: 10000,
    timeline: { days: 5 },
    materials: [
      { type: 'asphalt', coverage: 1000, quantity: 1 }
    ],
    laborCost: 6000,
    materialCost: 4000,
    ...overrides
  }),
  
  /**
   * Create a mock payment intent for testing
   */
  createMockPaymentIntent: (overrides = {}) => ({
    id: `pi_test_${Date.now()}`,
    status: 'succeeded',
    amount: 1000000, // $10,000 in cents
    currency: 'usd',
    receipt_email: 'test@example.com',
    metadata: {
      contract_id: 'contract_test_123',
      customer_email: 'test@example.com'
    },
    ...overrides
  }),
  
  /**
   * Create a mock Calendly event for testing
   */
  createMockCalendlyEvent: (overrides = {}) => ({
    uri: `https://api.calendly.com/scheduled_events/test_${Date.now()}`,
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    event_type: {
      name: 'Test Consultation'
    },
    invitees: [{
      uri: 'https://api.calendly.com/invitees/test_invitee',
      email: 'test@example.com',
      name: 'Test Customer'
    }],
    ...overrides
  }),
  
  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate a unique test ID
   */
  generateTestId: (prefix = 'test') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

// Error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up timers after each test
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
