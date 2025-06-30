// Simple test script for ContractService
// Note: This is a basic test file. For production, consider using a testing framework like Jest

import { ContractService } from '../src/services/contract-service.js';
import { EstimateService } from '../src/services/estimate-service.js';
import fs from 'fs';

class ContractServiceTest {
  constructor() {
    this.contractService = new ContractService();
    this.estimateService = new EstimateService();
    this.testsPassed = 0;
    this.testsTotal = 0;
  }

  async runAllTests() {
    console.log('🧪 Running Contract Service Tests');
    console.log('==================================\n');

    await this.testContractServiceInitialization();
    await this.testDataValidation();
    await this.testContractGeneration();
    await this.testPreviewGeneration();
    await this.testCustomization();
    await this.testTemplateManagement();
    await this.testErrorHandling();

    console.log('\n📊 Test Results');
    console.log('================');
    console.log(`✅ Tests Passed: ${this.testsPassed}`);
    console.log(`❌ Tests Failed: ${this.testsTotal - this.testsPassed}`);
    console.log(`📈 Success Rate: ${Math.round((this.testsPassed / this.testsTotal) * 100)}%`);

    if (this.testsPassed === this.testsTotal) {
      console.log('\n🎉 All tests passed! Contract service is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
  }

  // Test helper methods
  assert(condition, message) {
    this.testsTotal++;
    if (condition) {
      console.log(`✅ ${message}`);
      this.testsPassed++;
    } else {
      console.log(`❌ ${message}`);
    }
  }

  async assertAsync(asyncFunction, message) {
    this.testsTotal++;
    try {
      await asyncFunction();
      console.log(`✅ ${message}`);
      this.testsPassed++;
    } catch (error) {
      console.log(`❌ ${message}: ${error.message}`);
    }
  }

  // Test methods
  async testContractServiceInitialization() {
    console.log('1. Testing Contract Service Initialization');
    console.log('------------------------------------------');

    this.assert(
      this.contractService instanceof ContractService,
      'ContractService instance created successfully'
    );

    this.assert(
      typeof this.contractService.generateContract === 'function',
      'generateContract method exists'
    );

    this.assert(
      typeof this.contractService.validateContractData === 'function',
      'validateContractData method exists'
    );

    this.assert(
      this.contractService.companyInfo &&
      this.contractService.companyInfo.name === 'Neff Paving Company',
      'Default company info is properly set'
    );

    this.assert(
      Object.keys(this.contractService.contractTemplates).length >= 2,
      'Contract templates are loaded'
    );

    console.log('');
  }

  async testDataValidation() {
    console.log('2. Testing Data Validation');
    console.log('---------------------------');

    // Valid data
    const validEstimate = {
      totalCost: 10000,
      timeline: { days: 5 }
    };
    const validClient = {
      name: 'Test Client',
      address: '123 Test St'
    };

    const validValidation = this.contractService.validateContractData(validEstimate, validClient);
    this.assert(
      validValidation.isValid === true,
      'Valid data passes validation'
    );

    // Invalid data - missing estimate
    const invalidValidation1 = this.contractService.validateContractData(null, validClient);
    this.assert(
      invalidValidation1.isValid === false && invalidValidation1.errors.length > 0,
      'Missing estimate data fails validation'
    );

    // Invalid data - missing client
    const invalidValidation2 = this.contractService.validateContractData(validEstimate, null);
    this.assert(
      invalidValidation2.isValid === false && invalidValidation2.errors.length > 0,
      'Missing client data fails validation'
    );

    // Invalid data - incomplete estimate
    const incompleteEstimate = { totalCost: 5000 }; // missing timeline
    const invalidValidation3 = this.contractService.validateContractData(incompleteEstimate, validClient);
    this.assert(
      invalidValidation3.isValid === false,
      'Incomplete estimate data fails validation'
    );

    console.log('');
  }

  async testContractGeneration() {
    console.log('3. Testing Contract Generation');
    console.log('-------------------------------');

    // Prepare test data
    const estimateData = this.estimateService.calculateEstimate(1000, 'residential', {
      premium: false,
      materials: [{ type: 'asphalt', coverage: 1000, quantity: 1 }]
    });

    const clientData = {
      name: 'Test Client',
      address: '123 Test Street, Test City, TS 12345',
      phone: '(555) 123-4567',
      email: 'test@example.com'
    };

    // Test residential contract generation
    await this.assertAsync(async () => {
      const pdfBytes = await this.contractService.generateContract(
        estimateData,
        'residential',
        clientData
      );
      
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty result');
      }
      
      // Save test file for manual verification
      fs.writeFileSync('./test_residential_contract.pdf', pdfBytes);
    }, 'Residential contract generation works');

    // Test commercial contract generation
    await this.assertAsync(async () => {
      const commercialEstimate = this.estimateService.calculateEstimate(5000, 'commercial');
      const pdfBytes = await this.contractService.generateContract(
        commercialEstimate,
        'commercial',
        clientData
      );
      
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty result');
      }
      
      // Save test file for manual verification
      fs.writeFileSync('./test_commercial_contract.pdf', pdfBytes);
    }, 'Commercial contract generation works');

    console.log('');
  }

