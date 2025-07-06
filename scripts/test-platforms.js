#!/usr/bin/env node
/**
 * Simple Platform Monitor Test
 * Quick test to verify platform accessibility
 */

console.log('🔍 Testing Platform Accessibility...\n');

const platforms = {
    github: { url: 'https://jordolang.github.io/Neff-Paving', method: 'HEAD' },
    vercel: { url: 'https://neff-paving-7lwuchr8x-jordan-langs-projects.vercel.app', method: 'HEAD' }
};

async function testPlatform(name, { url, method }) {
    console.log(`Testing ${name}: ${url} with ${method}`);
    
    try {
        const response = await fetch(url, { 
            method,
            headers: { 'User-Agent': 'Neff-Paving-Monitor/1.0' }
        });
        
        console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
        return { name, url, status: response.status, ok: response.ok };
    } catch (error) {
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        return { name, url, status: null, ok: false, error: error.message };
    }
}

async function runTest() {
    const results = [];
    
    for (const [name, platform] of Object.entries(platforms)) {
        const result = await testPlatform(name, platform);
        results.push(result);
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Test Summary:');
    results.forEach(result => {
        const status = result.ok ? '✅ ONLINE' : '❌ OFFLINE';
        console.log(`${result.name}: ${status}`);
    });
    
    console.log('\n✅ Platform accessibility test completed!');
}

runTest().catch(console.error);
