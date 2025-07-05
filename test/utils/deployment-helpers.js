/**
 * Deployment Testing Utilities
 * Helper functions for comprehensive deployment platform testing
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asset loading test utilities
 */
export class AssetTestHelper {
  constructor() {
    this.mockFetch = global.fetch || jest.fn();
  }

  /**
   * Test critical asset preloading
   * @param {Document} document - DOM document
   * @returns {Object} Test results
   */
  testCriticalAssets(document) {
    const results = {
      css: { found: false, links: [] },
      js: { found: false, scripts: [] },
      fonts: { found: false, preloads: [] },
      images: { found: false, optimized: 0, unoptimized: 0 }
    };

    // Check CSS links
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    results.css.found = cssLinks.length > 0;
    results.css.links = Array.from(cssLinks).map(link => link.href);

    // Check JavaScript scripts
    const scripts = document.querySelectorAll('script[src]');
    results.js.found = scripts.length > 0;
    results.js.scripts = Array.from(scripts).map(script => script.src);

    // Check font preloads
    const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
    results.fonts.found = fontPreloads.length > 0;
    results.fonts.preloads = Array.from(fontPreloads).map(link => link.href);

    // Check images
    const images = document.querySelectorAll('img');
    results.images.found = images.length > 0;
    images.forEach(img => {
      if (img.hasAttribute('loading') || img.hasAttribute('data-src')) {
        results.images.optimized++;
      } else {
        results.images.unoptimized++;
      }
    });

    return results;
  }

  /**
   * Test asset loading functionality
   * @param {Array} assetPaths - Paths to test
   * @returns {Promise} Test promise
   */
  async testAssetLoading(assetPaths) {
    const results = [];
    
    for (const assetPath of assetPaths) {
      try {
        this.mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', this.getContentType(assetPath)]]),
          blob: () => Promise.resolve(new Blob(['mock data']))
        });

        const response = await this.mockFetch(assetPath);
        results.push({
          path: assetPath,
          success: response.ok,
          status: response.status
        });
      } catch (error) {
        results.push({
          path: assetPath,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get content type for asset
   * @param {string} assetPath - Asset path
   * @returns {string} Content type
   */
  getContentType(assetPath) {
    const ext = path.extname(assetPath).toLowerCase();
    const types = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };
    return types[ext] || 'application/octet-stream';
  }
}

/**
 * Routing test utilities
 */
export class RoutingTestHelper {
  /**
   * Test navigation structure
   * @param {Document} document - DOM document
   * @returns {Object} Navigation test results
   */
  testNavigation(document) {
    const results = {
      navExists: false,
      links: [],
      anchors: [],
      external: [],
      internal: []
    };

    const nav = document.querySelector('nav');
    results.navExists = !!nav;

    const links = document.querySelectorAll('a[href]');
    results.links = Array.from(links).map(link => ({
      href: link.href,
      text: link.textContent?.trim(),
      target: link.target,
      rel: link.rel
    }));

    // Categorize links
    results.links.forEach(link => {
      if (link.href.startsWith('#')) {
        results.anchors.push(link);
      } else if (link.href.startsWith('http') && !link.href.includes('neff-paving.com')) {
        results.external.push(link);
      } else {
        results.internal.push(link);
      }
    });

    return results;
  }

  /**
   * Test specific route configurations
   * @param {string} htmlPath - Path to HTML file
   * @returns {Object} Route test results
   */
  testRouteConfig(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const results = {
      hasCanonical: false,
      canonicalUrl: null,
      hasRedirect: false,
      redirectTarget: null,
      metaTags: {
        title: null,
        description: null,
        keywords: null
      }
    };

    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      results.hasCanonical = true;
      results.canonicalUrl = canonical.href;
    }

    // Check for redirects
    const redirectScript = document.querySelector('script');
    if (redirectScript && redirectScript.textContent.includes('window.location.href')) {
      results.hasRedirect = true;
      const match = redirectScript.textContent.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        results.redirectTarget = match[1];
      }
    }

    // Check meta refresh
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      results.hasRedirect = true;
      const content = metaRefresh.getAttribute('content');
      const match = content.match(/url=([^;]+)/);
      if (match) {
        results.redirectTarget = match[1];
      }
    }

    // Check meta tags
    const title = document.querySelector('title');
    const description = document.querySelector('meta[name="description"]');
    const keywords = document.querySelector('meta[name="keywords"]');

    results.metaTags.title = title?.textContent;
    results.metaTags.description = description?.getAttribute('content');
    results.metaTags.keywords = keywords?.getAttribute('content');

    dom.window.close();
    return results;
  }
}

/**
 * Admin panel test utilities
 */
