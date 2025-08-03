# Vercel Deployment Guide - Neff Paving

## Overview

This comprehensive guide covers deploying the Neff Paving website to Vercel, including setup, configuration, environment variables, and troubleshooting. The deployment process is optimized for static site hosting with performance enhancements and proper asset management.

## Prerequisites

Before deploying to Vercel, ensure you have:

- [Vercel CLI](https://vercel.com/docs/cli) installed globally
- Node.js 18+ and npm 9+
- Git repository with the project code
- Access to required API keys and environment variables
- Vercel account with appropriate permissions

### Installation Commands

```bash
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version

# Login to Vercel
vercel login
```

## Initial Setup

### 1. Project Initialization

```bash
# Navigate to project directory
cd ~/Repos/Neff-Paving

# Initialize Vercel project
vercel

# Follow the prompts:
# ? Set up and deploy? [Y/n] y
# ? Which scope? (your-username)
# ? Link to existing project? [y/N] n
# ? What's your project's name? neff-paving
# ? In which directory is your code located? ./
```

### 2. Verify Project Configuration

The deployment process uses these key files:

**vercel.json** (already configured):
```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production",
    "DEPLOY_PLATFORM": "vercel",
    "VITE_PLATFORM": "vercel",
    "VERCEL": "1"
  },
  "cleanUrls": true,
  "trailingSlash": false
}
```

**package.json** build script:
```json
{
  "scripts": {
    "vercel-build": "cross-env VERCEL=1 VERCEL_ENV=production DEPLOY_PLATFORM=vercel VITE_PLATFORM=vercel node scripts/deploy-optimized.js"
  }
}
```

## Environment Variables Configuration

### 1. Required Environment Variables

Set up the following environment variables in your Vercel dashboard:

```bash
# Core Platform Configuration
NODE_ENV=production
DEPLOY_PLATFORM=vercel
VITE_PLATFORM=vercel
VERCEL=1

# Google Maps API (Required for map functionality)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API (Optional - for future API integration)
VITE_BACKEND_URL=https://your-api-domain.vercel.app/api

# Stripe Integration (Optional - for payment processing)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key

# Calendly Integration (Optional - for scheduling)
CALENDLY_API_KEY=your_calendly_api_key
CALENDLY_WEBHOOK_KEY=your_calendly_webhook_key
CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_uuid
CALENDLY_ACCESS_TOKEN=your_calendly_access_token

# Email Service (Optional - for notifications)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# Database (Optional - for future backend integration)
DATABASE_URL=postgresql://user:password@host:port/neff_paving_admin
```

### 2. Setting Environment Variables via CLI

```bash
# Set production environment variables
vercel env add VITE_GOOGLE_MAPS_API_KEY production
vercel env add NODE_ENV production
vercel env add DEPLOY_PLATFORM production
vercel env add VITE_PLATFORM production

# Set preview environment variables (optional)
vercel env add VITE_GOOGLE_MAPS_API_KEY preview
vercel env add DEPLOY_PLATFORM preview

# List all environment variables
vercel env ls
```

### 3. Setting Environment Variables via Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate scope (Production, Preview, Development)

## Deployment Process

### 1. Automatic Deployment (Recommended)

**Git Integration Setup:**
1. Connect your repository to Vercel
2. Vercel automatically deploys on every push to main branch
3. Preview deployments created for pull requests

```bash
# Connect Git repository (if not already connected)
vercel --prod

# Check deployment status
vercel ls
```

### 2. Manual Deployment

**Development/Testing Deployment:**
```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

**Build and Deploy Process:**
```bash
# Local build verification
npm run vercel-build

# Test build locally
npm run preview

# Deploy after verification
vercel --prod
```

### 3. Deployment Verification

After deployment, verify the following:

**✅ Asset Loading:**
- Check that all gallery images load correctly
- Verify video files play properly
- Confirm CSS and JavaScript files load

**✅ Functionality Testing:**
- Test estimate form submissions
- Verify contact form functionality
- Check interactive gallery and lightbox
- Test area calculation tools (if Google Maps API is configured)

**✅ Performance Metrics:**
- Check Core Web Vitals in Vercel dashboard
- Verify page load speeds
- Test mobile responsiveness

## Build Configuration Details

### Build Process Overview

The `vercel-build` script runs the following optimized process:

1. **Environment Detection:** Automatically detects Vercel environment
2. **Asset Optimization:** Compresses and optimizes all assets
3. **Gallery Processing:** Copies gallery structure with original paths
4. **Cache Headers:** Generates appropriate cache headers
5. **Build Verification:** Validates build output integrity

### Build Script Breakdown

```javascript
// scripts/deploy-optimized.js key processes:

// 1. Environment Setup
process.env.VERCEL = '1';
process.env.VITE_PLATFORM = 'vercel';

// 2. Vite Build with Vercel optimizations
await vite.build({
  mode: 'vercel',
  base: '/', // Vercel uses root paths
  // ... optimization settings
});

// 3. Gallery Asset Management
await copyGalleryImages(); // Preserves exact structure

// 4. Build Verification
await verifyBuildOutput();
```

### Asset Optimization Features

**Image Optimization:**
- Automatic WebP conversion for gallery images
- Responsive image generation
- Optimized file sizes with quality preservation

**JavaScript Optimization:**
- Code splitting and tree shaking
- Modern browser targeting (ES2020+)
- Minification with Terser

**CSS Optimization:**
- CSS code splitting for better caching
- Minification and compression
- Critical CSS inlining

## Performance Configuration

### Cache Headers

The deployment includes optimized cache headers:

```json
{
  "headers": [
    {
      "source": "/assets/gallery/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        },
        {
          "key": "Content-Type",
          "value": "image/webp"
        }
      ]
    },
    {
      "source": "/(.*)\\.html$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### CDN Configuration

Vercel automatically provides:
- Global CDN distribution
- Automatic compression (Gzip/Brotli)
- HTTP/2 support
- Edge caching optimization

## Security Configuration

### Security Headers

Implemented security headers:

```json
{
  "headers": [
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options",
      "value": "DENY"
    },
    {
      "key": "X-XSS-Protection",
      "value": "1; mode=block"
    },
    {
      "key": "Referrer-Policy",
      "value": "strict-origin-when-cross-origin"
    },
    {
      "key": "Permissions-Policy",
      "value": "geolocation=(), microphone=(), camera=()"
    }
  ]
}
```

### Environment Security

- Environment variables encrypted at rest
- Secure transmission of sensitive data
- No API keys exposed in client-side code

## Monitoring and Analytics

### Vercel Analytics Integration

The project includes Vercel Analytics for:
- Page view tracking
- Performance monitoring
- User interaction analytics
- Core Web Vitals monitoring

**Configuration:**
```javascript
// Already integrated in the project
import { analytics } from '@vercel/analytics';
analytics.track('page_view');
```

### Performance Monitoring

Monitor key metrics:

1. **Core Web Vitals:**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - First Input Delay (FID)

2. **Custom Metrics:**
   - Gallery load times
   - Form submission success rates
   - Video playback metrics

## Custom Domain Setup

### 1. Domain Configuration

```bash
# Add custom domain
vercel domains add yourdomain.com

# Add www subdomain
vercel domains add www.yourdomain.com
```

### 2. DNS Configuration

Configure your DNS provider:

**A Record:**
```
Type: A
Name: @
Value: 76.76.19.61
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provides SSL certificates:
- Automatic HTTPS redirect
- Let's Encrypt certificates
- Automatic renewal

## Troubleshooting

### Common Issues and Solutions

**1. Build Failures**

```bash
# Check build logs
vercel logs

# Test build locally
npm run vercel-build

# Clear cache and rebuild
vercel --prod --force
```

**2. Asset Path Issues**

Verify environment variables:
```bash
vercel env ls

# Check if VERCEL=1 is set
echo $VERCEL
```

**3. Gallery Images Not Loading**

Check build output:
```bash
# Verify gallery directory structure
ls -la dist/assets/gallery/

# Check file permissions
find dist/assets/gallery/ -type f -exec ls -la {} \;
```

**4. Environment Variable Issues**

```bash
# Pull environment variables locally
vercel env pull .env.local

# Verify variables are set
vercel env ls
```

### Debug Commands

```bash
# Inspect deployment
vercel inspect [deployment-url]

# View deployment logs
vercel logs [deployment-url]

# Test configuration
npm run test:vercel

# Verify build locally
npm run verify:vercel
```

### Performance Issues

**If site loads slowly:**

1. Check Core Web Vitals in Vercel dashboard
2. Verify image optimization is working
3. Check for render-blocking resources
4. Optimize critical CSS loading

**If builds are slow:**

1. Check dependencies for unnecessary packages
2. Verify asset optimization settings
3. Consider build cache optimization

## Deployment Checklist

Before deploying to production:

### Pre-Deployment
- [ ] Environment variables configured
- [ ] API keys secured and valid
- [ ] Build process tested locally
- [ ] Assets optimized and compressed
- [ ] Content review completed

### Deployment
- [ ] Successful build completion
- [ ] All assets loading correctly
- [ ] Forms functioning properly
- [ ] Gallery images displaying
- [ ] Mobile responsiveness verified

### Post-Deployment
- [ ] Performance metrics acceptable
- [ ] Security headers active
- [ ] Analytics tracking working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Ongoing Monitoring
- [ ] Regular performance monitoring
- [ ] Error tracking enabled
- [ ] Build process automation working
- [ ] Backup strategy in place

## Advanced Configuration

### Serverless Functions (Future)

When adding backend functionality:

```javascript
// api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' });
}
```

### Edge Functions (Optional)

For advanced use cases:

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Add custom headers or redirects
  return NextResponse.next();
}
```

### Build Optimization

Advanced build settings in `vercel.json`:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
```

## Support and Resources

### Documentation Links
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Support Channels
- Vercel Support (for platform issues)
- Project Documentation (for configuration issues)
- GitHub Issues (for code-related problems)

### Useful Commands Reference

```bash
# Project management
vercel projects ls                    # List projects
vercel projects rm [project-name]     # Remove project

# Deployment management
vercel ls                            # List deployments
vercel rm [deployment-url]           # Remove deployment

# Domain management
vercel domains ls                    # List domains
vercel domains rm [domain]           # Remove domain

# Certificate management
vercel certs ls                      # List certificates
vercel certs rm [domain]             # Remove certificate
```

This deployment guide provides a complete reference for deploying and maintaining the Neff Paving website on Vercel with optimal performance and security configurations.
