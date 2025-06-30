/**
 * Unit Test Setup
 * Specific setup for unit tests
 */

import { jest } from '@jest/globals';

// Unit test specific setup
beforeEach(() => {
  // Mock external dependencies for unit tests
  jest.clearAllMocks();
  
  // Ensure isolated environment for unit tests
  delete process.env.REAL_API_CALLS;
  
  // Mock timers for unit tests
  jest.useFakeTimers();
});

afterEach(() => {
  // Cleanup after each unit test
  jest.clearAllTimers();
  jest.useRealTimers();
});
