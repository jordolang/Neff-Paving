export class DrawingService {
  constructor(map) {
    this.map = map;
    this.polygons = [];
    this.currentPolygon = null;
    this.isDrawing = false;
    
    // Initialize drawing manager
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      polygonOptions: {
        fillColor: '#ff0000',
        fillOpacity: 0.35,
        strokeWeight: 2,
        strokeColor: '#ff0000',
        clickable: true,
        editable: true,
        zIndex: 1
      }
    });

    // Set the drawing manager on the map
    this.drawingManager.setMap(this.map);

    // Initialize event listeners
    this._initializeEventListeners();
    
    // Initialize mobile touch controls
    this._initializeMobileControls();
  }

  /**
   * Initialize event listeners for polygon completion and interactions
   */
  _initializeEventListeners() {
    // Listen for polygon completion
    this.drawingManager.addListener('polygoncomplete', (polygon) => {
      this._onPolygonComplete(polygon);
    });

    // Listen for drawing mode changes
    this.drawingManager.addListener('drawingmode_changed', () => {
      this.isDrawing = this.drawingManager.getDrawingMode() !== null;
    });
  }

  /**
   * Handle polygon completion
   */
  _onPolygonComplete(polygon) {
    // Add to polygons array
    this.polygons.push(polygon);
    this.currentPolygon = polygon;

    // Calculate and display area
    const area = this.calculateArea(polygon.getPath());
    const areaText = this.formatArea(area);

    // Create info window to display area
    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 10px;">
                  <strong>Area:</strong> ${areaText}
                  <br>
                  <button onclick="drawingService.removePolygon('${this.polygons.length - 1}')" 
                          style="margin-top: 5px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Remove
                  </button>
                </div>`,
      position: this._getPolygonCenter(polygon)
    });

    // Store info window reference on polygon
    polygon.infoWindow = infoWindow;

    // Add click listener to polygon to show/hide info window
    polygon.addListener('click', (event) => {
      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindow.setPosition(event.latLng);
        infoWindow.open(this.map);
      }
    });

    // Add path change listener for real-time area updates
    polygon.getPath().addListener('set_at', () => {
      this._updatePolygonArea(polygon);
    });

    polygon.getPath().addListener('insert_at', () => {
      this._updatePolygonArea(polygon);
    });

    polygon.getPath().addListener('remove_at', () => {
      this._updatePolygonArea(polygon);
    });

    // Show area immediately
    infoWindow.open(this.map);

    // Disable drawing mode after completion
    this.drawingManager.setDrawingMode(null);

    // Trigger custom event
    this._triggerEvent('polygonCreated', {
      polygon: polygon,
      area: area,
      areaText: areaText
    });
  }

  /**
   * Calculate area of a polygon path
   */
  calculateArea(path) {
    return google.maps.geometry.spherical.computeArea(path);
  }

  /**
   * Format area value for display
   */
  formatArea(area) {
    if (area < 1000000) {
      return `${Math.round(area)} m²`;
    } else {
      return `${(area / 1000000).toFixed(2)} km²`;
    }
  }

  /**
   * Update polygon area display
   */
  _updatePolygonArea(polygon) {
    const area = this.calculateArea(polygon.getPath());
    const areaText = this.formatArea(area);
    
    if (polygon.infoWindow) {
      const index = this.polygons.indexOf(polygon);
      polygon.infoWindow.setContent(`<div style="padding: 10px;">
                                      <strong>Area:</strong> ${areaText}
                                      <br>
                                      <button onclick="drawingService.removePolygon('${index}')" 
                                              style="margin-top: 5px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                        Remove
                                      </button>
                                    </div>`);
    }

    // Trigger update event
    this._triggerEvent('polygonUpdated', {
      polygon: polygon,
      area: area,
      areaText: areaText
    });
  }

  /**
   * Get center point of polygon for info window positioning
   */
  _getPolygonCenter(polygon) {
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().getArray().forEach(point => {
      bounds.extend(point);
    });
    return bounds.getCenter();
  }

  /**
   * Enable drawing mode
   */
  enableDrawing() {
    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }

  /**
   * Disable drawing mode
   */
  disableDrawing() {
    this.drawingManager.setDrawingMode(null);
  }

  /**
   * Toggle drawing mode
   */
  toggleDrawing() {
    if (this.isDrawing) {
      this.disableDrawing();
    } else {
      this.enableDrawing();
    }
  }

  /**
   * Remove a specific polygon
   */
  removePolygon(index) {
    if (this.polygons[index]) {
      const polygon = this.polygons[index];
      
      // Close and remove info window
      if (polygon.infoWindow) {
        polygon.infoWindow.close();
      }
      
      // Remove polygon from map
      polygon.setMap(null);
      
      // Remove from array
      this.polygons.splice(index, 1);

      // Trigger removal event
      this._triggerEvent('polygonRemoved', { index: index });
    }
  }

  /**
   * Clear all polygons and reset
   */
  clearAll() {
    // Remove all polygons
    this.polygons.forEach(polygon => {
      if (polygon.infoWindow) {
        polygon.infoWindow.close();
      }
      polygon.setMap(null);
    });

    // Clear arrays
    this.polygons = [];
    this.currentPolygon = null;

    // Disable drawing mode
    this.disableDrawing();

    // Trigger clear event
    this._triggerEvent('allPolygonsCleared');
  }

  /**
   * Get total area of all polygons
   */
  getTotalArea() {
    return this.polygons.reduce((total, polygon) => {
      return total + this.calculateArea(polygon.getPath());
    }, 0);
  }

  /**
   * Get formatted total area
   */
  getFormattedTotalArea() {
    return this.formatArea(this.getTotalArea());
  }

  /**
   * Initialize mobile-friendly touch controls
   */
  _initializeMobileControls() {
    // Create mobile control panel
    const controlDiv = document.createElement('div');
    controlDiv.className = 'drawing-controls';
    controlDiv.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      padding: 10px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    // Draw button
    const drawButton = document.createElement('button');
    drawButton.textContent = '✏️ Draw';
    drawButton.className = 'draw-btn';
    drawButton.style.cssText = `
      padding: 12px 16px;
      border: none;
      border-radius: 6px;
      background: #4285f4;
      color: white;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      touch-action: manipulation;
    `;

    // Clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = '🗑️ Clear';
    clearButton.className = 'clear-btn';
    clearButton.style.cssText = `
      padding: 12px 16px;
      border: none;
      border-radius: 6px;
      background: #ea4335;
      color: white;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      touch-action: manipulation;
    `;

    // Area display
    const areaDisplay = document.createElement('div');
    areaDisplay.className = 'area-display';
    areaDisplay.style.cssText = `
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      min-width: 100px;
      text-align: center;
    `;
    areaDisplay.textContent = 'Total: 0 m²';

    // Add buttons to control div
    controlDiv.appendChild(drawButton);
    controlDiv.appendChild(clearButton);
    controlDiv.appendChild(areaDisplay);

    // Add to map
    this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(controlDiv);

    // Store references
    this.mobileControls = {
      container: controlDiv,
      drawButton: drawButton,
      clearButton: clearButton,
      areaDisplay: areaDisplay
    };

    // Add event listeners
    drawButton.addEventListener('click', () => {
      this.toggleDrawing();
      this._updateMobileControls();
    });

    drawButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.toggleDrawing();
      this._updateMobileControls();
    });

    clearButton.addEventListener('click', () => {
      this.clearAll();
      this._updateMobileControls();
    });

    clearButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.clearAll();
      this._updateMobileControls();
    });

    // Update controls initially
    this._updateMobileControls();
  }

  /**
   * Update mobile control states
   */
  _updateMobileControls() {
    if (!this.mobileControls) return;

    const { drawButton, areaDisplay } = this.mobileControls;

    // Update draw button
    if (this.isDrawing) {
      drawButton.textContent = '⏹️ Stop';
      drawButton.style.background = '#ff9800';
    } else {
      drawButton.textContent = '✏️ Draw';
      drawButton.style.background = '#4285f4';
    }

    // Update area display
    areaDisplay.textContent = `Total: ${this.getFormattedTotalArea()}`;
  }

  /**
   * Trigger custom events
   */
  _triggerEvent(eventName, data = {}) {
    const event = new CustomEvent(`drawingService:${eventName}`, {
      detail: data
    });
    document.dispatchEvent(event);

    // Update mobile controls on any polygon change
    if (eventName.includes('polygon') || eventName.includes('clear')) {
      this._updateMobileControls();
    }
  }

  /**
   * Show/hide mobile controls
   */
  showMobileControls() {
    if (this.mobileControls?.container) {
      this.mobileControls.container.style.display = 'flex';
    }
  }

  hideMobileControls() {
    if (this.mobileControls?.container) {
      this.mobileControls.container.style.display = 'none';
    }
  }

  /**
   * Check if device is mobile
   */
  _isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get all polygons
   */
  getPolygons() {
    return this.polygons;
  }

  /**
   * Get polygon count
   */
  getPolygonCount() {
    return this.polygons.length;
  }

  /**
   * Export polygon data
   */
  exportPolygonData() {
    return this.polygons.map((polygon, index) => ({
      id: index,
      path: polygon.getPath().getArray().map(point => ({
        lat: point.lat(),
        lng: point.lng()
      })),
      area: this.calculateArea(polygon.getPath()),
      areaText: this.formatArea(this.calculateArea(polygon.getPath()))
    }));
  }

  /**
   * Import polygon data
   */
  importPolygonData(polygonData) {
    // Clear existing polygons first
    this.clearAll();

    polygonData.forEach(data => {
      const path = data.path.map(point => new google.maps.LatLng(point.lat, point.lng));
      
      const polygon = new google.maps.Polygon({
        paths: path,
        fillColor: '#ff0000',
        fillOpacity: 0.35,
        strokeWeight: 2,
        strokeColor: '#ff0000',
        clickable: true,
        editable: true,
        zIndex: 1
      });

      polygon.setMap(this.map);
      
      // Simulate polygon completion to set up event listeners and info windows
      this._onPolygonComplete(polygon);
    });
  }

  /**
   * Destroy the drawing service and clean up
   */
  destroy() {
    // Clear all polygons
    this.clearAll();

    // Remove drawing manager
    this.drawingManager.setMap(null);

    // Remove mobile controls
    if (this.mobileControls?.container) {
      this.mobileControls.container.remove();
    }

    // Clear references
    this.map = null;
    this.drawingManager = null;
    this.mobileControls = null;
  }
}
