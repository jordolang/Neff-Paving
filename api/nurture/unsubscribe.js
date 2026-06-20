/**
 * Unsubscribe Handler API Endpoint
 * Processes unsubscribe requests from email/SMS campaigns
 *
 * Handles:
 * - Email unsubscribe links
 * - SMS opt-out requests
 * - Consent revocation tracking
 */

import fs from 'fs';
import path from 'path';

/**
 * Validate query parameters
 */
function validateRequest(query) {
  const errors = [];

  if (!query.lead || typeof query.lead !== 'string') {
    errors.push('Missing or invalid "lead" parameter');
  }

  if (!query.type || typeof query.type !== 'string') {
    errors.push('Missing or invalid "type" parameter');
  }

  if (query.type && !['email', 'sms'].includes(query.type.toLowerCase())) {
    errors.push('Invalid "type" parameter. Must be "email" or "sms"');
  }

  return errors;
}

/**
 * Record unsubscribe event to file-based storage
 * In production, this would integrate with a database
 */
function recordUnsubscribe(leadId, type) {
  try {
    const unsubscribeRecord = {
      leadId,
      type,
      timestamp: new Date().toISOString(),
      source: 'unsubscribe_link',
      userAgent: 'unknown'
    };

    // In a production environment, this would write to a database
    // For now, we'll use a simple file-based approach in /tmp
    const logPath = '/tmp/unsubscribes.jsonl';
    const logLine = JSON.stringify(unsubscribeRecord) + '\n';

    fs.appendFileSync(logPath, logLine);

    return unsubscribeRecord;
  } catch (error) {
    // Log error but don't fail the request - user experience is priority
    console.error('Failed to record unsubscribe:', error);
    return null;
  }
}

/**
 * Generate HTML confirmation page
 */
function generateConfirmationPage(leadId, type) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Neff Paving</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
          .header {
            background-color: #2c3e50;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .content h2 {
            color: #2c3e50;
            font-size: 22px;
            margin-bottom: 15px;
          }
          .content p {
            color: #555;
            margin-bottom: 20px;
            font-size: 16px;
          }
          .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #27ae60;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
          }
          .info-box strong {
            color: #2c3e50;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .timestamp {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">✓</div>
            <h1>Neff Paving</h1>
          </div>
          <div class="content">
            <h2>You've been unsubscribed</h2>
            <p>You will no longer receive ${type === 'email' ? 'email' : 'SMS'} messages from us.</p>
            <div class="info-box">
              <strong>What this means:</strong><br>
              • You won't receive future ${type === 'email' ? 'marketing emails' : 'text messages'}<br>
              • You can still contact us directly anytime<br>
              • We'll keep your information private and secure
            </div>
            <p>We're sorry to see you go! If you unsubscribed by mistake or change your mind, please contact us directly.</p>
            <div class="timestamp">
              Unsubscribed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          </div>
          <div class="footer">
            <p>
              Have questions? <a href="https://neffpaving.com">Visit our website</a> or call us directly.
            </p>
            <p style="margin-top: 10px;">
              &copy; ${new Date().getFullYear()} Neff Paving. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Vercel Serverless Function Handler
 * GET /api/nurture/unsubscribe?lead=<leadId>&type=<email|sms>
 *
 * Query parameters:
 * - lead: Lead identifier (required)
 * - type: Communication type - "email" or "sms" (required)
 *
 * Returns:
 * - 200: HTML confirmation page
 * - 400: Validation error
 * - 405: Method not allowed
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
    // Extract query parameters
    const { lead, type } = req.query;

    // Validate request
    const validationErrors = validateRequest(req.query);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validationErrors
      });
    }

    // Normalize type to lowercase
    const normalizedType = type.toLowerCase();

    // Record the unsubscribe event
    const record = recordUnsubscribe(lead, normalizedType);

    if (record) {
      console.log(`✅ Unsubscribe recorded: ${lead} from ${normalizedType}`);
    }

    // Return HTML confirmation page
    const html = generateConfirmationPage(lead, normalizedType);

    return res.status(200).setHeader('Content-Type', 'text/html').send(html);

  } catch (error) {
    console.error('Error processing unsubscribe:', error);

    // Even on error, show a user-friendly page rather than JSON error
    // This provides better UX for users clicking unsubscribe links
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - Neff Paving</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 {
              color: #e74c3c;
              margin-bottom: 20px;
            }
            p {
              color: #555;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an error processing your unsubscribe request.</p>
            <p>Please contact us directly to update your communication preferences.</p>
          </div>
        </body>
      </html>
    `;

    return res.status(500).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
}
