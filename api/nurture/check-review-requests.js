/**
 * Review Request Checker - Vercel Serverless Function
 * Cron job endpoint to identify and request reviews from completed jobs
 *
 * This function runs on a schedule to:
 * 1. Query leads with status='converted' and job completed > 7 days ago
 * 2. Check email consent for each lead
 * 3. Send review_request email via send-email API
 * 4. Track review request sent date
 *
 * PRODUCTION NOTE:
 * This implementation uses file-based storage as a bridge between
 * the browser localStorage (where leads are created) and the serverless
 * environment. In production, this should be replaced with:
 * - Vercel KV (Redis)
 * - PostgreSQL/MySQL database
 * - Or another persistent backend storage solution
 *
 * The frontend would need to sync localStorage to backend storage.
 */

import fs from 'fs';
import path from 'path';

/**
 * Configuration
 */
const CONFIG = {
  REVIEW_REQUEST_THRESHOLD_DAYS: 7, // Days after job completion to request review
  LEAD_STORAGE_PATH: '/tmp/nurture_leads.json',
  MAX_BATCH_SIZE: 50 // Limit emails sent per run to avoid rate limits
};

/**
 * Read leads from file-based storage
 * @returns {Array} Array of lead objects
 */
function getLeadsFromStorage() {
  try {
    if (!fs.existsSync(CONFIG.LEAD_STORAGE_PATH)) {
      return [];
    }

    const data = fs.readFileSync(CONFIG.LEAD_STORAGE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read leads from storage:', error);
    return [];
  }
}

/**
 * Save leads to file-based storage
 * @param {Array} leads - Array of lead objects
 */
function saveLeadsToStorage(leads) {
  try {
    fs.writeFileSync(CONFIG.LEAD_STORAGE_PATH, JSON.stringify(leads, null, 2));
  } catch (error) {
    console.error('Failed to save leads to storage:', error);
    throw error;
  }
}

/**
 * Filter leads eligible for review requests (status='converted', job completed, not already sent)
 * @param {Array} leads - All leads
 * @param {number} thresholdDays - Days since job completion to request review
 * @returns {Array} Leads eligible for review request with email consent
 */
function getReviewEligibleLeads(leads, thresholdDays = 7) {
  const thresholdTime = Date.now() - (thresholdDays * 24 * 60 * 60 * 1000);

  return leads.filter(lead => {
    // Must be 'converted' status (job was booked/completed)
    if (lead.status !== 'converted') {
      return false;
    }

    // Must have email consent
    if (!lead.consent_email) {
      return false;
    }

    // Must have email address
    if (!lead.email) {
      return false;
    }

    // Must have job completion date
    if (!lead.job_completed_at) {
      return false;
    }

    // Must not have already sent review request
    if (lead.review_request_sent_at) {
      return false;
    }

    // Job must be completed longer than threshold
    const completedAt = new Date(lead.job_completed_at).getTime();
    if (isNaN(completedAt) || completedAt > thresholdTime) {
      return false;
    }

    return true;
  });
}

/**
 * Send review request email via send-email API
 * @param {Object} lead - Lead data
 * @param {string} baseUrl - Base URL for API calls
 * @returns {Promise<Object>} Email sending result
 */
async function sendReviewRequestEmail(lead, baseUrl) {
  try {
    // Prepare email data
    const emailData = {
      to: lead.email,
      template: 'review_request',
      data: {
        leadId: lead.lead_id,
        firstName: lead.first_name || lead.name || null,
        reviewUrl: `${baseUrl}/review?lead=${lead.lead_id}`,
        unsubscribeUrl: `${baseUrl}/api/nurture/unsubscribe?lead=${lead.lead_id}&type=email`
      }
    };

    // In development/test mode, just log instead of sending
    if (process.env.NODE_ENV === 'development' || process.env.DRY_RUN === 'true') {
      return {
        success: true,
        mode: 'dry_run',
        to: lead.email
      };
    }

    // Call send-email API endpoint
    const response = await fetch(`${baseUrl}/api/nurture/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error(`Failed to send email to ${lead.email}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update lead with review request sent timestamp
 * @param {Array} leads - All leads
 * @param {string} leadId - Lead to update
 * @returns {Array} Updated leads array
 */
function markReviewRequestSent(leads, leadId) {
  return leads.map(lead => {
    if (lead.lead_id === leadId) {
      return {
        ...lead,
        review_request_sent_at: new Date().toISOString(),
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return lead;
  });
}

/**
 * Verify cron authentication
 * @param {Object} req - Request object
 * @returns {boolean} True if authenticated
 */
function verifyCronAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return false;
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  // Compare against CRON_SECRET environment variable
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not configured');
    return false;
  }

  return token === cronSecret;
}

/**
 * Vercel Serverless Function Handler
 * GET /api/nurture/check-review-requests
 *
 * Query Parameters:
 * - dry_run: Set to 'true' to test without sending emails
 * - limit: Maximum number of emails to send (default: 50)
 *
 * Returns:
 * {
 *   success: true,
 *   summary: {
 *     total_leads: 100,
 *     eligible_found: 10,
 *     emails_sent: 10,
 *     failed: 0,
 *     skipped: 0
 *   },
 *   results: [...]
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

  // Verify cron authentication
  if (!verifyCronAuth(req)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authorization token'
    });
  }

  const startTime = Date.now();

  try {
    // Get base URL for API calls
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Parse query parameters
    const dryRun = req.query.dry_run === 'true' || process.env.DRY_RUN === 'true';
    const limit = parseInt(req.query.limit) || CONFIG.MAX_BATCH_SIZE;

    // Read leads from storage
    let leads = getLeadsFromStorage();
    const totalLeads = leads.length;

    // Filter for review-eligible leads
    const eligibleLeads = getReviewEligibleLeads(leads, CONFIG.REVIEW_REQUEST_THRESHOLD_DAYS);
    const eligibleCount = eligibleLeads.length;

    // Limit batch size
    const leadsToProcess = eligibleLeads.slice(0, limit);

    // Process each eligible lead
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const lead of leadsToProcess) {
      // Double-check consent before sending
      if (!lead.consent_email) {
        skippedCount++;
        results.push({
          lead_id: lead.lead_id,
          email: lead.email,
          status: 'skipped',
          reason: 'No email consent'
        });
        continue;
      }

      // Send email
      const emailResult = await sendReviewRequestEmail(lead, baseUrl);

      if (emailResult.success) {
        sentCount++;

        // Mark review request as sent
        if (!dryRun) {
          leads = markReviewRequestSent(leads, lead.lead_id);
        }

        results.push({
          lead_id: lead.lead_id,
          email: lead.email,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      } else {
        failedCount++;

        results.push({
          lead_id: lead.lead_id,
          email: lead.email,
          status: 'failed',
          error: emailResult.error
        });
      }
    }

    // Save updated leads back to storage (unless dry run)
    if (!dryRun && (sentCount > 0 || failedCount > 0)) {
      saveLeadsToStorage(leads);
    }

    const duration = Date.now() - startTime;

    const summary = {
      total_leads: totalLeads,
      eligible_found: eligibleCount,
      processed: leadsToProcess.length,
      emails_sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      duration_ms: duration,
      dry_run: dryRun
    };

    // Return success response
    return res.status(200).json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking review requests:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check review requests',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
