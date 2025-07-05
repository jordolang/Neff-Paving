const express = require('express');
const { pool } = require('../server');
const router = express.Router();

// Get dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
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

// Get recent activities
router.get('/dashboard/activities', async (req, res) => {
  try {
    // Mock data for now
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

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    // Mock data for now
    const customers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        address: '123 Main St, City, State',
        totalProjects: 2,
        lastProject: '2024-01-15'
      }
    ];

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;