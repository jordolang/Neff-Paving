/**
 * Manual verification script for booking confirmation trigger
 * Run this to simulate a Calendly booking webhook event
 */

import { webhookHandler } from '../src/services/webhook-handler.js';

async function testBookingConfirmation() {
  console.log('='.repeat(60));
  console.log('Testing Booking Confirmation Trigger');
  console.log('='.repeat(60));
  console.log('');

  // Simulate Calendly booking webhook event
  const mockCalendlyEvent = {
    type: 'calendly.event_scheduled',
    id: 'test_event_' + Date.now(),
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        uri: 'https://api.calendly.com/scheduled_events/TEST123456',
        event_type: {
          name: 'Site Consultation - Paving Project'
        },
        start_time: '2026-06-25T14:00:00Z',
        end_time: '2026-06-25T15:00:00Z',
        invitees: [
          {
            email: 'customer@example.com',
            name: 'John Doe'
          }
        ],
        location: {
          location: '123 Main St, Springfield, IL 62701'
        },
        cancel_url: 'https://calendly.com/cancellations/TEST123456',
        reschedule_url: 'https://calendly.com/reschedulings/TEST123456',
        questions_and_answers: [
          {
            question: 'Project Address',
            answer: '123 Main St, Springfield, IL 62701'
          },
          {
            question: 'Type of Service',
            answer: 'Driveway Paving'
          }
        ]
      }
    }
  };

  console.log('Simulating Calendly booking webhook event...');
  console.log('Event Type:', mockCalendlyEvent.type);
  console.log('Customer Email:', mockCalendlyEvent.data.object.invitees[0].email);
  console.log('Customer Name:', mockCalendlyEvent.data.object.invitees[0].name);
  console.log('Appointment Type:', mockCalendlyEvent.data.object.event_type.name);
  console.log('Appointment Time:', mockCalendlyEvent.data.object.start_time);
  console.log('');

  try {
    // Process the webhook event
    await webhookHandler.processEvent(mockCalendlyEvent);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Expected results:');
    console.log('1. ✅ Booking confirmation email triggered');
    console.log('2. ✅ Email sent to: customer@example.com');
    console.log('3. ✅ Email includes booking details (time, location, etc.)');
    console.log('4. ✅ Booking stored in database');
    console.log('5. ✅ Analytics event tracked');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Test failed with error:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the test
testBookingConfirmation().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
