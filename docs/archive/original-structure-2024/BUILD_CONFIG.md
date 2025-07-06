# Build Configuration for Multi-Platform Deployment

This document outlines the build configuration for deploying the Neff Paving website to different platforms.

## Environment Modes

### 1. GitHub Pages (`--mode github`)
- **Base URL**: `/Neff-Paving/`
- **Asset Path**: Relative to base URL
- **Build Command**: `npm run build:github`
- **Deploy Command**: `npm run deploy:github`

### 2. Vercel (`--mode vercel`)
- **Base URL**: `/`
- **Asset Path**: Absolute from root
- **Build Command**: `npm run build:vercel`
- **Deploy Command**: `npm run deploy:vercel`

### 3. Custom Environment
- **Base URL**: Set via `VITE_BASE_URL` environment variable
- **Fallback**: `/Neff-Paving/`

## Build Configuration Features

### Dynamic Base URL
The `vite.config.js` automatically handles different base URLs based on the build mode:

```javascript
const getBaseUrl = () => {
  if (mode === 'vercel') return '/';
  if (mode === 'github') return '/Neff-Paving/';
  return process.env.VITE_BASE_URL || '/Neff-Paving/';
};
```

### Environment-Specific Asset Handling
- **Assets**: Environment-specific paths for CSS, JS, and media files
- **Chunks**: Separate chunk handling for code splitting
- **Entries**: Entry point management for different deployment targets

### Build-Time Variables
The following variables are available at build time:
- `__BASE_URL__`: The base URL for the current environment
- `__DEPLOY_MODE__`: The deployment mode (github/vercel)
- `__BUILD_TIMESTAMP__`: Build timestamp
- `__DEPLOY_TIME__`: Deploy time for cache busting

## Usage

### Development
```bash
npm run dev
```

### Build for GitHub Pages
```bash
npm run build:github
```

### Build for Vercel
```bash
npm run build:vercel
```

### Deploy to GitHub Pages
```bash
npm run deploy:github
```

### Deploy to Vercel
```bash
npm run deploy:vercel
```

## Client-Side Utilities

The `/src/utils/base-url.js` utility provides functions for handling base URLs in client-side code:

- `getBaseUrl()`: Get the current base URL
- `createUrl(path)`: Create a full URL with the correct base path
- `getAssetPath(assetPath)`: Get environment-specific asset paths
- `updateAssetPaths()`: Update HTML elements with correct base URLs
- `navigateTo(path)`: Navigate to a path with the correct base URL

## HTML Template Placeholders

Use these placeholders in your HTML files:
- `{{ BASE_URL }}`: Replaced with the environment-specific base URL
- `{{ BUILD_TIMESTAMP }}`: Replaced with the build timestamp

## File Structure

```
dist/
├── index.html              # Main entry point
├── services/
│   └── index.html         # Services page
├── admin/
│   └── index.html         # Admin panel
├── assets/                # Static assets
├── chunks/                # Code chunks
└── entries/               # Entry points
```

## Notes

1. The build process automatically handles path adjustments for different environments
2. Cache busting is implemented via query parameters
3. All entry points (main, services, admin) are built simultaneously
4. Asset paths are automatically adjusted based on the deployment environment
