/**
 * Advanced Asset Loading Utility
 * Provides comprehensive asset loading with preloading, lazy loading, and caching
 * Enhanced for Vercel deployment compatibility
 */

import { getAssetPath, getEnvironmentConfig, IS_VERCEL, DEPLOY_MODE } from './base-url.js';

// Debug logging for Vercel deployments
const DEBUG_ASSETS = (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
  (typeof window !== 'undefined' && window.location.search.includes('debug=assets'));

function debugLog(message, ...args) {
  if (DEBUG_ASSETS) {
    console.log(`🔧 [AssetLoader]${IS_VERCEL ? ' [Vercel]' : ''} ${message}`, ...args);
  }
}

// Asset loading states
const LOADING_STATES = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
};

// Cache for loaded assets
const assetCache = new Map();
const loadingPromises = new Map();

/**
 * Asset loader class with advanced features
 */
export class AssetLoader {
  constructor(options = {}) {
    this.config = {
      maxConcurrentLoads: 6,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true,
      enablePreloading: true,
      enableLazyLoading: true,
      ...options
    };
    
    this.currentLoads = 0;
    this.loadQueue = [];
    this.observers = new Map();
    
    // Initialize lazy loading if supported and enabled
    if (this.config.enableLazyLoading && 'IntersectionObserver' in window) {
      this.initLazyLoading();
    }
  }

