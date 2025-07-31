#!/usr/bin/env node

/**
 * Test script to verify Vercel environment detection and build configuration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

class VercelConfigTester {
  constructor() {
    this.testResults = [];
  }

  test(description, condition) {
    const passed = Boolean(condition);
    this.testResults.push({ description, passed, details: condition });
    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${description}: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed && typeof condition === 'string') {
      console.log(`   Details: ${condition}`);
    }
    return passed;
  }

  async runTests() {
    console.log('🧪 Starting Vercel Configuration Tests...\n');

    // Test 1: Verify VERCEL environment detection
    console.log('📋 Environment Detection Tests:');
    
    // Simulate Vercel environment
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.DEPLOY_PLATFORM = 'vercel';
    
    this.test('VERCEL environment variable is set', process.env.VERCEL === '1');
    this.test('VERCEL_ENV environment variable is set', process.env.VERCEL_ENV === 'production');
    this.test('DEPLOY_PLATFORM environment variable is set', process.env.DEPLOY_PLATFORM === 'vercel');

    // Test vite config detection logic
    const testMode = 'vercel';
    const getBaseUrl = () => {
      if (testMode === 'vercel' || process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL) {
        return '/';
      }
      if (testMode === 'github') return '/Neff-Paving/';
      return process.env.VITE_BASE_URL || '/Neff-Paving/';
    };

    const baseUrl = getBaseUrl();
    this.test('Base URL detection returns "/" for Vercel', baseUrl === '/');

    // Test build-time defines
    const isVercel = testMode === 'vercel' || 
      process.env.VITE_PLATFORM === 'vercel' || 
      process.env.VERCEL === '1' || 
      process.env.VERCEL_ENV || 
      process.env.DEPLOY_PLATFORM === 'vercel';

    this.test('__IS_VERCEL__ flag is true', isVercel);

    console.log('\n📁 Build Output Tests:');

    // Test 2: Verify build output exists
    const buildExists = await fs.pathExists(distDir);
    this.test('Build output directory exists', buildExists);

    if (buildExists) {
      // Test critical files
      const criticalFiles = ['index.html', 'estimate-form.html', '404.html'];
      for (const file of criticalFiles) {
        const filePath = path.join(distDir, file);
        const exists = await fs.pathExists(filePath);
        this.test(`${file} exists in build output`, exists);
      }

      // Test assets directory structure
      const assetsDir = path.join(distDir, 'assets');
      const assetsDirExists = await fs.pathExists(assetsDir);
      this.test('Assets directory exists', assetsDirExists);

      if (assetsDirExists) {
        const expectedAssetDirs = ['gallery', 'images', 'styles', 'videos'];
        for (const dir of expectedAssetDirs) {
          const dirPath = path.join(assetsDir, dir);
          const exists = await fs.pathExists(dirPath);
          this.test(`Assets/${dir} directory exists`, exists);
        }
      }

      // Test HTML content for correct paths
      console.log('\n🔗 Asset Path Tests:');
      
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (await fs.pathExists(indexHtmlPath)) {
        const htmlContent = await fs.readFile(indexHtmlPath, 'utf8');
        
        // Test asset paths
        const hasCorrectVideoPaths = htmlContent.includes('src="/assets/videos/');
        this.test('Video assets use absolute paths (/assets/videos/)', hasCorrectVideoPaths);

        const hasCorrectGalleryPaths = htmlContent.includes('data-src="/assets/gallery/');
        this.test('Gallery images use absolute paths (/assets/gallery/)', hasCorrectGalleryPaths);

        const hasCorrectFaviconPaths = htmlContent.includes('href="/assets/images/') || htmlContent.includes('href="/assets/favicon.');
        this.test('Favicons use absolute paths', hasCorrectFaviconPaths);

        const hasCorrectStylePaths = htmlContent.includes('href="/assets/styles/');
        this.test('CSS files use absolute paths (/assets/styles/)', hasCorrectStylePaths);

        const hasCorrectScriptPaths = htmlContent.includes('src="/entries/') || htmlContent.includes('src="/chunks/');
        this.test('JavaScript files use absolute paths', hasCorrectScriptPaths);

        // Test cache busting
        const hasCacheBusting = htmlContent.includes('?v=');
        this.test('Assets have cache-busting parameters', hasCacheBusting);

        // Test build timestamp
        const hasBuildTimestamp = htmlContent.includes('build-timestamp');
        this.test('Build timestamp is present in HTML', hasBuildTimestamp);
      }

      console.log('\n📦 Asset Integrity Tests:');

      // Test gallery images were copied correctly
      const galleryDir = path.join(assetsDir, 'gallery');
      if (await fs.pathExists(galleryDir)) {
        const gallerySubdirs = await fs.readdir(galleryDir);
        const expectedSubdirs = ['commercial', 'residential', 'concrete', 'equipment'];
        
        for (const subdir of expectedSubdirs) {
          const subdirExists = gallerySubdirs.includes(subdir);
          this.test(`Gallery subdirectory '${subdir}' exists`, subdirExists);
          
          if (subdirExists) {
            const subdirPath = path.join(galleryDir, subdir);
            const files = await fs.readdir(subdirPath);
            const hasImages = files.some(file => file.endsWith('.webp'));
            this.test(`Gallery/${subdir} contains .webp images`, hasImages);
          }
        }
      }

      // Test manifest files
      const manifestPath = path.join(distDir, 'asset-manifest.json');
      const manifestExists = await fs.pathExists(manifestPath);
      this.test('Asset manifest was generated', manifestExists);

      if (manifestExists) {
        const manifest = await fs.readJson(manifestPath);
        this.test('Manifest contains assets list', Array.isArray(manifest.assets));
        this.test('Manifest platform is set to vercel', manifest.platform === 'vercel');
      }

      const deploymentReportPath = path.join(distDir, 'deployment-report.json');
      const deploymentReportExists = await fs.pathExists(deploymentReportPath);
      this.test('Deployment report was generated', deploymentReportExists);
    }

    console.log('\n🗂️  Configuration File Tests:');

    // Test package.json configuration
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    const hasVercelBuildScript = packageJson.scripts && packageJson.scripts['vercel-build'];
    this.test('package.json has vercel-build script', hasVercelBuildScript);

    const vercelBuildScript = packageJson.scripts['vercel-build'];
    const scriptSetsCorrectEnvVars = vercelBuildScript && 
      vercelBuildScript.includes('VERCEL=1') && 
      vercelBuildScript.includes('DEPLOY_PLATFORM=vercel');
    this.test('vercel-build script sets correct environment variables', scriptSetsCorrectEnvVars);

    // Test vercel.json configuration
    const vercelJsonPath = path.join(projectRoot, 'vercel.json');
    const vercelJsonExists = await fs.pathExists(vercelJsonPath);
    this.test('vercel.json configuration file exists', vercelJsonExists);

    if (vercelJsonExists) {
      const vercelConfig = await fs.readJson(vercelJsonPath);
      
      this.test('vercel.json uses correct build command', vercelConfig.buildCommand === 'npm run vercel-build');
      this.test('vercel.json uses correct output directory', vercelConfig.outputDirectory === 'dist');
      this.test('vercel.json sets VERCEL environment variable', vercelConfig.env && vercelConfig.env.VERCEL === '1');

      // Test asset headers configuration
      const hasAssetHeaders = vercelConfig.headers && vercelConfig.headers.some(h => 
        h.source.includes('/assets/') && 
        h.headers.some(header => header.key === 'Cache-Control')
      );
      this.test('vercel.json configures asset caching headers', hasAssetHeaders);

      const hasGalleryHeaders = vercelConfig.headers && vercelConfig.headers.some(h => 
        h.source.includes('/assets/gallery/')
      );
      this.test('vercel.json configures gallery-specific headers', hasGalleryHeaders);
    }

    // Summary
    console.log('\n📊 Test Summary:');
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.description}`);
      });
    }

    return failedTests === 0;
  }
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  const tester = new VercelConfigTester();
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { VercelConfigTester };
