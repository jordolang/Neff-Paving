#!/usr/bin/env node

/**
 * Deployment Test Script
 * Tests that critical assets load correctly after deployment
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class DeploymentTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.buildDir = path.join(projectRoot, options.buildDir || 'dist');
    this.timeout = options.timeout || 30000;
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      errors: []
    };
  }

  async runTests() {
    console.log('🧪 Starting deployment tests...');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Build directory: ${this.buildDir}`);
    console.log(`Timeout: ${this.timeout}ms\n`);

    try {
      await this.setupTests();
      await this.runAllTests();
      this.printResults();
      
      return this.results.failed === 0;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }

  async setupTests() {
    // Core page tests
    this.addTest('Main page loads', () => this.testPageLoad('/'));
    this.addTest('Admin page loads', () => this.testPageLoad('/admin'));
    this.addTest('Services page loads', () => this.testPageLoad('/services'));

    // Asset loading tests
    this.addTest('Main JavaScript loads', () => this.testAssetLoad('main'));
    this.addTest('Admin JavaScript loads', () => this.testAssetLoad('admin'));
    this.addTest('Styles load correctly', () => this.testStylesLoad());

    // API endpoint tests
    this.addTest('Health endpoint responds', () => this.testApiEndpoint('/api/health'));
    this.addTest('Auth endpoint accessible', () => this.testApiEndpoint('/api/auth/verify'));

    // Performance tests
    this.addTest('Page load time acceptable', () => this.testPagePerformance('/'));
    this.addTest('Asset sizes reasonable', () => this.testAssetSizes());

    // Security tests
    this.addTest('Security headers present', () => this.testSecurityHeaders('/'));
    this.addTest('No sensitive info exposed', () => this.testSensitiveInfo('/'));

    // Accessibility tests
    this.addTest('Basic accessibility checks', () => this.testAccessibility('/'));

    console.log(`📋 Set up ${this.tests.length} tests`);
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
    this.results.total++;
  }

  async runAllTests() {
    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}...`);
        await test.testFn();
        this.results.passed++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({
          test: test.name,
          error: error.message
        });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testPageLoad(path) {
    const url = `${this.baseUrl}${path}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      if (content.length === 0) {
        throw new Error('Page content is empty');
      }
      
      // Check for basic HTML structure
      if (!content.includes('<html') || !content.includes('</html>')) {
        throw new Error('Invalid HTML structure');
      }
      
      // Check for critical elements
      if (path === '/' && !content.includes('<title>')) {
        throw new Error('Missing title tag');
      }
      
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server');
      }
      throw error;
    }
  }

  async testAssetLoad(assetType) {
    // Find asset files in build directory
    const assetFiles = await this.findAssetFiles(assetType);
    
    if (assetFiles.length === 0) {
      throw new Error(`No ${assetType} assets found in build`);
    }
    
    // Test loading the first asset
    const assetPath = assetFiles[0];
    const relativePath = path.relative(this.buildDir, assetPath);
    const url = `${this.baseUrl}/${relativePath}`;
    
    const response = await this.fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Asset load failed: HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    const expectedTypes = {
      'main': 'javascript',
      'admin': 'javascript',
      'style': 'css'
    };
    
    if (expectedTypes[assetType] && !contentType.includes(expectedTypes[assetType])) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }
  }

  async testStylesLoad() {
    // Test that CSS assets load and contain expected content
    const cssFiles = await this.findAssetFiles('style');
    
    if (cssFiles.length === 0) {
      throw new Error('No CSS assets found');
    }
    
    for (const cssFile of cssFiles.slice(0, 2)) { // Test first 2 CSS files
      const relativePath = path.relative(this.buildDir, cssFile);
      const url = `${this.baseUrl}/${relativePath}`;
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`CSS load failed: ${relativePath}`);
      }
      
      const content = await response.text();
      
      if (content.length === 0) {
        throw new Error(`Empty CSS file: ${relativePath}`);
      }
    }
  }

  async testApiEndpoint(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await this.fetchWithTimeout(url);
      
      // For API endpoints, we expect either success or a controlled error
      if (response.status >= 500) {
        throw new Error(`Server error: HTTP ${response.status}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        // Basic validation that it's valid JSON
        if (typeof data !== 'object') {
          throw new Error('Invalid JSON response');
        }
      }
      
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('API endpoint not accessible');
      }
      throw error;
    }
  }

  async testPagePerformance(path) {
    const url = `${this.baseUrl}${path}`;
    const startTime = Date.now();
    
    const response = await this.fetchWithTimeout(url);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    const maxLoadTime = 5000; // 5 seconds
    
    if (loadTime > maxLoadTime) {
      throw new Error(`Page load too slow: ${loadTime}ms > ${maxLoadTime}ms`);
    }
    
    if (!response.ok) {
      throw new Error(`Performance test failed: HTTP ${response.status}`);
    }
  }

  async testAssetSizes() {
    const allFiles = await this.getAllFiles(this.buildDir);
    const oversizedFiles = [];
    
    const sizeThresholds = {
      '.js': 3 * 1024 * 1024,  // 3MB for JS files
      '.css': 1024 * 1024,     // 1MB for CSS files
      '.png': 5 * 1024 * 1024, // 5MB for images
      '.jpg': 5 * 1024 * 1024,
      '.jpeg': 5 * 1024 * 1024
    };
    
    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const threshold = sizeThresholds[ext];
      
      if (threshold) {
        const stats = await fs.stat(filePath);
        if (stats.size > threshold) {
          oversizedFiles.push({
            file: path.relative(this.buildDir, filePath),
            size: stats.size,
            threshold
          });
        }
      }
    }
    
    if (oversizedFiles.length > 0) {
      const fileList = oversizedFiles.map(f => 
        `${f.file} (${this.formatBytes(f.size)} > ${this.formatBytes(f.threshold)})`
      ).join(', ');
      throw new Error(`Oversized assets: ${fileList}`);
    }
  }

  async testSecurityHeaders(path) {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithTimeout(url);
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options'
    ];
    
    const missingHeaders = [];
    
    for (const header of requiredHeaders) {
      if (!response.headers.has(header)) {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  }

  async testSensitiveInfo(path) {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithTimeout(url);
    const content = await response.text();
    
    const sensitivePatterns = [
      /password\s*[:=]\s*["']?[^"'\s]+/i,
      /api[_-]?key\s*[:=]\s*["']?[^"'\s]+/i,
      /secret\s*[:=]\s*["']?[^"'\s]+/i,
      /token\s*[:=]\s*["']?[^"'\s]+/i
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        throw new Error('Potential sensitive information exposed in page content');
      }
    }
  }

  async testAccessibility(path) {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithTimeout(url);
    const content = await response.text();
    
    // Basic accessibility checks
    const checks = [
      {
        test: () => content.includes('<title>'),
        message: 'Missing page title'
      },
      {
        test: () => content.includes('lang='),
        message: 'Missing language attribute'
      },
      {
        test: () => !content.includes('<img') || content.includes('alt='),
        message: 'Images without alt attributes detected'
      }
    ];
    
    for (const check of checks) {
      if (!check.test()) {
        throw new Error(check.message);
      }
    }
  }

  // Utility methods

  async fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Deployment-Test-Bot/1.0'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async findAssetFiles(type) {
    const files = [];
    const patterns = {
      main: /main.*\.js$/,
      admin: /admin.*\.js$/,
      style: /.*\.css$/
    };
    
    const pattern = patterns[type];
    if (!pattern) return files;
    
    const allFiles = await this.getAllFiles(this.buildDir);
    
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath);
      if (pattern.test(fileName)) {
        files.push(filePath);
      }
    }
    
    return files;
  }

  async getAllFiles(dir) {
    const files = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subFiles = await this.getAllFiles(itemPath);
          files.push(...subFiles);
        } else {
          files.push(itemPath);
        }
      }
    } catch (error) {
      // Ignore errors for individual directories
    }
    
    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printResults() {
    console.log('\n📊 Deployment Test Results:');
    console.log(`Total tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All deployment tests passed!');
    } else {
      console.log(`\n⚠️  ${this.results.failed} test(s) failed`);
    }
  }
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  const options = {};
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' && i + 1 < args.length) {
      options.baseUrl = args[i + 1];
      i++;
    } else if (arg === '--build-dir' && i + 1 < args.length) {
      options.buildDir = args[i + 1];
      i++;
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeout = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  const tester = new DeploymentTester(options);
  
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { DeploymentTester };
