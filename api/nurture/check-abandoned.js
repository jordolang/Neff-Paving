/**
 * Abandoned Estimate Checker - Vercel Serverless Function
 * Cron job endpoint to identify and follow up with abandoned estimates
 *
 * This function runs on a schedule to:
 * 1. Query leads with status='new' and created > 24 hours ago
 * 2. Check email consent for each lead
 * 3. Send abandoned_estimate email via send-email API
 * 4. Update lead status to 'contacted'
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
  ABANDONED_THRESHOLD_HOURS: 24,
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
 * Filter leads that are abandoned (status='new' and older than threshold)
 * @param {Array} leads - All leads
 * @param {number} thresholdHours - Hours since creation to consider abandoned
 * @returns {Array} Abandoned leads with email consent
 */
function getAbandonedLeads(leads, thresholdHours = 24) {
  const thresholdTime = Date.now() - (thresholdHours * 60 * 60 * 1000);

  return leads.filter(lead => {
    // Must be 'new' status (not already contacted, converted, or unsubscribed)
    if (lead.status !== 'new') {
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

    // Must be older than threshold
    const createdAt = new Date(lead.estimate_created_at || lead.created_at).getTime();
    if (isNaN(createdAt) || createdAt > thresholdTime) {
      return false;
    }

    return true;
  });
}

/**
 * Send abandoned estimate email via send-email API
 * @param {Object} lead - Lead data
 * @param {string} baseUrl - Base URL for API calls
 * @returns {Promise<Object>} Email sending result
 */
async function sendAbandonedEmail(lead, baseUrl) {
  try {
    // Prepare email data
    const emailData = {
      to: lead.email,
      template: 'abandoned_estimate',
      data: {
        leadId: lead.lead_id,
        firstName: lead.first_name || lead.name || null,
        estimateAmount: lead.estimate_amount || null,
        bookingUrl: `${baseUrl}/schedule`,
        unsubscribeUrl: `${baseUrl}/api/nurture/unsubscribe?lead=${lead.lead_id}&type=email`
      }
    };

    // In development/test mode, just log instead of sending
    if (process.env.NODE_ENV === 'development' || process.env.DRY_RUN === 'true') {
      console.log(`[DRY RUN] Would send email to ${lead.email}`);
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
 * Update lead status in storage
 * @param {Array} leads - All leads
 * @param {string} leadId - Lead to update
 * @param {string} newStatus - New status value
 * @returns {Array} Updated leads array
 */
function updateLeadStatus(leads, leadId, newStatus) {
  return leads.map(lead => {
    if (lead.lead_id === leadId) {
      return {
        ...lead,
        status: newStatus,
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
 * GET /api/nurture/check-abandoned
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
 *     abandoned_found: 15,
 *     emails_sent: 15,
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

    console.log(`\n=== Abandoned Estimate Check Started ===`);
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Batch limit: ${limit}`);
    console.log(`Threshold: ${CONFIG.ABANDONED_THRESHOLD_HOURS} hours`);

    // Read leads from storage
    let leads = getLeadsFromStorage();
    const totalLeads = leads.length;

    console.log(`Total leads in storage: ${totalLeads}`);

    // Filter for abandoned leads
    const abandonedLeads = getAbandonedLeads(leads, CONFIG.ABANDONED_THRESHOLD_HOURS);
    const abandonedCount = abandonedLeads.length;

    console.log(`Abandoned leads found: ${abandonedCount}`);

    // Limit batch size
    const leadsToProcess = abandonedLeads.slice(0, limit);
    console.log(`Processing: ${leadsToProcess.length} leads`);

    // Process each abandoned lead
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const lead of leadsToProcess) {
      console.log(`\nProcessing lead: ${lead.lead_id} (${lead.email})`);

      // Double-check consent before sending
      if (!lead.consent_email) {
        console.log(`  → SKIPPED: No email consent`);
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
      const emailResult = await sendAbandonedEmail(lead, baseUrl);

      if (emailResult.success) {
        console.log(`  → SUCCESS: Email sent`);
        sentCount++;

        // Update lead status to 'contacted'
        if (!dryRun) {
          leads = updateLeadStatus(leads, lead.lead_id, 'contacted');
        }

        results.push({
          lead_id: lead.lead_id,
          email: lead.email,
          status: 'sent',
          sent_at: new Date().toISOString()
        });
      } else {
        console.log(`  → FAILED: ${emailResult.error}`);
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
      console.log(`\n✅ Updated ${sentCount} leads to 'contacted' status`);
    }

    const duration = Date.now() - startTime;

    const summary = {
      total_leads: totalLeads,
      abandoned_found: abandonedCount,
      processed: leadsToProcess.length,
      emails_sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      duration_ms: duration,
      dry_run: dryRun
    };

    console.log(`\n=== Summary ===`);
    console.log(JSON.stringify(summary, null, 2));
    console.log(`=== Check Complete (${duration}ms) ===\n`);

    // Return success response
    return res.status(200).json({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking abandoned estimates:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check abandoned estimates',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
