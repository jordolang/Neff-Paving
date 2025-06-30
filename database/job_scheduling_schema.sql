-- New tables for job scheduling
CREATE TABLE job_schedules (
  id UUID PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id),
  calendly_event_uri VARCHAR(255),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50),
  crew_assigned JSONB,
  equipment_needed JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE schedule_changes (
  id UUID PRIMARY KEY,
  job_schedule_id UUID REFERENCES job_schedules(id),
  change_type VARCHAR(50),
  previous_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP,
  changed_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX idx_job_schedules_contract ON job_schedules(contract_id);
CREATE INDEX idx_job_schedules_dates ON job_schedules(start_date, end_date);
CREATE INDEX idx_schedule_changes_job ON schedule_changes(job_schedule_id);
