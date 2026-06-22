const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/customer/project
 * Get all project data for the authenticated customer
 * (estimates, contracts, payments, schedules in a single response)
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "estimates": [...],
 *     "contracts": [...],
 *     "payments": [...],
 *     "schedules": [...]
 *   }
 * }
 */
router.get('/project', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const [estimates, contracts, payments, schedules] = await Promise.all([
      pool.query(
        `SELECT id, square_feet, service_type, base_cost, material_cost, labor_cost,
                total_cost, complexity, accessibility, season, urgency, discount, premium,
                materials, timeline_days, timeline_start_date, timeline_end_date,
                breakdown, status, notes, created_at, updated_at
         FROM estimates
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [customerId]
      ),
      pool.query(
        `SELECT id, estimate_id, contract_type, contract_number, title,
                scope_of_work, materials_description, total_amount, deposit_amount,
                payment_terms, warranty_period, start_date, end_date, pdf_url,
                status, signed_at, signed_by_customer, signed_by_company, notes,
                created_at, updated_at
         FROM contracts
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [customerId]
      ),
      pool.query(
        `SELECT id, contract_id, amount, currency, payment_method, payment_type,
                status, gateway_transaction_id, stripe_payment_intent_id,
                refunded_amount, captured_amount, captured_at, expires_at,
                metadata, notes, created_at, updated_at
         FROM payments
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [customerId]
      ),
      pool.query(
        `SELECT id, contract_id, project_name, project_description, start_date,
                end_date, estimated_days, actual_start_date, actual_end_date,
                status, progress_percentage, current_phase, milestones,
                weather_delays, crew_assigned, notes, created_at, updated_at
         FROM schedules
         WHERE customer_id = $1
         ORDER BY start_date DESC`,
        [customerId]
      )
    ]);

    res.json({
      success: true,
      data: {
        estimates: estimates.rows,
        contracts: contracts.rows,
        payments: payments.rows,
        schedules: schedules.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project data',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/estimates
 * Get all estimates for the authenticated customer
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "estimates": [...]
 *   }
 * }
 */
router.get('/estimates', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await pool.query(
      `SELECT id, square_feet, service_type, base_cost, material_cost, labor_cost,
              total_cost, complexity, accessibility, season, urgency, discount, premium,
              materials, timeline_days, timeline_start_date, timeline_end_date,
              breakdown, status, notes, created_at, updated_at
       FROM estimates
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        estimates: result.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch estimates',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/estimates/:id
 * Get a specific estimate by ID
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "estimate": {...}
 *   }
 * }
 */
router.get('/estimates/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const estimateId = req.params.id;

    const result = await pool.query(
      `SELECT id, square_feet, service_type, base_cost, material_cost, labor_cost,
              total_cost, complexity, accessibility, season, urgency, discount, premium,
              materials, timeline_days, timeline_start_date, timeline_end_date,
              breakdown, status, notes, created_at, updated_at
       FROM estimates
       WHERE id = $1 AND customer_id = $2`,
      [estimateId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estimate not found',
        message: 'The requested estimate does not exist or does not belong to this customer'
      });
    }

    res.json({
      success: true,
      data: {
        estimate: result.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch estimate',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/contracts
 * Get all contracts for the authenticated customer
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "contracts": [...]
 *   }
 * }
 */
router.get('/contracts', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await pool.query(
      `SELECT id, estimate_id, contract_type, contract_number, title,
              scope_of_work, materials_description, total_amount, deposit_amount,
              payment_terms, warranty_period, start_date, end_date, pdf_url,
              status, signed_at, signed_by_customer, signed_by_company, notes,
              created_at, updated_at
       FROM contracts
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        contracts: result.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/contracts/:id
 * Get a specific contract by ID
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "contract": {...}
 *   }
 * }
 */
router.get('/contracts/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const contractId = req.params.id;

    const result = await pool.query(
      `SELECT id, estimate_id, contract_type, contract_number, title,
              scope_of_work, materials_description, total_amount, deposit_amount,
              payment_terms, warranty_period, start_date, end_date, pdf_url,
              status, signed_at, signed_by_customer, signed_by_company, notes,
              created_at, updated_at
       FROM contracts
       WHERE id = $1 AND customer_id = $2`,
      [contractId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found',
        message: 'The requested contract does not exist or does not belong to this customer'
      });
    }

    res.json({
      success: true,
      data: {
        contract: result.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/payments
 * Get all payments for the authenticated customer
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payments": [...]
 *   }
 * }
 */
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await pool.query(
      `SELECT id, contract_id, amount, currency, payment_method, payment_type,
              status, gateway_transaction_id, stripe_payment_intent_id,
              refunded_amount, captured_amount, captured_at, expires_at,
              metadata, notes, created_at, updated_at
       FROM payments
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        payments: result.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/payments/:id
 * Get a specific payment by ID
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payment": {...}
 *   }
 * }
 */
router.get('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const paymentId = req.params.id;

    const result = await pool.query(
      `SELECT id, contract_id, amount, currency, payment_method, payment_type,
              status, gateway_transaction_id, stripe_payment_intent_id,
              refunded_amount, captured_amount, captured_at, expires_at,
              metadata, notes, created_at, updated_at
       FROM payments
       WHERE id = $1 AND customer_id = $2`,
      [paymentId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist or does not belong to this customer'
      });
    }

    res.json({
      success: true,
      data: {
        payment: result.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/schedules
 * Get all schedules for the authenticated customer
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "schedules": [...]
 *   }
 * }
 */
router.get('/schedules', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const result = await pool.query(
      `SELECT id, contract_id, project_name, project_description, start_date,
              end_date, estimated_days, actual_start_date, actual_end_date,
              status, progress_percentage, current_phase, milestones,
              weather_delays, crew_assigned, notes, created_at, updated_at
       FROM schedules
       WHERE customer_id = $1
       ORDER BY start_date DESC`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        schedules: result.rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
      message: error.message
    });
  }
});

/**
 * GET /api/customer/schedules/:id
 * Get a specific schedule by ID
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "schedule": {...}
 *   }
 * }
 */
router.get('/schedules/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const scheduleId = req.params.id;

    const result = await pool.query(
      `SELECT id, contract_id, project_name, project_description, start_date,
              end_date, estimated_days, actual_start_date, actual_end_date,
              status, progress_percentage, current_phase, milestones,
              weather_delays, crew_assigned, notes, created_at, updated_at
       FROM schedules
       WHERE id = $1 AND customer_id = $2`,
      [scheduleId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found',
        message: 'The requested schedule does not exist or does not belong to this customer'
      });
    }

    res.json({
      success: true,
      data: {
        schedule: result.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule',
      message: error.message
    });
  }
});

module.exports = router;
