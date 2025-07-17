import { chromium } from '@playwright/test';

async function globalSetup() {
  // Launch browser for global setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // You can add global setup steps here
  // For example: authentication, seeding test data, etc.
  
  await browser.close();
}

export default globalSetup;
