import { test, expect } from '@playwright/test'

/**
 * E2E tests for the estimate request flow.
 *
 * These tests run against the real estimate-form.html page served by the Vite
 * dev server (see playwright.config.js webServer). The page has two parts:
 *   1. An optional satellite map where the visitor outlines their project area
 *      (no measurements or pricing are ever displayed — the outline is carried
 *      on a hidden field for the estimators).
 *   2. A "Request Your Free Estimate" form that emails the request via FormSubmit.
 *
 * Network calls (FormSubmit, the keyless map geocoder/tiles) are mocked so the
 * tests are deterministic and offline-safe.
 */

test.describe('Estimate Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Block all third-party requests (Leaflet CDN, satellite map tiles,
    // geocoder, fonts, analytics). They are irrelevant to the form behaviour,
    // and the blocking <script> tags would otherwise stall page load and make
    // the suite depend on external CDNs being reachable. Aborting a blocking
    // script lets the browser continue parsing immediately.
    // Test-level routes (e.g. the FormSubmit mock) are registered later and take
    // precedence over this catch-all.
    await page.route('**/*', (route) => {
      const { hostname } = new URL(route.request().url())
      if (hostname === 'localhost' || hostname === '127.0.0.1') return route.continue()
      return route.abort()
    })

    // domcontentloaded is enough: the inline form script runs at parse time,
    // so we don't need to wait for the (blocked) map assets.
    await page.goto('/estimate-form.html', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#estimate-form')
  })

  test('should display the estimate form with all required fields', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Request an Estimate' })
    ).toBeVisible()

    // Request form fields
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#phone')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#project-type')).toBeVisible()
    await expect(page.locator('#address')).toBeVisible()
    await expect(page.locator('#notes')).toBeVisible()

    // Submit button with the real label
    await expect(page.locator('#submit-btn')).toBeVisible()
    await expect(page.locator('#submit-btn')).toContainText('Request Free Estimate')
  })

  test('should explain that online estimates are preliminary', async ({ page }) => {
    const explainer = page.locator('.estimate-explainer')
    await expect(explainer).toBeVisible()
    await expect(explainer).toContainText('Online estimates are preliminary')
    await expect(explainer).toContainText('aerial imagery')
    await expect(explainer).toContainText('on-site visit')
  })

  test('should not expose pricing or measurements anywhere on the page', async ({ page }) => {
    const body = await page.locator('body').innerText()
    // No dollar figures, per-square-foot rates, or displayed measurements.
    expect(body).not.toMatch(/\$\s?\d/)
    expect(body).not.toMatch(/per sq\s?\.?\s?ft/i)
    expect(body).not.toMatch(/\d[\d,]*\s*sq\s?\.?\s?ft/i)
    // The internal area field exists but starts empty.
    await expect(page.locator('#hidden-area')).toHaveValue('')
  })

  test('should list all project type options', async ({ page }) => {
    const options = page.locator('#project-type option')
    await expect(options).toHaveCount(6)
    await expect(page.locator('#project-type')).toContainText('Driveway')
    await expect(page.locator('#project-type')).toContainText('Parking Lot')
    await expect(page.locator('#project-type')).toContainText('Other')
  })

  test('should show a validation message when required fields are empty', async ({ page }) => {
    // novalidate is set on the form, so the page's own JS handles validation.
    await page.locator('#submit-btn').click()

    await expect(page.locator('#form-status')).toContainText(
      'Please fill in your name, phone, and email.'
    )
    // Submission was prevented — still on the same page.
    await expect(page).toHaveURL(/estimate-form\.html/)
  })

  test('should successfully submit the estimate request', async ({ page }) => {
    // Mock the FormSubmit AJAX endpoint with a success response.
    await page.route('**/formsubmit.co/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'The form was submitted successfully.' })
      })
    )

    await page.locator('#name').fill('Jane Customer')
    await page.locator('#phone').fill('740-555-0100')
    await page.locator('#email').fill('jane@example.com')
    await page.locator('#project-type').selectOption('Driveway')

    await page.locator('#submit-btn').click()

    // Success status message is shown and the form is reset.
    await expect(page.locator('#form-status')).toContainText('Thank you')
    await expect(page.locator('#form-status')).toHaveClass(/ok/)
    await expect(page.locator('#name')).toHaveValue('')
  })

  test('should show an error message when submission fails', async ({ page }) => {
    // FormSubmit reachable but reports failure.
    await page.route('**/formsubmit.co/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false })
      })
    )

    await page.locator('#name').fill('Jane Customer')
    await page.locator('#phone').fill('740-555-0100')
    await page.locator('#email').fill('jane@example.com')

    await page.locator('#submit-btn').click()

    await expect(page.locator('#form-status')).toHaveClass(/err/)
    await expect(page.locator('#form-status')).toContainText('couldn\'t send')
  })

  test('should display the satellite outline map section', async ({ page }) => {
    await expect(page.locator('#map')).toBeVisible()
    await expect(page.locator('#map-search-input')).toBeVisible()
    await expect(page.locator('#draw-rect')).toBeVisible()
    await expect(page.locator('#draw-poly')).toBeVisible()
    // The outline readout confirms capture without numbers.
    await expect(page.locator('#map-area-status')).toContainText('optional')
  })

  test('should re-enable the submit button after a network error', async ({ page }) => {
    // FormSubmit unreachable — the page should recover and re-enable the button.
    await page.route('**/formsubmit.co/**', (route) => route.abort())

    await page.locator('#name').fill('Jane Customer')
    await page.locator('#phone').fill('740-555-0100')
    await page.locator('#email').fill('jane@example.com')

    await page.locator('#submit-btn').click()

    await expect(page.locator('#form-status')).toHaveClass(/err/)
    await expect(page.locator('#submit-btn')).toBeEnabled()
    await expect(page.locator('#submit-btn')).toContainText('Request Free Estimate')
  })

  test('should navigate to the estimate form from the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Click the first visible link that points at the estimate form.
    const links = page.locator('a[href*="estimate-form.html"]')
    const count = await links.count()
    let clicked = false
    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      if (await link.isVisible()) {
        await link.click()
        clicked = true
        break
      }
    }
    expect(clicked).toBeTruthy()
    await expect(page).toHaveURL(/estimate-form\.html/)
    await expect(page.locator('#estimate-form')).toBeVisible()
  })
})
