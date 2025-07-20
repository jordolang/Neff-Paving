/**
 * Error Handler and Validation System
 * Provides comprehensive error handling with user-friendly messages
 */

export class ErrorHandler {
    constructor(options = {}) {
        this.options = {
            enableToasts: true,
            enableModal: true,
            enableConsoleLogging: true,
            toastDuration: 5000,
            maxToasts: 3,
            enableAnalytics: true,
            ...options
        };
        
        this.toastContainer = null;
        this.activeToasts = [];
        this.errorCounts = {};
        this.lastErrors = [];
        
        this.init();
    }

    /**
     * Initialize error handler
     */
    init() {
        this.createToastContainer();
        this.setupGlobalErrorHandler();
        this.addStyles();
    }

    /**
     * Create toast container
     */
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'error-toast-container';
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Setup global error handler
     */
    setupGlobalErrorHandler() {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError('javascript', event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('promise', 'Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }

    /**
     * Handle different types of errors
     */
    handleError(type, message, details = {}) {
        const error = {
            id: this.generateErrorId(),
            type: type,
            message: message,
            details: details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logError(error);
        this.showUserFriendlyError(error);
        this.trackError(error);
        this.storeError(error);
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return 'err_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Log error to console
     */
    logError(error) {
        if (this.options.enableConsoleLogging) {
            console.group(`🚨 Error [${error.type}] - ${error.id}`);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Timestamp:', error.timestamp);
            console.groupEnd();
        }
    }

    /**
     * Show user-friendly error message
     */
    showUserFriendlyError(error) {
        const userMessage = this.getUserFriendlyMessage(error);
        
        if (this.options.enableToasts) {
            this.showToast(userMessage, error.type);
        }
        
        // Show modal for critical errors
        if (this.shouldShowModal(error)) {
            this.showErrorModal(error, userMessage);
        }
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error) {
        const errorMessages = {
            // Network errors
            'network': {
                'Failed to fetch': 'Unable to connect to server. Please check your internet connection.',
                'Network request failed': 'Connection problem. Please try again.',
                'ERR_NETWORK': 'Network error. Please check your connection and try again.',
                'ERR_INTERNET_DISCONNECTED': 'Internet connection lost. Please reconnect and try again.'
            },
            
            // API errors
            'api': {
                '400': 'Invalid request. Please check your input and try again.',
                '401': 'Authentication required. Please log in and try again.',
                '403': 'Access denied. You don\'t have permission to perform this action.',
                '404': 'Requested resource not found.',
                '500': 'Server error. Please try again later.',
                '503': 'Service temporarily unavailable. Please try again later.'
            },
            
            // Map errors
            'map': {
                'GOOGLE_MAPS_API_KEY_MISSING': 'Map configuration error. Please refresh the page.',
                'GOOGLE_MAPS_LOADING_ERROR': 'Unable to load maps. Please check your connection.',
                'GEOCODING_ERROR': 'Unable to find location. Please try a different address.',
                'DIRECTIONS_ERROR': 'Unable to calculate directions. Please try again.'
            },
            
            // Drawing errors
            'drawing': {
                'INSUFFICIENT_POINTS': 'Please add at least 3 points to create a shape.',
                'INVALID_SHAPE': 'Invalid shape detected. Please redraw your boundary.',
                'SHAPE_TOO_COMPLEX': 'Shape is too complex. Please simplify and try again.',
                'CALCULATION_ERROR': 'Unable to calculate area. Please check your shape and try again.'
            },
            
            // Validation errors
            'validation': {
                'REQUIRED_FIELD': 'This field is required.',
                'INVALID_EMAIL': 'Please enter a valid email address.',
                'INVALID_PHONE': 'Please enter a valid phone number.',
                'INVALID_ADDRESS': 'Please enter a valid address.',
                'INVALID_COORDINATES': 'Invalid coordinates. Please check your input.'
            },
            
            // File errors
            'file': {
                'FILE_TOO_LARGE': 'File is too large. Please choose a smaller file.',
                'INVALID_FILE_TYPE': 'Invalid file type. Please choose a supported file.',
                'UPLOAD_ERROR': 'Unable to upload file. Please try again.',
                'CORRUPTED_FILE': 'File appears to be corrupted. Please try another file.'
            },
            
            // Permission errors
            'permission': {
                'GEOLOCATION_DENIED': 'Location access denied. Please enable location services.',
                'CAMERA_DENIED': 'Camera access denied. Please enable camera permissions.',
                'MICROPHONE_DENIED': 'Microphone access denied. Please enable microphone permissions.'
            }
        };

        // Try to find specific message
        const typeMessages = errorMessages[error.type] || {};
        const specificMessage = typeMessages[error.message] || 
                               typeMessages[error.details.code] || 
                               typeMessages[error.details.status];

        if (specificMessage) {
            return specificMessage;
        }

        // Fallback to generic messages
        const genericMessages = {
            'network': 'Network connection problem. Please try again.',
            'api': 'Server error. Please try again later.',
            'map': 'Map error. Please refresh the page.',
            'drawing': 'Drawing error. Please try again.',
            'validation': 'Please check your input and try again.',
            'file': 'File error. Please try again.',
            'permission': 'Permission required. Please check your browser settings.',
            'javascript': 'Application error. Please refresh the page.',
            'promise': 'Application error. Please try again.'
        };

        return genericMessages[error.type] || 'An unexpected error occurred. Please try again.';
    }

    /**
     * Show error toast
     */
    showToast(message, type = 'error') {
        // Remove oldest toast if limit reached
        if (this.activeToasts.length >= this.options.maxToasts) {
            this.removeToast(this.activeToasts[0]);
        }

        const toast = document.createElement('div');
        toast.className = `error-toast error-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${this.getToastIcon(type)}</div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" aria-label="Close">&times;</button>
            </div>
        `;

        // Add event listeners
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto-remove after duration
        const autoRemoveTimer = setTimeout(() => {
            this.removeToast(toast);
        }, this.options.toastDuration);

        toast.autoRemoveTimer = autoRemoveTimer;

        // Add to container and track
        this.toastContainer.appendChild(toast);
        this.activeToasts.push(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });
    }

    /**
     * Remove toast
     */
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        // Clear auto-remove timer
        if (toast.autoRemoveTimer) {
            clearTimeout(toast.autoRemoveTimer);
        }

        // Animate out
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);

        // Remove from tracking
        const index = this.activeToasts.indexOf(toast);
        if (index > -1) {
            this.activeToasts.splice(index, 1);
        }
    }

    /**
     * Get toast icon
     */
    getToastIcon(type) {
        const icons = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'success': '✅'
        };
        return icons[type] || '❌';
    }

    /**
     * Show error modal for critical errors
     */
    showErrorModal(error, userMessage) {
        const modal = document.createElement('div');
        modal.className = 'error-modal-overlay';
        modal.innerHTML = `
            <div class="error-modal">
                <div class="modal-header">
                    <h3>❌ Error</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="error-message">${userMessage}</p>
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <div class="details-content">
                            <p><strong>Error ID:</strong> ${error.id}</p>
                            <p><strong>Type:</strong> ${error.type}</p>
                            <p><strong>Message:</strong> ${error.message}</p>
                            <p><strong>Time:</strong> ${new Date(error.timestamp).toLocaleString()}</p>
                            ${error.details ? `<p><strong>Details:</strong> ${JSON.stringify(error.details, null, 2)}</p>` : ''}
                        </div>
                    </details>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                    <button class="btn btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Determine if error should show modal
     */
    shouldShowModal(error) {
        const criticalTypes = ['javascript', 'promise'];
        const criticalMessages = ['GOOGLE_MAPS_API_KEY_MISSING', 'GOOGLE_MAPS_LOADING_ERROR'];
        
        return criticalTypes.includes(error.type) || 
               criticalMessages.includes(error.message) ||
               criticalMessages.includes(error.details.code);
    }

    /**
     * Track error for analytics
     */
    trackError(error) {
        if (!this.options.enableAnalytics) return;

        // Track with Google Analytics if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message,
                fatal: this.shouldShowModal(error)
            });
        }

        // Track with custom analytics
        if (window.analytics) {
            window.analytics.track('Error Occurred', {
                errorId: error.id,
                errorType: error.type,
                errorMessage: error.message,
                timestamp: error.timestamp,
                userAgent: error.userAgent,
                url: error.url
            });
        }

        // Update error counts
        this.errorCounts[error.type] = (this.errorCounts[error.type] || 0) + 1;
    }

    /**
     * Store error for debugging
     */
    storeError(error) {
        this.lastErrors.push(error);
        
        // Keep only last 50 errors
        if (this.lastErrors.length > 50) {
            this.lastErrors.shift();
        }

        // Store in localStorage for debugging
        try {
            localStorage.setItem('app_errors', JSON.stringify(this.lastErrors));
        } catch (e) {
            console.warn('Unable to store errors in localStorage');
        }
    }

    /**
     * Validate boundary shape
     */
    validateBoundary(vertices) {
        const errors = [];

        if (!vertices || vertices.length < 3) {
            errors.push({
                type: 'validation',
                message: 'INSUFFICIENT_POINTS',
                details: { vertexCount: vertices?.length || 0 }
            });
        }

        if (vertices && vertices.length > 1000) {
            errors.push({
                type: 'validation',
                message: 'SHAPE_TOO_COMPLEX',
                details: { vertexCount: vertices.length }
            });
        }

        if (vertices && vertices.length >= 3) {
            const area = this.calculatePolygonArea(vertices);
            if (area < 1) {
                errors.push({
                    type: 'validation',
                    message: 'SHAPE_TOO_SMALL',
                    details: { area: area }
                });
            }
        }

        return errors;
    }

    /**
     * Calculate polygon area (simple method)
     */
    calculatePolygonArea(vertices) {
        if (vertices.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < vertices.length; i++) {
            const j = (i + 1) % vertices.length;
            area += vertices[i].lat * vertices[j].lng;
            area -= vertices[j].lat * vertices[i].lng;
        }
        return Math.abs(area) / 2;
    }

    /**
     * Validate form input
     */
    validateInput(value, type, options = {}) {
        const errors = [];

        if (options.required && (!value || value.toString().trim() === '')) {
            errors.push({
                type: 'validation',
                message: 'REQUIRED_FIELD',
                details: { field: options.fieldName || 'field' }
            });
            return errors;
        }

        if (!value) return errors;

        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors.push({
                        type: 'validation',
                        message: 'INVALID_EMAIL',
                        details: { value: value }
                    });
                }
                break;

            case 'phone':
                const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
                if (!phoneRegex.test(value)) {
                    errors.push({
                        type: 'validation',
                        message: 'INVALID_PHONE',
                        details: { value: value }
                    });
                }
                break;

            case 'coordinates':
                const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
                if (!coordRegex.test(value)) {
                    errors.push({
                        type: 'validation',
                        message: 'INVALID_COORDINATES',
                        details: { value: value }
                    });
                }
                break;

            case 'number':
                if (isNaN(value) || value < (options.min || 0)) {
                    errors.push({
                        type: 'validation',
                        message: 'INVALID_NUMBER',
                        details: { value: value, min: options.min }
                    });
                }
                break;
        }

        return errors;
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors, container) {
        if (!errors || errors.length === 0) return;

        // Clear existing errors
        const existingErrors = container.querySelectorAll('.validation-error');
        existingErrors.forEach(error => error.remove());

        // Show new errors
        errors.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.className = 'validation-error';
            errorElement.textContent = this.getUserFriendlyMessage(error);
            container.appendChild(errorElement);
        });
    }

    /**
     * Clear validation errors
     */
    clearValidationErrors(container) {
        const errors = container.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());
    }

    /**
     * Handle API response errors
     */
    handleApiError(response, context = 'API') {
        const error = {
            type: 'api',
            message: `${context} Error`,
            details: {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            }
        };

        this.handleError(error.type, error.message, error.details);
    }

    /**
     * Handle network errors
     */
    handleNetworkError(error, context = 'Network') {
        this.handleError('network', error.message, {
            context: context,
            name: error.name,
            code: error.code
        });
    }

    /**
     * Handle file errors
     */
    handleFileError(file, errorType) {
        const error = {
            type: 'file',
            message: errorType,
            details: {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            }
        };

        this.handleError(error.type, error.message, error.details);
    }

    /**
     * Get error statistics
     */
    getErrorStatistics() {
        return {
            totalErrors: this.lastErrors.length,
            errorCounts: { ...this.errorCounts },
            recentErrors: this.lastErrors.slice(-10),
            lastError: this.lastErrors[this.lastErrors.length - 1]
        };
    }

    /**
     * Add styles
     */
    addStyles() {
        if (document.getElementById('error-handler-styles')) return;

        const style = document.createElement('style');
        style.id = 'error-handler-styles';
        style.textContent = `
            .error-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }

            .error-toast {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                border-left: 4px solid #dc2626;
            }

            .error-toast.error-toast-warning {
                border-left-color: #f59e0b;
            }

            .error-toast.error-toast-info {
                border-left-color: #3b82f6;
            }

            .error-toast.error-toast-success {
                border-left-color: #10b981;
            }

            .error-toast.toast-show {
                opacity: 1;
                transform: translateX(0);
            }

            .error-toast.toast-hide {
                opacity: 0;
                transform: translateX(100%);
            }

            .toast-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
            }

