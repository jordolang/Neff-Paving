import { GOOGLE_MAPS_CONFIG } from '../config/maps.js';
import { storeMeasurementData, getMeasurementData } from '../utils/measurement-storage.js';

/**
 * Visual Accuracy Controls Component
 * 
 * Enhances map visualization with:
 * - Multiple imagery sources (satellite, aerial, hybrid)
 * - Imagery date/quality indicators
 * - Transparency slider for overlays
 * - Address search with geocoding
 * - Property parcel overlay
 * - Optimized zoom controls
 * - Measurement units toggle
 */
export class VisualAccuracyControls {
    constructor(mapInstance, options = {}) {
        this.map = mapInstance;
        this.options = {
            enableImageryControls: true,
            enablePropertyOverlay: true,
            enableTransparencyControl: true,
            enableMeasurementToggle: true,
            enableAdvancedSearch: true,
            enableZoomOptimization: true,
            defaultImageryType: 'hybrid',
            defaultUnits: 'sqft',
            ...options
        };

        this.currentImageryType = this.options.defaultImageryType;
        this.currentUnits = this.options.defaultUnits;
        this.overlayOpacity = 0.7;
        this.propertyOverlayEnabled = false;
        this.imageryQuality = 'high';
        this.imageryDate = null;
        
        this.overlays = new Map();
        this.parcelLayer = null;
        this.searchBox = null;
        this.autocompleteService = null;
        this.geocoder = null;
        
        this.unitConversions = {
            sqft: { sqm: 0.092903, acres: 0.000022957 },
            sqm: { sqft: 10.7639, acres: 0.000247105 },
            acres: { sqft: 43560, sqm: 4046.86 }
        };

        this.init();
    }

    /**
     * Initialize the visual accuracy controls
     */
    async init() {
        try {
            await this.initializeGoogleServices();
            this.createControlsUI();
            this.setupEventListeners();
            this.initializeImageryControls();
            this.initializePropertyOverlay();
            this.initializeSearchEnhancements();
            this.initializeZoomOptimization();
            this.loadSavedSettings();
            
            console.log('Visual accuracy controls initialized successfully');
        } catch (error) {
            console.error('Failed to initialize visual accuracy controls:', error);
            this.showError('Failed to initialize advanced map features');
        }
    }

    /**
     * Initialize Google Maps services
     */
    async initializeGoogleServices() {
        if (typeof google !== 'undefined' && google.maps) {
            this.geocoder = new google.maps.Geocoder();
            this.autocompleteService = new google.maps.places.AutocompleteService();
            return true;
        }
        throw new Error('Google Maps not available');
    }

    /**
     * Create the controls UI
     */
    createControlsUI() {
        const controlsHTML = `
            <div class="visual-accuracy-controls">
                ${this.options.enableImageryControls ? this.createImageryControlsHTML() : ''}
                ${this.options.enableTransparencyControl ? this.createTransparencyControlHTML() : ''}
                ${this.options.enableMeasurementToggle ? this.createMeasurementToggleHTML() : ''}
                ${this.options.enableAdvancedSearch ? this.createAdvancedSearchHTML() : ''}
                ${this.options.enablePropertyOverlay ? this.createPropertyOverlayHTML() : ''}
                ${this.options.enableZoomOptimization ? this.createZoomControlsHTML() : ''}
            </div>
        `;

        // Create container element
        const container = document.createElement('div');
        container.innerHTML = controlsHTML;
        container.className = 'visual-accuracy-container';
        
        // Add to map
        this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(container);
        
        // Add styles
        this.addStyles();
    }

