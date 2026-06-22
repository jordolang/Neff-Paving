import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../config/maps.js';

/**
 * MapsLoaderService
 * Robust Google Maps loader with retry logic, timeout handling, and error detection
 */
export class MapsLoaderService {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || GOOGLE_MAPS_CONFIG.apiKey,
      version: config.version || GOOGLE_MAPS_CONFIG.version || 'weekly',
      libraries: config.libraries || GOOGLE_MAPS_CONFIG.libraries || ['drawing', 'geometry', 'places'],
      region: config.region || GOOGLE_MAPS_CONFIG.region || 'US',
      language: config.language || GOOGLE_MAPS_CONFIG.language || 'en',
      ...config
    };

    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 4000,  // 4 seconds max
      timeoutMs: 10000 // 10 second timeout per attempt
    };

    this.loader = null;
    this.loadPromise = null;
    this.loadAttempts = 0;
  }

  /**
   * Load Google Maps API with retry logic
   * @returns {Promise<object>} Resolves with {success: true, google} or {success: false, error, errorType}
   */
  async load() {
    // Return existing load promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadWithRetry();
    return this.loadPromise;
  }

  /**
   * Internal method to load with retry logic
   * @private
   */
  async _loadWithRetry() {
    let lastError = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      this.loadAttempts = attempt + 1;

      try {
        // Wait for exponential backoff delay (except on first attempt)
        if (attempt > 0) {
          const delay = this._calculateBackoffDelay(attempt);
          await this._sleep(delay);
        }

        // Attempt to load the Maps API
        const google = await this._loadWithTimeout();

        // Success - reset state and return
        this.loadPromise = null;
        return {
          success: true,
          google: google,
          attempts: this.loadAttempts
        };

      } catch (error) {
        lastError = error;

        // Detect error type
        const errorType = this._detectErrorType(error);

        // Don't retry on quota or key errors (they won't succeed on retry)
        if (errorType === 'QUOTA_EXCEEDED' || errorType === 'INVALID_KEY') {
          this.loadPromise = null;
          return {
            success: false,
            error: error,
            errorType: errorType,
            message: this._getErrorMessage(errorType, error),
            attempts: this.loadAttempts,
            retryable: false
          };
        }

        // Continue to next retry attempt
        if (attempt < this.retryConfig.maxRetries) {
          continue;
        }
      }
    }

    // All retries exhausted
    this.loadPromise = null;
    const errorType = this._detectErrorType(lastError);

    return {
      success: false,
      error: lastError,
      errorType: errorType,
      message: this._getErrorMessage(errorType, lastError),
      attempts: this.loadAttempts,
      retryable: true,
      retriesExhausted: true
    };
  }

  /**
   * Load Google Maps API with timeout
   * @private
   */
  async _loadWithTimeout() {
    // Create loader instance
    this.loader = new Loader(this.config);

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, this.retryConfig.timeoutMs);
    });

    // Race between loader and timeout
    try {
      const google = await Promise.race([
        this.loader.load(),
        timeoutPromise
      ]);
      return google;
    } catch (error) {
      // Clean up loader on error
      this.loader = null;
      throw error;
    }
  }

  /**
   * Detect the type of error that occurred
   * @private
   */
  _detectErrorType(error) {
    if (!error) {
      return 'UNKNOWN_ERROR';
    }

    const errorMessage = error.message || String(error);
    const errorString = errorMessage.toLowerCase();

    // Check for specific Google Maps API errors
    if (errorString.includes('quota') || errorString.includes('over_query_limit')) {
      return 'QUOTA_EXCEEDED';
    }

    if (errorString.includes('request_denied') || errorString.includes('invalid') || errorString.includes('key')) {
      return 'INVALID_KEY';
    }

    if (errorString.includes('timeout')) {
      return 'TIMEOUT';
    }

    if (errorString.includes('network') || errorString.includes('failed to fetch') || errorString.includes('load failed')) {
      return 'NETWORK_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message
   * @private
   */
  _getErrorMessage(errorType, error) {
    const messages = {
      'QUOTA_EXCEEDED': 'Google Maps quota exceeded. Please try again later or use manual entry.',
      'INVALID_KEY': 'Google Maps API key error. Please use manual entry to submit your estimate.',
      'TIMEOUT': 'Google Maps loading timed out. Please check your connection and try again.',
      'NETWORK_ERROR': 'Network error loading Google Maps. Please check your internet connection.',
      'UNKNOWN_ERROR': 'Unable to load Google Maps. Please try manual entry.'
    };

    return messages[errorType] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  _calculateBackoffDelay(attempt) {
    // Exponential backoff: 1s, 2s, 4s
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Sleep helper for delays
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Google Maps is already loaded
   * @returns {boolean}
   */
  isLoaded() {
    return typeof google !== 'undefined' && google.maps;
  }

  /**
   * Get the current loader instance
   * @returns {Loader|null}
   */
  getLoader() {
    return this.loader;
  }

  /**
   * Reset the service state (useful for testing)
   */
  reset() {
    this.loader = null;
    this.loadPromise = null;
    this.loadAttempts = 0;
  }
}

// Export singleton instance for convenience
export const mapsLoader = new MapsLoaderService();
