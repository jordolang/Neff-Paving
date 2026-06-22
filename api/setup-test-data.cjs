#!/usr/bin/env node
/**
 * Setup script for customer portal test data
 * Creates test customer account for end-to-end verification
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neff_paving_admin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  console.log('Running database migrations...');

  const migrations = [
    path.join(__dirname, 'migrations', '001_create_customers.sql'),
    path.join(__dirname, 'migrations', '002_link_existing_data.sql'),
  ];

  for (const migrationFile of migrations) {
    if (fs.existsSync(migrationFile)) {
      console.log(`Running ${path.basename(migrationFile)}...`);
      const sql = fs.readFileSync(migrationFile, 'utf8');
      try {
        await pool.query(sql);
        console.log(`✓ ${path.basename(migrationFile)} completed`);
      } catch (error) {
        // Check if error is because table already exists
        if (error.message.includes('already exists')) {
          console.log(`  (Table already exists, skipping)`);
        } else {
          throw error;
        }
      }
    }
  }
}

async function createTestCustomer() {
  console.log('\nCreating test customer account...');

  const testCustomer = {
    email: 'test@example.com',
    password: 'testpass123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-123-4567',
  };

  try {
    // Check if customer already exists
    const existing = await pool.query(
      'SELECT id FROM customers WHERE email = $1',
      [testCustomer.email]
    );

    if (existing.rows.length > 0) {
      console.log(`✓ Test customer already exists (${testCustomer.email})`);
      return existing.rows[0].id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testCustomer.password, 10);

    // Create customer
    const result = await pool.query(
      `INSERT INTO customers (email, password_hash, first_name, last_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [testCustomer.email, passwordHash, testCustomer.firstName, testCustomer.lastName, testCustomer.phone]
    );

    console.log(`✓ Test customer created (${testCustomer.email})`);
    return result.rows[0].id;
  } catch (error) {
    throw new Error(`Failed to create test customer: ${error.message}`);
  }
}

async function createTestData(customerId) {
  console.log('\nCreating test project data...');

  try {
    // Create estimate
    const estimate = await pool.query(
      `INSERT INTO estimates (customer_id, property_address, square_footage, material_type,
        base_cost, material_cost, labor_cost, total_cost, estimated_duration_days, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        customerId,
        '123 Main St, Springfield, IL',
        2500,
        'asphalt',
        5000.00,
        8000.00,
        7000.00,
        20000.00,
        5,
        'approved',
        'Standard driveway paving project'
      ]
    );
    console.log(`✓ Test estimate created`);

    // Create contract
    const contract = await pool.query(
      `INSERT INTO contracts (customer_id, estimate_id, total_amount, deposit_amount,
        start_date, end_date, status, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        customerId,
        estimate.rows[0].id,
        20000.00,
        5000.00,
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        'active',
        'Standard terms and conditions'
      ]
    );
    console.log(`✓ Test contract created`);

    // Create payment
    await pool.query(
      `INSERT INTO payments (customer_id, contract_id, amount, payment_method,
        stripe_payment_intent_id, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customerId,
        contract.rows[0].id,
        5000.00,
        'card',
        'pi_test_123456',
        'succeeded',
        new Date()
      ]
    );
    console.log(`✓ Test payment created`);

    // Create schedule
    await pool.query(
      `INSERT INTO schedules (customer_id, contract_id, start_date, end_date,
        status, milestones)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        customerId,
        contract.rows[0].id,
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'in_progress',
        JSON.stringify([
          { name: 'Site Preparation', date: new Date(), completed: true },
          { name: 'Base Installation', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), completed: false },
          { name: 'Asphalt Paving', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), completed: false },
        ])
      ]
    );
    console.log(`✓ Test schedule created`);

  } catch (error) {
    throw new Error(`Failed to create test data: ${error.message}`);
  }
}

async function main() {
  try {
    console.log('=================================');
    console.log('Customer Portal Test Data Setup');
    console.log('=================================\n');

    // Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');

    // Run migrations
    await runMigrations();

    // Create test customer
    const customerId = await createTestCustomer();

    // Create test data
    await createTestData(customerId);

    console.log('\n=================================');
    console.log('Setup Complete!');
    console.log('=================================');
    console.log('\nTest credentials:');
    console.log('  Email:    test@example.com');
    console.log('  Password: testpass123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
