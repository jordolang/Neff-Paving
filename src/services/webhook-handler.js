/**
 * Webhook Handler Service for processing Stripe payment events
 */

export class WebhookHandler {
  constructor() {
    this.eventHandlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Set up default event handlers
   */
  setupDefaultHandlers() {
    // Payment Intent Events
    this.addHandler('payment_intent.succeeded', this.handlePaymentSucceeded.bind(this));
    this.addHandler('payment_intent.payment_failed', this.handlePaymentFailed.bind(this));
    this.addHandler('payment_intent.canceled', this.handlePaymentCanceled.bind(this));
    this.addHandler('payment_intent.processing', this.handlePaymentProcessing.bind(this));
    this.addHandler('payment_intent.requires_action', this.handlePaymentRequiresAction.bind(this));

    // Payment Method Events
    this.addHandler('payment_method.attached', this.handlePaymentMethodAttached.bind(this));

    // Charge Events
    this.addHandler('charge.succeeded', this.handleChargeSucceeded.bind(this));
    this.addHandler('charge.failed', this.handleChargeFailed.bind(this));
    this.addHandler('charge.dispute.created', this.handleChargeDispute.bind(this));

    // Set up Calendly event handlers
    this.setupCalendlyHandlers();
  }

  /**
   * Set up Calendly event handlers
   */
  setupCalendlyHandlers() {
    this.addHandler('calendly.event_scheduled', this.handleEventScheduled.bind(this));
    this.addHandler('calendly.event_canceled', this.handleEventCanceled.bind(this));
    this.addHandler('calendly.event_rescheduled', this.handleEventRescheduled.bind(this));
  }

  /**
   * Add a custom event handler
   * @param {string} eventType - Event type (Stripe, Calendly, etc.)
   * @param {Function} handler - Handler function
   */
  addHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Process webhook event
   * @param {Object} event - Stripe webhook event
   */
  async processEvent(event) {
    try {
      console.log(`Processing webhook event: ${event.type}`);
      
      const handler = this.eventHandlers.get(event.type);
      
      if (handler) {
        await handler(event);
      } else {
        console.log(`No handler found for event type: ${event.type}`);
      }

      // Log event for audit trail
      await this.logEvent(event);
      
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} event - Stripe event
   */
  async handlePaymentSucceeded(event) {
    const paymentIntent = event.data.object;
    
    console.log(`✅ Payment succeeded: ${paymentIntent.id} for $${paymentIntent.amount / 100}`);
    
    try {
      // Update database with successful payment
      await this.updatePaymentStatus(paymentIntent.id, 'succeeded', {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer_email: paymentIntent.receipt_email,
        metadata: paymentIntent.metadata
      });

      // Send confirmation email
      await this.sendPaymentConfirmation(paymentIntent);

      // Trigger any business logic (e.g., update project status)
      await this.triggerBusinessLogic('payment_succeeded', paymentIntent);

      // Analytics tracking
      this.trackEvent('payment_succeeded', {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   * @param {Object} event - Stripe event
   */
  async handlePaymentFailed(event) {
    const paymentIntent = event.data.object;
    const error = paymentIntent.last_payment_error;
    
    console.log(`❌ Payment failed: ${paymentIntent.id} - ${error?.message}`);
    
    try {
      // Update database with failed payment
      await this.updatePaymentStatus(paymentIntent.id, 'failed', {
        error_code: error?.code,
        error_message: error?.message,
        failure_reason: error?.type
      });

      // Send failure notification
      await this.sendPaymentFailureNotification(paymentIntent, error);

      // Analytics tracking
      this.trackEvent('payment_failed', {
        payment_intent_id: paymentIntent.id,
        error_code: error?.code,
        error_type: error?.type
      });

    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle canceled payment
   * @param {Object} event - Stripe event
   */
  async handlePaymentCanceled(event) {
    const paymentIntent = event.data.object;
    
    console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
    
    try {
      await this.updatePaymentStatus(paymentIntent.id, 'canceled');
      
      this.trackEvent('payment_canceled', {
        payment_intent_id: paymentIntent.id
      });
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
    }
  }

  /**
   * Handle payment processing
   * @param {Object} event - Stripe event
   */
  async handlePaymentProcessing(event) {
    const paymentIntent = event.data.object;
    
    console.log(`⏳ Payment processing: ${paymentIntent.id}`);
    
    try {
      await this.updatePaymentStatus(paymentIntent.id, 'processing');
    } catch (error) {
      console.error('Error handling payment processing:', error);
    }
  }

  /**
   * Handle payment requires action
   * @param {Object} event - Stripe event
   */
  async handlePaymentRequiresAction(event) {
    const paymentIntent = event.data.object;
    
    console.log(`🔐 Payment requires action: ${paymentIntent.id}`);
    
    try {
      await this.updatePaymentStatus(paymentIntent.id, 'requires_action');
      
      // Notify customer if needed
      await this.sendActionRequiredNotification(paymentIntent);
    } catch (error) {
      console.error('Error handling payment action required:', error);
    }
  }

  /**
   * Handle payment method attached
   * @param {Object} event - Stripe event
   */
  async handlePaymentMethodAttached(event) {
    const paymentMethod = event.data.object;
    
    console.log(`💳 Payment method attached: ${paymentMethod.id}`);
    
    try {
      // Store payment method info if needed
      await this.storePaymentMethod(paymentMethod);
    } catch (error) {
      console.error('Error handling payment method attached:', error);
    }
  }

  /**
   * Handle successful charge
   * @param {Object} event - Stripe event
   */
  async handleChargeSucceeded(event) {
    const charge = event.data.object;
    
    console.log(`💰 Charge succeeded: ${charge.id} for $${charge.amount / 100}`);
    
    try {
      // Update charge records
      await this.updateChargeStatus(charge.id, 'succeeded');
    } catch (error) {
      console.error('Error handling charge success:', error);
    }
  }

  /**
   * Handle failed charge
   * @param {Object} event - Stripe event
   */
  async handleChargeFailed(event) {
    const charge = event.data.object;
    
    console.log(`💸 Charge failed: ${charge.id}`);
    
    try {
      await this.updateChargeStatus(charge.id, 'failed');
    } catch (error) {
      console.error('Error handling charge failure:', error);
    }
  }

  /**
   * Handle charge dispute
   * @param {Object} event - Stripe event
   */
  async handleChargeDispute(event) {
    const dispute = event.data.object;
    
    console.log(`⚖️ Charge dispute created: ${dispute.id}`);
    
    try {
      // Log dispute for internal review
      console.log('Charge dispute requires attention:', dispute);
    } catch (error) {
      console.error('Error handling charge dispute:', error);
    }
  }

  /**
   * Update payment status in database
   * @param {string} paymentIntentId - Payment Intent ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to store
   */
  async updatePaymentStatus(paymentIntentId, status, additionalData = {}) {
    try {
      // This would typically update your database
      // For now, we'll use localStorage for demo purposes
      const payments = JSON.parse(localStorage.getItem('payments') || '{}');
      
      payments[paymentIntentId] = {
        ...payments[paymentIntentId],
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };
      
      localStorage.setItem('payments', JSON.stringify(payments));
      
      console.log(`Payment status updated: ${paymentIntentId} -> ${status}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  /**
   * Send payment confirmation email
   * @param {Object} paymentIntent - Payment Intent object
   */
  async sendPaymentConfirmation(paymentIntent) {
    try {
      // This would typically integrate with your email service
      console.log(`Sending confirmation email to: ${paymentIntent.receipt_email}`);
      
      // Example email content
      const emailData = {
        to: paymentIntent.receipt_email,
        subject: 'Payment Confirmation - Neff Paving',
        template: 'payment_confirmation',
        data: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          payment_id: paymentIntent.id,
          customer_name: paymentIntent.metadata?.customer_name || 'Valued Customer'
        }
      };
      
      // Send email (implementation depends on your email service)
      // await emailService.send(emailData);
      
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }

  /**
   * Send payment failure notification
   * @param {Object} paymentIntent - Payment Intent object
   * @param {Object} error - Error details
   */
  async sendPaymentFailureNotification(paymentIntent, error) {
    try {
      console.log(`Sending failure notification to: ${paymentIntent.receipt_email}`);
      
      // Implementation depends on your notification system
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
    }
  }

  /**
   * Send action required notification
   * @param {Object} paymentIntent - Payment Intent object
   */
  async sendActionRequiredNotification(paymentIntent) {
    try {
      console.log(`Sending action required notification for: ${paymentIntent.id}`);
      
      // Implementation depends on your notification system
    } catch (error) {
      console.error('Error sending action required notification:', error);
    }
  }

  /**
   * Trigger business logic based on payment events
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  async triggerBusinessLogic(eventType, data) {
    try {
      switch (eventType) {
        case 'payment_succeeded':
          // Update project status, schedule work, etc.
          await this.updateProjectStatus(data);
          break;
        
        default:
          console.log(`No business logic defined for event: ${eventType}`);
      }
    } catch (error) {
      console.error('Error in business logic:', error);
    }
  }

  /**
   * Update project status after successful payment
   * @param {Object} paymentIntent - Payment Intent object
   */
  async updateProjectStatus(paymentIntent) {
    try {
      const projectId = paymentIntent.metadata?.project_id;
      
      if (projectId) {
        console.log(`Updating project ${projectId} status after payment`);
        
        // Update project status in your system
        // This could involve updating database records, sending notifications, etc.
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  }

  /**
   * Track analytics events
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  trackEvent(eventName, properties) {
    try {
      // Integration with analytics service (Google Analytics, Mixpanel, etc.)
      console.log(`Analytics Event: ${eventName}`, properties);
      
      if (window.gtag) {
        window.gtag('event', eventName, {
          event_category: 'payment',
          ...properties
        });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Log webhook events for audit trail
   * @param {Object} event - Stripe event
   */
  async logEvent(event) {
    try {
      const logEntry = {
        id: event.id,
        type: event.type,
        created: event.created,
        data: event.data,
        timestamp: new Date().toISOString()
      };
      
      // Store in your logging system
      console.log('Webhook Event Logged:', logEntry);
      
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }


  /**
   * Store payment method information
   * @param {Object} paymentMethod - Payment method object
   */
  async storePaymentMethod(paymentMethod) {
    try {
      // Store payment method details (be careful with PCI compliance)
      console.log(`Storing payment method: ${paymentMethod.id}`);
      
    } catch (error) {
      console.error('Error storing payment method:', error);
    }
  }

  /**
   * Update charge status
   * @param {string} chargeId - Charge ID
   * @param {string} status - New status
   */
  async updateChargeStatus(chargeId, status) {
    try {
      console.log(`Updating charge ${chargeId} status to: ${status}`);
      
      // Update your database
      
    } catch (error) {
      console.error('Error updating charge status:', error);
    }
  }

  // =============================================================================
  // CALENDLY EVENT HANDLERS
  // =============================================================================

  /**
   * Handle Calendly event scheduled
   * @param {Object} event - Calendly webhook event
   */
  async handleEventScheduled(event) {
    const eventData = event.data?.object || event.payload;
    
    console.log(`📅 Calendly event scheduled: ${eventData?.uri}`);
    
    try {
      // Process new booking
      await this.processNewBooking(eventData);
      
      // Update job schedule
      await this.updateJobSchedule(eventData);
      
      // Generate alerts
      await this.generateSchedulingAlerts(eventData);
      
      // Track analytics
      this.trackEvent('calendly_event_scheduled', {
        event_uri: eventData?.uri,
        event_type: eventData?.event_type?.name,
        invitee_email: eventData?.invitees?.[0]?.email,
        start_time: eventData?.start_time
      });
      
    } catch (error) {
      console.error('Error handling Calendly event scheduled:', error);
    }
  }

  /**
   * Handle Calendly event canceled
   * @param {Object} event - Calendly webhook event
   */
  async handleEventCanceled(event) {
    const eventData = event.data?.object || event.payload;
    
    console.log(`❌ Calendly event canceled: ${eventData?.uri}`);
    
    try {
      // Handle cancellation
      await this.processCancellation(eventData);
      
      // Update availability
      await this.updateAvailability(eventData);
      
      // Send notifications
      await this.sendCancellationNotifications(eventData);
      
      // Track analytics
      this.trackEvent('calendly_event_canceled', {
        event_uri: eventData?.uri,
        event_type: eventData?.event_type?.name,
        invitee_email: eventData?.invitees?.[0]?.email,
        canceled_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error handling Calendly event canceled:', error);
    }
  }

  /**
   * Handle Calendly event rescheduled
   * @param {Object} event - Calendly webhook event
   */
  async handleEventRescheduled(event) {
    const eventData = event.data?.object || event.payload;
    
    console.log(`🔄 Calendly event rescheduled: ${eventData?.uri}`);
    
    try {
      // Process schedule change
      await this.processScheduleChange(eventData);
      
      // Update related systems
      await this.updateRelatedSystems(eventData);
      
      // Send notifications
      await this.sendRescheduleNotifications(eventData);
      
      // Track analytics
      this.trackEvent('calendly_event_rescheduled', {
        event_uri: eventData?.uri,
        event_type: eventData?.event_type?.name,
        invitee_email: eventData?.invitees?.[0]?.email,
        old_start_time: eventData?.old_start_time,
        new_start_time: eventData?.start_time
      });
      
    } catch (error) {
      console.error('Error handling Calendly event rescheduled:', error);
    }
  }

  // =============================================================================
  // CALENDLY HELPER METHODS
  // =============================================================================

  /**
   * Process new booking from Calendly
   * @param {Object} eventData - Calendly event data
   */
  async processNewBooking(eventData) {
    try {
      const booking = {
        calendly_uri: eventData?.uri,
        event_type: eventData?.event_type?.name,
        start_time: eventData?.start_time,
        end_time: eventData?.end_time,
        invitee_email: eventData?.invitees?.[0]?.email,
        invitee_name: eventData?.invitees?.[0]?.name,
        status: 'scheduled',
        created_at: new Date().toISOString()
      };
      
      // Store booking in database
      await this.storeBooking(booking);
      
      console.log(`New booking processed for: ${booking.invitee_email}`);
      
    } catch (error) {
      console.error('Error processing new booking:', error);
    }
  }

  /**
   * Update job schedule based on Calendly booking
   * @param {Object} eventData - Calendly event data
   */
  async updateJobSchedule(eventData) {
    try {
      // Extract project information from event metadata or questions
      const projectInfo = this.extractProjectInfo(eventData);
      
      if (projectInfo?.project_id) {
        // Update project schedule with new appointment
        await this.updateProjectSchedule(projectInfo.project_id, {
          appointment_time: eventData?.start_time,
          appointment_type: eventData?.event_type?.name,
          customer_email: eventData?.invitees?.[0]?.email
        });
        
        console.log(`Job schedule updated for project: ${projectInfo.project_id}`);
      }
      
    } catch (error) {
      console.error('Error updating job schedule:', error);
    }
  }

  /**
   * Generate alerts for new scheduling
   * @param {Object} eventData - Calendly event data
   */
  async generateSchedulingAlerts(eventData) {
    try {
      // Alert team about new appointment
      await this.alertTeam('new_appointment', {
        event_type: eventData?.event_type?.name,
        start_time: eventData?.start_time,
        customer: eventData?.invitees?.[0]?.name,
        email: eventData?.invitees?.[0]?.email
      });
      
      // Set up reminder alerts
      await this.scheduleReminders(eventData);
      
    } catch (error) {
      console.error('Error generating scheduling alerts:', error);
    }
  }

  /**
   * Process cancellation
   * @param {Object} eventData - Calendly event data
   */
  async processCancellation(eventData) {
    try {
      // Update booking status in database
      await this.updateBookingStatus(eventData?.uri, 'canceled');
      
      // Free up resources
      await this.freeScheduleSlot(eventData?.start_time);
      
      console.log(`Cancellation processed for: ${eventData?.uri}`);
      
    } catch (error) {
      console.error('Error processing cancellation:', error);
    }
  }

  /**
   * Update availability after cancellation
   * @param {Object} eventData - Calendly event data
   */
  async updateAvailability(eventData) {
    try {
      // Make the time slot available again
      await this.markSlotAvailable(eventData?.start_time, eventData?.end_time);
      
      console.log(`Availability updated for canceled slot: ${eventData?.start_time}`);
      
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  }

  /**
   * Send cancellation notifications
   * @param {Object} eventData - Calendly event data
   */
  async sendCancellationNotifications(eventData) {
    try {
      // Notify internal team
      await this.alertTeam('appointment_canceled', {
        event_type: eventData?.event_type?.name,
        original_time: eventData?.start_time,
        customer: eventData?.invitees?.[0]?.name
      });
      
      // Optional: Send confirmation to customer
      // await this.sendCustomerNotification('cancellation_confirmed', eventData);
      
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
  }

  /**
   * Process schedule change from rescheduling
   * @param {Object} eventData - Calendly event data
   */
  async processScheduleChange(eventData) {
    try {
      // Update booking with new time
      await this.updateBookingTime(eventData?.uri, {
        new_start_time: eventData?.start_time,
        new_end_time: eventData?.end_time,
        old_start_time: eventData?.old_start_time
      });
      
      console.log(`Schedule change processed for: ${eventData?.uri}`);
      
    } catch (error) {
      console.error('Error processing schedule change:', error);
    }
  }

  /**
   * Update related systems after rescheduling
   * @param {Object} eventData - Calendly event data
   */
  async updateRelatedSystems(eventData) {
    try {
      // Update project timeline if applicable
      const projectInfo = this.extractProjectInfo(eventData);
      if (projectInfo?.project_id) {
        await this.updateProjectTimeline(projectInfo.project_id, {
          new_appointment_time: eventData?.start_time,
          old_appointment_time: eventData?.old_start_time
        });
      }
      
      // Update crew schedules
      await this.updateCrewSchedules(eventData);
      
    } catch (error) {
      console.error('Error updating related systems:', error);
    }
  }

  /**
   * Send reschedule notifications
   * @param {Object} eventData - Calendly event data
   */
  async sendRescheduleNotifications(eventData) {
    try {
      // Notify internal team
      await this.alertTeam('appointment_rescheduled', {
        event_type: eventData?.event_type?.name,
        old_time: eventData?.old_start_time,
        new_time: eventData?.start_time,
        customer: eventData?.invitees?.[0]?.name
      });
      
    } catch (error) {
      console.error('Error sending reschedule notifications:', error);
    }
  }

  // =============================================================================
  // CALENDLY UTILITY METHODS
  // =============================================================================

  /**
   * Store booking in database
   * @param {Object} booking - Booking data
   */
  async storeBooking(booking) {
    try {
      // Store in your database
      const bookings = JSON.parse(localStorage.getItem('calendly_bookings') || '{}');
      bookings[booking.calendly_uri] = booking;
      localStorage.setItem('calendly_bookings', JSON.stringify(bookings));
      
      console.log(`Booking stored: ${booking.calendly_uri}`);
    } catch (error) {
      console.error('Error storing booking:', error);
    }
  }

  /**
   * Update booking status
   * @param {string} eventUri - Calendly event URI
   * @param {string} status - New status
   */
  async updateBookingStatus(eventUri, status) {
    try {
      const bookings = JSON.parse(localStorage.getItem('calendly_bookings') || '{}');
      if (bookings[eventUri]) {
        bookings[eventUri].status = status;
        bookings[eventUri].updated_at = new Date().toISOString();
        localStorage.setItem('calendly_bookings', JSON.stringify(bookings));
      }
      
      console.log(`Booking status updated: ${eventUri} -> ${status}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  }

  /**
   * Extract project information from Calendly event
   * @param {Object} eventData - Calendly event data
   * @returns {Object} Project information
   */
  extractProjectInfo(eventData) {
    try {
      // Extract from event questions/answers or metadata
      const questions = eventData?.questions_and_answers || [];
      const projectInfo = {};
      
      questions.forEach(qa => {
        if (qa.question?.toLowerCase().includes('project')) {
          projectInfo.project_id = qa.answer;
        }
        if (qa.question?.toLowerCase().includes('address')) {
          projectInfo.address = qa.answer;
        }
      });
      
      return projectInfo;
    } catch (error) {
      console.error('Error extracting project info:', error);
      return {};
    }
  }

  /**
   * Alert team about Calendly events
   * @param {string} alertType - Type of alert
   * @param {Object} data - Alert data
   */
  async alertTeam(alertType, data) {
    try {
      console.log(`Team Alert [${alertType}]:`, data);
      
      // Send notifications via your preferred method
      // (email, Slack, SMS, push notifications, etc.)
      
    } catch (error) {
      console.error('Error alerting team:', error);
    }
  }

  /**
   * Schedule reminders for appointments
   * @param {Object} eventData - Calendly event data
   */
  async scheduleReminders(eventData) {
    try {
      // Schedule reminder notifications
      // Implementation depends on your scheduling system
      console.log(`Scheduling reminders for: ${eventData?.start_time}`);
      
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Update project schedule
   * @param {string} projectId - Project ID
   * @param {Object} scheduleData - Schedule data
   */
  async updateProjectSchedule(projectId, scheduleData) {
    try {
      // Update project schedule in your system
      console.log(`Updating project ${projectId} schedule:`, scheduleData);
      
    } catch (error) {
      console.error('Error updating project schedule:', error);
    }
  }

  /**
   * Free up schedule slot
   * @param {string} startTime - Start time of the slot
   */
  async freeScheduleSlot(startTime) {
    try {
      // Free up the time slot in your scheduling system
      console.log(`Freeing schedule slot: ${startTime}`);
      
    } catch (error) {
      console.error('Error freeing schedule slot:', error);
    }
  }

  /**
   * Mark time slot as available
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   */
  async markSlotAvailable(startTime, endTime) {
    try {
      // Mark slot as available in your availability system
      console.log(`Marking slot available: ${startTime} - ${endTime}`);
      
    } catch (error) {
      console.error('Error marking slot available:', error);
    }
  }

  /**
   * Update booking time
   * @param {string} eventUri - Event URI
   * @param {Object} timeData - Time data
   */
  async updateBookingTime(eventUri, timeData) {
    try {
      const bookings = JSON.parse(localStorage.getItem('calendly_bookings') || '{}');
      if (bookings[eventUri]) {
        bookings[eventUri].start_time = timeData.new_start_time;
        bookings[eventUri].end_time = timeData.new_end_time;
        bookings[eventUri].old_start_time = timeData.old_start_time;
        bookings[eventUri].updated_at = new Date().toISOString();
        localStorage.setItem('calendly_bookings', JSON.stringify(bookings));
      }
      
      console.log(`Booking time updated: ${eventUri}`);
    } catch (error) {
      console.error('Error updating booking time:', error);
    }
  }

  /**
   * Update project timeline
   * @param {string} projectId - Project ID
   * @param {Object} timelineData - Timeline data
   */
  async updateProjectTimeline(projectId, timelineData) {
    try {
      // Update project timeline in your system
      console.log(`Updating project ${projectId} timeline:`, timelineData);
      
    } catch (error) {
      console.error('Error updating project timeline:', error);
    }
  }

  /**
   * Update crew schedules
   * @param {Object} eventData - Event data
   */
  async updateCrewSchedules(eventData) {
    try {
      // Update crew schedules based on appointment changes
      console.log(`Updating crew schedules for: ${eventData?.start_time}`);
      
    } catch (error) {
      console.error('Error updating crew schedules:', error);
    }
  }
}

// Create singleton instance
export const webhookHandler = new WebhookHandler();
