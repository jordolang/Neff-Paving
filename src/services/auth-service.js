export class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.init();
  }

  init() {
    try {
      // Load token and user from localStorage if available
      this.token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('auth_user');

      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      this.clearAuth();
    }
  }

  /**
   * Log in a customer with email and password
   * @param {string} email - Customer email
   * @param {string} password - Customer password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store token and user data
      this.token = data.token;
      this.user = data.user;

      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(this.user));

      return {
        success: true,
        user: this.user,
        token: this.token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to log in'
      };
    }
  }

  /**
   * Log out the current user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      // Call logout endpoint if token exists
      if (this.token) {
        await fetch(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
        });
      }

      // Clear local auth state
      this.clearAuth();

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear local state even if API call fails
      this.clearAuth();
      return {
        success: true,
        message: 'Logout successful'
      };
    }
  }

  /**
   * Verify if the current token is valid
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken() {
    try {
      if (!this.token) {
        return {
          success: false,
          valid: false,
          message: 'No token found'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        valid: data.valid,
        user: data.user,
        message: 'Token verified successfully'
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      // Clear invalid token
      this.clearAuth();
      return {
        success: false,
        valid: false,
        error: error.message,
        message: 'Token verification failed'
      };
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get the current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Get the current auth token
   * @returns {string|null} Current token or null
   */
  getToken() {
    return this.token;
  }

  /**
   * Get authorization headers for API requests
   * @returns {Object} Headers object with authorization
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Request password reset for a customer
   * @param {string} email - Customer email
   * @returns {Promise<Object>} Password reset result
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message || 'Password reset email sent'
      };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to request password reset'
      };
    }
  }

  /**
   * Clear authentication state
   * @private
   */
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}
