#!/usr/bin/env node

/**
 * Build Verification Script
 * Checks for common build issues and validates deployment readiness
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class BuildVerifier {
  constructor(buildDir = 'dist') {
    this.buildDir = path.join(projectRoot, buildDir);
    this.issues = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  async verify() {
    console.log('🔍 Starting comprehensive build verification...');
    console.log(`Build directory: ${this.buildDir}\n`);

    try {
      await this.checkBuildDirectoryExists();
      await this.checkCriticalFiles();
      await this.checkAssetIntegrity();
      await this.checkFilePermissions();
      await this.checkAssetSizes();
      await this.checkManifestFiles();
      await this.checkSecurityHeaders();
      await this.validateHTML();
      await this.checkJavaScriptIntegrity();
      await this.checkServiceWorker();
      
      this.printResults();
      
      if (this.issues.length === 0) {
        console.log('✅ Build verification passed!');
        return true;
      } else {
        console.log('❌ Build verification failed!');
        return false;
      }
    } catch (error) {
      console.error('❌ Verification failed with error:', error);
      return false;
    }
  }

  async checkBuildDirectoryExists() {
    this.checks++;
    console.log('Checking build directory exists...');
    
    if (!(await fs.pathExists(this.buildDir))) {
      this.addIssue('Build directory does not exist');
      return;
    }
    
    const stats = await fs.stat(this.buildDir);
    if (!stats.isDirectory()) {
      this.addIssue('Build path exists but is not a directory');
      return;
    }
    
    this.passed++;
    console.log('✓ Build directory exists');
  }

  async checkCriticalFiles() {
    this.checks++;
    console.log('Checking critical files...');
    
    const criticalFiles = [
      'index.html',
      'admin/index.html'
    ];
    
    const optionalFiles = [
      'services/index.html'
    ];
    
    let missingFiles = [];
    let emptyFiles = [];
    
    for (const file of criticalFiles) {
      const filePath = path.join(this.buildDir, file);
      
      if (!(await fs.pathExists(filePath))) {
        missingFiles.push(file);
        continue;
      }
      
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        emptyFiles.push(file);
      } else {
        console.log(`✓ Found: ${file}`);
      }
    }
    
    // Check optional files
    for (const file of optionalFiles) {
      const filePath = path.join(this.buildDir, file);
      if (await fs.pathExists(filePath)) {
        console.log(`✓ Found optional: ${file}`);
      } else {
        this.addWarning(`Optional file missing: ${file}`);
      }
    }
    
    if (missingFiles.length > 0) {
      this.addIssue(`Missing critical files: ${missingFiles.join(', ')}`);
    }
    
    if (emptyFiles.length > 0) {
      this.addIssue(`Empty critical files: ${emptyFiles.join(', ')}`);
    }
    
    if (missingFiles.length === 0 && emptyFiles.length === 0) {
      this.passed++;
      console.log('✓ All critical files present and non-empty');
    }
  }

  async checkAssetIntegrity() {
    this.checks++;
    console.log('Checking asset integrity...');
    
    const assetDirs = [
      'assets',
      'chunks', 
      'entries'
    ];
    
    let hasAssets = false;
    let assetCounts = {};
    
    for (const dir of assetDirs) {
      const dirPath = path.join(this.buildDir, dir);
      
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath);
        assetCounts[dir] = files.length;
        
        if (files.length > 0) {
          hasAssets = true;
        }
      } else {
        assetCounts[dir] = 0;
      }
    }
    
    if (!hasAssets) {
      this.addWarning('No assets found in expected directories');
    } else {
      this.passed++;
      console.log('✓ Assets found:', assetCounts);
    }
  }

  async checkFilePermissions() {
    this.checks++;
    console.log('Checking file permissions...');
    
    try {
      const testFile = path.join(this.buildDir, '.permission-test');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
      
      this.passed++;
      console.log('✓ File permissions OK');
    } catch (error) {
      this.addIssue(`File permission issue: ${error.message}`);
    }
  }

  async checkAssetSizes() {
    this.checks++;
    console.log('Checking asset sizes...');
    
    const sizeThresholds = {
      '.js': 1024 * 1024 * 2,  // 2MB for JS files
      '.css': 1024 * 512,      // 512KB for CSS files
      '.png': 1024 * 1024 * 5, // 5MB for images
      '.jpg': 1024 * 1024 * 5,
      '.jpeg': 1024 * 1024 * 5,
      '.webp': 1024 * 1024 * 3,
      '.svg': 1024 * 100       // 100KB for SVG
    };
    
    const oversizedFiles = [];
    
    try {
      const allFiles = await this.getAllFiles(this.buildDir);
      
      for (const filePath of allFiles) {
        const ext = path.extname(filePath).toLowerCase();
        const threshold = sizeThresholds[ext];
        
        if (threshold) {
          const stats = await fs.stat(filePath);
          if (stats.size > threshold) {
            const relativePath = path.relative(this.buildDir, filePath);
            oversizedFiles.push({
              file: relativePath,
              size: this.formatBytes(stats.size),
              limit: this.formatBytes(threshold)
            });
          }
        }
      }
      
      if (oversizedFiles.length > 0) {
        oversizedFiles.forEach(file => {
          this.addWarning(`Large file: ${file.file} (${file.size} > ${file.limit})`);
        });
      }
      
      this.passed++;
      console.log('✓ Asset size check completed');
    } catch (error) {
      this.addWarning(`Could not check asset sizes: ${error.message}`);
    }
  }

  async checkManifestFiles() {
    this.checks++;
    console.log('Checking manifest files...');
    
    const manifestFiles = [
      'asset-manifest.json',
      'deployment-report.json'
    ];
    
    let foundManifests = 0;
    
    for (const file of manifestFiles) {
      const filePath = path.join(this.buildDir, file);
      
      if (await fs.pathExists(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          JSON.parse(content); // Validate JSON
          foundManifests++;
          console.log(`✓ Valid manifest: ${file}`);
        } catch (error) {
          this.addWarning(`Invalid JSON in ${file}: ${error.message}`);
        }
      }
    }
    
    if (foundManifests > 0) {
      this.passed++;
    } else {
      this.addWarning('No manifest files found');
    }
  }

  async checkSecurityHeaders() {
    this.checks++;
    console.log('Checking security configuration...');
    
    const securityFiles = [
      '_headers',
      '.htaccess'
    ];
    
    let hasSecurityConfig = false;
    
    for (const file of securityFiles) {
      const filePath = path.join(this.buildDir, file);
      
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        
        // Check for basic security headers
        const securityHeaders = [
          'X-Content-Type-Options',
          'X-Frame-Options',
          'X-XSS-Protection'
        ];
        
        const foundHeaders = securityHeaders.filter(header => 
          content.includes(header)
        );
        
        if (foundHeaders.length > 0) {
          hasSecurityConfig = true;
          console.log(`✓ Security headers found in ${file}: ${foundHeaders.join(', ')}`);
        }
      }
    }
    
    if (hasSecurityConfig) {
      this.passed++;
    } else {
      this.addWarning('No security headers configuration found');
    }
  }

  async validateHTML() {
    this.checks++;
    console.log('Validating HTML files...');
    
    const htmlFiles = await this.getFilesByExtension(this.buildDir, ['.html'], true);
    let validHtmlFiles = 0;
    
    for (const htmlFile of htmlFiles) {
      try {
        const content = await fs.readFile(htmlFile, 'utf8');
        
        // Basic HTML validation
        if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
          this.addWarning(`Missing DOCTYPE in ${path.relative(this.buildDir, htmlFile)}`);
          continue;
        }
        
        if (!content.includes('<html')) {
          this.addWarning(`Missing <html> tag in ${path.relative(this.buildDir, htmlFile)}`);
          continue;
        }
        
        if (!content.includes('</html>')) {
          this.addWarning(`Missing closing </html> tag in ${path.relative(this.buildDir, htmlFile)}`);
          continue;
        }
        
        validHtmlFiles++;
      } catch (error) {
        this.addWarning(`Could not validate ${path.relative(this.buildDir, htmlFile)}: ${error.message}`);
      }
    }
    
    if (validHtmlFiles === htmlFiles.length && htmlFiles.length > 0) {
      this.passed++;
      console.log(`✓ All ${htmlFiles.length} HTML files are valid`);
    } else if (htmlFiles.length === 0) {
      this.addWarning('No HTML files found');
    }
  }

  async checkJavaScriptIntegrity() {
    this.checks++;
    console.log('Checking JavaScript integrity...');
    
    const jsFiles = await this.getFilesByExtension(this.buildDir, ['.js'], true);
    let issues = 0;
    
    for (const jsFile of jsFiles) {
      try {
        const content = await fs.readFile(jsFile, 'utf8');
        
        // Check for common issues
        if (content.trim().length === 0) {
          this.addWarning(`Empty JavaScript file: ${path.relative(this.buildDir, jsFile)}`);
          issues++;
          continue;
        }
        
        // Check for syntax errors (basic)
        if (content.includes('SyntaxError') || content.includes('Unexpected token')) {
          this.addWarning(`Potential syntax error in: ${path.relative(this.buildDir, jsFile)}`);
          issues++;
        }
        
      } catch (error) {
        this.addWarning(`Could not read JS file ${path.relative(this.buildDir, jsFile)}: ${error.message}`);
        issues++;
      }
    }
    
    if (issues === 0 && jsFiles.length > 0) {
      this.passed++;
      console.log(`✓ All ${jsFiles.length} JavaScript files passed basic checks`);
    } else if (jsFiles.length === 0) {
      this.addWarning('No JavaScript files found');
    }
  }

  async checkServiceWorker() {
    this.checks++;
    console.log('Checking service worker...');
    
    const swFiles = ['sw.js', 'service-worker.js', 'workbox-*.js'];
    let hasServiceWorker = false;
    
    for (const swFile of swFiles) {
      if (swFile.includes('*')) {
        // Pattern matching
        const files = await this.getAllFiles(this.buildDir);
        const pattern = swFile.replace('*', '.*');
        const regex = new RegExp(pattern);
        
        for (const file of files) {
          const basename = path.basename(file);
          if (regex.test(basename)) {
            hasServiceWorker = true;
            console.log(`✓ Found service worker: ${path.relative(this.buildDir, file)}`);
            break;
          }
        }
      } else {
        const swPath = path.join(this.buildDir, swFile);
        if (await fs.pathExists(swPath)) {
          hasServiceWorker = true;
          console.log(`✓ Found service worker: ${swFile}`);
        }
      }
    }
    
    if (hasServiceWorker) {
      this.passed++;
    } else {
      this.addWarning('No service worker found (optional but recommended for PWA)');
    }
  }

  // Utility methods

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

  async getFilesByExtension(dir, extensions, recursive = false) {
    const files = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory() && recursive) {
          const subFiles = await this.getFilesByExtension(itemPath, extensions, recursive);
          files.push(...subFiles);
        } else if (stats.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(itemPath);
          }
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

  addIssue(message) {
    this.issues.push(message);
    console.log(`❌ ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.log(`⚠️  ${message}`);
  }

  printResults() {
    console.log('\n📈 Verification Results:');
    console.log(`Checks completed: ${this.checks}`);
    console.log(`Checks passed: ${this.passed}`);
    console.log(`Issues found: ${this.issues.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ Issues:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    // Legacy output for compatibility
    console.log('\n📁 Build Summary:');
    console.log(`Build directory: ${this.buildDir}`);
    const buildTime = new Date().toISOString();
    console.log(`Verification completed at: ${buildTime}`);
  }
}

// Run verification if called directly
if (process.argv[1] === __filename) {
  const buildDir = process.argv[2] || 'dist';
  const verifier = new BuildVerifier(buildDir);
  
  verifier.verify().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
}

export { BuildVerifier };
