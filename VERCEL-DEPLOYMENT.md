# Vercel Deployment Configuration

This document outlines the complete Vercel deployment setup for the Neff Paving website, including build scripts, environment detection, and asset optimization.

## Overview

The project is configured to automatically detect the Vercel environment and adjust build settings accordingly to ensure optimal deployment performance and correct asset paths.

## Key Components

### 1. Environment Detection

The build system detects Vercel environment through multiple methods:

- `VERCEL=1` - Primary Vercel environment indicator
- `VERCEL_ENV` - Vercel environment type (production, preview, development)
- `VERCEL_URL` - Vercel deployment URL
- `DEPLOY_PLATFORM=vercel` - Explicit platform setting

### 2. Build Scripts

#### `vercel-build` (Primary)
```json
"vercel-build": "cross-env VERCEL=1 VERCEL_ENV=production DEPLOY_PLATFORM=vercel VITE_PLATFORM=vercel node scripts/deploy-optimized.js"
```

This script:
- Sets all necessary environment variables
- Runs the optimized deployment process
- Ensures Vercel-specific configurations are applied

#### Supporting Scripts
- `build:vercel` - Direct Vite build with Vercel mode
- `test:vercel` - Comprehensive test suite for Vercel configuration
- `verify:vercel` - Build verification for Vercel deployments

### 3. Vite Configuration (`vite.config.js`)

The Vite configuration includes Vercel-specific logic:

```javascript
// Base URL Detection
const getBaseUrl = () => {
  if (mode === 'vercel' || process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL) {
    return '/';  // Vercel uses root path
  }
  if (mode === 'github') return '/Neff-Paving/';
  return process.env.VITE_BASE_URL || '/Neff-Paving/';
};

// Build-time defines
__IS_VERCEL__: JSON.stringify(
  mode === 'vercel' || 
  process.env.VITE_PLATFORM === 'vercel' || 
  process.env.VERCEL === '1' || 
  process.env.VERCEL_ENV || 
  process.env.DEPLOY_PLATFORM === 'vercel'
)
```

### 4. Vercel Configuration (`vercel.json`)

The `vercel.json` file configures:

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production",
    "DEPLOY_PLATFORM": "vercel",
    "VITE_PLATFORM": "vercel",
    "VERCEL": "1"
  }
}
```

#### Headers Configuration
- **Assets**: Long-term caching (1 year) for images, fonts, videos, and styles
- **Gallery**: Specific WebP content-type headers
- **HTML**: No-cache for dynamic content
- **Security**: Comprehensive security headers (XSS, CSRF, etc.)

#### Rewrites
- Speed Insights integration
- Clean URL routing
- Estimate form routing

### 5. Asset Optimization

The deployment process includes:

#### Gallery Images
- Automatic copy of `assets/gallery/` directory structure
- Preservation of original paths and filenames
- WebP optimization with proper content-type headers

#### Path Resolution
- **Vercel**: Absolute paths from root (`/assets/...`)
- **GitHub Pages**: Relative paths with base URL (`/Neff-Paving/assets/...`)

#### Cache Busting
- Build timestamp injection: `?v=2025-07-31T15:08:39.988Z`
- Asset hashing for long-term caching
- Manifest generation for cache management

### 6. Build Output Structure

```
dist/
├── assets/
│   ├── gallery/
│   │   ├── commercial/
│   │   ├── residential/
│   │   ├── concrete/
│   │   └── equipment/
│   ├── images/
│   ├── styles/
│   └── videos/
├── chunks/
├── entries/
├── index.html
├── estimate-form.html
├── 404.html
├── asset-manifest.json
└── deployment-report.json
```

## Deployment Process

### 1. Environment Setup
Environment variables are automatically set by the `vercel-build` script:
- `VERCEL=1`
- `VERCEL_ENV=production`
- `DEPLOY_PLATFORM=vercel`
- `VITE_PLATFORM=vercel`

### 2. Build Execution
1. Clean previous build output
2. Run Vite build with Vercel mode
3. Copy gallery images with structure preservation
4. Apply asset optimizations (CSS, images, JS)
5. Generate cache headers and manifest files
6. Verify build integrity

### 3. Asset Processing
- Images: Optimization with size reporting
- CSS: Minification and whitespace removal
- JavaScript: Already optimized by Vite/Rollup
- Cache headers: Automatic generation for different asset types

## Testing

Run the comprehensive test suite:
```bash
npm run test:vercel
```

This tests:
- Environment variable detection
- Build output structure
- Asset path correctness
- Gallery image copying
- Configuration file validity
- Cache header setup

## Environment Variables

### Required for Vercel
- `VERCEL=1` - Enables Vercel-specific configurations
- `VERCEL_ENV` - Environment type (production/preview/development)

### Optional
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps integration
- `VITE_DEPLOY_TARGET` - Deployment target override

## Performance Features

### Caching Strategy
- **Static Assets**: 1 year cache with immutable flag
- **HTML Files**: No-cache for dynamic updates
- **Gallery Images**: Optimized WebP with long-term caching

### Asset Optimization
- Code splitting with manual chunks
- CSS code splitting for better caching
- Modern browser targeting (ES2020+)
- Terser minification with console removal

### Security Headers
- Content Security Policy
- XSS Protection
- Frame Options
- Referrer Policy
- Permissions Policy

## Troubleshooting

### Common Issues

1. **Asset paths not resolving**: Verify `VERCEL=1` is set during build
2. **Gallery images missing**: Check gallery copy process in build logs
3. **Cache issues**: Verify cache-busting parameters are applied
4. **Build failures**: Run `npm run test:vercel` to identify issues

### Debug Commands
```bash
# Test Vercel configuration
npm run test:vercel

# Verify build output
npm run verify:vercel

# Run optimized build locally
npm run vercel-build
```

## Deployment Checklist

- [ ] `vercel.json` configured with correct build command
- [ ] Environment variables set in Vercel dashboard
- [ ] Gallery images present in `assets/gallery/`
- [ ] All HTML files reference correct asset paths
- [ ] Cache headers configured for optimal performance
- [ ] Security headers enabled
- [ ] Build verification tests passing

## Related Files

- `vercel.json` - Vercel platform configuration
- `vite.config.js` - Build tool configuration
- `scripts/deploy-optimized.js` - Deployment script
- `scripts/test-vercel-config.js` - Test suite
- `package.json` - Build scripts and dependencies
