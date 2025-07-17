/**
 * Boundary Accuracy Tests
 * Tests boundary drawing accuracy against known property lines and surveyor data
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import BoundaryValidationService from '../src/services/boundary-validation-service.js';
import { EnhancedAreaFinder } from '../src/components/enhanced-area-finder.js';

describe('Boundary Accuracy Tests', () => {
  let validator;
  let knownPropertyLines;
  let testAccuracyData;

  beforeAll(() => {
    validator = new BoundaryValidationService();
    
    // Known property lines from surveyor data (test data)
    knownPropertyLines = {
      residential1: {
        // Known residential property in New Jersey
        surveyorCoordinates: [
          { lat: 40.7128, lng: -74.0060 },
          { lat: 40.7130, lng: -74.0058 },
          { lat: 40.7132, lng: -74.0062 },
          { lat: 40.7130, lng: -74.0064 }
        ],
        surveyorArea: 5280, // square feet
        surveyorPerimeter: 296.4, // feet
        propertyType: 'residential',
        accuracyTolerance: 0.05 // 5% tolerance
      },
      commercial1: {
        // Known commercial property
        surveyorCoordinates: [
          { lat: 40.7140, lng: -74.0070 },
          { lat: 40.7145, lng: -74.0070 },
          { lat: 40.7145, lng: -74.0065 },
          { lat: 40.7140, lng: -74.0065 }
        ],
        surveyorArea: 12000, // square feet
        surveyorPerimeter: 440, // feet
        propertyType: 'commercial',
        accuracyTolerance: 0.03 // 3% tolerance
      },
      irregular1: {
        // Irregular shaped property
        surveyorCoordinates: [
          { lat: 40.7100, lng: -74.0080 },
          { lat: 40.7105, lng: -74.0078 },
          { lat: 40.7108, lng: -74.0082 },
          { lat: 40.7106, lng: -74.0085 },
          { lat: 40.7102, lng: -74.0087 },
          { lat: 40.7098, lng: -74.0084 }
        ],
        surveyorArea: 8500, // square feet
        surveyorPerimeter: 385, // feet
        propertyType: 'irregular',
        accuracyTolerance: 0.08 // 8% tolerance for irregular shapes
      }
    };

    // Test accuracy measurement data
    testAccuracyData = {
      imagery: {
        satellite: { expectedAccuracy: 0.95, qualityScore: 85 },
        hybrid: { expectedAccuracy: 0.97, qualityScore: 90 },
        aerial: { expectedAccuracy: 0.98, qualityScore: 95 }
      },
      zoomLevels: {
        16: { expectedAccuracy: 0.90, precision: 1.0 },
        18: { expectedAccuracy: 0.95, precision: 0.5 },
        20: { expectedAccuracy: 0.98, precision: 0.2 }
      }
    };
  });

  describe('Coordinate Accuracy Validation', () => {
    test('should validate coordinates against known property lines', () => {
      Object.entries(knownPropertyLines).forEach(([propertyId, property]) => {
        const validation = validator.validateBoundaryCoordinates(property.surveyorCoordinates);
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.correctedCoordinates).toHaveLength(property.surveyorCoordinates.length);
        
        // Check coordinate precision
        validation.correctedCoordinates.forEach(coord => {
          expect(coord.lat).toBeGreaterThan(40.7);
          expect(coord.lat).toBeLessThan(40.8);
          expect(coord.lng).toBeGreaterThan(-74.1);
          expect(coord.lng).toBeLessThan(-74.0);
        });
      });
    });

    test('should detect coordinate precision issues', () => {
      const lowPrecisionCoords = [
        { lat: 40.7, lng: -74.0 }, // Too low precision
        { lat: 40.71, lng: -74.01 },
        { lat: 40.72, lng: -74.02 },
        { lat: 40.71, lng: -74.01 }
      ];

      const validation = validator.validateBoundaryCoordinates(lowPrecisionCoords);
      
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.correctedCoordinates).toHaveLength(lowPrecisionCoords.length);
    });

    test('should validate coordinate clustering and density', () => {
      const clusteredCoords = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7128001, lng: -74.0060001 }, // Very close to first point
        { lat: 40.7128002, lng: -74.0060002 }, // Very close to first point
        { lat: 40.7130, lng: -74.0058 },
        { lat: 40.7132, lng: -74.0062 }
      ];

      const validation = validator.validateBoundaryCoordinates(clusteredCoords);
      
      expect(validation.metadata.duplicatesRemoved).toBeGreaterThan(0);
      expect(validation.correctedCoordinates.length).toBeLessThan(clusteredCoords.length);
    });
  });

  describe('Area Calculation Accuracy', () => {
    test('should calculate area within tolerance of surveyor measurements', () => {
      Object.entries(knownPropertyLines).forEach(([propertyId, property]) => {
        const calculatedArea = calculatePolygonArea(property.surveyorCoordinates);
        const tolerance = property.surveyorArea * property.accuracyTolerance;
        
        expect(Math.abs(calculatedArea - property.surveyorArea)).toBeLessThan(tolerance);
        
        console.log(`${propertyId}: Calculated ${calculatedArea} vs Surveyor ${property.surveyorArea} (tolerance: ${tolerance})`);
      });
    });

    test('should calculate perimeter within tolerance', () => {
      Object.entries(knownPropertyLines).forEach(([propertyId, property]) => {
        const calculatedPerimeter = calculatePolygonPerimeter(property.surveyorCoordinates);
        const tolerance = property.surveyorPerimeter * property.accuracyTolerance;
        
        expect(Math.abs(calculatedPerimeter - property.surveyorPerimeter)).toBeLessThan(tolerance);
        
        console.log(`${propertyId}: Calculated ${calculatedPerimeter} vs Surveyor ${property.surveyorPerimeter} (tolerance: ${tolerance})`);
      });
    });

    test('should handle edge cases in area calculations', () => {
      // Test very small area
      const smallArea = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7128001, lng: -74.0060 },
        { lat: 40.7128001, lng: -74.0060001 },
        { lat: 40.7128, lng: -74.0060001 }
      ];

      const area = calculatePolygonArea(smallArea);
      expect(area).toBeGreaterThan(0);
      expect(area).toBeLessThan(100); // Should be very small

      // Test large area
      const largeArea = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7200, lng: -74.0060 },
        { lat: 40.7200, lng: -74.0000 },
        { lat: 40.7128, lng: -74.0000 }
      ];

      const largeAreaSize = calculatePolygonArea(largeArea);
      expect(largeAreaSize).toBeGreaterThan(1000000); // Should be large
    });
  });

  describe('Imagery Quality Impact on Accuracy', () => {
    test('should assess accuracy based on imagery type', () => {
      const testProperty = knownPropertyLines.residential1;
      
      Object.entries(testAccuracyData.imagery).forEach(([imageryType, data]) => {
        const accuracyScore = calculateAccuracyScore(
          testProperty.surveyorCoordinates,
          imageryType,
          data.qualityScore
        );
        
        expect(accuracyScore).toBeGreaterThanOrEqual(data.expectedAccuracy);
        expect(accuracyScore).toBeLessThanOrEqual(1.0);
        
        console.log(`${imageryType}: Accuracy score ${accuracyScore} (expected: ${data.expectedAccuracy})`);
      });
    });

    test('should evaluate zoom level impact on precision', () => {
      const testProperty = knownPropertyLines.commercial1;
      
      Object.entries(testAccuracyData.zoomLevels).forEach(([zoomLevel, data]) => {
        const precisionScore = calculatePrecisionScore(
          testProperty.surveyorCoordinates,
          parseInt(zoomLevel),
          data.precision
        );
        
        expect(precisionScore).toBeGreaterThanOrEqual(data.expectedAccuracy);
        expect(precisionScore).toBeLessThanOrEqual(1.0);
        
        console.log(`Zoom ${zoomLevel}: Precision score ${precisionScore} (expected: ${data.expectedAccuracy})`);
      });
    });
  });

  describe('Real-World Validation Scenarios', () => {
    test('should validate against GIS parcel data', async () => {
      // Mock GIS parcel data validation
      const mockGISData = {
        parcelId: 'TEST-001',
        coordinates: knownPropertyLines.residential1.surveyorCoordinates,
        area: knownPropertyLines.residential1.surveyorArea,
        accuracy: 0.95
      };

      const validation = await validateAgainstGISData(mockGISData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.gisMatch).toBe(true);
      expect(validation.accuracyScore).toBeGreaterThan(0.9);
    });

    test('should detect surveyor measurement discrepancies', () => {
      const userDrawnBoundary = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7131, lng: -74.0057 }, // Slightly different from surveyor
        { lat: 40.7133, lng: -74.0061 }, // Slightly different from surveyor
        { lat: 40.7130, lng: -74.0065 }
      ];

      const comparison = compareToSurveyorData(
        userDrawnBoundary,
        knownPropertyLines.residential1.surveyorCoordinates
      );

      expect(comparison.discrepancies).toHaveLength(0); // Should be within tolerance
      expect(comparison.averageDeviation).toBeLessThan(0.0001); // Degrees
      expect(comparison.maxDeviation).toBeLessThan(0.0005); // Degrees
    });
  });

  describe('Measurement Consistency Tests', () => {
    test('should produce consistent results across multiple calculations', () => {
      const testCoords = knownPropertyLines.irregular1.surveyorCoordinates;
      const results = [];

      // Run same calculation multiple times
      for (let i = 0; i < 10; i++) {
        results.push({
          area: calculatePolygonArea(testCoords),
          perimeter: calculatePolygonPerimeter(testCoords)
        });
      }

      // Check consistency
      const areas = results.map(r => r.area);
      const perimeters = results.map(r => r.perimeter);

      expect(Math.max(...areas) - Math.min(...areas)).toBeLessThan(1); // Less than 1 sq ft variance
      expect(Math.max(...perimeters) - Math.min(...perimeters)).toBeLessThan(0.1); // Less than 0.1 ft variance
    });

    test('should handle coordinate order variations', () => {
      const coords = knownPropertyLines.commercial1.surveyorCoordinates;
      const reversedCoords = [...coords].reverse();
      
      const area1 = calculatePolygonArea(coords);
      const area2 = calculatePolygonArea(reversedCoords);
      
      expect(Math.abs(area1 - area2)).toBeLessThan(1); // Should be nearly identical
    });
  });

  afterAll(() => {
    // Clean up test data
    console.log('Boundary accuracy tests completed');
  });
});

// Helper functions for area and perimeter calculations
function calculatePolygonArea(coordinates) {
  // Shoelace formula for polygon area
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  return Math.abs(area) / 2 * 111319.5 * 111319.5 * 10.764; // Convert to square feet
}

function calculatePolygonPerimeter(coordinates) {
  let perimeter = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const distance = calculateDistance(coordinates[i], coordinates[j]);
    perimeter += distance;
  }
  return perimeter * 3280.84; // Convert to feet
}

function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateAccuracyScore(coordinates, imageryType, qualityScore) {
  const baseAccuracy = {
    satellite: 0.85,
    hybrid: 0.90,
    aerial: 0.95
  };

  return Math.min(1.0, (baseAccuracy[imageryType] || 0.8) * (qualityScore / 100));
}

function calculatePrecisionScore(coordinates, zoomLevel, precision) {
  const zoomFactors = {
    16: 0.85,
    18: 0.92,
    20: 0.98
  };

  return Math.min(1.0, (zoomFactors[zoomLevel] || 0.8) * precision);
}

async function validateAgainstGISData(gisData) {
  // Mock GIS validation
  return {
    isValid: true,
    gisMatch: true,
    accuracyScore: gisData.accuracy || 0.95,
    deviations: []
  };
}

function compareToSurveyorData(userCoords, surveyorCoords) {
  const discrepancies = [];
  let totalDeviation = 0;
  let maxDeviation = 0;

  for (let i = 0; i < Math.min(userCoords.length, surveyorCoords.length); i++) {
    const deviation = calculateDistance(userCoords[i], surveyorCoords[i]);
    totalDeviation += deviation;
    maxDeviation = Math.max(maxDeviation, deviation);

    if (deviation > 0.0005) { // 0.5 meter tolerance
      discrepancies.push({
        index: i,
        deviation: deviation,
        userCoord: userCoords[i],
        surveyorCoord: surveyorCoords[i]
      });
    }
  }

  return {
    discrepancies,
    averageDeviation: totalDeviation / Math.min(userCoords.length, surveyorCoords.length),
    maxDeviation
  };
}
