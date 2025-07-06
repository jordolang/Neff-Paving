# API Documentation and Integration Guide

## Overview

This document provides comprehensive documentation for the Neff Paving system APIs and integration guides for external services including Calendly, Google Maps, and payment processing systems.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core API Endpoints](#core-api-endpoints)
4. [Calendly Integration](#calendly-integration)
5. [Google Maps Integration](#google-maps-integration)
6. [Payment Integration](#payment-integration)
7. [Webhook Management](#webhook-management)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [SDK and Libraries](#sdk-and-libraries)

---

## API Overview {#api-documentation}

### Base Configuration

**API Base URL**: `http://localhost:8001/api` (Development)  
**Production URL**: `https://production.neffpaving.com/api`

**Supported Formats**: JSON  
**Authentication**: JWT Bearer tokens  
**Rate Limiting**: 1000 requests per hour per API key

### Environment Variables

```bash
# Core API Configuration
API_BASE_URL=http://localhost:8001/api
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://user:pass@localhost:5432/neff_paving_admin

# External Service APIs
GOOGLE_MAPS_API_KEY=AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k
CALENDLY_API_KEY=cal_live_your_api_key_here
CALENDLY_ACCESS_TOKEN=your_personal_access_token
STRIPE_SECRET_KEY=sk_test_your_stripe_key
```

---

## Authentication

### JWT Authentication System

#### Admin Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "administrator"
  },
  "expiresIn": "24h"
}
```

#### Token Verification
```http
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "administrator"
  },
  "expiresAt": "2024-07-16T12:00:00Z"
}
```

#### Protected Route Usage
```javascript
// Include Authorization header in all protected requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## Core API Endpoints

### Health Check Endpoints

#### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-07-15T12:00:00Z",
  "services": {
    "database": "connected",
    "calendly": "operational",
    "maps": "operational"
  },
  "version": "2.0.0"
}
```

#### Database Health
```http
GET /api/health/database
```

#### Calendly Health
```http
GET /api/health/calendly
```

#### Maps Service Health
```http
GET /api/health/maps
```

### Estimates Management

#### Create New Estimate
```http
POST /api/estimates
Content-Type: application/json
Authorization: Bearer {token}

