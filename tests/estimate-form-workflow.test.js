import { test, expect } from '@playwright/test';

test.describe('Estimate Form Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the estimate form page
    await page.goto('/estimate-form.html');
    
    // Wait for the form to load
    await page.waitForSelector('#estimate-form');
  });

  test('should display the estimate form with all required elements', async ({ page }) => {
    // Check that all main sections are present
    await expect(page.locator('#estimate-form')).toBeVisible();
    await expect(page.locator('#confirm-pricing-button')).toBeVisible();
    await expect(page.locator('#book-now-button')).toBeVisible();
    await expect(page.locator('#pricing-display')).toBeHidden();
    
    // Check that confirm pricing button is initially disabled
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    
    // Check that book now button is initially disabled
    await expect(page.locator('#book-now-button')).toBeDisabled();
  });

  test('should enable confirm pricing button when all required fields are filled and boundary is drawn', async ({ page }) => {
    // Fill out required personal information
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#phone', '(555) 123-4567');
    
    // Fill out project details
    await page.selectOption('#service-type', 'residential');
    await page.fill('#description', 'Need new driveway installation');
    
    // Fill out address information
    await page.fill('#address', '123 Main Street');
    await page.fill('#city', 'Columbus');
    await page.fill('#state', 'OH');
    await page.fill('#zip', '43215');
    
    // Simulate boundary drawing by setting hidden fields
    await page.evaluate(() => {
      document.getElementById('area-coordinates').value = JSON.stringify([
        { lat: 40.0583, lng: -82.4009 },
        { lat: 40.0585, lng: -82.4007 },
        { lat: 40.0582, lng: -82.4005 },
        { lat: 40.0580, lng: -82.4007 }
      ]);
      document.getElementById('square-footage').value = '1500';
      
      // Trigger change events to update button state
      document.getElementById('area-coordinates').dispatchEvent(new Event('change'));
      document.getElementById('square-footage').dispatchEvent(new Event('change'));
    });
    
    // Wait for button state to update
    await page.waitForTimeout(500);
    
    // Check that confirm pricing button is now enabled
    await expect(page.locator('#confirm-pricing-button')).toBeEnabled();
  });

  test('should display pricing information when confirm pricing is clicked', async ({ page }) => {
    // Fill out all required fields
    await fillRequiredFields(page);
    
    // Simulate boundary measurement
    await simulateBoundaryMeasurement(page);
    
    // Click confirm pricing button
    await page.click('#confirm-pricing-button');
    
    // Wait for pricing display to appear
    await page.waitForSelector('#pricing-display', { state: 'visible' });
    
    // Check that pricing information is displayed
    await expect(page.locator('#pricing-display')).toBeVisible();
    await expect(page.locator('#pricing-area')).toContainText('1,500');
    await expect(page.locator('#pricing-total')).toContainText('$');
    
    // Check that confirm pricing button is disabled after confirmation
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    
    // Check that book now button is enabled
    await expect(page.locator('#book-now-button')).toBeEnabled();
  });

  test('should submit form when book now button is clicked', async ({ page }) => {
    // Fill out all required fields
    await fillRequiredFields(page);
    
    // Simulate boundary measurement
    await simulateBoundaryMeasurement(page);
    
    // Click confirm pricing button
    await page.click('#confirm-pricing-button');
    
    // Wait for pricing display and book now button to be enabled
    await page.waitForSelector('#pricing-display', { state: 'visible' });
    await expect(page.locator('#book-now-button')).toBeEnabled();
    
    // Listen for form submission
    let formSubmitted = false;
    await page.evaluate(() => {
      document.getElementById('estimate-form').addEventListener('submit', (e) => {
        e.preventDefault();
        window.formSubmitted = true;
      });
    });
    
    // Click book now button
    await page.click('#book-now-button');
    
    // Check that form was submitted
    const submitted = await page.evaluate(() => window.formSubmitted);
    expect(submitted).toBe(true);
  });

  test('should handle missing required fields properly', async ({ page }) => {
    // Fill only some fields
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john.doe@example.com');
    // Leave phone empty
    
    // Simulate boundary measurement
    await simulateBoundaryMeasurement(page);
    
    // Check that confirm pricing button remains disabled
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    
    // Fill remaining required fields
    await page.fill('#phone', '(555) 123-4567');
    await page.selectOption('#service-type', 'residential');
    await page.fill('#address', '123 Main Street');
    await page.fill('#city', 'Columbus');
    await page.fill('#state', 'OH');
    await page.fill('#zip', '43215');
    
    // Wait for button state to update
    await page.waitForTimeout(500);
    
    // Now button should be enabled
    await expect(page.locator('#confirm-pricing-button')).toBeEnabled();
  });

  test('should handle changing boundary after confirming pricing', async ({ page }) => {
    // Fill out all required fields
    await fillRequiredFields(page);
    
    // Simulate boundary measurement
    await simulateBoundaryMeasurement(page);
    
    // Click confirm pricing button
    await page.click('#confirm-pricing-button');
    
    // Wait for pricing display
    await page.waitForSelector('#pricing-display', { state: 'visible' });
    
    // Check that book now button is enabled
    await expect(page.locator('#book-now-button')).toBeEnabled();
    
    // Simulate changing the boundary (clearing and redrawing)
    await page.evaluate(() => {
      document.getElementById('area-coordinates').value = '';
      document.getElementById('square-footage').value = '';
      
      // Trigger change events
      document.getElementById('area-coordinates').dispatchEvent(new Event('change'));
      document.getElementById('square-footage').dispatchEvent(new Event('change'));
    });
    
    // Wait for button state to update
    await page.waitForTimeout(500);
    
    // Both buttons should be disabled until boundary is redrawn and pricing reconfirmed
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    await expect(page.locator('#book-now-button')).toBeDisabled();
    
    // Redraw boundary with different measurements
    await page.evaluate(() => {
      document.getElementById('area-coordinates').value = JSON.stringify([
        { lat: 40.0583, lng: -82.4009 },
        { lat: 40.0585, lng: -82.4007 },
        { lat: 40.0582, lng: -82.4005 }
      ]);
      document.getElementById('square-footage').value = '2000';
      
      // Trigger change events
      document.getElementById('area-coordinates').dispatchEvent(new Event('change'));
      document.getElementById('square-footage').dispatchEvent(new Event('change'));
    });
    
    // Wait for button state to update
    await page.waitForTimeout(500);
    
    // Confirm pricing button should be enabled again
    await expect(page.locator('#confirm-pricing-button')).toBeEnabled();
    
    // Book now button should remain disabled until pricing is reconfirmed
    await expect(page.locator('#book-now-button')).toBeDisabled();
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile drawing help is visible
    await expect(page.locator('#mobile-drawing-help')).toBeVisible();
    
    // Fill out form on mobile
    await fillRequiredFields(page);
    
    // Simulate boundary measurement on mobile
    await simulateBoundaryMeasurement(page);
    
    // Check that buttons are responsive
    await expect(page.locator('#confirm-pricing-button')).toBeEnabled();
    
    // Click confirm pricing
    await page.click('#confirm-pricing-button');
    
    // Wait for pricing display
    await page.waitForSelector('#pricing-display', { state: 'visible' });
    
    // Check that book now button is visible and enabled
    await expect(page.locator('#book-now-button')).toBeVisible();
    await expect(page.locator('#book-now-button')).toBeEnabled();
    
    // Check that pricing display is properly formatted for mobile
    await expect(page.locator('#pricing-display')).toBeVisible();
  });

  test('should validate form data before submission', async ({ page }) => {
    // Fill out required fields but with invalid data
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'invalid-email'); // Invalid email
    await page.fill('#phone', '123'); // Invalid phone
    await page.selectOption('#service-type', 'residential');
    await page.fill('#address', '123 Main Street');
    await page.fill('#city', 'Columbus');
    await page.fill('#state', 'OH');
    await page.fill('#zip', '12345');
    
    // Simulate boundary measurement
    await simulateBoundaryMeasurement(page);
    
    // Button should not be enabled with invalid data
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    
    // Fix the email
    await page.fill('#email', 'john.doe@example.com');
    
    // Button should still be disabled due to invalid phone
    await expect(page.locator('#confirm-pricing-button')).toBeDisabled();
    
    // Fix the phone
    await page.fill('#phone', '(555) 123-4567');
    
    // Wait for validation to complete
    await page.waitForTimeout(500);
    
    // Now button should be enabled
    await expect(page.locator('#confirm-pricing-button')).toBeEnabled();
  });

  test('should handle boundary drawing tool interactions', async ({ page }) => {
    // Check that drawing tools are present
    await expect(page.locator('#polygon-tool')).toBeVisible();
    await expect(page.locator('#edit-tool')).toBeVisible();
    await expect(page.locator('#clear-tool')).toBeVisible();
    
    // Edit tool should be initially disabled
    await expect(page.locator('#edit-tool')).toBeDisabled();
    
    // Click polygon tool
    await page.click('#polygon-tool');
    
    // Check that polygon tool is active
    await expect(page.locator('#polygon-tool')).toHaveClass(/active/);
    
    // Simulate drawing a boundary
    await simulateBoundaryMeasurement(page);
    
    // Edit tool should now be enabled
    await expect(page.locator('#edit-tool')).toBeEnabled();
    
    // Test clear functionality
    await page.click('#clear-tool');
    
    // Check that measurement results are hidden
    await expect(page.locator('#measurement-results')).toBeHidden();
    
    // Edit tool should be disabled again
    await expect(page.locator('#edit-tool')).toBeDisabled();
  });
});

