# Database Schema and Alert System Configuration

## Overview

This document provides comprehensive documentation for the Neff Paving database schema and alert system configuration, including table structures, relationships, alert rules, and notification management.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Core Tables](#core-tables)
3. [Scheduling System Tables](#scheduling-system-tables)
4. [Indexes and Performance](#indexes-and-performance)
5. [Alert System Configuration](#alert-system-configuration)
6. [Notification Channels](#notification-channels)
7. [Alert Rules and Templates](#alert-rules-and-templates)
8. [Monitoring and Health Checks](#monitoring-and-health-checks)
9. [Database Security](#database-security)
10. [Backup and Recovery](#backup-and-recovery)

---

## Database Architecture {#database-schema}

### Database Configuration

**Database**: PostgreSQL 13+  
**Name**: `neff_paving_admin`  
**Character Set**: UTF-8  
**Timezone**: UTC with local timezone support

```sql
-- Database creation
CREATE DATABASE neff_paving_admin
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;
```

### Connection Configuration

```bash
# Environment Variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neff_paving_admin
DB_USER=postgres
DB_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@localhost:5432/neff_paving_admin

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### Schema Versioning

```sql
-- Schema version tracking
CREATE TABLE schema_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER
);

INSERT INTO schema_versions (version, description) 
VALUES ('2.0.0', 'Job scheduling and alert system implementation');
```

---

## Core Tables

### Contracts Table

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    service_type VARCHAR(100) NOT NULL,
    project_address TEXT NOT NULL,
    project_size DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_service_type CHECK (service_type IN (
        'residential', 'commercial', 'maintenance', 'emergency', 'custom'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'pending', 'approved', 'in_progress', 'completed', 'canceled'
    ))
);

-- Indexes for contracts
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_service_type ON contracts(service_type);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
CREATE INDEX idx_contracts_client_email ON contracts(client_email);
```

### Estimates Table

```sql
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_type VARCHAR(100) NOT NULL,
    project_address TEXT NOT NULL,
    project_size VARCHAR(100),
    timeline VARCHAR(100),
    description TEXT,
    area_measurement JSONB,
    estimated_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    response_by TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    CONSTRAINT valid_estimate_status CHECK (status IN (
        'pending', 'sent', 'accepted', 'rejected', 'expired'
    ))
);

-- Indexes for estimates
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_service_type ON estimates(service_type);
CREATE INDEX idx_estimates_created_at ON estimates(created_at);
CREATE INDEX idx_estimates_response_by ON estimates(response_by);
CREATE INDEX idx_estimates_email ON estimates(email);

-- GIN index for area measurement JSON queries
CREATE INDEX idx_estimates_area_measurement ON estimates USING GIN (area_measurement);
```

### Customers Table

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    preferred_contact_method VARCHAR(50) DEFAULT 'email',
    service_area VARCHAR(100),
    customer_since DATE DEFAULT CURRENT_DATE,
    total_projects INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_contact_method CHECK (preferred_contact_method IN (
        'email', 'phone', 'sms', 'mail'
    )),
    CONSTRAINT valid_customer_status CHECK (status IN (
        'active', 'inactive', 'blocked'
    ))
);

-- Indexes for customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_service_area ON customers(service_area);
CREATE INDEX idx_customers_created_at ON customers(created_at);
```

---

## Scheduling System Tables

### Job Schedules Table

```sql
CREATE TABLE job_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    calendly_event_uri VARCHAR(255) UNIQUE NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    crew_assigned JSONB DEFAULT '[]',
    equipment_needed JSONB DEFAULT '[]',
    location_address TEXT NOT NULL,
    special_instructions TEXT,
    estimated_duration_hours DECIMAL(4,2),
    weather_dependent BOOLEAN DEFAULT true,
    priority_level INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_job_status CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'rescheduled'
    )),
    CONSTRAINT valid_priority CHECK (priority_level BETWEEN 1 AND 5),
    CONSTRAINT valid_duration CHECK (estimated_duration_hours > 0),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Indexes for job schedules
CREATE INDEX idx_job_schedules_contract ON job_schedules(contract_id);
CREATE INDEX idx_job_schedules_dates ON job_schedules(start_date, end_date);
CREATE INDEX idx_job_schedules_status ON job_schedules(status);
CREATE INDEX idx_job_schedules_calendly_uri ON job_schedules(calendly_event_uri);
CREATE INDEX idx_job_schedules_priority ON job_schedules(priority_level);
CREATE INDEX idx_job_schedules_weather ON job_schedules(weather_dependent);

-- GIN indexes for JSON fields
CREATE INDEX idx_job_schedules_crew_search ON job_schedules USING GIN (crew_assigned);
CREATE INDEX idx_job_schedules_equipment_search ON job_schedules USING GIN (equipment_needed);
```

### Schedule Changes Table (Audit Trail)

```sql
CREATE TABLE schedule_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_schedule_id UUID NOT NULL REFERENCES job_schedules(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255) NOT NULL,
    source VARCHAR(100) DEFAULT 'manual_admin',
    
    CONSTRAINT valid_change_type CHECK (change_type IN (
        'scheduled', 'rescheduled', 'canceled', 'completed', 'crew_changed', 
        'equipment_changed', 'status_updated', 'notes_added'
    )),
    CONSTRAINT valid_source CHECK (source IN (
        'system', 'calendly_webhook', 'manual_admin', 'mobile_app', 'api'
    ))
);

-- Indexes for schedule changes
CREATE INDEX idx_schedule_changes_job ON schedule_changes(job_schedule_id);
CREATE INDEX idx_schedule_changes_type ON schedule_changes(change_type);
CREATE INDEX idx_schedule_changes_date ON schedule_changes(changed_at);
CREATE INDEX idx_schedule_changes_user ON schedule_changes(changed_by);
CREATE INDEX idx_schedule_changes_source ON schedule_changes(source);
```

### Crew Members Table

```sql
CREATE TABLE crew_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(100) NOT NULL,
    specializations JSONB DEFAULT '[]',
    availability_schedule JSONB,
    status VARCHAR(50) DEFAULT 'active',
    hire_date DATE,
    emergency_contact JSONB,
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_crew_status CHECK (status IN (
        'active', 'inactive', 'on_leave', 'terminated'
    ))
);

-- Indexes for crew members
CREATE INDEX idx_crew_members_status ON crew_members(status);
CREATE INDEX idx_crew_members_role ON crew_members(role);
CREATE INDEX idx_crew_members_email ON crew_members(email);
CREATE INDEX idx_crew_members_phone ON crew_members(phone);

-- GIN indexes for JSON fields
CREATE INDEX idx_crew_specializations ON crew_members USING GIN (specializations);
CREATE INDEX idx_crew_availability ON crew_members USING GIN (availability_schedule);
```

---

## Indexes and Performance

### Composite Indexes

```sql
-- Performance-critical composite indexes
CREATE INDEX idx_job_schedules_status_dates ON job_schedules(status, start_date, end_date);
CREATE INDEX idx_estimates_status_created ON estimates(status, created_at);
CREATE INDEX idx_contracts_type_status ON contracts(service_type, status);
CREATE INDEX idx_schedule_changes_job_date ON schedule_changes(job_schedule_id, changed_at);

-- Search optimization indexes
CREATE INDEX idx_customers_name_email ON customers(name, email);
CREATE INDEX idx_job_schedules_location_trgm ON job_schedules USING GIN (location_address gin_trgm_ops);
```

### Performance Monitoring Views

```sql
-- View for monitoring slow queries
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC;

-- View for monitoring table sizes
CREATE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

---

## Alert System Configuration

### Alert Types Table

```sql
CREATE TABLE alert_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    priority_level INTEGER DEFAULT 3,
    default_channels JSONB DEFAULT '["email"]',
    template_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_alert_category CHECK (category IN (
        'job_scheduling', 'system_health', 'business_operations', 'security', 'maintenance'
    )),
    CONSTRAINT valid_alert_priority CHECK (priority_level BETWEEN 1 AND 5)
);

-- Insert default alert types
INSERT INTO alert_types (name, description, category, priority_level, default_channels) VALUES
('job_scheduled', 'New job has been scheduled', 'job_scheduling', 2, '["email", "dashboard"]'),
('job_canceled', 'Job has been canceled', 'job_scheduling', 3, '["email", "sms", "dashboard"]'),
('job_rescheduled', 'Job has been rescheduled', 'job_scheduling', 2, '["email", "dashboard"]'),
('payment_received', 'Payment has been received', 'business_operations', 2, '["email", "dashboard"]'),
('estimate_requested', 'New estimate has been requested', 'business_operations', 2, '["email", "dashboard"]'),
('system_error', 'System error occurred', 'system_health', 4, '["email", "sms", "dashboard"]'),
('database_issue', 'Database connectivity issue', 'system_health', 5, '["email", "sms", "dashboard"]'),
('security_breach', 'Security breach detected', 'security', 5, '["email", "sms", "dashboard"]');
```

### Alert Rules Table

```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type_id UUID NOT NULL REFERENCES alert_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    notification_channels JSONB DEFAULT '["email"]',
    recipient_groups JSONB DEFAULT '["admins"]',
    throttle_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_throttle CHECK (throttle_minutes >= 0)
);

-- Example alert rules
INSERT INTO alert_rules (alert_type_id, name, description, conditions, notification_channels, recipient_groups) VALUES
(
    (SELECT id FROM alert_types WHERE name = 'job_scheduled'),
    'High Priority Job Scheduled',
    'Alert when high priority job is scheduled',
    '{"priority_level": {">=": 4}}',
    '["email", "sms"]',
    '["admins", "crew_supervisors"]'
),
(
    (SELECT id FROM alert_types WHERE name = 'estimate_requested'),
    'Large Project Estimate',
    'Alert for estimates over $10,000',
    '{"estimated_cost": {">": 10000}}',
    '["email", "dashboard"]',
    '["admins", "sales_team"]'
);
```

### Alert History Table

```sql
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type_id UUID NOT NULL REFERENCES alert_types(id),
    alert_rule_id UUID REFERENCES alert_rules(id),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    subject VARCHAR(500),
    message TEXT,
    data JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_alert_channel CHECK (channel IN (
        'email', 'sms', 'dashboard', 'webhook', 'slack'
    )),
    CONSTRAINT valid_alert_status CHECK (status IN (
        'pending', 'sent', 'delivered', 'failed', 'throttled'
    ))
);

-- Indexes for alert history
CREATE INDEX idx_alert_history_type ON alert_history(alert_type_id);
CREATE INDEX idx_alert_history_status ON alert_history(status);
CREATE INDEX idx_alert_history_channel ON alert_history(channel);
CREATE INDEX idx_alert_history_created ON alert_history(created_at);
CREATE INDEX idx_alert_history_recipient_email ON alert_history(recipient_email);
CREATE INDEX idx_alert_history_recipient_phone ON alert_history(recipient_phone);
```

---

## Notification Channels

### Email Configuration

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    body_template TEXT NOT NULL,
    is_html BOOLEAN DEFAULT true,
    alert_type_id UUID REFERENCES alert_types(id),
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert email templates
INSERT INTO email_templates (name, subject_template, body_template, alert_type_id, variables) VALUES
(
    'job_scheduled_email',
    'Job Scheduled: {{project_type}} - {{customer_name}}',
    '<h2>New Job Scheduled</h2>
     <p><strong>Customer:</strong> {{customer_name}}</p>
     <p><strong>Project Type:</strong> {{project_type}}</p>
     <p><strong>Start Date:</strong> {{start_date}}</p>
     <p><strong>Duration:</strong> {{duration}} hours</p>
     <p><strong>Location:</strong> {{location_address}}</p>
     <p><strong>Contract ID:</strong> {{contract_id}}</p>',
    (SELECT id FROM alert_types WHERE name = 'job_scheduled'),
    '["customer_name", "project_type", "start_date", "duration", "location_address", "contract_id"]'
);
```

### SMS Configuration

```sql
CREATE TABLE sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    message_template TEXT NOT NULL,
    alert_type_id UUID REFERENCES alert_types(id),
    max_length INTEGER DEFAULT 160,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert SMS templates
INSERT INTO sms_templates (name, message_template, alert_type_id, variables) VALUES
(
    'job_scheduled_sms',
    'NEFF PAVING: Job scheduled for {{customer_name}} on {{start_date}} at {{location_address}}. Priority: {{priority_level}}',
    (SELECT id FROM alert_types WHERE name = 'job_scheduled'),
    '["customer_name", "start_date", "location_address", "priority_level"]'
);
```

### Dashboard Notifications

```sql
CREATE TABLE dashboard_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    alert_type_id UUID NOT NULL REFERENCES alert_types(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    priority_level INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_dashboard_priority CHECK (priority_level BETWEEN 1 AND 5)
);

-- Indexes for dashboard notifications
CREATE INDEX idx_dashboard_notifications_user ON dashboard_notifications(user_id);
CREATE INDEX idx_dashboard_notifications_unread ON dashboard_notifications(user_id, is_read);
CREATE INDEX idx_dashboard_notifications_priority ON dashboard_notifications(priority_level);
CREATE INDEX idx_dashboard_notifications_created ON dashboard_notifications(created_at);
```

---

## Alert Rules and Templates

### Alert Processing Functions

```sql
-- Function to process job scheduling alerts
CREATE OR REPLACE FUNCTION process_job_alert(
    p_job_id UUID,
    p_alert_type VARCHAR(100)
) RETURNS VOID AS $$
DECLARE
    job_data JSONB;
    alert_type_id UUID;
    applicable_rules CURSOR FOR
        SELECT ar.* FROM alert_rules ar
        JOIN alert_types at ON ar.alert_type_id = at.id
        WHERE at.name = p_alert_type AND ar.is_active = true;
BEGIN
    -- Get job data
    SELECT to_jsonb(js.*) INTO job_data
    FROM job_schedules js
    WHERE js.id = p_job_id;
    
    -- Get alert type ID
    SELECT id INTO alert_type_id FROM alert_types WHERE name = p_alert_type;
    
    -- Process each applicable rule
    FOR rule IN applicable_rules LOOP
        -- Check if conditions match
        IF evaluate_alert_conditions(job_data, rule.conditions) THEN
            -- Send notifications for each channel
            PERFORM send_alert_notifications(
                rule.id,
                alert_type_id,
                job_data,
                rule.notification_channels,
                rule.recipient_groups
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to evaluate alert conditions
CREATE OR REPLACE FUNCTION evaluate_alert_conditions(
    data JSONB,
    conditions JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    condition_key TEXT;
    condition_value JSONB;
    operator TEXT;
    data_value JSONB;
BEGIN
    -- Iterate through each condition
    FOR condition_key, condition_value IN SELECT * FROM jsonb_each(conditions) LOOP
        data_value := data->>condition_key;
        
        -- Handle different operators
        FOR operator, value IN SELECT * FROM jsonb_each(condition_value) LOOP
            CASE operator
                WHEN '=' THEN
                    IF data_value::text != value::text THEN RETURN false; END IF;
                WHEN '>' THEN
                    IF (data_value::numeric) <= (value::numeric) THEN RETURN false; END IF;
                WHEN '>=' THEN
                    IF (data_value::numeric) < (value::numeric) THEN RETURN false; END IF;
                WHEN '<' THEN
                    IF (data_value::numeric) >= (value::numeric) THEN RETURN false; END IF;
                WHEN '<=' THEN
                    IF (data_value::numeric) > (value::numeric) THEN RETURN false; END IF;
                WHEN 'in' THEN
                    IF NOT (data_value::text = ANY(ARRAY(SELECT jsonb_array_elements_text(value)))) THEN 
                        RETURN false; 
                    END IF;
            END CASE;
        END LOOP;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Functions

```sql
-- Trigger function for job schedule changes
CREATE OR REPLACE FUNCTION trigger_job_schedule_alerts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New job scheduled
        PERFORM process_job_alert(NEW.id, 'job_scheduled');
        
        -- Log the change
        INSERT INTO schedule_changes (
            job_schedule_id, change_type, new_data, 
            changed_by, source, reason
        ) VALUES (
            NEW.id, 'scheduled', to_jsonb(NEW),
            COALESCE(current_setting('app.current_user', true), 'system'),
            COALESCE(current_setting('app.source', true), 'system'),
            'Job initially scheduled'
        );
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Check for status changes
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'canceled' THEN
                    PERFORM process_job_alert(NEW.id, 'job_canceled');
                WHEN 'rescheduled' THEN
                    PERFORM process_job_alert(NEW.id, 'job_rescheduled');
            END CASE;
            
            -- Log the status change
            INSERT INTO schedule_changes (
                job_schedule_id, change_type, previous_data, new_data,
                changed_by, source, reason
            ) VALUES (
                NEW.id, 'status_updated', to_jsonb(OLD), to_jsonb(NEW),
                COALESCE(current_setting('app.current_user', true), 'system'),
                COALESCE(current_setting('app.source', true), 'system'),
                format('Status changed from %s to %s', OLD.status, NEW.status)
            );
        END IF;
        
        -- Check for date changes (rescheduling)
        IF OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date THEN
            INSERT INTO schedule_changes (
                job_schedule_id, change_type, previous_data, new_data,
                changed_by, source, reason
            ) VALUES (
                NEW.id, 'rescheduled', to_jsonb(OLD), to_jsonb(NEW),
                COALESCE(current_setting('app.current_user', true), 'system'),
                COALESCE(current_setting('app.source', true), 'system'),
                'Job dates modified'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER job_schedule_alert_trigger
    AFTER INSERT OR UPDATE ON job_schedules
    FOR EACH ROW EXECUTE FUNCTION trigger_job_schedule_alerts();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_contracts_timestamp 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_estimates_timestamp 
    BEFORE UPDATE ON estimates 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_customers_timestamp 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_job_schedules_timestamp 
    BEFORE UPDATE ON job_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## Monitoring and Health Checks

### Database Health Views

```sql
-- Database connection monitoring
CREATE VIEW database_health AS
SELECT 
    'database_connections' as metric,
    count(*) as current_value,
    setting::int as max_value,
    round(100.0 * count(*) / setting::int, 2) as usage_percent
FROM pg_stat_activity, pg_settings 
WHERE pg_settings.name = 'max_connections'
UNION ALL
SELECT 
    'active_queries' as metric,
    count(*) as current_value,
    NULL as max_value,
    NULL as usage_percent
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
    'database_size' as metric,
    pg_database_size(current_database()) as current_value,
    NULL as max_value,
    NULL as usage_percent;

-- Alert system health view
CREATE VIEW alert_system_health AS
SELECT 
    'pending_alerts' as metric,
    count(*) as value
FROM alert_history 
WHERE status = 'pending' AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
UNION ALL
SELECT 
    'failed_alerts' as metric,
    count(*) as value
FROM alert_history 
WHERE status = 'failed' AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
UNION ALL
SELECT 
    'alert_success_rate' as metric,
    round(100.0 * count(CASE WHEN status = 'delivered' THEN 1 END) / count(*), 2) as value
FROM alert_history 
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
```

### Performance Monitoring

```sql
-- Query performance monitoring
CREATE VIEW query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY mean_time DESC
LIMIT 20;

-- Table statistics
CREATE VIEW table_statistics AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Database Security

### User Management

```sql
-- Create application user
CREATE USER neff_app WITH PASSWORD 'secure_app_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE neff_paving_admin TO neff_app;
GRANT USAGE ON SCHEMA public TO neff_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neff_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neff_app;

-- Create read-only user for reporting
CREATE USER neff_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE neff_paving_admin TO neff_readonly;
GRANT USAGE ON SCHEMA public TO neff_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO neff_readonly;
```

### Row Level Security

```sql
-- Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY customer_access_policy ON customers
    FOR ALL TO neff_app
    USING (status != 'blocked');

CREATE POLICY contract_access_policy ON contracts
    FOR ALL TO neff_app
    USING (status != 'canceled' OR created_at > CURRENT_TIMESTAMP - INTERVAL '1 year');
```

### Audit Logging

```sql
-- Create audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_name VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_info JSONB
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name, operation, old_values, new_values, user_name, session_info
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
             WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
             ELSE NULL END,
        current_user,
        jsonb_build_object(
            'application_name', current_setting('application_name', true),
            'client_addr', inet_client_addr(),
            'client_port', inet_client_port()
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## Backup and Recovery

### Backup Configuration

```bash
#!/bin/bash
# Daily backup script

DB_NAME="neff_paving_admin"
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create backup
pg_dump ${DB_NAME} > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

# Remove backups older than 30 days
find ${BACKUP_DIR} -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed - ${BACKUP_FILE}.gz" >> /var/log/postgresql_backup.log
```

### Recovery Procedures

```bash
#!/bin/bash
# Database restoration script

DB_NAME="neff_paving_admin"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application services
systemctl stop neff-paving-app

# Drop and recreate database
dropdb ${DB_NAME}
createdb ${DB_NAME}

# Restore from backup
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c ${BACKUP_FILE} | psql ${DB_NAME}
else
    psql ${DB_NAME} < ${BACKUP_FILE}
fi

# Restart application services
systemctl start neff-paving-app

echo "Database restoration completed"
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

```sql
-- Daily maintenance procedure
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Update table statistics
    ANALYZE;
    
    -- Clean up old alert history (older than 90 days)
    DELETE FROM alert_history 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Clean up old audit logs (older than 1 year)
    DELETE FROM audit_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    -- Clean up expired dashboard notifications
    DELETE FROM dashboard_notifications 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Update customer statistics
    UPDATE customers SET 
        total_projects = (
            SELECT COUNT(*) FROM contracts 
            WHERE client_email = customers.email AND status = 'completed'
        ),
        total_spent = (
            SELECT COALESCE(SUM(estimated_cost), 0) FROM contracts 
            WHERE client_email = customers.email AND status = 'completed'
        );
    
    RAISE NOTICE 'Daily maintenance completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily maintenance (requires pg_cron extension)
-- SELECT cron.schedule('daily-maintenance', '0 2 * * *', 'SELECT daily_maintenance();');
```

### Performance Optimization

```sql
-- Weekly performance optimization
CREATE OR REPLACE FUNCTION weekly_optimization()
RETURNS VOID AS $$
BEGIN
    -- Vacuum and analyze all tables
    VACUUM ANALYZE;
    
    -- Reindex if needed
    REINDEX DATABASE neff_paving_admin;
    
    -- Update query statistics
    SELECT pg_stat_statements_reset();
    
    RAISE NOTICE 'Weekly optimization completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

---

## Configuration Management

### Environment-Specific Settings

```sql
-- Configuration settings table
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'string',
    is_sensitive BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO system_config (key, value, description, data_type) VALUES
('alert_throttle_default', '15', 'Default alert throttling in minutes', 'integer'),
('max_retry_attempts', '3', 'Maximum retry attempts for failed alerts', 'integer'),
('email_batch_size', '50', 'Maximum emails to send in one batch', 'integer'),
('sms_batch_size', '10', 'Maximum SMS messages to send in one batch', 'integer'),
('database_maintenance_hour', '2', 'Hour of day to run maintenance (0-23)', 'integer'),
('backup_retention_days', '30', 'Days to retain database backups', 'integer');
```

---

## Support and Resources

### Database Administration

- **Database Issues**: db-admin@neffpaving.com
- **Performance Questions**: performance@neffpaving.com
- **Emergency Support**: (555) 123-HELP

### Alert System Support

- **Alert Configuration**: alerts@neffpaving.com
- **Notification Issues**: notifications@neffpaving.com
- **Emergency Alerts**: emergency@neffpaving.com

### Monitoring and Maintenance

- **System Health**: monitoring@neffpaving.com
- **Backup Issues**: backup@neffpaving.com
- **Security Concerns**: security@neffpaving.com

---

*Last Updated: 2024-07-15*  
*Version: 2.0*  
*Next Review: 2024-10-15*
