/**
 * Interactive Tutorial System
 * Provides guided walkthrough for first-time users
 */

export class TutorialSystem {
    constructor(options = {}) {
        this.options = {
            enableAutoStart: true,
            skipOnMobile: false,
            showProgress: true,
            enableSkip: true,
            storage: 'localStorage',
            ...options
        };
        
        this.currentStep = 0;
        this.isActive = false;
        this.tutorialSteps = this.defineTutorialSteps();
        this.overlay = null;
        this.tooltip = null;
        this.progressBar = null;
        
        this.init();
    }

    /**
     * Initialize tutorial system
     */
    init() {
        this.createTutorialElements();
        this.setupEventListeners();
        
        // Auto-start tutorial for new users
        if (this.options.enableAutoStart && this.isFirstTime()) {
            setTimeout(() => this.startTutorial(), 1000);
        }
    }

    /**
     * Define tutorial steps
     */
    defineTutorialSteps() {
        return [
            {
                target: '.search-section',
                title: 'Welcome to Boundary Drawing!',
                content: 'Let\'s start by finding your location. Enter an address or coordinates in the search box.',
                position: 'bottom',
                action: 'highlight',
                mobile: {
                    title: 'Welcome!',
                    content: 'Tap here to search for your location.'
                }
            },
            {
                target: '.area-finder-map',
                title: 'Interactive Map',
                content: 'This is your drawing canvas. You can zoom, pan, and draw shapes here.',
                position: 'top',
                action: 'circle',
                mobile: {
                    content: 'Pinch to zoom, drag to pan, and tap to draw.'
                }
            },
            {
                target: '.drawing-controls',
                title: 'Drawing Tools',
                content: 'Use these buttons to control your drawing. Clear removes all shapes, Calculate computes the area.',
                position: 'bottom',
                action: 'highlight'
            },
            {
                target: '.map-instructions',
                title: 'Drawing Instructions',
                content: 'Follow these steps to draw your boundary. Click points to create a shape.',
                position: 'left',
                action: 'highlight',
                mobile: {
                    content: 'Tap points to create your boundary shape.'
                }
            },
            {
                target: '#toggle-visual-controls',
                title: 'Visual Controls',
                content: 'Click here for advanced mapping options like satellite imagery and measurement units.',
                position: 'bottom',
                action: 'pulse',
                mobile: {
                    content: 'Tap for advanced options.'
                }
            },
            {
                target: '.area-results',
                title: 'Results Display',
                content: 'Your area calculations will appear here with multiple units and accuracy information.',
                position: 'top',
                action: 'highlight',
                condition: () => document.querySelector('.area-results').style.display !== 'none'
            },
            {
                target: null,
                title: 'You\'re Ready!',
                content: 'That\'s it! Start drawing your boundary by clicking on the map. Need help? Look for the ? icon.',
                position: 'center',
                action: 'celebration',
                mobile: {
                    content: 'Start drawing by tapping the map!'
                }
            }
        ];
    }

    /**
     * Create tutorial UI elements
     */
    createTutorialElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-highlight"></div>
        `;

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        this.tooltip.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h3 class="tutorial-title"></h3>
                    <button class="tutorial-close" aria-label="Close tutorial">&times;</button>
                </div>
                <div class="tutorial-body"></div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">Step 1 of 7</span>
                    </div>
                    <div class="tutorial-actions">
                        <button class="tutorial-skip">Skip Tutorial</button>
                        <button class="tutorial-prev">Previous</button>
                        <button class="tutorial-next">Next</button>
                    </div>
                </div>
            </div>
        `;

        // Create help trigger
        this.createHelpTrigger();

