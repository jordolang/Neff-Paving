/**
 * Email Templates Configuration
 *
 * Centralized email template definitions for lead nurturing campaigns.
 * Each template includes subject, HTML, and plain text versions with
 * dynamic data interpolation and unsubscribe links.
 *
 * Templates:
 * - abandoned_estimate: Follow-up for prospects who created estimates but haven't booked
 * - booking_confirmation: Confirmation email after Calendly booking
 * - review_request: Request for review after job completion
 */

const templates = {
  abandoned_estimate: {
    subject: "Still interested in your paving project?",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .cta-button {
              display: inline-block;
              background-color: #e67e22;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
            .unsubscribe { color: #6c757d; font-size: 11px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Neff Paving</h1>
            </div>
            <div class="content">
              <h2>We noticed you got an estimate...</h2>
              <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
              <p>We wanted to follow up on the paving estimate you requested${data.estimateAmount ? ` for $${data.estimateAmount}` : ''}. We'd love to help bring your project to life!</p>
              <p>Have questions? Ready to schedule? Our team is here to help make your paving project smooth and stress-free.</p>
              <p style="text-align: center;">
                <a href="${data.bookingUrl || 'https://neffpaving.com/booking'}" class="cta-button">
                  Schedule Your Project
                </a>
              </p>
              <p>Or simply reply to this email with any questions you have.</p>
              <p>Best regards,<br>The Neff Paving Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Neff Paving. All rights reserved.</p>
              <p class="unsubscribe">
                Don't want to receive these emails?
                <a href="${data.unsubscribeUrl || '#'}">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: (data) => `
Hi${data.firstName ? ` ${data.firstName}` : ''},

We noticed you got an estimate for your paving project${data.estimateAmount ? ` ($${data.estimateAmount})` : ''}. We'd love to help bring it to life!

Have questions? Ready to schedule? Our team is here to help make your paving project smooth and stress-free.

Schedule your project: ${data.bookingUrl || 'https://neffpaving.com/booking'}

Or simply reply to this email with any questions.

Best regards,
The Neff Paving Team

---
Unsubscribe: ${data.unsubscribeUrl || 'https://neffpaving.com/unsubscribe'}
    `.trim()
  },

  booking_confirmation: {
    subject: "Your paving appointment is confirmed!",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .appointment-box {
              background-color: #f8f9fa;
              border-left: 4px solid #27ae60;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Appointment Confirmed</h1>
            </div>
            <div class="content">
              <h2>You're all set!</h2>
              <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
              <p>Your paving appointment has been confirmed. We're looking forward to working with you!</p>
              <div class="appointment-box">
                <strong>Appointment Details:</strong><br>
                ${data.appointmentDate ? `<strong>Date:</strong> ${data.appointmentDate}<br>` : ''}
                ${data.appointmentTime ? `<strong>Time:</strong> ${data.appointmentTime}<br>` : ''}
                ${data.serviceType ? `<strong>Service:</strong> ${data.serviceType}<br>` : ''}
                ${data.address ? `<strong>Location:</strong> ${data.address}<br>` : ''}
              </div>
              <p><strong>What to expect:</strong></p>
              <ul>
                <li>Our team will arrive on time and ready to work</li>
                <li>We'll protect your property and clean up thoroughly</li>
                <li>You'll receive updates throughout the project</li>
              </ul>
              <p>If you need to reschedule or have questions, please contact us at your earliest convenience.</p>
              <p>Best regards,<br>The Neff Paving Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Neff Paving. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: (data) => `
Your paving appointment is confirmed!

Hi${data.firstName ? ` ${data.firstName}` : ''},

Your paving appointment has been confirmed. We're looking forward to working with you!

APPOINTMENT DETAILS:
${data.appointmentDate ? `Date: ${data.appointmentDate}` : ''}
${data.appointmentTime ? `Time: ${data.appointmentTime}` : ''}
${data.serviceType ? `Service: ${data.serviceType}` : ''}
${data.address ? `Location: ${data.address}` : ''}

WHAT TO EXPECT:
- Our team will arrive on time and ready to work
- We'll protect your property and clean up thoroughly
- You'll receive updates throughout the project

If you need to reschedule or have questions, please contact us.

Best regards,
The Neff Paving Team
    `.trim()
  },

  review_request: {
    subject: "How did we do? We'd love your feedback",
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .cta-button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .stars { font-size: 24px; margin: 10px 0; }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>We Value Your Feedback</h1>
            </div>
            <div class="content">
              <h2>How did we do?</h2>
              <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
              <p>Thank you for choosing Neff Paving for your recent ${data.serviceType || 'paving'} project! We hope you're thrilled with the results.</p>
              <p>Your feedback helps us continue to provide excellent service. Would you take a moment to share your experience?</p>
              <div class="stars">⭐ ⭐ ⭐ ⭐ ⭐</div>
              <p style="text-align: center;">
                <a href="${data.reviewUrl || 'https://neffpaving.com/review'}" class="cta-button">
                  Leave a Review
                </a>
              </p>
              <p>Your review helps other homeowners find quality paving services and helps us grow our business. We truly appreciate your support!</p>
              <p>Best regards,<br>The Neff Paving Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Neff Paving. All rights reserved.</p>
              <p class="unsubscribe">
                <a href="${data.unsubscribeUrl || '#'}">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    getText: (data) => `
How did we do? We'd love your feedback!

Hi${data.firstName ? ` ${data.firstName}` : ''},

Thank you for choosing Neff Paving for your recent ${data.serviceType || 'paving'} project! We hope you're thrilled with the results.

Your feedback helps us continue to provide excellent service. Would you take a moment to share your experience?

Leave a review: ${data.reviewUrl || 'https://neffpaving.com/review'}

Your review helps other homeowners find quality paving services and helps us grow our business. We truly appreciate your support!

Best regards,
The Neff Paving Team

---
Unsubscribe: ${data.unsubscribeUrl || 'https://neffpaving.com/unsubscribe'}
    `.trim()
  }
};

// ES module exports for use in other API files
export default templates;

// Named exports for convenience
export const abandoned_estimate = templates.abandoned_estimate;
export const booking_confirmation = templates.booking_confirmation;
export const review_request = templates.review_request;
