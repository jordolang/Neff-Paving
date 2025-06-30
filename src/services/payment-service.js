import { loadStripe } from '@stripe/stripe-js';
import { ContractService } from './contract-service.js';

export class PaymentService {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.paymentElement = null;
    this.clientSecret = null;
    this.contractService = new ContractService();
    this.init();
  }

  async init() {
    try {
      // Load Stripe with public key from environment
      this.stripe = await loadStripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_your_stripe_public_key_here');
      
      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }
      
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }

  /**
   * Process a deposit payment
   * @param {number} amount - Amount in cents
   * @param {Object} customerInfo - Customer information
   * @param {string} customerInfo.email - Customer email
   * @param {string} customerInfo.name - Customer name
   * @param {string} customerInfo.phone - Customer phone
   * @param {Object} metadata - Additional metadata for the payment
   * @returns {Promise<Object>} Payment result
   */
  async processDeposit(amount, customerInfo, metadata = {}) {
    try {
      if (!this.stripe) {
        await this.init();
      }

      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          customer: customerInfo,
          metadata: {
            type: 'deposit',
            ...metadata
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { clientSecret, paymentIntentId } = await response.json();
      this.clientSecret = clientSecret;

      return {
        success: true,
        clientSecret,
        paymentIntentId,
        message: 'Payment intent created successfully'
      };
    } catch (error) {
      console.error('Error processing deposit:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process deposit'
      };
    }
  }

  /**
   * Create payment elements for the form
   * @param {string} clientSecret - Client secret from payment intent
   * @param {Object} options - Stripe elements options
   * @returns {Promise<Object>} Elements instance
   */
  async createPaymentElements(clientSecret, options = {}) {
    try {
      if (!this.stripe) {
        await this.init();
      }

      const defaultOptions = {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Ideal Sans, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
        ...options
      };

      this.elements = this.stripe.elements(defaultOptions);
      
      // Create payment element
      this.paymentElement = this.elements.create('payment', {
        layout: 'tabs',
      });

      return {
        elements: this.elements,
        paymentElement: this.paymentElement
      };
    } catch (error) {
      console.error('Error creating payment elements:', error);
      throw error;
    }
  }

  /**
   * Confirm payment with Stripe
   * @param {Object} confirmationData - Payment confirmation data
   * @returns {Promise<Object>} Payment confirmation result
   */
  async confirmPayment(confirmationData = {}) {
    try {
      if (!this.stripe || !this.elements) {
        throw new Error('Stripe not properly initialized');
      }

      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
          ...confirmationData
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          type: error.type
        };
      }

      return {
        success: true,
        paymentIntent,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment status
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentIntentId) {
    try {
      const response = await fetch(`/api/payment-status/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track payment events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  trackPaymentEvent(event, data = {}) {
    try {
      // Send event to analytics or logging service
      console.log(`Payment Event: ${event}`, data);
      
      // You can integrate with your analytics service here
      // Example: Google Analytics, Mixpanel, etc.
      if (window.gtag) {
        window.gtag('event', 'payment_' + event, {
          event_category: 'payment',
          event_label: data.paymentIntentId || 'unknown',
          value: data.amount || 0
        });
      }
    } catch (error) {
      console.error('Error tracking payment event:', error);
    }
  }

  /**
   * Format amount for display
   * @param {number} cents - Amount in cents
   * @returns {string} Formatted amount
   */
  formatAmount(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  }

  /**
   * Handle payment success and initiate scheduling
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Promise<Object>} Scheduler instance
   */
  async handlePaymentSuccess(paymentIntent) {
    try {
      // After payment success
      const scheduler = await this.contractService.initiateScheduling(paymentIntent.metadata.contractId);
      await scheduler.initializeWidget('calendly-embed');
      
      return scheduler;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
