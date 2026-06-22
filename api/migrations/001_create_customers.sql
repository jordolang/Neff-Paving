-- Migration: Create customers table with authentication fields
-- Description: Customer authentication table for the customer portal
-- This table stores customer account information for secure portal access

-- Drop table if it exists (for clean re-runs during development)
DROP TABLE IF EXISTS customers CASCADE;

-- Create customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- Add comment to table
COMMENT ON TABLE customers IS 'Customer authentication and account information for the customer portal';
COMMENT ON COLUMN customers.email IS 'Customer email address, used for login authentication';
COMMENT ON COLUMN customers.password_hash IS 'Bcrypt hashed password for secure authentication';
COMMENT ON COLUMN customers.is_active IS 'Flag to enable/disable customer portal access';
COMMENT ON COLUMN customers.last_login_at IS 'Timestamp of last successful login';

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at on row updates
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