  async testPreviewGeneration() {
    console.log('4. Testing Preview Generation');
    console.log('------------------------------');

    const estimateData = this.estimateService.calculateEstimate(1500, 'residential');
    const clientData = {
      name: 'Preview Test Client',
      address: '456 Preview St, Preview City, PS 54321',
      phone: '(555) 987-6543',
      email: 'preview@example.com'
    };

    await this.assertAsync(async () => {
      const previewBytes = await this.contractService.generateContractPreview(
        estimateData,
        'residential',
        clientData
      );
      
      if (!previewBytes || previewBytes.length === 0) {
        throw new Error('Preview generation returned empty result');
      }
      
      // Save test file for manual verification
      fs.writeFileSync('./test_contract_preview.pdf', previewBytes);
    }, 'Contract preview generation works');

    console.log('');
  }

  async testCustomization() {
    console.log('5. Testing Customization Features');
    console.log('----------------------------------');

    // Test company branding update
    const originalName = this.contractService.companyInfo.name;
    this.contractService.updateCompanyBranding({
      name: 'Test Paving Company',
      phone: '(555) TEST-123'
    });

    this.assert(
      this.contractService.companyInfo.name === 'Test Paving Company',
      'Company branding update works'
    );

    // Test legal terms update
    this.contractService.updateLegalTerms({
      warrantyPeriod: '5 years',
      paymentTerms: 'Net 10 days'
    });

    this.assert(
      this.contractService.legalTerms.warrantyPeriod === '5 years',
      'Legal terms update works'
    );

    // Restore original name for other tests
    this.contractService.updateCompanyBranding({ name: originalName });

    console.log('');
  }

  async testTemplateManagement() {
    console.log('6. Testing Template Management');
    console.log('-------------------------------');

    // Test getting available templates
    const templates = this.contractService.getAvailableTemplates();
    this.assert(
      Array.isArray(templates) && templates.length >= 2,
      'getAvailableTemplates returns array with templates'
    );

    // Test adding custom template
    const originalTemplateCount = templates.length;
    this.contractService.addCustomTemplate('test-template', {
      title: 'Test Template',
      sections: ['project_details', 'signatures']
    });

    const updatedTemplates = this.contractService.getAvailableTemplates();
    this.assert(
      updatedTemplates.length === originalTemplateCount + 1,
      'Custom template is added successfully'
    );

    this.assert(
      updatedTemplates.includes('test-template'),
      'Custom template appears in available templates'
    );

    // Test loading template
    const template = await this.contractService.loadTemplate('residential');
    this.assert(
      template && template.title && template.sections,
      'Template loading works correctly'
    );

    console.log('');
  }

  async testErrorHandling() {
    console.log('7. Testing Error Handling');
    console.log('--------------------------');

    // Test with invalid template type
    await this.assertAsync(async () => {
      try {
        await this.contractService.generateContract(
          { totalCost: 1000, timeline: { days: 1 } },
          'invalid-template',
          { name: 'Test', address: 'Test' }
        );
        throw new Error('Should have thrown an error for invalid template');
      } catch (error) {
        if (error.message.includes('Should have thrown')) {
          throw error;
        }
        // Expected error, test passes
      }
    }, 'Invalid template type is handled gracefully');

    // Test with malformed data
    await this.assertAsync(async () => {
      try {
        await this.contractService.generateContract(
          'invalid-data',
          'residential',
          { name: 'Test', address: 'Test' }
        );
        throw new Error('Should have thrown an error for invalid data');
      } catch (error) {
        if (error.message.includes('Should have thrown')) {
          throw error;
        }
        // Expected error, test passes
      }
    }, 'Malformed data is handled gracefully');

    console.log('');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(import.meta.url).toString()) {
  const test = new ContractServiceTest();
  test.runAllTests().catch(console.error);
}

export { ContractServiceTest };
