# Contract Generation System

A comprehensive contract generation system for Neff Paving Company that creates professional PDF contracts with dynamic fields, company branding, and legal terms.

## 🌟 Features

- **Dynamic PDF Generation**: Create contracts from estimate data automatically
- **Multiple Templates**: Residential and commercial contract templates
- **Company Branding**: Customizable company information and branding
- **Legal Compliance**: Built-in legal terms and compliance sections
- **Preview Functionality**: Generate watermarked previews for review
- **Data Validation**: Comprehensive input validation and error handling
- **Template Customization**: Create and manage custom contract templates

## 📁 File Structure

```
src/
├── services/
│   ├── contract-service.js    # Main contract generation service
│   └── estimate-service.js    # Estimate calculation service
├── examples/
│   └── contract-demo.js       # Usage examples and demonstrations
└── docs/
    └── contract-generation-system.md  # This documentation
```

## 🚀 Quick Start

### Installation

Ensure you have the required dependencies installed:

```bash
npm install pdf-lib
```

### Basic Usage

```javascript
import { ContractService } from './services/contract-service.js';
import { EstimateService } from './services/estimate-service.js';

// Initialize services
const contractService = new ContractService();
const estimateService = new EstimateService();

// Generate estimate data
const estimateData = estimateService.calculateEstimate(2500, 'residential', {
  premium: true,
  complexity: 'moderate',
  materials: [
    { type: 'asphalt', coverage: 2500, quantity: 1 }
  ]
});

// Client information
const clientData = {
  name: 'John Smith',
  address: '123 Main Street, City, State 12345',
  phone: '(555) 123-4567',
  email: 'john.smith@email.com'
};

// Generate contract PDF
const pdfBytes = await contractService.generateContract(
  estimateData,
  'residential',
  clientData
);

// Save or serve the PDF
fs.writeFileSync('contract.pdf', pdfBytes);
```

## 📋 Contract Templates

### Residential Template

Standard residential paving contract includes:
- Project details
- Scope of work
- Materials and specifications
- Timeline
- Pricing breakdown
- Payment terms
- Warranty information
- Legal terms and conditions
- Signature sections

### Commercial Template

Enhanced commercial contract includes all residential sections plus:
- Permits and compliance information
- Insurance and liability details
- Additional legal protections

### Custom Templates

Create custom templates for specific service types:

```javascript
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
```

## 🎨 Customization

### Company Branding

Update company information and branding:

```javascript
contractService.updateCompanyBranding({
  name: 'Your Company Name',
  address: 'Your Address',
  phone: '(555) YOUR-PHONE',
  email: 'your@email.com',
  license: 'License #12345',
  website: 'www.yourwebsite.com'
});
```

### Legal Terms

Customize legal terms and conditions:

```javascript
contractService.updateLegalTerms({
  warrantyPeriod: '3 years',
  paymentTerms: 'Net 15 days',
  cancellationPolicy: '24 hours written notice required',
  liabilityClause: 'Custom liability clause',
  disputeResolution: 'Custom dispute resolution terms'
});
```

## 🔍 Preview Functionality

Generate watermarked previews for client review:

```javascript
const previewPDF = await contractService.generateContractPreview(
  estimateData,
  'residential',
  clientData
);
```

Preview contracts include a diagonal watermark reading "PREVIEW - NOT FOR EXECUTION" to prevent accidental execution.

## ✅ Data Validation

Validate contract data before generation:

```javascript
const validation = contractService.validateContractData(estimateData, clientData);

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  return;
}
```

## 🌐 Web Application Integration

### Backend API Example (Express.js)

```javascript
import express from 'express';
import { ContractService } from './services/contract-service.js';

const app = express();
const contractService = new ContractService();

app.post('/api/contracts/generate', async (req, res) => {
  try {
    const { estimateData, contractType, clientData } = req.body;
    
    // Validate data
    const validation = contractService.validateContractData(estimateData, clientData);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Generate PDF
    const pdfBytes = await contractService.generateContract(
      estimateData,
      contractType,
      clientData
    );
    
    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=contract.pdf');
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate contract' });
  }
});
```

### Frontend Integration

```javascript
class ContractUI {
  async generateContract() {
    const formData = this.collectFormData();
    
    const response = await fetch('/api/contracts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const blob = await response.blob();
      this.downloadPDF(blob, 'contract.pdf');
    }
  }
  
  downloadPDF(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

## 📊 API Reference

### ContractService Class

#### Constructor
```javascript
new ContractService()
```

#### Methods

##### generateContract(estimateData, contractType, clientData)
Generates a complete contract PDF.

**Parameters:**
- `estimateData` (Object): Estimate data from EstimateService
- `contractType` (String): 'residential' or 'commercial'
- `clientData` (Object): Client information

**Returns:** Promise<Uint8Array> - PDF bytes

##### generateContractPreview(estimateData, contractType, clientData)
Generates a watermarked preview PDF.

**Parameters:** Same as generateContract()
**Returns:** Promise<Uint8Array> - PDF bytes with watermark

##### validateContractData(estimateData, clientData)
Validates input data for contract generation.

**Parameters:**
- `estimateData` (Object): Estimate data
- `clientData` (Object): Client information

**Returns:** Object with `isValid` boolean and `errors` array

##### updateCompanyBranding(brandingData)
Updates company branding information.

**Parameters:**
- `brandingData` (Object): Company information to update

##### updateLegalTerms(legalData)
Updates legal terms and conditions.

**Parameters:**
- `legalData` (Object): Legal terms to update

##### getAvailableTemplates()
Returns list of available contract templates.

**Returns:** Array of template names

##### addCustomTemplate(templateName, templateConfig)
Adds a custom contract template.

**Parameters:**
- `templateName` (String): Unique template name
- `templateConfig` (Object): Template configuration

## 🔧 Troubleshooting

### Common Issues

1. **PDF Generation Errors**
   - Ensure pdf-lib is properly installed
   - Check font loading
   - Verify data structure

2. **File System Errors**
   - Check write permissions
   - Verify disk space
   - Validate file paths

3. **Memory Issues**
   - Monitor memory usage for large contracts
   - Consider streaming for bulk generation

### Best Practices

- Always validate input data
- Use preview functionality for verification
- Implement proper error handling
- Cache templates for performance
- Regular backup of customizations

## 📝 Example Data Structures

### Estimate Data
```javascript
{
  baseCost: 12500.00,
  materialCost: 6250.00,
  laborCost: 3500.00,
  totalCost: 22250.00,
  serviceType: 'residential',
  squareFeet: 2500,
  timeline: {
    days: 5,
    workDays: 4,
    startDate: '2024-03-15',
    endDate: '2024-03-20'
  },
  breakdown: {
    materials: [
      { type: 'asphalt', coverage: 2500, quantity: 1 },
      { type: 'sealcoating', coverage: 2500, quantity: 1 }
    ]
  }
}
```

### Client Data
```javascript
{
  name: 'John Smith',
  address: '123 Main Street, City, State 12345',
  phone: '(555) 123-4567',
  email: 'john.smith@email.com'
}
```

## 🧪 Testing

Run the demonstration script to test functionality:

```bash
node src/examples/contract-demo.js
```

This will generate sample contracts and demonstrate all features.

## 📄 License

This contract generation system is part of the Neff Paving Company project.

## 🤝 Contributing

When contributing to the contract generation system:

1. Maintain backward compatibility with existing templates
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Follow existing code style and patterns
5. Validate all generated PDFs before committing

## 📞 Support

For issues or questions regarding the contract generation system, please check the troubleshooting guide or create an issue in the project repository.
