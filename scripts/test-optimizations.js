#!/usr/bin/env node

/**
 * Optimization Testing Script
 * Tests current state of optimizations and verifies functionality
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class OptimizationTester {
  constructor() {
    this.testResults = {
      phase1: { css: false, minification: false, splitting: false },
      phase2: { images: false, compression: false, formats: false },
      phase3: { assetPaths: false, caching: false, preloading: false },
      errors: []
    };
  }

  async runTests() {
    console.log('🧪 Testing Current Optimization State...\n');
    
    try {
      // Test Phase 1: CSS Optimizations
      await this.testPhase1();
      
      // Test Phase 2: Image Optimizations
      await this.testPhase2();
      
      // Test Phase 3: Asset Processing
      await this.testPhase3();
      
      // Generate report
      await this.generateTestReport();
      
      console.log('\n✅ Testing completed successfully!');
      this.printResults();
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    }
  }

  async testPhase1() {
    console.log('📋 Phase 1: CSS Optimization Tests');
    
    // Test CSS minification
    await this.testCSSMinification();
    
    // Test CSS code splitting
    await this.testCSSCodeSplitting();
    
    // Test CSS asset optimization
    await this.testCSSOptimization();
  }

  async testCSSMinification() {
    console.log('  🎨 Testing CSS minification...');
    
    try {
      // Build the project
      execSync('npm run build:vercel', { stdio: 'pipe', cwd: projectRoot });
      
      // Check if CSS files are minified
      const cssFiles = await this.findFiles('dist/assets/styles', '.css');
      
      if (cssFiles.length > 0) {
        const cssContent = await fs.readFile(cssFiles[0], 'utf8');
        const isMinified = !cssContent.includes('\n  ') && cssContent.length > 100;
        
        this.testResults.phase1.minification = isMinified;
        console.log(`    ✓ CSS minification: ${isMinified ? 'WORKING' : 'NOT WORKING'}`);
      } else {
        console.log('    ⚠️  No CSS files found in build output');
      }
      
    } catch (error) {
      console.log('    ❌ CSS minification test failed:', error.message);
      this.testResults.errors.push(`CSS minification: ${error.message}`);
    }
  }

  async testCSSCodeSplitting() {
    console.log('  📦 Testing CSS code splitting...');
    
    try {
      const buildDir = path.join(projectRoot, 'dist');
      const cssFiles = await this.findFiles(path.join(buildDir, 'assets/styles'), '.css');
      
      // Check if we have multiple CSS files (indicating code splitting)
      const hasCodeSplitting = cssFiles.length > 1;
      
      this.testResults.phase1.splitting = hasCodeSplitting;
      console.log(`    ✓ CSS code splitting: ${hasCodeSplitting ? 'WORKING' : 'SINGLE FILE'}`);
      console.log(`    📊 Found ${cssFiles.length} CSS file(s)`);
      
    } catch (error) {
      console.log('    ❌ CSS code splitting test failed:', error.message);
      this.testResults.errors.push(`CSS code splitting: ${error.message}`);
    }
  }

  async testCSSOptimization() {
    console.log('  ⚡ Testing CSS optimization in deployment script...');
    
    try {
      // Check if CSS optimization is enabled in deploy script
      const deployScript = path.join(projectRoot, 'scripts/deploy-optimized.js');
      const scriptContent = await fs.readFile(deployScript, 'utf8');
      
      // Check for CSS optimization methods
      const hasCSSOptimization = scriptContent.includes('optimizeCSS') && 
                                scriptContent.includes('optimizeCSSFile');
      
      this.testResults.phase1.css = hasCSSOptimization;
      console.log(`    ✓ CSS optimization script: ${hasCSSOptimization ? 'READY' : 'NEEDS ENABLING'}`);
      
    } catch (error) {
      console.log('    ❌ CSS optimization test failed:', error.message);
      this.testResults.errors.push(`CSS optimization: ${error.message}`);
    }
  }

  async testPhase2() {
    console.log('\n📋 Phase 2: Image Optimization Tests');
    
    // Test image compression
    await this.testImageCompression();
    
    // Test image format support
    await this.testImageFormats();
  }

  async testImageCompression() {
    console.log('  🖼️  Testing image compression...');
    
    try {
      const buildDir = path.join(projectRoot, 'dist');
      const imageFiles = await this.findFiles(path.join(buildDir, 'assets/images'), ['.jpg', '.jpeg', '.png', '.webp']);
      
      if (imageFiles.length > 0) {
        console.log(`    📊 Found ${imageFiles.length} image file(s)`);
        
        // Check if images have reasonable sizes (basic heuristic)
        let totalSize = 0;
        for (const imagePath of imageFiles) {
          const stats = await fs.stat(imagePath);
          totalSize += stats.size;
        }
        
        const avgSize = totalSize / imageFiles.length;
        const reasonablyOptimized = avgSize < 500000; // Less than 500KB average
        
        this.testResults.phase2.compression = reasonablyOptimized;
        console.log(`    ✓ Image compression: ${reasonablyOptimized ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);
        console.log(`    📊 Average image size: ${this.formatBytes(avgSize)}`);
      } else {
        console.log('    ⚠️  No image files found in build output');
      }
      
    } catch (error) {
      console.log('    ❌ Image compression test failed:', error.message);
      this.testResults.errors.push(`Image compression: ${error.message}`);
    }
  }

  async testImageFormats() {
    console.log('  🌐 Testing image format support...');
    
    try {
      const buildDir = path.join(projectRoot, 'dist');
      const webpFiles = await this.findFiles(path.join(buildDir, 'assets/images'), '.webp');
      
      this.testResults.phase2.formats = webpFiles.length > 0;
      console.log(`    ✓ WebP format support: ${webpFiles.length > 0 ? 'AVAILABLE' : 'NOT IMPLEMENTED'}`);
      
    } catch (error) {
      console.log('    ❌ Image format test failed:', error.message);
      this.testResults.errors.push(`Image formats: ${error.message}`);
    }
  }

  async testPhase3() {
    console.log('\n📋 Phase 3: Enhanced Asset Processing Tests');
    
    // Test asset path processing
    await this.testAssetPaths();
    
    // Test cache busting
    await this.testCacheBusting();
    
    // Test preloading
    await this.testPreloading();
  }

  async testAssetPaths() {
    console.log('  🔗 Testing asset path processing...');
    
    try {
      const viteConfig = path.join(projectRoot, 'vite.config.js');
      const configContent = await fs.readFile(viteConfig, 'utf8');
      
      // Check if enhanced asset processor is enabled
      const assetProcessorEnabled = !configContent.includes('enhanced-asset-processor') ||
                                  !configContent.includes('/*');
      
      this.testResults.phase3.assetPaths = assetProcessorEnabled;
      console.log(`    ✓ Asset path processing: ${assetProcessorEnabled ? 'ENABLED' : 'COMMENTED OUT'}`);
      
    } catch (error) {
      console.log('    ❌ Asset path test failed:', error.message);
      this.testResults.errors.push(`Asset paths: ${error.message}`);
    }
  }

  async testCacheBusting() {
    console.log('  🗂️  Testing cache busting...');
    
    try {
      const buildDir = path.join(projectRoot, 'dist');
      const htmlFiles = await this.findFiles(buildDir, '.html');
      
      if (htmlFiles.length > 0) {
        const htmlContent = await fs.readFile(htmlFiles[0], 'utf8');
        const hasCacheBusting = htmlContent.includes('?v=') || htmlContent.includes('-hash');
        
        this.testResults.phase3.caching = hasCacheBusting;
        console.log(`    ✓ Cache busting: ${hasCacheBusting ? 'IMPLEMENTED' : 'NOT IMPLEMENTED'}`);
      }
      
    } catch (error) {
      console.log('    ❌ Cache busting test failed:', error.message);
      this.testResults.errors.push(`Cache busting: ${error.message}`);
    }
  }

  async testPreloading() {
    console.log('  🚀 Testing asset preloading...');
    
    try {
      const buildDir = path.join(projectRoot, 'dist');
      const htmlFiles = await this.findFiles(buildDir, '.html');
      
      if (htmlFiles.length > 0) {
        const htmlContent = await fs.readFile(htmlFiles[0], 'utf8');
        const hasPreloading = htmlContent.includes('rel="preload"') || 
                            htmlContent.includes('rel="modulepreload"');
        
        this.testResults.phase3.preloading = hasPreloading;
        console.log(`    ✓ Asset preloading: ${hasPreloading ? 'IMPLEMENTED' : 'NOT IMPLEMENTED'}`);
      }
      
    } catch (error) {
      console.log('    ❌ Preloading test failed:', error.message);
      this.testResults.errors.push(`Preloading: ${error.message}`);
    }
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      recommendations: this.getRecommendations()
    };
    
    await fs.writeFile(
      path.join(projectRoot, 'optimization-test-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  getRecommendations() {
    const recommendations = [];
    
    // Phase 1 recommendations
    if (!this.testResults.phase1.css) {
      recommendations.push('Enable CSS optimization in deployment script');
    }
    
    // Phase 2 recommendations
    if (!this.testResults.phase2.compression) {
      recommendations.push('Implement image compression optimization');
    }
    if (!this.testResults.phase2.formats) {
      recommendations.push('Add WebP format support for images');
    }
    
    // Phase 3 recommendations
    if (!this.testResults.phase3.assetPaths) {
      recommendations.push('Enable enhanced asset processor in vite.config.js');
    }
    if (!this.testResults.phase3.caching) {
      recommendations.push('Implement cache busting for assets');
    }
    if (!this.testResults.phase3.preloading) {
      recommendations.push('Add intelligent asset preloading');
    }
    
    return recommendations;
  }

  // Utility methods
  async findFiles(dir, extensions) {
    if (!await fs.pathExists(dir)) return [];
    
    const files = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const subFiles = await this.findFiles(itemPath, extensions);
        files.push(...subFiles);
      } else if (stats.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (typeof extensions === 'string' && ext === extensions) {
          files.push(itemPath);
        } else if (Array.isArray(extensions) && extensions.includes(ext)) {
          files.push(itemPath);
        }
      }
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
    console.log('\n📊 Test Results Summary:');
    console.log(`  Phase 1 (CSS): ${this.getPhaseScore(this.testResults.phase1)}/3`);
    console.log(`  Phase 2 (Images): ${this.getPhaseScore(this.testResults.phase2)}/3`);
    console.log(`  Phase 3 (Asset Processing): ${this.getPhaseScore(this.testResults.phase3)}/3`);
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${this.testResults.errors.length}`);
      this.testResults.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    console.log('\n💡 See optimization-test-report.json for detailed results and recommendations');
  }

  getPhaseScore(phase) {
    return Object.values(phase).filter(Boolean).length;
  }
}

// Run tests if called directly
if (process.argv[1] === __filename) {
  const tester = new OptimizationTester();
  tester.runTests().catch(console.error);
}

export { OptimizationTester };
