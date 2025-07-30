/**
 * Cache Busting Utilities
 * Uses build-time environment variables to force cache invalidation
 */

// Build timestamp is available as a global constant
const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__;
const DEPLOY_TIME = __DEPLOY_TIME__;
const PLATFORM = __PLATFORM__;

/**
 * Add cache-busting parameter to URLs
 * @param {string} url - The URL to add cache busting to
 * @param {boolean} useTimestamp - Whether to use build timestamp or deploy time
 * @returns {string} URL with cache-busting parameter
 */
export function addCacheBusting(url, useTimestamp = true) {
  const timestamp = useTimestamp ? BUILD_TIMESTAMP : DEPLOY_TIME;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(timestamp)}`;
}

/**
 * Create a cache-busted fetch request
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export function fetchWithCacheBusting(url, options = {}) {
  const cachedUrl = addCacheBusting(url);
  return fetch(cachedUrl, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache',
      ...options.headers
    }
  });
}

/**
 * Load CSS with cache busting
 * @param {string} href - CSS file path
 * @returns {Promise<void>}
 */
export function loadCSSWithCacheBusting(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = addCacheBusting(href);
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Load JavaScript with cache busting
 * @param {string} src - JavaScript file path
 * @returns {Promise<void>}
 */
export function loadScriptWithCacheBusting(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = addCacheBusting(src);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Get build information for debugging
 * @returns {object} Build information
 */
export function getBuildInfo() {
  return {
    timestamp: BUILD_TIMESTAMP,
    deployTime: DEPLOY_TIME,
    platform: PLATFORM,
    date: new Date(BUILD_TIMESTAMP).toLocaleString(),
    deployDate: new Date(parseInt(DEPLOY_TIME)).toLocaleString()
  };
}

// Log build info in development
if (import.meta.env.DEV) {
  console.log('🔧 Build Info:', getBuildInfo());
}

// Export build constants for external use
export { BUILD_TIMESTAMP, DEPLOY_TIME, PLATFORM };
