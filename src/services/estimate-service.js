export class EstimateService {
  constructor() {
    this.rates = {
      residential: {
        base: 3.50,
        premium: 4.50
      },
      commercial: {
        base: 4.00,
        premium: 5.00
      }
    };

    // Pricing modifiers
    this.modifiers = {
      complexity: {
        simple: 1.0,
        moderate: 1.2,
        complex: 1.5
      },
      accessibility: {
        easy: 1.0,
        moderate: 1.15,
        difficult: 1.3
      },
      season: {
        peak: 1.1,
        regular: 1.0,
        offSeason: 0.9
      },
      urgency: {
        standard: 1.0,
        rush: 1.25,
        emergency: 1.5
      }
    };

    // Material costs per square foot
    this.materialCosts = {
      asphalt: 2.50,
      concrete: 4.00,
      sealcoating: 0.50,
      striping: 0.25
    };

    // Labor rates (per hour)
    this.laborRates = {
      skilled: 45.00,
      semiskilled: 35.00,
      general: 25.00
    };
  }

  /**
   * Calculate estimate and track lead if contact info provided
   * @param {number} squareFeet - Square footage for the project
   * @param {string} serviceType - Type of service (residential/commercial)
   * @param {Object} options - Additional options including contact info
   * @returns {Object} Estimate details
   */
  calculateEstimate(squareFeet, serviceType, options = {}) {
    const estimate = {
      baseCost: 0,
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
      timeline: {
        days: 0,
        startDate: null,
        endDate: null
      },
      breakdown: {}
    };

    // Base cost calculation
    const { base, premium } = this.rates[serviceType];
    estimate.baseCost = squareFeet * (options.premium ? premium : base);

    // Apply pricing modifiers
    let modifiedCost = estimate.baseCost;
    if (options.complexity) {
      modifiedCost *= this.modifiers.complexity[options.complexity] || 1.0;
    }
    if (options.accessibility) {
      modifiedCost *= this.modifiers.accessibility[options.accessibility] || 1.0;
    }
    if (options.season) {
      modifiedCost *= this.modifiers.season[options.season] || 1.0;
    }
    if (options.urgency) {
      modifiedCost *= this.modifiers.urgency[options.urgency] || 1.0;
    }

    // Apply discount if provided
    if (options.discount && options.discount > 0 && options.discount < 1) {
      modifiedCost *= (1 - options.discount);
    }

    estimate.baseCost = modifiedCost;

    // Material cost calculation
    estimate.materialCost = this.calculateMaterialCost(squareFeet, options.materials || []);

    // Labor cost estimation
    estimate.laborCost = this.calculateLaborCost(squareFeet, serviceType, options);

    // Project timeline estimation
    estimate.timeline = this.calculateTimeline(squareFeet, serviceType, options);

    // Total cost
    estimate.totalCost = estimate.baseCost + estimate.materialCost + estimate.laborCost;

    // Breakdown for transparency
    estimate.breakdown = {
      baseRate: options.premium ? premium : base,
      squareFeet: squareFeet,
      modifiers: this.getAppliedModifiers(options),
      materials: options.materials || [],
      laborHours: this.calculateLaborHours(squareFeet, serviceType, options)
    };

    // Track lead if contact information is provided
    if (options.contactInfo) {
      try {
        this.trackLead({
          contactInfo: options.contactInfo,
          estimateDetails: {
            squareFeet,
            serviceType,
            totalCost: estimate.totalCost,
            timeline: estimate.timeline
          }
        });
      } catch (error) {
        // Log error but don't fail the estimate calculation
        if (typeof window !== 'undefined' && window.console) {
          window.console.error('Failed to track lead:', error);
        }
      }
    }

    return estimate;
  }

  /**
   * Track a new lead in localStorage
   * @param {Object} leadData - Lead information
   * @param {Object} leadData.contactInfo - Contact information (name, email, phone)
   * @param {Object} leadData.estimateDetails - Estimate details
   * @returns {Object} The created lead record
   */
  trackLead(leadData) {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    if (!leadData.contactInfo) {
      throw new Error('Contact information is required to track a lead');
    }

    try {
      // Get existing leads
      const existingLeads = this.getLeads();

      // Create new lead record
      const lead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contactInfo: leadData.contactInfo,
        estimateDetails: leadData.estimateDetails || {},
        status: 'new',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Add to leads array
      existingLeads.push(lead);

      // Save to localStorage
      window.localStorage.setItem('nurture_leads', JSON.stringify(existingLeads));

      return lead;
    } catch (error) {
      throw new Error(`Failed to track lead: ${error.message}`);
    }
  }

  /**
   * Retrieve all leads from localStorage
   * @returns {Array} Array of lead records
   */
  getLeads() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    try {
      const leadsData = window.localStorage.getItem('nurture_leads');
      return leadsData ? JSON.parse(leadsData) : [];
    } catch (error) {
      if (typeof window !== 'undefined' && window.console) {
        window.console.error('Failed to retrieve leads:', error);
      }
      return [];
    }
  }

  /**
   * Get a specific lead by ID
   * @param {string} leadId - The lead ID
   * @returns {Object|null} Lead record or null if not found
   */
  getLeadById(leadId) {
    const leads = this.getLeads();
    return leads.find(lead => lead.id === leadId) || null;
  }

  /**
   * Update lead status
   * @param {string} leadId - The lead ID
   * @param {string} status - New status
   * @returns {Object} Updated lead record
   */
  updateLeadStatus(leadId, status) {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    try {
      const leads = this.getLeads();
      const leadIndex = leads.findIndex(lead => lead.id === leadId);

      if (leadIndex === -1) {
        throw new Error(`Lead ${leadId} not found`);
      }

      leads[leadIndex].status = status;
      leads[leadIndex].updatedAt = new Date().toISOString();

      window.localStorage.setItem('nurture_leads', JSON.stringify(leads));

      return leads[leadIndex];
    } catch (error) {
      throw new Error(`Failed to update lead status: ${error.message}`);
    }
  }

  calculateMaterialCost(squareFeet, materials) {
    let totalMaterialCost = 0;

    materials.forEach(material => {
      const costPerSqFt = this.materialCosts[material.type] || 0;
      const coverage = material.coverage || squareFeet;
      const quantity = material.quantity || 1;
      
      totalMaterialCost += costPerSqFt * coverage * quantity;
    });

    return totalMaterialCost;
  }

  calculateLaborCost(squareFeet, serviceType, options) {
    const laborHours = this.calculateLaborHours(squareFeet, serviceType, options);
    const skillLevel = options.skillLevel || 'semiskilled';
    const hourlyRate = this.laborRates[skillLevel] || this.laborRates.semiskilled;

    return laborHours * hourlyRate;
  }

  calculateLaborHours(squareFeet, serviceType, options) {
    // Base hours per square foot based on service type
    const baseHoursPerSqFt = {
      residential: 0.02,
      commercial: 0.015
    };

    let hours = squareFeet * (baseHoursPerSqFt[serviceType] || 0.02);

    // Adjust for complexity
    if (options.complexity === 'complex') {
      hours *= 1.5;
    } else if (options.complexity === 'moderate') {
      hours *= 1.2;
    }

    // Adjust for accessibility
    if (options.accessibility === 'difficult') {
      hours *= 1.3;
    } else if (options.accessibility === 'moderate') {
      hours *= 1.15;
    }

    // Minimum hours for small jobs
    return Math.max(hours, 4);
  }

  calculateTimeline(squareFeet, serviceType, options) {
    const laborHours = this.calculateLaborHours(squareFeet, serviceType, options);
    const hoursPerDay = options.hoursPerDay || 8;
    const workDays = Math.ceil(laborHours / hoursPerDay);

    // Add buffer days for weather, permits, etc.
    const bufferDays = Math.ceil(workDays * 0.2);
    const totalDays = workDays + bufferDays;

    const startDate = options.startDate ? new Date(options.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalDays);

    return {
      days: totalDays,
      workDays: workDays,
      bufferDays: bufferDays,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  getAppliedModifiers(options) {
    const applied = {};
    
    if (options.complexity) {
      applied.complexity = {
        type: options.complexity,
        multiplier: this.modifiers.complexity[options.complexity]
      };
    }
    if (options.accessibility) {
      applied.accessibility = {
        type: options.accessibility,
        multiplier: this.modifiers.accessibility[options.accessibility]
      };
    }
    if (options.season) {
      applied.season = {
        type: options.season,
        multiplier: this.modifiers.season[options.season]
      };
    }
    if (options.urgency) {
      applied.urgency = {
        type: options.urgency,
        multiplier: this.modifiers.urgency[options.urgency]
      };
    }
    if (options.discount) {
      applied.discount = {
        rate: options.discount,
        multiplier: (1 - options.discount)
      };
    }

    return applied;
  }

  // Utility method to get available options
  getAvailableOptions() {
    return {
      serviceTypes: Object.keys(this.rates),
      complexityLevels: Object.keys(this.modifiers.complexity),
      accessibilityLevels: Object.keys(this.modifiers.accessibility),
      seasons: Object.keys(this.modifiers.season),
      urgencyLevels: Object.keys(this.modifiers.urgency),
      materialTypes: Object.keys(this.materialCosts),
      skillLevels: Object.keys(this.laborRates)
    };
  }
}

