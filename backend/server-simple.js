const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api', require('./routes'));

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Serve main app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Admin panel available at http://localhost:${PORT}/admin`);
  console.log(`Main site available at http://localhost:${PORT}`);
});

module.exports = app;