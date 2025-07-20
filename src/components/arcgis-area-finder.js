import { storeMeasurementData, getMeasurementData } from '../utils/measurement-storage.js';
import { AreaFinder } from './area-finder.js';

// Error types for better error handling
const ERROR_TYPES = {
  ARCGIS_LOAD_FAILED: 'arcgis_load_failed',
  ARCGIS_INIT_FAILED: 'arcgis_init_failed',
  ARCGIS_MEASUREMENT_FAILED: 'arcgis_measurement_failed',
  NETWORK_ERROR: 'network_error',
  BROWSER_COMPATIBILITY: 'browser_compatibility'
};

// Error messages for user display
const ERROR_MESSAGES = {
  [ERROR_TYPES.ARCGIS_LOAD_FAILED]: 'Unable to load 3D mapping tools. Switching to 2D mapping.',
  [ERROR_TYPES.ARCGIS_INIT_FAILED]: 'Failed to initialize 3D mapping. Using alternative mapping tools.',
  [ERROR_TYPES.ARCGIS_MEASUREMENT_FAILED]: 'Measurement failed. Please try again or use manual input.',
  [ERROR_TYPES.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection.',
  [ERROR_TYPES.BROWSER_COMPATIBILITY]: 'Your browser may not support 3D mapping. Using 2D mapping instead.'
};

// Dynamic imports for ArcGIS modules with error handling
let ArcGISModules = null;

async function loadArcGISModules() {
  try {
    const modules = await Promise.all([
      import('@arcgis/core/views/SceneView'),
      import('@arcgis/core/Map'),
      import('@arcgis/core/widgets/DirectLineMeasurement3D'),
      import('@arcgis/core/widgets/AreaMeasurement3D'),
      import('@arcgis/core/geometry/geometryEngine'),
      import('@arcgis/core/geometry/support/webMercatorUtils')
    ]);
    
    ArcGISModules = {
      SceneView: modules[0].default,
      Map: modules[1].default,
      DirectLineMeasurement3D: modules[2].default,
      AreaMeasurement3D: modules[3].default,
      geometryEngine: modules[4],
      webMercatorUtils: modules[5]
    };
    
    return true;
  } catch (error) {
    console.error('Failed to load ArcGIS modules:', error);
    return false;
  }
}

/**
 * ArcGIS Area Finder - 3D Measurement Tools Integration
 * Handles initialization of ArcGIS Scene component and measurement tools
 */
class ArcGISAreaFinder {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      fallbackToGoogleMaps: true,
      enableErrorLogging: true,
      showUserFriendlyErrors: true,
      enableManualInput: true,
      onError: null,
      onFallback: null,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };
    
    this.map = null;
    this.view = null;
    this.directLineMeasurement = null;
    this.areaMeasurement = null;
    this.fallbackInstance = null;
    this.isInitialized = false;
    this.isFallbackActive = false;
    this.retryCount = 0;
    this.errorHistory = [];
    
    this.measurementData = {
      areas: [],
      distances: [],
      activeMode: null
    };
    
    this.unitConversions = {
      // Square meters to other units
      sqm: {
        sqft: 10.7639,
        acres: 0.000247105,
        sqm: 1
      },
      // Meters to other units
      meters: {
        feet: 3.28084,
        meters: 1
      }
    };
  }

  /**
   * Initialize the ArcGIS Scene component with error handling and fallback
   */
  async initialize() {
    while (this.retryCount < this.options.retryAttempts) {
      try {
        // First, try to load ArcGIS modules
        const modulesLoaded = await loadArcGISModules();
        if (!modulesLoaded) {
          throw new Error('Failed to load ArcGIS modules');
        }

        // Check browser compatibility
        if (!this.checkBrowserCompatibility()) {
          throw new Error('Browser not compatible with ArcGIS 3D');
        }

        // Create the map
        this.map = new ArcGISModules.Map({
          basemap: 'satellite',
          ground: 'world-elevation'
        });

        // Create the scene view with timeout
        this.view = new ArcGISModules.SceneView({
          container: this.container,
          map: this.map,
          camera: {
            position: {
              x: -118.808,
              y: 33.961,
              z: 2000
            },
            heading: 0,
            tilt: 60
          }
        });

        // Wait for the view to load with timeout
        await this.waitForViewWithTimeout();

        // Initialize measurement tools
        this.initializeMeasurementTools();
        
        // Initialize with previous measurement data if available
        this.initializePreviousData();
        
        this.isInitialized = true;
        return this.view;
        
      } catch (error) {
        this.retryCount++;
        this.logError(error, ERROR_TYPES.ARCGIS_INIT_FAILED);
        
        if (this.retryCount < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay);
          continue;
        }
        
        // All retries failed, attempt fallback
        return await this.handleInitializationFailure(error);
      }
    }
  }

  /**
   * Check browser compatibility for ArcGIS 3D
   */
  checkBrowserCompatibility() {
    try {
      // Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return false;
      }
      
      // Check for required features
      const requiredExtensions = ['OES_element_index_uint'];
      for (const ext of requiredExtensions) {
        if (!gl.getExtension(ext)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for view to load with timeout
   */
  async waitForViewWithTimeout(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('View initialization timeout'));
      }, timeout);
      
      this.view.when().then(() => {
        clearTimeout(timeoutId);
        resolve();
      }).catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Handle initialization failure and attempt fallback
   */
  async handleInitializationFailure(error) {
    this.logError(error, ERROR_TYPES.ARCGIS_INIT_FAILED);
    
    if (this.options.fallbackToGoogleMaps) {
      try {
        await this.initializeFallback();
        return { fallback: true, instance: this.fallbackInstance };
      } catch (fallbackError) {
        this.logError(fallbackError, ERROR_TYPES.ARCGIS_LOAD_FAILED);
        
        if (this.options.enableManualInput) {
          this.showManualInputOption();
        }
        
        throw new Error('Both ArcGIS and fallback initialization failed');
      }
    } else {
      if (this.options.enableManualInput) {
        this.showManualInputOption();
      }
      
      throw error;
    }
  }

  /**
   * Initialize Google Maps fallback
   */
  async initializeFallback() {
    try {
      this.showUserMessage('Switching to 2D mapping tools...', 'info');
      
      // Create a new container for Google Maps if needed
      const fallbackContainer = this.container.id || 'arcgis-fallback';
      
      this.fallbackInstance = new AreaFinder(fallbackContainer, {
        onAreaCalculated: (data) => {
          this.handleFallbackAreaCalculated(data);
        }
      });
      
      this.isFallbackActive = true;
      
      if (this.options.onFallback) {
        this.options.onFallback(this.fallbackInstance);
      }
      
      return this.fallbackInstance;
    } catch (error) {
      throw new Error('Failed to initialize Google Maps fallback: ' + error.message);
    }
  }

  /**
   * Handle area calculation from fallback
   */
  handleFallbackAreaCalculated(data) {
    // Convert Google Maps data to ArcGIS format
    const convertedData = {
      id: Date.now(),
      originalValue: data.area,
      originalUnit: 'sqm',
      geometry: null,
      timestamp: new Date(),
      source: 'google-maps-fallback'
    };
    
    this.measurementData.areas.push(convertedData);
    this.storeMeasurementData();
    
    if (this.onMeasurementComplete) {
      this.onMeasurementComplete('area', convertedData);
    }
  }

  /**
   * Show manual input option
   */
  showManualInputOption() {
    const manualInputHTML = `
      <div class="manual-input-container">
        <h6>Manual Area Input</h6>
        <p>Unable to load mapping tools. Please enter area manually:</p>
        <div class="input-group">
          <input type="number" id="manual-area-input" placeholder="Enter area" class="form-control">
          <select id="manual-unit-select" class="form-select">
            <option value="sqft">Square Feet</option>
            <option value="sqm">Square Meters</option>
            <option value="acres">Acres</option>
          </select>
          <button type="button" id="manual-submit-btn" class="btn btn-primary">Add Area</button>
        </div>
      </div>
    `;
    
    this.container.innerHTML = manualInputHTML;
    
    // Add event listener for manual input
    document.getElementById('manual-submit-btn').addEventListener('click', () => {
      this.handleManualInput();
    });
  }

  /**
   * Handle manual area input
   */
  handleManualInput() {
    const areaInput = document.getElementById('manual-area-input');
    const unitSelect = document.getElementById('manual-unit-select');
    
    const area = parseFloat(areaInput.value);
    const unit = unitSelect.value;
    
    if (isNaN(area) || area <= 0) {
      this.showUserMessage('Please enter a valid area value', 'error');
      return;
    }
    
    const areaData = {
      id: Date.now(),
      originalValue: area,
      originalUnit: unit,
      geometry: null,
      timestamp: new Date(),
      source: 'manual-input'
    };
    
    this.measurementData.areas.push(areaData);
    this.storeMeasurementData();
    
    if (this.onMeasurementComplete) {
      this.onMeasurementComplete('area', areaData);
    }
    
    this.showUserMessage('Area added successfully', 'success');
    areaInput.value = '';
  }

  /**
   * Utility function to delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize measurement tools with error handling
   */
  initializeMeasurementTools() {
    try {
      // Direct line measurement tool
      this.directLineMeasurement = new ArcGISModules.DirectLineMeasurement3D({
        view: this.view
      });

      // Area measurement tool
      this.areaMeasurement = new ArcGISModules.AreaMeasurement3D({
        view: this.view
      });

      // Set up event listeners for measurement completion
      this.setupMeasurementListeners();
    } catch (error) {
      this.logError(error, ERROR_TYPES.ARCGIS_MEASUREMENT_FAILED);
      throw error;
    }
  }

  /**
   * Set up event listeners for measurement tools
   */
  setupMeasurementListeners() {
    // Direct line measurement events
    this.directLineMeasurement.on('measure-complete', (event) => {
      this.handleDistanceMeasurement(event.detail);
    });

    // Area measurement events
    this.areaMeasurement.on('measure-complete', (event) => {
      this.handleAreaMeasurement(event.detail);
    });
  }

  /**
   * Start area measurement
   */
  startAreaMeasurement() {
    this.clearMeasurements();
    this.measurementData.activeMode = 'area';
    this.view.ui.add(this.areaMeasurement, 'top-right');
    this.areaMeasurement.startMeasurement();
  }

  /**
   * Start distance measurement
   */
  startDistanceMeasurement() {
    this.clearMeasurements();
    this.measurementData.activeMode = 'distance';
    this.view.ui.add(this.directLineMeasurement, 'top-right');
    this.directLineMeasurement.startMeasurement();
  }

  /**
   * Handle area measurement completion
   */
  handleAreaMeasurement(measurementResult) {
    if (measurementResult && measurementResult.area) {
      const areaData = {
        id: Date.now(),
        originalValue: measurementResult.area,
        originalUnit: measurementResult.unit,
        geometry: measurementResult.geometry,
        timestamp: new Date()
      };

      this.measurementData.areas.push(areaData);
      
      // Store measurement data in session storage
      this.storeMeasurementData();
      
      this.onMeasurementComplete && this.onMeasurementComplete('area', areaData);
    }
  }

  /**
   * Handle distance measurement completion
   */
  handleDistanceMeasurement(measurementResult) {
    if (measurementResult && measurementResult.distance) {
      const distanceData = {
        id: Date.now(),
        originalValue: measurementResult.distance,
        originalUnit: measurementResult.unit,
        geometry: measurementResult.geometry,
        timestamp: new Date()
      };

      this.measurementData.distances.push(distanceData);
      this.onMeasurementComplete && this.onMeasurementComplete('distance', distanceData);
    }
  }

  /**
   * Clear all measurements
   */
  clearMeasurements() {
    this.view.ui.remove(this.directLineMeasurement);
    this.view.ui.remove(this.areaMeasurement);
    this.directLineMeasurement.clear();
    this.areaMeasurement.clear();
    this.measurementData.activeMode = null;
  }

  /**
   * Get all measurement data
   */
  getMeasurementData() {
    return {
      areas: this.measurementData.areas,
      distances: this.measurementData.distances,
      activeMode: this.measurementData.activeMode
    };
  }

  /**
   * Get formatted measurement results for estimate form
   */
  getFormattedMeasurements(preferredUnits = { area: 'sqft', distance: 'feet' }) {
    const formatted = {
      areas: [],
      distances: [],
      totalArea: 0,
      totalDistance: 0
    };

    // Format area measurements
    this.measurementData.areas.forEach(area => {
      const convertedArea = this.convertArea(area.originalValue, area.originalUnit, preferredUnits.area);
      formatted.areas.push({
        id: area.id,
        value: convertedArea.value,
        unit: convertedArea.unit,
        displayText: `${convertedArea.value.toFixed(2)} ${convertedArea.unit}`,
        timestamp: area.timestamp
      });
      formatted.totalArea += convertedArea.value;
    });

    // Format distance measurements
    this.measurementData.distances.forEach(distance => {
      const convertedDistance = this.convertDistance(distance.originalValue, distance.originalUnit, preferredUnits.distance);
      formatted.distances.push({
        id: distance.id,
        value: convertedDistance.value,
        unit: convertedDistance.unit,
        displayText: `${convertedDistance.value.toFixed(2)} ${convertedDistance.unit}`,
        timestamp: distance.timestamp
      });
      formatted.totalDistance += convertedDistance.value;
    });

    return formatted;
  }

  /**
   * Convert area between different units
   */
  convertArea(value, fromUnit, toUnit) {
    // Normalize input units
    const normalizedFromUnit = this.normalizeAreaUnit(fromUnit);
    const normalizedToUnit = this.normalizeAreaUnit(toUnit);

    if (normalizedFromUnit === normalizedToUnit) {
      return { value, unit: toUnit };
    }

    // Convert to square meters first if not already
    let valueInSqm = value;
    if (normalizedFromUnit !== 'sqm') {
      valueInSqm = value / this.unitConversions.sqm[normalizedFromUnit];
    }

    // Convert from square meters to target unit
    const convertedValue = valueInSqm * this.unitConversions.sqm[normalizedToUnit];

    return {
      value: convertedValue,
      unit: toUnit
    };
  }

  /**
   * Convert distance between different units
   */
  convertDistance(value, fromUnit, toUnit) {
    // Normalize input units
    const normalizedFromUnit = this.normalizeDistanceUnit(fromUnit);
    const normalizedToUnit = this.normalizeDistanceUnit(toUnit);

    if (normalizedFromUnit === normalizedToUnit) {
      return { value, unit: toUnit };
    }

    // Convert to meters first if not already
    let valueInMeters = value;
    if (normalizedFromUnit !== 'meters') {
      valueInMeters = value / this.unitConversions.meters[normalizedFromUnit];
    }

    // Convert from meters to target unit
    const convertedValue = valueInMeters * this.unitConversions.meters[normalizedToUnit];

    return {
      value: convertedValue,
      unit: toUnit
    };
  }

  /**
   * Normalize area unit names
   */
  normalizeAreaUnit(unit) {
    const unitMap = {
      'square-meters': 'sqm',
      'square-feet': 'sqft',
      'acres': 'acres',
      'sqm': 'sqm',
      'sqft': 'sqft',
      'm²': 'sqm',
      'ft²': 'sqft'
    };
    return unitMap[unit] || 'sqm';
  }

  /**
   * Normalize distance unit names
   */
  normalizeDistanceUnit(unit) {
    const unitMap = {
      'meters': 'meters',
      'feet': 'feet',
      'm': 'meters',
      'ft': 'feet'
    };
    return unitMap[unit] || 'meters';
  }

  /**
   * Get available conversion units
   */
  getAvailableUnits() {
    return {
      area: ['sqft', 'sqm', 'acres'],
      distance: ['feet', 'meters']
    };
  }

  /**
   * Set callback for measurement completion
   */
  onMeasurementComplete(callback) {
    this.onMeasurementComplete = callback;
  }

  /**
   * Remove a specific measurement
   */
  removeMeasurement(type, id) {
    if (type === 'area') {
      this.measurementData.areas = this.measurementData.areas.filter(area => area.id !== id);
    } else if (type === 'distance') {
      this.measurementData.distances = this.measurementData.distances.filter(distance => distance.id !== id);
    }
  }

  /**
   * Clear all measurement data
   */
  clearAllMeasurements() {
    this.measurementData.areas = [];
    this.measurementData.distances = [];
    this.clearMeasurements();
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (this.view) {
      this.view.destroy();
    }
    this.measurementData = {
      areas: [],
      distances: [],
      activeMode: null
    };
  }

  /**
   * Get measurement summary for estimate form
   */
  getMeasurementSummary(units = { area: 'sqft', distance: 'feet' }) {
    const formatted = this.getFormattedMeasurements(units);
    
    return {
      totalArea: {
        value: formatted.totalArea,
        unit: units.area,
        displayText: `${formatted.totalArea.toFixed(2)} ${units.area}`
      },
      totalDistance: {
        value: formatted.totalDistance,
        unit: units.distance,
        displayText: `${formatted.totalDistance.toFixed(2)} ${units.distance}`
      },
      measurementCount: {
        areas: formatted.areas.length,
        distances: formatted.distances.length
      }
    };
  }

  /**
   * Store measurement data in session storage
   */
  storeMeasurementData() {
    try {
      const dataToStore = {
        ...this.measurementData,
        timestamp: new Date().toISOString()
      };
      
      storeMeasurementData('arcgis', dataToStore);
    } catch (error) {
      console.error('Error storing ArcGIS measurement data:', error);
    }
  }

  /**
   * Restore measurement data from session storage
   */
  restoreMeasurementData(data) {
    try {
      if (data && (data.areas || data.distances)) {
        this.measurementData.areas = data.areas || [];
        this.measurementData.distances = data.distances || [];
        this.measurementData.activeMode = data.activeMode || null;
        
        console.log('Restored ArcGIS measurement data:', data);
      }
    } catch (error) {
      console.error('Error restoring ArcGIS measurement data:', error);
    }
  }

  /**
   * Initialize with previous measurement data if available
   */
  initializePreviousData() {
    try {
      const savedData = getMeasurementData('arcgis');
      if (savedData) {
        this.restoreMeasurementData(savedData);
      }
    } catch (error) {
      console.error('Error initializing previous ArcGIS data:', error);
    }
  }

  /**
   * Log errors for debugging and monitoring
   */
  logError(error, errorType = 'unknown') {
    const errorInfo = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount
    };
    
    this.errorHistory.push(errorInfo);
    
    if (this.options.enableErrorLogging) {
      console.error('ArcGIS Area Finder Error:', errorInfo);
    }
    
    if (this.options.onError) {
      this.options.onError(errorInfo);
    }
    
    if (this.options.showUserFriendlyErrors) {
      this.showUserMessage(ERROR_MESSAGES[errorType] || 'An unexpected error occurred', 'error');
    }
  }

  /**
   * Show user-friendly messages
   */
  showUserMessage(message, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `user-message user-message-${type}`;
    messageContainer.textContent = message;
    
    // Add styles for message types
    const styles = {
      info: 'background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb;',
      error: 'background: #ffebee; color: #c62828; border: 1px solid #ffcdd2;',
      success: 'background: #e8f5e8; color: #2e7d32; border: 1px solid #c8e6c9;',
      warning: 'background: #fff3e0; color: #ef6c00; border: 1px solid #ffcc02;'
    };
    
    messageContainer.style.cssText = `
      ${styles[type] || styles.info}
      padding: 12px 16px;
      margin: 10px 0;
      border-radius: 4px;
      font-size: 14px;
      position: relative;
      z-index: 1000;
    `;
    
    // Insert at the top of the container
    if (this.container.firstChild) {
      this.container.insertBefore(messageContainer, this.container.firstChild);
    } else {
      this.container.appendChild(messageContainer);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageContainer.parentNode) {
        messageContainer.parentNode.removeChild(messageContainer);
      }
    }, 5000);
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory() {
    return this.errorHistory;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Get current status of the component
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isFallbackActive: this.isFallbackActive,
      retryCount: this.retryCount,
      errorCount: this.errorHistory.length,
      hasData: this.measurementData.areas.length > 0 || this.measurementData.distances.length > 0,
      lastError: this.errorHistory.length > 0 ? this.errorHistory[this.errorHistory.length - 1] : null
    };
  }

  /**
   * Retry initialization manually
   */
  async retryInitialization() {
    this.retryCount = 0;
    this.errorHistory = [];
    this.isInitialized = false;
    this.isFallbackActive = false;
    
    return await this.initialize();
  }

  /**
   * Enhanced measurement methods with error handling
   */
  async startAreaMeasurementSafe() {
    try {
      if (!this.isInitialized) {
        throw new Error('Component not initialized');
      }
      
      if (this.isFallbackActive) {
        this.showUserMessage('Using fallback measurement tools', 'info');
        return;
      }
      
      this.startAreaMeasurement();
    } catch (error) {
      this.logError(error, ERROR_TYPES.ARCGIS_MEASUREMENT_FAILED);
      
      if (this.options.enableManualInput) {
        this.showManualInputOption();
      }
    }
  }

  async startDistanceMeasurementSafe() {
    try {
      if (!this.isInitialized) {
        throw new Error('Component not initialized');
      }
      
      if (this.isFallbackActive) {
        this.showUserMessage('Using fallback measurement tools', 'info');
        return;
      }
      
      this.startDistanceMeasurement();
    } catch (error) {
      this.logError(error, ERROR_TYPES.ARCGIS_MEASUREMENT_FAILED);
      
      if (this.options.enableManualInput) {
        this.showManualInputOption();
      }
    }
  }
}

export default ArcGISAreaFinder;
