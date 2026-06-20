/**
 * Twilio SMS API Serverless Function
 * Sends SMS messages for lead nurturing campaigns
 *
 * Supports:
 * - Abandoned estimate reminders
 * - Booking confirmations
 * - Post-job follow-ups
 * - STOP keyword for opt-out
 */

import twilio from 'twilio';

/**
 * SMS message templates
 */
const SMS_TEMPLATES = {
  abandoned_estimate: (data) =>
    `Hi${data.firstName ? ` ${data.firstName}` : ''}! We noticed you got an estimate${data.estimateAmount ? ` for $${data.estimateAmount}` : ''} from Neff Paving. Ready to schedule? ${data.bookingUrl || 'https://neffpaving.com/booking'} Reply STOP to opt out.`,

  booking_confirmation: (data) =>
    `Your paving appointment is confirmed!${data.appointmentDate ? ` ${data.appointmentDate}` : ''}${data.appointmentTime ? ` at ${data.appointmentTime}` : ''}. See you soon! - Neff Paving`,

  review_request: (data) =>
    `Hi${data.firstName ? ` ${data.firstName}` : ''}! Thank you for choosing Neff Paving. We'd love your feedback! ${data.reviewUrl || 'https://neffpaving.com/review'} Reply STOP to opt out.`,

  custom: (data) =>
    data.message || ''
};

/**
 * Validate request body
 */
function validateRequest(body) {
  const errors = [];

  if (!body.to || typeof body.to !== 'string') {
    errors.push('Missing or invalid "to" phone number');
  }

  // Validate phone number format (E.164 format: +1XXXXXXXXXX)
  if (body.to && !body.to.match(/^\+?[1-9]\d{1,14}$/)) {
    errors.push('Invalid phone number format. Use E.164 format (e.g., +15555551234)');
  }

  // Either message or template must be provided
  if (!body.message && !body.template) {
    errors.push('Either "message" or "template" must be provided');
  }

  // If template is provided, validate it exists
  if (body.template && !SMS_TEMPLATES[body.template]) {
    errors.push(`Unknown template: ${body.template}. Valid templates: ${Object.keys(SMS_TEMPLATES).filter(k => k !== 'custom').join(', ')}`);
  }

  return errors;
}

/**
 * Check if message contains opt-out keywords
 */
function containsStopKeyword(message) {
  const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
  const upperMessage = message.toUpperCase().trim();
  return stopKeywords.some(keyword => upperMessage === keyword);
}

/**
 * Vercel Serverless Function Handler
 * POST /api/nurture/send-sms
 *
 * Request body:
 * {
 *   "to": "+15555551234",
 *   "message": "Custom SMS message",
 *   // OR
 *   "template": "abandoned_estimate" | "booking_confirmation" | "review_request",
 *   "data": {
 *     "firstName": "John",
 *     "estimateAmount": "5000",
 *     "bookingUrl": "https://...",
 *     ... other template-specific data
 *   },
 *   "consentSms": true  // Optional: verify SMS consent (recommended)
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
    const { to, message, template, data = {}, consentSms } = req.body;

    // Validate request
    const validationErrors = validateRequest(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check SMS consent if provided
    if (consentSms === false) {
      return res.status(403).json({
        error: 'Consent required',
        message: 'User has not consented to receive SMS messages'
      });
    }

    // Initialize Twilio with credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_PHONE;

    if (!accountSid || !authToken || !fromPhone) {
      console.error('Twilio credentials are not properly configured');
      console.error({
        accountSid: accountSid ? 'SET' : 'MISSING',
        authToken: authToken ? 'SET' : 'MISSING',
        fromPhone: fromPhone ? 'SET' : 'MISSING'
      });

      return res.status(500).json({
        error: 'Configuration error',
        message: 'SMS service is not properly configured'
      });
    }

    const client = twilio(accountSid, authToken);

    // Determine message body
    let messageBody;
    if (template) {
      const templateFn = SMS_TEMPLATES[template];
      messageBody = templateFn(data);
    } else {
      messageBody = message;
    }

    // Ensure message is not empty
    if (!messageBody || messageBody.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Message body cannot be empty'
      });
    }

    // Check message length (SMS limit is 160 characters for single message, 1600 for concatenated)
    if (messageBody.length > 1600) {
      return res.status(400).json({
        error: 'Message too long',
        message: `Message exceeds maximum length of 1600 characters (current: ${messageBody.length})`
      });
    }

    // Send SMS via Twilio
    console.log(`Sending SMS to ${to}${template ? ` (template: ${template})` : ''}`);

    const twilioMessage = await client.messages.create({
      body: messageBody,
      from: fromPhone,
      to: to
    });

    console.log(`✅ SMS sent successfully: ${twilioMessage.sid} to ${to}`);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      messageSid: twilioMessage.sid,
      to: twilioMessage.to,
      from: twilioMessage.from,
      status: twilioMessage.status,
      template: template || null,
      sentAt: new Date().toISOString(),
      segmentCount: Math.ceil(messageBody.length / 160)
    });

  } catch (error) {
    console.error('Error sending SMS:', error);

    // Handle Twilio-specific errors
    if (error.code) {
      console.error('Twilio error:', {
        code: error.code,
        message: error.message,
        moreInfo: error.moreInfo,
        status: error.status
      });

      // Map common Twilio error codes to user-friendly messages
      let userMessage = error.message;
      switch (error.code) {
        case 21211:
          userMessage = 'Invalid phone number';
          break;
        case 21408:
          userMessage = 'Permission denied to send to this number';
          break;
        case 21610:
          userMessage = 'This number has previously unsubscribed';
          break;
        case 21614:
          userMessage = 'Invalid "From" phone number';
          break;
        default:
          userMessage = error.message;
      }

      return res.status(error.status || 500).json({
        error: 'Failed to send SMS',
        message: userMessage,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? {
          moreInfo: error.moreInfo,
          stack: error.stack
        } : undefined
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Handle incoming SMS webhooks (for STOP keyword processing)
 * POST /api/nurture/send-sms/webhook
 *
 * This handler processes incoming SMS messages to detect opt-out requests.
 * Configure in Twilio Console: Messaging > Settings > Webhook for incoming messages
 */
export async function handleIncomingSMS(req, res) {
  try {
    const { Body, From, To } = req.body;

    console.log(`Received SMS from ${From}: ${Body}`);

    // Check for STOP keywords
    if (containsStopKeyword(Body)) {
      console.log(`📵 Opt-out request received from ${From}`);

      // TODO: Update consent record in database/localStorage
      // This would integrate with the ConsentService once implemented

      // Respond with confirmation (optional - Twilio handles STOP automatically)
      return res.status(200).json({
        success: true,
        message: 'Opt-out processed',
        from: From,
        action: 'unsubscribed'
      });
    }

    // For other messages, just acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Message received',
      from: From
    });

  } catch (error) {
    console.error('Error handling incoming SMS:', error);

    return res.status(500).json({
      error: 'Failed to process incoming message',
      message: error.message
    });
  }
}
