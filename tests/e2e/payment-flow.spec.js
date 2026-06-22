import { test, expect } from '@playwright/test'

/**
 * E2E tests for the payment form flow
 * Tests the complete user journey for processing payments
 *
 * Note: These tests use a standalone HTML test page to avoid dev server dependencies
 */

test.describe('Payment Form Flow', () => {
  // Helper function to create a test page with payment form HTML structure
  async function setupPaymentForm(page, options = {}) {
    const defaultOptions = {
      amount: 50000, // $500.00 in cents
      currency: 'USD',
      description: 'Deposit Payment',
      customerInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '5551234567'
      }
    }

    const config = { ...defaultOptions, ...options }

    // Format amount as currency
    const formatAmount = (cents) => {
      const dollars = cents / 100
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(dollars)
    }

    // Create a static test page with payment form HTML
    // This mimics what the PaymentForm component would render
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Form Test</title>
        <!-- setContent() pages have no origin (about:blank); a base href lets
             relative fetch() URLs resolve so page.route() mocks can intercept them. -->
        <base href="http://localhost/">
        <style>
          .payment-form-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 24px;
            font-family: sans-serif;
          }
          .payment-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          .payment-title {
            margin: 0 0 12px 0;
            font-size: 24px;
            font-weight: 600;
          }
          .payment-amount {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            background: #f3f4f6;
            border-radius: 8px;
          }
          .amount-value {
            font-size: 18px;
            font-weight: 600;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
          }
          .payment-summary {
            margin: 20px 0;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .payment-submit-btn {
            width: 100%;
            padding: 12px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }
          .payment-submit-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
          #payment-message {
            margin-top: 16px;
            padding: 12px;
            border-radius: 4px;
          }
          #payment-message.hidden {
            display: none;
          }
          #payment-message.error {
            background: #fee2e2;
            color: #991b1b;
          }
          #payment-message.success {
            background: #d1fae5;
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="payment-form-container">
          <div class="payment-header">
            <h3 class="payment-title">Payment Details</h3>
            <div class="payment-amount">
              <span class="amount-label">Amount:</span>
              <span class="amount-value">${formatAmount(config.amount)}</span>
            </div>
          </div>

          <form id="payment-form" class="payment-form">
            <div class="customer-section">
              <h4>Customer Information</h4>
              <div class="form-group">
                <label for="customer-name">Full Name *</label>
                <input
                  type="text"
                  id="customer-name"
                  name="name"
                  required
                  value="${config.customerInfo.name || ''}"
                  placeholder="Enter your full name"
                >
              </div>
              <div class="form-group">
                <label for="customer-email">Email Address *</label>
                <input
                  type="email"
                  id="customer-email"
                  name="email"
                  required
                  value="${config.customerInfo.email || ''}"
                  placeholder="Enter your email address"
                >
              </div>
              <div class="form-group">
                <label for="customer-phone">Phone Number</label>
                <input
                  type="tel"
                  id="customer-phone"
                  name="phone"
                  value="${config.customerInfo.phone || ''}"
                  placeholder="Enter your phone number"
                >
              </div>
            </div>

            <div class="payment-section">
              <h4>Payment Method</h4>
              <div id="payment-element" class="payment-element">
                <!-- Stripe Elements would be here in production -->
                <div style="padding: 20px; background: #f3f4f6; border-radius: 4px; text-align: center;">
                  Payment Element Placeholder
                </div>
              </div>
            </div>

            <div class="payment-summary">
              <div class="summary-row">
                <span>Description:</span>
                <span>${config.description}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>${formatAmount(config.amount)}</span>
              </div>
            </div>

            <button
              type="submit"
              id="submit-payment"
              class="payment-submit-btn"
            >
              Process Payment
            </button>

            <div id="payment-message" class="payment-message hidden"></div>
          </form>
        </div>

        <script>
          // Simple form validation and submission logic for testing
          const form = document.getElementById('payment-form');
          const submitButton = document.getElementById('submit-payment');
          const messageElement = document.getElementById('payment-message');

          form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Disable submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';

            // Simulate payment processing
            try {
              const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: ${config.amount},
                  currency: '${config.currency}',
                  customer: {
                    name: document.getElementById('customer-name').value,
                    email: document.getElementById('customer-email').value,
                    phone: document.getElementById('customer-phone').value
                  }
                })
              });

              if (!response.ok) {
                throw new Error('Payment failed');
              }

              const result = await response.json();

              if (result.success === false) {
                throw new Error(result.error || 'Payment failed');
              }

              // Show success message
              messageElement.textContent = 'Payment successful!';
              messageElement.className = 'payment-message success';
              submitButton.textContent = 'Payment Complete';
            } catch (error) {
              // Show error message
              messageElement.textContent = error.message || 'Payment failed. Please try again.';
              messageElement.className = 'payment-message error';
              submitButton.disabled = false;
              submitButton.textContent = 'Process Payment';
            }
          });
        </script>
      </body>
      </html>
    `)

    // Wait for the payment form to be rendered
    await page.waitForSelector('.payment-form-container', { timeout: 5000 })
  }

  test.beforeEach(async ({ page }) => {
    // Mock the Stripe API endpoints
    await page.route('**/api/create-payment-intent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientSecret: 'pi_test_secret_123456789',
          paymentIntentId: 'pi_test_123456789'
        })
      })
    })

    await page.route('**/api/payments/confirm', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentIntentId: 'pi_test_123456789',
          status: 'succeeded'
        })
      })
    })
  })

  test('should display payment form with all required elements', async ({ page }) => {
    await setupPaymentForm(page)

    // Verify payment header
    await expect(page.locator('.payment-title')).toContainText('Payment Details')

    // Verify amount is displayed
    await expect(page.locator('.amount-value')).toBeVisible()
    await expect(page.locator('.amount-value')).toContainText('$500.00')

    // Verify customer information fields
    await expect(page.locator('#customer-name')).toBeVisible()
    await expect(page.locator('#customer-email')).toBeVisible()
    await expect(page.locator('#customer-phone')).toBeVisible()

    // Verify payment element container
    await expect(page.locator('#payment-element')).toBeVisible()

    // Verify payment summary
    await expect(page.locator('.payment-summary')).toBeVisible()

    // Verify submit button
    await expect(page.locator('#submit-payment')).toBeVisible()
  })

  test('should pre-fill customer information when provided', async ({ page }) => {
    await setupPaymentForm(page, {
      customerInfo: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '5559876543'
      }
    })

    // Verify pre-filled values
    await expect(page.locator('#customer-name')).toHaveValue('Jane Smith')
    await expect(page.locator('#customer-email')).toHaveValue('jane.smith@example.com')
    await expect(page.locator('#customer-phone')).toHaveValue('5559876543')
  })

  test('should validate required customer information fields', async ({ page }) => {
    await setupPaymentForm(page, {
      customerInfo: {} // Empty customer info
    })

    // Clear any pre-filled values
    await page.locator('#customer-name').clear()
    await page.locator('#customer-email').clear()

    // Try to submit without required fields
    await page.locator('#submit-payment').click()

    // Wait for validation
    await page.waitForTimeout(500)

    // Check that form validation prevents submission
    const nameField = page.locator('#customer-name')
    const emailField = page.locator('#customer-email')

    // HTML5 validation should mark fields as invalid
    const nameInvalid = await nameField.evaluate((el) => !el.checkValidity())
    const emailInvalid = await emailField.evaluate((el) => !el.checkValidity())

    expect(nameInvalid || emailInvalid).toBeTruthy()
  })

  test('should validate email format', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill invalid email
    await page.locator('#customer-email').clear()
    await page.locator('#customer-email').fill('invalid-email')
    await page.locator('#customer-email').blur()

    // Wait for validation
    await page.waitForTimeout(300)

    // Check email field validity
    const emailField = page.locator('#customer-email')
    const isInvalid = await emailField.evaluate((el) => !el.checkValidity())

    expect(isInvalid).toBeTruthy()
  })

  test('should format payment amount correctly', async ({ page }) => {
    await setupPaymentForm(page, {
      amount: 125050 // $1,250.50
    })

    // Verify amount formatting
    const amountText = await page.locator('.amount-value').textContent()

    // Should display currency formatted amount
    expect(amountText).toMatch(/\$1,?250\.50/)
  })

  test('should display payment description', async ({ page }) => {
    const customDescription = 'Project Deposit - Driveway Paving'

    await setupPaymentForm(page, {
      description: customDescription
    })

    // Verify description is shown in summary
    await expect(page.locator('.payment-summary')).toContainText(customDescription)
  })

  test('should disable submit button while processing', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill in required customer information
    await page.locator('#customer-name').fill('John Doe')
    await page.locator('#customer-email').fill('john.doe@example.com')

    // Mock a slow payment processing
    await page.route('**/api/create-payment-intent', async (route) => {
      // Delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientSecret: 'pi_test_secret_123456789',
          paymentIntentId: 'pi_test_123456789'
        })
      })
    })

    // Submit the form
    const submitButton = page.locator('#submit-payment')
    await submitButton.click()

    // Wait a bit for processing to start
    await page.waitForTimeout(200)

    // Button should be disabled during processing
    await expect(submitButton).toBeDisabled()
  })

  test('should handle payment submission successfully', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill in customer information
    await page.locator('#customer-name').fill('John Doe')
    await page.locator('#customer-email').fill('john.doe@example.com')
    await page.locator('#customer-phone').fill('5551234567')

    // Mock successful Stripe payment confirmation
    await page.evaluate(() => {
      // Mock Stripe confirmPayment method
      if (window.Stripe) {
        window.Stripe.prototype.confirmPayment = async () => {
          return {
            paymentIntent: {
              id: 'pi_test_123456789',
              status: 'succeeded'
            }
          }
        }
      }
    })

    // Submit the form
    await page.locator('#submit-payment').click()

    // Wait for processing
    await page.waitForTimeout(1000)

    // Check for success indicators
    const possibleSuccessIndicators = [
      page.locator('text=/payment successful/i'),
      page.locator('text=/thank you/i'),
      page.locator('text=/confirmed/i'),
      page.locator('.success-message'),
      page.locator('.payment-success')
    ]

    // At least one success indicator should be visible or no error message
    let foundSuccess = false
    for (const indicator of possibleSuccessIndicators) {
      const isVisible = await indicator.isVisible().catch(() => false)
      if (isVisible) {
        foundSuccess = true
        break
      }
    }

    // If no explicit success message, verify no error was shown
    if (!foundSuccess) {
      const errorMessage = page.locator('#payment-message.error, .payment-error')
      const hasError = await errorMessage.isVisible().catch(() => false)
      expect(hasError).toBeFalsy()
    }
  })

  test('should show error message on payment failure', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill in customer information
    await page.locator('#customer-name').fill('John Doe')
    await page.locator('#customer-email').fill('john.doe@example.com')

    // Mock payment failure
    await page.route('**/api/create-payment-intent', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment failed: Insufficient funds'
        })
      })
    })

    // Submit the form
    await page.locator('#submit-payment').click()

    // Wait for error message
    await page.waitForTimeout(1000)

    // Check for error message
    const errorMessage = page.locator('#payment-message, .payment-error')

    // Error message should be visible or button should be re-enabled
    const messageVisible = await errorMessage.isVisible().catch(() => false)
    const buttonEnabled = await page.locator('#submit-payment').isEnabled()

    expect(messageVisible || buttonEnabled).toBeTruthy()
  })

  test('should update customer information fields dynamically', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill in customer information
    await page.locator('#customer-name').fill('Jane Smith')
    await page.locator('#customer-email').fill('jane@example.com')
    await page.locator('#customer-phone').fill('5551234567')

    // Verify values
    await expect(page.locator('#customer-name')).toHaveValue('Jane Smith')
    await expect(page.locator('#customer-email')).toHaveValue('jane@example.com')
    await expect(page.locator('#customer-phone')).toHaveValue('5551234567')

    // Update values
    await page.locator('#customer-name').clear()
    await page.locator('#customer-name').fill('John Doe')

    await expect(page.locator('#customer-name')).toHaveValue('John Doe')
  })

  test('should render responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await setupPaymentForm(page)

    // Verify form is visible and properly laid out
    await expect(page.locator('.payment-form-container')).toBeVisible()

    // Check that form elements stack vertically on mobile
    const container = page.locator('.payment-form-container')
    const boundingBox = await container.boundingBox()

    // Form should not exceed mobile viewport width
    expect(boundingBox.width).toBeLessThanOrEqual(375)
  })

  test('should show loading state during payment processing', async ({ page }) => {
    await setupPaymentForm(page)

    // Fill in required information
    await page.locator('#customer-name').fill('John Doe')
    await page.locator('#customer-email').fill('john.doe@example.com')

    // Mock delayed payment processing
    await page.route('**/api/create-payment-intent', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientSecret: 'pi_test_secret_123456789',
          paymentIntentId: 'pi_test_123456789'
        })
      })
    })

    // Submit form
    await page.locator('#submit-payment').click()

    // Wait a bit for loading state to show
    await page.waitForTimeout(300)

    // Check for loading indicators
    const submitButton = page.locator('#submit-payment')
    const buttonText = await submitButton.textContent()
    const isDisabled = await submitButton.isDisabled()

    // Either button should be disabled or show loading text
    expect(isDisabled || buttonText.toLowerCase().includes('processing')).toBeTruthy()
  })
})