  /**
   * Load a single asset with retry logic
   * @param {string} assetPath - Path to the asset
   * @param {object} options - Loading options
   * @returns {Promise} Loading promise
   */
  async loadAsset(assetPath, options = {}) {
    const config = getEnvironmentConfig();
    const resolvedPath = getAssetPath(assetPath, {
      forceAbsolute: !config.useRelativePaths,
      addCacheBusting: options.addCacheBusting !== false
    });
    
    debugLog(`Loading asset: ${assetPath} -> ${resolvedPath}`, { config, IS_VERCEL, DEPLOY_MODE });
    
    // Use original path for cache key to avoid conflicts across deployments
    const cacheKey = `asset:${assetPath}:${config.cacheStrategy}:${DEPLOY_MODE}`;
    
    // Check cache first
    if (this.config.enableCache && assetCache.has(cacheKey)) {
      const cached = assetCache.get(cacheKey);
      if (cached.state === LOADING_STATES.LOADED) {
        return cached.data;
      } else if (cached.state === LOADING_STATES.ERROR && !options.forceRetry) {
        throw cached.error;
      }
    }
    
    // Check if already loading
    if (loadingPromises.has(cacheKey)) {
      return loadingPromises.get(cacheKey);
    }
    
    // Create loading promise
    const loadingPromise = this._loadAssetWithRetry(resolvedPath, options);
    loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      const result = await loadingPromise;
      if (this.config.enableCache) {
        assetCache.set(cacheKey, {
          state: LOADING_STATES.LOADED,
          data: result,
          timestamp: Date.now()
        });
      }
      return result;
    } catch (error) {
      if (this.config.enableCache) {
        assetCache.set(cacheKey, {
          state: LOADING_STATES.ERROR,
          error,
          timestamp: Date.now()
        });
      }
      throw error;
    } finally {
      loadingPromises.delete(cacheKey);
      this.currentLoads--;
      this._processQueue();
    }
  }

  /**
   * Load multiple assets concurrently
   * @param {Array} assets - Array of asset paths or objects
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving to array of results
   */
  async loadAssets(assets, options = {}) {
    const {
      failFast = false,
      maxConcurrent = this.config.maxConcurrentLoads
    } = options;
    
    const loadPromises = assets.map(asset => {
      const assetPath = typeof asset === 'string' ? asset : asset.path;
      const assetOptions = typeof asset === 'object' ? { ...options, ...asset } : options;
      
      return this.loadAsset(assetPath, assetOptions);
    });
    
    if (failFast) {
      return Promise.all(loadPromises);
    } else {
      return Promise.allSettled(loadPromises);
    }
  }

  /**
   * Preload critical assets
   * @param {Array} assets - Critical assets to preload
   */
  preloadCriticalAssets(assets = []) {
    if (!this.config.enablePreloading) return;
    
    const config = getEnvironmentConfig();
    
    // Define critical assets with proper paths for current environment
    const defaultCriticalAssets = [
      { path: 'assets/styles/main.css', type: 'style', priority: 'high' },
      { path: 'entries/main.js', type: 'script', priority: 'high' },
      { path: 'assets/images/logo.png', type: 'image', priority: 'medium' }
    ];
    
    const allAssets = [...defaultCriticalAssets, ...assets];
    
    allAssets.forEach(asset => {
      // Resolve path correctly for current environment
      const resolvedAsset = {
        ...asset,
        path: getAssetPath(asset.path, { 
          forceAbsolute: !config.useRelativePaths,
          addCacheBusting: false // Don't add cache busting to preload links
        })
      };
      debugLog(`Preloading critical asset: ${asset.path} -> ${resolvedAsset.path}`);
      this._createPreloadLink(resolvedAsset);
    });
  }

  /**
   * Initialize lazy loading for images
   */
  initLazyLoading() {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this._loadLazyImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    // Observe existing lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      lazyImageObserver.observe(img);
    });
    
    // Store observer for later use
    this.observers.set('lazyImages', lazyImageObserver);
  }

  /**
   * Add lazy loading to new images
   * @param {Element} container - Container to search for images
   */
  addLazyImages(container = document) {
    if (!this.observers.has('lazyImages')) return;
    
    const observer = this.observers.get('lazyImages');
    container.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  /**
   * Load image with fallback options
   * @param {string} imagePath - Path to the image
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving to Image element
   */
  loadImage(imagePath, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const config = getEnvironmentConfig();
      const resolvedPath = getAssetPath(imagePath, {
        forceAbsolute: !config.useRelativePaths,
        addCacheBusting: options.addCacheBusting !== false
      });
      
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (options.fallback) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => reject(new Error(`Failed to load image: ${imagePath} and fallback`));
          fallbackImg.src = getAssetPath(options.fallback, {
            forceAbsolute: !config.useRelativePaths,
            addCacheBusting: options.addCacheBusting !== false
          });
        } else {
          reject(new Error(`Failed to load image: ${imagePath}`));
        }
      };
      
      // Set attributes
      if (options.crossOrigin) img.crossOrigin = options.crossOrigin;
      if (options.decoding) img.decoding = options.decoding;
      if (options.loading) img.loading = options.loading;
      
      img.src = resolvedPath;
    });
  }

  /**
   * Load CSS file dynamically
   * @param {string} cssPath - Path to the CSS file
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving when CSS is loaded
   */
  loadCSS(cssPath, options = {}) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      const config = getEnvironmentConfig();
      const resolvedPath = getAssetPath(cssPath, {
        forceAbsolute: !config.useRelativePaths,
        addCacheBusting: options.addCacheBusting !== false
      });
      
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = resolvedPath;
      
      if (options.media) link.media = options.media;
      if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
      
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * Load JavaScript file dynamically
   * @param {string} jsPath - Path to the JavaScript file
   * @param {object} options - Loading options
   * @returns {Promise} Promise resolving when script is loaded
   */
  loadJS(jsPath, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const config = getEnvironmentConfig();
      const resolvedPath = getAssetPath(jsPath, {
        forceAbsolute: !config.useRelativePaths,
        addCacheBusting: options.addCacheBusting !== false
      });
      
      script.src = resolvedPath;
      script.type = options.type || 'text/javascript';
      
      if (options.async !== undefined) script.async = options.async;
      if (options.defer !== undefined) script.defer = options.defer;
      if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
      if (options.integrity) script.integrity = options.integrity;
      
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Failed to load script: ${jsPath}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Clear asset cache
   * @param {string} pattern - Pattern to match for clearing (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of assetCache) {
        if (regex.test(key)) {
          assetCache.delete(key);
        }
      }
    } else {
      assetCache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    const stats = {
      size: assetCache.size,
      loaded: 0,
      error: 0,
      totalSize: 0
    };
    
    for (const [key, value] of assetCache) {
      if (value.state === LOADING_STATES.LOADED) {
        stats.loaded++;
      } else if (value.state === LOADING_STATES.ERROR) {
        stats.error++;
      }
    }
    
    return stats;
  }

  // Private methods

  async _loadAssetWithRetry(assetPath, options = {}) {
    const { retryAttempts = this.config.retryAttempts } = options;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await this._loadAssetDirect(assetPath, options);
      } catch (error) {
        if (attempt === retryAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  async _loadAssetDirect(assetPath, options = {}) {
    const { type = this._detectAssetType(assetPath) } = options;
    
    switch (type) {
      case 'image':
        return this.loadImage(assetPath, options);
      case 'css':
        return this.loadCSS(assetPath, options);
      case 'js':
        return this.loadJS(assetPath, options);
      default:
        // Generic fetch for other asset types - ensure proper path resolution
        const config = getEnvironmentConfig();
        const resolvedAssetPath = getAssetPath(assetPath, {
          forceAbsolute: !config.useRelativePaths,
          addCacheBusting: options.addCacheBusting !== false
        });
        const response = await fetch(resolvedAssetPath);
        if (!response.ok) {
          throw new Error(`Failed to load asset: ${assetPath} (${response.status})`);
        }
        return response;
    }
  }

  _detectAssetType(assetPath) {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'css') {
      return 'css';
    } else if (['js', 'mjs'].includes(extension)) {
      return 'js';
    }
    
    return 'unknown';
  }

  _createPreloadLink(asset) {
    try {
      // Use the resolved path from the asset object (already resolved in preloadCriticalAssets)
      const assetPath = asset.path;
      
      // Check if already preloaded
      const existingLink = document.querySelector(`link[href="${assetPath}"]`);
      if (existingLink) {
        debugLog(`Preload link already exists for: ${assetPath}`);
        return;
      }
      
      const link = document.createElement('link');
      link.rel = asset.type === 'font' ? 'preload' : 'prefetch';
      link.href = assetPath;
      link.as = asset.as || asset.type;
      
      if (asset.type === 'font') {
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      }
      
      if (asset.priority === 'high') {
        link.fetchPriority = 'high';
      }
      
      // Add error handling for preload links
      link.onerror = () => {
        debugLog(`Failed to preload asset: ${assetPath}`);
      };
      
      link.onload = () => {
        debugLog(`Successfully preloaded asset: ${assetPath}`);
      };
      
      document.head.appendChild(link);
      debugLog(`Added preload link: ${assetPath}`);
      
    } catch (error) {
      console.warn('Failed to create preload link:', error, asset);
    }
  }

  async _loadLazyImage(img) {
    try {
      const src = img.dataset.src;
      if (!src) return;
      
      const config = getEnvironmentConfig();
      const resolvedSrc = getAssetPath(src, {
        forceAbsolute: !config.useRelativePaths,
        addCacheBusting: true
      });
      
      const loadedImg = await this.loadImage(src, {
        crossOrigin: img.crossOrigin,
        decoding: 'async',
        addCacheBusting: true
      });
      
      img.src = resolvedSrc;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
      
      // Trigger load event
      img.dispatchEvent(new Event('load'));
      
    } catch (error) {
      console.warn('Failed to load lazy image:', error);
      img.classList.add('error');
      
      // Try to set a fallback or placeholder if available
      if (img.dataset.fallback) {
        const config = getEnvironmentConfig();
        img.src = getAssetPath(img.dataset.fallback, {
          forceAbsolute: !config.useRelativePaths,
          addCacheBusting: false
        });
      }
    }
  }

  _processQueue() {
    while (this.loadQueue.length > 0 && this.currentLoads < this.config.maxConcurrentLoads) {
      const queueItem = this.loadQueue.shift();
      this.currentLoads++;
      queueItem();
    }
  }
}

// Create global asset loader instance
export const assetLoader = new AssetLoader();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    assetLoader.preloadCriticalAssets();
  });
} else {
  assetLoader.preloadCriticalAssets();
}

// Export utility functions
export {
  LOADING_STATES,
  assetCache,
  loadingPromises
};
