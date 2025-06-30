/**
 * Integration Test Setup
 * Specific setup for integration tests
 */

import { jest } from '@jest/globals';

// Integration test specific setup
beforeEach(() => {
  // Mock external APIs but allow service-to-service communication
  jest.clearAllMocks();
  
  // Set up integration test environment
  process.env.INTEGRATION_TEST = 'true';
  
  // Use real timers for integration tests
  jest.useRealTimers();
});

afterEach(() => {
  // Cleanup after each integration test
  delete process.env.INTEGRATION_TEST;
});
