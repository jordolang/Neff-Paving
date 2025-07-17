/**
 * Boundary Validation and Storage Demo
 * Demonstrates the comprehensive boundary validation system
 */

import BoundaryValidationService from '../services/boundary-validation-service.js';
import BoundaryStorageService from '../services/boundary-storage-service.js';

// Initialize services
const validator = new BoundaryValidationService();
const storage = new BoundaryStorageService();

/**
 * Demo data for testing validation
 */
const demoCoordinates = {
    valid: [
        { lat: 40.7128, lng: -74.0060 },  // New York City
        { lat: 40.7120, lng: -74.0050 },
        { lat: 40.7110, lng: -74.0055 },
        { lat: 40.7125, lng: -74.0065 }
    ],
    invalid: [
        { lat: 91.0, lng: -74.0060 },     // Invalid latitude
        { lat: 40.7120, lng: -181.0 },   // Invalid longitude
        { lat: 'invalid', lng: -74.0055 }, // Invalid data type
        { lat: 40.7125, lng: -74.0065 }
    ],
    complex: [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7130, lng: -74.0062 },
        { lat: 40.7132, lng: -74.0064 },
        { lat: 40.7134, lng: -74.0066 },
        { lat: 40.7136, lng: -74.0068 },
        { lat: 40.7138, lng: -74.0070 },
        { lat: 40.7140, lng: -74.0072 },
        { lat: 40.7142, lng: -74.0074 },
        { lat: 40.7144, lng: -74.0076 },
        { lat: 40.7146, lng: -74.0078 },
        { lat: 40.7148, lng: -74.0080 },
        { lat: 40.7150, lng: -74.0082 },
        { lat: 40.7152, lng: -74.0084 },
        { lat: 40.7154, lng: -74.0086 },
        { lat: 40.7156, lng: -74.0088 },
        { lat: 40.7158, lng: -74.0090 },
        { lat: 40.7160, lng: -74.0092 },
        { lat: 40.7162, lng: -74.0094 },
        { lat: 40.7164, lng: -74.0096 },
        { lat: 40.7166, lng: -74.0098 },
        { lat: 40.7168, lng: -74.0100 },
        { lat: 40.7170, lng: -74.0102 },
        { lat: 40.7172, lng: -74.0104 },
        { lat: 40.7174, lng: -74.0106 },
        { lat: 40.7150, lng: -74.0080 },  // Return to create complex shape
        { lat: 40.7140, lng: -74.0070 },
        { lat: 40.7130, lng: -74.0060 }
    ]
};

/**
 * Demo functions
 */
export function runBoundaryValidationDemo() {
    console.log('=== Boundary Validation Demo ===');
    
    // Test 1: Valid coordinates
    console.log('\n1. Testing valid coordinates:');
    const validResult = validator.validateBoundaryCoordinates(demoCoordinates.valid);
    console.log('Valid coordinates result:', validResult);
    
    // Test 2: Invalid coordinates
    console.log('\n2. Testing invalid coordinates:');
    const invalidResult = validator.validateBoundaryCoordinates(demoCoordinates.invalid);
    console.log('Invalid coordinates result:', invalidResult);
    
    // Test 3: Complex polygon
    console.log('\n3. Testing complex polygon:');
    const complexResult = validator.validateBoundaryCoordinates(demoCoordinates.complex);
    console.log('Complex polygon result:', complexResult);
    
    // Test 4: Coordinate compression
    console.log('\n4. Testing coordinate compression:');
    const compressionResult = validator.compressCoordinateData(demoCoordinates.complex);
    console.log('Compression result:', compressionResult);
    
    // Test 5: Thumbnail generation
    console.log('\n5. Testing thumbnail generation:');
    const thumbnail = validator.generateBoundaryThumbnail(demoCoordinates.valid);
    console.log('Thumbnail result:', thumbnail);
    
    return {
        valid: validResult,
        invalid: invalidResult,
        complex: complexResult,
        compression: compressionResult,
        thumbnail: thumbnail
    };
}

export function runBoundaryStorageDemo() {
    console.log('\n=== Boundary Storage Demo ===');
    
    // Test boundary data
    const boundaryData = {
        coordinates: demoCoordinates.valid,
        area: 5000,
        perimeter: 300,
        units: 'sqft',
        imageryType: 'satellite',
        imageryQuality: 'high',
        imageryDate: new Date().toISOString()
    };
    
    return storage.storeBoundaryData('demo-tool', boundaryData)
        .then(result => {
            console.log('Storage result:', result);
            
            // Test retrieval
            return storage.retrieveBoundaryData('demo-tool');
        })
        .then(retrievalResult => {
            console.log('Retrieval result:', retrievalResult);
            
            // Test export
            const exportResult = storage.exportBoundaryData('demo-tool', 'json');
            console.log('Export result:', exportResult);
            
            // Test storage statistics
            const stats = storage.getStorageStatistics();
            console.log('Storage statistics:', stats);
            
            return {
                storage: result,
                retrieval: retrievalResult,
                export: exportResult,
                statistics: stats
            };
        })
        .catch(error => {
            console.error('Storage demo error:', error);
            return { error: error.message };
        });
}