// Helper functions
async function fillRequiredFields(page) {
  await page.fill('#name', 'John Doe');
  await page.fill('#email', 'john.doe@example.com');
  await page.fill('#phone', '(555) 123-4567');
  await page.selectOption('#service-type', 'residential');
  await page.fill('#description', 'Need new driveway installation');
  await page.fill('#address', '123 Main Street');
  await page.fill('#city', 'Columbus');
  await page.fill('#state', 'OH');
  await page.fill('#zip', '43215');
}

async function simulateBoundaryMeasurement(page) {
  await page.evaluate(() => {
    // Simulate boundary drawing by setting hidden fields and triggering UI updates
    document.getElementById('area-coordinates').value = JSON.stringify([
      { lat: 40.0583, lng: -82.4009 },
      { lat: 40.0585, lng: -82.4007 },
      { lat: 40.0582, lng: -82.4005 },
      { lat: 40.0580, lng: -82.4007 }
    ]);
    document.getElementById('square-footage').value = '1500';
    
    // Trigger change events
    document.getElementById('area-coordinates').dispatchEvent(new Event('change'));
    document.getElementById('square-footage').dispatchEvent(new Event('change'));
    
    // Simulate boundary confirmation
    if (typeof window.updateBoundaryData === 'function') {
      window.updateBoundaryData({
        coordinates: [
          { lat: 40.0583, lng: -82.4009 },
          { lat: 40.0585, lng: -82.4007 },
          { lat: 40.0582, lng: -82.4005 },
          { lat: 40.0580, lng: -82.4007 }
        ],
        area: 1500,
        perimeter: 200,
        address: '123 Main Street, Columbus, OH'
      });
    }
  });
}
