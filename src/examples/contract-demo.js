import { ContractService } from '../services/contract-service.js';
import { EstimateService } from '../services/estimate-service.js';
import fs from 'fs';

// Example usage and demonstration of the ContractService
async function demonstrateContractGeneration() {
  console.log('🏗️ Contract Generation System Demo');
  console.log('=====================================\n');

  // Initialize services
  const contractService = new ContractService();
  const estimateService = new EstimateService();

  // Example client data
  const clientData = {
    name: 'John Smith',
    address: '456 Oak Street, Springfield, IL 62701',
    phone: '(555) 987-6543',
    email: 'john.smith@email.com'
  };

  // Generate an estimate using the EstimateService
  const estimateData = estimateService.calculateEstimate(2500, 'residential', {
    premium: true,
    complexity: 'moderate',
    accessibility: 'easy',
    season: 'peak',
    urgency: 'standard',
    materials: [
      { type: 'asphalt', coverage: 2500, quantity: 1 },
      { type: 'sealcoating', coverage: 2500, quantity: 1 }
    ],
    startDate: '2024-03-15'
  });

  console.log('1. Generated Estimate Data:');
  console.log('---------------------------');
  console.log(`Total Cost: $${estimateData.totalCost.toLocaleString()}`);
  console.log(`Timeline: ${estimateData.timeline.days} days`);
  console.log(`Square Footage: 2,500 sq ft`);
  console.log('');

  // Validate contract data
  const validation = contractService.validateContractData(estimateData, clientData);
  console.log('2. Contract Data Validation:');
  console.log('-----------------------------');
  console.log(`Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('Errors:', validation.errors);
  }
  console.log('');

  // Generate residential contract
  console.log('3. Generating Residential Contract...');
  console.log('--------------------------------------');
  try {
    const residentialPDF = await contractService.generateContract(
      estimateData, 
      'residential', 
      clientData
    );
    
    // Save the PDF file
    fs.writeFileSync('./residential_contract.pdf', residentialPDF);
    console.log('✅ Residential contract generated successfully');
    console.log('📄 Saved as: residential_contract.pdf');
    console.log(`📊 File size: ${residentialPDF.length} bytes`);
  } catch (error) {
    console.error('❌ Error generating residential contract:', error.message);
  }
  console.log('');

  // Generate commercial contract
  console.log('4. Generating Commercial Contract...');
  console.log('-------------------------------------');
  try {
    const commercialEstimate = estimateService.calculateEstimate(10000, 'commercial', {
      premium: true,
      complexity: 'complex',
      accessibility: 'moderate',
      season: 'regular',
      urgency: 'rush',
      materials: [
        { type: 'concrete', coverage: 10000, quantity: 1 },
        { type: 'striping', coverage: 10000, quantity: 1 }
      ],
      startDate: '2024-04-01'
    });

    const commercialClientData = {
      name: 'ABC Corporation',
      address: '789 Business Park Drive, Springfield, IL 62703',
      phone: '(555) 123-9876',
      email: 'procurement@abccorp.com'
    };

    const commercialPDF = await contractService.generateContract(
      commercialEstimate, 
      'commercial', 
      commercialClientData
    );
    
    // Save the PDF file
    fs.writeFileSync('./commercial_contract.pdf', commercialPDF);
    console.log('✅ Commercial contract generated successfully');
    console.log('📄 Saved as: commercial_contract.pdf');
    console.log(`📊 File size: ${commercialPDF.length} bytes`);
  } catch (error) {
    console.error('❌ Error generating commercial contract:', error.message);
  }
  console.log('');

  // Generate contract preview
  console.log('5. Generating Contract Preview...');
  console.log('----------------------------------');
  try {
    const previewPDF = await contractService.generateContractPreview(
      estimateData, 
      'residential', 
      clientData
    );
    
    // Save the preview PDF file
    fs.writeFileSync('./contract_preview.pdf', previewPDF);
    console.log('✅ Contract preview generated successfully');
    console.log('📄 Saved as: contract_preview.pdf');
    console.log('🔍 Preview includes watermark for security');
    console.log(`📊 File size: ${previewPDF.length} bytes`);
  } catch (error) {
    console.error('❌ Error generating contract preview:', error.message);
  }
  console.log('');

  // Demonstrate customization features
  console.log('6. Demonstrating Customization Features:');
  console.log('----------------------------------------');
  
  // Update company branding
  contractService.updateCompanyBranding({
    name: 'Neff Premium Paving Solutions',
    phone: '(555) NEW-PAVE',
    email: 'contracts@neffpaving.com'
  });
  console.log('✅ Company branding updated');

  // Update legal terms
  contractService.updateLegalTerms({
    warrantyPeriod: '3 years',
    paymentTerms: 'Net 15 days'
  });
  console.log('✅ Legal terms updated');

  // Show available templates
  const availableTemplates = contractService.getAvailableTemplates();
  console.log('📋 Available templates:', availableTemplates.join(', '));

  // Add custom template
  contractService.addCustomTemplate('maintenance', {
    title: 'Maintenance Service Contract',
    sections: [
      'project_details',
      'scope_of_work',
      'pricing',
      'payment_terms',
      'warranty',
      'signatures'
    ]
  });
  console.log('✅ Custom maintenance template added');
  console.log('📋 Updated templates:', contractService.getAvailableTemplates().join(', '));
  console.log('');

  // Generate contract with updated branding
  console.log('7. Generating Contract with Updated Branding...');
  console.log('-----------------------------------------------');
  try {
    const brandedPDF = await contractService.generateContract(
      estimateData, 
      'residential', 
      clientData
    );
    
    // Save the branded PDF file
    fs.writeFileSync('./branded_contract.pdf', brandedPDF);
    console.log('✅ Branded contract generated successfully');
    console.log('📄 Saved as: branded_contract.pdf');
    console.log('🎨 Contract includes updated company branding');
    console.log(`📊 File size: ${brandedPDF.length} bytes`);
  } catch (error) {
    console.error('❌ Error generating branded contract:', error.message);
  }
  console.log('');

  console.log('🎉 Contract Generation Demo Complete!');
  console.log('=====================================');
  console.log('Generated files:');
  console.log('• residential_contract.pdf - Standard residential contract');
  console.log('• commercial_contract.pdf - Commercial contract with compliance sections');
  console.log('• contract_preview.pdf - Preview version with watermark');
  console.log('• branded_contract.pdf - Contract with updated branding');
  console.log('');
  console.log('Features demonstrated:');
  console.log('✓ Dynamic PDF generation with estimate data');
  console.log('✓ Multiple contract templates (residential/commercial)');
  console.log('✓ Company branding and customization');
  console.log('✓ Legal terms and compliance sections');
  console.log('✓ Preview functionality with watermarks');
  console.log('✓ Data validation and error handling');
  console.log('✓ Template customization and management');
}

// Integration example for web application
function webApplicationExample() {
  console.log('\n🌐 Web Application Integration Example');
  console.log('======================================');
  
  const exampleCode = `
// Example web application integration
import { ContractService } from './services/contract-service.js';

class ContractController {
  constructor() {
    this.contractService = new ContractService();
  }

  // API endpoint to generate contract
  async generateContract(req, res) {
    try {
      const { estimateData, contractType, clientData } = req.body;
      
      // Validate data
      const validation = this.contractService.validateContractData(estimateData, clientData);
      if (!validation.isValid) {
        return res.status(400).json({ errors: validation.errors });
      }
      
      // Generate contract PDF
      const pdfBytes = await this.contractService.generateContract(
        estimateData, 
        contractType, 
        clientData
      );
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=contract.pdf');
      res.send(Buffer.from(pdfBytes));
      
    } catch (error) {
      console.error('Contract generation error:', error);
      res.status(500).json({ error: 'Failed to generate contract' });
    }
  }

  // API endpoint to generate preview
  async generatePreview(req, res) {
    try {
      const { estimateData, contractType, clientData } = req.body;
      
      const pdfBytes = await this.contractService.generateContractPreview(
        estimateData, 
        contractType, 
        clientData
      );
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=preview.pdf');
      res.send(Buffer.from(pdfBytes));
      
    } catch (error) {
      console.error('Preview generation error:', error);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  }

  // API endpoint to get available templates
  async getTemplates(req, res) {
    try {
      const templates = this.contractService.getAvailableTemplates();
      res.json({ templates });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }
}

// Frontend JavaScript example
class ContractUI {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('generate-contract').addEventListener('click', 
      () => this.generateContract());
    document.getElementById('preview-contract').addEventListener('click', 
      () => this.previewContract());
  }

  async generateContract() {
    const formData = this.collectFormData();
    
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        this.downloadPDF(blob, 'contract.pdf');
      } else {
        const error = await response.json();
        this.showError(error.message || 'Failed to generate contract');
      }
    } catch (error) {
      this.showError('Network error: ' + error.message);
    }
  }

  async previewContract() {
    const formData = this.collectFormData();
    
    try {
      const response = await fetch('/api/contracts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      this.showError('Preview error: ' + error.message);
    }
  }

  collectFormData() {
    // Collect form data from UI elements
    return {
      estimateData: { /* estimate data */ },
      contractType: document.getElementById('contract-type').value,
      clientData: { /* client data */ }
    };
  }

  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showError(message) {
    // Display error message to user
    console.error(message);
  }
}
`;

  console.log(exampleCode);
}

// Error handling and troubleshooting guide
function troubleshootingGuide() {
  console.log('\n🔧 Troubleshooting Guide');
  console.log('========================');
  
  const guide = `
Common Issues and Solutions:

1. PDF Generation Errors:
   - Ensure pdf-lib is properly installed: npm install pdf-lib
   - Check that fonts are loading correctly
   - Verify estimate data structure matches expected format

2. File System Errors:
   - Ensure write permissions for output directory
   - Check available disk space
   - Verify file paths are correct

3. Data Validation Errors:
   - Ensure all required fields are provided
   - Check data types match expected format
   - Validate client data completeness

4. Memory Issues:
   - For large contracts, consider streaming PDF generation
   - Monitor memory usage during bulk generation
   - Implement pagination for very long contracts

5. Template Customization:
   - Verify template structure matches expected format
   - Check section names are correctly spelled
   - Ensure all template sections have corresponding methods

Best Practices:
- Always validate input data before PDF generation
- Use preview functionality for user verification
- Implement proper error handling and logging
- Cache frequently used templates for performance
- Regular backup of custom templates and branding
`;

  console.log(guide);
}

// Run the demonstration
if (import.meta.url === new URL(import.meta.url).toString()) {
  demonstrateContractGeneration()
    .then(() => {
      webApplicationExample();
      troubleshootingGuide();
    })
    .catch(console.error);
}

export { demonstrateContractGeneration, webApplicationExample, troubleshootingGuide };
