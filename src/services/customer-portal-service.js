import { AuthService } from './auth-service.js';

export class CustomerPortalService {
  constructor() {
    this.authService = new AuthService();
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.cache = {
      projectData: null,
      lastFetched: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Get complete project data for the authenticated customer
   * @param {boolean} forceRefresh - Force refresh from server, bypassing cache
   * @returns {Promise<Object>} Project data result
   */
  async getProjectData(forceRefresh = false) {
    try {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view project data'
        };
      }

      // Check cache if not forcing refresh
      if (!forceRefresh && this.cache.projectData && this.cache.lastFetched) {
        const cacheAge = Date.now() - this.cache.lastFetched;
        if (cacheAge < this.cache.cacheDuration) {
          return {
            success: true,
            data: this.cache.projectData,
            cached: true,
            message: 'Project data retrieved from cache'
          };
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/project`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache
      this.cache.projectData = data;
      this.cache.lastFetched = Date.now();

      return {
        success: true,
        data,
        cached: false,
        message: 'Project data retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve project data'
      };
    }
  }

  /**
   * Get estimate data for the authenticated customer
   * @returns {Promise<Object>} Estimate data result
   */
  async getEstimate() {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view estimate'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/estimate`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        message: 'Estimate retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve estimate'
      };
    }
  }

  /**
   * Get contract data for the authenticated customer
   * @returns {Promise<Object>} Contract data result
   */
  async getContract() {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view contract'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/contract`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        message: 'Contract retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve contract'
      };
    }
  }

  /**
   * Get payment status for the authenticated customer
   * @returns {Promise<Object>} Payment status result
   */
  async getPaymentStatus() {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view payment status'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/payment-status`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        message: 'Payment status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve payment status'
      };
    }
  }

  /**
   * Get project schedule for the authenticated customer
   * @returns {Promise<Object>} Schedule data result
   */
  async getSchedule() {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view schedule'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/schedule`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        message: 'Schedule retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve schedule'
      };
    }
  }

  /**
   * Get project status updates for the authenticated customer
   * @param {number} limit - Maximum number of updates to retrieve
   * @returns {Promise<Object>} Status updates result
   */
  async getStatusUpdates(limit = 10) {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to view status updates'
        };
      }

      const queryParams = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(`${this.apiBaseUrl}/customer/status-updates?${queryParams}`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        message: 'Status updates retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve status updates'
      };
    }
  }

  /**
   * Clear cached project data
   */
  clearCache() {
    this.cache.projectData = null;
    this.cache.lastFetched = null;
  }

  /**
   * Check if cached data is available and fresh
   * @returns {boolean} Cache status
   */
  hasFreshCache() {
    if (!this.cache.projectData || !this.cache.lastFetched) {
      return false;
    }

    const cacheAge = Date.now() - this.cache.lastFetched;
    return cacheAge < this.cache.cacheDuration;
  }

  /**
   * Update profile information for the authenticated customer
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.name - Customer name
   * @param {string} profileData.phone - Customer phone
   * @param {string} profileData.address - Customer address
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(profileData) {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to update profile'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/profile`, {
        method: 'PUT',
        headers: this.authService.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Clear cache to force refresh on next fetch
      this.clearCache();

      return {
        success: true,
        data,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update profile'
      };
    }
  }

  /**
   * Download contract document
   * @returns {Promise<Object>} Download result
   */
  async downloadContract() {
    try {
      if (!this.authService.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to download contract'
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/customer/contract/download`, {
        method: 'GET',
        headers: this.authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'contract.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Contract downloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to download contract'
      };
    }
  }
}
