-- Migration: Create linking tables for estimates, contracts, payments, and schedules
-- Description: Links existing business entities (estimates, contracts, payments, schedules) to customers
-- This enables the customer portal to display project status, contract details, and payment information

-- Drop tables if they exist (for clean re-runs during development)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;

-- Create estimates table
CREATE TABLE estimates (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    square_feet DECIMAL(10, 2) NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('residential', 'commercial')),
    base_cost DECIMAL(10, 2) NOT NULL,
    material_cost DECIMAL(10, 2) NOT NULL,
    labor_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    complexity VARCHAR(20) CHECK (complexity IN ('simple', 'moderate', 'complex')),
    accessibility VARCHAR(20) CHECK (accessibility IN ('easy', 'moderate', 'difficult')),
    season VARCHAR(20) CHECK (season IN ('peak', 'regular', 'offSeason')),
    urgency VARCHAR(20) CHECK (urgency IN ('standard', 'rush', 'emergency')),
    discount DECIMAL(5, 4) DEFAULT 0,
    premium BOOLEAN DEFAULT false,
    materials JSONB,
    timeline_days INTEGER,
    timeline_start_date DATE,
    timeline_end_date DATE,
    breakdown JSONB,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create contracts table
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('residential', 'commercial')),
    contract_number VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    scope_of_work TEXT NOT NULL,
    materials_description TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2),
    payment_terms VARCHAR(100),
    warranty_period VARCHAR(50),
    start_date DATE,
    end_date DATE,
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'pending_signature', 'signed', 'active', 'completed', 'cancelled')),
    signed_at TIMESTAMP,
    signed_by_customer VARCHAR(255),
    signed_by_company VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd' NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'installment', 'final', 'refund')),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'authorized', 'completed', 'failed', 'refunded', 'partially_refunded', 'expired', 'retrying')),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    stripe_payment_intent_id VARCHAR(255),
    refunded_amount DECIMAL(10, 2) DEFAULT 0,
    captured_amount DECIMAL(10, 2),
    captured_at TIMESTAMP,
    expires_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    metadata JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create schedules table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    estimated_days INTEGER,
    actual_start_date DATE,
    actual_end_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_phase VARCHAR(100),
    milestones JSONB,
    weather_delays INTEGER DEFAULT 0,
    crew_assigned VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_created_at ON estimates(created_at);

CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_estimate_id ON contracts(estimate_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_schedules_customer_id ON schedules(customer_id);
CREATE INDEX idx_schedules_contract_id ON schedules(contract_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_start_date ON schedules(start_date);
CREATE INDEX idx_schedules_end_date ON schedules(end_date);

-- Add comments to tables
COMMENT ON TABLE estimates IS 'Customer project estimates with cost breakdown and timeline';
COMMENT ON TABLE contracts IS 'Customer contracts linked to estimates with terms and signatures';
COMMENT ON TABLE payments IS 'Payment transactions linked to contracts and customers';
COMMENT ON TABLE schedules IS 'Project schedules and milestones linked to contracts';

COMMENT ON COLUMN estimates.customer_id IS 'Foreign key to customers table';
COMMENT ON COLUMN estimates.service_type IS 'Type of service: residential or commercial';
COMMENT ON COLUMN estimates.total_cost IS 'Total estimated cost including all factors';
COMMENT ON COLUMN estimates.status IS 'Current status of the estimate';

COMMENT ON COLUMN contracts.customer_id IS 'Foreign key to customers table';
COMMENT ON COLUMN contracts.estimate_id IS 'Optional link to the original estimate';
COMMENT ON COLUMN contracts.contract_number IS 'Unique contract identifier';
COMMENT ON COLUMN contracts.status IS 'Current contract status';

COMMENT ON COLUMN payments.customer_id IS 'Foreign key to customers table';
COMMENT ON COLUMN payments.contract_id IS 'Optional link to the associated contract';
COMMENT ON COLUMN payments.gateway_transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN payments.status IS 'Current payment status';

COMMENT ON COLUMN schedules.customer_id IS 'Foreign key to customers table';
COMMENT ON COLUMN schedules.contract_id IS 'Link to the associated contract';
COMMENT ON COLUMN schedules.status IS 'Current project status';
COMMENT ON COLUMN schedules.progress_percentage IS 'Project completion percentage (0-100)';

-- Add triggers to automatically update updated_at timestamps
CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
