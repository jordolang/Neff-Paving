# Alert System Configuration Guide - Neff Paving Scheduling System

## Overview

This guide provides comprehensive instructions for configuring and managing the alert system that handles notifications for job scheduling events, system monitoring, and critical alerts.

## Table of Contents

1. [Alert Channels](#alert-channels)
2. [Configuration Setup](#configuration-setup)
3. [Alert Types](#alert-types)
4. [Notification Templates](#notification-templates)
5. [Monitoring and Health Checks](#monitoring-and-health-checks)
6. [Troubleshooting](#troubleshooting)

---

## Alert Channels

The alert system supports multiple notification channels:

### 1. Email Notifications

**Purpose**: Detailed notifications for job scheduling, status updates, and administrative alerts.

**Configuration**:
```javascript
// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Recipients configuration
const emailRecipients = {
  operations: ['operations@neffpaving.com'],
  management: ['manager@neffpaving.com'],
  dispatch: ['dispatch@neffpaving.com'],
  emergency: ['emergency@neffpaving.com']
};
```

**Required Environment Variables**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@neffpaving.com
SMTP_PASS=your_app_password_here
EMAIL_FROM_ADDRESS=notifications@neffpaving.com
EMAIL_FROM_NAME=Neff Paving Scheduling System
```

### 2. SMS Notifications

**Purpose**: Critical alerts and time-sensitive notifications for immediate response.

**Configuration**:
```javascript
// Twilio SMS configuration
const smsConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER
};

// SMS recipients for different alert types
const smsRecipients = {
  emergency: ['+15551234567', '+15551234568'],
  dispatch: ['+15551234569'],
  onCall: ['+15551234570']
};
```

**Required Environment Variables**:
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

### 3. Dashboard Notifications

**Purpose**: Real-time in-app notifications for active users.

**Configuration**:
```javascript
// Dashboard notification configuration
const dashboardConfig = {
  websocketPort: process.env.WS_PORT || 3001,
  retentionHours: 24, // Keep notifications for 24 hours
  maxNotifications: 100 // Max notifications per user
};
```

---

## Configuration Setup

### 1. Environment Configuration

Create a comprehensive `.env` file with all required settings:

```bash
# Alert System Configuration
ALERT_SYSTEM_ENABLED=true
ALERT_LOG_LEVEL=info

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@neffpaving.com
SMTP_PASS=your_app_password
EMAIL_FROM_ADDRESS=notifications@neffpaving.com
EMAIL_FROM_NAME=Neff Paving Alerts

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Dashboard Notifications
WS_PORT=3001
DASHBOARD_NOTIFICATIONS_ENABLED=true

# Alert Recipients
OPERATIONS_EMAIL=operations@neffpaving.com
MANAGEMENT_EMAIL=manager@neffpaving.com
DISPATCH_EMAIL=dispatch@neffpaving.com
EMERGENCY_PHONE=+15551234567
DISPATCH_PHONE=+15551234568

# Alert Thresholds
HIGH_PRIORITY_DELAY_MINUTES=5
CRITICAL_ALERT_RETRY_COUNT=3
NOTIFICATION_BATCH_SIZE=10
```

### 2. Initialize Alert Service

```javascript
// src/services/alert-service-config.js
import { AlertService } from './alert-service.js';
import { EmailNotifier } from './notifiers/email-notifier.js';
import { SMSNotifier } from './notifiers/sms-notifier.js';
import { DashboardNotifier } from './notifiers/dashboard-notifier.js';

export function initializeAlertService() {
  const alertService = new AlertService();
  
  // Configure email notifier
  alertService.addChannel('email', new EmailNotifier({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM_ADDRESS
  }));
  
  // Configure SMS notifier
  alertService.addChannel('sms', new SMSNotifier({
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER
  }));
  
  // Configure dashboard notifier
  alertService.addChannel('dashboard', new DashboardNotifier({
    websocketPort: process.env.WS_PORT
  }));
  
  return alertService;
}
```

### 3. Alert Rules Configuration

```javascript
// src/config/alert-rules.js
export const ALERT_RULES = {
  // Job scheduling alerts
  job_scheduled: {
    channels: ['email', 'dashboard'],
    recipients: {
      email: ['operations@neffpaving.com', 'dispatch@neffpaving.com'],
      dashboard: ['operations', 'dispatch']
    },
    priority: 'normal',
    template: 'job_scheduled'
  },
  
  // Emergency alerts
  emergency_job: {
    channels: ['email', 'sms', 'dashboard'],
    recipients: {
      email: ['emergency@neffpaving.com'],
      sms: ['+15551234567'],
      dashboard: ['emergency', 'management']
    },
    priority: 'critical',
    template: 'emergency_job'
  },
  
  // System alerts
  calendly_api_down: {
    channels: ['email', 'sms'],
    recipients: {
      email: ['devops@neffpaving.com'],
      sms: ['+15551234567']
    },
    priority: 'critical',
    template: 'system_error'
  },
  
  // Schedule changes
  job_rescheduled: {
    channels: ['email', 'dashboard'],
    recipients: {
      email: ['operations@neffpaving.com'],
      dashboard: ['operations', 'dispatch']
    },
    priority: 'normal',
    template: 'job_rescheduled'
  },
  
  // Cancellations
  job_canceled: {
    channels: ['email', 'dashboard'],
    recipients: {
      email: ['operations@neffpaving.com', 'management@neffpaving.com'],
      dashboard: ['operations', 'management']
    },
    priority: 'high',
    template: 'job_canceled'
  }
};
```

---

## Alert Types

### 1. Job Scheduling Alerts

**New Job Scheduled**:
```javascript
const jobScheduledAlert = {
  type: 'job_scheduled',
  data: {
    jobId: 'job_123',
    clientName: 'John Doe',
    serviceType: 'Residential Driveway',
    scheduledDate: '2024-07-15T09:00:00Z',
    duration: 4,
    crew: ['John Smith', 'Mike Johnson'],
    address: '123 Main St, City, State'
  }
};
```

**Job Canceled**:
```javascript
const jobCanceledAlert = {
  type: 'job_canceled',
  data: {
    jobId: 'job_123',
    clientName: 'John Doe',
    originalDate: '2024-07-15T09:00:00Z',
    cancelReason: 'Customer request',
    canceledBy: 'admin_user'
  }
};
```

**Job Rescheduled**:
```javascript
const jobRescheduledAlert = {
  type: 'job_rescheduled',
  data: {
    jobId: 'job_123',
    clientName: 'John Doe',
    oldDate: '2024-07-15T09:00:00Z',
    newDate: '2024-07-16T10:00:00Z',
    reason: 'Weather delay'
  }
};
```

### 2. System Monitoring Alerts

**API Connection Issues**:
```javascript
const apiDownAlert = {
  type: 'calendly_api_down',
  data: {
    service: 'Calendly API',
    error: 'Connection timeout',
    timestamp: '2024-07-15T12:00:00Z',
    severity: 'critical'
  }
};
```

**Database Connection Issues**:
```javascript
const dbErrorAlert = {
  type: 'database_error',
  data: {
    error: 'Connection pool exhausted',
    query: 'SELECT * FROM job_schedules',
    timestamp: '2024-07-15T12:00:00Z'
  }
};
```

### 3. Emergency Alerts

**Emergency Service Request**:
```javascript
const emergencyAlert = {
  type: 'emergency_job',
  data: {
    clientName: 'Jane Smith',
    address: '456 Oak St, City, State',
    emergencyType: 'Sinkhole repair',
    urgency: 'Immediate',
    contactNumber: '+15551234567'
  }
};
```

---

## Notification Templates

### 1. Email Templates

**Job Scheduled Template**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>New Job Scheduled - Neff Paving</title>
</head>
<body>
    <h2>New Job Scheduled</h2>
    <p><strong>Job ID:</strong> {{jobId}}</p>
    <p><strong>Client:</strong> {{clientName}}</p>
    <p><strong>Service Type:</strong> {{serviceType}}</p>
    <p><strong>Scheduled Date:</strong> {{scheduledDate}}</p>
    <p><strong>Duration:</strong> {{duration}} hours</p>
    <p><strong>Address:</strong> {{address}}</p>
    <p><strong>Crew Assigned:</strong> {{crew}}</p>
    
    <hr>
    <p>Please ensure all equipment and materials are ready for the scheduled date.</p>
</body>
</html>
```

**Emergency Job Template**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>🚨 EMERGENCY JOB REQUEST - Neff Paving</title>
</head>
<body>
    <h2 style="color: red;">🚨 EMERGENCY JOB REQUEST</h2>
    <p><strong>Client:</strong> {{clientName}}</p>
    <p><strong>Emergency Type:</strong> {{emergencyType}}</p>
    <p><strong>Urgency:</strong> {{urgency}}</p>
    <p><strong>Address:</strong> {{address}}</p>
    <p><strong>Contact Number:</strong> {{contactNumber}}</p>
    
    <hr>
    <p style="color: red; font-weight: bold;">IMMEDIATE RESPONSE REQUIRED</p>
</body>
</html>
```

### 2. SMS Templates

**Job Scheduled SMS**:
```
🔧 NEW JOB: {{serviceType}} for {{clientName}} on {{date}} at {{address}}. Crew: {{crew}}. Duration: {{duration}}hrs.
```

**Emergency SMS**:
```
🚨 EMERGENCY: {{emergencyType}} at {{address}}. Contact: {{contactNumber}}. Urgency: {{urgency}}. RESPOND IMMEDIATELY.
```

**Job Canceled SMS**:
```
❌ CANCELED: {{serviceType}} for {{clientName}} on {{date}}. Reason: {{reason}}. Crew freed up.
```

### 3. Dashboard Notification Templates

```javascript
// Dashboard notification format
const dashboardNotification = {
  id: 'notification_id',
  type: 'job_scheduled',
  title: 'New Job Scheduled',
  message: 'Residential Driveway for John Doe scheduled for July 15th',
  priority: 'normal',
  timestamp: '2024-07-15T12:00:00Z',
  data: {
    jobId: 'job_123',
    actionUrl: '/jobs/job_123'
  },
  read: false
};
```

---

## Monitoring and Health Checks

### 1. Alert System Health Check

```javascript
// src/health/alert-system-health.js
export class AlertSystemHealth {
  async checkHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      channels: {},
      metrics: {}
    };
    
    try {
      // Check email service
      health.channels.email = await this.checkEmailHealth();
      
      // Check SMS service
      health.channels.sms = await this.checkSMSHealth();
      
      // Check dashboard service
      health.channels.dashboard = await this.checkDashboardHealth();
      
      // Calculate overall health
      const unhealthyChannels = Object.values(health.channels)
        .filter(channel => channel.status !== 'healthy');
      
      if (unhealthyChannels.length > 0) {
        health.status = 'degraded';
      }
      
      // Get metrics
      health.metrics = await this.getAlertMetrics();
      
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }
    
    return health;
  }
  
  async checkEmailHealth() {
    try {
      // Test SMTP connection
      const transporter = nodemailer.createTransporter(emailConfig);
      await transporter.verify();
      
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  async checkSMSHealth() {
    try {
      // Test Twilio connection
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      
      return {
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  async getAlertMetrics() {
    return {
      alertsSentToday: await this.getAlertCount('today'),
      alertsSentThisWeek: await this.getAlertCount('week'),
      failedAlerts: await this.getFailedAlertCount(),
      avgResponseTime: await this.getAverageResponseTime()
    };
  }
}
```

### 2. Alert Performance Monitoring

```javascript
// src/monitoring/alert-monitoring.js
export class AlertMonitoring {
  constructor() {
    this.metrics = new Map();
  }
  
  recordAlertSent(alertType, channel, duration, success) {
    const metric = {
      alertType,
      channel,
      duration,
      success,
      timestamp: new Date()
    };
    
    this.metrics.set(`${Date.now()}_${Math.random()}`, metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.size > 1000) {
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }
  }
  
  getPerformanceReport() {
    const metrics = Array.from(this.metrics.values());
    
    return {
      totalAlerts: metrics.length,
      successRate: this.calculateSuccessRate(metrics),
      averageDeliveryTime: this.calculateAverageDeliveryTime(metrics),
      alertsByChannel: this.groupByChannel(metrics),
      alertsByType: this.groupByType(metrics)
    };
  }
  
  calculateSuccessRate(metrics) {
    const successful = metrics.filter(m => m.success).length;
    return metrics.length > 0 ? (successful / metrics.length) * 100 : 0;
  }
  
  calculateAverageDeliveryTime(metrics) {
    const times = metrics.map(m => m.duration);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Email Delivery Failures

**Symptoms**:
- Emails not being received
- SMTP authentication errors
- Connection timeouts

**Diagnostic Steps**:
```javascript
// Test email configuration
async function testEmailConfig() {
  try {
    const transporter = nodemailer.createTransporter(emailConfig);
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');
    
    // Send test email
    const testEmail = {
      from: process.env.EMAIL_FROM_ADDRESS,
      to: 'test@neffpaving.com',
      subject: 'Alert System Test',
      text: 'This is a test email from the alert system.'
    };
    
    await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    // Common solutions
    if (error.code === 'EAUTH') {
      console.log('💡 Check your email credentials and app password');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Check your SMTP host and port settings');
    }
  }
}
```

**Solutions**:
- Verify SMTP credentials and app passwords
- Check firewall settings for SMTP ports
- Ensure proper environment variable configuration
- Test with different email providers if needed

#### 2. SMS Delivery Issues

**Symptoms**:
- SMS messages not being delivered
- Twilio authentication errors
- Invalid phone number formats

**Diagnostic Steps**:
```javascript
// Test SMS configuration
async function testSMSConfig() {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Test account access
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Twilio account access successful');
    
    // Send test SMS
    const message = await client.messages.create({
      body: 'Test message from Neff Paving alert system',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: '+15551234567' // Replace with test number
    });
    
    console.log('✅ Test SMS sent:', message.sid);
    
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
    
    if (error.code === 20003) {
      console.log('💡 Check your Twilio authentication credentials');
    } else if (error.code === 21211) {
      console.log('💡 Check phone number format (must include country code)');
    }
  }
}
```

**Solutions**:
- Verify Twilio Account SID and Auth Token
- Ensure phone numbers are in E.164 format (+1234567890)
- Check Twilio account balance and messaging service status
- Verify sender phone number is properly configured

#### 3. Dashboard Notification Issues

**Symptoms**:
- Real-time notifications not appearing
- WebSocket connection failures
- Notification persistence issues

**Diagnostic Steps**:
```javascript
// Test WebSocket connection
function testWebSocketConnection() {
  const ws = new WebSocket(`ws://localhost:${process.env.WS_PORT}`);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connection established');
    
    // Send test notification
    ws.send(JSON.stringify({
      type: 'test_notification',
      data: { message: 'Test notification' }
    }));
  });
  
  ws.on('message', (data) => {
    console.log('📩 Received:', data.toString());
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
}
```

**Solutions**:
- Check WebSocket server is running on correct port
- Verify firewall allows WebSocket connections
- Test with browser developer tools
- Check for proxy or load balancer issues

#### 4. High Alert Volume

**Symptoms**:
- Too many alerts being generated
- Alert fatigue among recipients
- Performance degradation

**Solutions**:
```javascript
// Implement alert throttling
export class AlertThrottler {
  constructor() {
    this.alertCounts = new Map();
    this.throttleConfig = {
      maxAlertsPerHour: 10,
      maxAlertsPerDay: 50,
      cooldownPeriod: 300000 // 5 minutes
    };
  }
  
  shouldSendAlert(alertType, recipient) {
    const key = `${alertType}_${recipient}`;
    const now = Date.now();
    
    if (!this.alertCounts.has(key)) {
      this.alertCounts.set(key, { count: 0, lastSent: 0 });
    }
    
    const alertData = this.alertCounts.get(key);
    
    // Check cooldown period
    if (now - alertData.lastSent < this.throttleConfig.cooldownPeriod) {
      return false;
    }
    
    // Check hourly limit
    const hourlyCount = this.getHourlyCount(key);
    if (hourlyCount >= this.throttleConfig.maxAlertsPerHour) {
      return false;
    }
    
    return true;
  }
  
  recordAlertSent(alertType, recipient) {
    const key = `${alertType}_${recipient}`;
    const alertData = this.alertCounts.get(key) || { count: 0, lastSent: 0 };
    
    alertData.count++;
    alertData.lastSent = Date.now();
    
    this.alertCounts.set(key, alertData);
  }
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// Enable debug mode
process.env.DEBUG = 'alert:*';

// Add detailed logging to alert service
import debug from 'debug';
const log = debug('alert:service');

log('Sending alert: %s to channels: %o', alertType, channels);
log('Alert data: %O', alertData);
```

### Health Check Endpoint

Create a health check endpoint for monitoring:

```javascript
// routes/health/alerts.js
router.get('/health/alerts', async (req, res) => {
  try {
    const healthChecker = new AlertSystemHealth();
    const health = await healthChecker.checkHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 206 : 500;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review alert metrics and performance
2. **Monthly**: Update recipient lists and contact information  
3. **Quarterly**: Test all alert channels and templates
4. **Annually**: Review and update alert rules and thresholds

### Support Contacts

- **Alert System Issues**: alerts@neffpaving.com
- **Emergency Contact**: +15551234567
- **Development Team**: dev-team@neffpaving.com

### Monitoring Dashboards

Set up monitoring dashboards to track:
- Alert delivery rates by channel
- Response times for critical alerts
- Failed alert attempts
- System health metrics

For additional support with the alert system, refer to the troubleshooting section or contact the development team.
