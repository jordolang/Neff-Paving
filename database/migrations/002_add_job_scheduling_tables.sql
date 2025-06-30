-- =====================================================================
-- Job Scheduling Database Schema Migration
-- =====================================================================
-- Migration: 002_add_job_scheduling_tables
-- Description: Add database tables for job scheduling and calendar integration
-- Created: 2024
-- Dependencies: Requires contracts table to exist

-- =====================================================================
-- CREATE JOB SCHEDULES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS job_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  calendly_event_uri VARCHAR(255) UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 
    'confirmed', 
    'in_progress', 
    'completed', 
    'canceled', 
    'rescheduled'
  )),
  crew_assigned JSONB DEFAULT '[]'::jsonb,
  equipment_needed JSONB DEFAULT '[]'::jsonb,
  location_address TEXT,
  special_instructions TEXT,
  estimated_duration_hours DECIMAL(4,2),
  weather_dependent BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- CREATE SCHEDULE CHANGES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS schedule_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_schedule_id UUID REFERENCES job_schedules(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
    'scheduled',
    'rescheduled', 
    'canceled',
    'status_updated',
    'crew_assigned',
    'equipment_updated',
    'time_updated',
    'completed'
  )),
  previous_data JSONB,
  new_data JSONB,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(255) NOT NULL,
  source VARCHAR(100) DEFAULT 'system' CHECK (source IN (
    'system',
    'calendly_webhook',
    'manual_admin',
    'customer_request',
    'weather_delay',
    'crew_availability'
  ))
);

-- =====================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================================

-- Job schedules indexes
CREATE INDEX IF NOT EXISTS idx_job_schedules_contract 
  ON job_schedules(contract_id);

CREATE INDEX IF NOT EXISTS idx_job_schedules_dates 
  ON job_schedules(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_job_schedules_status 
  ON job_schedules(status);

CREATE INDEX IF NOT EXISTS idx_job_schedules_calendly_uri 
  ON job_schedules(calendly_event_uri);

CREATE INDEX IF NOT EXISTS idx_job_schedules_crew_search 
  ON job_schedules USING GIN(crew_assigned);

CREATE INDEX IF NOT EXISTS idx_job_schedules_equipment_search 
  ON job_schedules USING GIN(equipment_needed);

-- Schedule changes indexes
CREATE INDEX IF NOT EXISTS idx_schedule_changes_job 
  ON schedule_changes(job_schedule_id);

CREATE INDEX IF NOT EXISTS idx_schedule_changes_type 
  ON schedule_changes(change_type);

CREATE INDEX IF NOT EXISTS idx_schedule_changes_date 
  ON schedule_changes(changed_at);

CREATE INDEX IF NOT EXISTS idx_schedule_changes_user 
  ON schedule_changes(changed_by);

-- =====================================================================
-- CREATE TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for job_schedules table
DROP TRIGGER IF EXISTS update_job_schedules_updated_at ON job_schedules;
CREATE TRIGGER update_job_schedules_updated_at
    BEFORE UPDATE ON job_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- CREATE SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- =====================================================================

-- Insert sample job schedule data (uncomment for development)
/*
INSERT INTO job_schedules (
  contract_id,
  calendly_event_uri,
  start_date,
  end_date,
  status,
  crew_assigned,
  equipment_needed,
  location_address,
  special_instructions,
  estimated_duration_hours,
  priority_level
) VALUES 
(
  (SELECT id FROM contracts LIMIT 1), -- Assumes at least one contract exists
  'https://calendly.com/events/sample-event-123',
  CURRENT_TIMESTAMP + INTERVAL '1 day',
  CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '4 hours',
  'scheduled',
  '[{"name": "John Smith", "role": "foreman", "id": "crew_001"}, {"name": "Mike Johnson", "role": "operator", "id": "crew_002"}]'::jsonb,
  '[{"name": "Paving Machine", "type": "equipment", "id": "eq_001"}, {"name": "Roller", "type": "equipment", "id": "eq_002"}]'::jsonb,
  '123 Main St, City, State 12345',
  'Customer requests early morning start. Check for underground utilities.',
  4.0,
  2
);
*/

-- =====================================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE job_schedules IS 'Stores job scheduling information linked to contracts and Calendly events';
COMMENT ON TABLE schedule_changes IS 'Audit trail for all changes to job schedules';

COMMENT ON COLUMN job_schedules.calendly_event_uri IS 'Unique URI from Calendly for event identification';
COMMENT ON COLUMN job_schedules.crew_assigned IS 'JSON array of crew members assigned to this job';
COMMENT ON COLUMN job_schedules.equipment_needed IS 'JSON array of equipment required for this job';
COMMENT ON COLUMN job_schedules.priority_level IS 'Priority level 1-5 (1=highest, 5=lowest)';
COMMENT ON COLUMN job_schedules.weather_dependent IS 'Whether this job can be affected by weather conditions';

COMMENT ON COLUMN schedule_changes.change_type IS 'Type of change made to the schedule';
COMMENT ON COLUMN schedule_changes.source IS 'Source system or process that initiated the change';
COMMENT ON COLUMN schedule_changes.previous_data IS 'JSON snapshot of data before change';
COMMENT ON COLUMN schedule_changes.new_data IS 'JSON snapshot of data after change';

-- =====================================================================
-- GRANT PERMISSIONS (ADJUST AS NEEDED FOR YOUR ENVIRONMENT)
-- =====================================================================

-- Grant permissions to application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON job_schedules TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_changes TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
