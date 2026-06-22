/**
 * Maps Fallback Form Component
 * Manual address and area entry when Google Maps is unavailable
 */

import { FormValidationService } from '../services/form-validation-service.js';
import { storeMeasurementData } from '../utils/measurement-storage.js';

export class MapsFallbackForm {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            errorMessage: 'Google Maps is currently unavailable. Please enter your project details manually.',
            errorType: 'UNKNOWN_ERROR',
            onDataSubmitted: () => {},
            ...options
        };

        this.validationService = new FormValidationService();
        this.formData = {};
        this.isValidated = false;

        if (!this.container) {
            throw new Error(`Container with ID "${containerId}" not found`);
        }

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.addStyles();
        this.container.innerHTML = `
            <div class="maps-fallback-container">
                <!-- Error Message Banner -->
                <div class="fallback-notice ${this.getErrorClass()}">
                    <div class="notice-icon">
                        ${this.getErrorIcon()}
                    </div>
                    <div class="notice-content">
                        <h4 class="notice-title">${this.getErrorTitle()}</h4>
                        <p class="notice-message">${this.options.errorMessage}</p>
                        <p class="notice-help">Don't worry - you can still get your estimate by entering your project details below.</p>
                    </div>
                </div>

                <!-- Manual Entry Form -->
                <div class="fallback-form-section">
                    <div class="form-header">
                        <h3 class="section-title">
                            <span class="section-icon">📍</span>
                            Project Location & Details
                        </h3>
                        <p class="section-subtitle">Enter your project address and estimated area information</p>
                    </div>

                    <form id="maps-fallback-form" class="fallback-form" novalidate>
                        <!-- Street Address -->
                        <div class="form-group">
                            <label for="fallback-street-address" class="form-label">
                                Street Address <span class="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="fallback-street-address"
                                name="streetAddress"
                                class="form-input"
                                required
                                placeholder="123 Main Street"
                                aria-describedby="fallback-street-address-error"
                            >
                            <div class="error-message" id="fallback-street-address-error"></div>
                        </div>

                        <!-- City, State, ZIP Row -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fallback-city" class="form-label">
                                    City <span class="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fallback-city"
                                    name="city"
                                    class="form-input"
                                    required
                                    placeholder="Philadelphia"
                                    aria-describedby="fallback-city-error"
                                >
                                <div class="error-message" id="fallback-city-error"></div>
                            </div>

                            <div class="form-group">
                                <label for="fallback-state" class="form-label">
                                    State <span class="required">*</span>
                                </label>
                                <select
                                    id="fallback-state"
                                    name="state"
                                    class="form-select"
                                    required
                                    aria-describedby="fallback-state-error"
                                >
                                    <option value="">Select State</option>
                                    ${this.getStateOptions()}
                                </select>
                                <div class="error-message" id="fallback-state-error"></div>
                            </div>

                            <div class="form-group">
                                <label for="fallback-zip" class="form-label">
                                    ZIP Code <span class="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fallback-zip"
                                    name="zipCode"
                                    class="form-input"
                                    required
                                    placeholder="19103"
                                    pattern="[0-9]{5}"
                                    maxlength="5"
                                    aria-describedby="fallback-zip-error"
                                >
                                <div class="error-message" id="fallback-zip-error"></div>
                            </div>
                        </div>

                        <!-- Square Footage Estimate -->
                        <div class="form-group">
                            <label for="fallback-square-footage" class="form-label">
                                Estimated Square Footage <span class="required">*</span>
                                <span class="tooltip" data-tooltip="Provide your best estimate of the project area. Don't worry about being exact - this helps us prepare an initial estimate.">ℹ️</span>
                            </label>
                            <input
                                type="number"
                                id="fallback-square-footage"
                                name="squareFootage"
                                class="form-input"
                                required
                                min="50"
                                max="500000"
                                step="10"
                                placeholder="1000"
                                aria-describedby="fallback-square-footage-error"
                            >
                            <div class="help-text">
                                <strong>Tip:</strong> For driveways, typical single-car is ~200-400 sq ft, double-car is ~400-600 sq ft.
                                For parking lots, count spaces and multiply by ~180 sq ft per space.
                            </div>
                            <div class="error-message" id="fallback-square-footage-error"></div>
                        </div>

                        <!-- Optional Project Description -->
                        <div class="form-group">
                            <label for="fallback-project-description" class="form-label">
                                Additional Project Details (Optional)
                            </label>
                            <textarea
                                id="fallback-project-description"
                                name="projectDescription"
                                class="form-textarea"
                                rows="3"
                                placeholder="Any additional details about your project, terrain, slopes, or special considerations..."
                                aria-describedby="fallback-project-description-error"
                            ></textarea>
                            <div class="error-message" id="fallback-project-description-error"></div>
                        </div>

                        <!-- Submit Button -->
                        <div class="form-actions">
                            <button
                                type="submit"
                                id="fallback-submit-btn"
                                class="btn btn-primary btn-lg"
                            >
                                Continue with Manual Entry
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Helpful Information -->
                <div class="fallback-help-section">
                    <h4 class="help-title">📏 How to Estimate Square Footage</h4>
                    <div class="help-grid">
                        <div class="help-item">
                            <strong>Rectangular Areas:</strong>
                            <p>Multiply length × width. Example: 20 ft × 30 ft = 600 sq ft</p>
                        </div>
                        <div class="help-item">
                            <strong>Driveways:</strong>
                            <p>Single-car: 200-400 sq ft | Double-car: 400-600 sq ft | Three-car: 600-900 sq ft</p>
                        </div>
                        <div class="help-item">
                            <strong>Parking Lots:</strong>
                            <p>Multiply number of spaces × 180 sq ft per space (includes drive lanes)</p>
                        </div>
                        <div class="help-item">
                            <strong>Don't Worry!</strong>
                            <p>Our team will verify measurements during the on-site visit. Your estimate helps us prepare.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    addStyles() {
        if (document.getElementById('maps-fallback-styles')) return;

        const style = document.createElement('style');
        style.id = 'maps-fallback-styles';
        style.textContent = `
            /* Maps Fallback Form Styles */
            .maps-fallback-container {
                max-width: 900px;
                margin: 0 auto;
                padding: 2rem;
                font-family: 'Oswald', sans-serif;
            }

            /* Error Notice Banner */
            .fallback-notice {
                display: flex;
                gap: 1.5rem;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 2rem;
                border: 2px solid;
                animation: slideInDown 0.4s ease-out;
            }

            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .notice-info {
                background: #e3f2fd;
                border-color: #90caf9;
                color: #1565c0;
            }

            .notice-warning {
                background: #fff3e0;
                border-color: #ffb74d;
                color: #e65100;
            }

            .notice-error {
                background: #ffebee;
                border-color: #ef5350;
                color: #c62828;
            }

            .notice-icon {
                font-size: 2.5rem;
                flex-shrink: 0;
                line-height: 1;
            }

            .notice-content {
                flex: 1;
            }

            .notice-title {
                font-size: 1.4rem;
                font-weight: 600;
                margin: 0 0 0.5rem 0;
            }

            .notice-message {
                font-size: 1rem;
                font-weight: 400;
                margin: 0 0 0.75rem 0;
                line-height: 1.5;
            }

            .notice-help {
                font-size: 0.95rem;
                font-weight: 500;
                margin: 0;
                opacity: 0.9;
            }

            /* Form Section */
            .fallback-form-section {
                background: #fafafa;
                padding: 2rem;
                border-radius: 8px;
                border: 1px solid #e5e5e5;
                margin-bottom: 2rem;
            }

            .form-header {
                text-align: left;
                margin-bottom: 2rem;
                padding-bottom: 1.5rem;
                border-bottom: 2px solid #e5e5e5;
            }

            .section-title {
                color: #2c2c2c;
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0 0 0.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .section-icon {
                font-size: 1.8rem;
                display: inline-block;
                width: 2rem;
                text-align: center;
            }

            .section-subtitle {
                color: #6b6b6b;
                font-size: 1rem;
                font-weight: 300;
                margin: 0;
            }

            /* Form Layout */
            .fallback-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 1rem;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .form-label {
                font-weight: 600;
                color: #2c2c2c;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .required {
                color: #e74c3c;
                font-weight: 700;
            }

            .tooltip {
                cursor: help;
                position: relative;
                display: inline-block;
                font-size: 0.9rem;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }

            .tooltip:hover {
                opacity: 1;
            }

            .tooltip::before {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background: #2c2c2c;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                font-size: 0.8rem;
                white-space: normal;
                max-width: 250px;
                width: max-content;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                z-index: 1000;
            }

            .tooltip::after {
                content: '';
                position: absolute;
                bottom: 115%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: #2c2c2c;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            .tooltip:hover::before,
            .tooltip:hover::after {
                opacity: 1;
                visibility: visible;
            }

            /* Form Controls */
            .form-input,
            .form-select,
            .form-textarea {
                padding: 1rem;
                border: 2px solid #e5e5e5;
                border-radius: 6px;
                font-size: 1rem;
                font-family: inherit;
                transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
                background: white;
            }

            .form-input:focus,
            .form-select:focus,
            .form-textarea:focus {
                outline: none;
                border-color: #ffd700;
                box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
            }

            .form-input.error,
            .form-select.error,
            .form-textarea.error {
                border-color: #e74c3c;
                background-color: #fdf2f2;
            }

            .form-input.error:focus,
            .form-select.error:focus,
            .form-textarea.error:focus {
                border-color: #e74c3c;
                box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
            }

            .form-textarea {
                resize: vertical;
                min-height: 100px;
                font-family: inherit;
            }

            .form-select {
                cursor: pointer;
                background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 1rem center;
                background-size: 1.5rem;
                padding-right: 3rem;
                appearance: none;
            }

            /* Error Messages */
            .error-message {
                color: #e74c3c;
                font-size: 0.9rem;
                font-weight: 500;
                min-height: 1.2rem;
                margin-top: 0.25rem;
                display: none;
            }

            .error-message:not(:empty) {
                display: block;
            }

            /* Help Text */
            .help-text {
                color: #6b6b6b;
                font-size: 0.9rem;
                font-style: italic;
                margin-top: 0.5rem;
                line-height: 1.4;
            }

            .help-text strong {
                font-weight: 600;
                font-style: normal;
            }

            /* Form Actions */
            .form-actions {
                display: flex;
                justify-content: center;
                margin-top: 1rem;
                padding-top: 1.5rem;
                border-top: 2px solid #e5e5e5;
            }

            /* Buttons */
            .btn {
                padding: 1rem 2rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                font-family: inherit;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: #ffd700;
                color: #2c2c2c;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .btn-primary:hover:not(:disabled) {
                background: #e6c200;
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(-1px);
            }

            .btn-primary:active:not(:disabled) {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .btn-success {
                background: #28a745;
                color: white;
            }

            .btn-lg {
                padding: 1.25rem 2.5rem;
                font-size: 1.1rem;
            }

            /* Alert Banners */
            .form-error-banner,
            .form-success-banner {
                padding: 1rem 1.5rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                font-weight: 500;
                animation: slideInDown 0.3s ease-out;
            }

            .form-error-banner {
                background: #ffebee;
                border: 2px solid #ef5350;
                color: #c62828;
            }

            .form-success-banner {
                background: #e8f5e9;
                border: 2px solid #66bb6a;
                color: #2e7d32;
            }

            .error-icon,
            .success-icon {
                font-size: 1.5rem;
            }

            /* Help Section */
            .fallback-help-section {
                background: #fff;
                padding: 2rem;
                border-radius: 8px;
                border: 1px solid #e5e5e5;
            }

            .help-title {
                color: #2c2c2c;
                font-size: 1.3rem;
                font-weight: 600;
                margin: 0 0 1.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .help-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
            }

            .help-item {
                padding: 1.25rem;
                background: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #e9ecef;
            }

            .help-item strong {
                display: block;
                color: #2c2c2c;
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 1.05rem;
            }

            .help-item p {
                color: #6b6b6b;
                font-size: 0.95rem;
                margin: 0;
                line-height: 1.5;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .maps-fallback-container {
                    padding: 1rem;
                }

                .fallback-notice {
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1.25rem;
                }

                .notice-icon {
                    font-size: 2rem;
                }

                .notice-title {
                    font-size: 1.2rem;
                }

                .fallback-form-section {
                    padding: 1.5rem;
                }

                .form-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                }

                .section-title {
                    font-size: 1.3rem;
                }

                .form-row {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .help-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .btn-lg {
                    width: 100%;
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                }

                .tooltip::before {
                    max-width: 200px;
                    font-size: 0.75rem;
                }
            }

            @media (max-width: 480px) {
                .form-header h2 {
                    font-size: 1.5rem;
                }

                .form-subtitle {
                    font-size: 0.95rem;
                }

                .notice-title {
                    font-size: 1.1rem;
                }

                .notice-message {
                    font-size: 0.9rem;
                }

                .section-title {
                    font-size: 1.2rem;
                }

                .form-input,
                .form-select,
                .form-textarea {
                    padding: 0.875rem;
                    font-size: 0.95rem;
                }
            }

            /* Accessibility Enhancements */
            @media (prefers-reduced-motion: reduce) {
                .fallback-notice,
                .form-error-banner,
                .form-success-banner {
                    animation: none;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: none;
                }
            }

            /* Focus Visible for Keyboard Navigation */
            .form-input:focus-visible,
            .form-select:focus-visible,
            .form-textarea:focus-visible,
            .btn:focus-visible {
                outline: 3px solid #ffd700;
                outline-offset: 2px;
            }

            /* High Contrast Mode Support */
            @media (prefers-contrast: high) {
                .form-input,
                .form-select,
                .form-textarea {
                    border-width: 3px;
                }

                .fallback-notice,
                .form-error-banner,
                .form-success-banner {
                    border-width: 3px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    attachEventListeners() {
        const form = document.getElementById('maps-fallback-form');
        const streetAddress = document.getElementById('fallback-street-address');
        const city = document.getElementById('fallback-city');
        const state = document.getElementById('fallback-state');
        const zipCode = document.getElementById('fallback-zip');
        const squareFootage = document.getElementById('fallback-square-footage');

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        streetAddress?.addEventListener('blur', () => this.validateField('streetAddress', streetAddress.value));
        city?.addEventListener('blur', () => this.validateField('city', city.value));
        state?.addEventListener('change', () => this.validateField('state', state.value));
        zipCode?.addEventListener('blur', () => this.validateField('zipCode', zipCode.value));
        squareFootage?.addEventListener('blur', () => this.validateField('squareFootage', squareFootage.value));

        // ZIP code input formatting
        zipCode?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
        });

        // Square footage input validation
        squareFootage?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value && (value < 50 || value > 500000)) {
                this.showFieldError('squareFootage', 'Please enter a value between 50 and 500,000 sq ft');
            } else {
                this.clearFieldError('squareFootage');
            }
        });
    }

    validateField(fieldName, value) {
        const validations = {
            streetAddress: () => {
                if (!value || value.trim().length < 3) {
                    return 'Please enter a valid street address';
                }
                return null;
            },
            city: () => {
                if (!value || value.trim().length < 2) {
                    return 'Please enter a valid city name';
                }
                return null;
            },
            state: () => {
                if (!value || value === '') {
                    return 'Please select a state';
                }
                return null;
            },
            zipCode: () => {
                if (!value || !/^\d{5}$/.test(value)) {
                    return 'Please enter a valid 5-digit ZIP code';
                }
                return null;
            },
            squareFootage: () => {
                const num = parseInt(value);
                if (!num || isNaN(num)) {
                    return 'Please enter a square footage estimate';
                }
                if (num < 50) {
                    return 'Minimum area is 50 sq ft';
                }
                if (num > 500000) {
                    return 'Maximum area is 500,000 sq ft';
                }
                return null;
            }
        };

        const validator = validations[fieldName];
        if (!validator) return true;

        const error = validator();
        if (error) {
            this.showFieldError(fieldName, error);
            return false;
        } else {
            this.clearFieldError(fieldName);
            return true;
        }
    }

    showFieldError(fieldName, message) {
        const fieldMap = {
            streetAddress: 'fallback-street-address',
            city: 'fallback-city',
            state: 'fallback-state',
            zipCode: 'fallback-zip',
            squareFootage: 'fallback-square-footage'
        };

        const fieldId = fieldMap[fieldName];
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFieldError(fieldName) {
        const fieldMap = {
            streetAddress: 'fallback-street-address',
            city: 'fallback-city',
            state: 'fallback-state',
            zipCode: 'fallback-zip',
            squareFootage: 'fallback-square-footage'
        };

        const fieldId = fieldMap[fieldName];
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field) {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        }

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    handleSubmit() {
        const form = document.getElementById('maps-fallback-form');
        const formData = new FormData(form);

        // Validate all fields
        const fields = {
            streetAddress: formData.get('streetAddress'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            squareFootage: formData.get('squareFootage')
        };

        let isValid = true;
        for (const [fieldName, value] of Object.entries(fields)) {
            if (!this.validateField(fieldName, value)) {
                isValid = false;
            }
        }

        if (!isValid) {
            this.showFormError('Please correct the errors above before continuing.');
            return;
        }

        // Prepare measurement data in the same format as map-based measurement
        const measurementData = {
            source: 'manual',
            area: {
                sqft: parseFloat(fields.squareFootage),
                acres: parseFloat(fields.squareFootage) / 43560,
                sqm: parseFloat(fields.squareFootage) * 0.092903
            },
            address: {
                street: fields.streetAddress,
                city: fields.city,
                state: fields.state,
                zipCode: fields.zipCode,
                formatted: `${fields.streetAddress}, ${fields.city}, ${fields.state} ${fields.zipCode}`
            },
            projectDescription: formData.get('projectDescription') || '',
            timestamp: new Date().toISOString(),
            fallbackReason: this.options.errorType
        };

        // Store measurement data
        try {
            storeMeasurementData(measurementData);
            this.isValidated = true;

            // Call callback
            if (this.options.onDataSubmitted) {
                this.options.onDataSubmitted(measurementData);
            }

            // Show success message
            this.showSuccessMessage();
        } catch (error) {
            this.showFormError('Unable to save your information. Please try again.');
        }
    }

    showFormError(message) {
        const existingError = this.container.querySelector('.form-error-banner');
        if (existingError) {
            existingError.remove();
        }

        const form = document.getElementById('maps-fallback-form');
        const errorBanner = document.createElement('div');
        errorBanner.className = 'form-error-banner alert alert-danger';
        errorBanner.innerHTML = `
            <span class="error-icon">⚠️</span>
            <span>${message}</span>
        `;
        form.insertBefore(errorBanner, form.firstChild);

        // Scroll to error
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showSuccessMessage() {
        const submitBtn = document.getElementById('fallback-submit-btn');
        if (submitBtn) {
            submitBtn.textContent = '✓ Information Saved - Continue to Estimate Form';
            submitBtn.classList.add('btn-success');
            submitBtn.disabled = true;
        }

        // Show success banner
        const form = document.getElementById('maps-fallback-form');
        const successBanner = document.createElement('div');
        successBanner.className = 'form-success-banner alert alert-success';
        successBanner.innerHTML = `
            <span class="success-icon">✓</span>
            <span>Your project information has been saved. Please continue with the estimate form below.</span>
        `;
        form.insertBefore(successBanner, form.firstChild);
    }

    getErrorClass() {
        const errorClasses = {
            'QUOTA_EXCEEDED': 'notice-warning',
            'INVALID_KEY': 'notice-error',
            'TIMEOUT': 'notice-warning',
            'NETWORK_ERROR': 'notice-warning',
            'UNKNOWN_ERROR': 'notice-info'
        };
        return errorClasses[this.options.errorType] || 'notice-info';
    }

    getErrorIcon() {
        const icons = {
            'QUOTA_EXCEEDED': '⚠️',
            'INVALID_KEY': '🔧',
            'TIMEOUT': '⏱️',
            'NETWORK_ERROR': '📡',
            'UNKNOWN_ERROR': 'ℹ️'
        };
        return icons[this.options.errorType] || 'ℹ️';
    }

    getErrorTitle() {
        const titles = {
            'QUOTA_EXCEEDED': 'Maps Temporarily Unavailable',
            'INVALID_KEY': 'Maps Configuration Issue',
            'TIMEOUT': 'Maps Loading Timeout',
            'NETWORK_ERROR': 'Connection Issue',
            'UNKNOWN_ERROR': 'Maps Currently Unavailable'
        };
        return titles[this.options.errorType] || 'Maps Currently Unavailable';
    }

    getStateOptions() {
        const states = [
            { code: 'PA', name: 'Pennsylvania' },
            { code: 'NJ', name: 'New Jersey' },
            { code: 'DE', name: 'Delaware' },
            { code: 'MD', name: 'Maryland' },
            { code: 'NY', name: 'New York' },
            { code: 'AL', name: 'Alabama' },
            { code: 'AK', name: 'Alaska' },
            { code: 'AZ', name: 'Arizona' },
            { code: 'AR', name: 'Arkansas' },
            { code: 'CA', name: 'California' },
            { code: 'CO', name: 'Colorado' },
            { code: 'CT', name: 'Connecticut' },
            { code: 'FL', name: 'Florida' },
            { code: 'GA', name: 'Georgia' },
            { code: 'HI', name: 'Hawaii' },
            { code: 'ID', name: 'Idaho' },
            { code: 'IL', name: 'Illinois' },
            { code: 'IN', name: 'Indiana' },
            { code: 'IA', name: 'Iowa' },
            { code: 'KS', name: 'Kansas' },
            { code: 'KY', name: 'Kentucky' },
            { code: 'LA', name: 'Louisiana' },
            { code: 'ME', name: 'Maine' },
            { code: 'MA', name: 'Massachusetts' },
            { code: 'MI', name: 'Michigan' },
            { code: 'MN', name: 'Minnesota' },
            { code: 'MS', name: 'Mississippi' },
            { code: 'MO', name: 'Missouri' },
            { code: 'MT', name: 'Montana' },
            { code: 'NE', name: 'Nebraska' },
            { code: 'NV', name: 'Nevada' },
            { code: 'NH', name: 'New Hampshire' },
            { code: 'NM', name: 'New Mexico' },
            { code: 'NC', name: 'North Carolina' },
            { code: 'ND', name: 'North Dakota' },
            { code: 'OH', name: 'Ohio' },
            { code: 'OK', name: 'Oklahoma' },
            { code: 'OR', name: 'Oregon' },
            { code: 'RI', name: 'Rhode Island' },
            { code: 'SC', name: 'South Carolina' },
            { code: 'SD', name: 'South Dakota' },
            { code: 'TN', name: 'Tennessee' },
            { code: 'TX', name: 'Texas' },
            { code: 'UT', name: 'Utah' },
            { code: 'VT', name: 'Vermont' },
            { code: 'VA', name: 'Virginia' },
            { code: 'WA', name: 'Washington' },
            { code: 'WV', name: 'West Virginia' },
            { code: 'WI', name: 'Wisconsin' },
            { code: 'WY', name: 'Wyoming' }
        ];

        return states
            .map(state => `<option value="${state.code}">${state.name}</option>`)
            .join('');
    }

    /**
     * Get current form data
     */
    getFormData() {
        return this.formData;
    }

    /**
     * Check if form is validated
     */
    isFormValidated() {
        return this.isValidated;
    }

    /**
     * Reset the form
     */
    reset() {
        const form = document.getElementById('maps-fallback-form');
        if (form) {
            form.reset();
        }
        this.formData = {};
        this.isValidated = false;

        // Clear all errors
        ['streetAddress', 'city', 'state', 'zipCode', 'squareFootage'].forEach(field => {
            this.clearFieldError(field);
        });

        // Reset submit button
        const submitBtn = document.getElementById('fallback-submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Continue with Manual Entry';
            submitBtn.classList.remove('btn-success');
            submitBtn.disabled = false;
        }
    }
}
