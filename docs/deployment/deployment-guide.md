# Deployment Guide - Neff Paving Scheduling System

## Overview

This guide provides detailed steps for deploying the Neff Paving scheduling system, including pre-deployment preparation, deployment procedures, and post-deployment verification.

## Table of Contents

1. [Pre-deployment Tasks](#pre-deployment-tasks)
2. [Deployment Process](#deployment-process)
3. [Post-deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Pre-deployment Tasks

### 1. Environment Configuration

#### Configure Calendly API Keys

**Required Environment Variables:**
```bash
# Calendly Configuration
CALENDLY_API_KEY=cal_live_your_api_key_here
CALENDLY_WEBHOOK_KEY=webhook_signing_key_here
CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_id
CALENDLY_ACCESS_TOKEN=your_personal_access_token

# Event Type URIs
CALENDLY_RESIDENTIAL_EVENT_TYPE=https://api.calendly.com/event_types/AAAAAAAAAAAAAAAA
CALENDLY_COMMERCIAL_EVENT_TYPE=https://api.calendly.com/event_types/BBBBBBBBBBBBBBBB
CALENDLY_MAINTENANCE_EVENT_TYPE=https://api.calendly.com/event_types/CCCCCCCCCCCCCCCC
CALENDLY_EMERGENCY_EVENT_TYPE=https://api.calendly.com/event_types/DDDDDDDDDDDDDDDD
```

**Verification Steps:**
```bash
# Test API connection
curl -H "Authorization: Bearer $CALENDLY_ACCESS_TOKEN" \
     https://api.calendly.com/users/me

# Expected response: User information JSON
```

#### Set Up Webhook Endpoints

**Configure Webhook URLs:**
```bash
# Production webhook endpoint
WEBHOOK_URL=https://production.neffpaving.com/api/webhooks/calendly

# Staging webhook endpoint  
STAGING_WEBHOOK_URL=https://staging.neffpaving.com/api/webhooks/calendly
```

**Register Webhooks:**
```javascript
// Run webhook registration script
node scripts/setup-webhook.js

// Verify webhook registration
curl -H "Authorization: Bearer $CALENDLY_ACCESS_TOKEN" \
     https://api.calendly.com/webhook_subscriptions
```

#### Configure Alert Channels

**Email Configuration:**
```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@neffpaving.com
SMTP_PASS=your_app_password
EMAIL_FROM_ADDRESS=notifications@neffpaving.com
```

**SMS Configuration:**
```bash
# Twilio Settings
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
```

**Test Alert Channels:**
```bash
# Test email
npm run test:email

# Test SMS
npm run test:sms

# Test dashboard notifications
npm run test:dashboard
```

### 2. Database Preparation

#### Update Database Schema

**Run Migration Scripts:**
```bash
# Backup current database
pg_dump neff_paving_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run schema migrations
npm run migrate:up

# Verify schema changes
psql -d neff_paving_prod -c "\d job_schedules"
psql -d neff_paving_prod -c "\d schedule_changes"
```

**Verify Database Changes:**
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_schedules';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'job_schedules';

-- Check triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'job_schedules';
```

#### Test Data Migration Scripts

**Run Migration Tests:**
```bash
# Test with sample data
npm run test:migration

# Verify data integrity
npm run verify:data-integrity

# Check performance
npm run benchmark:queries
```

### 3. Code Deployment Preparation

#### Build and Test

**Run Full Test Suite:**
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance
```

**Build Application:**
```bash
# Production build
npm run build:production

# Verify build output
ls -la dist/

# Test production build locally
npm run start:production
```

#### Security Verification

**Security Checklist:**
- [ ] All API keys are properly secured
- [ ] Database passwords are encrypted
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] SQL injection protection is active

---

## Deployment Process

### 1. Deploy Database Updates

#### Apply Schema Changes

```bash
# Create database backup
pg_dump neff_paving_prod > pre_deployment_backup.sql

# Apply migrations in transaction
psql neff_paving_prod << EOF
BEGIN;
\i database/migrations/002_add_job_scheduling_tables.sql;
-- Verify changes before committing
SELECT COUNT(*) FROM job_schedules;
COMMIT;
EOF
```

#### Verify Database Health

```bash
# Check database connectivity
psql -d neff_paving_prod -c "SELECT 1;"

# Verify critical tables
psql -d neff_paving_prod -c "SELECT COUNT(*) FROM contracts;"
psql -d neff_paving_prod -c "SELECT COUNT(*) FROM job_schedules;"

# Check index performance
psql -d neff_paving_prod -c "EXPLAIN ANALYZE SELECT * FROM job_schedules WHERE status = 'scheduled';"
```

### 2. Deploy New Services

#### Deploy Application Code

```bash
# Stop current services (if applicable)
sudo systemctl stop neff-paving-app

# Deploy new code
rsync -av --exclude=node_modules . /opt/neff-paving/

# Install dependencies
cd /opt/neff-paving && npm ci --production

# Set permissions
chown -R neff-app:neff-app /opt/neff-paving

# Start services
sudo systemctl start neff-paving-app
sudo systemctl enable neff-paving-app
```

#### Deploy Service Components

**Job Scheduling Service:**
```bash
# Deploy service files
cp src/services/job-scheduling-service.js /opt/neff-paving/services/
cp src/services/sync/calendly-sync.js /opt/neff-paving/services/sync/

# Restart related services
sudo systemctl restart neff-scheduling-service
```

**Alert Service:**
```bash
# Deploy alert components
cp src/services/alert-service.js /opt/neff-paving/services/
cp src/services/webhook-handler.js /opt/neff-paving/services/

# Test alert service
sudo systemctl status neff-alert-service
```

### 3. Configure Monitoring

#### Set Up Application Monitoring

**Health Check Endpoints:**
```bash
# Verify health endpoints are responding
curl https://production.neffpaving.com/health/calendly
curl https://production.neffpaving.com/health/alerts
curl https://production.neffpaving.com/health/database
```

**Configure Monitoring Tools:**
```bash
# Set up log monitoring
sudo systemctl enable neff-log-monitor

# Configure performance monitoring
sudo systemctl enable neff-performance-monitor

# Set up alert monitoring
sudo systemctl enable neff-alert-monitor
```

### 4. Enable Webhooks

#### Register Production Webhooks

```bash
# Register Calendly webhooks
node scripts/register-production-webhooks.js

# Verify webhook registration
curl -H "Authorization: Bearer $CALENDLY_ACCESS_TOKEN" \
     https://api.calendly.com/webhook_subscriptions
```

#### Test Webhook Delivery

```bash
# Create test appointment in Calendly
# Monitor webhook logs
tail -f /var/log/neff-paving/webhooks.log

# Verify webhook processing
grep "webhook processed" /var/log/neff-paving/application.log
```

### 5. Verify Integrations

#### Test Calendly Integration

```bash
# Test API connectivity
npm run test:calendly-api

# Test event synchronization
npm run test:calendly-sync

# Verify webhook processing
npm run test:webhook-handling
```

#### Test Payment Integration

```bash
# Test Stripe connectivity
npm run test:stripe-connection

# Verify payment webhook processing
npm run test:payment-webhooks
```

---

## Post-deployment Verification

### 1. Monitor Error Rates

#### Check Application Logs

```bash
# Monitor application errors
tail -f /var/log/neff-paving/error.log

# Check for critical errors
grep -i "error\|fatal\|critical" /var/log/neff-paving/application.log

# Monitor API response times
grep "response_time" /var/log/neff-paving/api.log | tail -20
```

#### Database Performance

```bash
# Check slow queries
psql -d neff_paving_prod -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitor connection count
psql -d neff_paving_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Check lock waits
psql -d neff_paving_prod -c "SELECT * FROM pg_stat_activity WHERE waiting = true;"
```

### 2. Verify Alert Delivery

#### Test Alert Channels

```bash
# Send test alerts
npm run test:alert-email
npm run test:alert-sms  
npm run test:alert-dashboard

# Check alert delivery logs
grep "alert sent" /var/log/neff-paving/alerts.log
```

#### Monitor Alert Performance

```bash
# Check alert response times
grep "alert_delivery_time" /var/log/neff-paving/alerts.log | tail -10

# Verify alert success rates
npm run report:alert-metrics
```

### 3. Test Scheduling Workflow

#### End-to-End Testing

**Test Customer Scheduling:**
1. Visit scheduling page
2. Select service type
3. Choose available time slot
4. Fill out contact information
5. Confirm appointment
6. Verify confirmation email received

**Test Staff Management:**
1. Log into staff dashboard
2. View scheduled appointments
3. Create new appointment
4. Modify existing appointment
5. Cancel appointment
6. Verify all notifications sent

#### Integration Testing

```bash
# Test complete workflow
npm run test:e2e-scheduling

# Test calendar synchronization
npm run test:calendar-sync

# Test notification delivery
npm run test:notification-flow
```

### 4. Update Documentation

#### Documentation Checklist

- [ ] Update API documentation with new endpoints
- [ ] Refresh integration guides with current settings
- [ ] Update troubleshooting guides with new issues
- [ ] Revise staff training materials
- [ ] Update customer instructions
- [ ] Refresh deployment documentation

#### Documentation Updates

```bash
# Generate updated API docs
npm run docs:generate

# Update version numbers
npm run docs:update-version

# Deploy documentation updates
npm run docs:deploy
```

---

## Rollback Procedures

### Emergency Rollback

#### Quick Rollback Steps

1. **Stop Current Services:**
```bash
sudo systemctl stop neff-paving-app
sudo systemctl stop neff-scheduling-service
sudo systemctl stop neff-alert-service
```

2. **Restore Previous Version:**
```bash
# Restore code
rsync -av /opt/neff-paving-backup/ /opt/neff-paving/

# Restore database (if needed)
psql neff_paving_prod < pre_deployment_backup.sql
```

3. **Start Previous Services:**
```bash
sudo systemctl start neff-paving-app
sudo systemctl start neff-scheduling-service
sudo systemctl start neff-alert-service
```

#### Rollback Verification

```bash
# Verify service health
curl https://production.neffpaving.com/health

# Check application version
curl https://production.neffpaving.com/version

# Test critical functionality
npm run test:critical-path
```

### Gradual Rollback

#### Feature Flags

```bash
# Disable new features
npm run feature:disable scheduling-v2
npm run feature:disable enhanced-alerts

# Monitor system stability
npm run monitor:stability
```

#### Partial Rollback

```bash
# Rollback specific components
git checkout previous-version -- src/services/job-scheduling-service.js
npm run deploy:service job-scheduling

# Monitor for improvements
tail -f /var/log/neff-paving/error.log
```

---

## Monitoring and Maintenance

### 1. Ongoing Monitoring

#### Key Metrics to Monitor

**System Metrics:**
- CPU usage
- Memory consumption
- Disk space
- Network latency
- Database connection pool

**Application Metrics:**
- API response times
- Error rates
- Webhook delivery success
- Alert delivery rates
- User session duration

**Business Metrics:**
- Appointment booking rates
- Schedule completion rates
- Customer satisfaction scores
- Staff efficiency metrics

#### Monitoring Tools Setup

```bash
# Set up Prometheus monitoring
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Configure Grafana dashboards
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Set up log aggregation
sudo systemctl enable elasticsearch
sudo systemctl enable logstash
sudo systemctl enable kibana
```

### 2. Regular Maintenance

#### Daily Tasks

```bash
# Check system health
npm run health:check

# Review error logs
tail -n 100 /var/log/neff-paving/error.log

# Monitor resource usage
df -h
free -m
top
```

#### Weekly Tasks

```bash
# Database maintenance
psql -d neff_paving_prod -c "VACUUM ANALYZE;"

# Log rotation
logrotate /etc/logrotate.d/neff-paving

# Security updates
sudo apt update && sudo apt upgrade

# Backup verification
npm run verify:backups
```

#### Monthly Tasks

```bash
# Performance review
npm run report:performance

# Security audit
npm audit
nmap -sV localhost

# Documentation review
npm run docs:review

# Capacity planning
npm run report:capacity
```

### 3. Incident Response

#### Escalation Procedures

**Level 1 - Low Impact:**
- Single user affected
- Non-critical feature unavailable
- Response time: 4 hours

**Level 2 - Medium Impact:**
- Multiple users affected
- Important feature unavailable
- Response time: 2 hours

**Level 3 - High Impact:**
- System-wide issues
- Core functionality affected
- Response time: 30 minutes

**Level 4 - Critical:**
- Complete system outage
- Data integrity at risk
- Response time: 15 minutes

#### Emergency Contacts

- **System Administrator**: sysadmin@neffpaving.com
- **Development Team**: dev-team@neffpaving.com
- **Emergency Hotline**: (555) 123-HELP
- **Management**: management@neffpaving.com

---

## Deployment Success Criteria

### Functional Requirements

- [ ] All scheduling features work correctly
- [ ] Calendly integration is functional
- [ ] Alert system delivers notifications
- [ ] Database operations perform well
- [ ] User authentication works properly

### Performance Requirements

- [ ] API response times < 500ms
- [ ] Database queries < 100ms
- [ ] Page load times < 3 seconds
- [ ] Error rate < 1%
- [ ] Uptime > 99.5%

### Security Requirements

- [ ] All data is encrypted in transit
- [ ] API keys are properly secured
- [ ] Access controls are enforced
- [ ] Audit logging is active
- [ ] Security monitoring is operational

---

## Conclusion

This deployment guide provides a comprehensive checklist for safely deploying the Neff Paving scheduling system. Follow these procedures carefully to ensure a successful deployment with minimal risk to operations.

For questions or issues during deployment, contact the development team at dev-team@neffpaving.com or call the emergency line at (555) 123-HELP.

**Next Steps:**
1. Schedule deployment window
2. Notify stakeholders
3. Execute deployment plan
4. Monitor system performance
5. Conduct post-deployment review
