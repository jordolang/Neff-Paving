const express = require('express');
const { pool } = require('../server');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Create new estimate request
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      serviceType,
      projectAddress,
      projectSize,
      timeline,
      projectDescription,
      siteVisit,
      emergency,
      maintenance,
      areaData
    } = req.body;

    const estimate = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      phone,
      serviceType,
      projectAddress,
      projectSize,
      timeline,
      projectDescription,
      siteVisit: siteVisit === 'yes',
      emergency: emergency === 'yes',
      maintenance: maintenance === 'yes',
      areaData: areaData || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // For now, store in memory - replace with database insert
    // In production: INSERT INTO estimates (...)
    
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

// Get all estimates (admin)
router.get('/', async (req, res) => {
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
          area: 500,
          perimeter: 90,
          coordinates: []
        }
      }
    ];

    res.json({ success: true, data: estimates });
  } catch (error) {
    console.error('Get estimates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update estimate status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Update estimate status in database
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Estimate status updated successfully'
    });
  } catch (error) {
    console.error('Update estimate error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;