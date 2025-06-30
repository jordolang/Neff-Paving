/**
 * Calendly Synchronization Service
 * Manages synchronization with Calendly API for scheduling events
 */

export class CalendlySync {
  constructor() {
    this.apiBase = process.env.CALENDLY_API_BASE || 'https://api.calendly.com';
    this.accessToken = process.env.CALENDLY_ACCESS_TOKEN;
    this.webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;
    this.lastSync = null;
    this.syncedEvents = new Map();
  }

  /**
   * Perform full synchronization of Calendly events
   * @returns {Promise<Object>} Sync results
   */
  async sync() {
    console.log('Starting Calendly synchronization...');
    const startTime = Date.now();

    try {
      // Get current user information
      const user = await this._getCurrentUser();
      
      // Fetch all scheduled events
      const events = await this._getScheduledEvents(user.uri);
      
      // Process and update local records
      const syncResults = {
        eventsProcessed: 0,
        eventsUpdated: 0,
        eventsCreated: 0,
        errors: []
      };

      for (const event of events) {
        try {
          await this._processEvent(event);
          syncResults.eventsProcessed++;
          
          if (this.syncedEvents.has(event.uri)) {
            syncResults.eventsUpdated++;
          } else {
            syncResults.eventsCreated++;
            this.syncedEvents.set(event.uri, event);
          }
        } catch (error) {
          console.error(`Error processing event ${event.uri}:`, error);
          syncResults.errors.push({
            eventUri: event.uri,
            error: error.message
          });
        }
      }

      this.lastSync = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        results: syncResults
      };

      console.log('Calendly synchronization completed:', syncResults);
      return syncResults;
    } catch (error) {
      console.error('Calendly sync failed:', error);
      throw error;
    }
  }

  /**
   * Synchronize a specific Calendly event
   * @param {string} eventUri - Calendly event URI
   * @returns {Promise<Object>} Event sync result
   */
  async syncEvent(eventUri) {
    console.log(`Synchronizing Calendly event: ${eventUri}`);

    try {
      const event = await this._getEvent(eventUri);
      
      if (!event) {
        throw new Error(`Event not found: ${eventUri}`);
      }

      await this._processEvent(event);
      this.syncedEvents.set(eventUri, event);

      return {
        status: 'success',
        event: event,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to sync Calendly event ${eventUri}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Calendly event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    console.log('Creating Calendly event:', eventData);

    try {
      const response = await this._makeRequest('POST', '/scheduled_events', {
        event_type: eventData.eventType,
        invitee: eventData.invitee,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        location: eventData.location
      });

      const event = response.resource;
      this.syncedEvents.set(event.uri, event);

      return event;
    } catch (error) {
      console.error('Failed to create Calendly event:', error);
      throw error;
    }
  }

  /**
   * Cancel a Calendly event
   * @param {string} eventUri - Event URI to cancel
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelEvent(eventUri) {
    console.log(`Canceling Calendly event: ${eventUri}`);

    try {
      await this._makeRequest('POST', `/scheduled_events/${this._extractEventId(eventUri)}/cancellation`, {
        reason: 'Canceled by system'
      });

      this.syncedEvents.delete(eventUri);

      return {
        status: 'canceled',
        eventUri,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to cancel Calendly event ${eventUri}:`, error);
      throw error;
    }
  }

  /**
   * Get synchronization status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      lastSync: this.lastSync,
      eventsTracked: this.syncedEvents.size,
      apiConnected: !!this.accessToken,
      webhookConfigured: !!this.webhookSecret
    };
  }

  /**
   * Process webhook payload from Calendly
   * @param {Object} payload - Webhook payload
   * @returns {Promise<Object>} Processing result
   */
  async processWebhook(payload) {
    console.log('Processing Calendly webhook:', payload.event);

    try {
      const { event, event_type } = payload;

      switch (event_type) {
        case 'invitee.created':
          return await this._handleInviteeCreated(event);
        case 'invitee.canceled':
          return await this._handleInviteeCanceled(event);
        case 'invitee.rescheduled':
          return await this._handleInviteeRescheduled(event);
        default:
          console.log(`Unhandled webhook event type: ${event_type}`);
          return { status: 'ignored', eventType: event_type };
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Get current user from Calendly API
   * @private
   */
  async _getCurrentUser() {
    const response = await this._makeRequest('GET', '/users/me');
    return response.resource;
  }

  /**
   * Get scheduled events for a user
   * @private
   */
  async _getScheduledEvents(userUri) {
    const response = await this._makeRequest('GET', '/scheduled_events', {
      user: userUri,
      status: 'active'
    });
    return response.collection;
  }

  /**
   * Get specific event by URI
   * @private
   */
  async _getEvent(eventUri) {
    const eventId = this._extractEventId(eventUri);
    const response = await this._makeRequest('GET', `/scheduled_events/${eventId}`);
    return response.resource;
  }

  /**
   * Process individual event
   * @private
   */
  async _processEvent(event) {
    // Here you would typically:
    // 1. Update local database
    // 2. Sync with job scheduling system
    // 3. Update contract system
    // 4. Trigger notifications

    console.log(`Processing event: ${event.name} at ${event.start_time}`);
    
    // Placeholder for actual processing logic
    // This would integrate with your job scheduling service
    return {
      processed: true,
      eventUri: event.uri,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle invitee created webhook
   * @private
   */
  async _handleInviteeCreated(event) {
    console.log('New invitee created:', event.uri);
    await this.syncEvent(event.uri);
    return { status: 'processed', action: 'invitee_created' };
  }

  /**
   * Handle invitee canceled webhook
   * @private
   */
  async _handleInviteeCanceled(event) {
    console.log('Invitee canceled:', event.uri);
    this.syncedEvents.delete(event.uri);
    return { status: 'processed', action: 'invitee_canceled' };
  }

  /**
   * Handle invitee rescheduled webhook
   * @private
   */
  async _handleInviteeRescheduled(event) {
    console.log('Invitee rescheduled:', event.uri);
    await this.syncEvent(event.uri);
    return { status: 'processed', action: 'invitee_rescheduled' };
  }

  /**
   * Make HTTP request to Calendly API
   * @private
   */
  async _makeRequest(method, endpoint, data = null) {
    if (!this.accessToken) {
      throw new Error('Calendly access token not configured');
    }

    const url = `${this.apiBase}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      if (method === 'GET') {
        const params = new URLSearchParams(data);
        url += `?${params}`;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract event ID from Calendly URI
   * @private
   */
  _extractEventId(eventUri) {
    return eventUri.split('/').pop();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.syncedEvents.clear();
  }
}

export default CalendlySync;
