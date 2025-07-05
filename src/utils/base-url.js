/**
 * Enhanced Base URL utility for handling different deployment environments
 * Provides comprehensive asset handling with relative paths and dynamic resolution
 */

// Get base URL from build-time configuration
export const BASE_URL = typeof __BASE_URL__ !== 'undefined' ? __BASE_URL__ : '/Neff-Paving/';
export const DEPLOY_MODE = typeof __DEPLOY_MODE__ !== 'undefined' ? __DEPLOY_MODE__ : 'github';
export const BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : Date.now();
export const DEPLOY_TIME = typeof __DEPLOY_TIME__ !== 'undefined' ? __DEPLOY_TIME__ : Date.now();

// Asset type configurations for different environments
const ASSET_CONFIG = {
  vercel: {
    useRelativePaths: false,
    assetPrefix: '',
    cdnEnabled: true,
    cacheStrategy: 'aggressive'
  },
  github: {
    useRelativePaths: true,
    assetPrefix: '/Neff-Paving',
    cdnEnabled: false,
    cacheStrategy: 'moderate'
  },
  development: {
    useRelativePaths: false,
    assetPrefix: '',
    cdnEnabled: false,
    cacheStrategy: 'none'
  }
};

/**
 * Get the current environment configuration
 * @returns {object} Environment-specific asset configuration
 */
export function getEnvironmentConfig() {
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  if (isDev) return ASSET_CONFIG.development;
  
  return ASSET_CONFIG[DEPLOY_MODE] || ASSET_CONFIG.github;
}

/**
 * Get the correct base URL for the current environment
 * @returns {string} The base URL
 */
export function getBaseUrl() {
  return BASE_URL;
}

/**
 * Create a full URL with the correct base path
 * @param {string} path - The path to append to the base URL
 * @returns {string} The complete URL
 */
export function createUrl(path) {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Ensure base URL ends with slash
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
  
  return baseUrl + cleanPath;
}

/**
 * Enhanced asset path resolution with relative path support
 * @param {string} assetPath - The asset path
 * @param {object} options - Resolution options
 * @returns {string} The environment-specific asset path
 */
export function getAssetPath(assetPath, options = {}) {
  const config = getEnvironmentConfig();
  const {
    useRelative = config.useRelativePaths,
    addCacheBusting = true,
    forceAbsolute = false
  } = options;

  let resolvedPath = assetPath;

  // Handle different path types
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    // External URL - return as-is
    return assetPath;
  }

  // Remove leading slash for processing
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (forceAbsolute || DEPLOY_MODE === 'vercel') {
    // Use absolute paths from root
    resolvedPath = '/' + cleanPath;
  } else if (useRelative && DEPLOY_MODE === 'github') {
    // Use relative paths with base URL for GitHub Pages
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    resolvedPath = baseUrl + '/' + cleanPath;
  } else {
    // Default to absolute path
    resolvedPath = '/' + cleanPath;
  }

  // Add cache busting for non-development environments
  if (addCacheBusting && config.cacheStrategy !== 'none') {
    const separator = resolvedPath.includes('?') ? '&' : '?';
    const timestamp = config.cacheStrategy === 'aggressive' ? DEPLOY_TIME : BUILD_TIMESTAMP;
    resolvedPath += `${separator}v=${timestamp}`;
  }

  return resolvedPath;
}

/**
 * Critical asset preloading for improved performance
 * @param {Array} assets - Array of critical assets to preload
 */
