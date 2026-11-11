-- Migration 003: Neff Service + Support mobile platform
-- Multi-company (Neff Paving, Muskingum Materials, Austin Trucking) data model for the
-- iOS (Swift) and Android (Flutter) apps. Everything lives in the `app` schema so it never
-- collides with the website customer-portal tables created by migrations 001/002.
-- Idempotent: safe to re-run (CREATE ... IF NOT EXISTS, seed rows use ON CONFLICT).

CREATE SCHEMA IF NOT EXISTS app;
SET search_path TO app, public;

CREATE OR REPLACE FUNCTION app.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── Tenancy, identity, roles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    key VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(32), email VARCHAR(255), website VARCHAR(255),
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    primary_color VARCHAR(9) NOT NULL DEFAULT '#F5A400',
    invoice_prefix VARCHAR(8) NOT NULL DEFAULT 'INV',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
    key VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    rank INTEGER NOT NULL,               -- higher = more authority
    is_internal BOOLEAN NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),           -- null for Google-only accounts
    google_sub VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(32),
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    notification_prefs JSONB NOT NULL DEFAULT '{"push":true,"email":true,"sms":false}'::jsonb,
    public_profile BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    pay_rate NUMERIC(10,2),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));

-- One role per user per company.
CREATE TABLE IF NOT EXISTS memberships (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL REFERENCES roles(key),
    closed_at TIMESTAMPTZ,                -- account close-out
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios','android')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Crews, jobs, field work ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crews (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    color VARCHAR(9) NOT NULL DEFAULT '#FF7A00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS crew_members (
    crew_id INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    crew_id INTEGER REFERENCES crews(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'lead'
        CHECK (status IN ('lead','estimating','scheduled','in_progress','on_hold','completed','cancelled')),
    service_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    scheduled_start TIMESTAMPTZ, scheduled_end TIMESTAMPTZ, completed_at TIMESTAMPTZ,
    estimate_total NUMERIC(12,2),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    shared_publicly BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_company_status ON jobs (company_id, status);
CREATE INDEX IF NOT EXISTS jobs_customer ON jobs (customer_id);

CREATE TABLE IF NOT EXISTS status_updates (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    visible_to_customer BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    estimate_id INTEGER,
    status_update_id INTEGER REFERENCES status_updates(id) ON DELETE SET NULL,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('photo','video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT NOT NULL DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT false,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_job ON media (job_id);

CREATE TABLE IF NOT EXISTS job_logs (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL DEFAULT '',
    hours NUMERIC(6,2),
    materials TEXT NOT NULL DEFAULT '',
    weather TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    estimator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested','in_review','sent','accepted','declined','expired')),
    service_type VARCHAR(100) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    service_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    square_feet NUMERIC(12,2),
    preferred_date DATE,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12,2),
    valid_until DATE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $$ BEGIN
    ALTER TABLE media ADD CONSTRAINT media_estimate_fk FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    number VARCHAR(32) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','sent','paid','partial','overdue','void')),
    issued_at TIMESTAMPTZ, due_at TIMESTAMPTZ,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method VARCHAR(10) NOT NULL CHECK (method IN ('card','ach','check','cash')),
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('succeeded','pending','failed')),
    external_ref TEXT,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT true,
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Time, tracking, HR ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
    clock_out TIMESTAMPTZ,
    clock_in_lat DOUBLE PRECISION, clock_in_lng DOUBLE PRECISION,
    clock_out_lat DOUBLE PRECISION, clock_out_lng DOUBLE PRECISION,
    tracking_consent_at TIMESTAMPTZ,
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open','submitted','approved','rejected')),
    notes TEXT NOT NULL DEFAULT '',
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    paystub_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- At most one open shift per user (across all companies).
CREATE UNIQUE INDEX IF NOT EXISTS time_entries_one_open ON time_entries (user_id) WHERE clock_out IS NULL;

CREATE TABLE IF NOT EXISTS location_points (
    id BIGSERIAL PRIMARY KEY,
    time_entry_id INTEGER NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
    accuracy REAL, speed REAL, heading REAL, battery_level REAL,
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS location_points_user_time ON location_points (user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS schedule_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    crew_id INTEGER REFERENCES crews(id) ON DELETE SET NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS time_off_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL, end_date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('vacation','sick','personal','unpaid')),
    reason TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL, period_end DATE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paystubs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL, period_end DATE NOT NULL, pay_date DATE NOT NULL,
    hours NUMERIC(8,2) NOT NULL DEFAULT 0,
    gross NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net NUMERIC(12,2) NOT NULL DEFAULT 0,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    filing_status VARCHAR(10) NOT NULL DEFAULT 'single' CHECK (filing_status IN ('single','married','head')),
    allowances INTEGER NOT NULL DEFAULT 0 CHECK (allowances >= 0),
    extra_withholding NUMERIC(10,2) NOT NULL DEFAULT 0,
    pay_method VARCHAR(16) NOT NULL DEFAULT 'check' CHECK (pay_method IN ('direct_deposit','check')),
    bank_name VARCHAR(120) NOT NULL DEFAULT '',
    account_enc TEXT, routing_enc TEXT,       -- AES-256-GCM, see api/v1/crypto.js
    account_last4 VARCHAR(4), routing_last4 VARCHAR(4),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raise_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('raise','position_change')),
    current_rate NUMERIC(10,2), requested_rate NUMERIC(10,2),
    requested_position VARCHAR(32) REFERENCES roles(key),
    justification TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
    review_note TEXT NOT NULL DEFAULT '',
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Messaging & notifications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS threads (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS thread_participants (
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (thread_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications (user_id, created_at DESC);

-- ── Back office ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL, contact_name VARCHAR(120) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL DEFAULT '', email VARCHAR(255) NOT NULL DEFAULT '',
    materials TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL, kind VARCHAR(60) NOT NULL DEFAULT '',
    identifier VARCHAR(80) NOT NULL DEFAULT '',   -- VIN / serial / unit #
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_shop','retired')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost NUMERIC(12,2),
    performed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_at DATE,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL, description TEXT NOT NULL DEFAULT '',
    pay_range VARCHAR(80) NOT NULL DEFAULT '', is_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target VARCHAR(64), target_id INTEGER,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at triggers
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['users','jobs','estimates','invoices'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %1$s_touch ON app.%1$s', t);
    EXECUTE format('CREATE TRIGGER %1$s_touch BEFORE UPDATE ON app.%1$s FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at()', t);
  END LOOP;
END $$;

-- ── Seed: companies (role rows are synced from api/v1/permissions.js at startup) ──
INSERT INTO companies (key, name, phone, website, primary_color, invoice_prefix) VALUES
    ('neff',      'Neff Paving',         '(740) 453-3063', 'https://neffpaving.com', '#F5A400', 'NP'),
    ('muskingum', 'Muskingum Materials', NULL,             NULL,                     '#4F7A3A', 'MM'),
    ('austin',    'Austin Trucking',     NULL,             NULL,                     '#B3261E', 'AT')
ON CONFLICT (key) DO NOTHING;
