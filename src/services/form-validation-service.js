/**
 * Enhanced Form Validation Service
 * Provides comprehensive validation for estimate forms with measurement tool integration
 */

export class FormValidationService {
  constructor() {
    this.validationRules = {
      area: {
        min: 50,      // Minimum 50 sq ft
        max: 500000,  // Maximum 500,000 sq ft (11.5 acres)
        reasonable: {
          residential: { min: 100, max: 10000 },    // 100-10,000 sq ft
          commercial: { min: 1000, max: 100000 },   // 1,000-100,000 sq ft
          maintenance: { min: 50, max: 50000 },     // 50-50,000 sq ft
          custom: { min: 50, max: 500000 },         // 50-500,000 sq ft
          emergency: { min: 50, max: 20000 }        // 50-20,000 sq ft
        }
      },
      perimeter: {
        min: 28,      // Minimum perimeter for 50 sq ft area
        max: 10000    // Maximum 10,000 ft perimeter
      }
    };

    this.measurementToolInstructions = {
      'google-maps': {
        title: 'Google Maps Area Finder',
        description: 'Easy-to-use 2D measurement with satellite imagery',
        instructions: [
          'Search for your project location using the address search',
          'Click the drawing tools to select polygon, rectangle, or circle',
          'Click on the map to start drawing your area',
          'For polygons: Click to add points, click first point again to close',
          'For rectangles: Click and drag to create the rectangle',
          'For circles: Click center point, then drag to set radius',
          'Use the "Calculate Area" button to get measurements'
        ],
        benefits: [
          'Simple and intuitive interface',
          'Real satellite imagery for accurate placement',
          'Multiple drawing tools (polygon, rectangle, circle)',
          'Automatic area and perimeter calculation',
          'Address search for quick location finding'
        ],
        limitations: [
          'Limited to 2D measurements only',
          'Cannot account for elevation changes',
          'May be less accurate for complex terrain'
        ]
      },
      'arcgis-3d': {
        title: 'ArcGIS 3D Measurement Tool',
        description: 'Advanced 3D measurement with terrain analysis',
        instructions: [
          'Wait for the 3D scene to load completely',
          'Use the navigation controls to position the view',
          'Click the "Area Measurement" tool in the toolbar',
          'Click on the terrain to start measuring',
          'Continue clicking to add measurement points',
          'Double-click to finish the measurement',
          'View results in the measurement panel'
        ],
        benefits: [
          'True 3D measurements with elevation data',
          'Terrain-aware calculations for slopes and hills',
          'More accurate for complex topography',
          'Professional-grade measurement precision',
          'Automatic calculation of surface area on slopes'
        ],
        limitations: [
          'Requires modern browser with WebGL support',
          'Longer loading time for 3D scene',
          'May require more computer resources',
          'Steeper learning curve for new users'
        ]
      }
    };

    this.helpText = {
      serviceTypes: {
        residential: 'Driveways, walkways, patios, and small parking areas for homes',
        commercial: 'Parking lots, loading docks, and business access areas',
        maintenance: 'Crack sealing, sealcoating, striping, and repair work',
        custom: 'Specialized paving projects requiring unique solutions',
        emergency: 'Urgent repairs for safety hazards or damage'
      },
      measurementTools: {
        when3DRecommended: [
          'Properties with significant elevation changes',
          'Sloped driveways or parking areas',
          'Terraced or multi-level projects',
          'Properties near hills or valleys',
          'When precise surface area is critical'
        ],
        when2DAcceptable: [
          'Flat or nearly flat surfaces',
          'Simple rectangular areas',
          'Quick estimates for planning',
          'Basic residential driveways',
          'Small maintenance projects'
        ]
      }
    };

    this.tooltips = {
      measurement3D: 'Use 3D measurement for slopes and complex terrain to get accurate surface area calculations. This is especially important for driveways on hills or uneven ground.',
      areaValidation: 'Area measurements help us provide accurate estimates and ensure we bring the right equipment and materials for your project.',
      serviceTypeSelection: 'Select the service type that best matches your project. This helps us provide appropriate pricing and timeline estimates.',
      addressImportant: 'Project address helps us factor in local conditions, permit requirements, and travel time for accurate estimates.',
      timeline: 'Timeline preferences help us schedule your project efficiently and set realistic expectations for completion.'
    };
  }

