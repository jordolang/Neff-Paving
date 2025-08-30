/**
 * Debug Asset Path Generation
 * This file tests the asset loading utilities and verifies paths are generated correctly
 */

import {
    getAssetPath,
    getBaseUrl,
    createUrl,
    getEnvironmentConfig,
    BASE_URL,
    DEPLOY_MODE
} from './utils/base-url.js';

// Test function to debug asset paths
export function debugAssetPaths() {
    console.group('🔍 Asset Path Debug Information');

    // Check build-time variables
    console.log('📋 Build-time Variables:');
    console.log('  __BASE_URL__:', typeof __BASE_URL__ !== 'undefined' ? __BASE_URL__ : 'UNDEFINED');
    console.log('  __DEPLOY_MODE__:', typeof __DEPLOY_MODE__ !== 'undefined' ? __DEPLOY_MODE__ : 'UNDEFINED');
    console.log('  __BUILD_TIMESTAMP__:', typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'UNDEFINED');
    console.log('  __DEPLOY_TIME__:', typeof __DEPLOY_TIME__ !== 'undefined' ? __DEPLOY_TIME__ : 'UNDEFINED');
    console.log('  __IS_VERCEL__:', typeof __IS_VERCEL__ !== 'undefined' ? __IS_VERCEL__ : 'UNDEFINED');
    console.log('  __IS_GITHUB_PAGES__:', typeof __IS_GITHUB_PAGES__ !== 'undefined' ? __IS_GITHUB_PAGES__ : 'UNDEFINED');
    console.log('  __PLATFORM__:', typeof __PLATFORM__ !== 'undefined' ? __PLATFORM__ : 'UNDEFINED');

    // Check computed values
    console.log('\n📊 Computed Values:');
    console.log('  BASE_URL:', BASE_URL);
    console.log('  DEPLOY_MODE:', DEPLOY_MODE);
    console.log('  getBaseUrl():', getBaseUrl());
    console.log('  getEnvironmentConfig():', getEnvironmentConfig());

    // Test asset path generation
    console.log('\n🔧 Asset Path Tests:');
    const testPaths = [
        'assets/images/logo.png',
        'assets/styles/main.css',
        'entries/main.js',
        'assets/images/hero-bg.jpg',
        'styles/main.css',
        'https://external.com/image.jpg',
        'favicon.ico'
    ];

    testPaths.forEach(path => {
        const resolvedPath = getAssetPath(path);
        const isDoubleSlash = resolvedPath.includes('//') && !resolvedPath.startsWith('http');
        const hasIncorrectBase = resolvedPath.includes('/Birkhimer-Asphalt//');
        console.log(`  "${path}" → "${resolvedPath}"`, {
            hasDoubleSlash: isDoubleSlash,
            hasIncorrectBase: hasIncorrectBase,
            length: resolvedPath.length
        });
        if (isDoubleSlash) {
            console.warn(`    ⚠️  Double slash detected!`);
        }
        if (hasIncorrectBase) {
            console.warn(`    ⚠️  Incorrect base URL!`);
        }
    });

    // Test createUrl function
    console.log('\n🌐 URL Creation Tests:');
    const testUrls = [
        'index.html',
        '/index.html',
        'services/',
        '/services/'
    ];

    testUrls.forEach(url => {
        const createdUrl = createUrl(url);
        console.log(`  "${url}" → "${createdUrl}"`);
    });

    // Test environment detection
    console.log('\n🏗️ Environment Detection:');
    console.log('  process.env.NODE_ENV:', typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined');
    console.log('  Current environment config:', getEnvironmentConfig());

    // Test specific deployment scenarios
    console.log('\n🚀 Deployment Scenarios:');

    // Test Vercel scenario
    if (DEPLOY_MODE === 'vercel' || (typeof __IS_VERCEL__ !== 'undefined' && __IS_VERCEL__)) {
        console.log('  🔵 Vercel deployment detected');
        console.log('    Sample asset path:', getAssetPath('assets/images/test.jpg', { forceAbsolute: true }));
    }

    // Test GitHub Pages scenario
    if (DEPLOY_MODE === 'github' || (typeof __IS_GITHUB_PAGES__ !== 'undefined' && __IS_GITHUB_PAGES__)) {
        console.log('  🟣 GitHub Pages deployment detected');
        console.log('    Sample asset path:', getAssetPath('assets/images/test.jpg', { useRelative: true }));
    }

    console.groupEnd();

    // Return debug information for further analysis
    return {
        buildVars: {
            baseUrl: typeof __BASE_URL__ !== 'undefined' ? __BASE_URL__ : 'UNDEFINED',
            deployMode: typeof __DEPLOY_MODE__ !== 'undefined' ? __DEPLOY_MODE__ : 'UNDEFINED',
            isVercel: typeof __IS_VERCEL__ !== 'undefined' ? __IS_VERCEL__ : 'UNDEFINED',
            isGitHub: typeof __IS_GITHUB_PAGES__ !== 'undefined' ? __IS_GITHUB_PAGES__ : 'UNDEFINED',
        },
        computedValues: {
            BASE_URL,
            DEPLOY_MODE,
            baseUrl: getBaseUrl(),
            envConfig: getEnvironmentConfig()
        },
        testResults: testPaths.map(path => ({
            input: path,
            output: getAssetPath(path),
            hasIssues: getAssetPath(path).includes('//') && !getAssetPath(path).startsWith('http')
        }))
    };
}

// Test asset loading with real elements
export function testAssetLoading() {
    console.group('🧪 Asset Loading Tests');

    // Test image loading
    const testImage = new Image();
    const imagePath = getAssetPath('assets/images/logo.png');
    console.log('Testing image load:', imagePath);

    testImage.onload = () => {
        console.log('✅ Image loaded successfully:', imagePath);
    };

    testImage.onerror = () => {
        console.error('❌ Image failed to load:', imagePath);
    };

    testImage.src = imagePath;

    // Test CSS loading
    const testCSS = document.createElement('link');
    testCSS.rel = 'stylesheet';
    testCSS.type = 'text/css';
    const cssPath = getAssetPath('assets/styles/test.css');
    console.log('Testing CSS load:', cssPath);

    testCSS.onload = () => {
        console.log('✅ CSS loaded successfully:', cssPath);
        testCSS.remove(); // Clean up
    };

    testCSS.onerror = () => {
        console.error('❌ CSS failed to load:', cssPath);
        testCSS.remove(); // Clean up
    };

    testCSS.href = cssPath;
    document.head.appendChild(testCSS);

    console.groupEnd();
}

// Fix double slashes in asset paths
export function fixDoubleSlashes() {
    console.group('🔧 Fixing Double Slashes');

    const selectors = [
        'img[src*="//"]',
        'link[href*="//"]',
        'script[src*="//"]',
        'a[href*="//"]'
    ];

    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`Found ${elements.length} elements with "${selector}"`);
        elements.forEach(element => {
            const attr = element.tagName.toLowerCase() === 'a' || element.tagName.toLowerCase() === 'link' ? 'href' : 'src';
            const currentPath = element.getAttribute(attr);

            if (currentPath && currentPath.includes('//') && !currentPath.startsWith('http')) {
                const fixedPath = currentPath.replace(/\/+/g, '/');
                element.setAttribute(attr, fixedPath);
                console.log(`Fixed: "${currentPath}" → "${fixedPath}"`);
            }
        });
    });

    console.groupEnd();
}