    /**
     * Create imagery controls HTML
     */
    createImageryControlsHTML() {
        return `
            <div class="imagery-controls card">
                <h4>
                    <span class="icon">🛰️</span>
                    Imagery Sources
                </h4>
                <div class="imagery-options">
                    <div class="imagery-option">
                        <input type="radio" id="satellite-imagery" name="imagery" value="satellite" ${this.currentImageryType === 'satellite' ? 'checked' : ''}>
                        <label for="satellite-imagery">
                            <span class="imagery-preview satellite-preview"></span>
                            <span class="imagery-label">Satellite</span>
                        </label>
                    </div>
                    <div class="imagery-option">
                        <input type="radio" id="hybrid-imagery" name="imagery" value="hybrid" ${this.currentImageryType === 'hybrid' ? 'checked' : ''}>
                        <label for="hybrid-imagery">
                            <span class="imagery-preview hybrid-preview"></span>
                            <span class="imagery-label">Hybrid</span>
                        </label>
                    </div>
                    <div class="imagery-option">
                        <input type="radio" id="terrain-imagery" name="imagery" value="terrain" ${this.currentImageryType === 'terrain' ? 'checked' : ''}>
                        <label for="terrain-imagery">
                            <span class="imagery-preview terrain-preview"></span>
                            <span class="imagery-label">Terrain</span>
                        </label>
                    </div>
                    <div class="imagery-option">
                        <input type="radio" id="roadmap-imagery" name="imagery" value="roadmap" ${this.currentImageryType === 'roadmap' ? 'checked' : ''}>
                        <label for="roadmap-imagery">
                            <span class="imagery-preview roadmap-preview"></span>
                            <span class="imagery-label">Street Map</span>
                        </label>
                    </div>
                </div>
                <div class="imagery-info">
                    <div class="imagery-quality">
                        <span class="quality-indicator ${this.imageryQuality}"></span>
                        <span class="quality-text">Quality: ${this.imageryQuality}</span>
                    </div>
                    <div class="imagery-date" id="imagery-date">
                        <span class="date-icon">📅</span>
                        <span class="date-text">Checking date...</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create transparency control HTML
     */
    createTransparencyControlHTML() {
        return `
            <div class="transparency-controls card">
                <h4>
                    <span class="icon">🎛️</span>
                    Overlay Transparency
                </h4>
                <div class="transparency-slider-container">
                    <input type="range" id="transparency-slider" min="0" max="100" value="${this.overlayOpacity * 100}" class="transparency-slider">
                    <div class="transparency-labels">
                        <span>Transparent</span>
                        <span id="transparency-value">${Math.round(this.overlayOpacity * 100)}%</span>
                        <span>Opaque</span>
                    </div>
                </div>
                <div class="transparency-presets">
                    <button class="preset-btn" data-opacity="0.25">25%</button>
                    <button class="preset-btn" data-opacity="0.5">50%</button>
                    <button class="preset-btn active" data-opacity="0.7">70%</button>
                    <button class="preset-btn" data-opacity="1">100%</button>
                </div>
            </div>
        `;
    }

    /**
     * Create measurement toggle HTML
     */
    createMeasurementToggleHTML() {
        return `
            <div class="measurement-controls card">
                <h4>
                    <span class="icon">📏</span>
                    Measurement Units
                </h4>
                <div class="units-toggle">
                    <div class="unit-option">
                        <input type="radio" id="sqft-unit" name="units" value="sqft" ${this.currentUnits === 'sqft' ? 'checked' : ''}>
                        <label for="sqft-unit">Square Feet</label>
                    </div>
                    <div class="unit-option">
                        <input type="radio" id="sqm-unit" name="units" value="sqm" ${this.currentUnits === 'sqm' ? 'checked' : ''}>
                        <label for="sqm-unit">Square Meters</label>
                    </div>
                    <div class="unit-option">
                        <input type="radio" id="acres-unit" name="units" value="acres" ${this.currentUnits === 'acres' ? 'checked' : ''}>
                        <label for="acres-unit">Acres</label>
                    </div>
                </div>
                <div class="measurement-display" id="measurement-display">
                    <span class="measurement-icon">📐</span>
                    <span class="measurement-text">Draw area to measure</span>
                </div>
            </div>
        `;
    }

    /**
     * Create advanced search HTML
     */
    createAdvancedSearchHTML() {
        return `
            <div class="advanced-search card">
                <h4>
                    <span class="icon">🔍</span>
                    Address Search
                </h4>
                <div class="search-container">
                    <input type="text" id="address-search-input" placeholder="Enter address, coordinates, or parcel ID..." class="search-input">
                    <button id="search-button" class="search-btn">
                        <span class="search-icon">🔍</span>
                    </button>
                    <button id="location-button" class="location-btn" title="Use current location">
                        <span class="location-icon">📍</span>
                    </button>
                </div>
                <div class="search-results" id="search-results" style="display: none;"></div>
                <div class="search-options">
                    <label class="search-option">
                        <input type="checkbox" id="search-parcels" checked>
                        <span>Include property parcels</span>
                    </label>
                    <label class="search-option">
                        <input type="checkbox" id="search-nearby" checked>
                        <span>Show nearby properties</span>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Create property overlay HTML
     */
    createPropertyOverlayHTML() {
        return `
            <div class="property-overlay-controls card">
                <h4>
                    <span class="icon">🏢</span>
                    Property Overlays
                </h4>
                <div class="overlay-options">
                    <label class="overlay-option">
                        <input type="checkbox" id="parcel-overlay" ${this.propertyOverlayEnabled ? 'checked' : ''}>
                        <span class="overlay-label">Property Parcels</span>
                        <span class="overlay-status" id="parcel-status">Available</span>
                    </label>
                    <label class="overlay-option">
                        <input type="checkbox" id="zoning-overlay">
                        <span class="overlay-label">Zoning Districts</span>
                        <span class="overlay-status">Loading...</span>
                    </label>
                    <label class="overlay-option">
                        <input type="checkbox" id="flood-overlay">
                        <span class="overlay-label">Flood Zones</span>
                        <span class="overlay-status">Available</span>
                    </label>
                </div>
                <div class="overlay-legend" id="overlay-legend" style="display: none;">
                    <h5>Legend</h5>
                    <div class="legend-items" id="legend-items"></div>
                </div>
            </div>
        `;
    }

    /**
     * Create zoom controls HTML
     */
    createZoomControlsHTML() {
        return `
            <div class="zoom-controls card">
                <h4>
                    <span class="icon">🔍</span>
                    Zoom Controls
                </h4>
                <div class="zoom-buttons">
                    <button id="zoom-property" class="zoom-btn" title="Zoom to property level">
                        <span class="zoom-icon">🏠</span>
                        <span class="zoom-label">Property</span>
                    </button>
                    <button id="zoom-parcel" class="zoom-btn" title="Zoom to parcel level">
                        <span class="zoom-icon">📏</span>
                        <span class="zoom-label">Parcel</span>
                    </button>
                    <button id="zoom-satellite" class="zoom-btn" title="Optimal satellite view">
                        <span class="zoom-icon">🛰️</span>
                        <span class="zoom-label">Satellite</span>
                    </button>
                    <button id="zoom-street" class="zoom-btn" title="Street level view">
                        <span class="zoom-icon">🚗</span>
                        <span class="zoom-label">Street</span>
                    </button>
                </div>
                <div class="zoom-info">
                    <span class="zoom-level">Zoom: <span id="current-zoom">15</span></span>
                    <span class="zoom-scale">Scale: <span id="current-scale">1:1000</span></span>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Imagery controls
        document.querySelectorAll('input[name="imagery"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeImageryType(e.target.value);
            });
        });

        // Transparency controls
        const transparencySlider = document.getElementById('transparency-slider');
        if (transparencySlider) {
            transparencySlider.addEventListener('input', (e) => {
                this.updateTransparency(e.target.value / 100);
            });
        }

        // Transparency presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const opacity = parseFloat(e.target.dataset.opacity);
                this.updateTransparency(opacity);
                this.updateTransparencyUI(opacity);
            });
        });

        // Unit toggle
        document.querySelectorAll('input[name="units"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeUnits(e.target.value);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('address-search-input');
        const searchButton = document.getElementById('search-button');
        const locationButton = document.getElementById('location-button');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        if (locationButton) {
            locationButton.addEventListener('click', () => {
                this.useCurrentLocation();
            });
        }

        // Property overlay controls
        const parcelOverlay = document.getElementById('parcel-overlay');
        if (parcelOverlay) {
            parcelOverlay.addEventListener('change', (e) => {
                this.togglePropertyOverlay('parcels', e.target.checked);
            });
        }

        // Zoom controls
        document.getElementById('zoom-property')?.addEventListener('click', () => this.zoomToLevel('property'));
        document.getElementById('zoom-parcel')?.addEventListener('click', () => this.zoomToLevel('parcel'));
        document.getElementById('zoom-satellite')?.addEventListener('click', () => this.zoomToLevel('satellite'));
        document.getElementById('zoom-street')?.addEventListener('click', () => this.zoomToLevel('street'));

        // Map event listeners
        this.map.addListener('zoom_changed', () => {
            this.updateZoomInfo();
        });

        this.map.addListener('maptypeid_changed', () => {
            this.updateImageryInfo();
        });
    }

    /**
     * Initialize imagery controls
     */
    initializeImageryControls() {
        this.changeImageryType(this.currentImageryType);
        this.updateImageryInfo();
    }

    /**
     * Change imagery type
     */
    changeImageryType(type) {
        this.currentImageryType = type;
        this.map.setMapTypeId(type);
        this.updateImageryInfo();
        this.saveSettings();
    }

    /**
     * Update imagery information
     */
    updateImageryInfo() {
        // Update imagery quality based on zoom level
        const zoom = this.map.getZoom();
        if (zoom >= 18) {
            this.imageryQuality = 'high';
        } else if (zoom >= 15) {
            this.imageryQuality = 'medium';
        } else {
            this.imageryQuality = 'low';
        }

        // Update quality display
        const qualityIndicator = document.querySelector('.quality-indicator');
        const qualityText = document.querySelector('.quality-text');
        if (qualityIndicator && qualityText) {
            qualityIndicator.className = `quality-indicator ${this.imageryQuality}`;
            qualityText.textContent = `Quality: ${this.imageryQuality}`;
        }

        // Simulate imagery date (in real implementation, this would come from tile metadata)
        this.updateImageryDate();
    }

    /**
     * Update imagery date display
     */
    updateImageryDate() {
        const dateText = document.querySelector('.date-text');
        if (dateText) {
            // Simulate different dates based on imagery type
            const dates = {
                satellite: '2023-08-15',
                hybrid: '2023-09-02',
                terrain: '2023-07-20',
                roadmap: '2023-10-01'
            };
            
            const date = dates[this.currentImageryType] || '2023-08-15';
            dateText.textContent = `Updated: ${date}`;
        }
    }

    /**
     * Update transparency
     */
    updateTransparency(opacity) {
        this.overlayOpacity = opacity;
        
        // Update all overlays
        this.overlays.forEach(overlay => {
            if (overlay.setOpacity) {
                overlay.setOpacity(opacity);
            }
        });

        // Update parcel layer if exists
        if (this.parcelLayer) {
            this.parcelLayer.setOpacity(opacity);
        }

        this.saveSettings();
    }

    /**
     * Update transparency UI
     */
    updateTransparencyUI(opacity) {
        const slider = document.getElementById('transparency-slider');
        const valueDisplay = document.getElementById('transparency-value');
        
        if (slider) {
            slider.value = opacity * 100;
        }
        
        if (valueDisplay) {
            valueDisplay.textContent = `${Math.round(opacity * 100)}%`;
        }

        // Update preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.opacity) === opacity);
        });
    }

    /**
     * Change measurement units
     */
    changeUnits(units) {
        this.currentUnits = units;
        this.updateMeasurementDisplay();
        this.saveSettings();
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('measurementUnitsChanged', {
            detail: { units: units }
        }));
    }

    /**
     * Update measurement display
     */
    updateMeasurementDisplay() {
        const measurementDisplay = document.getElementById('measurement-display');
        if (measurementDisplay) {
            // Get current measurement if available
            const savedData = getMeasurementData('visual-accuracy');
            if (savedData && savedData.area) {
                const convertedArea = this.convertArea(savedData.area, savedData.originalUnits, this.currentUnits);
                measurementDisplay.innerHTML = `
                    <span class="measurement-icon">📐</span>
                    <span class="measurement-text">Area: ${convertedArea.toFixed(2)} ${this.currentUnits}</span>
                `;
            }
        }
    }

    /**
     * Convert area between units
     */
    convertArea(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        // Convert to base unit (sqft) first
        let valueInSqft = value;
        if (fromUnit !== 'sqft') {
            valueInSqft = value / this.unitConversions.sqft[fromUnit];
        }
        
        // Convert to target unit
        if (toUnit === 'sqft') {
            return valueInSqft;
        } else {
            return valueInSqft * this.unitConversions.sqft[toUnit];
        }
    }

    /**
     * Handle search input
     */
    async handleSearchInput(query) {
        if (query.length < 3) {
            this.hideSearchResults();
            return;
        }

        try {
            const predictions = await this.getAutocompletePredictions(query);
            this.showSearchResults(predictions);
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }

    /**
     * Get autocomplete predictions
     */
    async getAutocompletePredictions(query) {
        return new Promise((resolve, reject) => {
            if (!this.autocompleteService) {
                reject(new Error('Autocomplete service not available'));
                return;
            }

            this.autocompleteService.getPlacePredictions({
                input: query,
                componentRestrictions: { country: 'US' }
            }, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(predictions || []);
                } else {
                    reject(new Error(`Autocomplete failed: ${status}`));
                }
            });
        });
    }

    /**
     * Show search results
     */
    showSearchResults(predictions) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'block';

        predictions.forEach(prediction => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="result-main">${prediction.structured_formatting.main_text}</div>
                <div class="result-secondary">${prediction.structured_formatting.secondary_text}</div>
            `;
            
            resultItem.addEventListener('click', () => {
                this.selectSearchResult(prediction);
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    /**
     * Hide search results
     */
    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    /**
     * Select search result
     */
    selectSearchResult(prediction) {
        const searchInput = document.getElementById('address-search-input');
        if (searchInput) {
            searchInput.value = prediction.description;
        }
        
        this.hideSearchResults();
        this.performSearch(prediction.description);
    }

    /**
     * Perform search
     */
    async performSearch(query) {
        if (!query.trim()) return;

        try {
            const results = await this.geocodeAddress(query);
            if (results.length > 0) {
                const result = results[0];
                const location = result.geometry.location;
                
                this.map.setCenter(location);
                this.map.setZoom(18);
                
                // Add marker
                new google.maps.Marker({
                    position: location,
                    map: this.map,
                    title: result.formatted_address,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF6B6B">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(24, 24)
                    }
                });
                
                // Load property information if available
                if (document.getElementById('search-parcels').checked) {
                    this.loadPropertyInfo(location);
                }
                
            } else {
                this.showError('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed');
        }
    }

    /**
     * Geocode address
     */
    async geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            if (!this.geocoder) {
                reject(new Error('Geocoder not available'));
                return;
            }

            this.geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK') {
                    resolve(results);
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    /**
     * Use current location with comprehensive error handling
     */
    useCurrentLocation() {
        // Default coordinates for fallback (Muskingum County Courthouse)
        const defaultCoordinates = { lat: 39.94041, lng: -82.00734 };
        
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser');
            this.setFallbackLocation(defaultCoordinates, 'Geolocation not supported by this browser');
            return;
        }

        // Set timeout for geolocation request
        const timeout = 10000; // 10 seconds
        
        try {
            navigator.geolocation.getCurrentPosition(
                // Success callback
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.map.setCenter(location);
                    this.map.setZoom(18);
                    
                    // Add user location marker
                    new google.maps.Marker({
                        position: location,
                        map: this.map,
                        title: 'Your Location',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4">
                                    <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="3" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(24, 24)
                        }
                    });
                    
                    // Show success message
                    this.showSuccess('Location found successfully');
                },
                // Error callback with detailed error handling
                (error) => {
                    let errorMessage = 'Unable to get your location';
                    let userFriendlyMessage = '';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            userFriendlyMessage = 'Location access was denied. Using default location (Muskingum County Courthouse).';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            userFriendlyMessage = 'Your location could not be determined. Using default location (Muskingum County Courthouse).';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            userFriendlyMessage = 'Location request took too long. Using default location (Muskingum County Courthouse).';
                            break;
                        default:
                            errorMessage = 'Unknown geolocation error';
                            userFriendlyMessage = 'Could not get your location. Using default location (Muskingum County Courthouse).';
                            break;
                    }
                    
                    console.warn(`Geolocation error: ${errorMessage}`, error);
                    
                    // Set fallback location and show user-friendly message
                    this.setFallbackLocation(defaultCoordinates, userFriendlyMessage);
                },
                // Geolocation options
                {
                    enableHighAccuracy: true,
                    timeout: timeout,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        } catch (error) {
            console.error('Error requesting geolocation:', error);
            this.setFallbackLocation(defaultCoordinates, 'Using default location - geolocation unavailable');
        }
    }
    
    /**
     * Set fallback location when geolocation fails
     */
    setFallbackLocation(coordinates, message) {
        this.map.setCenter(coordinates);
        this.map.setZoom(15);
        
        // Add fallback location marker
        new google.maps.Marker({
            position: coordinates,
            map: this.map,
            title: 'Default Location - Muskingum County Courthouse',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#dc2626">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24)
            }
        });
        
        // Show informational message without blocking functionality
        this.showInfo(message);
    }

    /**
     * Initialize property overlay
     */
    initializePropertyOverlay() {
        if (this.propertyOverlayEnabled) {
            this.loadPropertyParcels();
        }
    }

    /**
     * Toggle property overlay
     */
    togglePropertyOverlay(type, enabled) {
        if (type === 'parcels') {
            this.propertyOverlayEnabled = enabled;
            if (enabled) {
                this.loadPropertyParcels();
            } else {
                this.hidePropertyParcels();
            }
        }
        this.saveSettings();
    }

    /**
     * Load property parcels
     */
    async loadPropertyParcels() {
        try {
            // In a real implementation, this would load from a GIS service
            // For now, we'll simulate with sample data
            this.simulateParcelOverlay();
        } catch (error) {
            console.error('Failed to load property parcels:', error);
            this.showError('Failed to load property data');
        }
    }

    /**
     * Simulate parcel overlay
     */
    simulateParcelOverlay() {
        // Create a sample parcel overlay
        const bounds = this.map.getBounds();
        if (!bounds) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Create sample parcel polygons
        const sampleParcels = [
            {
                id: 'P001',
                coordinates: [
                    { lat: ne.lat() - 0.001, lng: sw.lng() + 0.001 },
                    { lat: ne.lat() - 0.001, lng: sw.lng() + 0.003 },
                    { lat: ne.lat() - 0.003, lng: sw.lng() + 0.003 },
                    { lat: ne.lat() - 0.003, lng: sw.lng() + 0.001 }
                ],
                info: {
                    address: '123 Main Street',
                    area: '0.25 acres',
                    zoning: 'Residential'
                }
            }
        ];

        sampleParcels.forEach(parcel => {
            const polygon = new google.maps.Polygon({
                paths: parcel.coordinates,
                strokeColor: '#FF6B6B',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF6B6B',
                fillOpacity: this.overlayOpacity * 0.3,
                map: this.map
            });

            polygon.addListener('click', () => {
                this.showParcelInfo(parcel);
            });

            this.overlays.set(parcel.id, polygon);
        });
    }

    /**
     * Show parcel information
     */
    showParcelInfo(parcel) {
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="parcel-info">
                    <h4>Property Information</h4>
                    <p><strong>Address:</strong> ${parcel.info.address}</p>
                    <p><strong>Area:</strong> ${parcel.info.area}</p>
                    <p><strong>Zoning:</strong> ${parcel.info.zoning}</p>
                    <p><strong>Parcel ID:</strong> ${parcel.id}</p>
                </div>
            `
        });

        // Calculate center of parcel
        const bounds = new google.maps.LatLngBounds();
        parcel.coordinates.forEach(coord => bounds.extend(coord));
        const center = bounds.getCenter();

        infoWindow.setPosition(center);
        infoWindow.open(this.map);
    }

    /**
     * Hide property parcels
     */
    hidePropertyParcels() {
        this.overlays.forEach(overlay => {
            overlay.setMap(null);
        });
        this.overlays.clear();
    }

    /**
     * Load property information
     */
    async loadPropertyInfo(location) {
        // In a real implementation, this would query a property database
        console.log('Loading property info for:', location);
    }

    /**
     * Initialize zoom optimization
     */
    initializeZoomOptimization() {
        this.updateZoomInfo();
    }

    /**
     * Zoom to specific level
     */
    zoomToLevel(level) {
        const zoomLevels = {
            property: 19,
            parcel: 18,
            satellite: 17,
            street: 16
        };

        const zoom = zoomLevels[level];
        if (zoom) {
            this.map.setZoom(zoom);
        }
    }

    /**
     * Update zoom information
     */
    updateZoomInfo() {
        const zoom = this.map.getZoom();
        const zoomDisplay = document.getElementById('current-zoom');
        const scaleDisplay = document.getElementById('current-scale');

        if (zoomDisplay) {
            zoomDisplay.textContent = zoom;
        }

        if (scaleDisplay) {
            // Approximate scale calculation
            const scale = Math.round(591657527.591555 / Math.pow(2, zoom));
            scaleDisplay.textContent = `1:${scale.toLocaleString()}`;
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {
            imageryType: this.currentImageryType,
            units: this.currentUnits,
            overlayOpacity: this.overlayOpacity,
            propertyOverlayEnabled: this.propertyOverlayEnabled,
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem('visualAccuracySettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Load saved settings
     */
    loadSavedSettings() {
        try {
            const savedSettings = localStorage.getItem('visualAccuracySettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                this.currentImageryType = settings.imageryType || this.currentImageryType;
                this.currentUnits = settings.units || this.currentUnits;
                this.overlayOpacity = settings.overlayOpacity || this.overlayOpacity;
                this.propertyOverlayEnabled = settings.propertyOverlayEnabled || this.propertyOverlayEnabled;
                
                // Update UI to reflect loaded settings
                this.updateTransparencyUI(this.overlayOpacity);
                this.updateMeasurementDisplay();
            }
        } catch (error) {
            console.error('Failed to load saved settings:', error);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error', '⚠️', '#f44336');
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success', '✅', '#4caf50');
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.showNotification(message, 'info', 'ℹ️', '#2196f3');
    }

    /**
     * Show notification with custom styling
     */
    showNotification(message, type, icon, color) {
        // Create notification
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `${type}-notification notification`;
        notificationDiv.style.backgroundColor = color;
        notificationDiv.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notificationDiv);

        // Auto-remove based on message type
        const timeout = type === 'error' ? 5000 : type === 'success' ? 3000 : 4000;
        setTimeout(() => {
            if (notificationDiv.parentElement) {
                notificationDiv.remove();
            }
        }, timeout);
    }

    /**
     * Get current measurement data
     */
    getMeasurementData() {
        return {
            imageryType: this.currentImageryType,
            units: this.currentUnits,
            overlayOpacity: this.overlayOpacity,
            propertyOverlayEnabled: this.propertyOverlayEnabled,
            imageryQuality: this.imageryQuality,
            imageryDate: this.imageryDate
        };
    }

    /**
     * Update measurement from external source
     */
    updateMeasurement(area, originalUnits) {
        const measurementData = {
            area: area,
            originalUnits: originalUnits,
            timestamp: new Date().toISOString()
        };

        storeMeasurementData('visual-accuracy', measurementData);
        this.updateMeasurementDisplay();
    }

    /**
     * Add custom styles
     */
    addStyles() {
        if (document.getElementById('visual-accuracy-styles')) return;

        const style = document.createElement('style');
        style.id = 'visual-accuracy-styles';
        style.textContent = `
            .visual-accuracy-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 320px;
                margin: 10px;
                z-index: 1000;
            }

            .visual-accuracy-controls .card {
                background: white;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
            }

            .visual-accuracy-controls h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                color: #333;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .visual-accuracy-controls .icon {
                font-size: 16px;
            }

