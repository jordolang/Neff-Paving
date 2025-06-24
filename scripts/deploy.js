#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFile, mkdir, copyFile, readdir, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Deployment configuration
const deployConfig = {
  buildDir: 'dist',
  assetsDir: 'assets',
  optimizations: {
    images: true,
    videos: true,
    css: true,
    js: true,
    html: true
  },
  seo: {
    generateSitemap: true,
    generateRobots: true,
    generateManifest: true
  },
  performance: {
    gzip: true,
    brotli: true,
    preload: true,
    prefetch: true
  }
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function execCommand(command, options = {}) {
  try {
    log(`🔧 Running: ${command}`, 'blue')
    return execSync(command, { 
      cwd: projectRoot, 
      encoding: 'utf8',
      stdio: 'inherit',
      ...options 
    })
  } catch (error) {
    log(`❌ Command failed: ${command}`, 'red')
    throw error
  }
}

async function installDependencies() {
  log('📦 Installing dependencies...', 'yellow')
  
  try {
    execCommand('npm ci --production=false')
    log('✅ Dependencies installed successfully', 'green')
  } catch (error) {
    log('⚠️  npm ci failed, trying npm install', 'yellow')
    execCommand('npm install')
  }
}

async function runOptimizations() {
  log('🚀 Running optimizations...', 'yellow')
  
  if (deployConfig.optimizations.images) {
    try {
      execCommand('npm run optimize-images')
      log('✅ Images optimized', 'green')
    } catch (error) {
      log('⚠️  Image optimization failed', 'yellow')
    }
  }
  
  if (deployConfig.optimizations.videos) {
    try {
      execCommand('npm run compress-videos')
      log('✅ Videos compressed', 'green')
    } catch (error) {
      log('⚠️  Video compression failed', 'yellow')
    }
  }
}

async function buildProject() {
  log('🏗️  Building project...', 'yellow')
  
  try {
    execCommand('npm run build')
    log('✅ Project built successfully', 'green')
  } catch (error) {
    log('❌ Build failed', 'red')
    throw error
  }
}

async function generateSEOFiles() {
  if (!deployConfig.seo.generateSitemap) return
  
  log('🗺️  Generating SEO files...', 'yellow')
  
  try {
    execCommand('npm run generate-sitemap')
    log('✅ SEO files generated', 'green')
  } catch (error) {
    log('⚠️  SEO generation failed', 'yellow')
  }
}

async function generateWebManifest() {
  if (!deployConfig.seo.generateManifest) return
  
  log('📱 Generating web manifest...', 'yellow')
  
  const manifest = {
    name: 'Neff Paving - Professional Paving Services',
    short_name: 'Neff Paving',
    description: 'Expert paving contractors with 35+ years experience. Residential driveways, commercial parking lots, maintenance services.',
    start_url: '/',
    display: 'standalone',
    background_color: '#2C2C2C',
    theme_color: '#FFD700',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/assets/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/assets/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ],
    categories: ['business', 'construction', 'utilities'],
    lang: 'en-US',
    dir: 'ltr'
  }
  
  try {
    const manifestPath = join(projectRoot, deployConfig.buildDir, 'site.webmanifest')
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    log('✅ Web manifest generated', 'green')
  } catch (error) {
    log('⚠️  Web manifest generation failed', 'yellow')
  }
}

async function optimizeAssets() {
  log('⚡ Optimizing build assets...', 'yellow')
  
  const buildPath = join(projectRoot, deployConfig.buildDir)
  
  // Generate compressed versions if enabled
  if (deployConfig.performance.gzip || deployConfig.performance.brotli) {
    try {
      const files = await getFilesToCompress(buildPath)
      
      for (const file of files) {
        if (deployConfig.performance.gzip) {
          try {
            execCommand(`gzip -9 -c "${file}" > "${file}.gz"`)
          } catch (error) {
            log(`⚠️  Gzip compression failed for ${file}`, 'yellow')
          }
        }
        
        if (deployConfig.performance.brotli) {
          try {
            execCommand(`brotli -Z -c "${file}" > "${file}.br"`)
          } catch (error) {
            log(`⚠️  Brotli compression failed for ${file}`, 'yellow')
          }
        }
      }
      
      log('✅ Asset compression completed', 'green')
    } catch (error) {
      log('⚠️  Asset compression failed', 'yellow')
    }
  }
}

async function getFilesToCompress(dir) {
  const files = []
  const entries = await readdir(dir)
  
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = await stat(fullPath)
    
    if (stats.isDirectory()) {
      const subFiles = await getFilesToCompress(fullPath)
      files.push(...subFiles)
    } else if (shouldCompress(entry)) {
      files.push(fullPath)
    }
  }
  
  return files
}

function shouldCompress(filename) {
  const compressibleExtensions = ['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']
  return compressibleExtensions.some(ext => filename.endsWith(ext))
}

