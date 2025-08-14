import { AreaFinder } from './area-finder.js';
import { VisualAccuracyControls } from './visual-accuracy-controls.js';
import { storeMeasurementData, getMeasurementData } from '../utils/measurement-storage.js';
import BoundaryValidationService from '../services/boundary-validation-service.js';
import BoundaryStorageService from '../services/boundary-storage-service.js';
import { TutorialSystem } from './tutorial-system.js';
import { DrawingHints } from './drawing-hints.js';
import { ErrorHandler } from './error-handler.js';
import { ConfirmationDialog } from './confirmation-dialog.js';

/**
 * Enhanced Area Finder with Visual Accuracy Controls
 * 
 * Extends the base AreaFinder with:
 * - Multiple imagery sources (satellite, aerial, hybrid)
 * - Imagery date/quality indicators
 * - Transparency slider for overlays
 * - Address search with geocoding
 * - Property parcel overlay
 * - Optimized zoom controls
 * - Measurement units toggle
 */
export class EnhancedAreaFinder extends AreaFinder {
    constructor(containerId, options = {}) {
        super(containerId, {
            showCalculator: true,
            showAddressSearch: true,
            showAreaInfo: true,
            enableVisualAccuracy: true,
            ...options
        });
        
        this.visualAccuracyControls = null;
        this.visualControlsVisible = false;
        this.currentUnits = 'sqft';
        this.imageryQuality = 'high';
        this.imageryType = 'hybrid';
        
        // Initialize boundary validation and storage services
        this.boundaryValidator = new BoundaryValidationService();
        this.boundaryStorage = new BoundaryStorageService();
        this.validationResults = null;
        
        // Initialize UX enhancement components
        this.tutorialSystem = null;
        this.drawingHints = null;
        this.errorHandler = null;
        this.confirmationDialog = null;
        this.isFirstTimeUser = true;
        this.keyboardShortcuts = new Map();
    }

    /**
     * Override init to add visual accuracy controls
     */
    async init() {
        try {
            this.render();
            await this.loadGoogleMaps();
            this.initMap();
            this.setupEventListeners();
            await this.initializeVisualAccuracyControls();
            await this.initializeUXEnhancements();
        } catch (error) {
            console.error('Error initializing enhanced area finder:', error);
            this.showError('Failed to initialize area finder');
        }
    }

    /**
     * Initialize UX enhancement components
     */
    async initializeUXEnhancements() {
        try {
            // Initialize error handler first
            this.errorHandler = new ErrorHandler({
                enableToasts: true,
                enableModal: true,
                enableAnalytics: true
            });

            // Initialize confirmation dialog
            this.confirmationDialog = new ConfirmationDialog({
                enableMobileOptimization: true,
                enableAnimation: true
            });

            // Initialize drawing hints
            if (this.map) {
                this.drawingHints = new DrawingHints(this.map, {
                    enableHints: true,
                    enableVertexHighlights: true,
                    enableAreaPreview: true,
                    enableClickFeedback: true,
                    enableKeyboardShortcuts: true
                });

                // Listen for drawing events
                this.setupDrawingEventListeners();
            }

            // Initialize tutorial system
            this.tutorialSystem = new TutorialSystem({
                enableAutoStart: this.isFirstTimeUser,
                enableSkip: true,
                showProgress: true
            });

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Check for mobile and show mobile-specific guidance
            if (this.isMobile()) {
                this.setupMobileEnhancements();
            }

            // Setup location access if needed
            this.setupLocationAccess();

            console.log('UX enhancements initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UX enhancements:', error);
            this.errorHandler?.handleError('initialization', 'UX enhancement initialization failed', { error });
        }
    }

