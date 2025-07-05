// Combined routes file to fix require issues
const express = require('express');
const router = express.Router();

// Auth routes
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // For now, use environment variables for admin auth
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      const token = require('jsonwebtoken').sign(
        { userId: 1, username: adminUsername, role: 'admin' },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: 1,
          username: adminUsername,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Estimates routes
router.post('/estimates', async (req, res) => {
  try {
    const estimate = {
      id: require('uuid').v4(),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // In production, save to database
    console.log('New estimate received:', estimate);
    
    res.json({
      success: true,
      message: 'Estimate request submitted successfully',
      estimateId: estimate.id
    });
  } catch (error) {
    console.error('Estimate creation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/estimates', async (req, res) => {
  try {
    // Mock data for now
    const estimates = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        serviceType: 'residential',
        projectAddress: '123 Main St, City, State',
        projectSize: '500 sq ft',
        timeline: '2weeks',
        status: 'pending',
        createdAt: new Date().toISOString(),
        areaData: {
          area: 46.45,
          perimeter: 28.28,
          areaInSquareFeet: 500,
          areaInAcres: 0.01
        }
      }
    ];

    res.json({ success: true, data: estimates });
  } catch (error) {
    console.error('Get estimates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin dashboard routes
router.get('/admin/dashboard/stats', async (req, res) => {
  try {
    const stats = {
      totalProjects: 245,
      activeProjects: 18,
      completedThisMonth: 23,
      revenue: 125000,
      pendingEstimates: 12,
      scheduledJobs: 8
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/admin/dashboard/activities', async (req, res) => {
  try {
    const activities = [
      {
        id: 1,
        type: 'estimate_request',
        message: 'New estimate request from John Doe',
        timestamp: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: 2,
        type: 'job_scheduled',
        message: 'Commercial project scheduled for next week',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      }
    ];

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Maps calculation route
router.post('/maps/calculate-area', (req, res) => {
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
        area: Math.round(area * 100) / 100,
        perimeter: Math.round(perimeter * 100) / 100,
        areaInSquareFeet: Math.round(area * 10.764 * 100) / 100,
        areaInAcres: Math.round(area * 0.000247105 * 100) / 100,
        coordinates: coordinates
      }
    });
  } catch (error) {
    console.error('Calculate area error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
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

  const latToMeters = 111320;
  const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
  const lngToMeters = latToMeters * Math.cos(avgLat * Math.PI / 180);

  return area * latToMeters * lngToMeters;
}

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

function calculateDistance(point1, point2) {
  const R = 6371000;
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