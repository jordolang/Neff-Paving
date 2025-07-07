# Maintenance Guide

## Overview

This maintenance guide provides comprehensive procedures for ongoing maintenance of the Neff Paving system. Regular maintenance ensures optimal performance, security, and reliability of all system components.

## Table of Contents

1. [Maintenance Schedule](#maintenance-schedule)
2. [Daily Maintenance](#daily-maintenance)
3. [Weekly Maintenance](#weekly-maintenance)
4. [Monthly Maintenance](#monthly-maintenance)
5. [Quarterly Maintenance](#quarterly-maintenance)
6. [System Health Monitoring](#system-health-monitoring)
7. [Performance Optimization](#performance-optimization)
8. [Security Updates](#security-updates)
9. [Database Maintenance](#database-maintenance)
10. [Backup and Recovery](#backup-and-recovery)

## Maintenance Schedule

### Daily Tasks (5-10 minutes)
- System health checks
- Monitor alerts and notifications
- Check backup status
- Review performance metrics
- Verify integration connectivity

### Weekly Tasks (30-45 minutes)
- Database optimization
- Log file review and cleanup
- Security scan review
- Performance analysis
- Update documentation

### Monthly Tasks (2-3 hours)
- Full system backup verification
- Security updates installation
- Performance optimization review
- Capacity planning assessment
- User access audit

### Quarterly Tasks (4-6 hours)
- Comprehensive security audit
- Major version updates
- Disaster recovery testing
- Documentation comprehensive review
- System architecture evaluation

## Daily Maintenance

### System Health Checks

#### Service Status Verification
```bash
# Check all critical services
curl -s https://neffpaving.com/api/health
curl -s https://status.neffpaving.com/api/status

# Verify database connectivity
psql -h localhost -U neff_admin -d neff_paving_admin -c "SELECT 1;"

# Check web server status
systemctl status nginx
systemctl status pm2
```

#### Response Time Monitoring
- **Website**: https://neffpaving.com (target: <3 seconds)
- **Admin Panel**: https://neffpaving.com/admin (target: <2 seconds)
- **API Endpoints**: https://neffpaving.com/api/* (target: <500ms)

#### Resource Usage Check
```bash
# CPU and memory usage
top -n 1 | head -20

# Disk space usage
df -h

# Database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### Alert Monitoring

#### Critical Alerts
- System downtime notifications
- Database connection failures
- API response time spikes
- Security breach attempts
- Payment processing errors

#### Review Channels
- **Email**: admin@neffpaving.com
- **SMS**: Emergency contact list
- **Dashboard**: https://neffpaving.com/admin/alerts
- **Logs**: /var/log/neffpaving/

### Backup Verification

#### Daily Backup Check
```bash
# Verify latest backup exists
ls -la /backup/daily/$(date +%Y%m%d)*.sql

# Check backup size (should be consistent)
du -h /backup/daily/$(date +%Y%m%d)*.sql

# Test backup integrity
pg_restore --list /backup/daily/$(date +%Y%m%d)*.sql | head -10
```

## Weekly Maintenance

### Database Optimization

#### Performance Analysis
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

#### Maintenance Operations
```sql
-- Update statistics
ANALYZE;

-- Rebuild indexes if needed
REINDEX DATABASE neff_paving_admin;

-- Clean up old data (adjust retention as needed)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM session_logs WHERE created_at < NOW() - INTERVAL '30 days';
```

### Log Review and Cleanup

#### Application Logs
```bash
# Review error logs
tail -n 100 /var/log/neffpaving/error.log

# Check for patterns in access logs
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -20

# Rotate and compress old logs
logrotate /etc/logrotate.d/neffpaving
```

#### System Logs
```bash
# Check system messages
journalctl --since "1 week ago" --priority=err

# Review security logs
grep "authentication failure" /var/log/auth.log | tail -20

# Check disk I/O issues
dmesg | grep -i "i/o error"
```

### Performance Analysis

#### Web Performance
- **Page Load Times**: Monitor Core Web Vitals
- **API Response Times**: Check endpoint performance
- **Database Query Performance**: Review slow query log
- **CDN Performance**: Verify asset delivery

#### Resource Utilization
```bash
# CPU usage patterns
sar -u 1 3

# Memory usage analysis
free -h
ps aux --sort=-%mem | head -10

# Network statistics
netstat -i
```

## Monthly Maintenance

### Security Updates

#### System Updates
```bash
# Update package lists
apt update

# Check available security updates
apt list --upgradable | grep -i security

# Install security updates
apt upgrade -y

# Reboot if kernel updates were installed
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required after updates"
fi
```

#### Application Updates
```bash
# Update Node.js dependencies
npm audit
npm update

# Update database extensions
psql -c "ALTER EXTENSION pg_stat_statements UPDATE;"

# Update SSL certificates
certbot renew --dry-run
```

### Capacity Planning

#### Growth Analysis
```sql
-- Database growth trends
SELECT 
    date_trunc('month', created_at) as month,
    count(*) as new_customers
FROM customers
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month;

-- Storage usage trends
SELECT 
    date_trunc('week', backup_date) as week,
    avg(backup_size_gb) as avg_size_gb
FROM backup_statistics
WHERE backup_date >= NOW() - INTERVAL '3 months'
GROUP BY week
ORDER BY week;
```

#### Resource Planning
- **Database Size**: Monitor growth rate and plan scaling
- **Server Resources**: Track CPU/memory usage trends
- **Storage**: Monitor disk space and backup storage
- **Network**: Analyze bandwidth usage patterns

### User Access Audit

#### Access Review
```sql
-- Review user last login times
SELECT username, last_login, role, active
FROM users
WHERE last_login < NOW() - INTERVAL '30 days'
ORDER BY last_login;

-- Check permission assignments
SELECT u.username, r.role_name, p.permission_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY u.username;
```

#### Cleanup Actions
- Remove inactive user accounts
- Update role assignments
- Revoke unnecessary permissions
- Update contact information

## Quarterly Maintenance

### Comprehensive Security Audit

#### Security Scan
```bash
# Run security scanner
nmap -sS -O neffpaving.com

# Check for vulnerable packages
npm audit --audit-level moderate

# SSL/TLS configuration check
ssllabs-scan --host neffpaving.com

# Database security review
psql -c "\du"  # Review database users
psql -c "SELECT * FROM pg_hba_file_rules;"  # Review access rules
```

#### Penetration Testing
- Schedule professional security assessment
- Review findings and implement fixes
- Update security documentation
- Train staff on new security procedures

### Disaster Recovery Testing

#### Backup Recovery Test
```bash
# Create test database
createdb neff_paving_test

# Restore from backup
pg_restore -d neff_paving_test /backup/latest/neff_paving_backup.sql

# Verify data integrity
psql -d neff_paving_test -c "SELECT count(*) FROM customers;"
psql -d neff_paving_test -c "SELECT count(*) FROM appointments;"

# Cleanup test database
dropdb neff_paving_test
```

#### Failover Testing
- Test database failover procedures
- Verify application failover mechanisms
- Test load balancer configuration
- Document recovery time objectives

### Documentation Review

#### Content Audit
- Review all documentation for accuracy
- Update screenshots and examples
- Verify all links are working
- Update contact information

#### Structure Optimization
- Reorganize content for better flow
- Add missing sections
- Remove outdated information
- Improve searchability

## System Health Monitoring

### Key Performance Indicators (KPIs)

#### System Availability
- **Target**: 99.5% uptime
- **Measurement**: Monitor service availability
- **Alert Threshold**: >5 minutes downtime

#### Response Times
- **Website**: <3 seconds page load
- **API**: <500ms response time
- **Database**: <100ms query time

#### Error Rates
- **Application Errors**: <1% of requests
- **Database Errors**: <0.1% of queries
- **Integration Failures**: <0.5% of sync operations

### Monitoring Tools

#### Application Monitoring
- **Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Real-time error notifications
- **Performance Metrics**: Response time tracking
- **User Experience**: Core Web Vitals monitoring

#### Infrastructure Monitoring
- **Server Resources**: CPU, memory, disk usage
- **Network Performance**: Bandwidth and latency
- **Database Performance**: Query times and connections
- **Backup Status**: Backup success and file integrity

### Alert Configuration

#### Critical Alerts (Immediate Response)
- System downtime
- Database connection failure
- Payment processing errors
- Security breach detection

#### Warning Alerts (Within 1 Hour)
- High resource usage
- Slow response times
- Integration sync delays
- Backup failures

#### Information Alerts (Daily Review)
- Usage statistics
- Performance trends
- Capacity utilization
- User activity summaries

## Performance Optimization

### Database Optimization

#### Query Optimization
```sql
-- Identify slow queries
SELECT query, total_time, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking >100ms
ORDER BY total_time DESC
LIMIT 20;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;
```

#### Index Management
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
ORDER BY schemaname, tablename;

-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_appointments_date_status 
ON appointments(appointment_date, status) 
WHERE status IN ('scheduled', 'confirmed');
```

### Web Performance

#### Frontend Optimization
- **Image Optimization**: Compress and serve WebP format
- **CSS/JS Minification**: Minimize asset sizes
- **Caching Strategy**: Implement browser and CDN caching
- **Code Splitting**: Load only necessary JavaScript

#### Backend Optimization
- **API Response Caching**: Cache frequent API responses
- **Database Connection Pooling**: Optimize connection usage
- **Lazy Loading**: Load data on demand
- **Background Processing**: Queue heavy operations

### Infrastructure Optimization

#### Server Configuration
```bash
# Optimize Nginx configuration
nginx -t  # Test configuration
systemctl reload nginx

# Optimize PostgreSQL settings
# Edit /etc/postgresql/*/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

## Troubleshooting Common Issues

### Performance Issues

#### Slow Database Queries
1. **Identify**: Use pg_stat_statements to find slow queries
2. **Analyze**: Check execution plans with EXPLAIN
3. **Optimize**: Add indexes or rewrite queries
4. **Monitor**: Track improvement with continued monitoring

#### High Server Load
1. **Identify**: Check CPU and memory usage
2. **Analyze**: Review running processes and connections
3. **Optimize**: Scale resources or optimize code
4. **Monitor**: Set up alerts for resource thresholds

### Integration Issues

#### Calendly Sync Problems
1. **Check API Keys**: Verify credentials are valid
2. **Test Connection**: Use manual sync to test
3. **Review Logs**: Check integration error logs
4. **Contact Support**: Escalate if needed

#### Payment Processing Issues
1. **Check Stripe Status**: Verify service availability
2. **Review Transactions**: Check for failed payments
3. **Test Payments**: Use test mode to verify functionality
4. **Update Configuration**: Ensure API keys are current

## Emergency Procedures

### System Outage Response

#### Immediate Actions (First 5 minutes)
1. **Assess Impact**: Determine scope of outage
2. **Check Status**: Verify system status page
3. **Notify Team**: Alert appropriate personnel
4. **Document**: Record outage details and timeline

#### Recovery Actions (Next 15 minutes)
1. **Identify Cause**: Review logs and monitoring data
2. **Implement Fix**: Apply known solutions
3. **Test System**: Verify functionality restored
4. **Update Status**: Communicate with users

#### Post-Incident Actions (Next 24 hours)
1. **Root Cause Analysis**: Investigate underlying cause
2. **Document Lessons**: Record findings and improvements
3. **Update Procedures**: Revise maintenance procedures
4. **Communicate**: Send post-incident report

### Data Recovery Procedures

#### Database Corruption
1. **Stop Application**: Prevent further data corruption
2. **Assess Damage**: Determine extent of corruption
3. **Restore from Backup**: Use most recent clean backup
4. **Verify Integrity**: Check restored data consistency
5. **Resume Operations**: Restart application services

#### File System Issues
1. **Check Disk Health**: Run filesystem checks
2. **Repair if Possible**: Attempt automatic repair
3. **Restore from Backup**: Use backup if repair fails
4. **Update Monitoring**: Add checks to prevent recurrence

## Contact Information

### Emergency Contacts
- **System Admin**: admin@neffpaving.com / (555) 123-ADMIN
- **Database Admin**: dba@neffpaving.com / (555) 123-DATA
- **Security Team**: security@neffpaving.com / (555) 123-SEC
- **24/7 Support**: (555) 123-HELP

### Vendor Support
- **Hosting Provider**: support@hostingprovider.com
- **Database Support**: PostgreSQL community forums
- **SSL Certificate**: support@sslprovider.com
- **Payment Processing**: Stripe support

### Documentation Links
- [System Architecture](technical/API_AND_INTEGRATIONS.md)
- [Database Schema](technical/DATABASE_AND_ALERTS.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting Guide](user/TROUBLESHOOTING.md)

---

*For maintenance support, contact admin@neffpaving.com or call (555) 123-ADMIN*

*Last Updated: 2024-07-15*