    /**
     * Override render to add visual controls button
     */
    render() {
        this.container.innerHTML = `
            <div class="area-finder-container">
                ${this.options.showAddressSearch ? `
                <div class="area-finder-controls">
                    <div class="search-section">
                        <label for="address-search">Search Location</label>
                        <div class="search-input-group">
                            <input 
                                type="text" 
                                id="address-search" 
                                placeholder="Enter address or coordinates..."
                                class="form-control"
                            >
                            <button type="button" id="search-btn" class="btn btn-primary">Search</button>
                        </div>
                    </div>
                    
                    <div class="drawing-controls">
                        <button type="button" id="clear-shapes" class="btn btn-outline-danger" disabled>Clear All</button>
                        <button type="button" id="calculate-area" class="btn btn-outline-success" disabled>Calculate Area</button>
                        <button type="button" id="toggle-visual-controls" class="btn btn-outline-primary">
                            <span class="icon">🎛️</span>
                            Visual Controls
                        </button>
                    </div>
                </div>
                ` : ''}
                
                <div class="map-section">
                    <div id="${this.containerId}-map" class="area-finder-map"></div>
                    
                    <div class="map-instructions">
                        <h6>Instructions:</h6>
                        <ul>
                            <li>Click on the map to start drawing</li>
                            <li>Continue clicking to add points</li>
                            <li>Click the first point again to close the shape</li>
                            <li>Use the drawing tools above the map to switch between shapes</li>
                            <li>Click "Visual Controls" for advanced mapping options</li>
                        </ul>
                    </div>
                </div>
                
                ${this.options.showAreaInfo ? `
                <div class="area-info-section">
                    <div id="area-results" class="area-results" style="display: none;">
                        <h6>Area Calculation Results</h6>
                        <div class="results-grid">
                            <div class="result-item">
                                <span class="result-label">Area:</span>
                                <span class="result-value" id="area-primary">0 sq ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Perimeter:</span>
                                <span class="result-value" id="perimeter-primary">0 ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Square Feet:</span>
                                <span class="result-value" id="area-sqft">0 sq ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Acres:</span>
                                <span class="result-value" id="area-acres">0 acres</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Square Meters:</span>
                                <span class="result-value" id="area-sqm">0 m²</span>
                            </div>
                            <div class="result-item imagery-info">
                                <span class="result-label">Imagery Quality:</span>
                                <span class="result-value" id="imagery-quality">High Quality</span>
                            </div>
                            <div class="result-item imagery-info">
                                <span class="result-label">Imagery Date:</span>
                                <span class="result-value" id="imagery-date">Recent</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        this.addEnhancedStyles();
    }