  /**
   * Validate area measurement based on service type
   */
  validateAreaMeasurement(area, serviceType = 'residential', unit = 'sqft') {
    const validation = {
      isValid: true,
      warnings: [],
      errors: [],
      recommendations: []
    };

    if (!area || area <= 0) {
      validation.isValid = false;
      validation.errors.push('Area measurement is required and must be greater than 0');
      return validation;
    }

    // Convert to square feet if needed
    const areaInSqFt = this.convertToSquareFeet(area, unit);
    
    // Check absolute limits
    if (areaInSqFt < this.validationRules.area.min) {
      validation.isValid = false;
      validation.errors.push(`Area is below minimum of ${this.validationRules.area.min} sq ft`);
    }

    if (areaInSqFt > this.validationRules.area.max) {
      validation.isValid = false;
      validation.errors.push(`Area exceeds maximum of ${this.validationRules.area.max.toLocaleString()} sq ft`);
    }

    // Check reasonable ranges for service type
    const reasonableRange = this.validationRules.area.reasonable[serviceType];
    if (reasonableRange) {
      if (areaInSqFt < reasonableRange.min) {
        validation.warnings.push(`Area seems small for ${serviceType} projects. Typical range is ${reasonableRange.min.toLocaleString()}-${reasonableRange.max.toLocaleString()} sq ft`);
      }
      
      if (areaInSqFt > reasonableRange.max) {
        validation.warnings.push(`Area seems large for ${serviceType} projects. Typical range is ${reasonableRange.min.toLocaleString()}-${reasonableRange.max.toLocaleString()} sq ft`);
        validation.recommendations.push('Consider breaking large projects into phases');
      }
    }

    // Add recommendations based on area size
    if (areaInSqFt > 5000) {
      validation.recommendations.push('For large areas, consider using 3D measurement tools for better accuracy');
    }

    if (areaInSqFt > 20000) {
      validation.recommendations.push('Large commercial projects may require site survey for final measurements');
    }

    return validation;
  }

  /**
   * Validate perimeter measurement
   */
  validatePerimeterMeasurement(perimeter, area, unit = 'ft') {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    if (!perimeter || perimeter <= 0) {
      validation.warnings.push('Perimeter measurement not provided - using area-based estimate');
      return validation;
    }

    // Convert to feet if needed
    const perimeterInFt = this.convertToFeet(perimeter, unit);
    
    // Check absolute limits
    if (perimeterInFt < this.validationRules.perimeter.min) {
      validation.warnings.push(`Perimeter seems unusually small (${perimeterInFt} ft)`);
    }

    if (perimeterInFt > this.validationRules.perimeter.max) {
      validation.warnings.push(`Perimeter seems unusually large (${perimeterInFt.toLocaleString()} ft)`);
    }

    // Check perimeter-to-area ratio for reasonableness
    if (area) {
      const areaInSqFt = this.convertToSquareFeet(area, unit === 'ft' ? 'sqft' : 'sqm');
      const ratio = perimeterInFt / Math.sqrt(areaInSqFt);
      
      if (ratio > 8) {
        validation.warnings.push('Area shape appears very elongated or irregular');
      }
      
      if (ratio < 2) {
        validation.warnings.push('Area shape appears very compact - please verify measurements');
      }
    }

    return validation;
  }

  /**
   * Get measurement tool instructions for specific tool
   */
  getMeasurementToolInstructions(toolType) {
    return this.measurementToolInstructions[toolType] || null;
  }

  /**
   * Get help text for specific form field
   */
  getHelpText(fieldType, subType = null) {
    if (subType && this.helpText[fieldType] && this.helpText[fieldType][subType]) {
      return this.helpText[fieldType][subType];
    }
    return this.helpText[fieldType] || null;
  }

  /**
   * Get tooltip text for specific element
   */
  getTooltip(elementType) {
    return this.tooltips[elementType] || null;
  }

