/**
 * Node.js verification test for lead tracking functionality
 * Simulates browser localStorage to verify the logic works correctly
 */

// Mock localStorage for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Set up global mocks
global.window = {
  localStorage: new LocalStorageMock(),
  console: console
};

// Import the EstimateService
import { EstimateService } from './src/services/estimate-service.js';

// Run verification tests
async function runTests() {
  console.log('=== Lead Tracking Verification Tests ===\n');

  const estimateService = new EstimateService();
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Calculate estimate with contact info
  console.log('Test 1: Calculate estimate with contact info...');
  try {
    const estimate = estimateService.calculateEstimate(1000, 'residential', {
      contactInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      },
      complexity: 'moderate',
      accessibility: 'easy'
    });

    if (estimate.totalCost > 0) {
      console.log('✓ Estimate calculated successfully: $' + estimate.totalCost.toFixed(2));
      testsPassed++;
    } else {
      throw new Error('Invalid estimate amount');
    }
  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Test 2: Verify lead was tracked
  console.log('\nTest 2: Verify lead was tracked in localStorage...');
  try {
    const leads = estimateService.getLeads();

    if (leads.length === 0) {
      throw new Error('No leads found in storage');
    }

    const lead = leads[0];
    console.log('✓ Lead found:', lead.id);
    testsPassed++;

    // Verify lead structure
    if (lead.status !== 'new') {
      throw new Error(`Expected status 'new', got '${lead.status}'`);
    }
    console.log('✓ Lead status is "new"');
    testsPassed++;

    if (!lead.timestamp) {
      throw new Error('Lead timestamp is missing');
    }
    console.log('✓ Lead has timestamp:', lead.timestamp);
    testsPassed++;

    if (!lead.contactInfo || !lead.contactInfo.name || !lead.contactInfo.email) {
      throw new Error('Lead contact info is incomplete');
    }
    console.log('✓ Lead has complete contact info');
    testsPassed++;

    // Verify localStorage key
    const rawData = window.localStorage.getItem('nurture_leads');
    if (!rawData) {
      throw new Error('nurture_leads key not found in localStorage');
    }
    console.log('✓ Lead stored under "nurture_leads" key');
    testsPassed++;

  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Test 3: Verify getLeadById works
  console.log('\nTest 3: Verify getLeadById...');
  try {
    const leads = estimateService.getLeads();
    const leadId = leads[0].id;
    const lead = estimateService.getLeadById(leadId);

    if (!lead) {
      throw new Error('getLeadById returned null');
    }
    if (lead.id !== leadId) {
      throw new Error('Retrieved wrong lead');
    }
    console.log('✓ getLeadById works correctly');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Test 4: Verify updateLeadStatus works
  console.log('\nTest 4: Verify updateLeadStatus...');
  try {
    const leads = estimateService.getLeads();
    const leadId = leads[0].id;

    const updatedLead = estimateService.updateLeadStatus(leadId, 'contacted');

    if (updatedLead.status !== 'contacted') {
      throw new Error('Status not updated');
    }
    if (!updatedLead.updatedAt) {
      throw new Error('updatedAt timestamp missing');
    }
    console.log('✓ updateLeadStatus works correctly');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Test 5: Verify estimate without contact info doesn't track lead
  console.log('\nTest 5: Verify estimate without contact info...');
  try {
    const initialCount = estimateService.getLeads().length;

    const estimate = estimateService.calculateEstimate(500, 'commercial', {
      complexity: 'simple'
    });

    const finalCount = estimateService.getLeads().length;

    if (finalCount !== initialCount) {
      throw new Error('Lead was tracked without contact info');
    }
    console.log('✓ No lead tracked when contact info is missing');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Test 6: Verify multiple leads can be tracked
  console.log('\nTest 6: Verify multiple leads can be tracked...');
  try {
    estimateService.calculateEstimate(2000, 'commercial', {
      contactInfo: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678'
      }
    });

    const leads = estimateService.getLeads();
    if (leads.length < 2) {
      throw new Error('Second lead not tracked');
    }
    console.log('✓ Multiple leads can be tracked (' + leads.length + ' total)');
    testsPassed++;
  } catch (error) {
    console.log('✗ Test failed:', error.message);
    testsFailed++;
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total tests: ${testsPassed + testsFailed}`);
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✓✓✓ ALL TESTS PASSED! ✓✓✓');
    console.log('\nLead tracking integration is working correctly!');
    console.log('Leads are stored in localStorage under "nurture_leads" key');
    console.log('Each lead has status="new" and a timestamp');
    return 0;
  } else {
    console.log('\n✗✗✗ SOME TESTS FAILED ✗✗✗');
    return 1;
  }
}

// Run the tests
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