            /* Imagery Controls */
            .imagery-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 12px;
            }

            .imagery-option {
                position: relative;
            }

            .imagery-option input[type="radio"] {
                display: none;
            }

            .imagery-option label {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .imagery-option input[type="radio"]:checked + label {
                border-color: #4285F4;
                background: #f8f9ff;
            }

            .imagery-preview {
                width: 40px;
                height: 24px;
                border-radius: 4px;
                margin-bottom: 4px;
                border: 1px solid #ddd;
            }

            .satellite-preview {
                background: linear-gradient(45deg, #8B4513, #228B22);
            }

            .hybrid-preview {
                background: linear-gradient(45deg, #8B4513, #228B22, #ffffff);
            }

            .terrain-preview {
                background: linear-gradient(45deg, #90EE90, #8B4513);
            }

            .roadmap-preview {
                background: linear-gradient(45deg, #ffffff, #f0f0f0);
            }

            .imagery-label {
                font-size: 12px;
                color: #666;
                text-align: center;
            }

            .imagery-info {
                border-top: 1px solid #e0e0e0;
                padding-top: 8px;
                font-size: 12px;
            }

            .imagery-quality {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .quality-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .quality-indicator.high {
                background: #4CAF50;
            }

            .quality-indicator.medium {
                background: #FF9800;
            }

            .quality-indicator.low {
                background: #F44336;
            }

            .imagery-date {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #666;
            }

            /* Transparency Controls */
            .transparency-slider-container {
                margin-bottom: 12px;
            }

            .transparency-slider {
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: #e0e0e0;
                outline: none;
                -webkit-appearance: none;
            }

            .transparency-slider::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #4285F4;
                cursor: pointer;
            }

            .transparency-labels {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #666;
                margin-top: 4px;
            }

            .transparency-presets {
                display: flex;
                gap: 4px;
            }

            .preset-btn {
                flex: 1;
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s;
            }

            .preset-btn:hover {
                background: #f5f5f5;
            }

            .preset-btn.active {
                background: #4285F4;
                color: white;
                border-color: #4285F4;
            }

            /* Measurement Controls */
            .units-toggle {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 12px;
            }

            .unit-option {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .unit-option input[type="radio"] {
                margin: 0;
            }

            .unit-option label {
                font-size: 13px;
                color: #333;
                cursor: pointer;
            }

            .measurement-display {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 12px;
                color: #666;
            }

            /* Search Controls */
            .search-container {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
            }

            .search-input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
            }

            .search-btn,
            .location-btn {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .search-btn:hover,
            .location-btn:hover {
                background: #f5f5f5;
            }

            .search-results {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 12px;
            }

            .search-result-item {
                padding: 8px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                transition: background 0.2s;
            }

            .search-result-item:hover {
                background: #f5f5f5;
            }

            .search-result-item:last-child {
                border-bottom: none;
            }

            .result-main {
                font-size: 13px;
                color: #333;
                font-weight: 500;
            }

            .result-secondary {
                font-size: 12px;
                color: #666;
            }

            .search-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .search-option {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #666;
                cursor: pointer;
            }

            /* Property Overlay Controls */
            .overlay-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .overlay-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 0;
            }

            .overlay-option input[type="checkbox"] {
                margin-right: 8px;
            }

            .overlay-label {
                flex: 1;
                font-size: 13px;
                color: #333;
            }

            .overlay-status {
                font-size: 11px;
                color: #666;
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 10px;
            }

            /* Zoom Controls */
            .zoom-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                margin-bottom: 12px;
            }

            .zoom-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .zoom-btn:hover {
                background: #f5f5f5;
                border-color: #4285F4;
            }

            .zoom-icon {
                font-size: 16px;
                margin-bottom: 4px;
            }

            .zoom-label {
                font-size: 11px;
                color: #666;
            }

            .zoom-info {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #666;
                padding-top: 8px;
                border-top: 1px solid #e0e0e0;
            }

            /* Error Notifications */
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #f44336;
                color: white;
                border-radius: 8px;
                padding: 12px 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease-out;
            }

            .error-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .error-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            /* Parcel Info Window */
            .parcel-info {
                min-width: 200px;
                font-size: 13px;
            }

            .parcel-info h4 {
                margin: 0 0 8px 0;
                color: #333;
            }

            .parcel-info p {
                margin: 4px 0;
                color: #666;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .visual-accuracy-container {
                    max-width: 280px;
                }

                .imagery-options {
                    grid-template-columns: 1fr;
                }

                .zoom-buttons {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Remove overlays
        this.overlays.forEach(overlay => {
            overlay.setMap(null);
        });
        this.overlays.clear();

        // Remove parcel layer
        if (this.parcelLayer) {
            this.parcelLayer.setMap(null);
        }

        // Remove controls from map
        const container = document.querySelector('.visual-accuracy-container');
        if (container && container.parentElement) {
            container.parentElement.removeChild(container);
        }

        // Remove styles
        const styles = document.getElementById('visual-accuracy-styles');
        if (styles) {
            styles.remove();
        }
    }
}
