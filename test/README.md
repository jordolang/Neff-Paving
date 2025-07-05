# Neff Paving Testing Strategy

## Overview

This directory contains comprehensive testing for the Neff Paving website, including deployment platform tests, asset loading verification, routing functionality, and component rendering tests.

## Test Structure

### Deployment Tests (`deployment.test.js`)

The deployment tests ensure that the website is ready for production deployment across different platforms (GitHub Pages, Vercel, etc.).

#### Key Test Areas:

1. **Services Section Rendering**
   - Verifies services section exists and displays correctly
   - Tests service categories (asphalt, concrete)
   - Validates pricing information and contact integration
   - Checks content quality and completeness

2. **Admin Panel Accessibility**
   - Tests admin link accessibility and attributes
   - Validates admin panel structure and navigation
   - Ensures proper authentication handling
   - Verifies responsive design and Bootstrap integration

3. **Asset Loading**
   - Critical CSS and JavaScript asset preloading
   - Font preloading configuration
   - Image optimization and lazy loading
   - Performance optimization verification

4. **Routing Functionality**
   - Navigation structure validation
   - Anchor link configuration
   - Services page redirect setup
   - SEO metadata and canonical URLs

5. **Performance and Accessibility**
   - Image alt attributes
   - Accessibility attributes on interactive elements
   - Meta tag configuration
   - Structured data (JSON-LD) validation

## Test Utilities

### Deployment Helpers (`utils/deployment-helpers.js`)

Comprehensive testing utilities for deployment readiness:

- **AssetTestHelper**: Tests asset loading, preloading, and optimization
- **RoutingTestHelper**: Validates navigation and routing configuration
- **AdminTestHelper**: Tests admin panel structure and accessibility
- **ServicesTestHelper**: Validates services section content and functionality
- **PerformanceTestHelper**: Tests performance optimizations and SEO
- **DeploymentTestRunner**: Orchestrates complete deployment verification

## Running Tests

### All Tests
```bash
npm test
```

### Deployment Tests Only
```bash
npm run test:deployment
```

### Test Categories
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Automated Checks

The deployment tests automatically verify:

### Asset Loading
- ✅ CSS stylesheets are properly linked
- ✅ JavaScript files are loaded
- ✅ Font preloading is configured
- ✅ Images have proper loading attributes
- ✅ Performance optimizations are in place

### Routing Functionality
- ✅ Navigation links work correctly
- ✅ Anchor links point to valid sections
- ✅ Services page redirects properly
- ✅ Canonical URLs are set
- ✅ External links open in new tabs

### Admin Panel Access
- ✅ Admin link is accessible and properly labeled
- ✅ Authentication handling is implemented
- ✅ Admin panel structure is complete
- ✅ Navigation sections are available
- ✅ Responsive design is configured

### Services Section Rendering
- ✅ Services section displays all categories
- ✅ Service details are comprehensive
- ✅ Pricing information is available
- ✅ Contact integration works
- ✅ SEO structure is proper

### Performance and Accessibility
- ✅ Images have alt attributes
- ✅ Interactive elements have proper ARIA labels
- ✅ Meta tags are configured
- ✅ Structured data is present and valid
- ✅ Font optimization is enabled

## Dependencies

- **Jest**: Test framework
- **JSDOM**: DOM environment for Node.js testing
- **@jest/globals**: Jest global functions for ES modules

## Contributing

When adding new features or making changes:

1. Update deployment tests if they affect routing, assets, or core functionality
2. Add appropriate test utilities to the helpers file
3. Ensure all tests pass before deployment
4. Update this README if test structure changes

# Job Scheduling Test Suite

This comprehensive test suite covers the job scheduling infrastructure for the Neff Paving Company system, testing the complete workflow from contract creation to job completion.

## Test Structure

### 📁 Directory Structure
```
test/
├── integration/           # Integration tests
│   └── scheduling.test.js # Job scheduling integration tests
├── unit/                  # Unit tests
│   └── job-scheduling-service.test.js # JobSchedulingService unit tests
├── e2e/                   # End-to-end tests
│   └── scheduling-workflow.test.js # Complete workflow E2E tests
├── setup/                 # Test setup files
│   ├── jest.setup.js     # Global setup
│   ├── unit.setup.js     # Unit test setup
│   ├── integration.setup.js # Integration test setup
│   └── e2e.setup.js      # E2E test setup
├── jest.config.js        # Jest configuration
└── README.md            # This file
```

## Test Types

### 🔧 Unit Tests (`/unit/`)
Tests individual services and methods in isolation:
- JobSchedulingService functionality
- Individual method validation
- Error handling
- Input validation
- Configuration management

