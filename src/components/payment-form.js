import { paymentService } from '../services/payment-service.js';

export class PaymentForm {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      amount: 0,
      currency: 'USD',
      description: 'Deposit Payment',
      customerInfo: {},
      onSuccess: () => {},
      onError: () => {},
      onLoading: () => {},
      ...options
    };
    
    this.paymentElements = null;
    this.clientSecret = null;
    
    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }
    
    this.init();
  }

  async init() {
    try {
      this.render();
      await this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing payment form:', error);
      this.showError('Failed to initialize payment form');
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="payment-form-container">
        <div class="payment-header">
          <h3 class="payment-title">Payment Details</h3>
          <div class="payment-amount">
            <span class="amount-label">Amount:</span>
            <span class="amount-value">${paymentService.formatAmount(this.options.amount)}</span>
          </div>
        </div>

        <form id="payment-form" class="payment-form">
          <!-- Customer Information -->
          <div class="customer-section">
            <h4>Customer Information</h4>
            <div class="form-group">
              <label for="customer-name">Full Name *</label>
              <input 
                type="text" 
                id="customer-name" 
                name="name" 
                required 
                value="${this.options.customerInfo.name || ''}"
                placeholder="Enter your full name"
              >
            </div>
            <div class="form-group">
              <label for="customer-email">Email Address *</label>
              <input 
                type="email" 
                id="customer-email" 
                name="email" 
                required 
                value="${this.options.customerInfo.email || ''}"
                placeholder="Enter your email address"
              >
            </div>
            <div class="form-group">
              <label for="customer-phone">Phone Number</label>
              <input 
                type="tel" 
                id="customer-phone" 
                name="phone" 
                value="${this.options.customerInfo.phone || ''}"
                placeholder="Enter your phone number"
              >
            </div>
          </div>

          <!-- Payment Method -->
          <div class="payment-section">
            <h4>Payment Method</h4>
            <div id="payment-element" class="payment-element">
              <!-- Stripe Elements will create form elements here -->
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-summary">
            <div class="summary-row">
              <span>Description:</span>
              <span>${this.options.description}</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>${paymentService.formatAmount(this.options.amount)}</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            id="submit-payment" 
            class="payment-submit-btn"
>
            Process Payment
          </button>

          <!-- Error Display -->
          <div id="payment-message" class="payment-message hidden"></div>
        </form>

      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('payment-form-styles')) return;

    const style = document.createElement('style');
    style.id = 'payment-form-styles';
    style.textContent = `
      .payment-form-container {
        max-width: 500px;
        margin: 0 auto;
        padding: 24px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .payment-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .payment-title {
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
        color: #111827;
      }

      .payment-amount {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f3f4f6;
        border-radius: 8px;
      }

      .amount-label {
        font-weight: 500;
        color: #6b7280;
      }

      .amount-value {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .customer-section,
      .payment-section {
        margin-bottom: 24px;
      }

      .customer-section h4,
      .payment-section h4 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
      }

      .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      .form-group input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .payment-element {
        padding: 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #ffffff;
      }

      .payment-summary {
        margin: 24px 0;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .summary-row:last-child {
        margin-bottom: 0;
      }

      .summary-row.total {
        font-weight: 600;
        font-size: 18px;
        padding-top: 8px;
        border-top: 1px solid #d1d5db;
        margin-top: 8px;
      }

      .payment-submit-btn {
        width: 100%;
        padding: 16px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .payment-submit-btn:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .payment-submit-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .hidden {
        display: none !important;
      }

      .payment-message {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
      }

      .payment-message.error {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .payment-message.success {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }


      @media (max-width: 640px) {
        .payment-form-container {
          margin: 16px;
          padding: 16px;
        }
        
        .payment-title {
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async setupEventListeners() {
    const form = document.getElementById('payment-form');
    const submitButton = document.getElementById('submit-payment');
    
    // Initialize payment elements after creating the form
    this.initializePaymentElements();

    // Form submission
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Customer info validation
    const customerInputs = form.querySelectorAll('input[name="name"], input[name="email"]');
    customerInputs.forEach(input => {
      input.addEventListener('input', () => this.validateForm());
    });
  }

  async initializePaymentElements() {
    try {

      // Get customer info from form
      const customerInfo = this.getCustomerInfo();

      // Create payment intent
      const result = await paymentService.processDeposit(
        this.options.amount,
        customerInfo,
        { description: this.options.description }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize payment');
      }

      this.clientSecret = result.clientSecret;

      // Create Stripe elements
      this.paymentElements = await paymentService.createPaymentElements(this.clientSecret);
      
      // Mount payment element
      this.paymentElements.paymentElement.mount('#payment-element');

      // Listen for changes to enable/disable submit button
      this.paymentElements.paymentElement.on('change', (event) => {
        this.validateForm();
        if (event.error) {
          this.showMessage(event.error.message, 'error');
        } else {
          this.hideMessage();
        }
      });

      this.validateForm();
    } catch (error) {
      console.error('Error initializing payment elements:', error);
      this.showError('Failed to initialize payment form. Please refresh and try again.');
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    this.hideMessage();

    try {
      // Track payment attempt
      paymentService.trackPaymentEvent('payment_attempt', {
        amount: this.options.amount,
        currency: this.options.currency
      });

      // Get customer info
      const customerInfo = this.getCustomerInfo();

      // Confirm payment
      const result = await paymentService.confirmPayment({
        receipt_email: customerInfo.email,
      });

      if (result.success) {
        paymentService.trackPaymentEvent('payment_success', {
          paymentIntentId: result.paymentIntent.id,
          amount: this.options.amount
        });

        this.showMessage('Payment successful! Thank you for your deposit.', 'success');
        this.options.onSuccess(result);
      } else {
        paymentService.trackPaymentEvent('payment_failed', {
          error: result.error,
          type: result.type
        });

        this.showMessage(result.error || 'Payment failed. Please try again.', 'error');
        this.options.onError(result);
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showMessage('An unexpected error occurred. Please try again.', 'error');
      this.options.onError({ error: error.message });
    }
  }

  getCustomerInfo() {
    const form = document.getElementById('payment-form');
    const formData = new FormData(form);
    
    return {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || undefined
    };
  }

  validateForm() {
    const nameInput = document.getElementById('customer-name');
    const emailInput = document.getElementById('customer-email');
    const submitButton = document.getElementById('submit-payment');

    const isValid = nameInput.value.trim() && 
                   emailInput.value.trim() && 
                   emailInput.validity.valid &&
                   this.paymentElements;

    submitButton.disabled = !isValid;
  }


  showMessage(message, type = 'error') {
    const messageElement = document.getElementById('payment-message');
    messageElement.textContent = message;
    messageElement.className = `payment-message ${type}`;
    messageElement.classList.remove('hidden');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  hideMessage() {
    const messageElement = document.getElementById('payment-message');
    messageElement.classList.add('hidden');
  }

  // Public method to update amount
  updateAmount(newAmount) {
    this.options.amount = newAmount;
    const amountElement = this.container.querySelector('.amount-value');
    if (amountElement) {
      amountElement.textContent = paymentService.formatAmount(newAmount);
    }
    
    // Update summary
    const summaryAmount = this.container.querySelector('.summary-row.total span:last-child');
    if (summaryAmount) {
      summaryAmount.textContent = paymentService.formatAmount(newAmount);
    }
  }

  // Public method to destroy the form
  destroy() {
    if (this.paymentElements && this.paymentElements.paymentElement) {
      this.paymentElements.paymentElement.unmount();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
