# Database Schema Documentation - Neff Paving

## Overview

The Neff Paving system uses PostgreSQL as its primary database, designed to handle job scheduling, customer management, contract processing, and analytics. The schema utilizes UUID primary keys and JSONB data types for flexibility and performance.

## Database Configuration

**Database Engine:** PostgreSQL 14+  
**Primary Key Strategy:** UUID v4  
**JSON Support:** JSONB columns for flexible data storage  
**Connection String Format:** `postgresql://user:password@host:port/neff_paving_admin`

## Core Tables

### users
User authentication and profile management.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

**Columns:**
- `id` - UUID primary key
- `email` - Unique email address for login
- `password_hash` - Bcrypt hashed password
- `name` - Full name
- `role` - User role (admin, manager, user, customer)
- `phone` - Contact phone number
- `is_active` - Account status flag
- `email_verified` - Email verification status
- `last_login` - Last login timestamp
- `password_reset_token` - Password reset token
- `password_reset_expires` - Token expiration time

### job_schedules
Main table for job scheduling and management.

```sql
CREATE TABLE job_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_date TIMESTAMPTZ,
    address TEXT NOT NULL,
    coordinates JSONB,
    area_sqft DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    notes TEXT,
    boundary_data JSONB,
    calendly_event_uri VARCHAR(500),
    calendly_event_uuid VARCHAR(255),
    contract_id UUID,
    payment_status VARCHAR(50) DEFAULT 'pending',
    crew_assigned JSONB,
    equipment_assigned JSONB,
    weather_requirements JSONB,
    priority INTEGER DEFAULT 5,
    estimated_duration INTEGER, -- in hours
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    completion_photos JSONB,
    customer_satisfaction INTEGER, -- 1-5 rating
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_job_schedules_status ON job_schedules(status);
CREATE INDEX idx_job_schedules_service_type ON job_schedules(service_type);
CREATE INDEX idx_job_schedules_scheduled_date ON job_schedules(scheduled_date);
CREATE INDEX idx_job_schedules_customer_email ON job_schedules(customer_email);
CREATE INDEX idx_job_schedules_calendly_uuid ON job_schedules(calendly_event_uuid);
CREATE INDEX idx_job_schedules_created_at ON job_schedules(created_at);
```

**Key Columns:**
- `service_type` - Type of paving service (residential_driveway, commercial_parking, etc.)
- `status` - Job status (pending, confirmed, in_progress, completed, cancelled)
- `coordinates` - JSONB with lat/lng coordinates
- `boundary_data` - JSONB with polygon/shape data from maps
- `calendly_event_uri` - Calendly event reference
- `crew_assigned` - JSONB array of crew member IDs
- `equipment_assigned` - JSONB array of equipment IDs
- `weather_requirements` - JSONB with weather constraints

### schedule_changes
Audit trail for job scheduling changes.

```sql
CREATE TABLE schedule_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_schedules(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES users(id),
    change_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedule_changes_job_id ON schedule_changes(job_id);
CREATE INDEX idx_schedule_changes_changed_by ON schedule_changes(changed_by);
CREATE INDEX idx_schedule_changes_change_type ON schedule_changes(change_type);
CREATE INDEX idx_schedule_changes_created_at ON schedule_changes(created_at);
```

**Change Types:**
- `scheduled` - Initial scheduling
- `rescheduled` - Date/time change
- `crew_change` - Crew assignment change
- `status_change` - Status update
- `cost_update` - Cost modification
- `cancelled` - Job cancellation

### blog_posts
Content management for website blog/news.

```sql
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft',
    featured_image VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSONB,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
```

### analytics_events
User interaction and business analytics tracking.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    location_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_event_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_data ON analytics_events USING GIN(event_data);
```

**Event Types:**
- `page_view` - Page visit
- `estimate_request` - Estimate form submission
- `gallery_view` - Gallery image view
- `video_play` - Video playback
- `area_calculation` - Area tool usage
- `contact_form` - Contact form submission
- `job_booking` - Job booking completion

### messages
Contact form submissions and customer communications.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'contact',
    status VARCHAR(50) DEFAULT 'new',
    priority INTEGER DEFAULT 3,
    assigned_to UUID REFERENCES users(id),
    response_sent BOOLEAN DEFAULT false,
    response_content TEXT,
    response_sent_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_assigned_to ON messages(assigned_to);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_email ON messages(email);
```