### 🔗 Integration Tests (`/integration/`)
Tests interaction between multiple services:
- Complete workflow: contract → payment → scheduling
- Calendly webhook handling
- Alert generation
- Data synchronization
- Error recovery

### 🎭 End-to-End Tests (`/e2e/`)
Tests complete user journeys:
- Customer journey from estimate to job completion
- Cancellation and rescheduling workflows
- Emergency job priority scheduling
- System resilience under load
- Concurrent booking handling

## Running Tests

### Prerequisites
```bash
npm install --save-dev jest @jest/globals babel-jest @babel/preset-env jest-html-reporters
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest --config=test/jest.config.js",
    "test:unit": "jest --config=test/jest.config.js --selectProjects='Unit Tests'",
    "test:integration": "jest --config=test/jest.config.js --selectProjects='Integration Tests'",
    "test:e2e": "jest --config=test/jest.config.js --selectProjects='E2E Tests'",
    "test:coverage": "jest --config=test/jest.config.js --coverage",
    "test:watch": "jest --config=test/jest.config.js --watch",
    "test:ci": "jest --config=test/jest.config.js --ci --coverage --watchAll=false"
  }
}
```

## Test Features

### 🎯 Comprehensive Coverage
- **Contract Service**: PDF generation, validation, customization
- **Payment Service**: Stripe integration, webhooks, error handling
- **Scheduling Service**: Calendly integration, availability, conflicts
- **Alert Service**: Multi-channel notifications (email, SMS, dashboard)
- **Sync Service**: Data synchronization across systems
- **Webhook Handler**: Event processing, error recovery

### 🛡️ Error Scenarios
- API failures and rate limiting
- Network connectivity issues
- Invalid data handling
- System partial failures
- Concurrent operation conflicts

### 📊 Real-world Scenarios
- Standard residential projects
- Commercial projects
- Emergency repairs
- Customer cancellations/rescheduling
- Multiple concurrent bookings

## Test Data & Mocking

### Environment Variables
Tests use mock environment variables:
- `CALENDLY_API_KEY`: Mock Calendly API key
- `STRIPE_SECRET_KEY`: Mock Stripe secret key
- `CALENDLY_WEBHOOK_KEY`: Mock webhook signing key

### Mock Services
- **Calendly API**: Mocked for availability, scheduling, webhooks
- **Stripe API**: Mocked for payments, webhooks
- **Email/SMS**: Mocked notification channels
- **Database**: In-memory test database using Map

### Test Utilities
Global utilities available in all tests:
- `testUtils.createMockCustomer()`: Generate test customer data
- `testUtils.createMockEstimate()`: Generate test estimate data
- `testUtils.createMockPaymentIntent()`: Generate test payment data
- `testUtils.createMockCalendlyEvent()`: Generate test Calendly event

## Coverage Targets

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v1
```

## Test Output

### Console Output
- ✅ Passed tests with descriptions
- ❌ Failed tests with error details
- 📊 Coverage summary
- ⏱️ Performance metrics

### HTML Reports
Generated in `test/coverage/html-report/`:
- Interactive coverage report
- Test results visualization
- Performance metrics

### Coverage Reports
- **Text**: Console output
- **LCOV**: For CI integration
- **HTML**: Detailed browser report

## Debugging Tests

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --config=test/jest.config.js --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

### Single Test File
```bash
npm test -- test/unit/job-scheduling-service.test.js
```

## Best Practices

### ✅ Do's
- Use descriptive test names
- Test both success and failure scenarios
- Mock external dependencies
- Clean up after tests
- Use setup/teardown hooks appropriately

### ❌ Don'ts
- Don't test implementation details
- Don't make tests dependent on each other
- Don't use real API calls in tests
- Don't ignore test failures
- Don't skip error scenario testing

## Contributing

When adding new tests:

1. **Choose the right test type**:
   - Unit: Testing individual methods
   - Integration: Testing service interactions
   - E2E: Testing complete workflows

2. **Follow naming conventions**:
   - Descriptive test names
   - Group related tests in `describe` blocks
   - Use meaningful assertions

3. **Update coverage**:
   - Ensure new code is covered
   - Update coverage thresholds if needed

4. **Document complex tests**:
   - Add comments for complex scenarios
   - Update this README for new test patterns

## Troubleshooting

### Common Issues

**Tests timing out**:
- Increase timeout in jest.config.js
- Check for unresolved promises
- Ensure proper cleanup

**Mock not working**:
- Verify mock is set up before test runs
- Check import paths
- Clear mocks between tests

**Coverage too low**:
- Add tests for uncovered branches
- Test error scenarios
- Remove dead code

**Memory leaks**:
- Clean up timers and intervals
- Clear global state
- Use proper teardown hooks

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Calendly API Documentation](https://developer.calendly.com/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
