/**
 * Confirmation Dialog System
 * Provides user-friendly confirmation dialogs with mobile support
 */

export class ConfirmationDialog {
    constructor(options = {}) {
        this.options = {
            enableMobileOptimization: true,
            enableAnimation: true,
            enableCustomButtons: true,
            autoFocus: true,
            closeOnEscape: true,
            closeOnOverlay: true,
            ...options
        };
        
        this.activeDialogs = [];
        this.dialogCounter = 0;
        
        this.init();
    }

    /**
     * Initialize confirmation dialog system
     */
    init() {
        this.setupKeyboardHandlers();
        this.addStyles();
    }

    /**
     * Setup keyboard event handlers
     */
    setupKeyboardHandlers() {
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeDialogs.length > 0) {
                    const topDialog = this.activeDialogs[this.activeDialogs.length - 1];
                    this.closeDialog(topDialog, false);
                }
            });
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(options = {}) {
        const dialogOptions = {
            title: 'Confirm Action',
            message: 'Are you sure you want to proceed?',
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'default', // default, danger, warning, info
            showIcon: true,
            enableHTML: false,
            customButtons: [],
            onConfirm: () => {},
            onCancel: () => {},
            onClose: () => {},
            ...options
        };

        return new Promise((resolve) => {
            const dialog = this.createDialog(dialogOptions);
            
            // Override callbacks to resolve promise
            dialogOptions.onConfirm = () => {
                options.onConfirm?.();
                resolve(true);
            };
            
            dialogOptions.onCancel = () => {
                options.onCancel?.();
                resolve(false);
            };
            
            dialogOptions.onClose = () => {
                options.onClose?.();
                resolve(false);
            };
            
            this.showDialog(dialog, dialogOptions);
        });
    }

    /**
     * Show area calculation confirmation
     */
    showAreaCalculationConfirmation(areaData) {
        const areaInSqFt = areaData.areaInSquareFeet?.toLocaleString() || '0';
        const areaInAcres = areaData.areaInAcres || '0';
        const perimeter = areaData.perimeter?.toLocaleString() || '0';
        
        return this.showConfirmation({
            title: 'Calculate Area',
            message: `
                <div class="area-confirmation-content">
                    <h4>Ready to calculate area for your boundary?</h4>
                    <div class="area-preview">
                        <div class="preview-item">
                            <span class="preview-label">Estimated Area:</span>
                            <span class="preview-value">${areaInSqFt} sq ft (${areaInAcres} acres)</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Perimeter:</span>
                            <span class="preview-value">${perimeter} ft</span>
                        </div>
                    </div>
                    <p class="area-note">
                        This will calculate precise measurements and save your boundary data.
                    </p>
                </div>
            `,
            confirmText: 'Calculate Area',
            cancelText: 'Cancel',
            type: 'info',
            enableHTML: true,
            showIcon: true
        });
    }

    /**
     * Show boundary submission confirmation
     */
    showBoundarySubmissionConfirmation(boundaryData) {
        const vertexCount = boundaryData.vertices?.length || 0;
        const area = boundaryData.areaInSquareFeet?.toLocaleString() || '0';
        
        return this.showConfirmation({
            title: 'Submit Boundary',
            message: `
                <div class="boundary-submission-content">
                    <h4>Ready to submit your boundary for processing?</h4>
                    <div class="boundary-summary">
                        <div class="summary-item">
                            <span class="summary-label">Points:</span>
                            <span class="summary-value">${vertexCount} vertices</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Area:</span>
                            <span class="summary-value">${area} sq ft</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Accuracy:</span>
                            <span class="summary-value">${boundaryData.imageryQuality || 'High'}</span>
                        </div>
                    </div>
                    <p class="submission-note">
                        This will submit your boundary data for estimate processing.
                    </p>
                </div>
            `,
            confirmText: 'Submit Boundary',
            cancelText: 'Review Again',
            type: 'default',
            enableHTML: true,
            showIcon: true
        });
    }

    /**
     * Show clear all confirmation
     */
    showClearAllConfirmation() {
        return this.showConfirmation({
            title: 'Clear All Drawings',
            message: 'This will remove all drawn shapes and calculated areas. This action cannot be undone.',
            confirmText: 'Clear All',
            cancelText: 'Keep Drawings',
            type: 'danger',
            showIcon: true
        });
    }

    /**
     * Show location access confirmation
     */
    showLocationAccessConfirmation() {
        return this.showConfirmation({
            title: 'Location Access',
            message: `
                <div class="location-access-content">
                    <h4>Enable location access?</h4>
                    <p>This will help us:</p>
                    <ul>
                        <li>Center the map on your location</li>
                        <li>Provide more accurate measurements</li>
                        <li>Find nearby reference points</li>
                    </ul>
                    <p class="privacy-note">
                        <strong>Privacy:</strong> Location data is only used for mapping and is not stored or shared.
                    </p>
                </div>
            `,
            confirmText: 'Allow Location',
            cancelText: 'Skip',
            type: 'info',
            enableHTML: true,
            showIcon: true
        });
    }

    /**
     * Show mobile tutorial confirmation
     */
    showMobileTutorialConfirmation() {
        return this.showConfirmation({
            title: 'Mobile Tutorial',
            message: `
                <div class="mobile-tutorial-content">
                    <h4>First time using boundary drawing?</h4>
                    <p>We've optimized the experience for mobile devices:</p>
                    <ul>
                        <li>Tap to add points</li>
                        <li>Double-tap to finish drawing</li>
                        <li>Pinch to zoom</li>
                        <li>Drag to pan the map</li>
                    </ul>
                    <p>Would you like a quick tutorial?</p>
                </div>
            `,
            confirmText: 'Show Tutorial',
            cancelText: 'Skip Tutorial',
            type: 'info',
            enableHTML: true,
            showIcon: true
        });
    }

    /**
     * Create dialog element
     */
    createDialog(options) {
        const dialogId = `dialog-${++this.dialogCounter}`;
        
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog-overlay';
        dialog.id = dialogId;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', `${dialogId}-title`);
        dialog.setAttribute('aria-describedby', `${dialogId}-message`);
        
        const iconHtml = options.showIcon ? `
            <div class="dialog-icon dialog-icon-${options.type}">
                ${this.getIconForType(options.type)}
            </div>
        ` : '';
        
        dialog.innerHTML = `
            <div class="confirmation-dialog dialog-type-${options.type}">
                <div class="dialog-header">
                    ${iconHtml}
                    <h3 id="${dialogId}-title" class="dialog-title">${options.title}</h3>
                    <button class="dialog-close" aria-label="Close dialog">&times;</button>
                </div>
                <div class="dialog-body">
                    <div id="${dialogId}-message" class="dialog-message">
                        ${options.enableHTML ? options.message : this.escapeHTML(options.message)}
                    </div>
                </div>
                <div class="dialog-footer">
                    ${this.createButtonsHTML(options)}
                </div>
            </div>
        `;
        
        this.setupDialogEvents(dialog, options);
        
        return dialog;
    }

    /**
     * Create buttons HTML
     */
    createButtonsHTML(options) {
        let buttonsHTML = '';
        
        // Custom buttons
        if (options.customButtons && options.customButtons.length > 0) {
            options.customButtons.forEach(button => {
                buttonsHTML += `
                    <button class="dialog-btn dialog-btn-${button.type || 'default'}" 
                            data-action="custom" 
                            data-custom-id="${button.id}">
                        ${button.text}
                    </button>
                `;
            });
        } else {
            // Default buttons
            buttonsHTML = `
                <button class="dialog-btn dialog-btn-secondary" data-action="cancel">
                    ${options.cancelText}
                </button>
                <button class="dialog-btn dialog-btn-primary dialog-btn-${options.type}" 
                        data-action="confirm">
                    ${options.confirmText}
                </button>
            `;
        }
        
        return buttonsHTML;
    }

    /**
     * Setup dialog event listeners
     */
    setupDialogEvents(dialog, options) {
        // Close button
        const closeBtn = dialog.querySelector('.dialog-close');
        closeBtn.addEventListener('click', () => {
            this.closeDialog(dialog, false);
            options.onClose();
        });
        
        // Action buttons
        const actionButtons = dialog.querySelectorAll('.dialog-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                if (action === 'confirm') {
                    this.closeDialog(dialog, true);
                    options.onConfirm();
                } else if (action === 'cancel') {
                    this.closeDialog(dialog, false);
                    options.onCancel();
                } else if (action === 'custom') {
                    const customId = e.target.dataset.customId;
                    const customButton = options.customButtons.find(btn => btn.id === customId);
                    if (customButton && customButton.onClick) {
                        customButton.onClick();
                    }
                    this.closeDialog(dialog, false);
                }
            });
        });
        
        // Overlay click
        if (this.options.closeOnOverlay) {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    this.closeDialog(dialog, false);
                    options.onClose();
                }
            });
        }
        
        // Touch handling for mobile
        if (this.options.enableMobileOptimization && this.isMobile()) {
            this.setupMobileGestures(dialog, options);
        }
    }

    /**
     * Setup mobile gesture handling
     */
    setupMobileGestures(dialog, options) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const dialogElement = dialog.querySelector('.confirmation-dialog');
        
        dialogElement.addEventListener('touchstart', (e) => {
            if (e.target.closest('.dialog-btn') || e.target.closest('.dialog-close')) {
                return; // Don't interfere with button touches
            }
            
            startY = e.touches[0].clientY;
            isDragging = true;
            dialogElement.style.transition = 'none';
        });
        
        dialogElement.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Only allow downward swipe
            if (deltaY > 0) {
                dialogElement.style.transform = `translateY(${deltaY}px)`;
                dialogElement.style.opacity = Math.max(0.3, 1 - (deltaY / 300));
            }
        });
        
        dialogElement.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            dialogElement.style.transition = 'all 0.3s ease';
            
            const deltaY = currentY - startY;
            
            // If dragged down significantly, close dialog
            if (deltaY > 100) {
                this.closeDialog(dialog, false);
                options.onClose();
            } else {
                // Snap back to original position
                dialogElement.style.transform = 'translateY(0)';
                dialogElement.style.opacity = '1';
            }
        });
    }

    /**
     * Show dialog
     */
    showDialog(dialog, options) {
        document.body.appendChild(dialog);
        this.activeDialogs.push(dialog);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate in
        if (this.options.enableAnimation) {
            requestAnimationFrame(() => {
                dialog.classList.add('dialog-show');
            });
        }
        
        // Auto-focus confirm button
        if (this.options.autoFocus) {
            setTimeout(() => {
                const confirmBtn = dialog.querySelector('[data-action="confirm"]');
                if (confirmBtn) {
                    confirmBtn.focus();
                }
            }, 100);
        }
        
        // Add mobile class if needed
        if (this.isMobile()) {
            dialog.classList.add('dialog-mobile');
        }
    }

    /**
     * Close dialog
     */
    closeDialog(dialog, confirmed) {
        if (!dialog || !dialog.parentNode) return;
        
        // Remove from active dialogs
        const index = this.activeDialogs.indexOf(dialog);
        if (index > -1) {
            this.activeDialogs.splice(index, 1);
        }
        
        // Restore body scroll if no more dialogs
        if (this.activeDialogs.length === 0) {
            document.body.style.overflow = '';
        }
        
        // Animate out
        if (this.options.enableAnimation) {
            dialog.classList.remove('dialog-show');
            dialog.classList.add('dialog-hide');
            
            setTimeout(() => {
                if (dialog.parentNode) {
                    dialog.parentNode.removeChild(dialog);
                }
            }, 300);
        } else {
            dialog.parentNode.removeChild(dialog);
        }
    }

    /**
     * Get icon for dialog type
     */
    getIconForType(type) {
        const icons = {
            default: '❓',
            danger: '⚠️',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        
        return icons[type] || icons.default;
    }

    /**
     * Escape HTML
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Add styles
     */
    addStyles() {
        if (document.getElementById('confirmation-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'confirmation-dialog-styles';
        style.textContent = `
            .confirmation-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .confirmation-dialog-overlay.dialog-show {
                opacity: 1;
            }
            
            .confirmation-dialog-overlay.dialog-hide {
                opacity: 0;
            }
            
            .confirmation-dialog {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: translateY(50px);
                transition: all 0.3s ease;
            }
            
            .dialog-show .confirmation-dialog {
                transform: translateY(0);
            }
            
            .dialog-hide .confirmation-dialog {
                transform: translateY(50px);
            }
            
            .dialog-header {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 24px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .dialog-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .dialog-icon-danger {
                color: #dc2626;
            }
            
            .dialog-icon-warning {
                color: #f59e0b;
            }
            
            .dialog-icon-info {
                color: #3b82f6;
            }
            
            .dialog-icon-success {
                color: #10b981;
            }
            
            .dialog-title {
                flex: 1;
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
            }
            
            .dialog-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            
            .dialog-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .dialog-body {
                padding: 24px;
            }
            
            .dialog-message {
                color: #4b5563;
                line-height: 1.6;
                font-size: 1rem;
            }
            
            .dialog-footer {
                display: flex;
                gap: 12px;
                padding: 24px;
                border-top: 1px solid #e5e7eb;
                justify-content: flex-end;
            }
            
            .dialog-btn {
                padding: 12px 24px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.2s;
                min-width: 80px;
            }
            
            .dialog-btn-primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .dialog-btn-primary:hover {
                background: #2563eb;
                border-color: #2563eb;
            }
            
            .dialog-btn-danger {
                background: #dc2626;
                color: white;
                border-color: #dc2626;
            }
            
            .dialog-btn-danger:hover {
                background: #b91c1c;
                border-color: #b91c1c;
            }
            
            .dialog-btn-warning {
                background: #f59e0b;
                color: white;
                border-color: #f59e0b;
            }
            
            .dialog-btn-warning:hover {
                background: #d97706;
                border-color: #d97706;
            }
            
            .dialog-btn-secondary {
                background: white;
                color: #374151;
                border-color: #d1d5db;
            }
            
            .dialog-btn-secondary:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }
            
            /* Content-specific styles */
            .area-confirmation-content h4,
            .boundary-submission-content h4,
            .location-access-content h4,
            .mobile-tutorial-content h4 {
                margin: 0 0 16px 0;
                color: #1f2937;
                font-size: 1.125rem;
            }
            
            .area-preview,
            .boundary-summary {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
            }
            
            .preview-item,
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .preview-item:last-child,
            .summary-item:last-child {
                border-bottom: none;
            }
            
            .preview-label,
            .summary-label {
                font-weight: 500;
                color: #4b5563;
            }
            
            .preview-value,
            .summary-value {
                color: #1f2937;
                font-weight: 600;
            }
            
            .area-note,
            .submission-note,
            .privacy-note {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 16px 0 0 0;
            }
            
            .privacy-note {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 6px;
                padding: 12px;
            }
            
            .location-access-content ul,
            .mobile-tutorial-content ul {
                margin: 16px 0;
                padding-left: 20px;
                color: #4b5563;
            }
            
            .location-access-content li,
            .mobile-tutorial-content li {
                margin: 8px 0;
            }
            
            /* Mobile styles */
            @media (max-width: 768px) {
                .confirmation-dialog {
                    width: 95%;
                    margin: 20px;
                    max-height: 90vh;
                }
                
                .dialog-header {
                    padding: 20px;
                    gap: 12px;
                }
                
                .dialog-icon {
                    font-size: 1.75rem;
                }
                
                .dialog-title {
                    font-size: 1.125rem;
                }
                
                .dialog-body {
                    padding: 20px;
                }
                
                .dialog-footer {
                    padding: 20px;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .dialog-btn {
                    width: 100%;
                    justify-content: center;
                    padding: 16px 24px;
                    font-size: 1rem;
                }
                
                .preview-item,
                .summary-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
                
                .preview-value,
                .summary-value {
                    font-size: 0.875rem;
                }
            }
            
            /* Mobile gesture feedback */
            .dialog-mobile .confirmation-dialog {
                position: relative;
            }
            
            .dialog-mobile .dialog-header::before {
                content: '';
                position: absolute;
                top: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 4px;
                background: #d1d5db;
                border-radius: 2px;
            }
            
            .dialog-mobile .dialog-header {
                padding-top: 32px;
            }
            
            /* Accessibility */
            .dialog-btn:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            .dialog-close:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            /* Animations */
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .dialog-mobile.dialog-show .confirmation-dialog {
                animation: slideInUp 0.3s ease;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Close all dialogs
     */
    closeAllDialogs() {
        [...this.activeDialogs].forEach(dialog => {
            this.closeDialog(dialog, false);
        });
    }

    /**
     * Get active dialog count
     */
    getActiveDialogCount() {
        return this.activeDialogs.length;
    }

    /**
     * Destroy confirmation dialog system
     */
    destroy() {
        this.closeAllDialogs();
        
        const styles = document.getElementById('confirmation-dialog-styles');
        if (styles) {
            styles.remove();
        }
    }
}