export class AdminTestHelper {
  /**
   * Test admin panel structure and functionality
   * @param {string} adminHtmlPath - Path to admin HTML
   * @returns {Object} Admin test results
   */
  testAdminPanel(adminHtmlPath) {
    const html = fs.readFileSync(adminHtmlPath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const results = {
      hasLoginScreen: false,
      hasDashboard: false,
      hasNavigation: false,
      sections: [],
      hasAuthentication: false,
      hasBootstrap: false,
      hasResponsive: false
    };

    // Check login screen
    results.hasLoginScreen = !!document.querySelector('#login-screen');

    // Check dashboard
    results.hasDashboard = !!document.querySelector('#admin-dashboard');

    // Check navigation
    const sidebar = document.querySelector('.sidebar');
    results.hasNavigation = !!sidebar;

    // Check sections
    const sections = document.querySelectorAll('.content-section');
    results.sections = Array.from(sections).map(section => section.id);

    // Check authentication handling
    const scripts = document.querySelectorAll('script');
    results.hasAuthentication = Array.from(scripts).some(script =>
      script.textContent && script.textContent.includes('login') || script.textContent.includes('auth')
    );

    // Check Bootstrap
    const bootstrapLink = document.querySelector('link[href*="bootstrap"]');
    const bootstrapScript = document.querySelector('script[src*="bootstrap"]');
    results.hasBootstrap = !!(bootstrapLink || bootstrapScript);

    // Check responsive design
    const viewport = document.querySelector('meta[name="viewport"]');
    results.hasResponsive = !!viewport;

    dom.window.close();
    return results;
  }

  /**
   * Test admin access from main site
   * @param {Document} document - Main site document
   * @returns {Object} Access test results
   */
  testAdminAccess(document) {
    const results = {
      hasAdminLink: false,
      linkTarget: null,
      hasTooltip: false,
      hasAriaLabel: false,
      hasAccessibilityAttributes: false
    };

    const adminLink = document.querySelector('.admin-link');
    if (adminLink) {
      results.hasAdminLink = true;
      results.linkTarget = adminLink.getAttribute('href');
      results.hasTooltip = !!adminLink.getAttribute('data-tooltip');
      results.hasAriaLabel = !!adminLink.getAttribute('aria-label');
      results.hasAccessibilityAttributes = !!(
        adminLink.getAttribute('role') ||
        adminLink.getAttribute('tabindex')
      );
    }

    return results;
  }
}

/**
 * Services section test utilities
 */
export class ServicesTestHelper {
  /**
   * Test services section structure and content
   * @param {Document} document - DOM document
   * @returns {Object} Services test results
   */
  testServicesSection(document) {
    const servicesSection = document.querySelector('#services');
    
    const results = {
      sectionExists: !!servicesSection,
      hasTitle: false,
      categories: [],
      serviceCards: 0,
      hasPricing: false,
      hasContactIntegration: false,
      hasAccessibility: false
    };

    if (!servicesSection) return results;

    // Check title
    const title = servicesSection.querySelector('h2');
    results.hasTitle = !!title;

    // Check service categories
    const asphaltServices = servicesSection.querySelector('.asphalt-services');
    const concreteServices = servicesSection.querySelector('.concrete-services');
    
    if (asphaltServices) results.categories.push('asphalt');
    if (concreteServices) results.categories.push('concrete');

    // Count service cards
    const serviceCards = servicesSection.querySelectorAll('.service-card');
    results.serviceCards = serviceCards.length;

    // Check pricing
    const pricingInfo = servicesSection.querySelectorAll('.pricing-info');
    results.hasPricing = pricingInfo.length > 0;

    // Check contact integration
    const contactLinks = servicesSection.querySelectorAll('a[href="#contact"]');
    const phoneLinks = servicesSection.querySelectorAll('a[href^="tel:"]');
    results.hasContactIntegration = contactLinks.length > 0 || phoneLinks.length > 0;

    // Check accessibility
    const headings = servicesSection.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const buttons = servicesSection.querySelectorAll('button, a');
    const hasProperHeadingHierarchy = headings.length > 0;
    const hasAriaLabels = Array.from(buttons).some(btn => btn.getAttribute('aria-label'));
    
    results.hasAccessibility = hasProperHeadingHierarchy && hasAriaLabels;

    return results;
  }

