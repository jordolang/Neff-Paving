import { test, expect } from '@playwright/test';

test.describe('Estimate Form Demo Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo estimate form page
    await page.goto('/estimate-form-demo.html');
    
    // Wait for the form component to load
    await page.waitForSelector('#estimate-form-container');
    await page.waitForTimeout(2000); // Wait for component initialization
  });

  test('should display the demo form with all required elements', async ({ page }) => {
    // Check that main elements are present
    await expect(page.locator('#estimate-form-container')).toBeVisible();
    await expect(page.locator('.demo-controls')).toBeVisible();
    
    // Wait for form to be rendered
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Check that form elements are present
    await expect(page.locator('#estimate-form')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#serviceType')).toBeVisible();
    
    // Check that submit button is initially disabled
    await expect(page.locator('#submit-estimate')).toBeDisabled();
    await expect(page.locator('#get-quote')).toBeDisabled();
  });

  test('should enable quote button when measurement data is available', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Use demo controls to add measurement data
    await page.click('button:has-text("Add Measurement Data")');
    
    // Wait for page to reload and form to reinitialize
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Check that measurement data is displayed
    await expect(page.locator('.measurement-success')).toBeVisible();
    
    // Check that get quote button is enabled
    await expect(page.locator('#get-quote')).toBeEnabled();
  });

  test('should fill sample data and enable form submission', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Fill sample data using demo controls
    await page.click('button:has-text("Fill Sample Data")');
    
    // Wait for fields to be filled
    await page.waitForTimeout(500);
    
    // Check that fields are filled
    await expect(page.locator('#firstName')).toHaveValue('John');
    await expect(page.locator('#lastName')).toHaveValue('Smith');
    await expect(page.locator('#email')).toHaveValue('john.smith@email.com');
    await expect(page.locator('#phone')).toHaveValue('(614) 555-0123');
    await expect(page.locator('#serviceType')).toHaveValue('residential');
    
    // Add measurement data
    await page.click('button:has-text("Add Measurement Data")');
    
    // Wait for page to reload
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill sample data again after reload
    await page.click('button:has-text("Fill Sample Data")');
    await page.waitForTimeout(500);
    
    // Check that submit button is enabled
    await expect(page.locator('#submit-estimate')).toBeEnabled();
  });

  test('should handle get quote functionality', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Add measurement data first
    await page.click('button:has-text("Add Measurement Data")');
    
    // Wait for page to reload
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Click get quote button
    await page.click('#get-quote');
    
    // Wait for pricing display to appear
    await page.waitForSelector('#pricing-display', { state: 'visible', timeout: 10000 });
    
    // Check that pricing information is displayed
    await expect(page.locator('#pricing-display')).toBeVisible();
    await expect(page.locator('.material-pricing')).toBeVisible();
    await expect(page.locator('.pricing-factors')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Fill sample data and add measurement data
    await page.click('button:has-text("Fill Sample Data")');
    await page.click('button:has-text("Add Measurement Data")');
    
    // Wait for page to reload
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill sample data again
    await page.click('button:has-text("Fill Sample Data")');
    await page.waitForTimeout(500);
    
    // Submit the form
    await page.click('#submit-estimate');
    
    // Wait for success message
    await page.waitForSelector('.success-message', { timeout: 15000 });
    
    // Check that success message is displayed
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Successfully');
  });

  test('should handle form validation', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Try to submit form without filling required fields
    await page.click('#submit-estimate');
    
    // Check that submit button remains disabled
    await expect(page.locator('#submit-estimate')).toBeDisabled();
    
    // Fill only some fields
    await page.fill('#firstName', 'John');
    await page.fill('#email', 'invalid-email');
    
    // Check that form validation shows errors
    await page.waitForTimeout(500);
    
    // Fix email and continue
    await page.fill('#email', 'john@example.com');
    await page.fill('#lastName', 'Doe');
    await page.fill('#phone', '(555) 123-4567');
    await page.selectOption('#serviceType', 'residential');
    await page.fill('#streetAddress', '123 Main St');
    await page.fill('#city', 'Columbus');
    await page.selectOption('#state', 'OH');
    await page.fill('#zipCode', '43215');
    
    // Add measurement data
    await page.click('button:has-text("Add Measurement Data")');
    
    // Wait for page to reload
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Fill fields again
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#phone', '(555) 123-4567');
    await page.selectOption('#serviceType', 'residential');
    await page.fill('#streetAddress', '123 Main St');
    await page.fill('#city', 'Columbus');
    await page.selectOption('#state', 'OH');
    await page.fill('#zipCode', '43215');
    
    // Wait for validation to complete
    await page.waitForTimeout(500);
    
    // Check that submit button is now enabled
    await expect(page.locator('#submit-estimate')).toBeEnabled();
  });

  test('should handle measurement tool switching', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Check that measurement tool toggles are present
    await expect(page.locator('#arcgis-toggle')).toBeVisible();
    await expect(page.locator('#google-maps-toggle')).toBeVisible();
    
    // ArcGIS should be active by default
    await expect(page.locator('#arcgis-toggle')).toHaveClass(/active/);
    await expect(page.locator('#arcgis-container')).toBeVisible();
    await expect(page.locator('#google-maps-container')).toBeHidden();
    
    // Switch to Google Maps
    await page.click('#google-maps-toggle');
    
    // Check that Google Maps is now active
    await expect(page.locator('#google-maps-toggle')).toHaveClass(/active/);
    await expect(page.locator('#arcgis-container')).toBeHidden();
    await expect(page.locator('#google-maps-container')).toBeVisible();
    
    // Switch back to ArcGIS
    await page.click('#arcgis-toggle');
    
    // Check that ArcGIS is active again
    await expect(page.locator('#arcgis-toggle')).toHaveClass(/active/);
    await expect(page.locator('#arcgis-container')).toBeVisible();
    await expect(page.locator('#google-maps-container')).toBeHidden();
  });

  test('should clear form data correctly', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Fill sample data
    await page.click('button:has-text("Fill Sample Data")');
    await page.waitForTimeout(500);
    
    // Check that fields are filled
    await expect(page.locator('#firstName')).toHaveValue('John');
    await expect(page.locator('#email')).toHaveValue('john.smith@email.com');
    
    // Clear form using demo controls
    await page.click('button:has-text("Clear Form")');
    
    // Check that fields are cleared
    await expect(page.locator('#firstName')).toHaveValue('');
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#serviceType')).toHaveValue('');
    
    // Check that submit button is disabled again
    await expect(page.locator('#submit-estimate')).toBeDisabled();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Demo controls should be hidden on mobile
    await expect(page.locator('.demo-controls')).toBeHidden();
    
    // Check that form is responsive
    await expect(page.locator('#estimate-form')).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    
    // Check that measurement tools are responsive
    await expect(page.locator('#arcgis-toggle')).toBeVisible();
    await expect(page.locator('#google-maps-toggle')).toBeVisible();
    
    // Test form interaction on mobile
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#phone', '(555) 123-4567');
    
    // Check that fields work on mobile
    await expect(page.locator('#firstName')).toHaveValue('John');
    await expect(page.locator('#email')).toHaveValue('john@example.com');
  });

  test('should handle ArcGIS measurement tool loading', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('#estimate-form', { timeout: 10000 });
    
    // Check that ArcGIS container is visible
    await expect(page.locator('#arcgis-container')).toBeVisible();
    
    // Check that placeholder is shown initially
    await expect(page.locator('#arcgis-placeholder')).toBeVisible();
    
    // Wait for ArcGIS to potentially load (or timeout)
    await page.waitForTimeout(5000);
    
    // Check that ArcGIS scene view container is present
    await expect(page.locator('#arcgis-scene-view')).toBeVisible();
  });
});

// Helper function to wait for component initialization
async function waitForComponentLoad(page) {
  await page.waitForSelector('#estimate-form', { timeout: 10000 });
  await page.waitForTimeout(1000); // Additional wait for component initialization
}