// Temporarily disable asset optimization
export function disableAssetOptimization() {
    console.log('🚫 Temporarily disabling asset optimization system');

    // Override getAssetPath to return simple paths
    window.originalGetAssetPath = window.getAssetPath;
    window.getAssetPath = function(path) {
        console.log('🔄 Using simplified asset path for:', path);
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return path.startsWith('/') ? path : '/' + path;
    };

    console.log('Asset optimization disabled. Use enableAssetOptimization() to re-enable.');
}

// Re-enable asset optimization
export function enableAssetOptimization() {
    if (window.originalGetAssetPath) {
        window.getAssetPath = window.originalGetAssetPath;
        delete window.originalGetAssetPath;
        console.log('✅ Asset optimization re-enabled');
    }
}

// Auto-run debug on load if in development or if debug flag is set
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ||
    typeof window !== 'undefined' && window.location.search.includes('debug=assets')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            debugAssetPaths();
            testAssetLoading();
        }, 1000);
    });
}

// Test with hardcoded paths first to isolate the issue
export function testHardcodedPaths() {
    console.group('🔍 Testing Hardcoded Paths');

    const testPaths = [
        '/assets/images/projects/commercial-project-1.jpg',
        '/assets/images/projects/residential-driveway-1.jpg',
        '/assets/images/logo.png',
        'favicon.ico'
    ];

    testPaths.forEach(path => {
        console.log(`Testing hardcoded path: ${path}`);

        // Test image loading
        const img = new Image();
        img.onload = () => {
            console.log(`✅ Hardcoded path loaded successfully: ${path}`);
        };
        img.onerror = () => {
            console.error(`❌ Hardcoded path failed to load: ${path}`);
        };
        img.src = path;
    });

    console.groupEnd();
}

