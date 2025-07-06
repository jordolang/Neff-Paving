# Quick Start Guide

## Overview

This quick start guide provides essential information to get you up and running with the Neff Paving system quickly. Follow the appropriate section for your role and immediate needs.

## Table of Contents

1. [System Access](#system-access)
2. [For Customers](#for-customers)
3. [For Staff Members](#for-staff-members)
4. [For Developers](#for-developers)
5. [Essential Workflows](#essential-workflows)
6. [Quick Reference](#quick-reference)

## System Access

### Production URLs
- **Main Website**: https://neffpaving.com
- **Admin Panel**: https://neffpaving.com/admin
- **API Base**: https://neffpaving.com/api
- **Customer Portal**: https://neffpaving.com/customer

### Development URLs
- **Local Website**: http://localhost:8001
- **Local Admin**: http://localhost:8001/admin
- **Local API**: http://localhost:8001/api

### Emergency Contacts
- **General Support**: (555) 123-4567
- **Emergency Line**: (555) 123-HELP (24/7)
- **Technical Support**: (555) 123-TECH

## For Customers

### Quick Scheduling (2 minutes)

1. **Visit Website**: Go to https://neffpaving.com
2. **Click Schedule**: Use the "Schedule Service" button
3. **Select Service**: Choose your paving service type
4. **Pick Time**: Select available date and time
5. **Enter Details**: Provide contact and project information
6. **Confirm**: Review and confirm your appointment

### Service Types Available
- **Asphalt Paving**: Driveways, parking lots, roads
- **Concrete Work**: Sidewalks, patios, foundations
- **Repairs**: Crack filling, resurfacing, patching
- **Maintenance**: Sealcoating, line striping
- **Emergency**: 24/7 urgent repairs

### Getting Help
- **Phone**: (555) 123-4567 (8 AM - 6 PM EST)
- **Email**: info@neffpaving.com
- **Emergency**: (555) 123-HELP (24/7)
- **Online**: https://neffpaving.com/help

## For Staff Members

### Quick Login (30 seconds)

1. **Access Admin**: Go to https://neffpaving.com/admin
2. **Enter Credentials**: Use your assigned username/password
3. **Dashboard**: You'll see the main dashboard
4. **Navigation**: Use the sidebar for different sections

### Essential Daily Tasks

#### Morning Routine (5 minutes)
1. **Check Dashboard**: Review daily appointments
2. **Review Alerts**: Check system notifications
3. **Update Status**: Mark availability and location
4. **Check Messages**: Review customer communications

#### Customer Management
1. **View Appointments**: Customer → Appointments
2. **Add Customer**: Customer → New Customer
3. **Update Info**: Edit customer details
4. **Generate Estimate**: Use estimate calculator

#### Scheduling Operations
1. **View Calendar**: Scheduling → Calendar View
2. **Book Appointment**: Scheduling → New Booking
3. **Modify Booking**: Edit existing appointments
4. **Sync Calendly**: Use sync button for integration

### Key Features Access
- **Customer Management**: Sidebar → Customers
- **Scheduling**: Sidebar → Scheduling
- **Estimates**: Sidebar → Estimates
- **Reports**: Sidebar → Reports
- **Settings**: Sidebar → System Settings

### Getting Help
- **Staff Support**: support@neffpaving.com
- **Training**: training@neffpaving.com
- **IT Issues**: tech@neffpaving.com
- **Documentation**: [Staff Guide](user/STAFF_GUIDE.md)

## For Developers

### Quick Setup (10 minutes)

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL database access
- Git for version control
- Code editor (VS Code recommended)

#### Environment Setup
```bash
# Clone repository
git clone https://github.com/neffpaving/system.git
cd neff-paving-system

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:setup

# Start development server
npm run dev
```

#### Key Configuration Files
- **Environment**: `.env` - Database, API keys, settings
- **Build**: `vite.config.js` - Build configuration
- **Database**: `database/migrations/` - Database schema
- **API**: `api/routes/` - API endpoint definitions

### Essential Development Tasks

#### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Database operations
npm run db:migrate
npm run db:seed
```

#### API Testing
```bash
# Health check
curl http://localhost:8001/api/health

# Test authentication
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

### Documentation Links
- **API Guide**: [API and Integrations](technical/API_AND_INTEGRATIONS.md)
- **Build Guide**: [Build and Configuration](BUILD_AND_CONFIG.md)
- **Deployment**: [Deployment Guide](DEPLOYMENT.md)
- **Database**: [Database and Alerts](technical/DATABASE_AND_ALERTS.md)

### Getting Help
- **Dev Team**: dev-team@neffpaving.com
- **Architecture**: architecture@neffpaving.com
- **Database**: db-admin@neffpaving.com
- **Documentation**: https://neffpaving.com/docs

## Essential Workflows

### Customer Scheduling Workflow

**Customer Side (2-3 minutes)**:
1. Visit website → Select service → Choose time → Enter details → Confirm

**Staff Side (1-2 minutes)**:
1. Receive notification → Review details → Confirm/modify → Contact customer

**System Actions (Automatic)**:
- Send confirmation emails
- Sync with Calendly
- Update calendar
- Trigger notifications

### Estimate Generation Workflow

**Staff Process (3-5 minutes)**:
1. Customer → New Estimate
2. Enter project details
3. Use area calculator for measurements
4. Apply pricing rules
5. Generate and send estimate

**System Features**:
- Google Maps integration for area calculation
- Automated pricing based on service type
- PDF generation and email delivery
- Customer approval tracking

### Payment Processing Workflow

**Customer Payment**:
1. Receive invoice email
2. Click payment link
3. Enter payment details
4. Confirm payment

**Staff Management**:
1. Generate invoice
2. Send to customer
3. Track payment status
4. Process completion

## Quick Reference

### Keyboard Shortcuts (Admin Panel)
- **Ctrl+/** : Help menu
- **Ctrl+N** : New customer/appointment
- **Ctrl+S** : Save current form
- **Ctrl+F** : Search customers
- **Esc** : Close modal/cancel action

### Common URLs
```
Production:
- Main site: https://neffpaving.com
- Admin: https://neffpaving.com/admin
- API: https://neffpaving.com/api
- Status: https://status.neffpaving.com

Development:
- Local site: http://localhost:8001
- Local admin: http://localhost:8001/admin
- Local API: http://localhost:8001/api
```

### Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run test suite

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset database

# Deployment
npm run deploy       # Deploy to production
npm run deploy:test  # Deploy to staging
```

### Status Codes
- **200**: Success
- **400**: Bad request (check input)
- **401**: Unauthorized (login required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Server error (contact support)

### File Locations
```
Configuration:
- Environment: .env
- Database: config/database.js
- API: config/api.js

Source Code:
- Frontend: src/
- Backend: api/
- Database: database/
- Tests: tests/

Documentation:
- Main: README.md
- API: technical/API_AND_INTEGRATIONS.md
- Deployment: DEPLOYMENT.md
```

## Emergency Procedures

### System Down
1. **Check Status**: https://status.neffpaving.com
2. **Call Emergency**: (555) 123-HELP
3. **Use Manual Process**: Switch to phone/email
4. **Document Issues**: Record problems for IT

### Data Issues
1. **Stop Activity**: Cease data entry
2. **Contact IT**: Immediate support needed
3. **Don't Refresh**: Keep current state
4. **Wait for Guidance**: Follow IT instructions

### Customer Emergencies
1. **Acknowledge**: Confirm receipt
2. **Escalate**: Contact supervisor immediately
3. **Document**: Record all details
4. **Follow Up**: Ensure resolution

## Getting More Help

### Documentation
- **Complete Guides**: See main [README.md](README.md)
- **Staff Training**: [Staff Guide](user/STAFF_GUIDE.md)
- **Troubleshooting**: [Troubleshooting Guide](user/TROUBLESHOOTING.md)
- **Technical Details**: [Technical Documentation](technical/)

### Support Channels
- **General**: (555) 123-4567 / support@neffpaving.com
- **Emergency**: (555) 123-HELP (24/7)
- **Training**: training@neffpaving.com
- **Technical**: tech@neffpaving.com

### Training Resources
- **Video Tutorials**: https://neffpaving.com/training
- **Knowledge Base**: https://neffpaving.com/help
- **Live Training**: Schedule at training@neffpaving.com
- **User Manuals**: https://neffpaving.com/guides

---

*For immediate assistance, call (555) 123-4567 or visit https://neffpaving.com/help*

*Last Updated: 2024-07-15*
