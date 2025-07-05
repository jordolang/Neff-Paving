/**
 * Jest Configuration for Job Scheduling Test Suite
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'mjs', 'json'],
  
  // Transform ES modules
  transform: {
    '^.+\\.m?js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: false
        }]
      ]
    }]
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@test/(.*)$': '<rootDir>/$1'
  },
  
  // Test directories
  testMatch: [
    '<rootDir>/**/*.test.js',
    '<rootDir>/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/setup/jest.setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '../src/services/job-scheduling-service.js',
    '../src/services/webhook-handler.js',
    '../src/services/alert-service.js',
    '../src/services/sync-service.js',
    '../src/services/contract-service.js',
    '../src/services/payment-service.js',
    '../src/services/estimate-service.js',
    '../src/utils/asset-loader.js',
    '../index.html',
    '../admin/index.html'
  ],
  
  // Ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/coverage/'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit
  forceExit: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Globals
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test/coverage/html-report',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // Test suites configuration
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/setup/unit.setup.js']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/setup/integration.setup.js']
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/setup/e2e.setup.js'],
      testTimeout: 60000
    },
    {
      displayName: 'Deployment Tests',
      testMatch: ['<rootDir>/deployment.test.js'],
      setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
      testEnvironment: 'node',
      testTimeout: 30000
    }
  ]
};