export function preloadCriticalAssets(assets = []) {
  if (typeof document === 'undefined') return;

  // Default critical assets
  const defaultCriticalAssets = [
    { type: 'style', href: '/assets/main.css', as: 'style' },
    { type: 'script', href: '/src/main.js', as: 'script' },
    { type: 'font', href: 'https://fonts.gstatic.com/s/oswald/v49/TK3IWkUHHAIjg75cFRf3bXL8LICs1_Fw.woff2', as: 'font', crossorigin: true },
    { type: 'image', href: '/assets/images/logo.png', as: 'image' }
  ];

  const allAssets = [...defaultCriticalAssets, ...assets];

  allAssets.forEach(asset => {
    // Skip if already preloaded
    const existingLink = document.querySelector(`link[href="${asset.href}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = asset.type === 'font' ? 'preload' : 'prefetch';
    link.href = getAssetPath(asset.href, { addCacheBusting: false });
    link.as = asset.as;
    
    if (asset.crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    
    if (asset.type === 'font') {
      link.type = 'font/woff2';
    }

    document.head.appendChild(link);
  });
}

/**
 * Enhanced asset path updating with improved error handling
 */
export function updateAssetPaths() {
  if (typeof document === 'undefined') return;

  const config = getEnvironmentConfig();
  
  // Update all asset references
  const selectors = [
    'a[href^="/"]:not([href^="//"])',
    'img[src^="/"]:not([src^="//"])',
    'link[href^="/"]:not([href^="//"])',
    'script[src^="/"]:not([src^="//"])',
    'source[src^="/"]:not([src^="//"])',
    'video[src^="/"]:not([src^="//"])',
    'audio[src^="/"]:not([src^="//"])',
    '[style*="url(/"]'
  ];
  
  const elements = document.querySelectorAll(selectors.join(', '));
  
  elements.forEach(element => {
    try {
      const tagName = element.tagName.toLowerCase();
      let attr, currentPath;
      
      // Determine the correct attribute to update
      if (tagName === 'a' || tagName === 'link') {
        attr = 'href';
      } else if (['img', 'script', 'source', 'video', 'audio'].includes(tagName)) {
        attr = 'src';
      } else if (element.hasAttribute('style')) {
        // Handle inline styles with url() references
        const style = element.getAttribute('style');
        const urlMatches = style.match(/url\(([^)]+)\)/g);
        if (urlMatches) {
          let updatedStyle = style;
          urlMatches.forEach(match => {
            const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
            if (url.startsWith('/') && !url.startsWith('//')) {
              const newUrl = getAssetPath(url);
              updatedStyle = updatedStyle.replace(match, `url(${newUrl})`);
            }
          });
          element.setAttribute('style', updatedStyle);
        }
        return;
      }
      
      if (attr) {
        currentPath = element.getAttribute(attr);
        
        // Only update paths that need updating
        if (currentPath && 
            currentPath.startsWith('/') && 
            !currentPath.startsWith('//') &&
            !currentPath.startsWith(BASE_URL) && 
            !currentPath.startsWith('http')) {
          
          const newPath = getAssetPath(currentPath, {
            addCacheBusting: !element.hasAttribute('data-no-cache-bust')
          });
          element.setAttribute(attr, newPath);
        }
      }
    } catch (error) {
      console.warn('Failed to update asset path for element:', element, error);
    }
  });
}

/**
 * Set cache headers for static assets (for server-side usage)
 * @param {string} assetPath - The asset path
 * @returns {object} Cache headers object
 */
export function getCacheHeaders(assetPath) {
  const config = getEnvironmentConfig();
  const fileExtension = assetPath.split('.').pop()?.toLowerCase();
  
  // Define cache strategies by file type
  const cacheStrategies = {
    // Long-term cache for immutable assets
    immutable: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': new Date(Date.now() + 31536000 * 1000).toUTCString()
    },
    // Medium-term cache for versioned assets
    versioned: {
      'Cache-Control': 'public, max-age=86400, must-revalidate',
      'Expires': new Date(Date.now() + 86400 * 1000).toUTCString()
    },
    // Short-term cache for dynamic content
    dynamic: {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Expires': new Date(Date.now() + 3600 * 1000).toUTCString()
    },
    // No cache for development
    none: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };
  
  // Map file extensions to cache strategies
  const extensionMap = {
    // Immutable assets (with hash in filename)
    js: assetPath.includes('-') ? 'immutable' : 'versioned',
    css: assetPath.includes('-') ? 'immutable' : 'versioned',
    
    // Image assets
    jpg: 'immutable',
    jpeg: 'immutable',
    png: 'immutable',
    gif: 'immutable',
    svg: 'versioned',
    webp: 'immutable',
    ico: 'immutable',
    
    // Font assets
    woff: 'immutable',
    woff2: 'immutable',
    ttf: 'immutable',
    eot: 'immutable',
    
    // Video assets
    mp4: 'immutable',
    webm: 'immutable',
    
    // Documents
    pdf: 'versioned',
    
    // HTML and other dynamic content
    html: 'dynamic',
    json: 'dynamic'
  };
  
  if (config.cacheStrategy === 'none') {
    return cacheStrategies.none;
  }
  
  const strategy = extensionMap[fileExtension] || 'dynamic';
  const headers = { ...cacheStrategies[strategy] };
  
  // Add additional headers for security and performance
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['Vary'] = 'Accept-Encoding';
  
  // Add CORS headers for assets that might be used cross-origin
  if (['woff', 'woff2', 'ttf', 'eot'].includes(fileExtension)) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  return headers;
}

/**
 * Navigation helper for single-page applications
 * @param {string} path - The path to navigate to
 */
export function navigateTo(path) {
  const url = createUrl(path);
  if (typeof window !== 'undefined' && window.history) {
    window.history.pushState({}, '', url);
  }
}

/**
 * Initialize asset optimization features
 */
export function initializeAssetOptimization() {
  if (typeof document === 'undefined') return;
  
  // Preload critical assets
  preloadCriticalAssets();
  
  // Update existing asset paths
  updateAssetPaths();
  
  // Set up intersection observer for lazy loading images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = getAssetPath(img.dataset.src);
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Auto-initialize when module is loaded (for client-side usage)
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAssetOptimization);
} else if (typeof document !== 'undefined') {
  // DOM is already loaded
  initializeAssetOptimization();
}
