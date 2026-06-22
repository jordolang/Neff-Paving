import "../chunks/chunk-BsPm7yBB.js";
/* empty css                       */
//#region src/services/auth-service.js
var AuthService = class {
	constructor() {
		this.token = null;
		this.user = null;
		this.apiBaseUrl = {}.API_BASE_URL || "http://localhost:3000/api";
		this.init();
	}
	init() {
		try {
			this.token = localStorage.getItem("auth_token");
			const userData = localStorage.getItem("auth_user");
			if (userData) this.user = JSON.parse(userData);
		} catch (error) {
			console.error("Error initializing auth service:", error);
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
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password
				})
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			this.token = data.token;
			this.user = data.user;
			localStorage.setItem("auth_token", this.token);
			localStorage.setItem("auth_user", JSON.stringify(this.user));
			return {
				success: true,
				user: this.user,
				token: this.token,
				message: "Login successful"
			};
		} catch (error) {
			console.error("Error logging in:", error);
			return {
				success: false,
				error: error.message,
				message: "Failed to log in"
			};
		}
	}
	/**
	* Log out the current user
	* @returns {Promise<Object>} Logout result
	*/
	async logout() {
		try {
			if (this.token) await fetch(`${this.apiBaseUrl}/auth/logout`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${this.token}`
				}
			});
			this.clearAuth();
			return {
				success: true,
				message: "Logout successful"
			};
		} catch (error) {
			console.error("Error logging out:", error);
			this.clearAuth();
			return {
				success: true,
				message: "Logout successful"
			};
		}
	}
	/**
	* Verify if the current token is valid
	* @returns {Promise<Object>} Verification result
	*/
	async verifyToken() {
		try {
			if (!this.token) return {
				success: false,
				valid: false,
				message: "No token found"
			};
			const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${this.token}`
				}
			});
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			const data = await response.json();
			return {
				success: true,
				valid: data.valid,
				user: data.user,
				message: "Token verified successfully"
			};
		} catch (error) {
			console.error("Error verifying token:", error);
			this.clearAuth();
			return {
				success: false,
				valid: false,
				error: error.message,
				message: "Token verification failed"
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
		const headers = { "Content-Type": "application/json" };
		if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
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
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email })
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				message: (await response.json()).message || "Password reset email sent"
			};
		} catch (error) {
			console.error("Error requesting password reset:", error);
			return {
				success: false,
				error: error.message,
				message: "Failed to request password reset"
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
		localStorage.removeItem("auth_token");
		localStorage.removeItem("auth_user");
	}
};
//#endregion
//#region src/services/customer-portal-service.js
var CustomerPortalService = class {
	constructor() {
		this.authService = new AuthService();
		this.apiBaseUrl = {}.API_BASE_URL || "http://localhost:3000/api";
		this.cache = {
			projectData: null,
			lastFetched: null,
			cacheDuration: 300 * 1e3
		};
	}
	/**
	* Get complete project data for the authenticated customer
	* @param {boolean} forceRefresh - Force refresh from server, bypassing cache
	* @returns {Promise<Object>} Project data result
	*/
	async getProjectData(forceRefresh = false) {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view project data"
			};
			if (!forceRefresh && this.cache.projectData && this.cache.lastFetched) {
				if (Date.now() - this.cache.lastFetched < this.cache.cacheDuration) return {
					success: true,
					data: this.cache.projectData,
					cached: true,
					message: "Project data retrieved from cache"
				};
			}
			const response = await fetch(`${this.apiBaseUrl}/customer/project`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			this.cache.projectData = data;
			this.cache.lastFetched = Date.now();
			return {
				success: true,
				data,
				cached: false,
				message: "Project data retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve project data"
			};
		}
	}
	/**
	* Get estimate data for the authenticated customer
	* @returns {Promise<Object>} Estimate data result
	*/
	async getEstimate() {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view estimate"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/estimate`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				data: await response.json(),
				message: "Estimate retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve estimate"
			};
		}
	}
	/**
	* Get contract data for the authenticated customer
	* @returns {Promise<Object>} Contract data result
	*/
	async getContract() {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view contract"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/contract`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				data: await response.json(),
				message: "Contract retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve contract"
			};
		}
	}
	/**
	* Get payment status for the authenticated customer
	* @returns {Promise<Object>} Payment status result
	*/
	async getPaymentStatus() {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view payment status"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/payment-status`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				data: await response.json(),
				message: "Payment status retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve payment status"
			};
		}
	}
	/**
	* Get project schedule for the authenticated customer
	* @returns {Promise<Object>} Schedule data result
	*/
	async getSchedule() {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view schedule"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/schedule`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				data: await response.json(),
				message: "Schedule retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve schedule"
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
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to view status updates"
			};
			const queryParams = new URLSearchParams({ limit: limit.toString() });
			const response = await fetch(`${this.apiBaseUrl}/customer/status-updates?${queryParams}`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			return {
				success: true,
				data: await response.json(),
				message: "Status updates retrieved successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to retrieve status updates"
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
		if (!this.cache.projectData || !this.cache.lastFetched) return false;
		return Date.now() - this.cache.lastFetched < this.cache.cacheDuration;
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
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to update profile"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/profile`, {
				method: "PUT",
				headers: this.authService.getAuthHeaders(),
				body: JSON.stringify(profileData)
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			this.clearCache();
			return {
				success: true,
				data,
				message: "Profile updated successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to update profile"
			};
		}
	}
	/**
	* Download contract document
	* @returns {Promise<Object>} Download result
	*/
	async downloadContract() {
		try {
			if (!this.authService.isAuthenticated()) return {
				success: false,
				error: "Not authenticated",
				message: "Please log in to download contract"
			};
			const response = await fetch(`${this.apiBaseUrl}/customer/contract/download`, {
				method: "GET",
				headers: this.authService.getAuthHeaders()
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "contract.pdf";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			return {
				success: true,
				message: "Contract downloaded successfully"
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
				message: "Failed to download contract"
			};
		}
	}
};
//#endregion
//#region src/components/customer-dashboard.js
/**
* Customer Dashboard Component
* Displays project overview, status, and key information for authenticated customers
*/
var CustomerDashboard = class {
	constructor(containerId, options = {}) {
		this.containerId = containerId;
		this.container = document.getElementById(containerId);
		this.options = {
			onLogout: () => {},
			onError: () => {},
			refreshInterval: null,
			...options
		};
		if (!this.container) throw new Error(`Container with ID "${containerId}" not found`);
		this.portalService = new CustomerPortalService();
		this.authService = new AuthService();
		this.projectData = null;
		this.isLoading = true;
		this.currentView = "overview";
		this.refreshTimer = null;
		this.init();
	}
	async init() {
		try {
			if (!this.authService.isAuthenticated()) {
				this.redirectToLogin();
				return;
			}
			this.render();
			await this.loadProjectData();
			this.attachEventListeners();
			if (this.options.refreshInterval) this.startAutoRefresh();
		} catch (error) {
			this.showError("Failed to initialize dashboard");
			this.options.onError(error);
		}
	}
	render() {
		this.container.innerHTML = `
      <div class="customer-dashboard">
        <!-- Header -->
        <div class="dashboard-header">
          <div class="header-content">
            <div class="header-title">
              <h1>My Project Dashboard</h1>
              <p class="header-subtitle">Track your paving project in real-time</p>
            </div>
            <div class="header-actions">
              <button id="refresh-btn" class="action-btn" title="Refresh data">
                <span class="btn-icon">🔄</span>
                Refresh
              </button>
              <button id="logout-btn" class="action-btn secondary">
                <span class="btn-icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div id="loading-overlay" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading your project data...</p>
        </div>

        <!-- Error State -->
        <div id="error-container" class="error-container hidden">
          <div class="error-content">
            <span class="error-icon">⚠️</span>
            <h3>Unable to Load Data</h3>
            <p id="error-message"></p>
            <button id="retry-btn" class="action-btn">Try Again</button>
          </div>
        </div>

        <!-- Main Content -->
        <div id="dashboard-content" class="dashboard-content hidden">
          <!-- Navigation Tabs -->
          <div class="dashboard-tabs">
            <button class="tab-btn active" data-view="overview">
              <span class="tab-icon">📊</span>
              Overview
            </button>
            <button class="tab-btn" data-view="estimate">
              <span class="tab-icon">💰</span>
              Estimate
            </button>
            <button class="tab-btn" data-view="contract">
              <span class="tab-icon">📄</span>
              Contract
            </button>
            <button class="tab-btn" data-view="schedule">
              <span class="tab-icon">📅</span>
              Schedule
            </button>
            <button class="tab-btn" data-view="payment">
              <span class="tab-icon">💳</span>
              Payment
            </button>
            <button class="tab-btn" data-view="updates">
              <span class="tab-icon">🔔</span>
              Updates
            </button>
          </div>

          <!-- View Container -->
          <div id="view-container" class="view-container"></div>
        </div>
      </div>
    `;
		this.addStyles();
	}
	addStyles() {
		if (document.getElementById("customer-dashboard-styles")) return;
		const style = document.createElement("style");
		style.id = "customer-dashboard-styles";
		style.textContent = `
      .customer-dashboard {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
        background: #f9fafb;
        min-height: 100vh;
      }

      .dashboard-header {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 32px 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      .header-title h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 700;
      }

      .header-subtitle {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
        color: #2563eb;
      }

      .action-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn.secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .action-btn.secondary:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
      }

      .btn-icon {
        font-size: 16px;
      }

      .loading-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 24px;
        gap: 16px;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .loading-text {
        margin: 0;
        color: #6b7280;
        font-size: 16px;
      }

      .hidden {
        display: none !important;
      }

      .error-container {
        padding: 80px 24px;
      }

      .error-content {
        text-align: center;
        max-width: 400px;
        margin: 0 auto;
      }

      .error-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }

      .error-content h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        color: #111827;
      }

      .error-content p {
        margin: 0 0 24px 0;
        color: #6b7280;
        line-height: 1.5;
      }

      .dashboard-content {
        padding: 0;
      }

      .dashboard-tabs {
        display: flex;
        gap: 4px;
        background: white;
        padding: 16px 24px 0 24px;
        border-bottom: 2px solid #e5e7eb;
        overflow-x: auto;
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .tab-btn:hover {
        color: #2563eb;
        background: #eff6ff;
      }

      .tab-btn.active {
        color: #2563eb;
        border-bottom-color: #2563eb;
      }

      .tab-icon {
        font-size: 18px;
      }

      .view-container {
        padding: 32px 24px;
        background: white;
        min-height: 500px;
      }

      .dashboard-section {
        margin-bottom: 32px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .section-content {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }

      .info-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
      }

      .info-card-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .info-card-value {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
      }

      .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.active {
        background: #dbeafe;
        color: #1e40af;
      }

      .status-badge.completed {
        background: #d1fae5;
        color: #065f46;
      }

      .status-badge.cancelled {
        background: #fee2e2;
        color: #991b1b;
      }

      .update-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .update-item {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .update-item:last-child {
        border-bottom: none;
      }

      .update-date {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .update-message {
        margin: 0;
        color: #111827;
        line-height: 1.5;
      }

      .empty-state {
        text-align: center;
        padding: 60px 24px;
        color: #6b7280;
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }

      @media (max-width: 768px) {
        .dashboard-header {
          padding: 24px 16px;
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-title h1 {
          font-size: 24px;
        }

        .header-actions {
          width: 100%;
        }

        .action-btn {
          flex: 1;
        }

        .dashboard-tabs {
          padding: 12px 16px 0 16px;
        }

        .view-container {
          padding: 24px 16px;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
		document.head.appendChild(style);
	}
	async attachEventListeners() {
		const refreshBtn = document.getElementById("refresh-btn");
		const logoutBtn = document.getElementById("logout-btn");
		const retryBtn = document.getElementById("retry-btn");
		const tabButtons = document.querySelectorAll(".tab-btn");
		if (refreshBtn) refreshBtn.addEventListener("click", () => this.handleRefresh());
		if (logoutBtn) logoutBtn.addEventListener("click", () => this.handleLogout());
		if (retryBtn) retryBtn.addEventListener("click", () => this.loadProjectData());
		tabButtons.forEach((btn) => {
			btn.addEventListener("click", (e) => {
				const view = e.currentTarget.dataset.view;
				this.switchView(view);
			});
		});
	}
	async loadProjectData(forceRefresh = false) {
		this.showLoading();
		try {
			const result = await this.portalService.getProjectData(forceRefresh);
			if (result.success) {
				this.projectData = result.data;
				this.renderCurrentView();
				this.hideLoading();
			} else throw new Error(result.error || "Failed to load project data");
		} catch (error) {
			this.showError(error.message);
			this.options.onError(error);
		}
	}
	switchView(view) {
		this.currentView = view;
		document.querySelectorAll(".tab-btn").forEach((btn) => {
			if (btn.dataset.view === view) btn.classList.add("active");
			else btn.classList.remove("active");
		});
		this.renderCurrentView();
	}
	renderCurrentView() {
		const container = document.getElementById("view-container");
		if (!container) return;
		switch (this.currentView) {
			case "overview":
				container.innerHTML = this.renderOverview();
				break;
			case "estimate":
				container.innerHTML = this.renderEstimate();
				break;
			case "contract":
				container.innerHTML = this.renderContract();
				break;
			case "schedule":
				container.innerHTML = this.renderSchedule();
				break;
			case "payment":
				container.innerHTML = this.renderPayment();
				break;
			case "updates":
				container.innerHTML = this.renderUpdates();
				break;
			default: container.innerHTML = this.renderOverview();
		}
	}
	renderOverview() {
		if (!this.projectData) return this.renderEmptyState("No project data available");
		const project = this.projectData.project || {};
		const estimate = this.projectData.estimate || {};
		const contract = this.projectData.contract || {};
		const payment = this.projectData.payment || {};
		return `
      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">Project Overview</h2>
          ${this.renderStatusBadge(project.status)}
        </div>
        <div class="info-grid">
          <div class="info-card">
            <span class="info-card-label">Project ID</span>
            <div class="info-card-value">${project.id || "N/A"}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Service Type</span>
            <div class="info-card-value">${project.serviceType || "N/A"}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Project Address</span>
            <div class="info-card-value">${project.address || "N/A"}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Project Manager</span>
            <div class="info-card-value">${project.manager || "N/A"}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2 class="section-title">Quick Summary</h2>
        <div class="info-grid">
          <div class="info-card">
            <span class="info-card-label">Estimate Total</span>
            <div class="info-card-value">${this.formatCurrency(estimate.total)}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Contract Status</span>
            <div class="info-card-value">${contract.status || "Pending"}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Payment Status</span>
            <div class="info-card-value">${payment.status || "Pending"}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Next Milestone</span>
            <div class="info-card-value">${project.nextMilestone || "TBD"}</div>
          </div>
        </div>
      </div>
    `;
	}
	renderEstimate() {
		var _this$projectData;
		const estimate = (_this$projectData = this.projectData) === null || _this$projectData === void 0 ? void 0 : _this$projectData.estimate;
		if (!estimate) return this.renderEmptyState("No estimate data available");
		return `
      <div class="dashboard-section">
        <h2 class="section-title">Estimate Details</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <span class="info-card-label">Estimate Number</span>
              <div class="info-card-value">${estimate.number || "N/A"}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Date Issued</span>
              <div class="info-card-value">${this.formatDate(estimate.dateIssued)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Valid Until</span>
              <div class="info-card-value">${this.formatDate(estimate.validUntil)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Total Amount</span>
              <div class="info-card-value">${this.formatCurrency(estimate.total)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
	}
	renderContract() {
		var _this$projectData2;
		const contract = (_this$projectData2 = this.projectData) === null || _this$projectData2 === void 0 ? void 0 : _this$projectData2.contract;
		if (!contract) return this.renderEmptyState("No contract data available");
		return `
      <div class="dashboard-section">
        <h2 class="section-title">Contract Details</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <span class="info-card-label">Contract Number</span>
              <div class="info-card-value">${contract.number || "N/A"}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Status</span>
              <div class="info-card-value">${this.renderStatusBadge(contract.status)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Date Signed</span>
              <div class="info-card-value">${this.formatDate(contract.dateSigned)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Start Date</span>
              <div class="info-card-value">${this.formatDate(contract.startDate)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
	}
	renderSchedule() {
		var _this$projectData3;
		const schedule = (_this$projectData3 = this.projectData) === null || _this$projectData3 === void 0 ? void 0 : _this$projectData3.schedule;
		if (!schedule || !schedule.milestones || schedule.milestones.length === 0) return this.renderEmptyState("No schedule data available");
		return `
      <div class="dashboard-section">
        <h2 class="section-title">Project Schedule</h2>
        <div class="info-grid">
          ${schedule.milestones.map((milestone) => `
      <div class="info-card">
        <span class="info-card-label">${milestone.name}</span>
        <div class="info-card-value">
          ${this.formatDate(milestone.date)}
          ${milestone.completed ? "<span style=\"color: #10b981; margin-left: 8px;\">✓</span>" : ""}
        </div>
      </div>
    `).join("")}
        </div>
      </div>
    `;
	}
	renderPayment() {
		var _this$projectData4;
		const payment = (_this$projectData4 = this.projectData) === null || _this$projectData4 === void 0 ? void 0 : _this$projectData4.payment;
		if (!payment) return this.renderEmptyState("No payment data available");
		return `
      <div class="dashboard-section">
        <h2 class="section-title">Payment Information</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <span class="info-card-label">Total Contract</span>
              <div class="info-card-value">${this.formatCurrency(payment.total)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Amount Paid</span>
              <div class="info-card-value">${this.formatCurrency(payment.paid)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Amount Due</span>
              <div class="info-card-value">${this.formatCurrency(payment.due)}</div>
            </div>
            <div class="info-card">
              <span class="info-card-label">Payment Status</span>
              <div class="info-card-value">${this.renderStatusBadge(payment.status)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
	}
	renderUpdates() {
		var _this$projectData5;
		const updates = (_this$projectData5 = this.projectData) === null || _this$projectData5 === void 0 ? void 0 : _this$projectData5.statusUpdates;
		if (!updates || updates.length === 0) return this.renderEmptyState("No status updates available");
		return `
      <div class="dashboard-section">
        <h2 class="section-title">Status Updates</h2>
        <div class="section-content">
          <ul class="update-list">
            ${updates.map((update) => `
      <li class="update-item">
        <div class="update-date">${this.formatDate(update.date)}</div>
        <p class="update-message">${update.message}</p>
      </li>
    `).join("")}
          </ul>
        </div>
      </div>
    `;
	}
	renderStatusBadge(status) {
		return `<span class="status-badge ${{
			"pending": "pending",
			"active": "active",
			"in-progress": "active",
			"completed": "completed",
			"cancelled": "cancelled",
			"signed": "completed",
			"paid": "completed"
		}[(status || "pending").toLowerCase()] || "pending"}">${status || "Pending"}</span>`;
	}
	renderEmptyState(message) {
		return `
      <div class="empty-state">
        <span class="empty-state-icon">📭</span>
        <p>${message}</p>
      </div>
    `;
	}
	formatCurrency(amount) {
		if (amount === null || amount === void 0) return "N/A";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD"
		}).format(amount);
	}
	formatDate(date) {
		if (!date) return "N/A";
		try {
			return new Date(date).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric"
			});
		} catch {
			return "Invalid Date";
		}
	}
	showLoading() {
		const loadingOverlay = document.getElementById("loading-overlay");
		const errorContainer = document.getElementById("error-container");
		const dashboardContent = document.getElementById("dashboard-content");
		if (loadingOverlay) loadingOverlay.classList.remove("hidden");
		if (errorContainer) errorContainer.classList.add("hidden");
		if (dashboardContent) dashboardContent.classList.add("hidden");
		this.isLoading = true;
	}
	hideLoading() {
		const loadingOverlay = document.getElementById("loading-overlay");
		const dashboardContent = document.getElementById("dashboard-content");
		if (loadingOverlay) loadingOverlay.classList.add("hidden");
		if (dashboardContent) dashboardContent.classList.remove("hidden");
		this.isLoading = false;
	}
	showError(message) {
		const loadingOverlay = document.getElementById("loading-overlay");
		const errorContainer = document.getElementById("error-container");
		const errorMessage = document.getElementById("error-message");
		const dashboardContent = document.getElementById("dashboard-content");
		if (loadingOverlay) loadingOverlay.classList.add("hidden");
		if (errorContainer) errorContainer.classList.remove("hidden");
		if (errorMessage) errorMessage.textContent = message;
		if (dashboardContent) dashboardContent.classList.add("hidden");
		this.isLoading = false;
	}
	async handleRefresh() {
		await this.loadProjectData(true);
	}
	handleLogout() {
		this.stopAutoRefresh();
		this.authService.logout();
		this.options.onLogout();
		this.redirectToLogin();
	}
	redirectToLogin() {
		window.location.href = "/customer-portal.html";
	}
	startAutoRefresh() {
		this.stopAutoRefresh();
		if (this.options.refreshInterval) this.refreshTimer = setInterval(() => {
			this.loadProjectData(true);
		}, this.options.refreshInterval);
	}
	stopAutoRefresh() {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = null;
		}
	}
	destroy() {
		this.stopAutoRefresh();
		if (this.container) this.container.innerHTML = "";
	}
};
//#endregion
//#region customer-dashboard.html?html-proxy&index=0.js
new CustomerDashboard("dashboard-root", {
	refreshInterval: 3e5,
	onLogout: () => {
		window.location.href = "/customer-portal.html";
	},
	onError: (error) => {
		console.error("Dashboard error:", error);
	}
});
//#endregion

//# sourceMappingURL=customer-dashboard-r0TYEWqt.js.map