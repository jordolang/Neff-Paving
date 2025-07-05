const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'; // Replace with your actual webhook secret

app.use(express.static('.'));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, customer, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: customer.email,
      metadata,
      description: 'Deposit Payment'
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Status Endpoint
app.get('/api/payment-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    res.json({
      status: paymentIntent.status,
      details: paymentIntent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for asynchronous events.
app.post('/api/webhook', bodyParser.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      break;
    case 'payment_intent.payment_failed':
      const paymentError = event.data.object;
      console.log(`Payment failed: ${paymentError.last_payment_error?.message}`);
      // Handle the payment failure!
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}`));
