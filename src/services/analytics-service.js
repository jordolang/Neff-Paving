import { track as vercelTrack } from '@vercel/analytics';

/**
 * Analytics Service
 * Centralized service for tracking user interactions and events
 * Integrates with Vercel Analytics
 */
export class AnalyticsService {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      debug: false,
      enableVercelAnalytics: true,
      ...options
    };

    this.eventQueue = [];
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize analytics service
   */
  async init() {
    try {
      if (this.isInitialized) {
        return;
      }

      // Check if analytics should be disabled (e.g., dev environment)
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        this.options.enabled = this.options.debug;
      }

      this.isInitialized = true;

      if (this.options.debug) {
        this.log('Analytics service initialized', this.options);
      }

      // Process any queued events
      this.processQueue();
    } catch (error) {
      this.handleError('Error initializing analytics', error);
    }
  }

  /**
   * Track an event
   * @param {string} eventName - Name of the event to track
   * @param {Object} properties - Event properties/metadata
   * @returns {Promise<Object>} Tracking result
   */
  async track(eventName, properties = {}) {
    try {
      if (!this.options.enabled) {
        if (this.options.debug) {
          this.log('Analytics disabled, skipping event:', eventName, properties);
        }
        return { success: true, skipped: true };
      }

      if (!this.isInitialized) {
        this.eventQueue.push({ eventName, properties, timestamp: Date.now() });
        return { success: true, queued: true };
      }

      // Filter out blocked PII properties
      const { BLOCKED_PROPERTIES } = await import('../config/analytics-config.js');
      const filteredProperties = Object.keys(properties).reduce((acc, key) => {
        // Check if property name contains any blocked terms
        const isBlocked = BLOCKED_PROPERTIES.some(blocked =>
          key.toLowerCase().includes(blocked.toLowerCase())
        );

        if (!isBlocked) {
          acc[key] = properties[key];
        } else if (this.options.debug) {
          console.warn(`[Analytics] Blocked PII property: ${key}`);
        }

        return acc;
      }, {});

      const enrichedProperties = {
        ...filteredProperties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      };

      if (this.options.debug) {
        this.log('Tracking event:', eventName, enrichedProperties);
      }

      // Track with Vercel Analytics
      if (this.options.enableVercelAnalytics) {
        await this.trackWithVercel(eventName, enrichedProperties);
      }

      return {
        success: true,
        eventName,
        properties: enrichedProperties
      };
    } catch (error) {
      this.handleError('Error tracking event', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track event with Vercel Analytics
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  async trackWithVercel(eventName, properties) {
    try {
      vercelTrack(eventName, properties);
    } catch (error) {
      this.handleError('Error tracking with Vercel Analytics', error);
    }
  }

  /**
   * Track page view
   * @param {string} pageName - Name/path of the page
   * @param {Object} properties - Additional page properties
   * @returns {Promise<Object>} Tracking result
   */
  async trackPageView(pageName, properties = {}) {
    return this.track('page_view', {
      page: pageName,
      ...properties
    });
  }

  /**
   * Track estimate request
   * @param {Object} estimateData - Estimate request data
   * @returns {Promise<Object>} Tracking result
   */
  async trackEstimateRequest(estimateData) {
    return this.track('estimate_request', {
      service_type: estimateData.serviceType,
      has_property_info: !!estimateData.propertyAddress,
      has_area_drawn: !!estimateData.area,
      ...estimateData
    });
  }

  /**
   * Track estimate completion
   * @param {Object} estimateData - Completed estimate data
   * @returns {Promise<Object>} Tracking result
   */
  async trackEstimateComplete(estimateData) {
    return this.track('estimate_complete', {
      estimate_id: estimateData.id,
      total_amount: estimateData.totalAmount,
      service_type: estimateData.serviceType,
      ...estimateData
    });
  }

  /**
   * Track booking/contract creation
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} Tracking result
   */
  async trackBooking(contractData) {
    return this.track('booking_created', {
      contract_id: contractData.id,
      estimate_id: contractData.estimateId,
      total_amount: contractData.totalAmount,
      deposit_amount: contractData.depositAmount,
      ...contractData
    });
  }

  /**
   * Track payment initiation
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Tracking result
   */
  async trackPaymentInitiated(paymentData) {
    return this.track('payment_initiated', {
      payment_id: paymentData.id,
      amount: paymentData.amount,
      payment_type: paymentData.type,
      ...paymentData
    });
  }

  /**
   * Track payment success
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Tracking result
   */
  async trackPaymentSuccess(paymentData) {
    return this.track('payment_success', {
      payment_id: paymentData.id,
      amount: paymentData.amount,
      payment_type: paymentData.type,
      ...paymentData
    });
  }

  /**
   * Track payment failure
   * @param {Object} paymentData - Payment data
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} Tracking result
   */
  async trackPaymentFailure(paymentData, errorMessage) {
    return this.track('payment_failure', {
      payment_id: paymentData.id,
      amount: paymentData.amount,
      payment_type: paymentData.type,
      error: errorMessage,
      ...paymentData
    });
  }

  /**
   * Track consultation booking
   * @param {Object} consultationData - Consultation booking data
   * @returns {Promise<Object>} Tracking result
   */
  async trackConsultationBooked(consultationData) {
    return this.track('consultation_booked', {
      contract_id: consultationData.contractId,
      calendly_event_uri: consultationData.calendlyEventUri,
      scheduled_time: consultationData.scheduledTime,
      end_time: consultationData.endTime,
      // client_name and client_email removed for privacy compliance
      meeting_type: consultationData.meetingType,
      service_type: consultationData.estimateData?.serviceType,
      estimated_cost: consultationData.estimateData?.totalCost
      // Removed unsafe spread operator
    });
  }

  /**
   * Track form abandonment
   * @param {string} formName - Name of the form
   * @param {Object} formData - Partial form data
   * @returns {Promise<Object>} Tracking result
   */
  async trackFormAbandonment(formName, formData = {}) {
    return this.track('form_abandoned', {
      form_name: formName,
      fields_completed: Object.keys(formData).length,
      ...formData
    });
  }

  /**
   * Track error
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {Object} context - Error context
   * @returns {Promise<Object>} Tracking result
   */
  async trackError(errorType, errorMessage, context = {}) {
    return this.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      ...context
    });
  }

  /**
   * Process queued events
   */
  processQueue() {
    if (this.eventQueue.length === 0) {
      return;
    }

    if (this.options.debug) {
      this.log(`Processing ${this.eventQueue.length} queued events`);
    }

    const queue = [...this.eventQueue];
    this.eventQueue = [];

    queue.forEach(({ eventName, properties }) => {
      this.track(eventName, properties);
    });
  }

  /**
   * Enable analytics tracking
   */
  enable() {
    this.options.enabled = true;
    if (this.options.debug) {
      this.log('Analytics enabled');
    }
  }

  /**
   * Disable analytics tracking
   */
  disable() {
    this.options.enabled = false;
    if (this.options.debug) {
      this.log('Analytics disabled');
    }
  }

  /**
   * Check if analytics is enabled
   * @returns {boolean} Whether analytics is enabled
   */
  isEnabled() {
    return this.options.enabled;
  }

  /**
   * Log debug message
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.log('[Analytics]', ...args);
    }
  }

  /**
   * Handle error
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  handleError(message, error) {
    if (this.options.debug) {
      // eslint-disable-next-line no-console
      console.error(`[Analytics] ${message}:`, error);
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService({
  debug: process.env.NODE_ENV === 'development'
});

export default analyticsService;