**Message Types:**
- `contact` - General contact form
- `estimate` - Estimate request
- `complaint` - Customer complaint
- `compliment` - Customer praise
- `inquiry` - General inquiry

### contracts
Digital contract management.

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_schedules(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    template_version VARCHAR(20) NOT NULL,
    contract_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    deposit_due_date DATE,
    work_start_date DATE,
    work_completion_date DATE,
    warranty_period INTEGER DEFAULT 12, -- months
    terms_conditions TEXT,
    customer_signature JSONB,
    customer_signed_at TIMESTAMPTZ,
    company_signature JSONB,
    company_signed_at TIMESTAMPTZ,
    contract_pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contracts_job_id ON contracts(job_id);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_work_start_date ON contracts(work_start_date);
```

**Contract Status:**
- `draft` - Being prepared
- `sent` - Sent to customer
- `signed` - Fully executed
- `cancelled` - Cancelled
- `expired` - Expired unsigned

### payments
Payment processing and tracking.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_schedules(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    payment_intent_id VARCHAR(255) UNIQUE,
    stripe_payment_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method JSONB,
    customer_email VARCHAR(255),
    description TEXT,
    fees DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    refund_amount DECIMAL(10,2) DEFAULT 0,
    failure_reason TEXT,
    metadata JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
CREATE INDEX idx_payments_processed_at ON payments(processed_at);
```

**Payment Types:**
- `deposit` - Initial deposit
- `progress` - Progress payment
- `final` - Final payment
- `full` - Full payment upfront

**Payment Status:**
- `pending` - Awaiting payment
- `processing` - Being processed
- `succeeded` - Successful payment
- `failed` - Failed payment
- `cancelled` - Cancelled payment
- `refunded` - Refunded payment

### gallery_images
Gallery image metadata and management.

```sql
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    alt_text VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    mime_type VARCHAR(100),
    hash VARCHAR(64), -- for duplicate detection
    uploaded_by UUID REFERENCES users(id),
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gallery_images_category ON gallery_images(category);
CREATE INDEX idx_gallery_images_is_featured ON gallery_images(is_featured);
CREATE INDEX idx_gallery_images_display_order ON gallery_images(display_order);
CREATE INDEX idx_gallery_images_uploaded_by ON gallery_images(uploaded_by);
CREATE INDEX idx_gallery_images_hash ON gallery_images(hash);
```

## Relationships

### Primary Relationships

```sql
-- Job to Schedule Changes (One to Many)
job_schedules.id → schedule_changes.job_id

-- Job to Contract (One to One)
job_schedules.id → contracts.job_id

-- Job to Payments (One to Many)
job_schedules.id → payments.job_id

-- Contract to Payments (One to Many)
contracts.id → payments.contract_id

-- User to Jobs (One to Many - via assignment)
users.id → messages.assigned_to

-- User to Blog Posts (One to Many)
users.id → blog_posts.author_id

-- User to Gallery Images (One to Many)
users.id → gallery_images.uploaded_by
```

### Foreign Key Constraints

```sql
ALTER TABLE schedule_changes 
    ADD CONSTRAINT fk_schedule_changes_job_id 
    FOREIGN KEY (job_id) REFERENCES job_schedules(id) ON DELETE CASCADE;

ALTER TABLE schedule_changes 
    ADD CONSTRAINT fk_schedule_changes_changed_by 
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE contracts 
    ADD CONSTRAINT fk_contracts_job_id 
    FOREIGN KEY (job_id) REFERENCES job_schedules(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_job_id 
    FOREIGN KEY (job_id) REFERENCES job_schedules(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_contract_id 
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
```

## Views

### Active Jobs View
Simplified view of currently active jobs.

```sql
CREATE VIEW active_jobs AS
SELECT 
    js.id,
    js.customer_name,
    js.customer_email,
    js.service_type,
    js.status,
    js.scheduled_date,
    js.address,
    js.estimated_cost,
    js.final_cost,
    c.status as contract_status,
    p.status as payment_status,
    js.created_at
FROM job_schedules js
LEFT JOIN contracts c ON js.id = c.job_id
LEFT JOIN payments p ON js.id = p.job_id AND p.payment_type = 'final'
WHERE js.status IN ('pending', 'confirmed', 'in_progress')
ORDER BY js.scheduled_date ASC;
```

### Revenue Summary View
Monthly revenue and job statistics.

```sql
CREATE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('month', processed_at) as month,
    COUNT(*) as payment_count,
    SUM(amount) as total_revenue,
    AVG(amount) as average_payment,
    COUNT(DISTINCT job_id) as unique_jobs
FROM payments 
WHERE status = 'succeeded'
GROUP BY DATE_TRUNC('month', processed_at)
ORDER BY month DESC;
```

## Functions and Triggers

### Updated At Trigger Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_schedules_updated_at 
    BEFORE UPDATE ON job_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at 
    BEFORE UPDATE ON gallery_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Job Status Change Trigger

```sql
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO schedule_changes (
            job_id, 
            change_type, 
            old_values, 
            new_values, 
            reason
        ) VALUES (
            NEW.id,
            'status_change',
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status),
            'Automated status change trigger'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER job_status_change_trigger
    AFTER UPDATE ON job_schedules
    FOR EACH ROW
    EXECUTE FUNCTION log_job_status_change();
```

## Indexes for Performance

### Composite Indexes

```sql
-- Job search and filtering
CREATE INDEX idx_job_schedules_status_service_date 
    ON job_schedules(status, service_type, scheduled_date);

-- Analytics queries
CREATE INDEX idx_analytics_events_category_type_date 
    ON analytics_events(event_category, event_type, created_at);

-- Payment queries
CREATE INDEX idx_payments_status_type_date 
    ON payments(status, payment_type, processed_at);

-- Gallery filtering
CREATE INDEX idx_gallery_images_category_featured_order 
    ON gallery_images(category, is_featured, display_order);
```

### Full-Text Search Indexes

```sql
-- Search in job notes and customer info
CREATE INDEX idx_job_schedules_search 
    ON job_schedules 
    USING gin(to_tsvector('english', 
        coalesce(customer_name, '') || ' ' || 
        coalesce(address, '') || ' ' || 
        coalesce(notes, '')
    ));

-- Search in blog content
CREATE INDEX idx_blog_posts_search 
    ON blog_posts 
    USING gin(to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(content, '') || ' ' || 
        coalesce(excerpt, '')
    ));
```

## Data Migration Scripts

### Initial Data Setup

```sql
-- Create default admin user
INSERT INTO users (email, password_hash, name, role, is_active, email_verified) 
VALUES (
    'admin@neffpaving.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewZJxU4kvPb7Xf9.', -- bcrypt hash of 'admin123'
    'System Administrator', 
    'admin', 
    true, 
    true
);

-- Insert service types
INSERT INTO job_schedules (customer_name, customer_email, service_type, status) 
VALUES 
    ('Sample Customer', 'sample@example.com', 'residential_driveway', 'completed'),
    ('Test Business', 'business@example.com', 'commercial_parking', 'completed');
```

## Backup and Maintenance

### Backup Strategy

```sql
-- Full database backup
pg_dump neff_paving_admin > backup_$(date +%Y%m%d_%H%M%S).sql

-- Table-specific backups for large tables
pg_dump -t analytics_events neff_paving_admin > analytics_backup.sql
pg_dump -t gallery_images neff_paving_admin > gallery_backup.sql
```

### Maintenance Queries

```sql
-- Clean old analytics events (older than 2 years)
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '2 years';

-- Update statistics
ANALYZE;

-- Reindex for performance
REINDEX DATABASE neff_paving_admin;
```

## Connection Configuration

### Environment Variables

```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neff_paving_admin
DB_USER=neff_paving_user
DB_PASSWORD=secure_password_here

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### Connection String Examples

```javascript
// Node.js with pg
const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Sequelize ORM
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    pool: {
        max: 20,
        min: 2,
        acquire: 60000,
        idle: 30000
    }
});
```

This database schema provides a robust foundation for the Neff Paving system, supporting all current and planned functionality with proper indexing, relationships, and performance optimization.
