/**
 * End-to-End Test Setup
 * Specific setup for E2E tests
 */

import { jest } from '@jest/globals';

// E2E test specific setup
beforeAll(async () => {
  // Set up E2E test environment
  process.env.E2E_TEST = 'true';
  process.env.TEST_TIMEOUT = '60000';
  
  // Allow longer timeouts for E2E tests
  jest.setTimeout(60000);
});

beforeEach(() => {
  // Reset state for each E2E test
  jest.clearAllMocks();
  
  // Use real timers for E2E tests
  jest.useRealTimers();
  
  // Set up test database state
  global.testDatabase = new Map();
});

afterEach(() => {
  // Cleanup after each E2E test
  if (global.testDatabase) {
    global.testDatabase.clear();
  }
});

afterAll(() => {
  // Cleanup after all E2E tests
  delete process.env.E2E_TEST;
  delete process.env.TEST_TIMEOUT;
});
