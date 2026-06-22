const express = require('express');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate customer and return JWT token
 *
 * Request body:
 * {
 *   "email": "customer@example.com",
 *   "password": "password123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "jwt_token_here",
 *     "customer": {
 *       "id": 1,
 *       "email": "customer@example.com",
 *       "firstName": "John",
 *       "lastName": "Doe"
 *     }
 *   }
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Verify customer credentials
    const customer = await Customer.verifyPassword(email, password);

    if (!customer) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify JWT_SECRET is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        type: 'customer'
      },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // Return success response with token and customer data
    res.json({
      success: true,
      data: {
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          isActive: customer.is_active
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout customer (client-side token removal)
 *
 * Note: JWT tokens are stateless, so logout is handled client-side
 * by removing the token. This endpoint exists for consistency and
 * future server-side session tracking if needed.
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token from storage. This endpoint can be extended
    // to maintain a blacklist of tokens or track sessions in the future.

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return customer data
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "customer": {
 *       "id": 1,
 *       "email": "customer@example.com",
 *       "firstName": "John",
 *       "lastName": "Doe"
 *     }
 *   }
 * }
 */
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Token is already verified by authenticateToken middleware
    // req.user contains the decoded token data
    const customerId = req.user.id;

    // Fetch current customer data from database
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        message: 'Customer account no longer exists'
      });
    }

    if (!customer.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: 'Customer account is not active'
      });
    }

    // Return customer data (without password_hash)
    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          isActive: customer.is_active,
          lastLoginAt: customer.last_login_at
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message
    });
  }
});

module.exports = router;
