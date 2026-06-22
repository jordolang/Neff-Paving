const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Customer Model
 * Handles customer authentication and account operations
 */
class Customer {
  /**
   * Find customer by email
   * @param {string} email - Customer email address
   * @returns {Promise<Object|null>} Customer object or null if not found
   */
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding customer by email: ${error.message}`);
    }
  }

  /**
   * Find customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise<Object|null>} Customer object or null if not found
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM customers WHERE id = $1',
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding customer by ID: ${error.message}`);
    }
  }

  /**
   * Create new customer account
   * @param {Object} customerData - Customer registration data
   * @param {string} customerData.email - Customer email
   * @param {string} customerData.password - Plain text password (will be hashed)
   * @param {string} customerData.firstName - Customer first name
   * @param {string} customerData.lastName - Customer last name
   * @param {string} customerData.phone - Customer phone number (optional)
   * @returns {Promise<Object>} Created customer object (without password_hash)
   */
  static async create(customerData) {
    const { email, password, firstName, lastName, phone } = customerData;

    try {
      // Check if customer already exists
      const existingCustomer = await this.findByEmail(email);
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert customer
      const result = await pool.query(
        `INSERT INTO customers (email, password_hash, first_name, last_name, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, phone, is_active, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, phone || null, true]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating customer: ${error.message}`);
    }
  }

  /**
   * Verify customer password
   * @param {string} email - Customer email
   * @param {string} password - Plain text password to verify
   * @returns {Promise<Object|null>} Customer object (without password_hash) if password is valid, null otherwise
   */
  static async verifyPassword(email, password) {
    try {
      const customer = await this.findByEmail(email);

      if (!customer) {
        return null;
      }

      // Check if account is active
      if (!customer.is_active) {
        throw new Error('Account is not active');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, customer.password_hash);

      if (!isValid) {
        return null;
      }

      // Update last login timestamp
      await pool.query(
        'UPDATE customers SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [customer.id]
      );

      // Return customer without password_hash
      const { password_hash, ...customerWithoutPassword } = customer;
      return customerWithoutPassword;
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  /**
   * Update customer information
   * @param {number} id - Customer ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated customer object (without password_hash)
   */
  static async update(id, updates) {
    try {
      const allowedFields = ['first_name', 'last_name', 'phone', 'is_active'];
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE customers SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, email, first_name, last_name, phone, is_active, created_at, updated_at`,
        values
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
  }

  /**
   * Update customer password
   * @param {number} id - Customer ID
   * @param {string} newPassword - New plain text password
   * @returns {Promise<boolean>} True if password updated successfully
   */
  static async updatePassword(id, newPassword) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await pool.query(
        'UPDATE customers SET password_hash = $1 WHERE id = $2',
        [passwordHash, id]
      );

      return true;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  /**
   * Deactivate customer account
   * @param {number} id - Customer ID
   * @returns {Promise<boolean>} True if deactivated successfully
   */
  static async deactivate(id) {
    try {
      await pool.query(
        'UPDATE customers SET is_active = false WHERE id = $1',
        [id]
      );
      return true;
    } catch (error) {
      throw new Error(`Error deactivating customer: ${error.message}`);
    }
  }
}

module.exports = Customer;
