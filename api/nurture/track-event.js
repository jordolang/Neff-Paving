/**
 * Analytics Tracking API Serverless Function
 * Tracks nurture campaign events for analytics and reporting
 *
 * Supported events:
 * - email_sent: Email sent to a lead
 * - email_opened: Lead opened the email
 * - email_clicked: Lead clicked a link in the email
 * - sms_sent: SMS sent to a lead
 * - sms_delivered: SMS delivered successfully
 * - unsubscribed: Lead unsubscribed from communications
 * - converted: Lead converted to customer
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

/**
 * Valid event types
 */
const VALID_EVENT_TYPES = [
  'email_sent',
  'email_opened',
  'email_clicked',
  'sms_sent',
  'sms_delivered',
  'unsubscribed',
  'converted'
];

/**
 * Valid campaign types
 */
const VALID_CAMPAIGN_TYPES = [
  'abandoned_estimate',
  'booking_confirmation',
  'review_request',
  'custom'
];

/**
 * Get file path for event storage
 * Uses /tmp for serverless environment compatibility
 */
function getEventStoragePath() {
  const tmpDir = tmpdir();
  const storagePath = join(tmpDir, 'nurture_events.jsonl');
  return storagePath;
}

/**
 * Validate request body
 */
function validateRequest(body) {
  const errors = [];

  if (!body.event || typeof body.event !== 'string') {
    errors.push('Missing or invalid "event" field');
  }

  if (body.event && !VALID_EVENT_TYPES.includes(body.event)) {
    errors.push(`Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  if (body.campaign && !VALID_CAMPAIGN_TYPES.includes(body.campaign)) {
    errors.push(`Invalid campaign type. Valid types: ${VALID_CAMPAIGN_TYPES.join(', ')}`);
  }

  if (!body.lead_id || typeof body.lead_id !== 'string') {
    errors.push('Missing or invalid "lead_id" field');
  }

  return errors;
}

/**
 * Store event to file-based storage
 * In production, this should be replaced with a proper database (Vercel KV, PostgreSQL, etc.)
 *
 * @param {Object} eventData - Event data to store
 */
function storeEvent(eventData) {
  try {
    const storagePath = getEventStoragePath();

    // Ensure directory exists
    const dir = dirname(storagePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Append event as newline-delimited JSON
    const eventLine = JSON.stringify(eventData) + '\n';

    if (existsSync(storagePath)) {
      const existingContent = readFileSync(storagePath, 'utf-8');
      writeFileSync(storagePath, existingContent + eventLine, 'utf-8');
    } else {
      writeFileSync(storagePath, eventLine, 'utf-8');
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to store event: ${error.message}`);
  }
}

/**
 * Get all stored events
 * Used for analytics queries
 */
function getStoredEvents() {
  try {
    const storagePath = getEventStoragePath();

    if (!existsSync(storagePath)) {
      return [];
    }

    const content = readFileSync(storagePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to read events: ${error.message}`);
  }
}

/**
 * Vercel Serverless Function Handler
 * POST /api/nurture/track-event
 *
 * Request body:
 * {
 *   "event": "email_sent" | "email_opened" | "email_clicked" | "sms_sent" | "sms_delivered" | "unsubscribed" | "converted",
 *   "campaign": "abandoned_estimate" | "booking_confirmation" | "review_request" | "custom",
 *   "lead_id": "lead_123",
 *   "metadata": {  // Optional additional data
 *     "email": "customer@example.com",
 *     "phone": "+15555551234",
 *     "message_id": "sg_message_123",
 *     ... other event-specific data
 *   }
 * }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    // Parse request body
    const { event, campaign, lead_id, metadata = {} } = req.body;

    // Validate request
    const validationErrors = validateRequest(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validationErrors
      });
    }

    // Create event record
    const eventRecord = {
      event,
      campaign: campaign || null,
      lead_id,
      metadata,
      timestamp: new Date().toISOString(),
      source: 'api'
    };

    // Store event
    storeEvent(eventRecord);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      event: {
        type: event,
        campaign: campaign || null,
        lead_id,
        timestamp: eventRecord.timestamp
      }
    });

  } catch (error) {
    // Handle errors
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Query events for analytics
 * GET /api/nurture/track-event?lead_id=XXX&event=email_sent&campaign=abandoned_estimate
 *
 * This is a helper function that can be exposed as a separate endpoint
 * or used internally for analytics queries
 */
export async function queryEvents(filters = {}) {
  try {
    let events = getStoredEvents();

    // Apply filters
    if (filters.lead_id) {
      events = events.filter(e => e.lead_id === filters.lead_id);
    }

    if (filters.event) {
      events = events.filter(e => e.event === filters.event);
    }

    if (filters.campaign) {
      events = events.filter(e => e.campaign === filters.campaign);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      events = events.filter(e => new Date(e.timestamp) >= sinceDate);
    }

    if (filters.until) {
      const untilDate = new Date(filters.until);
      events = events.filter(e => new Date(e.timestamp) <= untilDate);
    }

    return {
      success: true,
      events,
      count: events.length
    };

  } catch (error) {
    throw new Error(`Failed to query events: ${error.message}`);
  }
}