/**
 * Comprehensive validation test
 */
export function runComprehensiveValidationTest() {
    console.log('\n=== Comprehensive Validation Test ===');
    
    const testCases = [
        {
            name: 'Small residential area',
            coordinates: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.7130, lng: -74.0060 },
                { lat: 40.7130, lng: -74.0058 },
                { lat: 40.7128, lng: -74.0058 }
            ],
            area: 1000,
            perimeter: 150
        },
        {
            name: 'Large commercial area',
            coordinates: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.7140, lng: -74.0060 },
                { lat: 40.7140, lng: -74.0040 },
                { lat: 40.7128, lng: -74.0040 }
            ],
            area: 50000,
            perimeter: 2000
        },
        {
            name: 'Area too small',
            coordinates: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.7129, lng: -74.0060 },
                { lat: 40.7129, lng: -74.0059 },
                { lat: 40.7128, lng: -74.0059 }
            ],
            area: 10,
            perimeter: 50
        },
        {
            name: 'Area too large',
            coordinates: [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.8000, lng: -74.0060 },
                { lat: 40.8000, lng: -73.9000 },
                { lat: 40.7128, lng: -73.9000 }
            ],
            area: 100000000,
            perimeter: 100000
        }
    ];
    
    const results = testCases.map(testCase => {
        console.log(`\nTesting: ${testCase.name}`);
        
        const coordinateValidation = validator.validateBoundaryCoordinates(testCase.coordinates);
        const geometryValidation = validator.validatePolygonGeometry(
            testCase.coordinates,
            testCase.area,
            testCase.perimeter
        );
        
        const summary = validator.getValidationSummary(coordinateValidation);
        
        return {
            name: testCase.name,
            coordinateValidation,
            geometryValidation,
            summary
        };
    });
    
    console.log('\nComprehensive test results:', results);
    return results;
}

/**
 * Performance test
 */
export function runPerformanceTest() {
    console.log('\n=== Performance Test ===');
    
    // Generate large coordinate array
    const largeCoordinateArray = [];
    for (let i = 0; i < 1000; i++) {
        largeCoordinateArray.push({
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.0060 + (Math.random() - 0.5) * 0.01
        });
    }
    
    console.log(`Testing with ${largeCoordinateArray.length} coordinates`);
    
    const startTime = performance.now();
    
    const validationResult = validator.validateBoundaryCoordinates(largeCoordinateArray);
    const validationTime = performance.now() - startTime;
    
    const compressionStartTime = performance.now();
    const compressionResult = validator.compressCoordinateData(largeCoordinateArray);
    const compressionTime = performance.now() - compressionStartTime;
    
    const thumbnailStartTime = performance.now();
    const thumbnail = validator.generateBoundaryThumbnail(largeCoordinateArray);
    const thumbnailTime = performance.now() - thumbnailStartTime;
    
    const results = {
        inputSize: largeCoordinateArray.length,
        validationTime: validationTime,
        compressionTime: compressionTime,
        thumbnailTime: thumbnailTime,
        totalTime: validationTime + compressionTime + thumbnailTime,
        validationResult: validationResult,
        compressionResult: compressionResult,
        thumbnail: thumbnail
    };
    
    console.log('Performance test results:', results);
    return results;
}

/**
 * Run all demos
 */
export async function runAllDemos() {
    console.log('Running all boundary validation and storage demos...');
    
    const results = {};
    
    try {
        results.validation = runBoundaryValidationDemo();
        results.storage = await runBoundaryStorageDemo();
        results.comprehensive = runComprehensiveValidationTest();
        results.performance = runPerformanceTest();
        
        console.log('\n=== All Demos Complete ===');
        console.log('Summary:', results);
        
        return results;
    } catch (error) {
        console.error('Demo error:', error);
        return { error: error.message };
    }
}

// Auto-run demos if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('boundary-validation-demo')) {
    runAllDemos();
}

export default {
    runBoundaryValidationDemo,
    runBoundaryStorageDemo,
    runComprehensiveValidationTest,
    runPerformanceTest,
    runAllDemos
};
