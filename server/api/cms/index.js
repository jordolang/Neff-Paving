const express = require('express');
const router = express.Router();

// Import all CMS route modules
const blogRoutes = require('./blog');
const mediaRoutes = require('./media');
const contentRoutes = require('./content');
const seoRoutes = require('./seo');

// Mount all CMS routes
router.use('/', blogRoutes);    // Blog posts management
router.use('/', mediaRoutes);   // Media file management
router.use('/', contentRoutes); // Content sections management
router.use('/', seoRoutes);     // SEO metadata management

// CMS status endpoint
router.get('/status', async (req, res) => {
  try {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      modules: {
        blog: 'operational',
        media: 'operational',
        content: 'operational',
        seo: 'operational'
      },
      endpoints: {
        blog: [
          'GET /api/cms/posts',
          'GET /api/cms/posts/:id',
          'POST /api/cms/posts',
          'PUT /api/cms/posts/:id',
          'DELETE /api/cms/posts/:id',
          'POST /api/cms/posts/:id/publish'
        ],
        media: [
          'GET /api/cms/media',
          'POST /api/cms/media/upload',
          'DELETE /api/cms/media/:id',
          'PUT /api/cms/media/:id'
        ],
        content: [
          'GET /api/cms/pages/:slug/sections',
          'PUT /api/cms/pages/:slug/sections/:section',
          'GET /api/cms/pages',
          'DELETE /api/cms/pages/:slug/sections/:section',
          'POST /api/cms/pages/:slug/sections',
          'PUT /api/cms/pages/:slug/sections'
        ],
        seo: [
          'GET /api/cms/seo/:page',
          'PUT /api/cms/seo/:page',
          'DELETE /api/cms/seo/:page',
          'GET /api/cms/seo',
          'POST /api/cms/seo'
        ]
      }
    });
  } catch (error) {
    console.error('Error getting CMS status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get CMS status',
      details: error.message
    });
  }
});

// CMS health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Test database connection from one of the modules
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'neff_paving_admin',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('CMS Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
