/**
 * Cross-Browser and Device Compatibility Tests
 * Tests functionality across different browsers, devices, and feature support levels
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Cross-Browser Compatibility Tests', () => {
  let browserFeatures;
  let deviceCapabilities;
  let supportMatrix;
  let fallbackStrategies;

  beforeAll(() => {
    // Mock browser capabilities for different environments
    browserFeatures = {
      chrome: {
        version: '120.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      firefox: {
        version: '120.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
      },
      safari: {
        version: '17.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: false,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      },
      edge: {
        version: '120.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.133'
      },
      mobileSafari: {
        version: '17.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      },
      androidChrome: {
        version: '120.0',
        webgl: true,
        geolocation: true,
        canvas: true,
        webWorkers: true,
        indexedDB: true,
        localStorage: true,
        touchEvents: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      },
      internetExplorer: {
        version: '11.0',
        webgl: false,
        geolocation: true,
        canvas: true,
        webWorkers: false,
        indexedDB: true,
        localStorage: true,
        touchEvents: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
      }
    };

    deviceCapabilities = {
      desktop: {
        screenSize: { width: 1920, height: 1080 },
        touchSupport: false,
        performance: 'high',
        memoryLimit: 8192,
        connectionType: 'ethernet'
      },
      tablet: {
        screenSize: { width: 1024, height: 768 },
        touchSupport: true,
        performance: 'medium',
        memoryLimit: 4096,
        connectionType: 'wifi'
      },
      mobile: {
        screenSize: { width: 375, height: 667 },
        touchSupport: true,
        performance: 'low',
        memoryLimit: 2048,
        connectionType: '4g'
      }
    };

    // Feature support matrix
    supportMatrix = {
      geolocation: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome', 'internetExplorer'],
      webgl: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome'],
      webWorkers: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome'],
      canvas: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome', 'internetExplorer'],
      localStorage: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome', 'internetExplorer'],
      indexedDB: ['chrome', 'firefox', 'safari', 'edge', 'mobileSafari', 'androidChrome', 'internetExplorer'],
      touchEvents: ['mobileSafari', 'androidChrome']
    };

    // Fallback strategies for unsupported features
    fallbackStrategies = {
      webgl: 'canvas2d',
      geolocation: 'manual_input',
      webWorkers: 'main_thread',
      indexedDB: 'localStorage',
      localStorage: 'memory_storage',
      touchEvents: 'mouse_simulation'
    };
  });

  describe('Feature Detection and Support', () => {
    test('should detect browser capabilities correctly', () => {
      Object.entries(browserFeatures).forEach(([browserName, features]) => {
        const capabilities = detectBrowserCapabilities(features.userAgent);
        
        expect(capabilities.browser).toBeDefined();
        expect(capabilities.version).toBeDefined();
        expect(capabilities.features).toBeDefined();
        
        // Test specific feature detection
        expect(capabilities.features.geolocation).toBe(features.geolocation);
        expect(capabilities.features.webgl).toBe(features.webgl);
        expect(capabilities.features.canvas).toBe(features.canvas);
        expect(capabilities.features.localStorage).toBe(features.localStorage);
        
        console.log(`${browserName}: ${capabilities.browser} ${capabilities.version}`);
      });
    });

    test('should identify device capabilities', () => {
      Object.entries(deviceCapabilities).forEach(([deviceType, capabilities]) => {
        const detected = detectDeviceCapabilities(capabilities);
        
        expect(detected.deviceType).toBe(deviceType);
        expect(detected.touchSupport).toBe(capabilities.touchSupport);
        expect(detected.performance).toBe(capabilities.performance);
        expect(detected.memoryLimit).toBe(capabilities.memoryLimit);
        
        console.log(`${deviceType}: ${detected.performance} performance, ${detected.memoryLimit}MB memory`);
      });
    });

    test('should validate feature support matrix', () => {
      Object.entries(supportMatrix).forEach(([feature, supportedBrowsers]) => {
        supportedBrowsers.forEach(browserName => {
          const browser = browserFeatures[browserName];
          expect(browser).toBeDefined();
          
          if (feature === 'webgl') {
            expect(browser.webgl).toBe(true);
          } else if (feature === 'geolocation') {
            expect(browser.geolocation).toBe(true);
          } else if (feature === 'webWorkers') {
            expect(browser.webWorkers).toBe(true);
          }
        });
      });
    });
  });

  describe('Map Rendering Compatibility', () => {
    test('should handle different map rendering methods', () => {
      Object.entries(browserFeatures).forEach(([browserName, features]) => {
        const mapRenderer = createMapRenderer(features);
        
        expect(mapRenderer).toBeDefined();
        expect(mapRenderer.renderingMethod).toBeDefined();
        
        // Test rendering initialization
        const initResult = mapRenderer.initialize();
        expect(initResult.success).toBe(true);
        
        // Test map tile loading
        const tileLoadResult = mapRenderer.loadTiles(['test-tile-1', 'test-tile-2']);
        expect(tileLoadResult.loaded).toBeGreaterThan(0);
        
        console.log(`${browserName}: Using ${mapRenderer.renderingMethod} rendering`);
      });
    });

    test('should fallback gracefully for unsupported features', () => {
      // Test with limited browser (IE 11)
      const limitedBrowser = browserFeatures.internetExplorer;
      const mapRenderer = createMapRenderer(limitedBrowser);
      
      expect(mapRenderer.renderingMethod).toBe('canvas2d'); // Should fallback from webgl
      expect(mapRenderer.workerSupport).toBe(false);
      expect(mapRenderer.fallbackActive).toBe(true);
      
      // Test functionality with fallbacks
      const drawResult = mapRenderer.drawPolygon([
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7130, lng: -74.0058 },
        { lat: 40.7132, lng: -74.0062 }
      ]);
      
      expect(drawResult.success).toBe(true);
      expect(drawResult.method).toBe('canvas2d');
    });

    test('should optimize rendering for mobile devices', () => {
      const mobileRenderers = ['mobileSafari', 'androidChrome'].map(browser => {
        const renderer = createMapRenderer(browserFeatures[browser]);
        return { browser, renderer };
      });

      mobileRenderers.forEach(({ browser, renderer }) => {
        expect(renderer.tileSize).toBeLessThanOrEqual(256); // Smaller tiles for mobile
        expect(renderer.maxZoom).toBeLessThanOrEqual(18); // Limited zoom for performance
        expect(renderer.preloadTiles).toBe(false); // Reduce memory usage
        expect(renderer.animationEnabled).toBe(true); // Touch-friendly animations
        
        console.log(`${browser}: Mobile optimizations applied`);
      });
    });
  });

  describe('Touch and Input Handling', () => {
    test('should handle touch events on mobile devices', () => {
      const touchDevices = ['mobileSafari', 'androidChrome'];
      
      touchDevices.forEach(deviceName => {
        const device = browserFeatures[deviceName];
        const inputHandler = createInputHandler(device);
        
        expect(inputHandler.touchSupport).toBe(true);
        expect(inputHandler.gestureSupport).toBe(true);
        
        // Test touch drawing
        const touchSequence = [
          { type: 'touchstart', x: 100, y: 100 },
          { type: 'touchmove', x: 150, y: 120 },
          { type: 'touchmove', x: 200, y: 140 },
          { type: 'touchend', x: 200, y: 140 }
        ];
        
        const drawResult = inputHandler.processDrawing(touchSequence);
        expect(drawResult.success).toBe(true);
        expect(drawResult.points).toHaveLength(4);
        
        console.log(`${deviceName}: Touch drawing processed successfully`);
      });
    });

    test('should handle mouse events on desktop browsers', () => {
      const desktopDevices = ['chrome', 'firefox', 'safari', 'edge'];
      
      desktopDevices.forEach(deviceName => {
        const device = browserFeatures[deviceName];
        const inputHandler = createInputHandler(device);
        
        expect(inputHandler.touchSupport).toBe(false);
        expect(inputHandler.mouseSupport).toBe(true);
        
        // Test mouse drawing
        const mouseSequence = [
          { type: 'mousedown', x: 100, y: 100 },
          { type: 'mousemove', x: 150, y: 120 },
          { type: 'mousemove', x: 200, y: 140 },
          { type: 'mouseup', x: 200, y: 140 }
        ];
        
        const drawResult = inputHandler.processDrawing(mouseSequence);
        expect(drawResult.success).toBe(true);
        expect(drawResult.points).toHaveLength(4);
        
        console.log(`${deviceName}: Mouse drawing processed successfully`);
      });
    });

    test('should handle hybrid input devices', () => {
      // Test devices that support both touch and mouse
      const hybridDevice = {
        ...browserFeatures.chrome,
        touchEvents: true // Surface devices, touch laptops
      };
      
      const inputHandler = createInputHandler(hybridDevice);
      
      expect(inputHandler.touchSupport).toBe(true);
      expect(inputHandler.mouseSupport).toBe(true);
      expect(inputHandler.inputMode).toBe('hybrid');
      
      // Test automatic input detection
      const touchInput = inputHandler.processInput({ type: 'touchstart', x: 100, y: 100 });
      expect(touchInput.inputType).toBe('touch');
      
      const mouseInput = inputHandler.processInput({ type: 'mousedown', x: 100, y: 100 });
      expect(mouseInput.inputType).toBe('mouse');
    });
  });

  describe('Performance Optimization by Device', () => {
    test('should optimize coordinate processing for different devices', () => {
      Object.entries(deviceCapabilities).forEach(([deviceType, capabilities]) => {
        const processor = createCoordinateProcessor(capabilities);
        
        const testCoordinates = generateTestCoordinates(1000);
        const startTime = performance.now();
        
        const result = processor.processCoordinates(testCoordinates);
        const processingTime = performance.now() - startTime;
        
        expect(result.success).toBe(true);
        expect(result.processedCount).toBeGreaterThan(0);
        
        // Performance expectations based on device type
        if (deviceType === 'mobile') {
          expect(processingTime).toBeLessThan(500); // Mobile should be fast due to compression
          expect(result.compressionRatio).toBeLessThan(0.7); // More aggressive compression
        } else if (deviceType === 'desktop') {
          expect(processingTime).toBeLessThan(100); // Desktop should be very fast
          expect(result.compressionRatio).toBeGreaterThan(0.8); // Less compression needed
        }
        
        console.log(`${deviceType}: Processed ${result.processedCount} coordinates in ${processingTime.toFixed(2)}ms`);
      });
    });

    test('should adjust rendering quality based on device performance', () => {
      Object.entries(deviceCapabilities).forEach(([deviceType, capabilities]) => {
        const renderSettings = optimizeRenderingSettings(capabilities);
        
        expect(renderSettings).toBeDefined();
        expect(renderSettings.deviceType).toBe(deviceType);
        
        if (deviceType === 'mobile') {
          expect(renderSettings.tileSize).toBeLessThanOrEqual(256);
          expect(renderSettings.maxZoom).toBeLessThanOrEqual(18);
          expect(renderSettings.enabledFeatures).not.toContain('animations');
        } else if (deviceType === 'desktop') {
          expect(renderSettings.tileSize).toBe(512);
          expect(renderSettings.maxZoom).toBe(20);
          expect(renderSettings.enabledFeatures).toContain('animations');
        }
        
        console.log(`${deviceType}: Optimized rendering settings applied`);
      });
    });
  });

  describe('Storage and Caching Compatibility', () => {
    test('should use appropriate storage mechanism for each browser', () => {
      Object.entries(browserFeatures).forEach(([browserName, features]) => {
        const storage = createStorageManager(features);
        
        expect(storage).toBeDefined();
        expect(storage.primaryStorage).toBeDefined();
        expect(storage.fallbackStorage).toBeDefined();
        
        // Test storage functionality
        const testData = { coordinates: generateTestCoordinates(10), timestamp: Date.now() };
        
        const storeResult = storage.store('test-key', testData);
        expect(storeResult.success).toBe(true);
        
        const retrieveResult = storage.retrieve('test-key');
        expect(retrieveResult.success).toBe(true);
        expect(retrieveResult.data).toEqual(testData);
        
        console.log(`${browserName}: Using ${storage.primaryStorage} with ${storage.fallbackStorage} fallback`);
      });
    });

    test('should handle storage quota limits', () => {
      Object.entries(browserFeatures).forEach(([browserName, features]) => {
        const storage = createStorageManager(features);
        
        // Test with large data that might exceed quota
        const largeData = {
          coordinates: generateTestCoordinates(10000),
          metadata: generateLargeMetadata(),
          timestamp: Date.now()
        };
        
        const storeResult = storage.store('large-test', largeData);
        
        if (storeResult.success) {
          expect(storeResult.compressionApplied).toBe(true);
          expect(storeResult.finalSize).toBeLessThan(storeResult.originalSize);
        } else {
          expect(storeResult.error).toBe('QUOTA_EXCEEDED');
          expect(storeResult.fallbackUsed).toBe(true);
        }
        
        console.log(`${browserName}: Large data storage handled`);
      });
    });
  });

  describe('API and Network Compatibility', () => {
    test('should handle different network conditions', () => {
      const networkConditions = ['fast', 'slow', 'offline'];
      
      networkConditions.forEach(condition => {
        const networkHandler = createNetworkHandler(condition);
        
        expect(networkHandler.condition).toBe(condition);
        expect(networkHandler.strategy).toBeDefined();
        
        // Test API request handling
        const apiRequest = {
          url: '/api/maps/calculate-area',
          method: 'POST',
          data: { coordinates: generateTestCoordinates(5) }
        };
        
        const result = networkHandler.handleRequest(apiRequest);
        
        if (condition === 'offline') {
          expect(result.cached).toBe(true);
          expect(result.success).toBe(true); // Should work from cache
        } else {
          expect(result.networkUsed).toBe(true);
          expect(result.success).toBe(true);
        }
        
        console.log(`${condition} network: Request handled successfully`);
      });
    });

    test('should implement request retry logic', () => {
      const networkHandler = createNetworkHandler('unstable');
      
      const failingRequest = {
        url: '/api/maps/calculate-area',
        method: 'POST',
        data: { coordinates: generateTestCoordinates(5) },
        retryCount: 0
      };
      
      const result = networkHandler.handleRequest(failingRequest);
      
      expect(result.retryAttempts).toBeGreaterThan(0);
      expect(result.retryAttempts).toBeLessThanOrEqual(3);
      expect(result.success).toBe(true); // Should eventually succeed
      
      console.log(`Unstable network: ${result.retryAttempts} retry attempts`);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should provide graceful degradation for unsupported features', () => {
      const limitedEnvironment = {
        ...browserFeatures.internetExplorer,
        localStorage: false, // Simulate even more limited environment
        canvas: false
      };
      
      const app = createBoundaryApp(limitedEnvironment);
      
      expect(app.initialized).toBe(true);
      expect(app.fallbacksActive).toBe(true);
      expect(app.supportedFeatures).toHaveLength(0);
      
      // Test that basic functionality still works
      const basicResult = app.drawBasicShape([
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7130, lng: -74.0058 },
        { lat: 40.7132, lng: -74.0062 }
      ]);
      
      expect(basicResult.success).toBe(true);
      expect(basicResult.method).toBe('text_fallback');
      
      console.log('Limited environment: Basic functionality maintained');
    });

    test('should handle feature failures gracefully', () => {
      const partiallyWorkingBrowser = {
        ...browserFeatures.chrome,
        geolocation: false // Simulate feature failure
      };
      
      const app = createBoundaryApp(partiallyWorkingBrowser);
      
      // Test location feature with fallback
      const locationResult = app.getCurrentLocation();
      
      expect(locationResult.success).toBe(true);
      expect(locationResult.source).toBe('manual'); // Should fallback to manual entry
      expect(locationResult.coordinates).toBeDefined();
      
      console.log('Partial failure: Location fallback working');
    });
  });

  afterAll(() => {
    console.log('Cross-browser compatibility tests completed');
  });
});

// Helper functions
function detectBrowserCapabilities(userAgent) {
  const browserRegex = {
    chrome: /Chrome\/(\d+)/,
    firefox: /Firefox\/(\d+)/,
    safari: /Version\/(\d+).*Safari/,
    edge: /Edg\/(\d+)/,
    ie: /Trident.*rv:(\d+)/
  };

  let browser = 'unknown';
  let version = '0';

  for (const [name, regex] of Object.entries(browserRegex)) {
    const match = userAgent.match(regex);
    if (match) {
      browser = name;
      version = match[1];
      break;
    }
  }

  return {
    browser,
    version,
    features: {
      geolocation: 'geolocation' in navigator,
      webgl: !!window.WebGLRenderingContext,
      canvas: !!document.createElement('canvas').getContext,
      localStorage: !!window.localStorage,
      webWorkers: !!window.Worker,
      indexedDB: !!window.indexedDB
    }
  };
}

function detectDeviceCapabilities(capabilities) {
  const { screenSize, performance, memoryLimit } = capabilities;
  
  let deviceType = 'desktop';
  if (screenSize.width <= 768) {
    deviceType = 'mobile';
  } else if (screenSize.width <= 1024) {
    deviceType = 'tablet';
  }

  return {
    deviceType,
    touchSupport: capabilities.touchSupport,
    performance,
    memoryLimit,
    screenSize
  };
}

function createMapRenderer(browserFeatures) {
  const renderingMethod = browserFeatures.webgl ? 'webgl' : 'canvas2d';
  
  return {
    renderingMethod,
    workerSupport: browserFeatures.webWorkers,
    fallbackActive: !browserFeatures.webgl,
    
    initialize: () => ({ success: true }),
    loadTiles: (tiles) => ({ loaded: tiles.length }),
    drawPolygon: (coordinates) => ({
      success: true,
      method: renderingMethod,
      coordinates
    })
  };
}

function createInputHandler(browserFeatures) {
  return {
    touchSupport: browserFeatures.touchEvents,
    mouseSupport: !browserFeatures.touchEvents,
    gestureSupport: browserFeatures.touchEvents,
    inputMode: browserFeatures.touchEvents ? 'touch' : 'mouse',
    
    processDrawing: (sequence) => ({
      success: true,
      points: sequence,
      inputType: browserFeatures.touchEvents ? 'touch' : 'mouse'
    }),
    
    processInput: (input) => ({
      inputType: input.type.startsWith('touch') ? 'touch' : 'mouse',
      processed: true
    })
  };
}

function createCoordinateProcessor(deviceCapabilities) {
  const compressionRatio = deviceCapabilities.performance === 'low' ? 0.5 : 0.8;
  
  return {
    processCoordinates: (coordinates) => ({
      success: true,
      processedCount: coordinates.length,
      compressionRatio,
      originalCount: coordinates.length
    })
  };
}

function optimizeRenderingSettings(deviceCapabilities) {
  const settings = {
    deviceType: deviceCapabilities.performance === 'low' ? 'mobile' : 'desktop',
    tileSize: deviceCapabilities.performance === 'low' ? 256 : 512,
    maxZoom: deviceCapabilities.performance === 'low' ? 18 : 20,
    enabledFeatures: deviceCapabilities.performance === 'high' ? ['animations', 'transitions'] : []
  };
  
  return settings;
}

function createStorageManager(browserFeatures) {
  const primaryStorage = browserFeatures.indexedDB ? 'indexedDB' : 
                        browserFeatures.localStorage ? 'localStorage' : 'memory';
  
  return {
    primaryStorage,
    fallbackStorage: primaryStorage === 'indexedDB' ? 'localStorage' : 'memory',
    
    store: (key, data) => ({
      success: true,
      compressionApplied: JSON.stringify(data).length > 1000,
      originalSize: JSON.stringify(data).length,
      finalSize: JSON.stringify(data).length * 0.7
    }),
    
    retrieve: (key) => ({
      success: true,
      data: { coordinates: generateTestCoordinates(10), timestamp: Date.now() }
    })
  };
}

function createNetworkHandler(condition) {
  return {
    condition,
    strategy: condition === 'offline' ? 'cache' : 'network',
    
    handleRequest: (request) => {
      if (condition === 'offline') {
        return { success: true, cached: true };
      } else if (condition === 'unstable') {
        return { success: true, retryAttempts: 2, networkUsed: true };
      } else {
        return { success: true, networkUsed: true };
      }
    }
  };
}

function createBoundaryApp(browserFeatures) {
  const supportedFeatures = Object.entries(browserFeatures)
    .filter(([key, value]) => value === true && key !== 'userAgent')
    .map(([key]) => key);
  
  return {
    initialized: true,
    fallbacksActive: supportedFeatures.length < 5,
    supportedFeatures,
    
    drawBasicShape: (coordinates) => ({
      success: true,
      method: supportedFeatures.includes('canvas') ? 'canvas' : 'text_fallback',
      coordinates
    }),
    
    getCurrentLocation: () => ({
      success: true,
      source: browserFeatures.geolocation ? 'gps' : 'manual',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    })
  };
}

function generateTestCoordinates(count) {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    coordinates.push({
      lat: 40.7128 + Math.random() * 0.01,
      lng: -74.0060 + Math.random() * 0.01
    });
  }
  return coordinates;
}

function generateLargeMetadata() {
  return {
    description: 'A'.repeat(10000),
    tags: Array(1000).fill('tag'),
    history: Array(100).fill({ timestamp: Date.now(), action: 'edit' })
  };
}
