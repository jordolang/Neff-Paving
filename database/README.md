# Database Schema Documentation

## Job Scheduling Schema

This directory contains the database schema files for the Neff Paving job scheduling system integration with Calendly.

### Files

- `job_scheduling_schema.sql` - Basic schema as originally specified
- `migrations/002_add_job_scheduling_tables.sql` - Enhanced production-ready migration

### Tables

#### job_schedules
Stores job scheduling information linked to contracts and Calendly events.

**Columns:**
- `id` - UUID primary key
- `contract_id` - Foreign key to contracts table
- `calendly_event_uri` - Unique URI from Calendly for event identification
- `start_date` - Job start date and time
- `end_date` - Job end date and time
- `status` - Current status of the job (scheduled, confirmed, in_progress, completed, canceled, rescheduled)
- `crew_assigned` - JSON array of crew members assigned to this job
- `equipment_needed` - JSON array of equipment required for this job
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

#### schedule_changes
Audit trail for all changes to job schedules.

**Columns:**
- `id` - UUID primary key
- `job_schedule_id` - Foreign key to job_schedules table
- `change_type` - Type of change made (scheduled, rescheduled, canceled, etc.)
- `previous_data` - JSON snapshot of data before change
- `new_data` - JSON snapshot of data after change
- `changed_at` - When the change occurred
- `changed_by` - Who made the change

### Indexes

The schema includes performance indexes on:
- `job_schedules.contract_id` - For contract-based queries
- `job_schedules(start_date, end_date)` - For date range queries
- `schedule_changes.job_schedule_id` - For audit trail lookups

### Usage

1. **Basic Schema**: Use `job_scheduling_schema.sql` for simple implementations
2. **Production Migration**: Use `migrations/002_add_job_scheduling_tables.sql` for production environments

### Integration

This schema integrates with:
- Existing contracts table
- Calendly webhook system (via `calendly_event_uri`)
- Job scheduling service (`src/services/job-scheduling-service.js`)
- Webhook handler (`src/services/webhook-handler.js`)

### Sample Data

The enhanced migration includes optional sample data for development. Uncomment the INSERT statements in the migration file to add test data.

### Dependencies

- Requires PostgreSQL with UUID extension
- Assumes existence of a `contracts` table with UUID primary key
- Designed to work with the existing webhook handling system
