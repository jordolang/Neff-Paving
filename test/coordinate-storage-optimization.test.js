/**
 * Coordinate Storage Optimization Tests
 * Tests coordinate compression, storage efficiency, and retrieval performance
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import BoundaryValidationService from '../src/services/boundary-validation-service.js';
import BoundaryStorageService from '../src/services/boundary-storage-service.js';
import { storeMeasurementData, getMeasurementData } from '../src/utils/measurement-storage.js';

describe('Coordinate Storage Optimization Tests', () => {
  let validator;
  let storageService;
  let testCoordinates;
  let performanceMetrics;

  beforeAll(() => {
    validator = new BoundaryValidationService();
    storageService = new BoundaryStorageService();
    
    // Test coordinate sets of varying sizes
    testCoordinates = {
      small: generateCoordinates(10, 40.7128, -74.0060, 0.001),
      medium: generateCoordinates(100, 40.7128, -74.0060, 0.01),
      large: generateCoordinates(1000, 40.7128, -74.0060, 0.1),
      complex: generateComplexPolygon(500, 40.7128, -74.0060, 0.05),
      highPrecision: generateHighPrecisionCoordinates(50, 40.7128, -74.0060, 0.001)
    };

    performanceMetrics = {
      compressionTargets: {
        small: { ratio: 0.9, time: 10 }, // 90% size, 10ms max
        medium: { ratio: 0.7, time: 50 }, // 70% size, 50ms max
        large: { ratio: 0.5, time: 200 }, // 50% size, 200ms max
        complex: { ratio: 0.6, time: 150 }, // 60% size, 150ms max
        highPrecision: { ratio: 0.8, time: 30 } // 80% size, 30ms max
      },
      storageTargets: {
        maxSize: 10240, // 10KB per boundary
        retrievalTime: 100, // 100ms max
        compressionRatio: 0.7 // 70% of original size
      }
    };
  });

  describe('Compression Algorithm Performance', () => {
    test('should compress coordinates efficiently using Douglas-Peucker', () => {
      Object.entries(testCoordinates).forEach(([sizeName, coordinates]) => {
        const startTime = performance.now();
        
        const compressionResult = validator.compressCoordinateData(coordinates, {
          enabled: true,
          tolerance: 0.00001,
          maxPoints: 500
        });
        
        const compressionTime = performance.now() - startTime;
        const target = performanceMetrics.compressionTargets[sizeName];
        
        expect(compressionResult.compressionRatio).toBeLessThanOrEqual(target.ratio);
        expect(compressionTime).toBeLessThan(target.time);
        expect(compressionResult.coordinates.length).toBeGreaterThan(3); // Maintain polygon
        
        console.log(`${sizeName}: ${coordinates.length} → ${compressionResult.coordinates.length} points (${(compressionResult.compressionRatio * 100).toFixed(1)}% in ${compressionTime.toFixed(1)}ms)`);
      });
    });

    test('should maintain polygon integrity after compression', () => {
      Object.entries(testCoordinates).forEach(([sizeName, coordinates]) => {
        const compressed = validator.compressCoordinateData(coordinates);
        
        // Validate that compressed coordinates still form valid polygon
        const validation = validator.validateBoundaryCoordinates(compressed.coordinates);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        
        // Check that compression preserves approximate area
        const originalArea = calculatePolygonArea(coordinates);
        const compressedArea = calculatePolygonArea(compressed.coordinates);
        const areaDifference = Math.abs(originalArea - compressedArea) / originalArea;
        
        expect(areaDifference).toBeLessThan(0.05); // Less than 5% area difference
      });
    });

    test('should handle different compression tolerances', () => {
      const testCoords = testCoordinates.large;
      const tolerances = [0.000001, 0.00001, 0.0001, 0.001];
      
      tolerances.forEach(tolerance => {
        const compressed = validator.compressCoordinateData(testCoords, {
          tolerance: tolerance,
          enabled: true
        });
        
        expect(compressed.coordinates.length).toBeGreaterThan(3);
        expect(compressed.coordinates.length).toBeLessThanOrEqual(testCoords.length);
        
        // Higher tolerance should result in more compression
        if (tolerance > 0.00001) {
          expect(compressed.compressionRatio).toBeLessThan(0.8);
        }
      });
    });

    test('should optimize storage for different polygon complexities', () => {
      const complexities = {
        simple: generateRectangle(40.7128, -74.0060, 0.01, 0.01),
        moderate: generateCircularPolygon(40.7128, -74.0060, 0.01, 12),
        complex: generateComplexPolygon(200, 40.7128, -74.0060, 0.02),
        irregular: generateIrregularPolygon(40.7128, -74.0060, 0.015)
      };

      Object.entries(complexities).forEach(([complexity, coords]) => {
        const compressed = validator.compressCoordinateData(coords);
        const storageData = createStorageData(coords, compressed);
        
        expect(storageData.sizeBytes).toBeLessThan(performanceMetrics.storageTargets.maxSize);
        expect(compressed.compressionRatio).toBeLessThan(performanceMetrics.storageTargets.compressionRatio);
        
        console.log(`${complexity}: ${coords.length} → ${compressed.coordinates.length} points, ${storageData.sizeBytes} bytes`);
      });
    });
  });

  describe('Storage Efficiency Tests', () => {
    test('should minimize storage footprint while preserving data integrity', () => {
      Object.entries(testCoordinates).forEach(([sizeName, coordinates]) => {
        const compressed = validator.compressCoordinateData(coordinates);
        const thumbnail = validator.generateBoundaryThumbnail(coordinates);
        
        const storageData = {
          coordinates: compressed.coordinates,
          metadata: {
            originalCount: coordinates.length,
            compressionRatio: compressed.compressionRatio,
            method: compressed.method
          },
          thumbnail: thumbnail?.dataUrl,
          timestamp: new Date().toISOString()
        };

        const jsonString = JSON.stringify(storageData);
        const sizeBytes = new Blob([jsonString]).size;
        
        expect(sizeBytes).toBeLessThan(performanceMetrics.storageTargets.maxSize);
        
        // Test data integrity
        const parsedData = JSON.parse(jsonString);
        expect(parsedData.coordinates).toHaveLength(compressed.coordinates.length);
        expect(parsedData.metadata.originalCount).toBe(coordinates.length);
      });
    });

    test('should handle coordinate precision optimization', () => {
      const highPrecisionCoords = testCoordinates.highPrecision;
      
      // Test different precision levels
      const precisions = [3, 4, 5, 6, 7, 8];
      
      precisions.forEach(precision => {
        const optimized = optimizeCoordinatePrecision(highPrecisionCoords, precision);
        const jsonString = JSON.stringify(optimized);
        const sizeBytes = new Blob([jsonString]).size;
        
        expect(optimized).toHaveLength(highPrecisionCoords.length);
        
        // Higher precision should increase size
        if (precision > 5) {
          expect(sizeBytes).toBeGreaterThan(1000);
        }
        
        console.log(`Precision ${precision}: ${sizeBytes} bytes`);
      });
    });

    test('should implement efficient delta encoding for similar coordinates', () => {
      const clusteredCoords = generateClusteredCoordinates(100, 40.7128, -74.0060, 0.0001);
      
      const deltaEncoded = encodeDeltaCoordinates(clusteredCoords);
      const originalSize = new Blob([JSON.stringify(clusteredCoords)]).size;
      const encodedSize = new Blob([JSON.stringify(deltaEncoded)]).size;
      
      expect(encodedSize).toBeLessThan(originalSize);
      expect(encodedSize / originalSize).toBeLessThan(0.8); // At least 20% compression
      
      // Test decoding accuracy
      const decoded = decodeDeltaCoordinates(deltaEncoded);
      expect(decoded).toHaveLength(clusteredCoords.length);
      
      // Verify coordinate accuracy after delta encoding/decoding
      clusteredCoords.forEach((coord, index) => {
        expect(Math.abs(decoded[index].lat - coord.lat)).toBeLessThan(0.000001);
        expect(Math.abs(decoded[index].lng - coord.lng)).toBeLessThan(0.000001);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet compression performance targets', () => {
      const performanceResults = {};
      
      Object.entries(testCoordinates).forEach(([sizeName, coordinates]) => {
        const iterations = 10;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          validator.compressCoordinateData(coordinates);
          times.push(performance.now() - startTime);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        
        performanceResults[sizeName] = { avgTime, maxTime };
        
        const target = performanceMetrics.compressionTargets[sizeName];
        expect(avgTime).toBeLessThan(target.time);
        expect(maxTime).toBeLessThan(target.time * 2); // Allow 2x variance
      });
      
      console.log('Compression Performance Results:', performanceResults);
    });

    test('should meet storage and retrieval performance targets', async () => {
      const testBoundary = {
        coordinates: testCoordinates.medium,
        area: 5000,
        perimeter: 300,
        units: 'sqft'
      };

      // Test storage performance
      const storageStartTime = performance.now();
      const stored = await storageService.storeBoundaryData('performance-test', testBoundary);
      const storageTime = performance.now() - storageStartTime;
      
      expect(stored).toBe(true);
      expect(storageTime).toBeLessThan(100); // Should store within 100ms
      
      // Test retrieval performance
      const retrievalStartTime = performance.now();
      const retrieved = await storageService.retrieveBoundaryData('performance-test');
      const retrievalTime = performance.now() - retrievalStartTime;
      
      expect(retrieved).toBeDefined();
      expect(retrievalTime).toBeLessThan(performanceMetrics.storageTargets.retrievalTime);
      
      console.log(`Storage: ${storageTime.toFixed(2)}ms, Retrieval: ${retrievalTime.toFixed(2)}ms`);
    });

    test('should handle large dataset processing efficiently', () => {
      const largeDataset = generateCoordinates(5000, 40.7128, -74.0060, 0.5);
      
      const startTime = performance.now();
      const compressed = validator.compressCoordinateData(largeDataset, {
        enabled: true,
        tolerance: 0.0001,
        maxPoints: 1000
      });
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
      expect(compressed.coordinates.length).toBeLessThanOrEqual(1000);
      expect(compressed.compressionRatio).toBeLessThan(0.3); // Significant compression
      
      console.log(`Large dataset: ${largeDataset.length} → ${compressed.coordinates.length} points in ${processingTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Optimization', () => {
    test('should maintain low memory footprint during processing', () => {
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Process multiple large datasets
      for (let i = 0; i < 10; i++) {
        const coords = generateCoordinates(1000, 40.7128 + i * 0.01, -74.0060 + i * 0.01, 0.1);
        const compressed = validator.compressCoordinateData(coords);
        const validated = validator.validateBoundaryCoordinates(compressed.coordinates);
        
        expect(validated.isValid).toBe(true);
      }
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    test('should handle coordinate streaming for very large datasets', () => {
      const streamProcessor = createCoordinateStreamProcessor();
      const testData = generateCoordinates(10000, 40.7128, -74.0060, 1.0);
      
      const startTime = performance.now();
      const result = streamProcessor.processCoordinates(testData, {
        chunkSize: 1000,
        compressionEnabled: true
      });
      const processingTime = performance.now() - startTime;
      
      expect(result.processed).toBe(true);
      expect(result.chunks).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(2000); // Should process within 2 seconds
      
      console.log(`Stream processing: ${testData.length} coordinates in ${result.chunks} chunks, ${processingTime.toFixed(2)}ms`);
    });
  });

  afterAll(() => {
    console.log('Coordinate storage optimization tests completed');
  });
});

// Helper functions
function generateCoordinates(count, baseLat, baseLng, spread) {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const distance = spread * (0.5 + Math.random() * 0.5);
    coordinates.push({
      lat: baseLat + distance * Math.cos(angle),
      lng: baseLng + distance * Math.sin(angle)
    });
  }
  return coordinates;
}

function generateComplexPolygon(count, baseLat, baseLng, spread) {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const distance = spread * (0.3 + Math.random() * 0.7);
    // Add some irregularity
    const irregularity = Math.sin(angle * 5) * 0.1 * spread;
    coordinates.push({
      lat: baseLat + (distance + irregularity) * Math.cos(angle),
      lng: baseLng + (distance + irregularity) * Math.sin(angle)
    });
  }
  return coordinates;
}

function generateHighPrecisionCoordinates(count, baseLat, baseLng, spread) {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const distance = spread * (0.5 + Math.random() * 0.5);
    coordinates.push({
      lat: parseFloat((baseLat + distance * Math.cos(angle)).toFixed(8)),
      lng: parseFloat((baseLng + distance * Math.sin(angle)).toFixed(8))
    });
  }
  return coordinates;
}

function generateRectangle(baseLat, baseLng, width, height) {
  return [
    { lat: baseLat, lng: baseLng },
    { lat: baseLat + height, lng: baseLng },
    { lat: baseLat + height, lng: baseLng + width },
    { lat: baseLat, lng: baseLng + width }
  ];
}

function generateCircularPolygon(baseLat, baseLng, radius, sides) {
  const coordinates = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    coordinates.push({
      lat: baseLat + radius * Math.cos(angle),
      lng: baseLng + radius * Math.sin(angle)
    });
  }
  return coordinates;
}

function generateIrregularPolygon(baseLat, baseLng, spread) {
  return [
    { lat: baseLat, lng: baseLng },
    { lat: baseLat + spread * 0.8, lng: baseLng + spread * 0.2 },
    { lat: baseLat + spread * 0.6, lng: baseLng + spread * 0.9 },
    { lat: baseLat + spread * 0.1, lng: baseLng + spread * 1.1 },
    { lat: baseLat - spread * 0.3, lng: baseLng + spread * 0.7 },
    { lat: baseLat - spread * 0.2, lng: baseLng + spread * 0.1 }
  ];
}

function generateClusteredCoordinates(count, baseLat, baseLng, clusterRadius) {
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = clusterRadius * Math.random();
    coordinates.push({
      lat: baseLat + distance * Math.cos(angle),
      lng: baseLng + distance * Math.sin(angle)
    });
  }
  return coordinates;
}

function optimizeCoordinatePrecision(coordinates, precision) {
  return coordinates.map(coord => ({
    lat: parseFloat(coord.lat.toFixed(precision)),
    lng: parseFloat(coord.lng.toFixed(precision))
  }));
}

function encodeDeltaCoordinates(coordinates) {
  if (coordinates.length === 0) return { base: null, deltas: [] };
  
  const base = coordinates[0];
  const deltas = [];
  
  for (let i = 1; i < coordinates.length; i++) {
    deltas.push({
      lat: coordinates[i].lat - coordinates[i-1].lat,
      lng: coordinates[i].lng - coordinates[i-1].lng
    });
  }
  
  return { base, deltas };
}

function decodeDeltaCoordinates(encoded) {
  if (!encoded.base) return [];
  
  const coordinates = [encoded.base];
  let current = encoded.base;
  
  for (const delta of encoded.deltas) {
    current = {
      lat: current.lat + delta.lat,
      lng: current.lng + delta.lng
    };
    coordinates.push(current);
  }
  
  return coordinates;
}

function calculatePolygonArea(coordinates) {
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  return Math.abs(area) / 2;
}

function createStorageData(coordinates, compressed) {
  const data = {
    coordinates: compressed.coordinates,
    metadata: {
      originalCount: coordinates.length,
      compressionRatio: compressed.compressionRatio,
      method: compressed.method
    },
    timestamp: new Date().toISOString()
  };
  
  const jsonString = JSON.stringify(data);
  return {
    data: data,
    sizeBytes: new Blob([jsonString]).size
  };
}

function createCoordinateStreamProcessor() {
  return {
    processCoordinates: (coordinates, options) => {
      const { chunkSize = 1000, compressionEnabled = true } = options;
      const chunks = [];
      
      for (let i = 0; i < coordinates.length; i += chunkSize) {
        const chunk = coordinates.slice(i, i + chunkSize);
        if (compressionEnabled) {
          const validator = new BoundaryValidationService();
          const compressed = validator.compressCoordinateData(chunk);
          chunks.push(compressed);
        } else {
          chunks.push({ coordinates: chunk });
        }
      }
      
      return {
        processed: true,
        chunks: chunks.length,
        totalCoordinates: coordinates.length
      };
    }
  };
}