        this.addStyles();
    }

    /**
     * Create help trigger button
     */
    createHelpTrigger() {
        const helpButton = document.createElement('button');
        helpButton.className = 'tutorial-help-trigger';
        helpButton.innerHTML = '?';
        helpButton.title = 'Show Tutorial';
        helpButton.addEventListener('click', () => this.startTutorial());
        
        // Add to drawing controls
        const drawingControls = document.querySelector('.drawing-controls');
        if (drawingControls) {
            drawingControls.appendChild(helpButton);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tutorial navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tutorial-next')) {
                this.nextStep();
            } else if (e.target.classList.contains('tutorial-prev')) {
                this.prevStep();
            } else if (e.target.classList.contains('tutorial-skip') || 
                       e.target.classList.contains('tutorial-close')) {
                this.endTutorial();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            switch(e.key) {
                case 'Escape':
                    this.endTutorial();
                    break;
                case 'ArrowRight':
                case 'Enter':
                    this.nextStep();
                    break;
                case 'ArrowLeft':
                    this.prevStep();
                    break;
            }
        });

        // Mobile touch handling
        if (this.isMobile()) {
            this.setupMobileGestures();
        }
    }

    /**
     * Setup mobile gesture handling
     */
    setupMobileGestures() {
        let startX = 0;
        
        this.tooltip.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.tooltip.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextStep(); // Swipe left = next
                } else {
                    this.prevStep(); // Swipe right = previous
                }
            }
        });
    }

    /**
     * Start tutorial
     */
    startTutorial() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        
        this.showStep(0);
        this.trackEvent('tutorial_started');
    }

    /**
     * Show specific step
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) return;
        
        const step = this.tutorialSteps[stepIndex];
        
        // Check step condition
        if (step.condition && !step.condition()) {
            this.nextStep();
            return;
        }
        
        this.currentStep = stepIndex;
        
        // Update progress
        this.updateProgress();
        
        // Position tooltip
        this.positionTooltip(step);
        
        // Update content
        this.updateTooltipContent(step);
        
        // Highlight target
        this.highlightTarget(step);
        
        // Update navigation buttons
        this.updateNavigation();
        
        this.trackEvent('tutorial_step_viewed', { step: stepIndex });
    }

    /**
     * Position tooltip relative to target
     */
    positionTooltip(step) {
        const tooltip = this.tooltip;
        const isMobile = this.isMobile();
        
        if (!step.target || step.position === 'center') {
            // Center the tooltip
            tooltip.style.position = 'fixed';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        const target = document.querySelector(step.target);
        if (!target) {
            console.warn('Tutorial target not found:', step.target);
            return;
        }
        
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        if (isMobile) {
            // Mobile: Always position at bottom of screen
            tooltip.style.position = 'fixed';
            tooltip.style.bottom = '20px';
            tooltip.style.left = '20px';
            tooltip.style.right = '20px';
            tooltip.style.transform = 'none';
            return;
        }
        
        // Desktop positioning
        switch(step.position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 20;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + 20;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 20;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 20;
                break;
            default:
                top = targetRect.bottom + 20;
                left = targetRect.left;
        }
        
        // Keep tooltip within viewport
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewport.width - 10) {
            left = viewport.width - tooltipRect.width - 10;
        }
        if (top < 10) top = 10;
        if (top + tooltipRect.height > viewport.height - 10) {
            top = viewport.height - tooltipRect.height - 10;
        }
        
        tooltip.style.position = 'fixed';
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        tooltip.style.transform = 'none';
    }

    /**
     * Update tooltip content
     */
    updateTooltipContent(step) {
        const isMobile = this.isMobile();
        const content = isMobile && step.mobile ? step.mobile : step;
        
        const title = this.tooltip.querySelector('.tutorial-title');
        const body = this.tooltip.querySelector('.tutorial-body');
        
        title.textContent = content.title || step.title;
        body.textContent = content.content || step.content;
        
        // Add action-specific styling
        this.tooltip.className = `tutorial-tooltip tutorial-${step.action || 'default'}`;
    }

    /**
     * Highlight target element
     */
    highlightTarget(step) {
        const highlight = this.overlay.querySelector('.tutorial-highlight');
        
        if (!step.target) {
            highlight.style.display = 'none';
            return;
        }
        
        const target = document.querySelector(step.target);
        if (!target) {
            highlight.style.display = 'none';
            return;
        }
        
        const rect = target.getBoundingClientRect();
        const padding = 10;
        
        highlight.style.display = 'block';
        highlight.style.top = (rect.top - padding) + 'px';
        highlight.style.left = (rect.left - padding) + 'px';
        highlight.style.width = (rect.width + padding * 2) + 'px';
        highlight.style.height = (rect.height + padding * 2) + 'px';
        
        // Apply action-specific effects
        highlight.className = `tutorial-highlight tutorial-${step.action || 'default'}`;
        
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const progressFill = this.tooltip.querySelector('.progress-fill');
        const progressText = this.tooltip.querySelector('.progress-text');
        
        if (this.options.showProgress) {
            const progress = ((this.currentStep + 1) / this.tutorialSteps.length) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.tutorialSteps.length}`;
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const prevBtn = this.tooltip.querySelector('.tutorial-prev');
        const nextBtn = this.tooltip.querySelector('.tutorial-next');
        
        prevBtn.disabled = this.currentStep === 0;
        
        if (this.currentStep === this.tutorialSteps.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.endTutorial();
        }
    }

    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * End tutorial
     */
    endTutorial() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        this.markAsCompleted();
        this.trackEvent('tutorial_completed', { steps_completed: this.currentStep + 1 });
    }

    /**
     * Check if this is first time user
     */
    isFirstTime() {
        if (this.options.storage === 'localStorage') {
            return !localStorage.getItem('tutorial_completed');
        }
        return !sessionStorage.getItem('tutorial_completed');
    }

    /**
     * Mark tutorial as completed
     */
    markAsCompleted() {
        if (this.options.storage === 'localStorage') {
            localStorage.setItem('tutorial_completed', 'true');
        } else {
            sessionStorage.setItem('tutorial_completed', 'true');
        }
    }

    /**
     * Check if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Track tutorial events
     */
    trackEvent(eventName, data = {}) {
        if (window.gtag) {
            window.gtag('event', eventName, data);
        }
        console.log('Tutorial event:', eventName, data);
    }

    /**
     * Add tutorial styles
     */
    addStyles() {
        if (document.getElementById('tutorial-styles')) return;

        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointer-events: none;
            }

            .tutorial-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                animation: fadeIn 0.3s ease;
            }

            .tutorial-highlight {
                position: absolute;
                border: 3px solid #3b82f6;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
                background: rgba(255, 255, 255, 0.1);
                pointer-events: none;
                z-index: 10000;
            }

            .tutorial-highlight.tutorial-pulse {
                animation: pulse 2s infinite;
            }

            .tutorial-highlight.tutorial-circle {
                border-radius: 50%;
            }

            .tutorial-tooltip {
                position: fixed;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                max-width: 400px;
                min-width: 300px;
                z-index: 10001;
                pointer-events: auto;
                animation: slideIn 0.3s ease;
            }

            .tutorial-tooltip.tutorial-celebration {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .tutorial-content {
                padding: 20px;
            }

            .tutorial-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .tutorial-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
            }

            .tutorial-celebration .tutorial-title {
                color: white;
            }

            .tutorial-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #9ca3af;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .tutorial-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .tutorial-body {
                margin-bottom: 20px;
                color: #4b5563;
                line-height: 1.6;
            }

            .tutorial-celebration .tutorial-body {
                color: rgba(255, 255, 255, 0.9);
            }

            .tutorial-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
            }

            .tutorial-celebration .tutorial-footer {
                border-color: rgba(255, 255, 255, 0.2);
            }

            .tutorial-progress {
                flex: 1;
                margin-right: 20px;
            }

            .progress-bar {
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 5px;
            }

            .progress-fill {
                height: 100%;
                background: #3b82f6;
                transition: width 0.3s ease;
            }

            .tutorial-celebration .progress-fill {
                background: rgba(255, 255, 255, 0.8);
            }

            .progress-text {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .tutorial-celebration .progress-text {
                color: rgba(255, 255, 255, 0.8);
            }

            .tutorial-actions {
                display: flex;
                gap: 10px;
            }

            .tutorial-actions button {
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                transition: all 0.2s;
            }

            .tutorial-actions button:hover {
                background: #f9fafb;
            }

            .tutorial-actions button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .tutorial-next {
                background: #3b82f6 !important;
                color: white !important;
                border-color: #3b82f6 !important;
            }

            .tutorial-next:hover {
                background: #2563eb !important;
            }

            .tutorial-skip {
                color: #6b7280;
                border-color: transparent;
            }

            .tutorial-help-trigger {
                background: #3b82f6;
                color: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 10px;
                transition: all 0.2s;
            }

            .tutorial-help-trigger:hover {
                background: #2563eb;
                transform: scale(1.1);
            }

            /* Mobile styles */
            @media (max-width: 768px) {
                .tutorial-tooltip {
                    position: fixed !important;
                    bottom: 20px !important;
                    left: 20px !important;
                    right: 20px !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    transform: none !important;
                }

                .tutorial-content {
                    padding: 15px;
                }

                .tutorial-title {
                    font-size: 1.125rem;
                }

                .tutorial-footer {
                    flex-direction: column;
                    gap: 15px;
                }

                .tutorial-progress {
                    margin-right: 0;
                }

                .tutorial-actions {
                    width: 100%;
                    justify-content: space-between;
                }

                .tutorial-actions button {
                    flex: 1;
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
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Destroy tutorial system
     */
    destroy() {
        this.endTutorial();
        
        const helpTrigger = document.querySelector('.tutorial-help-trigger');
        if (helpTrigger) {
            helpTrigger.remove();
        }
        
        const styles = document.getElementById('tutorial-styles');
        if (styles) {
            styles.remove();
        }
    }
}
