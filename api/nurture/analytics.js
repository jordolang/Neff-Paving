/**
 * Nurture Analytics API - Vercel Serverless Function
 * Returns aggregated analytics data for the nurture campaign dashboard
 *
 * This endpoint provides comprehensive metrics including:
 * - Total leads tracked
 * - Emails and SMS sent counts
 * - Conversion metrics
 * - Unsubscribe rates
 * - Campaign performance breakdown
 *
 * PRODUCTION NOTE:
 * This implementation uses file-based storage (/tmp) as a bridge.
 * In production, replace with Vercel KV, PostgreSQL, or another
 * persistent backend storage solution.
 */

import { readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Storage paths
 */
const STORAGE_PATHS = {
  EVENTS: join(tmpdir(), 'nurture_events.jsonl'),
  LEADS: '/tmp/nurture_leads.json'
};

/**
 * Read all stored events from file
 * @returns {Array} Array of event objects
 */
function getStoredEvents() {
  try {
    if (!existsSync(STORAGE_PATHS.EVENTS)) {
      return [];
    }

    const content = readFileSync(STORAGE_PATHS.EVENTS, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to read events:', error);
    return [];
  }
}

/**
 * Read all stored leads from file
 * @returns {Array} Array of lead objects
 */
function getStoredLeads() {
  try {
    if (!existsSync(STORAGE_PATHS.LEADS)) {
      return [];
    }

    const data = readFileSync(STORAGE_PATHS.LEADS, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read leads:', error);
    return [];
  }
}

/**
 * Calculate analytics metrics from events and leads data
 * @param {Array} events - All tracked events
 * @param {Array} leads - All tracked leads
 * @returns {Object} Analytics metrics
 */
function calculateAnalytics(events, leads) {
  // Count event types
  const emailsSent = events.filter(e => e.event === 'email_sent').length;
  const smsSent = events.filter(e => e.event === 'sms_sent').length;
  const conversions = events.filter(e => e.event === 'converted').length;
  const unsubscribes = events.filter(e => e.event === 'unsubscribed').length;
  const emailsOpened = events.filter(e => e.event === 'email_opened').length;
  const emailsClicked = events.filter(e => e.event === 'email_clicked').length;
  const smsDelivered = events.filter(e => e.event === 'sms_delivered').length;

  // Total leads
  const totalLeads = leads.length;

  // Calculate rates (avoid division by zero)
  const conversionRate = totalLeads > 0
    ? ((conversions / totalLeads) * 100).toFixed(2)
    : '0.00';

  const unsubscribeRate = totalLeads > 0
    ? ((unsubscribes / totalLeads) * 100).toFixed(2)
    : '0.00';

  const emailOpenRate = emailsSent > 0
    ? ((emailsOpened / emailsSent) * 100).toFixed(2)
    : '0.00';

  const emailClickRate = emailsOpened > 0
    ? ((emailsClicked / emailsOpened) * 100).toFixed(2)
    : '0.00';

  const smsDeliveryRate = smsSent > 0
    ? ((smsDelivered / smsSent) * 100).toFixed(2)
    : '0.00';

  // Campaign breakdown
  const campaignStats = {};
  const validCampaigns = ['abandoned_estimate', 'booking_confirmation', 'review_request', 'custom'];

  validCampaigns.forEach(campaign => {
    const campaignEvents = events.filter(e => e.campaign === campaign);
    campaignStats[campaign] = {
      emails_sent: campaignEvents.filter(e => e.event === 'email_sent').length,
      sms_sent: campaignEvents.filter(e => e.event === 'sms_sent').length,
      conversions: campaignEvents.filter(e => e.event === 'converted').length,
      emails_opened: campaignEvents.filter(e => e.event === 'email_opened').length,
      emails_clicked: campaignEvents.filter(e => e.event === 'email_clicked').length
    };
  });

  // Lead status breakdown
  const leadStatusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    unsubscribed: leads.filter(l => l.status === 'unsubscribed').length
  };

  // Consent breakdown
  const consentStats = {
    email_consent: leads.filter(l => l.consent_email === true).length,
    sms_consent: leads.filter(l => l.consent_sms === true).length,
    both_consent: leads.filter(l => l.consent_email === true && l.consent_sms === true).length,
    no_consent: leads.filter(l => !l.consent_email && !l.consent_sms).length
  };

  return {
    summary: {
      total_leads: totalLeads,
      emails_sent: emailsSent,
      sms_sent: smsSent,
      conversions: conversions,
      conversion_rate: parseFloat(conversionRate),
      unsubscribe_rate: parseFloat(unsubscribeRate)
    },
    engagement: {
      emails_opened: emailsOpened,
      emails_clicked: emailsClicked,
      email_open_rate: parseFloat(emailOpenRate),
      email_click_rate: parseFloat(emailClickRate),
      sms_delivered: smsDelivered,
      sms_delivery_rate: parseFloat(smsDeliveryRate)
    },
    campaigns: campaignStats,
    lead_status: leadStatusCounts,
    consent: consentStats,
    totals: {
      total_events: events.length,
      total_leads: totalLeads
    }
  };
}

/**
 * Vercel Serverless Function Handler
 * GET /api/nurture/analytics
 *
 * Query parameters (optional):
 * - since: ISO date string to filter events from this date forward
 * - until: ISO date string to filter events up to this date
 * - campaign: Filter by specific campaign type
 *
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     summary: { total_leads, emails_sent, sms_sent, conversions, conversion_rate, unsubscribe_rate },
 *     engagement: { emails_opened, emails_clicked, email_open_rate, email_click_rate, sms_delivered, sms_delivery_rate },
 *     campaigns: { abandoned_estimate: {...}, booking_confirmation: {...}, ... },
 *     lead_status: { new, contacted, converted, unsubscribed },
 *     consent: { email_consent, sms_consent, both_consent, no_consent },
 *     totals: { total_events, total_leads }
 *   },
 *   timestamp: "2026-06-19T..."
 * }
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests'
    });
  }

  try {
    // Get query parameters for filtering
    const { since, until, campaign } = req.query;

    // Load data from storage
    let events = getStoredEvents();
    const leads = getStoredLeads();

    // Apply date filters if provided
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        events = events.filter(e => new Date(e.timestamp) >= sinceDate);
      }
    }

    if (until) {
      const untilDate = new Date(until);
      if (!isNaN(untilDate.getTime())) {
        events = events.filter(e => new Date(e.timestamp) <= untilDate);
      }
    }

    // Apply campaign filter if provided
    if (campaign) {
      const validCampaigns = ['abandoned_estimate', 'booking_confirmation', 'review_request', 'custom'];
      if (validCampaigns.includes(campaign)) {
        events = events.filter(e => e.campaign === campaign);
      }
    }

    // Calculate analytics
    const analytics = calculateAnalytics(events, leads);

    // Return success response
    return res.status(200).json({
      success: true,
      data: analytics,
      filters: {
        since: since || null,
        until: until || null,
        campaign: campaign || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Handle errors
    console.error('Analytics API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
