#!/usr/bin/env node

/**
 * Verification script for CMS Admin UI
 * Tests: http://localhost:3000/admin/
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotPath = join(__dirname, 'cms-admin-screenshot.png');

async function verifyCMSAdmin() {
  console.log('🚀 Starting CMS Admin UI verification...\n');

  let browser;
  let pass = true;
  const findings = [];

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Collect console messages
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    console.log('📡 Navigating to http://localhost:3000/admin/...');

    // Navigate to admin page
    const response = await page.goto('http://localhost:3000/admin/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response) {
      findings.push('❌ FAIL: No response from server');
      pass = false;
    } else if (!response.ok()) {
      findings.push(`❌ FAIL: HTTP ${response.status()} ${response.statusText()}`);
      pass = false;
    } else {
      findings.push(`✅ Page loaded: HTTP ${response.status()}`);
    }

    // Wait for CMS to initialize
    console.log('⏳ Waiting for CMS to initialize...');
    await page.waitForTimeout(3000);

    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    if (title.includes('Content Manager')) {
      findings.push('✅ Page title correct: "' + title + '"');
    } else {
      findings.push('⚠️  Page title unexpected: "' + title + '" (expected to contain "Content Manager")');
    }

    // Check for CMS UI elements
    console.log('🔍 Checking for CMS UI elements...');

    // Look for Decap CMS root element or login screen
    const cmsRoot = await page.locator('[data-slate-editor], [class*="cms"], .nc-app-container, button:has-text("Login")').first().count();

    if (cmsRoot > 0) {
      findings.push('✅ CMS UI elements detected');
    } else {
      findings.push('⚠️  No obvious CMS UI elements found (may require authentication)');
    }

    // Check for collection references in the page
    console.log('🔍 Checking for collection configuration...');
    const pageContent = await page.content();

    // Decap CMS loads config.yml, check if it's being loaded
    const hasConfigReference = pageContent.includes('config.yml') ||
                                consoleMessages.some(m => m.text.includes('config.yml'));

    if (hasConfigReference) {
      findings.push('✅ CMS config reference found');
    }

    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    findings.push(`📸 Screenshot saved: ${screenshotPath}`);

    // Check console errors
    console.log('\n📊 Console Analysis:');
    console.log(`   Total messages: ${consoleMessages.length}`);
    console.log(`   Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      findings.push('⚠️  Console errors detected:');
      consoleErrors.forEach(err => {
        findings.push(`   - ${err}`);
      });
    } else {
      findings.push('✅ No console errors');
    }

    // Check page errors
    if (pageErrors.length > 0) {
      findings.push('❌ FAIL: Page JavaScript errors:');
      pageErrors.forEach(err => {
        findings.push(`   - ${err}`);
      });
      pass = false;
    } else {
      findings.push('✅ No page JavaScript errors');
    }

    // Print some console messages for debugging
    if (consoleMessages.length > 0) {
      console.log('\n📝 Sample console messages:');
      consoleMessages.slice(0, 10).forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    }

  } catch (error) {
    findings.push(`❌ FAIL: ${error.message}`);
    pass = false;
    console.error('\n❌ Error during verification:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION REPORT: CMS Admin UI');
  console.log('='.repeat(60));
  console.log('\nFindings:');
  findings.forEach(f => console.log(f));
  console.log('\n' + '='.repeat(60));
  console.log(`Verdict: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60) + '\n');

  return pass ? 0 : 1;
}

// Run verification
verifyCMSAdmin()
  .then(code => process.exit(code))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