async function generateHTTPSRedirectRules() {
  log('🔐 Generating HTTPS redirect rules...', 'yellow')
  
  const htaccess = `# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 6 months"
    ExpiresByType image/jpg "access plus 6 months"
    ExpiresByType image/jpeg "access plus 6 months"
    ExpiresByType image/gif "access plus 6 months"
    ExpiresByType image/webp "access plus 6 months"
    ExpiresByType image/avif "access plus 6 months"
    ExpiresByType video/mp4 "access plus 6 months"
    ExpiresByType video/webm "access plus 6 months"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/html "access plus 1 day"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
</IfModule>

# Error pages
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html`
  
  try {
    const htaccessPath = join(projectRoot, deployConfig.buildDir, '.htaccess')
    await writeFile(htaccessPath, htaccess)
    log('✅ HTTPS redirect rules generated', 'green')
  } catch (error) {
    log('⚠️  HTTPS rules generation failed', 'yellow')
  }
}

async function runPerformanceTests() {
  log('🔍 Running performance tests...', 'yellow')
  
  try {
    // Run Lighthouse tests
    execCommand('npm run test:lighthouse', { stdio: 'inherit' })
    log('✅ Performance tests completed', 'green')
  } catch (error) {
    log('⚠️  Performance tests failed - check reports for details', 'yellow')
  }
}

async function generateDeploymentSummary() {
  log('📊 Generating deployment summary...', 'yellow')
  
  const buildPath = join(projectRoot, deployConfig.buildDir)
  const summary = {
    timestamp: new Date().toISOString(),
    buildDirectory: deployConfig.buildDir,
    optimizations: deployConfig.optimizations,
    seo: deployConfig.seo,
    performance: deployConfig.performance,
    files: []
  }
  
  try {
    const files = await getAllFiles(buildPath)
    for (const file of files) {
      const stats = await stat(file)
      const relativePath = file.replace(buildPath + '/', '')
      summary.files.push({
        path: relativePath,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        modified: stats.mtime.toISOString()
      })
    }
    
    const summaryPath = join(buildPath, 'deployment-summary.json')
    await writeFile(summaryPath, JSON.stringify(summary, null, 2))
    
    // Console summary
    log('\\n📋 Deployment Summary:', 'bright')
    log(`🕐 Timestamp: ${summary.timestamp}`, 'blue')
    log(`📁 Build Directory: ${summary.buildDirectory}`, 'blue')
    log(`📄 Total Files: ${summary.files.length}`, 'blue')
    
    const totalSize = summary.files.reduce((sum, file) => sum + file.size, 0)
    log(`💾 Total Size: ${formatBytes(totalSize)}`, 'blue')
    
    log('✅ Deployment summary generated', 'green')
  } catch (error) {
    log('⚠️  Deployment summary generation failed', 'yellow')
  }
}

async function getAllFiles(dir) {
  const files = []
  const entries = await readdir(dir)
  
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = await stat(fullPath)
    
    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath)
      files.push(...subFiles)
    } else {
      files.push(fullPath)
    }
  }
  
  return files
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function validateDeployment() {
  log('✅ Validating deployment...', 'yellow')
  
  const buildPath = join(projectRoot, deployConfig.buildDir)
  const requiredFiles = [
    'index.html',
    'sitemap.xml',
    'robots.txt',
    'site.webmanifest'
  ]
  
  let isValid = true
  
  for (const file of requiredFiles) {
    try {
      await stat(join(buildPath, file))
      log(`✓ ${file} found`, 'green')
    } catch (error) {
      log(`✗ ${file} missing`, 'red')
      isValid = false
    }
  }
  
  return isValid
}

async function main() {
  log('🚀 Starting production deployment process...', 'bright')
  
  try {
    // Pre-build steps
    await installDependencies()
    await runOptimizations()
    
    // Build process
    await buildProject()
    
    // Post-build optimizations
    await generateSEOFiles()
    await generateWebManifest()
    await generateHTTPSRedirectRules()
    await optimizeAssets()
    
    // Validation and testing
    const isValid = await validateDeployment()
    if (!isValid) {
      log('❌ Deployment validation failed', 'red')
      process.exit(1)
    }
    
    // Optional performance testing
    if (process.argv.includes('--test')) {
      await runPerformanceTests()
    }
    
    // Final summary
    await generateDeploymentSummary()
    
    log('\\n🎉 Production deployment completed successfully!', 'bright')
    log('\\n📋 Next steps:', 'yellow')
    log('1. Upload the dist/ folder to your web server', 'blue')
    log('2. Configure your web server for HTTPS', 'blue')
    log('3. Set up DNS records', 'blue')
    log('4. Submit sitemap.xml to Google Search Console', 'blue')
    log('5. Test the deployed site thoroughly', 'blue')
    
  } catch (error) {
    log(`\\n❌ Deployment failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as deployProduction }
