export class CustomerLogin {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      onSuccess: () => {},
      onError: () => {},
      onLoading: () => {},
      ...options
    };

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
      this.showError('Failed to initialize login form');
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="login-form-container">
        <div class="login-header">
          <h3 class="login-title">Customer Portal Login</h3>
          <p class="login-subtitle">Enter your email or phone number and access code</p>
        </div>

        <form id="login-form" class="login-form">
          <!-- Email or Phone -->
          <div class="form-group">
            <label for="customer-identifier">Email Address or Phone Number *</label>
            <input
              type="text"
              id="customer-identifier"
              name="identifier"
              required
              placeholder="Enter your email or phone number"
              autocomplete="username"
            >
          </div>

          <!-- Access Code -->
          <div class="form-group">
            <label for="access-code">Access Code *</label>
            <input
              type="password"
              id="access-code"
              name="accessCode"
              required
              placeholder="Enter your access code"
              autocomplete="current-password"
            >
            <small class="form-help">Your access code was provided in your project notification</small>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            id="submit-login"
            class="login-submit-btn"
          >
            Sign In
          </button>

          <!-- Error Display -->
          <div id="login-message" class="login-message hidden"></div>
        </form>

        <!-- Help Text -->
        <div class="login-footer">
          <p class="help-text">Need help? Contact your project manager for access.</p>
        </div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('login-form-styles')) return;

    const style = document.createElement('style');
    style.id = 'login-form-styles';
    style.textContent = `
      .login-form-container {
        max-width: 440px;
        margin: 0 auto;
        padding: 32px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .login-header {
        margin-bottom: 32px;
        text-align: center;
      }

      .login-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #111827;
      }

      .login-subtitle {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      }

      .login-form {
        margin-bottom: 24px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
        font-size: 14px;
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

      .form-help {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
      }

      .login-submit-btn {
        width: 100%;
        padding: 14px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 8px;
      }

      .login-submit-btn:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .login-submit-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .login-submit-btn.loading {
        position: relative;
        color: transparent;
      }

      .login-submit-btn.loading::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        top: 50%;
        left: 50%;
        margin-left: -10px;
        margin-top: -10px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spinner 0.6s linear infinite;
      }

      @keyframes spinner {
        to { transform: rotate(360deg); }
      }

      .hidden {
        display: none !important;
      }

      .login-message {
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
      }

      .login-message.error {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
      }

      .login-message.success {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .login-footer {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }

      .help-text {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }

      @media (max-width: 640px) {
        .login-form-container {
          margin: 16px;
          padding: 24px;
        }

        .login-title {
          font-size: 20px;
        }

        .login-subtitle {
          font-size: 13px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async setupEventListeners() {
    const form = document.getElementById('login-form');
    const identifierInput = document.getElementById('customer-identifier');
    const accessCodeInput = document.getElementById('access-code');

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    [identifierInput, accessCodeInput].forEach(input => {
      input.addEventListener('input', () => this.validateForm());
    });
  }

  async handleSubmit(event) {
    event.preventDefault();

    this.hideMessage();

    const identifierInput = document.getElementById('customer-identifier');
    const accessCodeInput = document.getElementById('access-code');
    const submitButton = document.getElementById('submit-login');

    const identifier = identifierInput.value.trim();
    const accessCode = accessCodeInput.value.trim();

    if (!identifier || !accessCode) {
      this.showMessage('Please enter both email/phone and access code', 'error');
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      this.options.onLoading();

      const response = await fetch('/api/customer-portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          accessCode
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showMessage('Login successful! Redirecting...', 'success');
        this.options.onSuccess(result.data);
      } else {
        const errorMessage = result.error || 'Invalid credentials. Please check your email/phone and access code.';
        this.showMessage(errorMessage, 'error');
        this.options.onError({ error: errorMessage });
      }
    } catch (error) {
      this.showMessage('An unexpected error occurred. Please try again.', 'error');
      this.options.onError({ error: error.message });
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }

  validateForm() {
    const identifierInput = document.getElementById('customer-identifier');
    const accessCodeInput = document.getElementById('access-code');
    const submitButton = document.getElementById('submit-login');

    const isValid = identifierInput.value.trim() && accessCodeInput.value.trim();

    submitButton.disabled = !isValid;
  }

  showMessage(message, type = 'error') {
    const messageElement = document.getElementById('login-message');
    messageElement.textContent = message;
    messageElement.className = `login-message ${type}`;
    messageElement.classList.remove('hidden');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  hideMessage() {
    const messageElement = document.getElementById('login-message');
    messageElement.classList.add('hidden');
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