  /**
   * Test service content quality
   * @param {Document} document - DOM document
   * @returns {Object} Content quality results
   */
  testServiceContent(document) {
    const servicesSection = document.querySelector('#services');
    
    const results = {
      hasDescriptions: false,
      hasFeatures: false,
      hasCallToActions: false,
      hasHighlights: false,
      wordCount: 0
    };

    if (!servicesSection) return results;

    // Check descriptions
    const descriptions = servicesSection.querySelectorAll('.service-lead, p');
    results.hasDescriptions = descriptions.length > 0;

    // Check features
    const features = servicesSection.querySelectorAll('.service-features, ul');
    results.hasFeatures = features.length > 0;

    // Check call-to-actions
    const ctas = servicesSection.querySelectorAll('.btn, .service-cta');
    results.hasCallToActions = ctas.length > 0;

    // Check highlights
    const highlights = servicesSection.querySelectorAll('.highlight-item, .highlight');
    results.hasHighlights = highlights.length > 0;

    // Count words
    const textContent = servicesSection.textContent || '';
    results.wordCount = textContent.trim().split(/\s+/).length;

    return results;
  }
}

/**
 * Performance and SEO test utilities
 */
export class PerformanceTestHelper {
  /**
   * Test performance optimizations
   * @param {Document} document - DOM document
   * @returns {Object} Performance test results
   */
  testPerformance(document) {
    const results = {
      hasPreconnect: false,
      hasPreload: false,
      hasFontDisplay: false,
      hasLazyLoading: false,
      hasCompression: false,
      imageOptimization: {
        total: 0,
        withAlt: 0,
        withLoading: 0,
        withSizes: 0
      }
    };

    // Check preconnect
    const preconnect = document.querySelectorAll('link[rel="preconnect"]');
    results.hasPreconnect = preconnect.length > 0;

    // Check preload
    const preload = document.querySelectorAll('link[rel="preload"]');
    results.hasPreload = preload.length > 0;

    // Check font display
    const fontLinks = document.querySelectorAll('link[href*="fonts"]');
    results.hasFontDisplay = Array.from(fontLinks).some(link =>
      link.href.includes('display=swap')
    );

    // Check lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
    results.hasLazyLoading = lazyImages.length > 0;

    // Check image optimization
    const images = document.querySelectorAll('img');
    results.imageOptimization.total = images.length;
    
    images.forEach(img => {
      if (img.getAttribute('alt')) results.imageOptimization.withAlt++;
      if (img.getAttribute('loading')) results.imageOptimization.withLoading++;
      if (img.getAttribute('sizes')) results.imageOptimization.withSizes++;
    });

    return results;
  }

  /**
   * Test SEO optimizations
   * @param {Document} document - DOM document
   * @returns {Object} SEO test results
   */
  testSEO(document) {
    const results = {
      hasTitle: false,
      hasDescription: false,
      hasKeywords: false,
      hasOpenGraph: false,
      hasTwitterCard: false,
      hasStructuredData: false,
      hasCanonical: false,
      headingStructure: {
        h1: 0,
        h2: 0,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0
      }
    };

    // Basic meta tags
    results.hasTitle = !!document.querySelector('title');
    results.hasDescription = !!document.querySelector('meta[name="description"]');
    results.hasKeywords = !!document.querySelector('meta[name="keywords"]');

    // Open Graph
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    results.hasOpenGraph = ogTags.length > 0;

    // Twitter Card
    const twitterTags = document.querySelectorAll('meta[property^="twitter:"], meta[name^="twitter:"]');
    results.hasTwitterCard = twitterTags.length > 0;

    // Structured Data
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    results.hasStructuredData = !!structuredData;

    // Canonical URL
    results.hasCanonical = !!document.querySelector('link[rel="canonical"]');

    // Heading structure
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      results.headingStructure[tag] = document.querySelectorAll(tag).length;
    });

    return results;
  }
}

/**
 * Main deployment test runner
 */
export class DeploymentTestRunner {
  constructor() {
    this.assetHelper = new AssetTestHelper();
    this.routingHelper = new RoutingTestHelper();
    this.adminHelper = new AdminTestHelper();
    this.servicesHelper = new ServicesTestHelper();
    this.performanceHelper = new PerformanceTestHelper();
  }

  /**
   * Run comprehensive deployment tests
   * @param {string} projectRoot - Project root path
   * @returns {Object} Complete test results
   */
  async runDeploymentTests(projectRoot) {
    const results = {
      timestamp: new Date().toISOString(),
      assets: null,
      routing: null,
      admin: null,
      services: null,
      performance: null,
      seo: null,
      overall: {
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    try {
      // Load main page
      const indexPath = path.join(projectRoot, 'index.html');
      const indexHtml = fs.readFileSync(indexPath, 'utf-8');
      const dom = new JSDOM(indexHtml, { url: 'http://localhost:3000' });
      const document = dom.window.document;

      // Run tests
      results.assets = this.assetHelper.testCriticalAssets(document);
      results.routing = this.routingHelper.testNavigation(document);
      results.services = this.servicesHelper.testServicesSection(document);
      results.performance = this.performanceHelper.testPerformance(document);
      results.seo = this.performanceHelper.testSEO(document);

      // Test admin panel
      const adminPath = path.join(projectRoot, 'admin', 'index.html');
      results.admin = this.adminHelper.testAdminPanel(adminPath);

      // Calculate overall results
      this.calculateOverallResults(results);

      dom.window.close();
      return results;

    } catch (error) {
      results.error = error.message;
      return results;
    }
  }

  /**
   * Calculate overall test results
   * @param {Object} results - Test results
   */
  calculateOverallResults(results) {
    const checks = [
      results.assets?.css?.found,
      results.assets?.js?.found,
      results.routing?.navExists,
      results.admin?.hasLoginScreen,
      results.admin?.hasDashboard,
      results.services?.sectionExists,
      results.performance?.hasPreload,
      results.seo?.hasTitle
    ];

    results.overall.passed = checks.filter(check => check === true).length;
    results.overall.failed = checks.filter(check => check === false).length;
    results.overall.warnings = checks.filter(check => check === undefined).length;
  }
}

// Export all helpers
export {
  AssetTestHelper,
  RoutingTestHelper,
  AdminTestHelper,
  ServicesTestHelper,
  PerformanceTestHelper,
  DeploymentTestRunner
};