    /**
     * Add enhanced styles
     */
    addEnhancedStyles() {
        this.addStyles(); // Call parent styles
        
        if (document.getElementById('enhanced-area-finder-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-area-finder-styles';
        style.textContent = `
            .btn-outline-primary {
                color: #2563eb;
                border-color: #2563eb;
                background: transparent;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-outline-primary:hover {
                background: #2563eb;
                color: white;
            }
            
            .btn-outline-primary.active {
                background: #2563eb;
                color: white;
            }
            
            .imagery-info {
                border-top: 1px solid #e9ecef;
                padding-top: 12px;
                margin-top: 12px;
            }
            
            .imagery-info:first-of-type {
                border-top: none;
                padding-top: 0;
                margin-top: 0;
            }
            
            .quality-high {
                color: #16a34a;
            }
            
            .quality-medium {
                color: #ea580c;
            }
            
            .quality-low {
                color: #dc2626;
            }
            
            .result-value.quality-high::before {
                content: "🟢 ";
            }
            
            .result-value.quality-medium::before {
                content: "🟡 ";
            }
            
            .result-value.quality-low::before {
                content: "🔴 ";
            }
            
            /* Visual Controls Integration */
            .visual-accuracy-container {
                margin-top: 10px;
            }
            
            .visual-accuracy-container.hidden {
                display: none;
            }
            
            .visual-accuracy-container.visible {
                display: block;
                animation: slideDown 0.3s ease-out;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Enhanced instructions */
            .map-instructions ul li:last-child {
                color: #2563eb;
                font-weight: 500;
            }
            
            /* Responsive improvements */
            @media (max-width: 768px) {
                .drawing-controls {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Override setupEventListeners to add visual controls
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        const visualControlsBtn = document.getElementById('toggle-visual-controls');
        if (visualControlsBtn) {
            visualControlsBtn.addEventListener('click', () => this.toggleVisualControls());
        }
        
        // Listen for measurement unit changes from visual controls
        window.addEventListener('measurementUnitsChanged', (e) => {
            this.currentUnits = e.detail.units;
            this.updateDisplayUnits(e.detail.units);
        });
    }

    /**
     * Initialize visual accuracy controls
     */
    async initializeVisualAccuracyControls() {
        if (this.map && this.options.enableVisualAccuracy !== false) {
            try {
                this.visualAccuracyControls = new VisualAccuracyControls(this.map, {
                    enableImageryControls: true,
                    enablePropertyOverlay: true,
                    enableTransparencyControl: true,
                    enableMeasurementToggle: true,
                    enableAdvancedSearch: true,
                    enableZoomOptimization: true,
                    defaultImageryType: 'hybrid',
                    defaultUnits: this.currentUnits
                });
                
                // Initially hide the controls
                this.visualControlsVisible = false;
                this.toggleVisualControlsVisibility(false);
                
                console.log('Visual accuracy controls initialized successfully');
            } catch (error) {
                console.error('Failed to initialize visual accuracy controls:', error);
                this.showError('Advanced mapping features unavailable');
            }
        }
    }

    /**
     * Toggle visual accuracy controls
     */
    toggleVisualControls() {
        this.visualControlsVisible = !this.visualControlsVisible;
        this.toggleVisualControlsVisibility(this.visualControlsVisible);
        
        const btn = document.getElementById('toggle-visual-controls');
        if (btn) {
            btn.innerHTML = this.visualControlsVisible ? 
                '<span class="icon">🎛️</span> Hide Controls' : 
                '<span class="icon">🎛️</span> Visual Controls';
            btn.classList.toggle('active', this.visualControlsVisible);
        }
    }

    /**
     * Toggle visual controls visibility
     */
    toggleVisualControlsVisibility(visible) {
        const container = document.querySelector('.visual-accuracy-container');
        if (container) {
            container.classList.toggle('hidden', !visible);
            container.classList.toggle('visible', visible);
        }
    }

    /**
     * Override displayAreaResults to include visual accuracy information
     */
    displayAreaResults(data) {
        const resultsContainer = document.getElementById('area-results');
        if (!resultsContainer) return;

        // Update all unit displays
        this.updateAllUnitDisplays(data);
        
        // Update imagery quality info
        this.updateImageryQualityDisplay();
        
        // Update visual accuracy controls if available
        if (this.visualAccuracyControls) {
            this.visualAccuracyControls.updateMeasurement(data.areaInSquareFeet, 'sqft');
        }

        resultsContainer.style.display = 'block';
    }

    /**
     * Update all unit displays
     */
    updateAllUnitDisplays(data) {
        // Primary display based on current units
        const primaryArea = document.getElementById('area-primary');
        const primaryPerimeter = document.getElementById('perimeter-primary');
        
        if (primaryArea && primaryPerimeter) {
            const converted = this.convertAreaUnits(data, this.currentUnits);
            const unitLabels = {
                sqft: 'sq ft',
                sqm: 'm²',
                acres: 'acres'
            };
            
            primaryArea.textContent = `${this.formatNumber(converted.primaryValue)} ${unitLabels[this.currentUnits]}`;
            primaryPerimeter.textContent = `${this.formatNumber(converted.perimeter)} ${this.currentUnits === 'sqft' ? 'ft' : 'm'}`;
        }
        
        // Individual unit displays
        document.getElementById('area-sqft').textContent = `${this.formatNumber(data.areaInSquareFeet)} sq ft`;
        document.getElementById('area-acres').textContent = `${data.areaInAcres} acres`;
        document.getElementById('area-sqm').textContent = `${this.formatNumber(data.area)} m²`;
    }

    /**
     * Update display units based on visual accuracy controls
     */
    updateDisplayUnits(units) {
        this.currentUnits = units;
        if (this.currentArea) {
            this.updateAllUnitDisplays(this.currentArea);
        }
    }

    /**
     * Convert area units for display
     */
    convertAreaUnits(data, targetUnit) {
        const conversions = {
            sqft: { sqm: 0.092903, acres: 0.000022957 },
            sqm: { sqft: 10.7639, acres: 0.000247105 },
            acres: { sqft: 43560, sqm: 4046.86 }
        };
        
        let primaryValue = data.areaInSquareFeet;
        let perimeter = data.perimeter * 3.28084; // Convert to feet
        
        if (targetUnit === 'sqm') {
            primaryValue = data.areaInSquareFeet * conversions.sqft.sqm;
            perimeter = data.perimeter; // Keep in meters
        } else if (targetUnit === 'acres') {
            primaryValue = data.areaInSquareFeet * conversions.sqft.acres;
            perimeter = data.perimeter * 3.28084; // Convert to feet
        }
        
        return {
            primaryValue: primaryValue,
            perimeter: perimeter
        };
    }

    /**
     * Format number for display
     */
    formatNumber(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else if (value < 1) {
            return value.toFixed(4);
        } else {
            return value.toLocaleString();
        }
    }

    /**
     * Update imagery quality display
     */
    updateImageryQualityDisplay() {
        const qualityElement = document.getElementById('imagery-quality');
        const dateElement = document.getElementById('imagery-date');
        
        if (qualityElement && this.visualAccuracyControls) {
            const data = this.visualAccuracyControls.getMeasurementData();
            this.imageryQuality = data.imageryQuality || 'high';
            this.imageryType = data.imageryType || 'hybrid';
            
            qualityElement.textContent = `${this.imageryQuality} (${this.imageryType})`;
            qualityElement.className = `result-value quality-${this.imageryQuality}`;
        }
        
        if (dateElement) {
            // Get imagery date from visual controls or use current date
            const currentDate = new Date().toLocaleDateString();
            dateElement.textContent = this.getImageryDate() || currentDate;
        }
    }

    /**
     * Get imagery date based on current imagery type
     */
    getImageryDate() {
        const dates = {
            satellite: '2023-08-15',
            hybrid: '2023-09-02',
            terrain: '2023-07-20',
            roadmap: '2023-10-01'
        };
        
        return dates[this.imageryType] || dates.hybrid;
    }

    /**
     * Get enhanced area data including visual accuracy info
     */
    getEnhancedAreaData() {
        const baseData = this.getAreaData();
        if (this.visualAccuracyControls) {
            const visualData = this.visualAccuracyControls.getMeasurementData();
            return {
                ...baseData,
                imageryType: visualData.imageryType,
                imageryQuality: visualData.imageryQuality,
                imageryDate: this.getImageryDate(),
                overlayOpacity: visualData.overlayOpacity,
                propertyOverlayEnabled: visualData.propertyOverlayEnabled,
                measurementUnits: visualData.units,
                visualAccuracyEnabled: true
            };
        }
        return {
            ...baseData,
            visualAccuracyEnabled: false
        };
    }

    /**
     * Override calculateArea to include visual accuracy data
     */
    async calculateArea() {
        if (!this.currentShape) {
            this.showError('No shape to calculate. Please draw a shape first.');
            return;
        }

        try {
            const coordinates = this.getShapeCoordinates(this.currentShape);
            
            // Send to backend for calculation with visual accuracy data
            const requestData = {
                coordinates: coordinates,
                imageryType: this.imageryType,
                imageryQuality: this.imageryQuality,
                measurementUnits: this.currentUnits
            };
            
            const response = await fetch('/api/maps/calculate-area', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                this.displayAreaResults(result.data);
                this.currentArea = result.data;
                
                // Store enhanced measurement data
                const enhancedData = {
                    ...result.data,
                    coordinates: coordinates,
                    imageryType: this.imageryType,
                    imageryQuality: this.imageryQuality,
                    measurementUnits: this.currentUnits,
                    timestamp: new Date().toISOString(),
                    visualAccuracyEnabled: true
                };
                
                storeMeasurementData('enhanced-area-finder', enhancedData);
                
                this.options.onAreaCalculated(enhancedData);
            } else {
                throw new Error(result.message || 'Calculation failed');
            }
        } catch (error) {
            console.error('Area calculation error:', error);
            this.showError('Failed to calculate area. Please try again.');
        }
    }

    /**
     * Override restorePreviousData to include visual accuracy data
     */
    restorePreviousData() {
        try {
            const savedData = getMeasurementData('enhanced-area-finder');
            if (savedData && savedData.coordinates && savedData.coordinates.length > 0) {
                // Restore the shape
                const path = savedData.coordinates.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
                this.currentShape = new google.maps.Polygon({
                    path,
                    map: this.map,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35
                });

                // Restore the area calculation results
                this.currentArea = savedData;
                this.displayAreaResults(savedData);
                
                // Restore visual accuracy settings
                if (savedData.visualAccuracyEnabled) {
                    this.imageryType = savedData.imageryType || 'hybrid';
                    this.imageryQuality = savedData.imageryQuality || 'high';
                    this.currentUnits = savedData.measurementUnits || 'sqft';
                }
                
                // Enable buttons
                this.enableButton('clear-shapes');
                this.enableButton('calculate-area');
                
                // Center map on the restored shape
                const bounds = new google.maps.LatLngBounds();
                savedData.coordinates.forEach(coord => {
                    bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
                });
                this.map.fitBounds(bounds);
                
                console.log('Restored enhanced area finder data:', savedData);
            }
        } catch (error) {
            console.error('Error restoring previous enhanced area finder data:', error);
        }
    }

    /**
     * Setup drawing event listeners for UX enhancements
     */
    setupDrawingEventListeners() {
        // Listen for drawing hints events
        document.addEventListener('drawingHints:drawingStarted', (e) => {
            this.enableButton('clear-shapes');
        });

        document.addEventListener('drawingHints:drawingCompleted', (e) => {
            this.currentShape = e.detail.shape;
            this.enableButton('calculate-area');
        });

        document.addEventListener('drawingHints:drawingCancelled', (e) => {
            this.currentShape = null;
            this.disableButton('calculate-area');
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        this.keyboardShortcuts.set('KeyC', {
            key: 'c',
            ctrl: true,
            action: () => this.showClearAllConfirmation(),
            description: 'Clear all drawings'
        });

        this.keyboardShortcuts.set('KeyS', {
            key: 's',
            ctrl: true,
            action: () => this.saveCurrentState(),
            description: 'Save current state'
        });

        this.keyboardShortcuts.set('KeyV', {
            key: 'v',
            ctrl: true,
            action: () => this.toggleVisualControls(),
            description: 'Toggle visual controls'
        });

        this.keyboardShortcuts.set('KeyH', {
            key: 'h',
            ctrl: true,
            action: () => this.showKeyboardShortcuts(),
            description: 'Show keyboard shortcuts'
        });

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            const key = e.code;
            const shortcut = this.keyboardShortcuts.get(key);
            
            if (shortcut && 
                (shortcut.ctrl === e.ctrlKey || shortcut.ctrl === e.metaKey) &&
                !shortcut.shift === !e.shiftKey &&
                !shortcut.alt === !e.altKey) {
                
                e.preventDefault();
                shortcut.action();
            }
        });
    }

    /**
     * Setup mobile-specific enhancements
     */
    async setupMobileEnhancements() {
        // Show mobile tutorial confirmation
        if (this.isFirstTimeUser) {
            const showTutorial = await this.confirmationDialog.showMobileTutorialConfirmation();
            if (showTutorial) {
                this.tutorialSystem.startTutorial();
            }
        }

        // Update instructions for mobile
        const instructions = document.querySelector('.map-instructions ul');
        if (instructions) {
            instructions.innerHTML = `
                <li>Tap on the map to start drawing</li>
                <li>Continue tapping to add points</li>
                <li>Double-tap to finish drawing</li>
                <li>Pinch to zoom, drag to pan</li>
                <li>Use buttons above for controls</li>
            `;
        }

        // Add mobile-specific styles
        this.addMobileStyles();
    }

    /**
     * Setup location access handling
     */
    async setupLocationAccess() {
        // Always ensure map has default coordinates (Muskingum County Courthouse)
        this.defaultCoordinates = { lat: 39.94041, lng: -82.00734 };
        
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser');
            this.setDefaultMapLocation();
            return;
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'prompt') {
                const allowLocation = await this.confirmationDialog.showLocationAccessConfirmation();
                if (allowLocation) {
                    this.requestLocation();
                } else {
                    this.setDefaultMapLocation();
                }
            } else if (permission.state === 'granted') {
                this.requestLocation();
            } else if (permission.state === 'denied') {
                console.info('Geolocation access denied by user');
                this.setDefaultMapLocation();
            }
        } catch (error) {
            console.warn('Geolocation permission check failed:', error);
            this.setDefaultMapLocation();
        }
    }

    /**
     * Set default map location to Muskingum County Courthouse
     */
    setDefaultMapLocation() {
        if (this.map && this.defaultCoordinates) {
            this.map.setCenter(this.defaultCoordinates);
            this.map.setZoom(15);
            
            // Add default location marker
            new google.maps.Marker({
                position: this.defaultCoordinates,
                map: this.map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#dc2626',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 8
                },
                title: 'Default Location - Muskingum County Courthouse'
            });
        }
    }

    /**
     * Request user location with comprehensive error handling
     */
    requestLocation() {
        // Set a timeout for geolocation request
        const timeout = 10000; // 10 seconds
        
        try {
            navigator.geolocation.getCurrentPosition(
                // Success callback
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.map.setCenter(userLocation);
                    this.map.setZoom(16);
                    
                    // Add user location marker
                    new google.maps.Marker({
                        position: userLocation,
                        map: this.map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#4285f4',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 8
                        },
                        title: 'Your Location'
                    });
                    
                    // Show success message without blocking UI
                    if (this.errorHandler) {
                        this.errorHandler.showToast('Location found successfully', 'success');
                    }
                },
                // Error callback with detailed error handling
                (error) => {
                    let errorMessage = 'Unable to get your location';
                    let userFriendlyMessage = '';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            userFriendlyMessage = 'Location access was denied. Using default location instead.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            userFriendlyMessage = 'Your location could not be determined. Using default location instead.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            userFriendlyMessage = 'Location request took too long. Using default location instead.';
                            break;
                        default:
                            errorMessage = 'Unknown geolocation error';
                            userFriendlyMessage = 'Could not get your location. Using default location instead.';
                            break;
                    }
                    
                    console.warn(`Geolocation error: ${errorMessage}`, error);
                    
                    // Set default location and show user-friendly message
                    this.setDefaultMapLocation();
                    
                    // Show non-blocking toast message
                    if (this.errorHandler) {
                        this.errorHandler.showToast(userFriendlyMessage, 'info');
                    }
                },
                // Options for geolocation request
                {
                    enableHighAccuracy: true,
                    timeout: timeout,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        } catch (error) {
            console.error('Error requesting geolocation:', error);
            
            // Fallback to default location
            this.setDefaultMapLocation();
            
            // Show user-friendly error message
            if (this.errorHandler) {
                this.errorHandler.showToast('Using default location - geolocation unavailable', 'info');
            }
        }
    }

    /**
     * Override calculateArea with confirmation dialog
     */
    async calculateArea() {
        if (!this.currentShape) {
            this.errorHandler.handleError('drawing', 'INSUFFICIENT_POINTS');
            return;
        }

        try {
            // Validate boundary first
            const coordinates = this.getShapeCoordinates(this.currentShape);
            const validationErrors = this.errorHandler.validateBoundary(coordinates);
            
            if (validationErrors.length > 0) {
                validationErrors.forEach(error => {
                    this.errorHandler.handleError(error.type, error.message, error.details);
                });
                return;
            }

            // Show confirmation dialog
            const areaData = this.calculateBasicArea(coordinates);
            const confirmed = await this.confirmationDialog.showAreaCalculationConfirmation(areaData);
            
            if (!confirmed) {
                return;
            }

            // Proceed with calculation
            const requestData = {
                coordinates: coordinates,
                imageryType: this.imageryType,
                imageryQuality: this.imageryQuality,
                measurementUnits: this.currentUnits
            };
            
            const response = await fetch('/api/maps/calculate-area', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                this.errorHandler.handleApiError(response, 'Area Calculation');
                return;
            }

            const result = await response.json();

            if (result.success) {
                this.displayAreaResults(result.data);
                this.currentArea = result.data;
                
                // Store enhanced measurement data
                const enhancedData = {
                    ...result.data,
                    coordinates: coordinates,
                    imageryType: this.imageryType,
                    imageryQuality: this.imageryQuality,
                    measurementUnits: this.currentUnits,
                    timestamp: new Date().toISOString(),
                    visualAccuracyEnabled: true
                };
                
                storeMeasurementData('enhanced-area-finder', enhancedData);
                
                this.options.onAreaCalculated?.(enhancedData);
            } else {
                throw new Error(result.message || 'Calculation failed');
            }
        } catch (error) {
            console.error('Area calculation error:', error);
            this.errorHandler.handleNetworkError(error, 'Area Calculation');
        }
    }

    /**
     * Calculate basic area for preview
     */
    calculateBasicArea(coordinates) {
        if (!coordinates || coordinates.length < 3) {
            return { areaInSquareFeet: 0, areaInAcres: 0, perimeter: 0 };
        }

        // Simple area calculation using shoelace formula
        let area = 0;
        let perimeter = 0;
        
        for (let i = 0; i < coordinates.length; i++) {
            const j = (i + 1) % coordinates.length;
            area += coordinates[i].lat * coordinates[j].lng;
            area -= coordinates[j].lat * coordinates[i].lng;
            
            // Calculate perimeter
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(coordinates[i].lat, coordinates[i].lng),
                new google.maps.LatLng(coordinates[j].lat, coordinates[j].lng)
            );
            perimeter += distance;
        }
        
        area = Math.abs(area) / 2;
        const areaInSquareFeet = area * 111319.5 * 111319.5 * 10.764; // Rough conversion
        const areaInAcres = areaInSquareFeet / 43560;
        
        return {
            areaInSquareFeet: Math.round(areaInSquareFeet),
            areaInAcres: areaInAcres.toFixed(4),
            perimeter: Math.round(perimeter * 3.28084) // Convert to feet
        };
    }

    /**
     * Show clear all confirmation
     */
    async showClearAllConfirmation() {
        const confirmed = await this.confirmationDialog.showClearAllConfirmation();
        if (confirmed) {
            this.clearAllShapes();
        }
    }

    /**
     * Clear all shapes
     */
    clearAllShapes() {
        if (this.drawingHints) {
            this.drawingHints.clearDrawings();
        }
        
        if (this.currentShape) {
            this.currentShape.setMap(null);
            this.currentShape = null;
        }
        
        this.currentArea = null;
        this.disableButton('calculate-area');
        this.disableButton('clear-shapes');
        
        // Hide results
        const resultsContainer = document.getElementById('area-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    /**
     * Show keyboard shortcuts
     */
    showKeyboardShortcuts() {
        const shortcuts = Array.from(this.keyboardShortcuts.values());
        let shortcutsList = shortcuts.map(shortcut => 
            `<li><kbd>Ctrl+${shortcut.key.toUpperCase()}</kbd> - ${shortcut.description}</li>`
        ).join('');
        
        this.confirmationDialog.showConfirmation({
            title: 'Keyboard Shortcuts',
            message: `<ul class="shortcuts-list">${shortcutsList}</ul>`,
            confirmText: 'Got it',
            cancelText: '',
            showIcon: true,
            type: 'info',
            enableHTML: true,
            customButtons: [{
                id: 'close',
                text: 'Close',
                type: 'secondary',
                onClick: () => {}
            }]
        });
    }

    /**
     * Save current state
     */
    saveCurrentState() {
        if (this.currentArea) {
            const stateData = this.getEnhancedAreaData();
            storeMeasurementData('enhanced-area-finder-backup', stateData);
            
            this.errorHandler.showToast('State saved successfully', 'success');
        } else {
            this.errorHandler.showToast('No data to save', 'warning');
        }
    }

    /**
     * Add mobile-specific styles
     */
    addMobileStyles() {
        const style = document.createElement('style');
        style.id = 'mobile-enhancements-styles';
        style.textContent = `
            @media (max-width: 768px) {
                .area-finder-map {
                    height: 60vh;
                    min-height: 400px;
                }
                
                .map-instructions {
                    font-size: 0.9rem;
                }
                
                .drawing-controls {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: white;
                    padding: 10px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .search-input-group {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .search-input-group input {
                    width: 100%;
                }
                
                .area-results {
                    position: sticky;
                    bottom: 0;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                    max-height: 40vh;
                    overflow-y: auto;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Check if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Override destroy to clean up visual accuracy controls
     */
    destroy() {
        // Cleanup UX enhancement components
        if (this.tutorialSystem) {
            this.tutorialSystem.destroy();
        }
        
        if (this.drawingHints) {
            this.drawingHints.destroy();
        }
        
        if (this.errorHandler) {
            this.errorHandler.destroy();
        }
        
        if (this.confirmationDialog) {
            this.confirmationDialog.destroy();
        }
        
        if (this.visualAccuracyControls) {
            this.visualAccuracyControls.destroy();
        }
        
        super.destroy();
        
        // Remove enhanced styles
        const enhancedStyles = document.getElementById('enhanced-area-finder-styles');
        if (enhancedStyles) {
            enhancedStyles.remove();
        }
        
        const mobileStyles = document.getElementById('mobile-enhancements-styles');
        if (mobileStyles) {
            mobileStyles.remove();
        }
    }

    /**
     * Get current measurement summary with visual accuracy info
     */
    getMeasurementSummary() {
        const baseData = this.getEnhancedAreaData();
        
        return {
            totalArea: baseData.areaInSquareFeet || 0,
            primaryUnit: this.currentUnits,
            imageryType: this.imageryType,
            imageryQuality: this.imageryQuality,
            imageryDate: this.getImageryDate(),
            visualAccuracyEnabled: true,
            timestamp: new Date().toISOString()
        };
    }
}
