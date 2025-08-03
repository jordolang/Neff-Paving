# API Key Generation and Management - Neff Paving

## Overview

This guide provides comprehensive instructions for generating, configuring, and managing API keys and security credentials required for the Neff Paving system. Proper key management is critical for system security and functionality.

## Core API Keys Required

### 1. Google Maps API Key

**Purpose:** Powers the interactive area calculation tools and address geocoding features.

**Required Services:**
- Maps JavaScript API
- Places API
- Geocoding API
- Drawing API (for area calculation)

**Generation Steps:**

1. **Create Google Cloud Project:**
   ```bash
   # Navigate to Google Cloud Console
   https://console.cloud.google.com/
   
   # Create new project or select existing
   # Project Name: neff-paving-maps
   ```

2. **Enable Required APIs:**
   ```bash
   # Enable Maps JavaScript API
   gcloud services enable maps-backend.googleapis.com
   
   # Enable Places API
   gcloud services enable places-backend.googleapis.com
   
   # Enable Geocoding API
   gcloud services enable geocoding-backend.googleapis.com
   ```

3. **Create API Key:**
   ```bash
   # Via Console: APIs & Services > Credentials > Create Credentials > API Key
   # Or via CLI:
   gcloud auth application-default login
   gcloud alpha services api-keys create --display-name="Neff Paving Maps"
   ```

4. **Configure API Key Restrictions:**
   ```javascript
   // Restrict to specific domains for security
   Referrer restrictions: 
   - https://your-domain.com/*
   - https://www.your-domain.com/*
   - https://your-vercel-domain.vercel.app/*
   - http://localhost:3000/* (for development)
   
   // Restrict to required APIs only
   API restrictions:
   - Maps JavaScript API
   - Places API  
   - Geocoding API
   ```

5. **Environment Variable Configuration:**
   ```bash
   # Add to Vercel environment variables
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk
   
   # For development (.env.local)
   VITE_GOOGLE_MAPS_API_KEY=your_development_key_here
   ```

### 2. Calendly API Integration

**Purpose:** Automated scheduling and appointment management integration.

**Required Scopes:**
- `scheduling:read` - Read calendar events
- `scheduling:write` - Create/modify events
- `webhooks:read` - Webhook subscription management

**Generation Steps:**

1. **Create Calendly App:**
   ```bash
   # Navigate to Calendly Developer Console
   https://developer.calendly.com/
   
   # Create new app
   # App Name: Neff Paving Scheduler
   # Redirect URI: https://your-domain.com/auth/calendly/callback
   ```

2. **Generate Access Token:**
   ```bash
   # Personal Access Token for server-side operations
   # Navigate to: Settings > Developer Tools > Personal Access Tokens
   # Create token with required scopes
   ```

3. **Configure Webhook Endpoints:**
   ```javascript
   // Webhook URL for event notifications
   https://your-domain.vercel.app/api/webhooks/calendly
   
   // Required events:
   - invitee.created
   - invitee.canceled
   - event.rescheduled
   ```

4. **Environment Variables:**
   ```bash
   CALENDLY_API_KEY=your_api_key_here
   CALENDLY_WEBHOOK_KEY=your_webhook_signing_key
   CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_uuid
   CALENDLY_ACCESS_TOKEN=your_personal_access_token
   
   # Service-specific event type URLs
   CALENDLY_RESIDENTIAL_EVENT_TYPE=https://calendly.com/your-handle/residential-consultation
   CALENDLY_COMMERCIAL_EVENT_TYPE=https://calendly.com/your-handle/commercial-estimate
   ```

### 3. Stripe Payment Processing

**Purpose:** Secure payment processing for deposits and final payments.

**Required Capabilities:**
- Payment Intents
- Webhook handling
- Customer management
- Refunds and disputes

**Generation Steps:**

1. **Create Stripe Account:**
   ```bash
   # Navigate to Stripe Dashboard
   https://dashboard.stripe.com/
   
   # Complete business verification for live payments
   # Set up bank account for payouts
   ```

2. **Obtain API Keys:**
   ```bash
   # Test Keys (for development)
   Publishable Key: pk_test_...
   Secret Key: sk_test_...
   
   # Live Keys (for production)
   Publishable Key: pk_live_...
   Secret Key: sk_live_...
   ```

3. **Configure Webhooks:**
   ```javascript
   // Endpoint URL
   https://your-domain.vercel.app/api/webhooks/stripe
   
   // Required events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.dispute.created
   - invoice.payment_failed
   - customer.subscription.deleted
   ```

4. **Environment Variables:**
   ```bash
   # Production Keys
   STRIPE_SECRET_KEY=sk_live_your_secret_key_here
   STRIPE_PUBLIC_KEY=pk_live_your_public_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   
   # Test Keys (for development)
   STRIPE_SECRET_KEY_TEST=sk_test_your_test_secret_key
   STRIPE_PUBLIC_KEY_TEST=pk_test_your_test_public_key
   STRIPE_WEBHOOK_SECRET_TEST=whsec_your_test_webhook_secret
   ```

## Database Credentials

### PostgreSQL Database Setup

**Purpose:** Primary data storage for jobs, users, contracts, and analytics.

**Generation Steps:**

1. **Create Database Instance:**
   ```bash
   # Using managed service (recommended)
   # Options: AWS RDS, Google Cloud SQL, Heroku Postgres, Supabase
   
   # Example: Supabase setup
   # Navigate to: https://supabase.com/
   # Create new project: neff-paving-db
   ```

