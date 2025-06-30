export class CalendlyScheduler {
  constructor(contractId, estimateData) {
    this.contractId = contractId;
    this.estimateData = estimateData;
    this.calendlyUrl = this.generateCalendlyUrl();
    this.widget = null;
    this.eventTypeUrl = process.env.CALENDLY_EVENT_TYPE_URL || 'https://calendly.com/your-account/consultation';
  }

  generateCalendlyUrl() {
    // Build Calendly URL with prefilled data
    const params = new URLSearchParams({
      name: this.estimateData.clientName,
      email: this.estimateData.clientEmail,
      contract_id: this.contractId,
      project_type: this.estimateData.serviceType,
      duration: this.estimateData.timeline.days
    });
    
    return `${this.getEventTypeUrl()}?${params.toString()}`;
  }

  getEventTypeUrl() {
    return this.eventTypeUrl;
  }

  async initializeWidget(elementId) {
    // Initialize Calendly widget with configuration
    try {
      // Ensure Calendly script is loaded
      await this.loadCalendlyScript();
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      // Clear any existing content
      element.innerHTML = '';

      // Configure Calendly widget options
      const widgetOptions = {
        url: this.calendlyUrl,
        parentElement: element,
        prefill: {
          name: this.estimateData.clientName,
          email: this.estimateData.clientEmail,
          customAnswers: {
            a1: this.contractId, // Contract ID
            a2: this.estimateData.serviceType, // Project type
            a3: this.estimateData.timeline.days, // Duration
            a4: this.estimateData.totalCost || 'TBD', // Estimated cost
            a5: this.estimateData.address || '' // Project address
          }
        },
        utm: {
          utmCampaign: 'contract_scheduling',
          utmSource: 'estimate_system',
          utmMedium: 'widget',
          utmContent: this.contractId
        }
      };

      // Initialize the widget
      if (window.Calendly && window.Calendly.initInlineWidget) {
        this.widget = window.Calendly.initInlineWidget(widgetOptions);
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Calendly widget initialized successfully');
        return this.widget;
      } else {
        throw new Error('Calendly API not available');
      }
    } catch (error) {
      console.error('Failed to initialize Calendly widget:', error);
      this.showErrorMessage(elementId, error.message);
      throw error;
    }
  }

  async loadCalendlyScript() {
    return new Promise((resolve, reject) => {
      // Check if Calendly is already loaded
      if (window.Calendly) {
        resolve();
        return;
      }

      // Create and load the Calendly script
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Calendly script loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Calendly script'));
      };

      document.head.appendChild(script);
    });
  }

  setupEventListeners() {
    // Listen for Calendly events
    window.addEventListener('message', (e) => {
      if (e.origin !== 'https://calendly.com') return;
      
      const eventData = e.data;
      
      switch (eventData.event) {
        case 'calendly.event_scheduled':
          this.handleSchedulingComplete(eventData);
          break;
        case 'calendly.event_type_viewed':
          this.handleEventTypeViewed(eventData);
          break;
        case 'calendly.date_and_time_selected':
          this.handleDateTimeSelected(eventData);
          break;
        case 'calendly.profile_page_viewed':
          this.handleProfilePageViewed(eventData);
          break;
        default:
          console.log('Calendly event received:', eventData.event);
      }
    });
  }

  handleSchedulingComplete(event) {
    // Process scheduling completion
    // Trigger notifications
    console.log('Meeting scheduled successfully:', event);
    
    try {
      const schedulingData = {
        contractId: this.contractId,
        calendlyEventUri: event.payload.event.uri,
        scheduledTime: event.payload.event.start_time,
        endTime: event.payload.event.end_time,
        clientName: event.payload.invitee.name,
        clientEmail: event.payload.invitee.email,
        meetingType: event.payload.event_type.name,
        location: event.payload.event.location,
        estimateData: this.estimateData
      };

      // Send notification to backend
      this.notifyBackend(schedulingData);
      
      // Send confirmation email
      this.sendConfirmationEmail(schedulingData);
      
      // Update contract status
      this.updateContractStatus(schedulingData);
      
      // Trigger custom event for other components
      this.dispatchCustomEvent('calendly:scheduled', schedulingData);
      
      // Show success message
      this.showSuccessMessage(schedulingData);
      
    } catch (error) {
      console.error('Error processing scheduled meeting:', error);
      this.handleSchedulingError(error);
    }
  }

  handleEventTypeViewed(event) {
    console.log('Event type viewed:', event);
    // Track analytics if needed
    this.trackAnalytics('event_type_viewed', {
      contractId: this.contractId,
      eventType: event.payload.event_type.name
    });
  }

  handleDateTimeSelected(event) {
    console.log('Date and time selected:', event);
    // Track analytics and possibly show additional info
    this.trackAnalytics('datetime_selected', {
      contractId: this.contractId,
      selectedTime: event.payload.start_time
    });
  }

  handleProfilePageViewed(event) {
    console.log('Profile page viewed:', event);
    // Track analytics
    this.trackAnalytics('profile_viewed', {
      contractId: this.contractId
    });
  }

  async notifyBackend(schedulingData) {
    try {
      const response = await fetch('/api/scheduling/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedulingData)
      });

      if (!response.ok) {
        throw new Error(`Backend notification failed: ${response.statusText}`);
      }

      console.log('Backend notified successfully');
    } catch (error) {
      console.error('Failed to notify backend:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  async sendConfirmationEmail(schedulingData) {
    try {
      const response = await fetch('/api/emails/confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: schedulingData.clientEmail,
          contractId: schedulingData.contractId,
          meetingDetails: schedulingData
        })
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
      }

      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  async updateContractStatus(schedulingData) {
    try {
      const response = await fetch(`/api/contracts/${this.contractId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'meeting_scheduled',
          meetingDetails: {
            scheduledTime: schedulingData.scheduledTime,
            calendlyEventUri: schedulingData.calendlyEventUri
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Contract update failed: ${response.statusText}`);
      }

      console.log('Contract status updated successfully');
    } catch (error) {
      console.error('Failed to update contract status:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  dispatchCustomEvent(eventName, data) {
    const customEvent = new CustomEvent(eventName, {
      detail: data,
      bubbles: true
    });
    document.dispatchEvent(customEvent);
  }

  trackAnalytics(action, data) {
    // Track analytics - integrate with your analytics service
    if (window.gtag) {
      window.gtag('event', action, {
        custom_parameter_1: data.contractId,
        ...data
      });
    }
    
    if (window.analytics) {
      window.analytics.track(action, data);
    }
    
    console.log('Analytics tracked:', action, data);
  }

  showSuccessMessage(schedulingData) {
    const message = `
      <div class="calendly-success-message">
        <h3>✅ Meeting Scheduled Successfully!</h3>
        <p><strong>Date:</strong> ${new Date(schedulingData.scheduledTime).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(schedulingData.scheduledTime).toLocaleTimeString()}</p>
        <p><strong>Meeting Type:</strong> ${schedulingData.meetingType}</p>
        <p>A confirmation email has been sent to ${schedulingData.clientEmail}</p>
        <p><strong>Contract ID:</strong> ${this.contractId}</p>
      </div>
    `;
    
    this.showMessage(message, 'success');
  }

  showErrorMessage(elementId, errorMessage) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="calendly-error-message">
          <h3>❌ Unable to Load Scheduler</h3>
          <p>Error: ${errorMessage}</p>
          <p>Please try refreshing the page or contact support.</p>
          <button onclick="location.reload()">Refresh Page</button>
        </div>
      `;
    }
  }

  showMessage(message, type = 'info') {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = `calendly-notification calendly-notification--${type}`;
    notification.innerHTML = message;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
      padding: 15px;
      border-radius: 5px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  handleSchedulingError(error) {
    console.error('Scheduling error:', error);
    this.showMessage(`
      <h4>Scheduling Error</h4>
      <p>There was an issue processing your scheduled meeting: ${error.message}</p>
      <p>Your meeting is still scheduled in Calendly, but please contact support for assistance.</p>
    `, 'error');
  }

  // Utility method to destroy the widget
  destroy() {
    if (this.widget && typeof this.widget.destroy === 'function') {
      this.widget.destroy();
    }
    this.widget = null;
    
    // Remove event listeners
    window.removeEventListener('message', this.handleCalendlyMessage);
  }

  // Method to update the widget with new data
  async updateEstimateData(newEstimateData) {
    this.estimateData = { ...this.estimateData, ...newEstimateData };
    this.calendlyUrl = this.generateCalendlyUrl();
    
    // If widget is already initialized, we might need to reinitialize
    // Calendly doesn't support updating prefill data dynamically
    console.log('Estimate data updated. Consider reinitializing widget for new data.');
  }

  // Method to get current scheduling status
  getStatus() {
    return {
      contractId: this.contractId,
      estimateData: this.estimateData,
      calendlyUrl: this.calendlyUrl,
      widgetInitialized: !!this.widget
    };
  }
}
