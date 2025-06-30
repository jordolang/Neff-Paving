import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class ContractService {
  constructor() {
    this.companyInfo = {
      name: 'Neff Paving Company',
      address: '123 Main Street, Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'info@neffpaving.com',
      license: 'Contractor License #12345',
      website: 'www.neffpaving.com'
    };

    this.legalTerms = {
      warrantyPeriod: '2 years',
      paymentTerms: 'Net 30 days',
      cancellationPolicy: '48 hours written notice required',
      liabilityClause: 'Company maintains full liability insurance coverage',
      disputeResolution: 'Disputes resolved through binding arbitration'
    };

    this.contractTemplates = {
      residential: {
        title: 'Residential Paving Contract',
        sections: [
          'project_details',
          'scope_of_work',
          'materials',
          'timeline',
          'pricing',
          'payment_terms',
          'warranty',
          'legal_terms',
          'signatures'
        ]
      },
      commercial: {
        title: 'Commercial Paving Contract',
        sections: [
          'project_details',
          'scope_of_work',
          'materials',
          'timeline',
          'pricing',
          'payment_terms',
          'permits_compliance',
          'warranty',
          'insurance',
          'legal_terms',
          'signatures'
        ]
      }
    };
  }

  async generateContract(estimateData, contractType = 'residential', clientData = {}) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      
      // Load fonts
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let yPosition = 750;
      
      // Add company branding and header
      yPosition = await this.addHeader(page, boldFont, regularFont, yPosition);
      
      // Add contract title
      const template = this.contractTemplates[contractType];
      yPosition = this.addTitle(page, boldFont, template.title, yPosition);
      
      // Add contract content based on template sections
      for (const section of template.sections) {
        yPosition = await this.addSection(page, regularFont, boldFont, section, estimateData, clientData, yPosition);
        
        // Add new page if needed
        if (yPosition < 100) {
          const newPage = pdfDoc.addPage([612, 792]);
          yPosition = 750;
          yPosition = await this.addSection(newPage, regularFont, boldFont, section, estimateData, clientData, yPosition);
        }
      }
      
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw new Error('Failed to generate contract PDF');
    }
  }

  async addHeader(page, boldFont, regularFont, yPosition) {
    const { width } = page.getSize();
    
    // Company name
    page.drawText(this.companyInfo.name, {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.4, 0.8)
    });
    
    yPosition -= 25;
    
    // Company contact info
    const contactInfo = [
      this.companyInfo.address,
      `Phone: ${this.companyInfo.phone}`,
      `Email: ${this.companyInfo.email}`,
      `License: ${this.companyInfo.license}`
    ];
    
    contactInfo.forEach(info => {
      page.drawText(info, {
        x: 50,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });
    
    // Add horizontal line
    page.drawLine({
      start: { x: 50, y: yPosition - 10 },
      end: { x: width - 50, y: yPosition - 10 },
      thickness: 2,
      color: rgb(0, 0.4, 0.8)
    });
    
    return yPosition - 30;
  }

  addTitle(page, boldFont, title, yPosition) {
    page.drawText(title, {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    return yPosition - 40;
  }

  async addSection(page, regularFont, boldFont, sectionType, estimateData, clientData, yPosition) {
    switch (sectionType) {
      case 'project_details':
        return this.addProjectDetails(page, regularFont, boldFont, estimateData, clientData, yPosition);
      
      case 'scope_of_work':
        return this.addScopeOfWork(page, regularFont, boldFont, estimateData, yPosition);
      
      case 'materials':
        return this.addMaterials(page, regularFont, boldFont, estimateData, yPosition);
      
      case 'timeline':
        return this.addTimeline(page, regularFont, boldFont, estimateData, yPosition);
      
      case 'pricing':
        return this.addPricing(page, regularFont, boldFont, estimateData, yPosition);
      
      case 'payment_terms':
        return this.addPaymentTerms(page, regularFont, boldFont, yPosition);
      
      case 'warranty':
        return this.addWarranty(page, regularFont, boldFont, yPosition);
      
      case 'legal_terms':
        return this.addLegalTerms(page, regularFont, boldFont, yPosition);
      
      case 'signatures':
        return this.addSignatures(page, regularFont, boldFont, yPosition);
      
      case 'permits_compliance':
        return this.addPermitsCompliance(page, regularFont, boldFont, yPosition);
      
      case 'insurance':
        return this.addInsurance(page, regularFont, boldFont, yPosition);
      
      default:
        return yPosition;
    }
  }

  addProjectDetails(page, regularFont, boldFont, estimateData, clientData, yPosition) {
    // Section title
    page.drawText('PROJECT DETAILS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const details = [
      `Client Name: ${clientData.name || 'N/A'}`,
      `Project Address: ${clientData.address || 'N/A'}`,
      `Phone: ${clientData.phone || 'N/A'}`,
      `Email: ${clientData.email || 'N/A'}`,
      `Project Type: ${estimateData.serviceType || 'N/A'}`,
      `Square Footage: ${estimateData.squareFeet || 'N/A'} sq ft`,
      `Contract Date: ${new Date().toLocaleDateString()}`
    ];

    details.forEach(detail => {
      page.drawText(detail, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addScopeOfWork(page, regularFont, boldFont, estimateData, yPosition) {
    page.drawText('SCOPE OF WORK', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const workItems = [
      'Site preparation and excavation as needed',
      'Installation of base materials and grading',
      'Application of asphalt or concrete as specified',
      'Compaction and finishing to industry standards',
      'Clean-up and removal of debris',
      'Final inspection and quality assurance'
    ];

    // Add custom work items based on estimate data
    if (estimateData.breakdown && estimateData.breakdown.materials) {
      estimateData.breakdown.materials.forEach(material => {
        workItems.push(`${material.type} installation and finishing`);
      });
    }

    workItems.forEach(item => {
      page.drawText(`• ${item}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addMaterials(page, regularFont, boldFont, estimateData, yPosition) {
    page.drawText('MATERIALS AND SPECIFICATIONS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    if (estimateData.breakdown && estimateData.breakdown.materials) {
      estimateData.breakdown.materials.forEach(material => {
        page.drawText(`• ${material.type}: ${material.quantity || 1} units`, {
          x: 70,
          y: yPosition,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        yPosition -= 15;
      });
    } else {
      page.drawText('• Premium grade asphalt meeting local specifications', {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
      
      page.drawText('• Aggregate base materials as required', {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    }

    return yPosition - 20;
  }

  addTimeline(page, regularFont, boldFont, estimateData, yPosition) {
    page.drawText('PROJECT TIMELINE', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const timeline = estimateData.timeline || {};
    const timelineItems = [
      `Estimated Duration: ${timeline.days || 'TBD'} days`,
      `Work Days: ${timeline.workDays || 'TBD'} days`,
      `Start Date: ${timeline.startDate || 'TBD'}`,
      `Completion Date: ${timeline.endDate || 'TBD'}`,
      'Weather delays may extend timeline',
      'Client will be notified of any schedule changes'
    ];

    timelineItems.forEach(item => {
      page.drawText(`• ${item}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addPricing(page, regularFont, boldFont, estimateData, yPosition) {
    page.drawText('PRICING BREAKDOWN', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const pricingItems = [
      `Base Cost: $${(estimateData.baseCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `Material Cost: $${(estimateData.materialCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `Labor Cost: $${(estimateData.laborCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ];

    pricingItems.forEach(item => {
      page.drawText(item, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    // Total cost
    yPosition -= 5;
    page.drawText(`TOTAL CONTRACT AMOUNT: $${(estimateData.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, {
      x: 70,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0.6, 0)
    });

    return yPosition - 30;
  }

  addPaymentTerms(page, regularFont, boldFont, yPosition) {
    page.drawText('PAYMENT TERMS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const paymentTerms = [
      `Payment Terms: ${this.legalTerms.paymentTerms}`,
      '50% deposit required upon contract signing',
      'Balance due upon project completion',
      'Accepted payment methods: Check, Cash, Bank Transfer',
      'Late payments subject to 1.5% monthly service charge'
    ];

    paymentTerms.forEach(term => {
      page.drawText(`• ${term}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addWarranty(page, regularFont, boldFont, yPosition) {
    page.drawText('WARRANTY', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const warrantyTerms = [
      `Warranty Period: ${this.legalTerms.warrantyPeriod}`,
      'Coverage includes workmanship and material defects',
      'Normal wear and tear not covered',
      'Warranty void if modifications made by others',
      'Written notice required for warranty claims'
    ];

    warrantyTerms.forEach(term => {
      page.drawText(`• ${term}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addLegalTerms(page, regularFont, boldFont, yPosition) {
    page.drawText('LEGAL TERMS AND CONDITIONS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const legalTerms = [
      `Cancellation: ${this.legalTerms.cancellationPolicy}`,
      `Liability: ${this.legalTerms.liabilityClause}`,
      `Disputes: ${this.legalTerms.disputeResolution}`,
      'Contract governed by state and local laws',
      'Client responsible for permits unless specified',
      'Force majeure clause applies to weather delays'
    ];

    legalTerms.forEach(term => {
      page.drawText(`• ${term}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addPermitsCompliance(page, regularFont, boldFont, yPosition) {
    page.drawText('PERMITS AND COMPLIANCE', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const complianceItems = [
      'All work performed to local building codes',
      'Required permits obtained before work begins',
      'Inspections scheduled as required by law',
      'OSHA safety standards strictly followed',
      'Environmental regulations compliance maintained'
    ];

    complianceItems.forEach(item => {
      page.drawText(`• ${item}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addInsurance(page, regularFont, boldFont, yPosition) {
    page.drawText('INSURANCE AND LIABILITY', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 25;

    const insuranceItems = [
      'General liability insurance: $2,000,000',
      'Workers compensation insurance current',
      'Property damage coverage included',
      'Certificate of insurance available upon request',
      'Additional insured status provided if required'
    ];

    insuranceItems.forEach(item => {
      page.drawText(`• ${item}`, {
        x: 70,
        y: yPosition,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 15;
    });

    return yPosition - 20;
  }

  addSignatures(page, regularFont, boldFont, yPosition) {
    page.drawText('SIGNATURES', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    // Client signature
    page.drawText('CLIENT:', {
      x: 70,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 30;

    page.drawLine({
      start: { x: 70, y: yPosition },
      end: { x: 270, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText('Signature', {
      x: 70,
      y: yPosition - 15,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    page.drawLine({
      start: { x: 300, y: yPosition },
      end: { x: 450, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText('Date', {
      x: 300,
      y: yPosition - 15,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    yPosition -= 60;

    // Contractor signature
    page.drawText('CONTRACTOR:', {
      x: 70,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 30;

    page.drawLine({
      start: { x: 70, y: yPosition },
      end: { x: 270, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText('Authorized Signature', {
      x: 70,
      y: yPosition - 15,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    page.drawLine({
      start: { x: 300, y: yPosition },
      end: { x: 450, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawText('Date', {
      x: 300,
      y: yPosition - 15,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });

    return yPosition - 40;
  }

  async generateContractPreview(estimateData, contractType = 'residential', clientData = {}) {
    // Generate a preview version with watermark
    const pdfBytes = await this.generateContract(estimateData, contractType, clientData);
    
    // Add watermark for preview
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // Add diagonal watermark
      page.drawText('PREVIEW - NOT FOR EXECUTION', {
        x: width / 2 - 150,
        y: height / 2,
        size: 36,
        font: font,
        color: rgb(0.9, 0.9, 0.9),
        rotate: { type: 'degrees', angle: -45 }
      });
    });
    
    return await pdfDoc.save();
  }

  async loadTemplate(templateType = 'residential') {
    return this.contractTemplates[templateType] || this.contractTemplates.residential;
  }

  // Utility method to validate contract data
  validateContractData(estimateData, clientData) {
    const errors = [];
    
    if (!estimateData) {
      errors.push('Estimate data is required');
    } else {
      if (!estimateData.totalCost) errors.push('Total cost is required');
      if (!estimateData.timeline) errors.push('Timeline is required');
    }
    
    if (!clientData) {
      errors.push('Client data is required');
    } else {
      if (!clientData.name) errors.push('Client name is required');
      if (!clientData.address) errors.push('Client address is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Method to customize company branding
  updateCompanyBranding(brandingData) {
    this.companyInfo = { ...this.companyInfo, ...brandingData };
  }

  // Method to customize legal terms
  updateLegalTerms(legalData) {
    this.legalTerms = { ...this.legalTerms, ...legalData };
  }

  // Method to get available contract templates
  getAvailableTemplates() {
    return Object.keys(this.contractTemplates);
  }

  // Method to create custom contract template
  addCustomTemplate(templateName, templateConfig) {
    this.contractTemplates[templateName] = templateConfig;
  }

  // Add new methods for scheduling integration
  async initiateScheduling(contractId) {
    const contract = await this.getContract(contractId);
    const payment = await paymentService.getPaymentStatus(contract.paymentId);
    
    if (payment.status !== 'succeeded') {
      throw new Error('Payment must be completed before scheduling');
    }
    
    return new CalendlyScheduler(contractId, contract.estimateData);
  }

  async finalizeContract(contractId, scheduleData) {
    const contract = await this.getContract(contractId);
    contract.schedule = scheduleData;
    contract.status = 'scheduled';
    
    await this.updateContract(contract);
    await alertService.sendJobScheduledAlert({
      ...contract,
      scheduleData
    });
  }
}
