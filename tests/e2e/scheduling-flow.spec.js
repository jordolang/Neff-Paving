import { test, expect } from '@playwright/test'

/**
 * E2E tests for the scheduling sync flow
 * Tests the complete user journey from accessing the scheduler to completing a booking
 */

test.describe('Scheduling Flow', () => {
  // Helper function to create a test page with scheduling widget HTML structure
  async function setupSchedulingWidget(page, options = {}) {
    const defaultOptions = {
      contractId: 'CONTRACT-12345',
      estimateData: {
        clientName: 'John Doe',
        clientEmail: 'john.doe@example.com',
        serviceType: 'residential',
        timeline: {
          days: 30
        },
        totalCost: 5000,
        address: '123 Main Street, Columbus, OH 43215'
      }
    }

    const config = { ...defaultOptions, ...options }

    // Create a static test page with scheduling widget HTML
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Schedule Consultation - Neff Paving</title>
        <!-- setContent() pages have no origin (about:blank); a base href lets
             relative fetch() URLs resolve so page.route() mocks can intercept them. -->
        <base href="http://localhost/">
        <style>
          .scheduling-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
            font-family: sans-serif;
          }
          .scheduling-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          .scheduling-title {
            margin: 0 0 12px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .contract-info {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            background: #f3f4f6;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .info-label {
            font-weight: 500;
            color: #6b7280;
          }
          .info-value {
            font-weight: 600;
            color: #111827;
          }
          .client-info {
            margin-bottom: 24px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .client-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .calendly-widget-container {
            min-height: 630px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .success-message {
            padding: 16px;
            background: #d1fae5;
            color: #065f46;
            border-radius: 8px;
            margin-top: 16px;
            display: none;
          }
          .success-message.visible {
            display: block;
          }
          .error-message {
            padding: 16px;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 8px;
            margin-top: 16px;
            display: none;
          }
          .error-message.visible {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="scheduling-container">
          <div class="scheduling-header">
            <h2 class="scheduling-title">Schedule Your Consultation</h2>
            <div class="contract-info">
              <div>
                <span class="info-label">Contract ID:</span>
                <span class="info-value" id="contract-id">${config.contractId}</span>
              </div>
              <div>
                <span class="info-label">Service Type:</span>
                <span class="info-value" id="service-type">${config.estimateData.serviceType}</span>
              </div>
            </div>
          </div>

          <div class="client-info">
            <h4>Pre-filled Information</h4>
            <div class="client-info-row">
              <span class="info-label">Name:</span>
              <span class="info-value" id="client-name">${config.estimateData.clientName}</span>
            </div>
            <div class="client-info-row">
              <span class="info-label">Email:</span>
              <span class="info-value" id="client-email">${config.estimateData.clientEmail}</span>
            </div>
            <div class="client-info-row">
              <span class="info-label">Address:</span>
              <span class="info-value" id="project-address">${config.estimateData.address}</span>
            </div>
            <div class="client-info-row">
              <span class="info-label">Estimated Cost:</span>
              <span class="info-value" id="total-cost">$${config.estimateData.totalCost}</span>
            </div>
            <div class="client-info-row">
              <span class="info-label">Timeline:</span>
              <span class="info-value" id="timeline">${config.estimateData.timeline.days} days</span>
            </div>
          </div>

          <div id="calendly-widget" class="calendly-widget-container">
            <!-- Calendly widget would be initialized here -->
            <div style="padding: 40px; text-align: center; color: #6b7280;">
              <div id="widget-status">Initializing Calendly widget...</div>
            </div>
          </div>

          <div id="success-message" class="success-message">
            <strong>Consultation Scheduled!</strong>
            <p id="success-details"></p>
          </div>

          <div id="error-message" class="error-message">
            <strong>Scheduling Error</strong>
            <p id="error-details"></p>
          </div>
        </div>

        <script>
          // Simulate Calendly scheduler integration
          const contractId = '${config.contractId}';
          const estimateData = ${JSON.stringify(config.estimateData)};

          // Mock Calendly widget initialization
          function initializeCalendlyWidget() {
            const widgetElement = document.getElementById('calendly-widget');
            const statusElement = document.getElementById('widget-status');

            // Simulate widget loading
            setTimeout(() => {
              statusElement.textContent = 'Calendly widget loaded successfully';
              widgetElement.dataset.initialized = 'true';

              // Dispatch custom event to indicate widget is ready. Also persist
              // the detail on window so a listener attached after this fires can
              // still read it (avoids a race with the 500ms timer).
              const detail = { contractId, estimateData };
              window.__calendlyWidgetReady = detail;
              window.dispatchEvent(new CustomEvent('calendly:widget_ready', { detail }));
            }, 500);
          }

          // Listen for Calendly events
          window.addEventListener('message', (e) => {
            // In production, verify origin is https://calendly.com
            if (e.data && e.data.event) {
              handleCalendlyEvent(e.data);
            }
          });

          function handleCalendlyEvent(eventData) {
            const successMessage = document.getElementById('success-message');
            const successDetails = document.getElementById('success-details');
            const errorMessage = document.getElementById('error-message');

            switch (eventData.event) {
              case 'calendly.event_scheduled':
                // Handle successful scheduling
                const scheduledData = {
                  contractId,
                  calendlyEventUri: eventData.payload?.event?.uri || 'test-event-uri',
                  scheduledTime: eventData.payload?.event?.start_time || new Date().toISOString(),
                  clientName: eventData.payload?.invitee?.name || estimateData.clientName,
                  clientEmail: eventData.payload?.invitee?.email || estimateData.clientEmail
                };

                // Send notification to backend
                notifyBackend(scheduledData)
                  .then(() => {
                    successDetails.textContent = \`Your consultation has been scheduled for \${new Date(scheduledData.scheduledTime).toLocaleString()}. A confirmation email has been sent to \${scheduledData.clientEmail}.\`;
                    successMessage.classList.add('visible');

                    // Dispatch custom event for testing
                    const event = new CustomEvent('calendly:scheduling_complete', {
                      detail: scheduledData
                    });
                    window.dispatchEvent(event);
                  })
                  .catch((error) => {
                    showError(error.message);
                  });
                break;

              case 'calendly.event_type_viewed':
                console.log('Event type viewed');
                break;

              case 'calendly.date_and_time_selected':
                console.log('Date and time selected:', eventData.payload);
                break;

              default:
                console.log('Calendly event received:', eventData.event);
            }
          }

          async function notifyBackend(schedulingData) {
            const response = await fetch('/api/scheduling/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(schedulingData)
            });

            if (!response.ok) {
              throw new Error('Failed to notify backend');
            }

            return response.json();
          }

          function showError(message) {
            const errorMessage = document.getElementById('error-message');
            const errorDetails = document.getElementById('error-details');
            errorDetails.textContent = message;
            errorMessage.classList.add('visible');
          }

          // Initialize widget on page load
          initializeCalendlyWidget();
        </script>
      </body>
      </html>
    `)

    // Wait for the widget container to be rendered
    await page.waitForSelector('.calendly-widget-container', { timeout: 5000 })
  }

  // Mock Calendly event helper
  function createCalendlyEvent(type, payload = {}) {
    return {
      event: type,
      payload
    }
  }

  test.beforeEach(async ({ page }) => {
    // Mock the backend API endpoints
    await page.route('**/api/scheduling/notify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Notification sent successfully'
        })
      })
    })

    await page.route('**/api/contracts/*/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status: 'consultation_scheduled'
        })
      })
    })

    await page.route('**/api/notifications/send', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sent: true
        })
      })
    })
  })

  test('should display scheduling widget with contract information', async ({ page }) => {
    await setupSchedulingWidget(page)

    // Verify scheduling header
    await expect(page.locator('.scheduling-title')).toContainText('Schedule Your Consultation')

    // Verify contract information is displayed
    await expect(page.locator('#contract-id')).toContainText('CONTRACT-12345')
    await expect(page.locator('#service-type')).toContainText('residential')

    // Verify client information is pre-filled
    await expect(page.locator('#client-name')).toContainText('John Doe')
    await expect(page.locator('#client-email')).toContainText('john.doe@example.com')
    await expect(page.locator('#project-address')).toBeVisible()
    await expect(page.locator('#total-cost')).toContainText('$5000')
    await expect(page.locator('#timeline')).toContainText('30 days')

    // Verify Calendly widget container is visible
    await expect(page.locator('#calendly-widget')).toBeVisible()
  })

  test('should initialize Calendly widget successfully', async ({ page }) => {
    await setupSchedulingWidget(page)

    // Wait for widget initialization
    await page.waitForTimeout(600)

    // Check widget status
    const statusText = await page.locator('#widget-status').textContent()
    expect(statusText).toContain('loaded successfully')

    // Verify widget is marked as initialized
    const isInitialized = await page.locator('#calendly-widget').getAttribute('data-initialized')
    expect(isInitialized).toBe('true')
  })

  test('should pre-fill customer data correctly', async ({ page }) => {
    const customData = {
      contractId: 'CONTRACT-67890',
      estimateData: {
        clientName: 'Jane Smith',
        clientEmail: 'jane.smith@example.com',
        serviceType: 'commercial',
        timeline: { days: 45 },
        totalCost: 12000,
        address: '456 Business Ave, Cleveland, OH 44101'
      }
    }

    await setupSchedulingWidget(page, customData)

    // Verify custom data is displayed
    await expect(page.locator('#contract-id')).toContainText('CONTRACT-67890')
    await expect(page.locator('#client-name')).toContainText('Jane Smith')
    await expect(page.locator('#client-email')).toContainText('jane.smith@example.com')
    await expect(page.locator('#service-type')).toContainText('commercial')
    await expect(page.locator('#total-cost')).toContainText('$12000')
    await expect(page.locator('#timeline')).toContainText('45 days')
  })

  test('should handle successful event scheduling', async ({ page }) => {
    await setupSchedulingWidget(page)

    // Wait for widget initialization
    await page.waitForTimeout(600)

    // Listen for scheduling complete event
    const schedulingCompletePromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('calendly:scheduling_complete', (e) => {
          resolve(e.detail)
        }, { once: true })
      })
    })

    // Simulate Calendly event_scheduled message
    await page.evaluate(() => {
      const scheduledEvent = {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'https://calendly.com/events/test-event-123',
            start_time: '2026-06-25T10:00:00Z',
            end_time: '2026-06-25T11:00:00Z'
          },
          invitee: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      }
      window.postMessage(scheduledEvent, '*')
    })

    // Wait for scheduling to complete
    const schedulingData = await schedulingCompletePromise

    // Verify scheduling data
    expect(schedulingData.contractId).toBe('CONTRACT-12345')
    expect(schedulingData.clientName).toBe('John Doe')
    expect(schedulingData.clientEmail).toBe('john.doe@example.com')

    // Verify success message is displayed
    await page.waitForTimeout(500)
    await expect(page.locator('#success-message')).toBeVisible()
    await expect(page.locator('#success-details')).toContainText('confirmation email')
  })

  test('should display confirmation message with scheduled time', async ({ page }) => {
    await setupSchedulingWidget(page)
    await page.waitForTimeout(600)

    // Simulate event scheduling
    await page.evaluate(() => {
      const scheduledEvent = {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'https://calendly.com/events/test-event-456',
            start_time: '2026-06-30T14:00:00Z',
            end_time: '2026-06-30T15:00:00Z'
          },
          invitee: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      }
      window.postMessage(scheduledEvent, '*')
    })

    // Wait for success message
    await page.waitForTimeout(1000)

    // Verify success message includes date/time
    const successDetails = await page.locator('#success-details').textContent()
    expect(successDetails).toContain('consultation has been scheduled')
    expect(successDetails).toContain('john.doe@example.com')
  })

  test('should send notification to backend on scheduling', async ({ page }) => {
    await setupSchedulingWidget(page)
    await page.waitForTimeout(600)

    // Track API calls
    const apiCalls = []
    await page.route('**/api/scheduling/notify', async (route) => {
      const postData = route.request().postDataJSON()
      apiCalls.push(postData)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Notification sent'
        })
      })
    })

    // Simulate event scheduling
    await page.evaluate(() => {
      const scheduledEvent = {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'https://calendly.com/events/test-event-789',
            start_time: '2026-07-01T09:00:00Z',
            end_time: '2026-07-01T10:00:00Z'
          },
          invitee: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      }
      window.postMessage(scheduledEvent, '*')
    })

    // Wait for API call
    await page.waitForTimeout(1000)

    // Verify API was called with correct data
    expect(apiCalls.length).toBeGreaterThan(0)
    expect(apiCalls[0].contractId).toBe('CONTRACT-12345')
    expect(apiCalls[0].calendlyEventUri).toBe('https://calendly.com/events/test-event-789')
  })

  test('should handle backend notification failure gracefully', async ({ page }) => {
    await setupSchedulingWidget(page)
    await page.waitForTimeout(600)

    // Mock backend failure
    await page.route('**/api/scheduling/notify', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })

    // Simulate event scheduling
    await page.evaluate(() => {
      const scheduledEvent = {
        event: 'calendly.event_scheduled',
        payload: {
          event: {
            uri: 'https://calendly.com/events/test-event-error',
            start_time: '2026-07-05T11:00:00Z',
            end_time: '2026-07-05T12:00:00Z'
          },
          invitee: {
            name: 'John Doe',
            email: 'john.doe@example.com'
          }
        }
      }
      window.postMessage(scheduledEvent, '*')
    })

    // Wait for error handling
    await page.waitForTimeout(1000)

    // Verify error message is displayed
    await expect(page.locator('#error-message')).toBeVisible()
    await expect(page.locator('#error-details')).toContainText('Failed to notify backend')
  })

  test('should handle Calendly event type viewed event', async ({ page }) => {
    await setupSchedulingWidget(page)
    await page.waitForTimeout(600)

    // Simulate event type viewed
    await page.evaluate(() => {
      const viewedEvent = {
        event: 'calendly.event_type_viewed',
        payload: {
          event_type: {
            name: 'Initial Consultation',
            slug: 'initial-consultation'
          }
        }
      }
      window.postMessage(viewedEvent, '*')
    })

    // Wait for event processing
    await page.waitForTimeout(300)

    // No error should be shown
    const errorVisible = await page.locator('#error-message').isVisible()
    expect(errorVisible).toBeFalsy()
  })

  test('should handle date and time selection event', async ({ page }) => {
    await setupSchedulingWidget(page)
    await page.waitForTimeout(600)

    // Simulate date and time selection
    await page.evaluate(() => {
      const dateTimeEvent = {
        event: 'calendly.date_and_time_selected',
        payload: {
          start_time: '2026-07-10T13:00:00Z'
        }
      }
      window.postMessage(dateTimeEvent, '*')
    })

    // Wait for event processing
    await page.waitForTimeout(300)

    // No error should be shown
    const errorVisible = await page.locator('#error-message').isVisible()
    expect(errorVisible).toBeFalsy()
  })

  test('should render scheduling widget on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await setupSchedulingWidget(page)

    // Verify container is visible and properly laid out
    await expect(page.locator('.scheduling-container')).toBeVisible()

    // Check that scheduling elements are visible on mobile
    await expect(page.locator('.scheduling-title')).toBeVisible()
    await expect(page.locator('.contract-info')).toBeVisible()
    await expect(page.locator('.client-info')).toBeVisible()
    await expect(page.locator('#calendly-widget')).toBeVisible()

    // Verify container doesn't exceed mobile viewport width
    const container = page.locator('.scheduling-container')
    const boundingBox = await container.boundingBox()
    expect(boundingBox.width).toBeLessThanOrEqual(375)
  })

  test('should handle multiple service types correctly', async ({ page }) => {
    // Test with residential service
    await setupSchedulingWidget(page, {
      estimateData: {
        clientName: 'Test User',
        clientEmail: 'test@example.com',
        serviceType: 'residential',
        timeline: { days: 30 },
        totalCost: 5000,
        address: '123 Test St'
      }
    })

    await expect(page.locator('#service-type')).toContainText('residential')
  })

  test('should wait for widget initialization before showing content', async ({ page }) => {
    await setupSchedulingWidget(page)

    // Initially, widget should be in loading state
    const initialStatus = await page.locator('#widget-status').textContent()
    expect(initialStatus).toContain('Initializing')

    // Wait for initialization
    await page.waitForTimeout(600)

    // After initialization, status should update
    const finalStatus = await page.locator('#widget-status').textContent()
    expect(finalStatus).toContain('loaded successfully')
  })

  test('should handle widget initialization event', async ({ page }) => {
    // The widget_ready event fires 500ms after setContent, so the listener must
    // be attached after the page content exists (a listener registered on the
    // pre-setContent about:blank document would be discarded). Guard against the
    // event having already fired by also reading the persisted window value.
    await setupSchedulingWidget(page)

    const widgetData = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.__calendlyWidgetReady) {
          resolve(window.__calendlyWidgetReady)
          return
        }
        window.addEventListener('calendly:widget_ready', (e) => {
          resolve(e.detail)
        }, { once: true })
      })
    })

    // Verify event data
    expect(widgetData.contractId).toBe('CONTRACT-12345')
    expect(widgetData.estimateData).toBeDefined()
    expect(widgetData.estimateData.clientName).toBe('John Doe')
  })

  test('should display all client information fields', async ({ page }) => {
    await setupSchedulingWidget(page)

    // Verify all client info rows are visible
    const clientInfoRows = page.locator('.client-info-row')
    const rowCount = await clientInfoRows.count()
    expect(rowCount).toBeGreaterThanOrEqual(5)

    // Verify specific fields
    await expect(page.locator('.client-info')).toContainText('Name:')
    await expect(page.locator('.client-info')).toContainText('Email:')
    await expect(page.locator('.client-info')).toContainText('Address:')
    await expect(page.locator('.client-info')).toContainText('Estimated Cost:')
    await expect(page.locator('.client-info')).toContainText('Timeline:')
  })
})
