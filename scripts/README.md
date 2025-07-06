# Build Scripts Directory

This directory contains the robust build system for the Neff Paving project.

## Core Scripts

### 🚀 `deploy-optimized.js`
Enhanced deployment script with error handling and fallback capabilities.
- **Primary build script** with asset optimization
- **Automatic fallback** to standard build on failure
- **Comprehensive error reporting** and troubleshooting
- **Platform-specific** configurations (Vercel, GitHub)

### 🔍 `verify-build.js`
Comprehensive build verification system that checks for common issues.
- **Critical file validation**
- **Asset integrity checks**
- **Security header verification**
- **HTML and JavaScript validation**
- **Performance and size warnings**

### 🧪 `test-deployment.js`
Post-deployment testing suite that verifies critical functionality.
- **Page loading tests**
- **Asset availability checks**
- **API endpoint testing**
- **Performance validation**
- **Security and accessibility checks**

### 📊 `monitor-deployment.js`
Continuous deployment monitoring with immediate failure detection.
- **Real-time health monitoring**
- **Automatic failure detection**
- **Webhook and email alerts**
- **Performance tracking**
- **SSL and security monitoring**

## Usage Examples

### Standard Build Process
```bash
# Enhanced build with optimization and verification
npm run build:optimized

# Verify build output
npm run verify:build

# Test deployed application
npm run test:deployment --url https://neffpaving.com
```

### CI/CD Integration
```bash
# Full deployment pipeline
npm run build:optimized:vercel
npm run verify:build
npm run test:deployment --url $STAGING_URL
```

### Monitoring
```bash
# Start continuous monitoring
npm run monitor:deployment

# Check current status
node scripts/monitor-deployment.js --status
```

## Error Handling

All scripts include comprehensive error handling:

- **Automatic retries** for transient failures
- **Detailed error reports** with troubleshooting hints
- **Fallback mechanisms** for critical build failures
- **Exit codes** for CI/CD integration

## Configuration

Scripts can be configured via:

- **Environment variables** (DEPLOY_PLATFORM, OPTIMIZE_ASSETS, etc.)
- **Command line arguments** (--url, --timeout, --build-dir, etc.)
- **Package.json scripts** for common use cases

## Documentation

See [BUILD_PROCESS.md](../docs/BUILD_PROCESS.md) for comprehensive documentation including:

- Detailed script reference
- Troubleshooting guides
- CI/CD integration examples
- Security considerations
- Maintenance procedures

## Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-optimized.js` | Primary build with optimization | `npm run build:optimized` |
| `verify-build.js` | Build verification | `npm run verify:build` |
| `test-deployment.js` | Deployment testing | `npm run test:deployment` |
| `monitor-deployment.js` | Continuous monitoring | `npm run monitor:deployment` |

## Support

For issues with the build system:

1. Check the [documentation](../docs/BUILD_PROCESS.md)
2. Review error logs and reports
3. Test with fallback builds
4. Contact the development team with detailed error information