  /**
   * Recommend measurement tool based on project characteristics
   */
  recommendMeasurementTool(serviceType, projectDescription = '', hasSlope = false) {
    const recommendation = {
      primary: 'google-maps',
      secondary: 'arcgis-3d',
      reasoning: []
    };

    // Check for slope indicators
    const slopeKeywords = ['slope', 'hill', 'sloped', 'steep', 'elevation', 'grade', 'incline'];
    const hasSlopeKeyword = slopeKeywords.some(keyword => 
      projectDescription.toLowerCase().includes(keyword)
    );

    if (hasSlope || hasSlopeKeyword) {
      recommendation.primary = 'arcgis-3d';
      recommendation.secondary = 'google-maps';
      recommendation.reasoning.push('3D measurement recommended for sloped terrain');
    }

    // Commercial projects often benefit from 3D measurement
    if (serviceType === 'commercial') {
      recommendation.reasoning.push('Commercial projects benefit from precise 3D measurements');
      if (recommendation.primary === 'google-maps') {
        recommendation.reasoning.push('Consider 3D measurement for complex layouts');
      }
    }

    // Emergency repairs usually need quick 2D measurement
    if (serviceType === 'emergency') {
      recommendation.primary = 'google-maps';
      recommendation.secondary = 'arcgis-3d';
      recommendation.reasoning.push('Quick 2D measurement suitable for emergency repairs');
    }

    return recommendation;
  }

  /**
   * Validate complete form data
   */
  validateForm(formData) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType'];
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        validation.isValid = false;
        validation.errors.push(`${this.formatFieldName(field)} is required`);
      }
    });

    // Validate email format
    if (formData.email && !this.isValidEmail(formData.email)) {
      validation.isValid = false;
      validation.errors.push('Please enter a valid email address');
    }

    // Validate phone format
    if (formData.phone && !this.isValidPhone(formData.phone)) {
      validation.warnings.push('Phone number format could not be verified');
    }

    // Validate area measurement if provided
    if (formData.areaData) {
      const areaValidation = this.validateAreaMeasurement(
        formData.areaData.area || formData.areaData.areaInSquareFeet,
        formData.serviceType,
        'sqft'
      );
      
      validation.isValid = validation.isValid && areaValidation.isValid;
      validation.errors.push(...areaValidation.errors);
      validation.warnings.push(...areaValidation.warnings);
      validation.recommendations.push(...areaValidation.recommendations);

      // Validate perimeter if provided
      if (formData.areaData.perimeter) {
        const perimeterValidation = this.validatePerimeterMeasurement(
          formData.areaData.perimeter,
          formData.areaData.area || formData.areaData.areaInSquareFeet,
          'ft'
        );
        validation.warnings.push(...perimeterValidation.warnings);
        validation.errors.push(...perimeterValidation.errors);
      }
    }

    // Add measurement tool recommendation
    const toolRecommendation = this.recommendMeasurementTool(
      formData.serviceType,
      formData.projectDescription
    );
    validation.recommendations.push(...toolRecommendation.reasoning);

    return validation;
  }

  /**
   * Get validation message for display
   */
  getValidationMessage(validation) {
    let message = '';
    
    if (validation.errors.length > 0) {
      message += `Errors: ${validation.errors.join(', ')}\n`;
    }
    
    if (validation.warnings.length > 0) {
      message += `Warnings: ${validation.warnings.join(', ')}\n`;
    }
    
    if (validation.recommendations.length > 0) {
      message += `Recommendations: ${validation.recommendations.join(', ')}`;
    }
    
    return message.trim();
  }

  // Helper methods
  convertToSquareFeet(value, unit) {
    const conversions = {
      sqft: 1,
      sqm: 10.7639,
      acres: 43560
    };
    return value * (conversions[unit] || 1);
  }

  convertToFeet(value, unit) {
    const conversions = {
      ft: 1,
      m: 3.28084,
      meters: 3.28084
    };
    return value * (conversions[unit] || 1);
  }

  formatFieldName(fieldName) {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && phoneRegex.test(cleanPhone);
  }
}

export default FormValidationService;
