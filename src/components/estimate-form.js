/**
 * Estimate Form Component
 * Comprehensive form with measurement tool integration and validation
 */

import { FormValidationService } from '../services/form-validation-service.js';
import { EstimateService } from '../services/estimate-service.js';
import { getMeasurementData, getAllMeasurementData, hasMeasurementData, handleFormSubmission, handleFormReset } from '../utils/measurement-storage.js';

export class EstimateForm {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.validationService = new FormValidationService();
        this.estimateService = new EstimateService();
        this.formData = {};
    this.measurementData = null;
    this.serviceType = document.getElementById('service-type');
    this.squareFootage = document.getElementById('square-footage');
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadMeasurementData();
        this.updateSubmitButtonState();
    }

    render() {
        this.container.innerHTML = `
            <div class="estimate-form-container">
                <div class="form-header">
                    <h2>Request Your Free Estimate</h2>
                    <p class="form-subtitle">Complete the form below to receive a detailed estimate for your paving project</p>
                </div>

                <form id="estimate-form" class="estimate-form" novalidate>
                    <!-- Personal Information Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">👤</span>
                            Personal Information
                        </h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName" class="form-label">
                                    First Name <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    class="form-input" 
                                    required
                                    aria-describedby="firstName-error"
                                >
                                <div class="error-message" id="firstName-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="lastName" class="form-label">
                                    Last Name <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    class="form-input" 
                                    required
                                    aria-describedby="lastName-error"
                                >
                                <div class="error-message" id="lastName-error"></div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="email" class="form-label">
                                    Email Address <span class="required">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    class="form-input" 
                                    required
                                    aria-describedby="email-error"
                                    placeholder="your@email.com"
                                >
                                <div class="error-message" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="phone" class="form-label">
                                    Phone Number <span class="required">*</span>
                                </label>
                                <input 
                                    type="tel" 
                                    id="phone" 
                                    name="phone" 
                                    class="form-input" 
                                    required
                                    aria-describedby="phone-error"
                                    placeholder="(555) 123-4567"
                                >
                                <div class="error-message" id="phone-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Project Details Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">🏗️</span>
                            Project Details
                        </h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="serviceType" class="form-label">
                                    Service Type <span class="required">*</span>
                                    <span class="tooltip" data-tooltip="${this.validationService.getTooltip('serviceTypeSelection')}">ℹ️</span>
                                </label>
                                <select 
                                    id="serviceType" 
                                    name="serviceType" 
                                    class="form-select" 
                                    required
                                    aria-describedby="serviceType-error"
                                >
                                    <option value="">Select a service type</option>
                                    <option value="residential">Residential Paving</option>
                                    <option value="commercial">Commercial Paving</option>
                                    <option value="maintenance">Maintenance Services</option>
                                    <option value="custom">Custom Projects</option>
                                    <option value="emergency">Emergency Repairs</option>
                                </select>
                                <div class="error-message" id="serviceType-error"></div>
                                <div class="help-text" id="serviceType-help"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="timeline" class="form-label">
                                    Preferred Timeline
                                    <span class="tooltip" data-tooltip="${this.validationService.getTooltip('timeline')}">ℹ️</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="timeline" 
                                    name="timeline" 
                                    class="form-input"
                                    min="${new Date().toISOString().split('T')[0]}"
                                    aria-describedby="timeline-error"
                                >
                                <div class="error-message" id="timeline-error"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="projectDescription" class="form-label">
                                Project Description
                            </label>
                            <textarea 
                                id="projectDescription" 
                                name="projectDescription" 
                                class="form-textarea" 
                                rows="4"
                                placeholder="Please describe your paving project in detail..."
                                aria-describedby="projectDescription-error"
                            ></textarea>
                            <div class="error-message" id="projectDescription-error"></div>
                        </div>
                    </div>

                    <!-- Property Address Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">📍</span>
                            Property Address
                            <span class="tooltip" data-tooltip="${this.validationService.getTooltip('addressImportant')}">ℹ️</span>
                        </h3>
                        
                        <div class="form-group">
                            <label for="streetAddress" class="form-label">
                                Street Address <span class="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="streetAddress" 
                                name="streetAddress" 
                                class="form-input" 
                                required
                                placeholder="123 Main Street"
                                aria-describedby="streetAddress-error"
                            >
                            <div class="error-message" id="streetAddress-error"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="city" class="form-label">
                                    City <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="city" 
                                    name="city" 
                                    class="form-input" 
                                    required
                                    aria-describedby="city-error"
                                >
                                <div class="error-message" id="city-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="state" class="form-label">
                                    State <span class="required">*</span>
                                </label>
                                <select 
                                    id="state" 
                                    name="state" 
                                    class="form-select" 
                                    required
                                    aria-describedby="state-error"
                                >
                                    <option value="">Select State</option>
                                    <option value="OH">Ohio</option>
                                    <option value="KY">Kentucky</option>
                                    <option value="WV">West Virginia</option>
                                    <option value="PA">Pennsylvania</option>
                                    <option value="IN">Indiana</option>
                                    <option value="MI">Michigan</option>
                                </select>
                                <div class="error-message" id="state-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="zipCode" class="form-label">
                                    ZIP Code <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="zipCode" 
                                    name="zipCode" 
                                    class="form-input" 
                                    required
                                    pattern="[0-9]{5}(-[0-9]{4})?"
                                    placeholder="12345"
                                    aria-describedby="zipCode-error"
                                >
                                <div class="error-message" id="zipCode-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Map Measurement Data Section -->
                    <div class="form-section">
                        <h3 class="section-title">
                            <span class="section-icon">📐</span>
                            Area Measurement
                            <span class="tooltip" data-tooltip="${this.validationService.getTooltip('areaValidation')}">ℹ️</span>
                        </h3>
                        
                        <div class="measurement-status" id="measurement-status">
                            <div class="measurement-requirement">
                                <strong>Use the map below to measure your project area</strong>
                                <p>Draw the area on the map to get an accurate measurement for your estimate.</p>
                            </div>
                        </div>

                        <!-- Map Container -->
                        <div class="map-container">
                            <!-- Google Maps Container -->
                            <div id="google-maps-container" class="map-placeholder" style="display: block;">
                                <div id="google-maps-measurement" style="height: 400px; width: 100%; position: relative;">
                                    <p style="text-align: center; padding: 2rem; color: #6b6b6b;">Google Maps measurement tool will load here</p>
                                </div>
                                <div id="google-maps-results" class="measurement-results" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: #2c2c2c; font-size: 18px;">Measurement Results</h4>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Area:</span>
                                            <span id="google-area-result" style="color: #28a745; font-weight: 600;">0 sq ft</span>
                                        </div>
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Perimeter:</span>
                                            <span id="google-perimeter-result" style="color: #007bff; font-weight: 600;">0 ft</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Hidden fields for measurement data -->
                        <input type="hidden" id="areaCoordinates" name="areaCoordinates">
                        <input type="hidden" id="calculatedSquareFootage" name="calculatedSquareFootage">
                        <input type="hidden" id="measurementTool" name="measurementTool">
                        <input type="hidden" id="measurementTimestamp" name="measurementTimestamp">
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="reset-form">
                            Reset Form
                        </button>
                        <button type="submit" class="btn btn-primary" id="submit-estimate" disabled>
                            Request Estimate
                        </button>
                        <button type="button" class="btn btn-secondary" id="get-quote" disabled style="margin-left: 1rem;">
                            Get Quick Quote
                        </button>
                    </div>
                    
                    <!-- Pricing Display Section -->
                    <div class="pricing-display" id="pricing-display" style="display: none;">
                        <div class="pricing-header">
                            <h3>Estimated Pricing</h3>
                            <p class="pricing-disclaimer">*This is an estimate. Final pricing may vary based on site conditions and additional requirements.</p>
                        </div>
                        <div class="pricing-details" id="pricing-details">
                            <!-- Pricing information will be populated here -->
                        </div>
                    </div>

                    <!-- Form Validation Summary -->
                    <div class="validation-summary" id="validation-summary" style="display: none;">
                        <h4>Please correct the following errors:</h4>
                        <ul id="validation-errors"></ul>
                    </div>
                </form>
            </div>
        `;
    }

    attachEventListeners() {
        const form = document.getElementById('estimate-form');
        const submitButton = document.getElementById('submit-estimate');
        const getQuoteButton = document.getElementById('get-quote');
        const resetButton = document.getElementById('reset-form');
        const serviceTypeSelect = document.getElementById('serviceType');
        const googleMapsToggle = document.getElementById('google-maps-toggle');

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Get quote button
        if (getQuoteButton) {
            getQuoteButton.addEventListener('click', () => this.handleGetQuote());
        }

        // Reset form
        resetButton.addEventListener('click', () => this.resetForm());

        // Service type change
        serviceTypeSelect.addEventListener('change', (e) => this.handleServiceTypeChange(e));

        // Real-time validation
        form.addEventListener('input', (e) => this.handleFieldValidation(e));
        form.addEventListener('blur', (e) => this.handleFieldValidation(e), true);

        // Measurement tool toggle buttons
        if (googleMapsToggle) {
            googleMapsToggle.addEventListener('click', () => this.toggleMeasurementTool('google-maps'));
        }

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
        
        // Initialize measurement tools after form is rendered
        setTimeout(() => this.initializeMeasurementTools(), 100);
    }

    handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) return;

        this.isSubmitting = true;

        // Collect form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        // Add measurement data
        if (this.measurementData) {
            data.areaData = this.measurementData;
        }

        // Validate form
        const validation = this.validationService.validateForm(data);
        
        if (!validation.isValid) {
            this.displayValidationErrors(validation);
            this.isSubmitting = false;
            return;
        }

        // Submit form
        this.submitForm(data);
    }

    async submitForm(data) {
        try {
            // Generate estimate
            const estimate = this.estimateService.calculateEstimate(
                data.areaData?.areaInSquareFeet || 0,
                data.serviceType,
                {
                    premium: false,
                    complexity: 'moderate',
                    accessibility: 'easy',
                    season: 'regular',
                    urgency: 'standard'
                }
            );

            // Prepare submission data
            const submissionData = {
                ...data,
                estimate,
                submittedAt: new Date().toISOString()
            };

            // Submit to backend
            const response = await fetch('/api/estimates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit estimate request');
            }

            const result = await response.json();
            this.handleSubmitSuccess(result);

        } catch (error) {
            this.handleSubmitError(error);
        } finally {
            this.isSubmitting = false;
        }
    }

    handleSubmitSuccess(result) {
        // Show success message
        this.container.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✅</div>
                <h2>Estimate Request Submitted Successfully!</h2>
                <p>Thank you for your interest in our paving services. We've received your request and will contact you within 2 hours.</p>
                <div class="success-details">
                    <p><strong>Reference #:</strong> ${result.referenceNumber}</p>
                    <p><strong>Estimated Project Cost:</strong> $${result.estimate?.totalCost?.toLocaleString() || 'TBD'}</p>
                </div>
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">
                    Submit Another Request
                </button>
            </div>
        `;

        // Clear measurement data
        handleFormSubmission();
    }

    handleSubmitError(error) {
        console.error('Form submission error:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-alert';
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${error.message}
            <button type="button" class="error-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.container.insertBefore(errorDiv, this.container.firstChild);
    }

    handleFieldValidation(event) {
        const field = event.target;
        const fieldName = field.name;
        const value = field.value;

        if (!fieldName) return;

        // Clear previous error
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            field.classList.remove('error');
        }

        // Basic validation
        if (field.hasAttribute('required') && !value.trim()) {
            if (event.type === 'blur') {
                this.showFieldError(field, 'This field is required');
            }
            return;
        }

        // Field-specific validation
        switch (fieldName) {
            case 'email':
                if (value && !this.validationService.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                }
                break;
            case 'phone':
                if (value && !this.validationService.isValidPhone(value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                }
                break;
            case 'zipCode':
                if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
                    this.showFieldError(field, 'Please enter a valid ZIP code');
                }
                break;
        }

    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            field.classList.add('error');
        }
    }

    displayValidationErrors(validation) {
        const summaryDiv = document.getElementById('validation-summary');
        const errorsList = document.getElementById('validation-errors');

        if (validation.errors.length > 0) {
            errorsList.innerHTML = validation.errors.map(error => `<li>${error}</li>`).join('');
            summaryDiv.style.display = 'block';
            summaryDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    handleServiceTypeChange(event) {
        const serviceType = event.target.value;
        const helpText = document.getElementById('serviceType-help');
        
        if (serviceType && this.validationService.getHelpText('serviceTypes', serviceType)) {
            helpText.textContent = this.validationService.getHelpText('serviceTypes', serviceType);
            helpText.style.display = 'block';
        } else {
            helpText.style.display = 'none';
        }
    }

    formatPhoneNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/(\d{3})/, '($1');
        }
        
        event.target.value = value;
    }

    launchMeasurementTool(toolType) {
        // This would integrate with the existing measurement tools
        window.open(`/assets/measurement-tools/${toolType}.html`, '_blank');
    }

    loadMeasurementData() {
        if (hasMeasurementData()) {
            this.measurementData = getAllMeasurementData();
            this.updateMeasurementStatus();
        }
    }

    updateMeasurementStatus() {
        const statusDiv = document.getElementById('measurement-status');
        
        if (this.measurementData && this.measurementData.googleMaps) {
            const data = this.measurementData.googleMaps;
            const area = data.areaInSquareFeet || data.area || 0;
            
            statusDiv.innerHTML = `
                <div class="measurement-success">
                    <strong>✅ Area Measured: ${area.toLocaleString()} sq ft</strong>
                    <p>Using Google Maps tool</p>
                </div>
            `;

            // Update hidden fields
            document.getElementById('calculatedSquareFootage').value = area;
            document.getElementById('measurementTool').value = this.measurementData.activeTool;
            document.getElementById('measurementTimestamp').value = new Date().toISOString();
        }
    }

    updateSubmitButtonState() {
        const submitButton = document.getElementById('submit-estimate');
        const getQuoteButton = document.getElementById('get-quote');
        
        // Check if form is valid for submission
        const hasRequiredFields = this.checkRequiredFields();
        const hasMeasurement = this.measurementData && 
            this.measurementData.googleMaps;

        submitButton.disabled = !hasRequiredFields || !hasMeasurement;
        getQuoteButton.disabled = !hasMeasurement;
    }

    checkRequiredFields() {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType', 'streetAddress', 'city', 'state', 'zipCode'];
        
        return requiredFields.every(fieldName => {
            const field = document.getElementById(fieldName);
            return field && field.value.trim();
        });
    }

    resetForm() {
        if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
            document.getElementById('estimate-form').reset();
            this.measurementData = null;
            this.updateMeasurementStatus();
            this.updateSubmitButtonState();
            
            // Clear validation errors
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
                el.classList.remove('error');
            });
            
            // Clear measurement data
            handleFormReset();
        }
    }

    /**
     * Initialize the measurement tools in the estimate form
     */
    initializeMeasurementTools() {
        // Initialize Google Maps tool by default
        this.initializeGoogleMaps();
    }

    /**
     * Initialize Google Maps measurement tool
     */
    initializeGoogleMaps() {
        // Load Google Maps if not already loaded
        if (!this.googleMapsLoaded) {
            this.loadGoogleMapsMeasurementTool();
        }
        this.activeMeasurementTool = 'google-maps';
    }





    /**
     * Load Google Maps measurement tool
     */
    async loadGoogleMapsMeasurementTool() {
        // Implementation for Google Maps would go here
        const googleMapsDiv = document.getElementById('google-maps-measurement');
        googleMapsDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #28a745;">Google Maps measurement tool coming soon!</p>';
        this.googleMapsLoaded = true;
    }


    /**
     * Handle get quote button click
     */
    async handleGetQuote() {
        if (!this.measurementData || !this.measurementData.googleMaps) {
            alert('Please measure the project area first using the map tool above.');
            return;
        }

        try {
            // Get current form data
            const serviceType = document.getElementById('serviceType').value || 'residential';
            
            // Calculate pricing
            const pricingData = this.calculatePricing(serviceType);
            
            // Display pricing
            this.displayPricing(pricingData);
            
        } catch (error) {
            console.error('Error calculating pricing:', error);
            alert('Unable to calculate pricing. Please try again.');
        }
    }

    /**
     * Calculate pricing based on measurements and service type
     */
    calculatePricing(serviceType = 'residential') {
        if (!this.measurementData) {
            throw new Error('No measurement data available');
        }

        const data = this.measurementData.googleMaps;
        const squareFootage = data.areaInSquareFeet || data.area || 0;
        
        // Base pricing per square foot
        const basePricing = {
            residential: {
                asphalt: { min: 3.50, max: 7.00, avg: 5.25 },
                concrete: { min: 6.00, max: 12.00, avg: 9.00 },
                maintenance: { min: 1.50, max: 3.00, avg: 2.25 }
            },
            commercial: {
                asphalt: { min: 4.00, max: 8.50, avg: 6.25 },
                concrete: { min: 7.00, max: 15.00, avg: 11.00 },
                maintenance: { min: 2.00, max: 4.00, avg: 3.00 }
            },
            maintenance: {
                asphalt: { min: 1.50, max: 3.50, avg: 2.50 },
                concrete: { min: 2.00, max: 4.50, avg: 3.25 },
                maintenance: { min: 1.00, max: 2.50, avg: 1.75 }
            },
            custom: {
                asphalt: { min: 4.50, max: 9.00, avg: 6.75 },
                concrete: { min: 8.00, max: 16.00, avg: 12.00 },
                maintenance: { min: 2.50, max: 5.00, avg: 3.75 }
            },
            emergency: {
                asphalt: { min: 5.00, max: 10.00, avg: 7.50 },
                concrete: { min: 9.00, max: 18.00, avg: 13.50 },
                maintenance: { min: 3.00, max: 6.00, avg: 4.50 }
            }
        };

        const serviceTypePricing = basePricing[serviceType] || basePricing.residential;
        
        // Calculate costs for different materials
        const calculations = {
            asphalt: {
                min: Math.round(squareFootage * serviceTypePricing.asphalt.min),
                max: Math.round(squareFootage * serviceTypePricing.asphalt.max),
                avg: Math.round(squareFootage * serviceTypePricing.asphalt.avg)
            },
            concrete: {
                min: Math.round(squareFootage * serviceTypePricing.concrete.min),
                max: Math.round(squareFootage * serviceTypePricing.concrete.max),
                avg: Math.round(squareFootage * serviceTypePricing.concrete.avg)
            },
            maintenance: {
                min: Math.round(squareFootage * serviceTypePricing.maintenance.min),
                max: Math.round(squareFootage * serviceTypePricing.maintenance.max),
                avg: Math.round(squareFootage * serviceTypePricing.maintenance.avg)
            }
        };

        // Apply size adjustments
        const sizeMultiplier = this.getSizeMultiplier(squareFootage);
        const seasonMultiplier = this.getSeasonMultiplier();
        
        // Apply multipliers
        Object.keys(calculations).forEach(material => {
            calculations[material].min = Math.round(calculations[material].min * sizeMultiplier * seasonMultiplier);
            calculations[material].max = Math.round(calculations[material].max * sizeMultiplier * seasonMultiplier);
            calculations[material].avg = Math.round(calculations[material].avg * sizeMultiplier * seasonMultiplier);
        });

        return {
            squareFootage,
            serviceType,
            calculations,
            factors: {
                sizeMultiplier,
                seasonMultiplier
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get size-based pricing multiplier
     */
    getSizeMultiplier(squareFootage) {
        if (squareFootage < 500) return 1.2; // Small projects cost more per sq ft
        if (squareFootage < 1000) return 1.1;
        if (squareFootage < 2000) return 1.0;
        if (squareFootage < 5000) return 0.95;
        return 0.9; // Large projects get discounts
    }

    /**
     * Get seasonal pricing multiplier
     */
    getSeasonMultiplier() {
        const month = new Date().getMonth(); // 0-11
        
        // Winter months (Dec, Jan, Feb) - higher pricing
        if (month === 11 || month === 0 || month === 1) return 1.15;
        
        // Peak season (Mar, Apr, May, Sep, Oct) - standard pricing
        if (month >= 2 && month <= 4 || month >= 8 && month <= 9) return 1.0;
        
        // Summer months (Jun, Jul, Aug) - slight discount
        return 0.95;
    }

    /**
     * Display pricing information
     */
    displayPricing(pricingData) {
        const pricingDisplay = document.getElementById('pricing-display');
        const pricingDetails = document.getElementById('pricing-details');
        
        if (!pricingDisplay || !pricingDetails) return;

        const { squareFootage, serviceType, calculations, factors } = pricingData;
        
        pricingDetails.innerHTML = `
            <div class="pricing-overview">
                <div class="pricing-stat">
                    <span class="stat-label">Project Area:</span>
                    <span class="stat-value">${squareFootage.toLocaleString()} sq ft</span>
                </div>
                <div class="pricing-stat">
                    <span class="stat-label">Service Type:</span>
                    <span class="stat-value">${this.formatServiceType(serviceType)}</span>
                </div>
            </div>
            
            <div class="estimate-disclaimer" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; color: #856404;">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                    <span style="font-size: 1.25rem; flex-shrink: 0;">⚠️</span>
                    <div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: #856404;">Important Pricing Disclaimer</strong>
                        <p style="margin: 0; line-height: 1.5; color: #856404;">These estimates are preliminary calculations based on basic measurements and standard pricing. The final project price may vary anywhere from <strong>25% to 50% higher or lower</strong> than the predicted cost depending on site conditions, material choices, accessibility, permits, and specific project requirements.</p>
                    </div>
                </div>
            </div>
            
            <div class="material-pricing">
                <h4>Pricing by Material</h4>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🛣️ Asphalt Paving</h5>
                        <p>Durable, cost-effective option for driveways and parking lots</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.asphalt.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.asphalt.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.asphalt.avg.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🏗️ Concrete Paving</h5>
                        <p>Long-lasting, premium option with excellent durability</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.concrete.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.concrete.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.concrete.avg.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="material-option">
                    <div class="material-header">
                        <h5>🔧 Maintenance Services</h5>
                        <p>Repairs, sealing, and restoration services</p>
                    </div>
                    <div class="price-range">
                        <span class="price-min">$${calculations.maintenance.min.toLocaleString()}</span>
                        <span class="price-separator">-</span>
                        <span class="price-max">$${calculations.maintenance.max.toLocaleString()}</span>
                        <span class="price-avg">Avg: $${calculations.maintenance.avg.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="pricing-factors">
                <h4>Pricing Factors Applied</h4>
                <ul>
                    <li>Project Size: ${this.formatMultiplier(factors.sizeMultiplier)} (${this.getSizeDescription(squareFootage)})</li>
                    <li>Seasonal Rate: ${this.formatMultiplier(factors.seasonMultiplier)} (${this.getSeasonDescription()})</li>
                    <li>Service Type: ${this.formatServiceType(serviceType)}</li>
                </ul>
            </div>
            
            <div class="pricing-actions">
                <button type="button" class="btn btn-primary" onclick="document.getElementById('submit-estimate').scrollIntoView({behavior: 'smooth'})">
                    Request Detailed Estimate
                </button>
                <button type="button" class="btn btn-outline" onclick="window.print()">
                    Print Quote
                </button>
            </div>
        `;
        
        pricingDisplay.style.display = 'block';
        pricingDisplay.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Format service type for display
     */
    formatServiceType(serviceType) {
        const types = {
            'residential': 'Residential Paving',
            'commercial': 'Commercial Paving',
            'maintenance': 'Maintenance Services',
            'custom': 'Custom Projects',
            'emergency': 'Emergency Repairs'
        };
        return types[serviceType] || 'Residential Paving';
    }

    /**
     * Format multiplier for display
     */
    formatMultiplier(multiplier) {
        const percentage = Math.round((multiplier - 1) * 100);
        if (percentage > 0) return `+${percentage}%`;
        if (percentage < 0) return `${percentage}%`;
        return 'Standard';
    }

    /**
     * Get size description
     */
    getSizeDescription(squareFootage) {
        if (squareFootage < 500) return 'Small project';
        if (squareFootage < 1000) return 'Medium project';
        if (squareFootage < 2000) return 'Large project';
        if (squareFootage < 5000) return 'Very large project';
        return 'Commercial scale';
    }

    /**
     * Get season description
     */
    getSeasonDescription() {
        const month = new Date().getMonth();
        
        if (month === 11 || month === 0 || month === 1) return 'Winter rates';
        if (month >= 2 && month <= 4 || month >= 8 && month <= 9) return 'Peak season';
        return 'Summer rates';
    }
}

export default EstimateForm;
