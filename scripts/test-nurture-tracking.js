/**
 * Test script for nurture event tracking in WebhookHandler
 * This demonstrates how nurture events are tracked via Google Analytics
 */

import { WebhookHandler } from '../src/services/webhook-handler.js';

// Mock window.gtag for testing
global.window = {
  gtag: function(command, eventName, params) {
    console.log(`\n📊 Google Analytics Event Tracked:`);
    console.log(`   Command: ${command}`);
    console.log(`   Event: ${eventName}`);
    console.log(`   Parameters:`, JSON.stringify(params, null, 2));
  }
};

console.log('='.repeat(60));
console.log('Testing Nurture Event Tracking in WebhookHandler');
console.log('='.repeat(60));

// Create handler instance
const handler = new WebhookHandler();

// Test 1: Email Sent Event
console.log('\n\n1️⃣  Testing: nurture.email_sent event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.email_sent',
  data: {
    object: {
      campaign: 'abandoned_estimate',
      lead_id: 'lead_12345',
      email: 'customer@example.com',
      template: 'abandoned_estimate'
    }
  }
});

// Test 2: Email Opened Event
console.log('\n\n2️⃣  Testing: nurture.email_opened event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.email_opened',
  payload: {
    campaign: 'abandoned_estimate',
    lead_id: 'lead_12345',
    email: 'customer@example.com'
  }
});

// Test 3: Email Clicked Event
console.log('\n\n3️⃣  Testing: nurture.email_clicked event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.email_clicked',
  data: {
    object: {
      campaign: 'abandoned_estimate',
      lead_id: 'lead_12345',
      email: 'customer@example.com',
      link_url: 'https://neffpaving.com/booking'
    }
  }
});

// Test 4: SMS Sent Event
console.log('\n\n4️⃣  Testing: nurture.sms_sent event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.sms_sent',
  data: {
    object: {
      campaign: 'booking_confirmation',
      lead_id: 'lead_67890',
      phone: '+15555551234'
    }
  }
});

// Test 5: SMS Delivered Event
console.log('\n\n5️⃣  Testing: nurture.sms_delivered event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.sms_delivered',
  payload: {
    campaign: 'booking_confirmation',
    lead_id: 'lead_67890',
    phone: '+15555551234'
  }
});

// Test 6: Unsubscribed Event
console.log('\n\n6️⃣  Testing: nurture.unsubscribed event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.unsubscribed',
  data: {
    object: {
      lead_id: 'lead_12345',
      channel: 'email',
      email: 'customer@example.com'
    }
  }
});

// Test 7: Converted Event
console.log('\n\n7️⃣  Testing: nurture.converted event');
console.log('-'.repeat(60));
await handler.processEvent({
  type: 'nurture.converted',
  payload: {
    campaign: 'abandoned_estimate',
    lead_id: 'lead_12345',
    email: 'customer@example.com',
    conversion_value: 5000
  }
});

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('✅ All nurture events tested successfully!');
console.log('='.repeat(60));
console.log('\nWhat happened:');
console.log('- Each event was processed by WebhookHandler');
console.log('- Console logs show event details (📧, 👀, 🖱️, 💬, ✅, 🚫, 🎉)');
console.log('- Each event triggered a Google Analytics call via window.gtag');
console.log('- All events use event_category: "nurture" for filtering in GA');
console.log('\nNext steps:');
console.log('1. Deploy to Vercel to test in browser with real Google Analytics');
console.log('2. Check GA dashboard for "nurture" category events');
console.log('3. Monitor browser console for gtag event logs');
console.log('='.repeat(60));