            .toast-icon {
                font-size: 1.25rem;
                flex-shrink: 0;
            }

            .toast-message {
                flex: 1;
                color: #374151;
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .toast-close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 1.25rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .error-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                animation: fadeIn 0.3s ease;
            }

            .error-modal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
            }

            .modal-header h3 {
                margin: 0;
                color: #dc2626;
                font-size: 1.25rem;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .modal-body {
                padding: 20px;
            }

            .error-message {
                color: #374151;
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 20px;
            }

            .error-details {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 16px;
            }

            .error-details summary {
                cursor: pointer;
                font-weight: 600;
                color: #4b5563;
                margin-bottom: 12px;
            }

            .details-content {
                margin-top: 12px;
                font-family: monospace;
                font-size: 0.875rem;
                color: #6b7280;
            }

            .details-content p {
                margin: 8px 0;
            }

            .modal-footer {
                display: flex;
                gap: 12px;
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                justify-content: flex-end;
            }

            .btn {
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .btn-primary:hover {
                background: #2563eb;
                border-color: #2563eb;
            }

            .btn-secondary {
                background: white;
                color: #374151;
            }

            .btn-secondary:hover {
                background: #f9fafb;
            }

            .validation-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: 8px 12px;
                margin-top: 8px;
                color: #dc2626;
                font-size: 0.875rem;
            }

            /* Mobile styles */
            @media (max-width: 768px) {
                .error-toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .error-modal {
                    width: 95%;
                    margin: 10px;
                }

                .modal-header,
                .modal-body,
                .modal-footer {
                    padding: 15px;
                }

                .modal-footer {
                    flex-direction: column;
                }

                .btn {
                    width: 100%;
                }
            }

            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        this.activeToasts.forEach(toast => this.removeToast(toast));
        this.activeToasts = [];
    }

    /**
     * Destroy error handler
     */
    destroy() {
        this.clearAllErrors();
        
        if (this.toastContainer && this.toastContainer.parentNode) {
            this.toastContainer.parentNode.removeChild(this.toastContainer);
        }
        
        const styles = document.getElementById('error-handler-styles');
        if (styles) {
            styles.remove();
        }
    }
}