{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "serviceType": "residential",
  "projectAddress": "123 Main St, Columbus, OH",
  "projectSize": "1200",
  "timeline": "2-3 weeks",
  "description": "Driveway repaving project",
  "areaMeasurement": {
    "coordinates": [...],
    "area": 1200,
    "unit": "sqft"
  }
}
```

**Response:**
```json
{
  "id": "est_12345",
  "status": "pending",
  "customerName": "John Doe",
  "estimatedCost": 8500,
  "createdAt": "2024-07-15T12:00:00Z",
  "responseBy": "2024-07-15T14:00:00Z"
}
```

#### Get All Estimates (Admin)
```http
GET /api/estimates
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `status`: Filter by status (pending, sent, accepted, rejected)
- `serviceType`: Filter by service type
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "estimates": [
    {
      "id": "est_12345",
      "customerName": "John Doe",
      "serviceType": "residential",
      "status": "pending",
      "estimatedCost": 8500,
      "createdAt": "2024-07-15T12:00:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

#### Update Estimate Status
```http
PUT /api/estimates/{id}/status
Authorization: Bearer {admin_token}

{
  "status": "sent",
  "estimatedCost": 8500,
  "notes": "Estimate includes premium materials"
}
```

### Maps and Area Calculation

#### Calculate Area from Coordinates
```http
POST /api/maps/calculate-area
Content-Type: application/json

{
  "coordinates": [
    {"lat": 39.9612, "lng": -82.9988},
    {"lat": 39.9622, "lng": -82.9988},
    {"lat": 39.9622, "lng": -82.9978},
    {"lat": 39.9612, "lng": -82.9978}
  ]
}
```

**Response:**
```json
{
  "area": {
    "sqft": 4356.5,
    "acres": 0.1,
    "sqm": 404.8
  },
  "perimeter": {
    "ft": 264.2,
    "m": 80.5
  },
  "center": {
    "lat": 39.9617,
    "lng": -82.9983
  }
}
```

#### Verify Service Area Coverage
```http
GET /api/maps/service-area/{zipcode}
```

**Response:**
```json
{
  "covered": true,
  "serviceLevel": "primary",
  "responseTime": "same-day",
  "distance": 12.5,
  "additionalFees": false
}
```

### Admin Dashboard

#### Dashboard Statistics
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "estimates": {
    "total": 156,
    "pending": 12,
    "thisMonth": 23
  },
  "revenue": {
    "thisMonth": 45000,
    "lastMonth": 38000,
    "growth": 18.4
  },
  "projects": {
    "active": 8,
    "completed": 148,
    "scheduled": 15
  }
}
```

#### Recent Activities
```http
GET /api/admin/dashboard/activities
Authorization: Bearer {admin_token}
```

#### Customer Management
```http
GET /api/admin/customers
Authorization: Bearer {admin_token}
```

---

## Calendly Integration

### Setup and Configuration

#### Environment Variables
```bash
CALENDLY_API_KEY=cal_live_your_api_key_here
CALENDLY_WEBHOOK_KEY=webhook_signing_key_here
CALENDLY_ORG_URI=https://api.calendly.com/organizations/your_org_id
CALENDLY_ACCESS_TOKEN=your_personal_access_token

# Event Type Configuration
CALENDLY_RESIDENTIAL_EVENT_TYPE=https://api.calendly.com/event_types/AAAAAAA
CALENDLY_COMMERCIAL_EVENT_TYPE=https://api.calendly.com/event_types/BBBBBBB
CALENDLY_MAINTENANCE_EVENT_TYPE=https://api.calendly.com/event_types/CCCCCCC
CALENDLY_EMERGENCY_EVENT_TYPE=https://api.calendly.com/event_types/DDDDDDD
```

#### Initial Setup Script
```javascript
// Setup Calendly webhook endpoints
const setupWebhook = async () => {
  const response = await fetch('https://api.calendly.com/webhook_subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://production.neffpaving.com/api/webhooks/calendly',
      events: [
        'invitee.created',
        'invitee.canceled',
        'invitee.rescheduled'
      ],
      organization: CALENDLY_ORG_URI,
      scope: 'organization'
    })
  });
  
  return response.json();
};
```

### Job Scheduling Service

#### Core Methods

##### Schedule Job
```javascript
const scheduleJob = async (contractData, estimateData, paymentData) => {
  try {
    const eventTypeUri = getEventTypeForService(contractData.serviceType);
    
    const scheduling = await calendlyService.createEvent({
      eventType: eventTypeUri,
      invitee: {
        name: contractData.clientName,
        email: contractData.clientEmail
      },
      location: estimateData.address,
      duration: estimateData.timeline.days * 8, // Convert days to hours
      notes: `Contract: ${contractData.id}, Cost: $${estimateData.totalCost}`
    });
    
    // Store in database
    await db.jobSchedules.create({
      contractId: contractData.id,
      calendlyEventUri: scheduling.uri,
      startDate: scheduling.startTime,
      endDate: scheduling.endTime,
      status: 'scheduled'
    });
    
    return scheduling;
  } catch (error) {
    throw new Error(`Scheduling failed: ${error.message}`);
  }
};
```

##### Get Availability
```javascript
const getAvailability = async (serviceType, duration) => {
  const eventTypeUri = getEventTypeForService(serviceType);
  
  const response = await fetch(
    `https://api.calendly.com/event_type_available_times?event_type=${eventTypeUri}&start_time=${startDate}&end_time=${endDate}`,
    {
      headers: { 'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}` }
    }
  );
  
  const data = await response.json();
  return data.collection;
};
```

### Event Type Configuration

#### Service Categories
```javascript
const EVENT_TYPE_MAPPING = {
  'residential': process.env.CALENDLY_RESIDENTIAL_EVENT_TYPE,
  'commercial': process.env.CALENDLY_COMMERCIAL_EVENT_TYPE,
  'maintenance': process.env.CALENDLY_MAINTENANCE_EVENT_TYPE,
  'emergency': process.env.CALENDLY_EMERGENCY_EVENT_TYPE
};

const getEventTypeForService = (serviceType) => {
  return EVENT_TYPE_MAPPING[serviceType] || EVENT_TYPE_MAPPING['residential'];
};
```

#### Event Duration Settings
```javascript
const DURATION_SETTINGS = {
  'residential': 240,    // 4 hours minimum
  'commercial': 480,     // 8 hours minimum
  'maintenance': 120,    // 2 hours minimum
  'emergency': 60        // 1 hour minimum
};
```

### Webhook Processing

#### Webhook Handler
```javascript
app.post('/api/webhooks/calendly', async (req, res) => {
  try {
    const signature = req.headers['calendly-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature, CALENDLY_WEBHOOK_KEY);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    await processCalendlyEvent(event);
    
    res.status(200).json({ status: 'processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

#### Event Processing
```javascript
const processCalendlyEvent = async (event) => {
  const { event: eventType, payload } = event;
  
  switch (eventType) {
    case 'invitee.created':
      await handleAppointmentCreated(payload);
      break;
      
    case 'invitee.canceled':
      await handleAppointmentCanceled(payload);
      break;
      
    case 'invitee.rescheduled':
      await handleAppointmentRescheduled(payload);
      break;
      
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
};
```

---

## Google Maps Integration

### Setup and Configuration

#### API Key Configuration
```javascript
// Multiple API keys for redundancy
const GOOGLE_MAPS_API_KEYS = [
  'AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k', // Primary
  'AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk', // Secondary
  'AIzaSyB6igIPyhIPudzvwD6LbmgrCkxuEXvbjJE'  // Backup
];

const getCurrentApiKey = () => {
  return process.env.GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEYS[0];
};
```

#### Map Initialization
```javascript
const initializeMap = (containerId, options = {}) => {
  const defaultOptions = {
    center: { lat: 39.9612, lng: -82.9988 }, // Reynoldsburg, OH
    zoom: 12,
    mapTypeId: 'roadmap',
    styles: [
      // Custom map styling
      {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [{ "color": "#f5f5f5" }]
      }
    ]
  };
  
  const map = new google.maps.Map(
    document.getElementById(containerId),
    { ...defaultOptions, ...options }
  );
  
  return map;
};
```

### Area Calculation Service

#### Drawing Tools Integration
```javascript
class AreaCalculator {
  constructor(map) {
    this.map = map;
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon']
      }
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.drawingManager.addListener('overlaycomplete', (event) => {
      if (event.type === 'polygon') {
        this.calculatePolygonArea(event.overlay);
      }
    });
  }
  
  calculatePolygonArea(polygon) {
    const path = polygon.getPath();
    const area = google.maps.geometry.spherical.computeArea(path);
    
    const areaData = {
      sqft: area * 10.7639, // Convert m² to ft²
      acres: area * 0.000247105, // Convert m² to acres
      sqm: area
    };
    
    this.onAreaCalculated(areaData);
  }
}
```

#### Address Geocoding
```javascript
const geocodeAddress = async (address) => {
  const geocoder = new google.maps.Geocoder();
  
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK') {
        resolve({
          coordinates: {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          },
          formattedAddress: results[0].formatted_address,
          components: results[0].address_components
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
};
```

### Service Area Verification

#### Distance Calculation
```javascript
const calculateServiceArea = async (customerAddress) => {
  const officeLocation = { lat: 39.9612, lng: -82.9988 };
  const customerLocation = await geocodeAddress(customerAddress);
  
  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(officeLocation.lat, officeLocation.lng),
    new google.maps.LatLng(customerLocation.coordinates.lat, customerLocation.coordinates.lng)
  );
  
  const distanceMiles = distance * 0.000621371; // Convert meters to miles
  
  let serviceLevel = 'none';
  let responseTime = 'not available';
  
  if (distanceMiles <= 15) {
    serviceLevel = 'primary';
    responseTime = 'same-day';
  } else if (distanceMiles <= 30) {
    serviceLevel = 'extended';
    responseTime = '48-hour';
  } else if (distanceMiles <= 50) {
    serviceLevel = 'specialty';
    responseTime = 'custom';
  }
  
  return {
    distance: distanceMiles,
    serviceLevel,
    responseTime,
    additionalFees: distanceMiles > 15
  };
};
```

---

## Payment Integration

### Stripe Integration

#### Configuration
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethods: ['card', 'ach_debit'],
  automaticPaymentMethods: { enabled: true }
};
```

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer {token}

{
  "amount": 8500,
  "currency": "usd",
  "estimateId": "est_12345",
  "customerEmail": "john@example.com"
}
```

**Response:**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdef",
  "paymentIntentId": "pi_1234567890",
  "amount": 8500,
  "status": "requires_payment_method"
}
```

#### Payment Webhook Handler
```javascript
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        handlePaymentFailure(event.data.object);
        break;
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## Webhook Management

### Webhook Security

#### Signature Verification
```javascript
const verifyWebhookSignature = (payload, signature, secret) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

#### Webhook Retry Logic
```javascript
const processWebhookWithRetry = async (webhookData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processWebhook(webhookData);
      return { success: true, attempt };
    } catch (error) {
      console.error(`Webhook processing attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Send to dead letter queue or alert system
        await alertService.sendWebhookFailureAlert(webhookData, error);
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

---

## Error Handling

### Standard Error Format
```json
{
  "error": {
    "code": "SCHEDULING_CONFLICT",
    "message": "The requested time slot conflicts with an existing appointment",
    "details": {
      "conflictingEventId": "event_123",
      "suggestedAlternatives": ["2024-07-16T10:00:00Z", "2024-07-16T14:00:00Z"]
    },
    "timestamp": "2024-07-15T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Codes

#### Authentication Errors
- `AUTH_TOKEN_MISSING`: No authorization token provided
- `AUTH_TOKEN_INVALID`: Token is invalid or expired
- `AUTH_INSUFFICIENT_PERMISSIONS`: User lacks required permissions

#### Validation Errors
- `VALIDATION_REQUIRED_FIELD`: Required field is missing
- `VALIDATION_INVALID_FORMAT`: Field format is invalid
- `VALIDATION_OUT_OF_RANGE`: Value is outside acceptable range

#### Business Logic Errors
- `SCHEDULING_CONFLICT`: Time slot already booked
- `SERVICE_AREA_NOT_COVERED`: Address outside service area
- `PAYMENT_PROCESSING_FAILED`: Payment could not be processed

#### External Service Errors
- `CALENDLY_API_ERROR`: Calendly service unavailable
- `MAPS_API_ERROR`: Google Maps service error
- `STRIPE_API_ERROR`: Payment processing service error

### Error Handling Examples

#### Client-Side Error Handling
```javascript
const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    
    switch (errorData.error.code) {
      case 'SCHEDULING_CONFLICT':
        showAlternativeTimeSlots(errorData.error.details.suggestedAlternatives);
        break;
      case 'SERVICE_AREA_NOT_COVERED':
        showServiceAreaMessage();
        break;
      default:
        showGenericErrorMessage(errorData.error.message);
    }
  }
};
```

---

## Rate Limiting

### Rate Limit Configuration
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

### Service-Specific Limits
```javascript
// Higher limits for admin operations
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5000,
  skip: (req) => req.user && req.user.role === 'administrator'
});

// Lower limits for public endpoints
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100
});
```

---

## SDK and Libraries

### JavaScript SDK Example
```javascript
class NeffPavingAPI {
  constructor(apiKey, baseUrl = 'https://api.neffpaving.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async createEstimate(estimateData) {
    const response = await fetch(`${this.baseUrl}/api/estimates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(estimateData)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async calculateArea(coordinates) {
    const response = await fetch(`${this.baseUrl}/api/maps/calculate-area`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates })
    });
    
    return response.json();
  }
}

// Usage
const api = new NeffPavingAPI('your-api-key');
const estimate = await api.createEstimate(estimateData);
```

### Testing and Development

#### API Testing
```bash
# Health check
curl http://localhost:8001/api/health

# Login test
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Area calculation test
curl -X POST http://localhost:8001/api/maps/calculate-area \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[{"lat":39.9612,"lng":-82.9988},{"lat":39.9622,"lng":-82.9988}]}'
```

---

## Best Practices

### API Design
1. **RESTful Design**: Follow REST conventions for resource naming
2. **Versioning**: Include API version in URL path
3. **Consistent Responses**: Use standard response formats
4. **Error Handling**: Provide meaningful error messages
5. **Documentation**: Keep API documentation up to date

### Integration Security
1. **API Key Management**: Rotate keys regularly
2. **Webhook Verification**: Always verify webhook signatures
3. **Rate Limiting**: Implement appropriate rate limits
4. **Input Validation**: Validate all input data
5. **HTTPS Only**: Use encrypted connections only

### Performance Optimization
1. **Caching**: Implement response caching where appropriate
2. **Pagination**: Use pagination for large data sets
3. **Compression**: Enable gzip compression
4. **Connection Pooling**: Use database connection pooling
5. **Monitoring**: Monitor API performance and errors

---

## Support and Resources

### Internal Support
- **API Issues**: api-support@neffpaving.com
- **Integration Help**: integrations@neffpaving.com
- **Emergency Support**: (555) 123-HELP

### External Documentation
- [Calendly API Documentation](https://developer.calendly.com/)
- [Google Maps API Documentation](https://developers.google.com/maps)
- [Stripe API Documentation](https://stripe.com/docs/api)

### Development Tools
- **Postman Collection**: Available for API testing
- **Swagger Documentation**: Interactive API explorer
- **SDK Libraries**: JavaScript, Python, PHP clients available

---

*Last Updated: 2024-07-15*  
*Version: 2.0*  
*Next Review: 2024-10-15*
