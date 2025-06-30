# Database Schema Documentation - Neff Paving Scheduling System

## Overview

This document provides detailed information about the database schema used for the job scheduling system in the Neff Paving project.

## Tables

1. [job_schedules](#job_schedules)
2. [schedule_changes](#schedule_changes)

---

## job_schedules

Stores job scheduling information linked to contracts and Calendly events.

### Structure

- **id** `UUID`: Primary key (generated automatically)
- **contract_id** `UUID`: Foreign key reference to `contracts` table
- **calendly_event_uri** `VARCHAR(255)`: URI for associated Calendly event (Unique, Non-nullable)
- **start_date** `TIMESTAMP WITH TIME ZONE`: Start time of the job (Non-nullable)
- **end_date** `TIMESTAMP WITH TIME ZONE`: End time of the job (Non-nullable)
- **status** `VARCHAR(50)`: Job status with constraints
  - Values: 'scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'rescheduled'
- **crew_assigned** `JSONB`: Array of crew members as JSON
- **equipment_needed** `JSONB`: Array of required equipment as JSON
- **location_address** `TEXT`: Address of the job location
- **special_instructions** `TEXT`: Any special instructions
- **estimated_duration_hours** `DECIMAL(4,2)`: Estimated job duration
- **weather_dependent** `BOOLEAN`: Whether job is weather dependent
- **priority_level** `INTEGER`: Job priority (1-5)
- **created_at** `TIMESTAMP WITH TIME ZONE`: Record creation timestamp
- **updated_at** `TIMESTAMP WITH TIME ZONE`: Last update timestamp

### Indexes
- `idx_job_schedules_contract`: Index on `contract_id`
- `idx_job_schedules_dates`: Index on `start_date, end_date`
- `idx_job_schedules_status`: Index on `status`
- `idx_job_schedules_calendly_uri`: Index on `calendly_event_uri`
- `idx_job_schedules_crew_search`: GIN index on `crew_assigned`
- `idx_job_schedules_equipment_search`: GIN index on `equipment_needed`

### Triggers
- `update_job_schedules_updated_at`: Trigger to automatically update `updated_at` column on changes

---

## schedule_changes

Audit trail for changes made to job schedules.

### Structure

- **id** `UUID`: Primary key (generated automatically)
- **job_schedule_id** `UUID`: Foreign key reference to `job_schedules` table
- **change_type** `VARCHAR(50)`: Type of change made (e.g., scheduled, canceled)
- **previous_data** `JSONB`: Snapshot of data before the change
- **new_data** `JSONB`: Snapshot of data after the change
- **reason** `TEXT`: Reason for the change
- **changed_at** `TIMESTAMP WITH TIME ZONE`: Timestamp when change occurred
- **changed_by** `VARCHAR(255)`: Identifier for who made the change
- **source** `VARCHAR(100)`: Source of the change (system, calendly_webhook, manual_admin)

### Indexes
- `idx_schedule_changes_job`: Index on `job_schedule_id`
- `idx_schedule_changes_type`: Index on `change_type`
- `idx_schedule_changes_date`: Index on `changed_at`
- `idx_schedule_changes_user`: Index on `changed_by`

---

## Security and Permissions

Ensure appropriate security measures are in place:

- Access to sensitive data such as crew and equipment details should be restricted
- User-level access restrictions based on roles
- Regular database backups to prevent data loss

For questions or additional support regarding the database schema, please contact the database administrator at db-admin@neffpaving.com.
