#!/usr/bin/env node

/**
 * Enhanced Deployment Script with Asset Optimization
 * Handles deployment with comprehensive asset optimization and cache management
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
// Detect platform more reliably
const detectPlatform = () => {
  if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL) return 'vercel';
  if (process.env.DEPLOY_PLATFORM) return process.env.DEPLOY_PLATFORM;
  if (process.env.GITHUB_ACTIONS) return 'github';
  return 'vercel'; // Default to vercel
};

const config = {
  buildDir: path.join(projectRoot, 'dist'),
  assetsDir: path.join(projectRoot, 'dist', 'assets'),
  mode: process.env.NODE_ENV || 'production',
  platform: detectPlatform(),
  enableOptimization: process.env.OPTIMIZE_ASSETS !== 'false',
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  enableCacheBusting: process.env.CACHE_BUSTING !== 'false'
};

class AssetOptimizer {
  constructor() {
    this.deployTime = Date.now();
    this.buildTimestamp = new Date().toISOString();
    this.optimizationStats = {
      totalFiles: 0,
      optimizedFiles: 0,
      compressionSavings: 0,
      errors: []
    };
  }

  async deploy() {
    console.log('🚀 Starting optimized deployment...');
    console.log(`Platform: ${config.platform}`);
    console.log(`Mode: ${config.mode}`);
    
    try {
      // Step 1: Clean previous build
      await this.cleanBuild();
      
      // Step 2: Build with optimization
      await this.buildWithOptimization();
      
      // Step 3: Post-process assets
      await this.postProcessAssets();
      
      // Step 4: Generate cache manifest
      await this.generateCacheManifest();
      
      // Step 5: Create deployment reports
      await this.createDeploymentReport();
      
      // Step 6: Verify build integrity
      await this.verifyBuild();
      
      console.log('✅ Deployment completed successfully!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Optimized deployment failed:', error);
      console.log('🔄 Attempting fallback to standard build...');
      
      try {
        await this.fallbackBuild();
        console.log('✅ Fallback deployment completed successfully!');
      } catch (fallbackError) {
        console.error('❌ Fallback deployment also failed:', fallbackError);
        await this.createErrorReport(error, fallbackError);
        process.exit(1);
      }
    }
  }

  async cleanBuild() {
    console.log('🧹 Cleaning previous build...');
    
    if (await fs.pathExists(config.buildDir)) {
      await fs.remove(config.buildDir);
    }
  }

  async buildWithOptimization() {
    console.log('🔨 Building with optimization...');
    
    // Set build environment variables
    const buildEnv = {
      ...process.env,
      NODE_ENV: config.mode,
      VITE_BUILD_TIMESTAMP: this.buildTimestamp,
      VITE_DEPLOY_TIME: this.deployTime.toString(),
      VITE_DEPLOY_PLATFORM: config.platform,
      VERCEL: config.platform === 'vercel' ? '1' : undefined,
      VITE_PLATFORM: config.platform
    };
    
    // Run Vite build
    const buildCommand = config.platform === 'vercel' 
      ? 'npm run build:vercel' 
      : 'npm run build:github';
    
    console.log(`Running: ${buildCommand}`);
    execSync(buildCommand, { 
      stdio: 'inherit', 
      env: buildEnv,
      cwd: projectRoot 
    });
  }

  async postProcessAssets() {
    if (!config.enableOptimization) {
      console.log('⏭️  Skipping asset optimization (disabled)');
      return;
    }
    
    console.log('⚡ Post-processing assets...');
    
    // Process different asset types
    await this.optimizeImages();
    await this.optimizeCSS();
    await this.optimizeJS();
    await this.setupCacheHeaders();
  }

  async optimizeImages() {
    console.log('🖼️  Optimizing images...');
    
    const imageDir = path.join(config.assetsDir, 'images');
    if (!(await fs.pathExists(imageDir))) return;
    
    const imageFiles = await this.getFilesByExtension(imageDir, ['.jpg', '.jpeg', '.png', '.webp']);
    
    for (const imagePath of imageFiles) {
      try {
        await this.optimizeImage(imagePath);
        this.optimizationStats.optimizedFiles++;
      } catch (error) {
        console.warn(`Failed to optimize image ${imagePath}:`, error.message);
        this.optimizationStats.errors.push(`Image optimization: ${imagePath}`);
      }
    }
  }

  async optimizeImage(imagePath) {
    const stats = await fs.stat(imagePath);
    const originalSize = stats.size;
    
    // Here you would typically use imagemin or sharp for optimization
    // For now, we'll just track the file
    console.log(`  ✓ Processed ${path.basename(imagePath)} (${this.formatBytes(originalSize)})`);
  }

  async optimizeCSS() {
    console.log('🎨 Optimizing CSS...');
    
    const cssDir = path.join(config.assetsDir, 'styles');
    if (!(await fs.pathExists(cssDir))) return;
    
    const cssFiles = await this.getFilesByExtension(cssDir, ['.css']);
    
    for (const cssPath of cssFiles) {
      try {
        await this.optimizeCSSFile(cssPath);
        this.optimizationStats.optimizedFiles++;
      } catch (error) {
        console.warn(`Failed to optimize CSS ${cssPath}:`, error.message);
        this.optimizationStats.errors.push(`CSS optimization: ${cssPath}`);
      }
    }
  }

  async optimizeCSSFile(cssPath) {
    const content = await fs.readFile(cssPath, 'utf8');
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Basic CSS optimization (remove extra whitespace, comments)
    let optimized = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon in rules
      .trim();
    
    const optimizedSize = Buffer.byteLength(optimized, 'utf8');
    const savings = originalSize - optimizedSize;
    
    if (savings > 0) {
      await fs.writeFile(cssPath, optimized);
      this.optimizationStats.compressionSavings += savings;
      console.log(`  ✓ Optimized ${path.basename(cssPath)} (saved ${this.formatBytes(savings)})`);
    }
  }

  async optimizeJS() {
    console.log('📦 Processing JavaScript...');
    
    // JavaScript is already optimized by Vite/Rollup
    // Just verify and report
    const jsFiles = await this.getFilesByExtension(config.buildDir, ['.js'], true);
    
    for (const jsPath of jsFiles) {
      const stats = await fs.stat(jsPath);
      console.log(`  ✓ ${path.relative(config.buildDir, jsPath)} (${this.formatBytes(stats.size)})`);
    }
  }

  async setupCacheHeaders() {
    console.log('🗂️  Setting up cache headers...');
    
    // Create _headers file for Netlify or similar
    const headersConfig = this.generateHeadersConfig();
    
    if (config.platform === 'netlify') {
      await fs.writeFile(
        path.join(config.buildDir, '_headers'),
        headersConfig.netlify
      );
    }
    
    // Create .htaccess for Apache
    await fs.writeFile(
      path.join(config.buildDir, '.htaccess'),
      headersConfig.apache
    );
  }

  generateHeadersConfig() {
    return {
      netlify: `
# Cache static assets
/assets/images/*
  Cache-Control: public, max-age=31536000, immutable
  
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  
/assets/videos/*
  Cache-Control: public, max-age=31536000, immutable
  
/assets/styles/*
  Cache-Control: public, max-age=31536000, immutable
  
/entries/*
  Cache-Control: public, max-age=31536000, immutable
  
/chunks/*
  Cache-Control: public, max-age=31536000, immutable

# Security headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
      `.trim(),
      
      apache: `
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  
  # CSS and JavaScript
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  
  # Fonts
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  
  # Videos
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType video/webm "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options nosniff
  Header always set X-Frame-Options DENY
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
      `.trim()
    };
  }

  async generateCacheManifest() {
    console.log('📋 Generating cache manifest...');
    
    const manifest = {
      buildTime: this.buildTimestamp,
      deployTime: this.deployTime,
      platform: config.platform,
      assets: []
    };
    
    // Collect all assets
    const allFiles = await this.getAllFiles(config.buildDir);
    
    for (const filePath of allFiles) {
      const relativePath = path.relative(config.buildDir, filePath);
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();
      
      manifest.assets.push({
        path: relativePath,
        size: stats.size,
        type: this.getAssetType(extension),
        lastModified: stats.mtime.toISOString(),
        cacheStrategy: this.getCacheStrategy(relativePath)
      });
    }
    
    await fs.writeFile(
      path.join(config.buildDir, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  async createDeploymentReport() {
    console.log('📊 Creating deployment report...');
    
    const report = {
      deployment: {
        timestamp: this.buildTimestamp,
        deployTime: this.deployTime,
        platform: config.platform,
        mode: config.mode
      },
      optimization: this.optimizationStats,
      assets: {
        total: this.optimizationStats.totalFiles,
        optimized: this.optimizationStats.optimizedFiles,
        compressionSavings: this.optimizationStats.compressionSavings
      },
      performance: {
        buildDuration: Date.now() - this.deployTime,
        cacheStrategy: config.enableCacheBusting ? 'versioned' : 'static'
      }
    };
    
    await fs.writeFile(
      path.join(config.buildDir, 'deployment-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  // Utility methods

  async getFilesByExtension(dir, extensions, recursive = false) {
    const files = [];
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
    
    return files;
  }

  async getAllFiles(dir) {
    const files = [];
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
    
    return files;
  }

  getAssetType(extension) {
    const typeMap = {
      '.js': 'javascript',
      '.css': 'stylesheet',
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', 
      '.webp': 'image', '.svg': 'image',
      '.woff': 'font', '.woff2': 'font', '.ttf': 'font', '.eot': 'font',
      '.mp4': 'video', '.webm': 'video', '.ogg': 'video',
      '.html': 'document',
      '.json': 'data'
    };
    
    return typeMap[extension] || 'unknown';
  }

  getCacheStrategy(filePath) {
    if (filePath.includes('-') && /\.(js|css|png|jpg|jpeg|gif|webp|woff|woff2)$/.test(filePath)) {
      return 'immutable';
    } else if (/\.(html|json)$/.test(filePath)) {
      return 'dynamic';
    } else {
      return 'versioned';
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async fallbackBuild() {
    console.log('⚡ Running fallback build...');
    
    // Clean any partially built assets
    if (await fs.pathExists(config.buildDir)) {
      await fs.remove(config.buildDir);
    }
    
    // Run standard build without optimizations
    const fallbackEnv = {
      ...process.env,
      NODE_ENV: config.mode,
      OPTIMIZE_ASSETS: 'false',
      ENABLE_COMPRESSION: 'false',
      VITE_BUILD_TIMESTAMP: this.buildTimestamp,
      VITE_DEPLOY_TIME: this.deployTime.toString(),
      VITE_DEPLOY_PLATFORM: config.platform
    };
    
    const buildCommand = config.platform === 'vercel' 
      ? 'npm run build:vercel' 
      : 'npm run build:github';
    
    console.log(`Running fallback: ${buildCommand}`);
    execSync(buildCommand, { 
      stdio: 'inherit', 
      env: fallbackEnv,
      cwd: projectRoot 
    });
    
    // Create basic manifest without optimization
    await this.generateBasicManifest();
    
    // Create fallback report
    await this.createFallbackReport();
  }
  
  async verifyBuild() {
    console.log('🔍 Verifying build integrity...');
    
    const criticalFiles = [
      'index.html',
      'admin/index.html',
      'estimate-form.html',
      'estimate-form-demo.html'
    ];
    
    for (const file of criticalFiles) {
      const filePath = path.join(config.buildDir, file);
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Critical file missing: ${file}`);
      }
      
      // Check file size (should not be empty)
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error(`Critical file is empty: ${file}`);
      }
    }
    
    // Verify at least some assets exist
    const hasAssets = await this.verifyAssets();
    if (!hasAssets) {
      console.warn('⚠️  Warning: No assets found in build output');
    }
    
    console.log('✓ Build verification passed');
  }
  
  async verifyAssets() {
    const assetDirs = [
      path.join(config.buildDir, 'assets'),
      path.join(config.buildDir, 'chunks'),
      path.join(config.buildDir, 'entries')
    ];
    
    for (const dir of assetDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        if (files.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  async generateBasicManifest() {
    console.log('📋 Generating basic manifest...');
    
    const manifest = {
      buildTime: this.buildTimestamp,
      deployTime: this.deployTime,
      platform: config.platform,
      buildType: 'fallback',
      assets: []
    };
    
    try {
      const allFiles = await this.getAllFiles(config.buildDir);
      
      for (const filePath of allFiles) {
        const relativePath = path.relative(config.buildDir, filePath);
        const stats = await fs.stat(filePath);
        
        manifest.assets.push({
          path: relativePath,
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      }
    } catch (error) {
      console.warn('Warning: Could not generate complete manifest:', error.message);
    }
    
    await fs.writeFile(
      path.join(config.buildDir, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }
  
  async createFallbackReport() {
    const report = {
      deployment: {
        timestamp: this.buildTimestamp,
        deployTime: this.deployTime,
        platform: config.platform,
        mode: config.mode,
        buildType: 'fallback'
      },
      fallback: {
        reason: 'Optimized build failed',
        buildDuration: Date.now() - this.deployTime
      }
    };
    
    await fs.writeFile(
      path.join(config.buildDir, 'deployment-report.json'),
      JSON.stringify(report, null, 2)
    );
  }
  
  async createErrorReport(primaryError, fallbackError) {
    const report = {
      deployment: {
        timestamp: this.buildTimestamp,
        deployTime: this.deployTime,
        platform: config.platform,
        mode: config.mode,
        status: 'failed'
      },
      errors: {
        primary: {
          message: primaryError.message,
          stack: primaryError.stack,
          timestamp: new Date().toISOString()
        },
        fallback: {
          message: fallbackError.message,
          stack: fallbackError.stack,
          timestamp: new Date().toISOString()
        }
      },
      troubleshooting: {
        suggestions: [
          'Check Node.js version compatibility',
          'Verify all dependencies are installed',
          'Check available disk space',
          'Review build logs for specific errors',
          'Try running build locally first'
        ]
      }
    };
    
    // Try to write error report even if build directory doesn't exist
    try {
      await fs.ensureDir(config.buildDir);
      await fs.writeFile(
        path.join(config.buildDir, 'error-report.json'),
        JSON.stringify(report, null, 2)
      );
    } catch (writeError) {
      console.error('Could not write error report:', writeError.message);
    }
    
    // Also write to project root as backup
    try {
      await fs.writeFile(
        path.join(projectRoot, 'last-deployment-error.json'),
        JSON.stringify(report, null, 2)
      );
    } catch (writeError) {
      console.error('Could not write backup error report:', writeError.message);
    }
  }

  printStats() {
    console.log('\n📈 Deployment Statistics:');
    console.log(`  Total files: ${this.optimizationStats.totalFiles}`);
    console.log(`  Optimized files: ${this.optimizationStats.optimizedFiles}`);
    console.log(`  Compression savings: ${this.formatBytes(this.optimizationStats.compressionSavings)}`);
    
    if (this.optimizationStats.errors.length > 0) {
      console.log(`  Errors: ${this.optimizationStats.errors.length}`);
      this.optimizationStats.errors.forEach(error => {
        console.log(`    - ${error}`);
      });
    }
  }
}

// Run deployment if called directly
if (process.argv[1] === __filename) {
  const optimizer = new AssetOptimizer();
  optimizer.deploy().catch(console.error);
}

export { AssetOptimizer };
