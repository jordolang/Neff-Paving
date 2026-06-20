/**
 * Lead Nurture Service
 * Coordinates lead tracking and campaign triggers for automated follow-ups
 */

import {
  storeLead,
  getLead,
  getAllLeads,
  updateLeadStatus,
  getLeadsNeedingNurture,
  hasEmailConsent,
  hasSMSConsent,
  getLeadStats
} from '../utils/lead-storage.js';

export class LeadNurtureService {
  constructor() {
    // Campaign timing configuration
    this.campaigns = {
      abandonedEstimate: {
        delayHours: 24,
        type: 'abandoned_estimate',
        enabled: true
      },
      postBooking: {
        delayHours: 0, // Immediate
        type: 'booking_confirmation',
        enabled: true
      },
      reviewRequest: {
        delayDays: 3,
        type: 'review_request',
        enabled: true
      }
    };

    // Campaign tracking
    this.campaignStats = {
      triggered: 0,
      sent: 0,
      failed: 0,
      skipped: 0
    };

    this.isProcessing = false;
    this.lastCheck = null;
  }

  /**
   * Track a new estimate and create a lead
   * @param {Object} estimateData - Estimate information
   * @param {string} estimateData.email - Lead email address
   * @param {string} estimateData.phone - Lead phone number
   * @param {number} estimateData.totalCost - Estimate amount
   * @param {boolean} estimateData.consent_email - Email consent flag
   * @param {boolean} estimateData.consent_sms - SMS consent flag
   * @param {Object} estimateData.breakdown - Estimate breakdown details
   * @returns {Object} Created lead data
   */
  trackEstimate(estimateData) {
    try {
      if (!estimateData.email) {
        throw new Error('Email is required to track estimate');
      }

      // Generate lead ID from email and timestamp
      const leadId = this._generateLeadId(estimateData.email);

      const leadRecord = {
        lead_id: leadId,
        email: estimateData.email,
        phone: estimateData.phone || null,
        consent_email: estimateData.consent_email || false,
        consent_sms: estimateData.consent_sms || false,
        estimate_created_at: new Date().toISOString(),
        estimate_amount: estimateData.totalCost || 0,
        estimate_breakdown: estimateData.breakdown || {},
        status: 'new',
        last_contact: null,
        source: 'estimate_form'
      };

      storeLead(leadRecord);

      return {
        success: true,
        leadId,
        message: 'Lead tracked successfully'
      };
    } catch (error) {
      console.error('Failed to track estimate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track a booking and update lead status
   * @param {Object} bookingData - Booking information
   * @param {string} bookingData.email - Customer email
   * @param {string} bookingData.phone - Customer phone
   * @param {string} bookingData.eventUri - Calendly event URI
   * @param {string} bookingData.scheduledTime - Scheduled appointment time
   * @returns {Object} Tracking result
   */
  trackBooking(bookingData) {
    try {
      if (!bookingData.email) {
        throw new Error('Email is required to track booking');
      }

      const leadId = this._generateLeadId(bookingData.email);
      const existingLead = getLead(leadId);

      if (existingLead) {
        // Update existing lead to converted status
        updateLeadStatus(leadId, 'converted');

        return {
          success: true,
          leadId,
          message: 'Lead converted to booking',
          shouldNotify: this._shouldSendBookingConfirmation(leadId)
        };
      } else {
        // Create new lead from booking (direct booking without estimate)
        const leadRecord = {
          lead_id: leadId,
          email: bookingData.email,
          phone: bookingData.phone || null,
          consent_email: bookingData.consent_email || false,
          consent_sms: bookingData.consent_sms || false,
          estimate_created_at: null,
          estimate_amount: 0,
          status: 'converted',
          last_contact: new Date().toISOString(),
          source: 'direct_booking',
          booking_data: {
            eventUri: bookingData.eventUri,
            scheduledTime: bookingData.scheduledTime
          }
        };

        storeLead(leadRecord);

        return {
          success: true,
          leadId,
          message: 'Direct booking tracked',
          shouldNotify: this._shouldSendBookingConfirmation(leadId)
        };
      }
    } catch (error) {
      console.error('Failed to track booking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine if a lead should be nurtured
   * @param {string} leadId - Lead identifier
   * @returns {Object} Nurture decision
   */
  shouldNurture(leadId) {
    try {
      const lead = getLead(leadId);

      if (!lead) {
        return {
          shouldNurture: false,
          reason: 'Lead not found'
        };
      }

      // Check if lead has required consent
      if (!lead.consent_email) {
        return {
          shouldNurture: false,
          reason: 'No email consent'
        };
      }

      // Check lead status
      if (lead.status === 'converted') {
        return {
          shouldNurture: false,
          reason: 'Lead already converted'
        };
      }

      if (lead.status === 'unsubscribed') {
        return {
          shouldNurture: false,
          reason: 'Lead unsubscribed'
        };
      }

      // Check if lead is abandoned (for abandoned estimate campaign)
      if (lead.status === 'new') {
        const hoursOld = this._getHoursOld(lead.estimate_created_at || lead.created_at);

        if (hoursOld >= this.campaigns.abandonedEstimate.delayHours) {
          return {
            shouldNurture: true,
            campaign: 'abandonedEstimate',
            reason: `Estimate abandoned for ${Math.floor(hoursOld)} hours`
          };
        }
      }

      return {
        shouldNurture: false,
        reason: 'No active campaign criteria met'
      };
    } catch (error) {
      console.error('Error checking nurture status:', error);
      return {
        shouldNurture: false,
        reason: 'Error checking status',
        error: error.message
      };
    }
  }

  /**
   * Get queue of leads ready for nurturing
   * @param {string} campaignType - Optional campaign type filter
   * @returns {Array} Array of leads ready for nurture campaigns
   */
  getNurtureQueue(campaignType = null) {
    try {
      const queue = [];

      // Get abandoned estimate leads
      if (!campaignType || campaignType === 'abandonedEstimate') {
        if (this.campaigns.abandonedEstimate.enabled) {
          const abandonedLeads = getLeadsNeedingNurture(
            this.campaigns.abandonedEstimate.delayHours
          );

          abandonedLeads.forEach(lead => {
            queue.push({
              leadId: lead.lead_id,
              email: lead.email,
              phone: lead.phone,
              campaign: 'abandonedEstimate',
              template: 'abandoned_estimate',
              priority: this._calculatePriority(lead),
              data: {
                estimateAmount: lead.estimate_amount,
                estimateDate: lead.estimate_created_at
              }
            });
          });
        }
      }

      // Sort by priority (highest first)
      queue.sort((a, b) => b.priority - a.priority);

      return queue;
    } catch (error) {
      console.error('Failed to get nurture queue:', error);
      return [];
    }
  }

  /**
   * Mark a campaign as sent for a lead
   * @param {string} leadId - Lead identifier
   * @param {string} campaignType - Campaign type that was sent
   * @returns {Object} Update result
   */
  markCampaignSent(leadId, campaignType) {
    try {
      const lead = getLead(leadId);

      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Update status based on campaign type
      if (campaignType === 'abandonedEstimate') {
        updateLeadStatus(leadId, 'contacted');
      }

      this.campaignStats.sent++;

      return {
        success: true,
        leadId,
        campaignType,
        newStatus: lead.status
      };
    } catch (error) {
      console.error('Failed to mark campaign as sent:', error);
      this.campaignStats.failed++;

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service status and statistics
   * @returns {Object} Service status
   */
  getStatus() {
    const leadStats = getLeadStats();

    return {
      isProcessing: this.isProcessing,
      lastCheck: this.lastCheck,
      campaigns: this.campaigns,
      stats: {
        ...this.campaignStats,
        leads: leadStats
      },
      queueSize: this.getNurtureQueue().length
    };
  }

  /**
   * Update campaign configuration
   * @param {string} campaignName - Campaign to update
   * @param {Object} config - Configuration updates
   */
  updateCampaignConfig(campaignName, config) {
    if (!this.campaigns[campaignName]) {
      throw new Error(`Unknown campaign: ${campaignName}`);
    }

    this.campaigns[campaignName] = {
      ...this.campaigns[campaignName],
      ...config
    };
  }

  /**
   * Process nurture queue (called by automation)
   * @returns {Promise<Object>} Processing results
   */
  async processQueue() {
    if (this.isProcessing) {
      return {
        success: false,
        message: 'Queue processing already in progress'
      };
    }

    this.isProcessing = true;
    this.lastCheck = new Date().toISOString();

    try {
      const queue = this.getNurtureQueue();
      const results = {
        processed: 0,
        sent: 0,
        skipped: 0,
        failed: 0
      };

      for (const item of queue) {
        results.processed++;

        // Check consent one more time before sending
        if (!hasEmailConsent(item.leadId)) {
          results.skipped++;
          this.campaignStats.skipped++;
          continue;
        }

        // In a real implementation, this would call the email API
        // For now, we just mark as sent
        const result = this.markCampaignSent(item.leadId, item.campaign);

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }
      }

      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Queue processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate consistent lead ID from email
   * @private
   * @param {string} email - Email address
   * @returns {string} Lead ID
   */
  _generateLeadId(email) {
    // Simple hash-like ID generation
    const normalized = email.toLowerCase().trim();
    const timestamp = Date.now();
    return `lead_${Buffer.from(normalized).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}_${timestamp}`;
  }

  /**
   * Calculate how many hours old a timestamp is
   * @private
   * @param {string} timestamp - ISO timestamp
   * @returns {number} Hours since timestamp
   */
  _getHoursOld(timestamp) {
    const created = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - created) / (1000 * 60 * 60);
  }

  /**
   * Calculate priority for nurture queue
   * @private
   * @param {Object} lead - Lead data
   * @returns {number} Priority score (higher = more urgent)
   */
  _calculatePriority(lead) {
    let priority = 0;

    // Higher estimate amounts get higher priority
    if (lead.estimate_amount) {
      priority += Math.min(lead.estimate_amount / 1000, 50);
    }

    // Older leads get higher priority (up to a point)
    const hoursOld = this._getHoursOld(lead.estimate_created_at || lead.created_at);
    priority += Math.min(hoursOld / 24, 10);

    // SMS consent increases priority (multi-channel opportunity)
    if (lead.consent_sms) {
      priority += 5;
    }

    return priority;
  }

  /**
   * Check if booking confirmation should be sent
   * @private
   * @param {string} leadId - Lead identifier
   * @returns {boolean} Whether to send confirmation
   */
  _shouldSendBookingConfirmation(leadId) {
    if (!this.campaigns.postBooking.enabled) {
      return false;
    }

    return hasEmailConsent(leadId);
  }
}
