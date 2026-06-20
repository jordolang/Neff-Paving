/**
 * Test for booking confirmation trigger in webhook handler
 */

import { WebhookHandler } from '../webhook-handler.js';

describe('WebhookHandler - Booking Confirmation', () => {
  let webhookHandler;
  let consoleSpy;

  beforeEach(() => {
    webhookHandler = new WebhookHandler();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should send booking confirmation when Calendly event is scheduled', async () => {
    // Simulate Calendly booking webhook event
    const mockEvent = {
      type: 'calendly.event_scheduled',
      data: {
        object: {
          uri: 'https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA',
          event_type: {
            name: 'Site Consultation'
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
            location: '123 Main St, City, State'
          },
          cancel_url: 'https://calendly.com/cancellations/AAAAAAAAAAAAAAAA',
          reschedule_url: 'https://calendly.com/reschedulings/AAAAAAAAAAAAAAAA'
        }
      }
    };

    // Process the event
    await webhookHandler.processEvent(mockEvent);

    // Verify booking confirmation was triggered
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Sending booking confirmation email to: customer@example.com')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅ Booking confirmation sent to customer@example.com')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Site Consultation')
    );
  });

  test('should handle booking confirmation when invitee email is missing', async () => {
    const mockEvent = {
      type: 'calendly.event_scheduled',
      data: {
        object: {
          uri: 'https://api.calendly.com/scheduled_events/BBBBBBBBBBBBBBBB',
          event_type: {
            name: 'Site Consultation'
          },
          start_time: '2026-06-25T14:00:00Z',
          end_time: '2026-06-25T15:00:00Z',
          invitees: []
        }
      }
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Process the event
    await webhookHandler.processEvent(mockEvent);

    // Verify error was logged but process didn't crash
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'No invitee email found for booking confirmation'
    );

    consoleErrorSpy.mockRestore();
  });

  test('should include booking details in confirmation email', async () => {
    const mockEvent = {
      type: 'calendly.event_scheduled',
      data: {
        object: {
          uri: 'https://api.calendly.com/scheduled_events/CCCCCCCCCCCCCCCC',
          event_type: {
            name: 'Project Estimate Meeting'
          },
          start_time: '2026-06-26T10:00:00Z',
          end_time: '2026-06-26T11:00:00Z',
          invitees: [
            {
              email: 'jane.smith@example.com',
              name: 'Jane Smith'
            }
          ],
          location: {
            join_url: 'https://zoom.us/j/123456789'
          },
          cancel_url: 'https://calendly.com/cancellations/CCCCCCCCCCCCCCCC',
          reschedule_url: 'https://calendly.com/reschedulings/CCCCCCCCCCCCCCCC'
        }
      }
    };

    // Process the event
    await webhookHandler.processEvent(mockEvent);

    // Verify booking confirmation includes all details
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('jane.smith@example.com')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Project Estimate Meeting')
    );
  });
});
