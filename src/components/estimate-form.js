/**
 * Estimate Form Component
 * Comprehensive form with measurement tool integration and validation
 */

import { FormValidationService } from '../services/form-validation-service.js';
import { EstimateService } from '../services/estimate-service.js';
import { getMeasurementData, getAllMeasurementData, hasMeasurementData } from '../utils/measurement-storage.js';

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
this.formatPricingDisplay();
        this.loadMeasurementData();
this.updateSubmitButtonState();
this.calculatePricing();
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
                            <!-- Tool Selection -->
                            <div class="tool-selection">
                                <button type="button" class="toggle-btn active" data-tool="arcgis-3d" id="arcgis-toggle">
                                    🗺️ ArcGIS 3D Measurement
                                </button>
                                <button type="button" class="toggle-btn" data-tool="google-maps" id="google-maps-toggle">
                                    📍 Google Maps Measurement
                                </button>
                            </div>

                            <!-- ArcGIS Container (Default/Active) -->
                            <div id="arcgis-container" class="map-placeholder" style="display: block;">
                                <div id="arcgis-scene-view" style="height: 400px; width: 100%; position: relative;">
                                    <div id="arcgis-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border-radius: 8px; flex-direction: column; gap: 1rem;">
                                        <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ffd700; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                                        <p style="color: #6b6b6b; font-size: 16px; margin: 0;">Loading ArcGIS 3D scene...</p>
                                    </div>
                                </div>
                                <div id="arcgis-results" class="measurement-results" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: #2c2c2c; font-size: 18px;">Measurement Results</h4>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Line Measurement:</span>
                                            <span id="line-result" style="color: #007bff; font-weight: 600;">0 m</span>
                                        </div>
                                        <div class="result-item">
                                            <span style="font-weight: 600; color: #495057;">Area Measurement:</span>
                                            <span id="area-result" style="color: #28a745; font-weight: 600;">0 m²</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Google Maps Container (Hidden by default) -->
                            <div id="google-maps-container" class="map-placeholder" style="display: none;">
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
                            <span class="btn-text">Request Estimate</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span> Processing...
                            </span>
                        </button>
                        <button type="button" class="btn btn-secondary" id="get-quote" disabled style="margin-left: 1rem;">
                            <span class="btn-text">Get Quick Quote</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span> Calculating...
                            </span>
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
        const arcgisToggle = document.getElementById('arcgis-toggle');
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
        if (arcgisToggle) {
            arcgisToggle.addEventListener('click', () => this.toggleMeasurementTool('arcgis-3d'));
        }
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
        this.updateSubmitButtonState(true);

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
            this.updateSubmitButtonState(false);
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
            this.updateSubmitButtonState(false);
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
        import('../utils/measurement-storage.js').then(({ handleFormSubmission }) => {
            handleFormSubmission();
        });
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

        // Update submit button state
        this.updateSubmitButtonState();
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
        
        if (this.measurementData && (this.measurementData.googleMaps || this.measurementData.arcgis)) {
            const data = this.measurementData.googleMaps || this.measurementData.arcgis;
            const area = data.areaInSquareFeet || data.area || 0;
            
            statusDiv.innerHTML = `
                <div class="measurement-success">
                    <strong>✅ Area Measured: ${area.toLocaleString()} sq ft</strong>
                    <p>Using ${this.measurementData.activeTool === 'google-maps' ? 'Google Maps' : 'ArcGIS 3D'} tool</p>
                </div>
            `;

            // Update hidden fields
            document.getElementById('calculatedSquareFootage').value = area;
            document.getElementById('measurementTool').value = this.measurementData.activeTool;
            document.getElementById('measurementTimestamp').value = new Date().toISOString();
        }
    }

    updateSubmitButtonState(isLoading = false) {
        const submitButton = document.getElementById('submit-estimate');
        const getQuoteButton = document.getElementById('get-quote');
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoading = submitButton.querySelector('.btn-loading');
        const getQuoteText = getQuoteButton.querySelector('.btn-text');
        const getQuoteLoading = getQuoteButton.querySelector('.btn-loading');
        
        if (isLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            submitButton.disabled = true;
            return;
        }

        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';

        // Check if form is valid for submission
        const hasRequiredFields = this.checkRequiredFields();
        const hasMeasurement = this.measurementData && 
            (this.measurementData.googleMaps || this.measurementData.arcgis);

        submitButton.disabled = !hasRequiredFields || !hasMeasurement;
        getQuoteButton.disabled = !hasMeasurement;

        if (!hasMeasurement) {
            getQuoteText.style.display = 'inline';
            getQuoteLoading.style.display = 'none';
        }
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
            import('../utils/measurement-storage.js').then(({ handleFormReset }) => {
                handleFormReset();
            });
        }
    }

    /**
     * Initialize the measurement tools in the estimate form
     */
    initializeMeasurementTools() {
        // Initialize ArcGIS tool by default
        this.loadArcGISMeasurementTool();
    }

    /**
     * Toggle between measurement tools
     */
    toggleMeasurementTool(toolType) {
        const arcgisToggle = document.getElementById('arcgis-toggle');
        const googleMapsToggle = document.getElementById('google-maps-toggle');
        const arcgisContainer = document.getElementById('arcgis-container');
        const googleMapsContainer = document.getElementById('google-maps-container');

        // Update button states
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        
        if (toolType === 'arcgis-3d') {
            arcgisToggle.classList.add('active');
            arcgisContainer.style.display = 'block';
            googleMapsContainer.style.display = 'none';
            
            // Load ArcGIS if not already loaded
            if (!this.arcgisLoaded) {
                this.loadArcGISMeasurementTool();
            }
        } else if (toolType === 'google-maps') {
            googleMapsToggle.classList.add('active');
            arcgisContainer.style.display = 'none';
            googleMapsContainer.style.display = 'block';
            
            // Load Google Maps if not already loaded
            if (!this.googleMapsLoaded) {
                this.loadGoogleMapsMeasurementTool();
            }
        }

        // Update active tool
        this.activeMeasurementTool = toolType;
    }

    /**
     * Load ArcGIS measurement tool
     */
    async loadArcGISMeasurementTool() {
        if (this.arcgisLoaded) return;
        
        try {
            this.arcgisLoaded = true;
            
            // Load CSS first
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://js.arcgis.com/4.33/esri/themes/light/main.css';
            document.head.appendChild(cssLink);

            // Load Calcite components
            const calciteScript = document.createElement('script');
            calciteScript.type = 'module';
            calciteScript.src = 'https://js.arcgis.com/calcite-components/3.2.1/calcite.esm.js';
            document.head.appendChild(calciteScript);

            // Load main ArcGIS SDK
            const scriptTag = document.createElement('script');
            scriptTag.src = 'https://js.arcgis.com/4.33/';
            
            scriptTag.onload = () => {
                // Load map components
                const mapComponentsScript = document.createElement('script');
                mapComponentsScript.type = 'module';
                mapComponentsScript.src = 'https://js.arcgis.com/4.33/map-components/';
                mapComponentsScript.onload = () => {
                    this.initializeArcGISScene();
                };
                document.head.appendChild(mapComponentsScript);
            };
            
            document.head.appendChild(scriptTag);
            
        } catch (error) {
            console.error('Error loading ArcGIS:', error);
            this.showArcGISError(error);
        }
    }

    /**
     * Initialize ArcGIS scene and measurement tools
     */
    initializeArcGISScene() {
        const sceneViewContainer = document.getElementById('arcgis-scene-view');
        const arcGISPlaceholder = document.getElementById('arcgis-placeholder');
        const arcGISResults = document.getElementById('arcgis-results');
        const lineResult = document.getElementById('line-result');
        const areaResult = document.getElementById('area-result');

        // Create the ArcGIS scene element
        sceneViewContainer.innerHTML = `
            <arcgis-scene item-id="5ce0de673d3b41a3bf3a217942211c4b" style="height: 100%; width: 100%;">
                <arcgis-zoom position="top-left"></arcgis-zoom>
                <arcgis-navigation-toggle position="top-left"></arcgis-navigation-toggle>
                <arcgis-compass position="top-left"></arcgis-compass>
                <arcgis-expand id="expand-line" position="top-right" group="top-right">
                    <arcgis-direct-line-measurement-3d></arcgis-direct-line-measurement-3d>
                </arcgis-expand>
                <arcgis-expand id="expand-area" position="top-right" group="top-right">
                    <arcgis-area-measurement-3d></arcgis-area-measurement-3d>
                </arcgis-expand>
            </arcgis-scene>
        `;

        // Wait for the scene to be ready
        setTimeout(() => {
            const viewElement = sceneViewContainer.querySelector('arcgis-scene');
            const directLineMeasurement3d = sceneViewContainer.querySelector('arcgis-direct-line-measurement-3d');
            const areaMeasurement3d = sceneViewContainer.querySelector('arcgis-area-measurement-3d');
            const expandDirectLine = sceneViewContainer.querySelector('#expand-line');
            const expandArea = sceneViewContainer.querySelector('#expand-area');

            if (viewElement && directLineMeasurement3d && areaMeasurement3d) {
                viewElement.viewOnReady().then(() => {
                    this.setupArcGISMeasurementObservers(
                        expandDirectLine,
                        expandArea,
                        directLineMeasurement3d,
                        areaMeasurement3d,
                        lineResult,
                        areaResult,
                        arcGISResults
                    );
                });
            }
        }, 1000);
    }

    /**
     * Set up ArcGIS measurement observers
     */
    setupArcGISMeasurementObservers(expandDirectLine, expandArea, directLineMeasurement3d, areaMeasurement3d, lineResult, areaResult, arcGISResults) {
        // Observer for direct line measurement
        const observerLine = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.target.expanded) {
                    directLineMeasurement3d.start();
                    arcGISResults.style.display = 'block';
                } else {
                    directLineMeasurement3d.clear();
                    areaMeasurement3d.clear();
                    lineResult.textContent = '0 m';
                    areaResult.textContent = '0 m²';
                    if (!expandArea.expanded) {
                        arcGISResults.style.display = 'none';
                    }
                }
            });
        });
        observerLine.observe(expandDirectLine, { attributeFilter: ['expanded'] });

        // Observer for area measurement
        const observerArea = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.target.expanded) {
                    areaMeasurement3d.start();
                    arcGISResults.style.display = 'block';
                } else {
                    directLineMeasurement3d.clear();
                    areaMeasurement3d.clear();
                    lineResult.textContent = '0 m';
                    areaResult.textContent = '0 m²';
                    if (!expandDirectLine.expanded) {
                        arcGISResults.style.display = 'none';
                    }
                }
            });
        });
        observerArea.observe(expandArea, { attributeFilter: ['expanded'] });

        // Listen for measurement events
        directLineMeasurement3d.addEventListener('measure-complete', (event) => {
            if (event.detail && event.detail.distance) {
                lineResult.textContent = `${event.detail.distance.toFixed(2)} ${event.detail.unit || 'm'}`;
                this.updateProjectSizeFromMeasurement(event.detail, 'distance');
            }
        });

        areaMeasurement3d.addEventListener('measure-complete', (event) => {
            if (event.detail && event.detail.area) {
                areaResult.textContent = `${event.detail.area.toFixed(2)} ${event.detail.unit || 'm²'}`;
                this.updateProjectSizeFromMeasurement(event.detail, 'area');
            }
        });
    }

    /**
     * Update project size input from measurement
     */
    updateProjectSizeFromMeasurement(measurementData, type) {
        if (type === 'area' && measurementData.area) {
            // Convert square meters to square feet
            const areaInSqFt = Math.round(measurementData.area * 10.764);
            
            // Update hidden fields
            document.getElementById('calculatedSquareFootage').value = areaInSqFt;
            document.getElementById('measurementTool').value = 'arcgis-3d';
            document.getElementById('measurementTimestamp').value = new Date().toISOString();
            
            // Update measurement data
            this.measurementData = {
                arcgis: {
                    area: areaInSqFt,
                    areaInSquareFeet: areaInSqFt,
                    coordinates: [],
                    timestamp: new Date().toISOString()
                },
                activeTool: 'arcgis-3d'
            };
            
            // Update UI
            this.updateMeasurementStatus();
            this.updateSubmitButtonState();
        }
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
     * Show ArcGIS error message
     */
    showArcGISError(error) {
        const placeholder = document.getElementById('arcgis-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc3545;">
                    <div style="font-size: 48px; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="margin-bottom: 1rem; color: #dc3545;">Failed to Load ArcGIS</h3>
                    <p style="margin-bottom: 1.5rem; color: #6c757d;">Unable to load the 3D measurement tool. This might be due to a network issue or service unavailability.</p>
                    <button onclick="window.location.reload();" 
                            style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #6c757d;">Please try refreshing the page or contact us directly for assistance.</p>
                </div>
            `;
        }
    }

    /**
     * Handle get quote button click
     */
    async handleGetQuote() {
        if (!this.measurementData || (!this.measurementData.googleMaps && !this.measurementData.arcgis)) {
            alert('Please measure the project area first using the map tool above.');
            return;
        }

        const getQuoteButton = document.getElementById('get-quote');
        const btnText = getQuoteButton.querySelector('.btn-text');
        const btnLoading = getQuoteButton.querySelector('.btn-loading');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        getQuoteButton.disabled = true;

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
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            getQuoteButton.disabled = false;
        }
    }

    /**
     * Calculate pricing based on measurements and service type
     */
    calculatePricing(serviceType = 'residential') {
        if (!this.measurementData) {
            throw new Error('No measurement data available');
        }

        const data = this.measurementData.googleMaps || this.measurementData.arcgis;
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
