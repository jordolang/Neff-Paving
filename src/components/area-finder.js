import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_OPTIONS, DRAWING_MANAGER_OPTIONS, AREA_UNITS } from '../config/maps.js';

export class AreaFinder {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            showCalculator: true,
            showAddressSearch: true,
            showAreaInfo: true,
            onAreaCalculated: () => {},
            ...options
        };
        
        this.map = null;
        this.drawingManager = null;
        this.currentShape = null;
        this.currentArea = null;
        this.geocoder = null;
        this.searchBox = null;
        
        if (!this.container) {
            throw new Error(`Container with ID "${containerId}" not found`);
        }
        
        this.init();
    }

    async init() {
        try {
            this.render();
            await this.loadGoogleMaps();
            this.initMap();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing area finder:', error);
            this.showError('Failed to initialize area finder');
        }
    }

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
                                <span class="result-value" id="area-sqft">0 sq ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Perimeter:</span>
                                <span class="result-value" id="perimeter-ft">0 ft</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Acres:</span>
                                <span class="result-value" id="area-acres">0 acres</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Square Meters:</span>
                                <span class="result-value" id="area-sqm">0 m²</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('area-finder-styles')) return;

        const style = document.createElement('style');
        style.id = 'area-finder-styles';
        style.textContent = `
            .area-finder-container {
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .area-finder-controls {
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                align-items: end;
            }

            .search-section {
                flex: 1;
                min-width: 300px;
            }

            .search-section label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #374151;
            }

            .search-input-group {
                display: flex;
                gap: 8px;
            }

            .search-input-group input {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 14px;
            }

            .search-input-group input:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
            }

            .drawing-controls {
                display: flex;
                gap: 10px;
            }

            .btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                border: 1px solid transparent;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #2563eb;
                color: white;
                border-color: #2563eb;
            }

            .btn-primary:hover {
                background: #1d4ed8;
            }

            .btn-outline-danger {
                color: #dc2626;
                border-color: #dc2626;
                background: transparent;
            }

            .btn-outline-danger:hover {
                background: #dc2626;
                color: white;
            }

            .btn-outline-success {
                color: #16a34a;
                border-color: #16a34a;
                background: transparent;
            }

            .btn-outline-success:hover {
                background: #16a34a;
                color: white;
            }

            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .map-section {
                position: relative;
            }

            .area-finder-map {
                height: 500px;
                width: 100%;
            }

            .map-instructions {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(255, 255, 255, 0.95);
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                max-width: 300px;
                font-size: 13px;
                z-index: 10;
            }

            .map-instructions h6 {
                margin: 0 0 10px 0;
                color: #1f2937;
                font-weight: 600;
            }

            .map-instructions ul {
                margin: 0;
                padding-left: 16px;
                color: #6b7280;
            }

            .map-instructions li {
                margin-bottom: 4px;
            }

            .area-info-section {
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .area-results {
                background: white;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #e5e7eb;
            }

            .area-results h6 {
                margin: 0 0 15px 0;
                color: #1f2937;
                font-weight: 600;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .result-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f9fafb;
                border-radius: 6px;
                border: 1px solid #f3f4f6;
            }

            .result-label {
                font-weight: 500;
                color: #6b7280;
            }

            .result-value {
                font-weight: 600;
                color: #1f2937;
                font-family: 'Courier New', monospace;
            }

            .error-message {
                background: #fef2f2;
                color: #dc2626;
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid #fecaca;
                margin: 10px;
            }

            @media (max-width: 768px) {
                .area-finder-controls {
                    flex-direction: column;
                    align-items: stretch;
                }

                .search-input-group {
                    flex-direction: column;
                }

                .drawing-controls {
                    justify-content: center;
                }

                .results-grid {
                    grid-template-columns: 1fr;
                }

                .map-instructions {
                    position: static;
                    margin: 10px;
                    max-width: none;
                }
            }
        `;

        document.head.appendChild(style);
    }

    async loadGoogleMaps() {
        return new Promise((resolve, reject) => {
            if (typeof google !== 'undefined' && google.maps) {
                resolve();
                return;
            }

            window.initAreaFinderMap = () => {
                delete window.initAreaFinderMap;
                resolve();
            };

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&callback=initAreaFinderMap`;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initMap() {
        const mapElement = document.getElementById(`${this.containerId}-map`);
        
        this.map = new google.maps.Map(mapElement, {
            ...DEFAULT_MAP_OPTIONS,
            center: { lat: 39.9612, lng: -82.9988 } // Columbus, Ohio
        });

        this.geocoder = new google.maps.Geocoder();
        this.initDrawingManager();
        this.initSearchBox();
    }

    initDrawingManager() {
        this.drawingManager = new google.maps.drawing.DrawingManager({
            ...DRAWING_MANAGER_OPTIONS,
            map: this.map
        });

        google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event) => {
            this.handleShapeComplete(event);
        });
    }

    initSearchBox() {
        const searchInput = document.getElementById('address-search');
        if (!searchInput) return;

        this.searchBox = new google.maps.places.SearchBox(searchInput);
        
        this.map.addListener('bounds_changed', () => {
            this.searchBox.setBounds(this.map.getBounds());
        });

        this.searchBox.addListener('places_changed', () => {
            const places = this.searchBox.getPlaces();
            if (places.length === 0) return;

            const place = places[0];
            if (!place.geometry || !place.geometry.location) return;

            this.map.setCenter(place.geometry.location);
            this.map.setZoom(18);
        });
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        const clearBtn = document.getElementById('clear-shapes');
        const calculateBtn = document.getElementById('calculate-area');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchLocation());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearShapes());
        }

        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateArea());
        }

        // Enter key for search
        const searchInput = document.getElementById('address-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLocation();
                }
            });
        }
    }

    handleShapeComplete(event) {
        // Remove previous shape
        if (this.currentShape) {
            this.currentShape.setMap(null);
        }

        this.currentShape = event.overlay;
        this.drawingManager.setDrawingMode(null);

        // Enable buttons
        this.enableButton('clear-shapes');
        this.enableButton('calculate-area');

        // Auto-calculate area if option is enabled
        if (this.options.autoCalculate !== false) {
            this.calculateArea();
        }
    }

    async calculateArea() {
        if (!this.currentShape) {
            this.showError('No shape to calculate. Please draw a shape first.');
            return;
        }

        try {
            const coordinates = this.getShapeCoordinates(this.currentShape);
            
            // Send to backend for calculation
            const response = await fetch('/backend/routes/maps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coordinates })
            });

            const result = await response.json();

            if (result.success) {
                this.displayAreaResults(result.data);
                this.currentArea = result.data;
                this.options.onAreaCalculated(result.data);
            } else {
                throw new Error(result.message || 'Calculation failed');
            }
        } catch (error) {
            console.error('Area calculation error:', error);
            this.showError('Failed to calculate area. Please try again.');
        }
    }

    getShapeCoordinates(shape) {
        let coordinates = [];

        if (shape.getPath) {
            // Polygon
            const path = shape.getPath();
            for (let i = 0; i < path.getLength(); i++) {
                const latLng = path.getAt(i);
                coordinates.push({
                    lat: latLng.lat(),
                    lng: latLng.lng()
                });
            }
        } else if (shape.getBounds) {
            // Rectangle or Circle
            const bounds = shape.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            
            if (shape.getRadius) {
                // Circle - convert to polygon approximation
                const center = shape.getCenter();
                const radius = shape.getRadius();
                const points = 32; // Number of points for circle approximation
                
                for (let i = 0; i < points; i++) {
                    const angle = (i * 360 / points) * (Math.PI / 180);
                    const lat = center.lat() + (radius / 111320) * Math.cos(angle);
                    const lng = center.lng() + (radius / (111320 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle);
                    coordinates.push({ lat, lng });
                }
            } else {
                // Rectangle
                coordinates = [
                    { lat: ne.lat(), lng: ne.lng() },
                    { lat: ne.lat(), lng: sw.lng() },
                    { lat: sw.lat(), lng: sw.lng() },
                    { lat: sw.lat(), lng: ne.lng() }
                ];
            }
        }

        return coordinates;
    }

    displayAreaResults(data) {
        const resultsContainer = document.getElementById('area-results');
        if (!resultsContainer) return;

        document.getElementById('area-sqft').textContent = `${data.areaInSquareFeet.toLocaleString()} sq ft`;
        document.getElementById('perimeter-ft').textContent = `${(data.perimeter * 3.28084).toFixed(2)} ft`;
        document.getElementById('area-acres').textContent = `${data.areaInAcres} acres`;
        document.getElementById('area-sqm').textContent = `${data.area.toLocaleString()} m²`;

        resultsContainer.style.display = 'block';
    }

    searchLocation() {
        const searchInput = document.getElementById('address-search');
        const query = searchInput.value.trim();

        if (!query) {
            this.showError('Please enter an address or coordinates');
            return;
        }

        this.geocoder.geocode({ address: query }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                this.map.setCenter(location);
                this.map.setZoom(18);

                // Add marker
                new google.maps.Marker({
                    position: location,
                    map: this.map,
                    title: 'Search Result'
                });
            } else {
                this.showError('Location not found. Please try a different address.');
            }
        });
    }

    clearShapes() {
        if (this.currentShape) {
            this.currentShape.setMap(null);
            this.currentShape = null;
        }

        // Hide results
        const resultsContainer = document.getElementById('area-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }

        // Disable buttons
        this.disableButton('clear-shapes');
        this.disableButton('calculate-area');

        this.currentArea = null;
    }

    enableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
        }
    }

    disableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.container.insertBefore(errorDiv, this.container.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Public methods
    getAreaData() {
        return this.currentArea;
    }

    setLocation(lat, lng, zoom = 18) {
        if (this.map) {
            this.map.setCenter({ lat, lng });
            this.map.setZoom(zoom);
        }
    }

    destroy() {
        if (this.currentShape) {
            this.currentShape.setMap(null);
        }
        
        if (this.drawingManager) {
            this.drawingManager.setMap(null);
        }
        
        this.container.innerHTML = '';
    }
}