2. **Generate Connection Credentials:**
   ```sql
   -- Database connection details will be provided
   Host: db.your-project.supabase.co
   Database: postgres
   Username: postgres
   Password: your_generated_password
   Port: 5432
   ```

3. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
   
   # Connection pool settings
   DB_POOL_MIN=2
   DB_POOL_MAX=20
   DB_POOL_IDLE_TIMEOUT=30000
   DB_POOL_ACQUIRE_TIMEOUT=60000
   ```

## Email Service Configuration

### SMTP Credentials

**Purpose:** Automated email notifications for estimates, confirmations, and updates.

**Recommended Services:**
- SendGrid
- Mailgun
- AWS SES
- Postmark

**Setup Example (SendGrid):**

1. **Create SendGrid Account:**
   ```bash
   # Navigate to: https://sendgrid.com/
   # Create account and verify domain
   ```

2. **Generate API Key:**
   ```bash
   # Settings > API Keys > Create API Key
   # Name: Neff Paving Notifications
   # Permissions: Full Access (or Mail Send only)
   ```

3. **Environment Variables:**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   
   # Email configuration
   FROM_EMAIL=no-reply@neffpaving.com
   FROM_NAME=Neff Paving
   REPLY_TO_EMAIL=info@neffpaving.com
   ```

## JWT Secret Generation

### Authentication Token Security

**Purpose:** Secure user authentication and session management.

**Generation Steps:**

1. **Generate Strong Secret:**
   ```bash
   # Generate cryptographically secure random string
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Or using OpenSSL
   openssl rand -hex 64
   
   # Or online generator (ensure HTTPS)
   # https://generate-secret.vercel.app/64
   ```

2. **Environment Variables:**
   ```bash
   JWT_SECRET=your_64_character_hex_string_here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

## Environment Variable Management

### Development Environment

Create `.env.local` file for local development:

```bash
# .env.local (DO NOT COMMIT TO VERSION CONTROL)

# Core Configuration
NODE_ENV=development
DEPLOY_PLATFORM=local
VITE_PLATFORM=local

# API Keys
VITE_GOOGLE_MAPS_API_KEY=your_development_maps_key
CALENDLY_API_KEY=your_calendly_api_key
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_test_public_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neff_paving_dev

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass

# JWT
JWT_SECRET=your_jwt_secret_for_development
```

### Production Environment (Vercel)

Set production environment variables in Vercel dashboard:

```bash
# Set via Vercel CLI
vercel env add VITE_GOOGLE_MAPS_API_KEY production
vercel env add CALENDLY_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# Or via Vercel Dashboard
# Project Settings > Environment Variables
```

### Environment Variable Security

**Best Practices:**

1. **Never commit sensitive keys to version control**
2. **Use different keys for development/staging/production**
3. **Rotate keys regularly (every 90 days)**
4. **Implement key monitoring and alerting**
5. **Use managed secret services when possible**

**Security Checklist:**
- [ ] API keys restricted to necessary services only
- [ ] Domain restrictions configured for client-side keys
- [ ] Webhook endpoints protected with signature verification
- [ ] Database credentials use limited privileges
- [ ] SMTP credentials are from reputable service
- [ ] JWT secrets are cryptographically secure
- [ ] All production keys different from development keys

## Key Rotation Procedures

### Quarterly Key Rotation

**Schedule:** Every 90 days or when security incident occurs

**Rotation Steps:**

1. **Generate New Keys:**
   ```bash
   # Create new API keys from respective services
   # Update environment variables with new keys
   # Test functionality with new keys
   ```

2. **Update Configuration:**
   ```bash
   # Update Vercel environment variables
   vercel env add NEW_API_KEY production
   vercel env rm OLD_API_KEY production
   
   # Deploy to activate new keys
   vercel --prod
   ```

3. **Deactivate Old Keys:**
   ```bash
   # After successful deployment, deactivate old keys
   # Monitor for any failed requests or errors
   # Keep old keys for 48 hours as backup
   ```

4. **Update Documentation:**
   - Update internal documentation with new key references
   - Notify team members of rotation completion
   - Schedule next rotation date

## Monitoring and Alerting

### API Key Usage Monitoring

**Google Maps API:**
- Monitor daily quotas and usage patterns
- Set up billing alerts for unexpected usage spikes
- Track API error rates and response times

**Stripe Integration:**
- Monitor payment success rates
- Set up alerts for failed payments or disputes
- Track transaction volumes and patterns

**Database Monitoring:**
- Monitor connection pool usage
- Set up alerts for slow queries
- Track database size and growth

### Security Monitoring

**Implement monitoring for:**
- Unusual API key usage patterns
- Failed authentication attempts
- Webhook signature verification failures
- Database connection anomalies
- SMTP delivery failures

**Alert Channels:**
- Email notifications for critical issues
- Slack/Discord integration for team alerts
- SMS for emergency security incidents

## Backup and Recovery

### Key Backup Strategy

1. **Secure Key Storage:**
   - Store backup keys in encrypted password manager
   - Maintain offline copies of critical keys
   - Document key generation procedures

2. **Recovery Procedures:**
   - Test key recovery process quarterly
   - Maintain emergency contact information for all services
   - Document step-by-step recovery procedures

3. **Disaster Recovery:**
   - Plan for complete key compromise scenarios
   - Maintain relationships with service providers
   - Test failover procedures regularly

This comprehensive key management guide ensures secure and reliable operation of all Neff Paving system integrations while maintaining the highest security standards.