// Enable debug mode for asset paths
export function enableAssetDebug() {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('debug-assets', 'true');
        console.log('🔧 Asset debugging enabled. Reload the page to see detailed logs.');
    }
}

// Disable debug mode for asset paths
export function disableAssetDebug() {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('debug-assets');
        console.log('🔧 Asset debugging disabled.');
    }
}

// Test cache busting parameters
export function testCacheBusting() {
    console.group('🔍 Cache Busting Tests');

    const testPath = '/assets/images/logo.png';

    // Test with cache busting enabled
    const withCacheBusting = getAssetPath(testPath, { addCacheBusting: true });
    console.log('With cache busting:', withCacheBusting);

    // Test with cache busting disabled
    const withoutCacheBusting = getAssetPath(testPath, { addCacheBusting: false });
    console.log('Without cache busting:', withoutCacheBusting);

    // Check if cache busting is causing issues
    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => console.log('✅ Cache busted path loads correctly');
    img1.onerror = () => console.error('❌ Cache busted path failed to load');
    img1.src = withCacheBusting;

    img2.onload = () => console.log('✅ Non-cache busted path loads correctly');
    img2.onerror = () => console.error('❌ Non-cache busted path failed to load');
    img2.src = withoutCacheBusting;

    console.groupEnd();
}

// Verify base URL configuration for current environment
export function verifyBaseUrlConfig() {
    console.group('🔍 Base URL Configuration Verification');

    console.log('Current window location:', {
        href: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        origin: window.location.origin
    });

    console.log('Base URL constants:', {
        BASE_URL,
        DEPLOY_MODE,
        getBaseUrl: getBaseUrl(),
        environmentConfig: getEnvironmentConfig()
    });

    // Test if we're in the correct environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isGitHubPages = window.location.hostname.endsWith('.github.io');
    const isVercel = window.location.hostname.endsWith('.vercel.app');

    console.log('Environment detection:', {
        isLocalhost,
        isGitHubPages,
        isVercel,
        detectedEnvironment: isLocalhost ? 'development' : (isGitHubPages ? 'github' : (isVercel ? 'vercel' : 'unknown'))
    });

    // Test base URL construction
    const testPaths = ['index.html', 'assets/styles/main.css', 'assets/images/logo.png'];
    testPaths.forEach(path => {
        const fullUrl = createUrl(path);
        console.log(`createUrl('${path}') => '${fullUrl}'`);
    });

    console.groupEnd();
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.debugAssetPaths = debugAssetPaths;
    window.testAssetLoading = testAssetLoading;
    window.testHardcodedPaths = testHardcodedPaths;
    window.testCacheBusting = testCacheBusting;
    window.verifyBaseUrlConfig = verifyBaseUrlConfig;
    window.enableAssetDebug = enableAssetDebug;
    window.disableAssetDebug = disableAssetDebug;
    window.fixDoubleSlashes = fixDoubleSlashes;
    window.disableAssetOptimization = disableAssetOptimization;
    window.enableAssetOptimization = enableAssetOptimization;

    // Add a helper message
    console.log('🔧 Asset Debug Functions Available:');
    console.log('  - enableAssetDebug(): Enable detailed asset path logging');
    console.log('  - disableAssetDebug(): Disable detailed asset path logging');
    console.log('  - debugAssetPaths(): Run comprehensive asset path debug');
    console.log('  - testHardcodedPaths(): Test hardcoded paths to isolate issues');
    console.log('  - testCacheBusting(): Test cache busting parameter behavior');
    console.log('  - verifyBaseUrlConfig(): Verify base URL configuration');
    console.log('  - testAssetLoading(): Test actual asset loading');
}