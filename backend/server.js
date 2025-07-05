const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neff_paving_admin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving with proper headers
app.use('/admin', express.static(path.join(__dirname, '../dist/admin'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for admin assets
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
      // Prevent caching for HTML files to ensure updates are served
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Serve main application static files
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, path) => {
    // Cache static assets for performance
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/estimates', require('./routes/estimates'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/maps', require('./routes/maps'));

// Enhanced SPA fallback routing for admin panel
app.get('/admin*', (req, res, next) => {
  const adminIndexPath = path.join(__dirname, '../dist/admin/index.html');
  
  // Check if admin index.html exists
  if (!require('fs').existsSync(adminIndexPath)) {
    console.error('Admin panel not found. Please run the build process.');
    return res.status(404).json({ 
      error: 'Admin panel not deployed',
      message: 'Please run npm run build to deploy the admin panel'
    });
  }
  
  // Log admin access for monitoring
  console.log(`Admin panel accessed: ${req.originalUrl} from ${req.ip}`);
  
  // Set security headers for admin panel
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  res.sendFile(adminIndexPath);
});

// Health check with admin panel status
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    // Check admin panel deployment status
    const adminDeployed = require('fs').existsSync(path.join(__dirname, '../dist/admin/index.html'));
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      adminPanel: adminDeployed ? 'deployed' : 'not deployed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Main application SPA fallback (should be last)
app.get('*', (req, res, next) => {
  // Skip API routes and admin routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) {
    return next();
  }
  
  const mainIndexPath = path.join(__dirname, '../dist/index.html');
  
  // Check if main index.html exists
  if (!require('fs').existsSync(mainIndexPath)) {
    return res.status(404).json({ 
      error: 'Application not built',
      message: 'Please run npm run build to build the application'
    });
  }
  
  // Set proper headers for main SPA
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(mainIndexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = { app, pool };