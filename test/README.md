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
