const express = require('express');
const router = express.Router();

// Calculate area from coordinates
router.post('/calculate-area', (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 coordinates are required'
      });
    }

    // Calculate area using the shoelace formula
    const area = calculatePolygonArea(coordinates);
    const perimeter = calculatePerimeter(coordinates);

    res.json({
      success: true,
      data: {
        area: Math.round(area * 100) / 100, // Round to 2 decimal places
        perimeter: Math.round(perimeter * 100) / 100,
        areaInSquareFeet: Math.round(area * 10.764 * 100) / 100, // Convert m² to ft²
        areaInAcres: Math.round(area * 0.000247105 * 100) / 100, // Convert m² to acres
        coordinates: coordinates
      }
    });
  } catch (error) {
    console.error('Calculate area error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to calculate polygon area using shoelace formula
function calculatePolygonArea(coordinates) {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }

  area = Math.abs(area) / 2;

  // Convert to square meters (rough approximation)
  // This is a simplified calculation - for accurate results, use proper geodesic calculations
  const latToMeters = 111320; // Approximate meters per degree latitude
  const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
  const lngToMeters = latToMeters * Math.cos(avgLat * Math.PI / 180);

  return area * latToMeters * lngToMeters;
}

// Helper function to calculate perimeter
function calculatePerimeter(coordinates) {
  if (coordinates.length < 2) return 0;

  let perimeter = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const distance = calculateDistance(coordinates[i], coordinates[j]);
    perimeter += distance;
  }

  return perimeter;
}

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = point1.lat * Math.PI / 180;
  const lat2Rad = point2.lat * Math.PI / 180;
  const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
  const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) *
           Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = router;