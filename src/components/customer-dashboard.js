/**
 * Customer Dashboard Component
 * Displays project overview, status, and key information for authenticated customers
 */

import { CustomerPortalService } from '../services/customer-portal-service.js';
import { AuthService } from '../services/auth-service.js';

export class CustomerDashboard {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      onLogout: () => {},
      onError: () => {},
      refreshInterval: null,
      ...options
    };

    if (!this.container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }

    this.portalService = new CustomerPortalService();
    this.authService = new AuthService();
    this.projectData = null;
    this.isLoading = true;
    this.currentView = 'overview';
    this.refreshTimer = null;

    this.init();
  }

  async init() {
    try {
      if (!this.authService.isAuthenticated()) {
        this.showError('Please log in to view your dashboard');
        return;
      }

      this.render();
      await this.loadProjectData();
      this.attachEventListeners();

      if (this.options.refreshInterval) {
        this.startAutoRefresh();
      }
    } catch (error) {
      this.showError('Failed to initialize dashboard');
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
    if (document.getElementById('customer-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'customer-dashboard-styles';
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
    const refreshBtn = document.getElementById('refresh-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const retryBtn = document.getElementById('retry-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadProjectData());
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
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
      } else {
        throw new Error(result.error || 'Failed to load project data');
      }
    } catch (error) {
      this.showError(error.message);
      this.options.onError(error);
    }
  }

  switchView(view) {
    this.currentView = view;

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderCurrentView();
  }

  renderCurrentView() {
    const container = document.getElementById('view-container');
    if (!container) return;

    switch (this.currentView) {
      case 'overview':
        container.innerHTML = this.renderOverview();
        break;
      case 'estimate':
        container.innerHTML = this.renderEstimate();
        break;
      case 'contract':
        container.innerHTML = this.renderContract();
        break;
      case 'schedule':
        container.innerHTML = this.renderSchedule();
        break;
      case 'payment':
        container.innerHTML = this.renderPayment();
        break;
      case 'updates':
        container.innerHTML = this.renderUpdates();
        break;
      default:
        container.innerHTML = this.renderOverview();
    }
  }

  renderOverview() {
    if (!this.projectData) {
      return this.renderEmptyState('No project data available');
    }

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
            <div class="info-card-value">${project.id || 'N/A'}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Service Type</span>
            <div class="info-card-value">${project.serviceType || 'N/A'}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Project Address</span>
            <div class="info-card-value">${project.address || 'N/A'}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Project Manager</span>
            <div class="info-card-value">${project.manager || 'N/A'}</div>
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
            <div class="info-card-value">${contract.status || 'Pending'}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Payment Status</span>
            <div class="info-card-value">${payment.status || 'Pending'}</div>
          </div>
          <div class="info-card">
            <span class="info-card-label">Next Milestone</span>
            <div class="info-card-value">${project.nextMilestone || 'TBD'}</div>
          </div>
        </div>
      </div>
    `;
  }

  renderEstimate() {
    const estimate = this.projectData?.estimate;

    if (!estimate) {
      return this.renderEmptyState('No estimate data available');
    }

    return `
      <div class="dashboard-section">
        <h2 class="section-title">Estimate Details</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <span class="info-card-label">Estimate Number</span>
              <div class="info-card-value">${estimate.number || 'N/A'}</div>
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
    const contract = this.projectData?.contract;

    if (!contract) {
      return this.renderEmptyState('No contract data available');
    }

    return `
      <div class="dashboard-section">
        <h2 class="section-title">Contract Details</h2>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <span class="info-card-label">Contract Number</span>
              <div class="info-card-value">${contract.number || 'N/A'}</div>
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
    const schedule = this.projectData?.schedule;

    if (!schedule || !schedule.milestones || schedule.milestones.length === 0) {
      return this.renderEmptyState('No schedule data available');
    }

    const milestonesHtml = schedule.milestones.map(milestone => `
      <div class="info-card">
        <span class="info-card-label">${milestone.name}</span>
        <div class="info-card-value">
          ${this.formatDate(milestone.date)}
          ${milestone.completed ? '<span style="color: #10b981; margin-left: 8px;">✓</span>' : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="dashboard-section">
        <h2 class="section-title">Project Schedule</h2>
        <div class="info-grid">
          ${milestonesHtml}
        </div>
      </div>
    `;
  }

  renderPayment() {
    const payment = this.projectData?.payment;

    if (!payment) {
      return this.renderEmptyState('No payment data available');
    }

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
    const updates = this.projectData?.statusUpdates;

    if (!updates || updates.length === 0) {
      return this.renderEmptyState('No status updates available');
    }

    const updatesHtml = updates.map(update => `
      <li class="update-item">
        <div class="update-date">${this.formatDate(update.date)}</div>
        <p class="update-message">${update.message}</p>
      </li>
    `).join('');

    return `
      <div class="dashboard-section">
        <h2 class="section-title">Status Updates</h2>
        <div class="section-content">
          <ul class="update-list">
            ${updatesHtml}
          </ul>
        </div>
      </div>
    `;
  }

  renderStatusBadge(status) {
    const statusLower = (status || 'pending').toLowerCase();
    const statusMap = {
      'pending': 'pending',
      'active': 'active',
      'in-progress': 'active',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'signed': 'completed',
      'paid': 'completed'
    };

    const badgeClass = statusMap[statusLower] || 'pending';
    return `<span class="status-badge ${badgeClass}">${status || 'Pending'}</span>`;
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
    if (amount === null || amount === undefined) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date) {
    if (!date) {
      return 'N/A';
    }

    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorContainer = document.getElementById('error-container');
    const dashboardContent = document.getElementById('dashboard-content');

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    if (errorContainer) errorContainer.classList.add('hidden');
    if (dashboardContent) dashboardContent.classList.add('hidden');

    this.isLoading = true;
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const dashboardContent = document.getElementById('dashboard-content');

    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    if (dashboardContent) dashboardContent.classList.remove('hidden');

    this.isLoading = false;
  }

  showError(message) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const dashboardContent = document.getElementById('dashboard-content');

    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    if (errorContainer) errorContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.textContent = message;
    if (dashboardContent) dashboardContent.classList.add('hidden');

    this.isLoading = false;
  }

  async handleRefresh() {
    await this.loadProjectData(true);
  }

  handleLogout() {
    this.stopAutoRefresh();
    this.authService.logout();
    this.options.onLogout();
  }

  startAutoRefresh() {
    this.stopAutoRefresh();

    if (this.options.refreshInterval) {
      this.refreshTimer = setInterval(() => {
        this.loadProjectData(true);
      }, this.options.refreshInterval);
    }
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
