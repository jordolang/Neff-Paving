// Analytics Configuration - Funnel tracking events and metadata
// This configuration defines all tracked events in the estimate-to-booking funnel

/**
 * Funnel stage event definitions
 * Each event represents a key milestone in the customer journey
 */
export const FUNNEL_EVENTS = {
  // Stage 1: User lands on a page
  PAGE_VISIT: {
    name: 'page_visit',
    description: 'User lands on homepage or estimate page',
    category: 'engagement',
    properties: ['page_url', 'referrer', 'timestamp']
  },

  // Stage 2: User begins estimate process
  ESTIMATE_STARTED: {
    name: 'estimate_started',
    description: 'User begins interacting with estimate form',
    category: 'conversion',
    properties: ['form_id', 'first_field', 'timestamp']
  },

  // Stage 3: User completes area measurement
  AREA_MEASURED: {
    name: 'area_measured',
    description: 'User completes area measurement on map',
    category: 'conversion',
    properties: ['square_feet', 'measurement_type', 'timestamp']
  },

  // Stage 4: User submits complete estimate
  ESTIMATE_SUBMITTED: {
    name: 'estimate_submitted',
    description: 'User submits completed estimate form',
    category: 'conversion',
    properties: ['service_type', 'square_feet', 'contact_method', 'timestamp']
  },

  // Stage 5: User books consultation
  CONSULTATION_BOOKED: {
    name: 'consultation_booked',
    description: 'User schedules Calendly appointment',
    category: 'conversion',
    properties: ['appointment_time', 'service_type', 'timestamp']
  },

  // Stage 6: User completes payment
  PAYMENT_COMPLETE: {
    name: 'payment_complete',
    description: 'User completes Stripe payment',
    category: 'revenue',
    properties: ['amount', 'currency', 'service_type', 'timestamp']
  }
};

/**
 * Ordered list of funnel stages for sequential analysis
 */
export const FUNNEL_STAGES = [
  'page_visit',
  'estimate_started',
  'area_measured',
  'estimate_submitted',
  'consultation_booked',
  'payment_complete'
];

/**
 * Event categories for grouping and filtering
 */
export const EVENT_CATEGORIES = {
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  REVENUE: 'revenue'
};

/**
 * Privacy-safe properties that can be tracked
 * These do NOT include PII (names, emails, addresses, phone numbers)
 */
export const ALLOWED_PROPERTIES = [
  'page_url',
  'referrer',
  'timestamp',
  'form_id',
  'first_field',
  'square_feet',
  'measurement_type',
  'service_type',
  'contact_method',
  'appointment_time',
  'amount',
  'currency'
];

/**
 * Properties that should NEVER be tracked (PII protection)
 */
export const BLOCKED_PROPERTIES = [
  'email',
  'firstName',
  'lastName',
  'phone',
  'address',
  'name',
  'personalInfo'
];

/**
 * Configuration for Vercel Analytics
 */
export const ANALYTICS_CONFIG = {
  enabled: true,
  debug: false, // Set to true during development to see console logs
  beforeSend: null // Optional: transform event data before sending
};
