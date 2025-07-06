# Deployment Guide - Neff Paving System

## Overview

This comprehensive deployment guide covers all aspects of deploying the Neff Paving system, including the main website, admin panel, scheduling system, and backend services. This guide consolidates information from multiple deployment sources into a single, authoritative reference.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Build and Configuration](#build-and-configuration)
4. [Platform-Specific Deployment](#platform-specific-deployment)
5. [Production Deployment Process](#production-deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Quick Start

### Automated Startup (Recommended)
```bash
cd /app
chmod +x start-services.sh
./start-services.sh
```

### Manual Startup
```bash
# Start backend
cd /app
node backend/server-simple.js &

# Start frontend (development)
npm run dev &
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main Website** | http://localhost:8001 | - |
| **Admin Panel** | http://localhost:8001/admin | admin/admin123 |
| **API Health** | http://localhost:8001/api/health | - |

---

## Environment Setup

### Core Environment Variables

**Backend Configuration (.env)**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=neff_paving_admin
DB_USER=postgres
DB_PASSWORD=password

# API Keys
GOOGLE_MAPS_API_KEY=AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k
JWT_SECRET=your_jwt_secret_here

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

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

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@neffpaving.com
SMTP_PASS=your_app_password
EMAIL_FROM_ADDRESS=notifications@neffpaving.com

# SMS Configuration
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
```

**Frontend Configuration (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k
```

### Google Maps API Configuration

Three API keys are available for redundancy:
- `AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k` (Primary)
- `AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk` (Secondary)
- `AIzaSyB6igIPyhIPudzvwD6LbmgrCkxuEXvbjJE` (Backup)

### Webhook Configuration

**Production Webhook Endpoints:**
```bash
WEBHOOK_URL=https://production.neffpaving.com/api/webhooks/calendly
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

---

## Build and Configuration

### Build Commands

```bash
# Standard build
npm run build

# Optimized build with platform-specific configuration
npm run build:optimized

# Platform-specific builds
npm run build:optimized:vercel
npm run build:optimized:github

# Build verification
npm run verify:build
```

### Build Modes

#### GitHub Pages Mode
- **Base URL**: `/Neff-Paving/`
- **Asset Path**: Relative to base URL
- **Build Command**: `npm run build:github`

#### Vercel Mode
- **Base URL**: `/`
- **Asset Path**: Absolute from root
- **Build Command**: `npm run build:vercel`

#### Custom Environment
- **Base URL**: Set via `VITE_BASE_URL` environment variable
- **Fallback**: `/Neff-Paving/`

### Build Features

- **Dynamic Base URL**: Automatically handles different deployment environments
- **Asset Optimization**: Images, CSS, and JavaScript optimization
- **Cache Busting**: Automatic cache management
- **Error Recovery**: Fallback build process on optimization failures
- **Verification**: Comprehensive build integrity checking

---

## Platform-Specific Deployment

### Vercel Deployment

#### Initial Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build:optimized:vercel",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "env": {
    "NODE_ENV": "production",
    "DEPLOY_PLATFORM": "vercel"
  },
  "functions": {
    "backend/server-simple.js": {
      "maxDuration": 30
    }
  }
}
```

#### Environment Variables in Vercel
Configure the following in Vercel dashboard:
- All backend environment variables
- `DEPLOY_PLATFORM=vercel`
- Database connection strings
- API keys and secrets

### GitHub Pages Deployment

#### Setup
```bash
# Build for GitHub Pages
npm run build:github

# Deploy using GitHub Actions or manual push to gh-pages branch
npm run deploy:github
```

#### GitHub Actions Configuration
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build:github
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### VPS/Server Deployment

#### Server Setup
```bash
# Clone repository
git clone https://github.com/yourusername/neff-paving.git
cd neff-paving

# Install dependencies
npm install && cd backend && npm install

# Configure environment variables
cp .env.example .env
# Edit .env with production values

# Build application
npm run build:optimized

# Install PM2 for process management
npm install -g pm2

# Start services
pm2 start backend/server-simple.js --name neff-backend
pm2 startup
pm2 save
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/neff-paving/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci && cd backend && npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build:optimized

# Expose port
EXPOSE 8001

# Start application
CMD ["node", "backend/server-simple.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: neff_paving_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Production Deployment Process

### Pre-Deployment Checklist

1. **Environment Configuration**
   - [ ] All environment variables configured
   - [ ] API keys validated
   - [ ] Database connections tested
   - [ ] Webhook endpoints configured

2. **Code Preparation**
   - [ ] All tests passing
   - [ ] Code reviewed and approved
   - [ ] Dependencies updated
   - [ ] Security scan completed

3. **Database Preparation**
   - [ ] Database backup created
   - [ ] Migration scripts tested
   - [ ] Schema changes verified

### Deployment Steps

1. **Database Updates**
```bash
# Create backup
pg_dump neff_paving_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run migrate:up

# Verify database health
psql -d neff_paving_prod -c "SELECT 1;"
```

2. **Code Deployment**
```bash
# Stop current services
sudo systemctl stop neff-paving-app

# Deploy new code
rsync -av --exclude=node_modules . /opt/neff-paving/

# Install dependencies
cd /opt/neff-paving && npm ci --production

# Build application
npm run build:optimized

# Set permissions
chown -R neff-app:neff-app /opt/neff-paving

# Start services
sudo systemctl start neff-paving-app
```

3. **Service Verification**
```bash
# Check service status
sudo systemctl status neff-paving-app

# Verify health endpoints
curl https://production.neffpaving.com/api/health
curl https://production.neffpaving.com/health/calendly
curl https://production.neffpaving.com/health/database
```

---

## Post-Deployment Verification

### Automated Testing

```bash
# Run deployment tests
npm run test:deployment --url https://production.neffpaving.com

# Verify build integrity
npm run verify:build

# Test critical functionality
npm run test:critical-path
```

### Manual Verification Checklist

1. **Frontend Verification**
   - [ ] Main website loads correctly
   - [ ] Admin panel accessible
   - [ ] Contact form submits successfully
   - [ ] Area finder tool functions
   - [ ] All assets load properly

2. **Backend Verification**
   - [ ] API endpoints respond correctly
   - [ ] Database connections working
   - [ ] Authentication system functional
   - [ ] Webhook processing active

3. **Integration Verification**
   - [ ] Calendly integration working
   - [ ] Google Maps integration active
   - [ ] Email notifications sending
   - [ ] Alert system functioning

### Performance Verification

```bash
# Monitor API response times
grep "response_time" /var/log/neff-paving/api.log | tail -20

# Check database performance
psql -d neff_paving_prod -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitor resource usage
top
df -h
free -m
```

---

## Monitoring and Maintenance

### Continuous Monitoring

The system provides comprehensive monitoring including:

- **Health Checks**: Real-time system status monitoring
- **Performance Metrics**: Response times and error rates
- **Alert Delivery**: Notification success tracking
- **Business Metrics**: Scheduling efficiency and completion rates

### Monitoring Setup

```bash
# Start monitoring
npm run monitor:deployment

# Custom monitoring configuration
node scripts/monitor-deployment.js \
  --urls https://neffpaving.com,https://www.neffpaving.com \
  --interval 60 \
  --webhook https://hooks.slack.com/services/...
```

### Key Metrics to Monitor

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

### Regular Maintenance Tasks

#### Daily Tasks
```bash
# System health check
npm run health:check

# Review error logs
tail -n 100 /var/log/neff-paving/error.log

# Monitor resource usage
df -h && free -m
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

# Documentation review
npm run docs:review

# Capacity planning
npm run report:capacity
```

---

## Troubleshooting

### Common Issues

#### Build Failures

**Optimization Failures:**
```bash
# Disable optimization temporarily
OPTIMIZE_ASSETS=false npm run build:optimized

# Check memory usage
node --max-old-space-size=8192 scripts/deploy-optimized.js

# Fix file permissions
chmod -R 755 dist/
```

**Verification Failures:**
```bash
# Check critical files
ls -la dist/index.html
ls -la dist/admin/

# Analyze bundle sizes
npm install -g bundle-analyzer
bundle-analyzer dist/
```

#### Deployment Issues

**Connection Failures:**
```bash
# Test with increased timeout
node scripts/test-deployment.js --timeout 60000

# Manual health check
curl -I https://your-site.com/api/health
```

**Asset Loading Failures:**
```bash
# Check asset paths
grep -r "assets/" dist/

# Verify asset existence
find dist/ -name "*.js" -o -name "*.css"
```

#### Runtime Issues

**Backend Not Starting:**
```bash
# Check port availability
lsof -i :8001

# Kill existing process
pkill -f "node backend/server-simple.js"

# Check logs
tail -f /app/backend.log
```

**Google Maps Not Loading:**
- Verify API key configuration
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

**Admin Login Issues:**
- Check backend logs
- Verify credentials (admin/admin123)
- Clear browser localStorage

### Debug Commands

```bash
# Comprehensive system check
npm run verify:build && npm run test:deployment

# Monitor with verbose logging
DEBUG=* node scripts/monitor-deployment.js

# Check build artifacts
find dist/ -type f -exec ls -lh {} \; | sort -k5 -hr
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

#### Platform-Specific Rollbacks

**Vercel Rollback:**
```bash
vercel rollback
```

**GitHub Pages Rollback:**
```bash
git revert HEAD
git push origin main
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

## Success Criteria

### Functional Requirements
- [ ] All scheduling features work correctly
- [ ] Calendly integration is functional
- [ ] Alert system delivers notifications
- [ ] Database operations perform well
- [ ] User authentication works properly
- [ ] All API endpoints respond correctly

### Performance Requirements
- [ ] API response times < 500ms
- [ ] Database queries < 100ms
- [ ] Page load times < 3 seconds
- [ ] Error rate < 1%
- [ ] Uptime > 99.5%

### Security Requirements
- [ ] All data encrypted in transit
- [ ] API keys properly secured
- [ ] Access controls enforced
- [ ] Audit logging active
- [ ] Security monitoring operational

---

## Support and Contact

### Emergency Contacts
- **System Administrator**: sysadmin@neffpaving.com
- **Development Team**: dev-team@neffpaving.com
- **Emergency Hotline**: (555) 123-HELP
- **Management**: management@neffpaving.com

### Technical Support
- **Email**: support@neffpaving.com
- **Phone**: (555) 123-TECH
- **Emergency**: (555) 123-HELP

For deployment issues, contact the development team with:
1. Full error logs and stack traces
2. Environment configuration details
3. Steps to reproduce the issue
4. Expected vs. actual behavior

---

*Last Updated: 2024-07-15*  
*Version: 2.0*  
*Next Review: 2024-10-15*
