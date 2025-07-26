# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neff Paving is a modern website for a paving company built with:
- **Vite** as the build tool
- **Vanilla JavaScript (ES6+)** with module system
- **GSAP & AOS** for animations
- **Google Maps API** for location services
- **No framework** - pure HTML/CSS/JS architecture

## Essential Commands

### Development
```bash
npm run dev              # Start dev server on port 3000
npm run preview          # Preview production build
```

### Building
```bash
npm run build            # Build for production (default GitHub Pages)
npm run build:github     # Build specifically for GitHub Pages deployment
npm run build:vercel     # Build specifically for Vercel deployment
npm run build:optimized  # Build with asset optimization (images, videos)
```

### Deployment
```bash
npm run deploy           # Build and deploy to GitHub Pages
npm run deploy:github    # Same as above
npm run deploy:vercel    # Build for Vercel
```

### Verification
```bash
npm run verify:build     # Verify build integrity and assets
```

## Architecture Overview

### Multi-Platform Deployment
The codebase supports deployment to both GitHub Pages and Vercel:
- **GitHub Pages**: Uses `/Neff-Paving/` as base URL
- **Vercel**: Uses `/` as base URL
- Configuration is handled dynamically in `vite.config.js` based on build mode

### Directory Structure
```
├── src/
│   ├── main.js              # Main entry point
│   ├── components/          # UI components (area-finder, location-maps)
│   ├── utils/              # Utilities (asset-loader, measurement-storage)
│   └── api/                # Backend API (if present)
├── assets/
│   ├── videos/             # Video assets with optimized versions
│   ├── images/             # Image assets
│   └── paving-estimate-form.html  # Estimate form page
├── styles/
│   └── main.css            # Main stylesheet with CSS custom properties
├── scripts/
│   ├── deploy-optimized.js # Optimized deployment script
│   ├── verify-build.js     # Build verification
│   └── generate-sitemap.js # Sitemap generation
└── dist/                   # Build output (gitignored)
```

### Key Components

1. **Asset Loading System** (`src/utils/asset-loader.js`)
   - Handles dynamic asset loading with platform-aware URLs
   - Manages base URL for different deployment targets

2. **Area Measurement Tools** (`src/components/area-finder.js`)
   - Google Maps integration for area measurement
   - Measurement data persistence

3. **Location Maps** (`src/components/location-maps.js`)
   - Interactive maps for business locations
   - Integration with Google Maps API

4. **Build System** (`vite.config.js`)
   - Dynamic base URL configuration
   - Asset optimization and code splitting
   - Platform-specific build modes

### Deployment Considerations

1. **Base URL Handling**
   - Always use the `assetLoader` utility for loading assets
   - The build system automatically adjusts paths based on deployment target

2. **Environment Variables**
   - `VITE_BASE_URL`: Override default base URL
   - `VITE_DEPLOY_TIME`: Deployment timestamp for cache busting
   - `VITE_PLATFORM`: Target platform (github/vercel)

3. **Asset Optimization**
   - Use `npm run build:optimized` for production deployments
   - Images are automatically optimized with Sharp
   - Videos have multiple quality versions (480p, 720p, 1080p)

### Development Workflow

1. **Feature Development**
   - Work on the `development` branch
   - Test locally with `npm run dev`
   - Verify builds with `npm run verify:build`

2. **Testing Changes**
   - No formal test suite currently
   - Manual testing required
   - Use `npm run preview` to test production builds locally

3. **Deployment Process**
   - Merge to `main` branch when ready
   - Run appropriate deploy command based on target platform
   - The `deployment` branch is used for GitHub Pages production

### Important Notes

- **No linting/formatting tools** configured - maintain consistent code style manually
- **No test framework** - all testing is manual
- **CSS Variables** used extensively for theming (see `:root` in main.css)
- **Animation Libraries**: GSAP with ScrollTrigger and AOS are pre-configured
- **Node version**: Requires Node.js >= 22.0.0