/**
 * Deployment Platform Tests
 * Tests for deployment readiness, asset loading, routing, and component rendering
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AssetTestHelper,
  RoutingTestHelper,
  AdminTestHelper,
  ServicesTestHelper,
  PerformanceTestHelper,
  DeploymentTestRunner
} from './utils/deployment-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock fetch for asset loading tests
global.fetch = jest.fn();

// Setup DOM environment
let dom;
let document;
let window;

// Initialize test helpers
let assetHelper;
let routingHelper;
let adminHelper;
let servicesHelper;
let performanceHelper;
let deploymentRunner;

beforeEach(() => {
  // Reset fetch mock
  fetch.mockClear();
  
  // Create a fresh DOM for each test
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
  const adminHtml = fs.readFileSync(path.join(__dirname, '../admin/index.html'), 'utf-8');
  
  dom = new JSDOM(indexHtml, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });
  
  document = dom.window.document;
  window = dom.window;
  
  // Set up global DOM objects
  global.document = document;
  global.window = window;
  global.navigator = window.navigator;
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  
  // Initialize helpers
  assetHelper = new AssetTestHelper();
  routingHelper = new RoutingTestHelper();
  adminHelper = new AdminTestHelper();
  servicesHelper = new ServicesTestHelper();
  performanceHelper = new PerformanceTestHelper();
  deploymentRunner = new DeploymentTestRunner();
});

afterEach(() => {
  dom.window.close();
});

describe('Deployment Tests', () => {
  test('Services section renders correctly', async () => {
    // Use the services helper for comprehensive testing
    const servicesResults = servicesHelper.testServicesSection(document);
    
    expect(servicesResults.sectionExists).toBe(true);
    expect(servicesResults.hasTitle).toBe(true);
    expect(servicesResults.categories).toContain('asphalt');
    expect(servicesResults.categories).toContain('concrete');
    expect(servicesResults.serviceCards).toBeGreaterThan(0);
    expect(servicesResults.hasPricing).toBe(true);
    expect(servicesResults.hasContactIntegration).toBe(true);
    
    // Test service content quality
    const contentResults = servicesHelper.testServiceContent(document);
    expect(contentResults.hasDescriptions).toBe(true);
    expect(contentResults.hasFeatures).toBe(true);
    expect(contentResults.hasCallToActions).toBe(true);
    expect(contentResults.wordCount).toBeGreaterThan(100);
  });
  
  test('Admin panel is accessible', async () => {
    // Use admin helper for comprehensive testing
    const adminAccessResults = adminHelper.testAdminAccess(document);
    
    expect(adminAccessResults.hasAdminLink).toBe(true);
    expect(adminAccessResults.linkTarget).toBe('/admin');
    expect(adminAccessResults.hasTooltip).toBe(true);
    expect(adminAccessResults.hasAriaLabel).toBe(true);
    expect(adminAccessResults.hasAccessibilityAttributes).toBe(true);
    
    // Test admin panel structure
    const adminPath = path.join(__dirname, '../admin/index.html');
    const adminResults = adminHelper.testAdminPanel(adminPath);
    
    expect(adminResults.hasLoginScreen).toBe(true);
    expect(adminResults.hasDashboard).toBe(true);
    expect(adminResults.hasNavigation).toBe(true);
    expect(adminResults.sections.length).toBeGreaterThan(0);
    expect(adminResults.hasBootstrap).toBe(true);
    expect(adminResults.hasResponsive).toBe(true);
  });
});

describe('Comprehensive Deployment Tests', () => {
  test('Run complete deployment verification', async () => {
    // Run full deployment test suite
    const projectRoot = path.join(__dirname, '..');
    const results = await deploymentRunner.runDeploymentTests(projectRoot);
    
    console.log('\n=== Deployment Test Results ===' );
    console.log('Timestamp:', results.timestamp);
    console.log('Overall Results:', results.overall);
    
    // Asset loading checks
    expect(results.assets.css.found).toBe(true);
    expect(results.assets.js.found).toBe(true);
    expect(results.assets.fonts.found).toBe(true);
    expect(results.assets.images.found).toBe(true);
    
    // Routing checks
    expect(results.routing.navExists).toBe(true);
    expect(results.routing.anchors.length).toBeGreaterThan(0);
    
    // Admin panel checks
    expect(results.admin.hasLoginScreen).toBe(true);
    expect(results.admin.hasDashboard).toBe(true);
    expect(results.admin.hasNavigation).toBe(true);
    expect(results.admin.hasBootstrap).toBe(true);
    
    // Services section checks
    expect(results.services.sectionExists).toBe(true);
    expect(results.services.hasTitle).toBe(true);
    expect(results.services.serviceCards).toBeGreaterThan(0);
    expect(results.services.hasPricing).toBe(true);
    
    // Performance checks
    expect(results.performance.hasPreconnect).toBe(true);
    expect(results.performance.hasPreload).toBe(true);
    expect(results.performance.imageOptimization.withAlt).toBeGreaterThan(0);
    
    // SEO checks
    expect(results.seo.hasTitle).toBe(true);
    expect(results.seo.hasDescription).toBe(true);
    expect(results.seo.hasStructuredData).toBe(true);
    expect(results.seo.hasCanonical).toBe(true);
    
    // Overall deployment readiness
    expect(results.overall.passed).toBeGreaterThan(results.overall.failed);
  });
});

describe('Automated Checks', () => {
  describe('Asset Loading', () => {
    test('Critical assets are properly configured', () => {
      const assetResults = assetHelper.testCriticalAssets(document);
      
      expect(assetResults.css.found).toBe(true);
      expect(assetResults.css.links.length).toBeGreaterThan(0);
      expect(assetResults.js.found).toBe(true);
      expect(assetResults.fonts.found).toBe(true);
      expect(assetResults.images.found).toBe(true);
      
      // Verify main CSS exists
      expect(assetResults.css.links.some(link => link.includes('/styles/main.css'))).toBe(true);
    });
    
    test('Asset loading functionality works', async () => {
      const testAssets = [
        '/assets/images/test.jpg',
        '/styles/main.css',
        '/src/main.js'
      ];
      
      const loadingResults = await assetHelper.testAssetLoading(testAssets);
      
      expect(loadingResults.length).toBe(testAssets.length);
      expect(loadingResults.every(result => result.success)).toBe(true);
    });
    
    test('Performance optimizations are in place', () => {
      const perfResults = performanceHelper.testPerformance(document);
      
      expect(perfResults.hasPreconnect).toBe(true);
      expect(perfResults.hasPreload).toBe(true);
      expect(perfResults.hasFontDisplay).toBe(true);
      expect(perfResults.imageOptimization.withAlt).toBeGreaterThan(0);
    });
  });
  
  describe('Routing Functionality', () => {
    test('Navigation structure is properly configured', () => {
      const routingResults = routingHelper.testNavigation(document);
      
      expect(routingResults.navExists).toBe(true);
      expect(routingResults.links.length).toBeGreaterThan(0);
      expect(routingResults.anchors.length).toBeGreaterThan(0);
      
      // Check for key navigation items
      const hasHomeLink = routingResults.anchors.some(link => link.href === '#home');
      const hasServicesLink = routingResults.anchors.some(link => link.href === '#services');
      const hasGalleryLink = routingResults.anchors.some(link => link.href === '#gallery');
      const hasContactLink = routingResults.anchors.some(link => link.href === '#contact');
      
      expect(hasHomeLink).toBe(true);
      expect(hasServicesLink).toBe(true);
      expect(hasGalleryLink).toBe(true);
      expect(hasContactLink).toBe(true);
    });
    
    test('Services page routing is configured', () => {
      const servicesPath = path.join(__dirname, '../services/index.html');
      const routeResults = routingHelper.testRouteConfig(servicesPath);
      
      expect(routeResults.hasRedirect).toBe(true);
      expect(routeResults.redirectTarget).toBe('/#services');
      expect(routeResults.hasCanonical).toBe(true);
    });
    
    test('SEO and metadata are properly configured', () => {
      const seoResults = performanceHelper.testSEO(document);
      
      expect(seoResults.hasTitle).toBe(true);
      expect(seoResults.hasDescription).toBe(true);
      expect(seoResults.hasCanonical).toBe(true);
      expect(seoResults.hasOpenGraph).toBe(true);
      expect(seoResults.hasTwitterCard).toBe(true);
      expect(seoResults.hasStructuredData).toBe(true);
    });
  });
  
  describe('Admin Panel Access', () => {
    test('Admin authentication handling is implemented', () => {
      // Check if admin authentication script exists
      const adminScript = document.querySelector('script');
      const htmlContent = document.documentElement.innerHTML;
      
      expect(htmlContent).toContain('neffPavingAdminAuth');
      expect(htmlContent).toContain('admin-link');
    });
    
    test('Admin panel has proper structure', () => {
      const adminHtml = fs.readFileSync(path.join(__dirname, '../admin/index.html'), 'utf-8');
      const adminDom = new JSDOM(adminHtml);
      const adminDoc = adminDom.window.document;
      
      // Check for login screen
      const loginScreen = adminDoc.querySelector('#login-screen');
      expect(loginScreen).toBeTruthy();
      
      // Check for dashboard
      const dashboard = adminDoc.querySelector('#admin-dashboard');
      expect(dashboard).toBeTruthy();
      
      // Check for navigation
      const sidebar = adminDoc.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
      
      // Check for main sections
      const sections = adminDoc.querySelectorAll('.content-section');
      expect(sections.length).toBeGreaterThan(0);
      
      adminDom.window.close();
    });
    
    test('Admin panel navigation is functional', () => {
      const adminHtml = fs.readFileSync(path.join(__dirname, '../admin/index.html'), 'utf-8');
      const adminDom = new JSDOM(adminHtml);
      const adminDoc = adminDom.window.document;
      
      // Check navigation links
      const navLinks = adminDoc.querySelectorAll('.nav-link[data-section]');
      expect(navLinks.length).toBeGreaterThan(0);
      
      // Verify specific sections exist
      const dashboardSection = adminDoc.querySelector('#dashboard-section');
      const estimatesSection = adminDoc.querySelector('#estimates-section');
      const jobsSection = adminDoc.querySelector('#jobs-section');
      const customersSection = adminDoc.querySelector('#customers-section');
      const mapsSection = adminDoc.querySelector('#maps-section');
      
      expect(dashboardSection).toBeTruthy();
      expect(estimatesSection).toBeTruthy();
      expect(jobsSection).toBeTruthy();
      expect(customersSection).toBeTruthy();
      expect(mapsSection).toBeTruthy();
      
      adminDom.window.close();
    });
  });
  
  describe('Services Section Rendering', () => {
    test('All service categories are present', () => {
      // Check for asphalt services
      const asphaltServices = document.querySelector('.asphalt-services');
      expect(asphaltServices).toBeTruthy();
      
      // Check for concrete services
      const concreteServices = document.querySelector('.concrete-services');
      expect(concreteServices).toBeTruthy();
      
      // Check for service cards
      const serviceCards = document.querySelectorAll('.service-card');
      expect(serviceCards.length).toBeGreaterThan(0);
    });
    
    test('Service details are comprehensive', () => {
      // Check for residential paving details
      const residentialFeatures = document.querySelectorAll('.asphalt-features-grid .feature-category');
      expect(residentialFeatures.length).toBeGreaterThan(0);
      
      // Check for pricing information
      const pricingInfo = document.querySelectorAll('.pricing-info');
      expect(pricingInfo.length).toBeGreaterThan(0);
      
      // Check for call-to-action buttons
      const ctaButtons = document.querySelectorAll('.service-cta .btn');
      expect(ctaButtons.length).toBeGreaterThan(0);
    });
    
    test('Service section has proper SEO structure', () => {
      const servicesSection = document.querySelector('#services');
      expect(servicesSection).toBeTruthy();
      
      // Check for proper heading hierarchy
      const mainHeading = document.querySelector('#services h2');
      const subHeadings = document.querySelectorAll('#services h3, #services h4, #services h5');
      
      expect(mainHeading).toBeTruthy();
      expect(subHeadings.length).toBeGreaterThan(0);
      
      // Check for structured data elements
      const serviceCards = document.querySelectorAll('#services .service-card');
      expect(serviceCards.length).toBeGreaterThan(0);
    });
    
    test('Contact integration is working', () => {
      // Check for contact links in services
      const contactLinks = document.querySelectorAll('a[href="#contact"]');
      expect(contactLinks.length).toBeGreaterThan(0);
      
      // Check for phone links
      const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
      expect(phoneLinks.length).toBeGreaterThan(0);
    });
  });
  
  describe('Performance and Accessibility', () => {
    test('Images have alt attributes', () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('data:')) {
          expect(img.getAttribute('alt')).toBeTruthy();
        }
      });
    });
    
    test('Links have proper accessibility attributes', () => {
      const adminLink = document.querySelector('.admin-link');
      expect(adminLink?.getAttribute('aria-label')).toBeTruthy();
      expect(adminLink?.getAttribute('role')).toBe('button');
      expect(adminLink?.getAttribute('tabindex')).toBe('0');
    });
    
    test('Meta tags are properly configured', () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      const metaViewport = document.querySelector('meta[name="viewport"]');
      
      expect(metaDescription).toBeTruthy();
      expect(metaKeywords).toBeTruthy();
      expect(metaViewport).toBeTruthy();
    });
    
    test('Structured data is present', () => {
      const structuredData = document.querySelector('script[type="application/ld+json"]');
      expect(structuredData).toBeTruthy();
      
      // Verify JSON-LD is valid
      const jsonLd = JSON.parse(structuredData.textContent);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@graph']).toBeTruthy();
    });
  });
});

