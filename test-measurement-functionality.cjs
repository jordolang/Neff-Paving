#!/usr/bin/env node

/**
 * Test script to verify measurement functionality
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001/Neff-Paving';
const ESTIMATE_FORM_PATH = '/estimate-form-demo.html';

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}`);
        if (details) console.log(`   ${details}`);
    }
    testResults.details.push({ name: testName, passed, details });
}

// Test 1: Verify estimate form HTML structure
function testEstimateFormStructure() {
    console.log('\n📋 Testing Estimate Form Structure...');
    
    try {
        const formPath = path.join(__dirname, 'estimate-form-demo.html');
        const content = fs.readFileSync(formPath, 'utf8');
        
        // Check for measurement section
        const hasMeasurementSection = content.includes('class="measurement-section"');
        logTest('Measurement section exists', hasMeasurementSection);
        
        // Check for map container
        const hasMapContainer = content.includes('class="map-container"');
        logTest('Map container exists', hasMapContainer);
        
        // Check for tool selection buttons
        const hasToggleButtons = content.includes('class="toggle-btn"');
        logTest('Toggle buttons exist', hasToggleButtons);
        
        // Check for measurement results section
        const hasMeasurementResults = content.includes('class="measurement-results"');
        logTest('Measurement results section exists', hasMeasurementResults);
        
        // Check for ArcGIS container
        const hasArcGISContainer = content.includes('id="arcgis-container"');
        logTest('ArcGIS container exists', hasArcGISContainer);
        
        // Check for Google Maps container
        const hasGoogleMapsContainer = content.includes('id="google-maps-container"');
        logTest('Google Maps container exists', hasGoogleMapsContainer);
        
        return true;
    } catch (error) {
        logTest('Estimate form file readable', false, error.message);
        return false;
    }
}

// Test 2: Verify JavaScript functionality
function testJavaScriptFunctionality() {
    console.log('\n🔧 Testing JavaScript Functionality...');
    
    try {
        const jsPath = path.join(__dirname, 'src/components/estimate-form.js');
        const content = fs.readFileSync(jsPath, 'utf8');
        
        // Check for measurement tool functions
        const hasMeasurementFunctions = content.includes('function initializeMeasurementTools');
        logTest('Measurement initialization function exists', hasMeasurementFunctions);
        
        // Check for toggle functionality
        const hasToggleFunctions = content.includes('toggleMeasurementTool');
        logTest('Toggle tool function exists', hasToggleFunctions);
        
        // Check for ArcGIS SDK loading
        const hasArcGISLoading = content.includes('esriLoader.loadModules');
        logTest('ArcGIS module loading exists', hasArcGISLoading);
        
        // Check for measurement result handling
        const hasResultHandling = content.includes('displayMeasurementResults');
        logTest('Result display function exists', hasResultHandling);
        
        // Check for event listeners
        const hasEventListeners = content.includes('addEventListener');
        logTest('Event listeners exist', hasEventListeners);
        
        return true;
    } catch (error) {
        logTest('JavaScript file readable', false, error.message);
        return false;
    }
}

// Test 3: Verify CSS styling
function testCSSStructure() {
    console.log('\n🎨 Testing CSS Structure...');
    
    try {
        const cssPath = path.join(__dirname, 'src/styles/estimate-form.css');
        const content = fs.readFileSync(cssPath, 'utf8');
        
        // Check for measurement section styles
        const hasMeasurementStyles = content.includes('.measurement-section');
        logTest('Measurement section styles exist', hasMeasurementStyles);
        
        // Check for map container styles
        const hasMapStyles = content.includes('.map-container');
        logTest('Map container styles exist', hasMapStyles);
        
        // Check for toggle button styles
        const hasToggleStyles = content.includes('.toggle-btn');
        logTest('Toggle button styles exist', hasToggleStyles);
        
        // Check for results styles
        const hasResultsStyles = content.includes('.measurement-results');
        logTest('Results styles exist', hasResultsStyles);
        
        // Check for responsive design
        const hasResponsiveStyles = content.includes('@media (max-width: 768px)');
        logTest('Responsive styles exist', hasResponsiveStyles);
        
        return true;
    } catch (error) {
        logTest('CSS file readable', false, error.message);
        return false;
    }
}

// Test 4: Verify ArcGIS integration
function testArcGISIntegration() {
    console.log('\n🗺️ Testing ArcGIS Integration...');
    
    try {
        const jsPath = path.join(__dirname, 'src/components/estimate-form.js');
        const content = fs.readFileSync(jsPath, 'utf8');
        
        // Check for ArcGIS modules
        const hasMapView = content.includes('esri/views/MapView');
        logTest('MapView module import exists', hasMapView);
        
        const hasMap = content.includes('esri/Map');
        logTest('Map module import exists', hasMap);
        
        const hasSketch = content.includes('esri/widgets/Sketch');
        logTest('Sketch widget import exists', hasSketch);
        
        const hasGeometryEngine = content.includes('esri/geometry/geometryEngine');
        logTest('GeometryEngine import exists', hasGeometryEngine);
        
        // Check for measurement calculations
        const hasMeasurements = content.includes('geodesicArea') || content.includes('geodesicLength');
        logTest('Geodesic measurement functions exist', hasMeasurements);
        
        return true;
    } catch (error) {
        logTest('ArcGIS integration check failed', false, error.message);
        return false;
    }
}

// Test 5: Verify form integration
function testFormIntegration() {
    console.log('\n📝 Testing Form Integration...');
    
    try {
        const jsPath = path.join(__dirname, 'src/components/estimate-form.js');
        const content = fs.readFileSync(jsPath, 'utf8');
        
        // Check for form data integration
        const hasFormData = content.includes('measurement-data');
        logTest('Form data integration exists', hasFormData);
        
        // Check for validation
        const hasValidation = content.includes('validateMeasurements');
        logTest('Measurement validation exists', hasValidation);
        
        // Check for form submission handling
        const hasFormSubmission = content.includes('handleFormSubmission');
        logTest('Form submission handling exists', hasFormSubmission);
        
        return true;
    } catch (error) {
        logTest('Form integration check failed', false, error.message);
        return false;
    }
}

// Test 6: Verify file structure
function testFileStructure() {
    console.log('\n📁 Testing File Structure...');
    
    const requiredFiles = [
        'estimate-form-demo.html',
        'src/components/estimate-form.js',
        'src/styles/estimate-form.css'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        logTest(`${file} exists`, exists);
    });
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Measurement Functionality Tests...\n');
    
    testFileStructure();
    testEstimateFormStructure();
    testJavaScriptFunctionality();
    testCSSStructure();
    testArcGISIntegration();
    testFormIntegration();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`- ${test.name}${test.details ? ': ' + test.details : ''}`);
            });
    }
    
    // Manual testing instructions
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Open: http://localhost:3001/Neff-Paving/estimate-form-demo.html');
    console.log('2. Verify the map loads immediately in the measurement section');
    console.log('3. Test the "ArcGIS 3D Measurement" toggle button');
    console.log('4. Test the "Google Maps Area" toggle button');
    console.log('5. Try drawing a polygon for area measurement');
    console.log('6. Try drawing a line for distance measurement');
    console.log('7. Verify measurement results display correctly');
    console.log('8. Check that the map doesn\'t interfere with form elements');
    console.log('9. Submit the form and verify measurement data is included');
    console.log('10. Test responsiveness on mobile devices');
    
    return testResults.failed === 0;
}

// Run the tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
