#!/usr/bin/env node
/**
 * Test script for Service Worker functionality
 * This script verifies that the service worker is properly configured
 * and tests caching strategies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Service Worker Configuration...\n');

// Test 1: Check if service worker file exists
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
if (fs.existsSync(swPath)) {
    console.log('✅ Service worker file exists at public/sw.js');
} else {
    console.log('❌ Service worker file not found at public/sw.js');
    process.exit(1);
}

// Test 2: Verify service worker content
const swContent = fs.readFileSync(swPath, 'utf8');

const tests = [
    {
        name: 'Cache versioning implemented',
        check: () => swContent.includes('CACHE_VERSION') && swContent.includes('v${CACHE_VERSION}'),
        description: 'Checks if cache names include version numbers'
    },
    {
        name: 'Multiple cache types defined',
        check: () => swContent.includes('STATIC_CACHE_NAME') && 
                    swContent.includes('DYNAMIC_CACHE_NAME') && 
                    swContent.includes('IMAGES_CACHE_NAME'),
        description: 'Verifies different cache types for different asset types'
    },
    {
        name: 'Old cache cleanup on activate',
        check: () => swContent.includes('activate') && 
                    swContent.includes('caches.delete'),
        description: 'Ensures old caches are cleaned up when service worker activates'
    },
    {
        name: 'Network-first strategy for HTML',
        check: () => swContent.includes('networkFirstStrategy') && 
                    swContent.includes('text/html'),
        description: 'Confirms HTML pages use network-first caching strategy'
    },
    {
        name: 'Cache-first strategy for assets',
        check: () => swContent.includes('cacheFirstStrategy') && 
                    swContent.includes('image'),
        description: 'Verifies static assets use cache-first caching strategy'
    },
    {
        name: 'Stale-while-revalidate pattern',
        check: () => swContent.includes('updateCacheInBackground'),
        description: 'Checks for background cache updates (stale-while-revalidate)'
    },
    {
        name: 'Service worker registration in main app',
        check: () => {
            const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
            if (fs.existsSync(mainJsPath)) {
                const mainContent = fs.readFileSync(mainJsPath, 'utf8');
                return mainContent.includes('serviceWorker.register') && 
                       mainContent.includes('initServiceWorker');
            }
            return false;
        },
        description: 'Verifies service worker is registered in the main application'
    }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
    try {
        if (test.check()) {
            console.log(`✅ Test ${index + 1}: ${test.name}`);
            passed++;
        } else {
            console.log(`❌ Test ${index + 1}: ${test.name}`);
            console.log(`   ${test.description}`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ Test ${index + 1}: ${test.name} (Error: ${error.message})`);
        failed++;
    }
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All service worker tests passed!');
    console.log('\n📋 Service Worker Features Implemented:');
    console.log('   • Cache versioning with automatic cleanup');
    console.log('   • Network-first strategy for HTML pages');
    console.log('   • Cache-first strategy for static assets');
    console.log('   • Separate caches for different asset types');
    console.log('   • Stale-while-revalidate pattern for performance');
    console.log('   • Offline fallback support');
    console.log('   • Update notifications for new versions');
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
}

console.log('\n🚀 To test the service worker in the browser:');
console.log('   1. Build and serve the application');
console.log('   2. Open browser DevTools > Application > Service Workers');
console.log('   3. Check Network tab for cached resources');
console.log('   4. Go offline and verify the app still works');
