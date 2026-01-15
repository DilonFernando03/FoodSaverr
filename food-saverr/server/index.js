const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createOrderInDatabase } = require('./supabase-config');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb', extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'FoodSaverr Payment API is running' });
});

/**
 * Create Payment Intent with split payment
 * 30% to platform, 70% to shop
 */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', bagId, shopId, customerId, quantity } = req.body;

    // Validate required fields
    if (!amount || !bagId || !shopId || !customerId) {
      return res.status(400).json({
        error: 'Missing required fields: amount, bagId, shopId, customerId',
      });
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Calculate split: 30% platform fee, 70% to shop
    const platformFee = Math.round(amountInCents * 0.30);
    const shopAmount = amountInCents - platformFee;

    console.log(`Payment split calculation:
      Total: $${(amountInCents / 100).toFixed(2)}
      Platform (30%): $${(platformFee / 100).toFixed(2)}
      Shop (70%): $${(shopAmount / 100).toFixed(2)}`);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        bagId,
        shopId,
        customerId,
        quantity: quantity?.toString() || '1',
        platformFee: platformFee.toString(),
        shopAmount: shopAmount.toString(),
        totalAmount: amountInCents.toString(),
      },
      // Note: application_fee_amount requires Stripe Connect
      // For now, we'll handle the split manually:
      // - Full amount goes to your Stripe account
      // - You keep 30% (platform fee)
      // - Transfer 70% to shop (manually or via Stripe Connect later)
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      platformFee,
      shopAmount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment intent',
    });
  }
});

/**
 * Confirm payment and create order
 * This endpoint should be called after payment is confirmed
 */
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, bagId, shopId, customerId, quantity } = req.body;

    if (!paymentIntentId || !bagId || !shopId || !customerId) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Retrieve payment intent to verify it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: `Payment not successful. Status: ${paymentIntent.status}`,
      });
    }

    // Extract metadata (use values from metadata as source of truth, or fallback to request body)
    const metadata = paymentIntent.metadata;
    const orderBagId = metadata.bagId || bagId;
    const orderShopId = metadata.shopId || shopId;
    const orderCustomerId = metadata.customerId || customerId;
    const orderQuantity = metadata.quantity || quantity?.toString() || '1';
    const platformFee = metadata.platformFee || '0';
    const shopAmount = metadata.shopAmount || '0';
    const totalAmount = metadata.totalAmount || paymentIntent.amount.toString();

    // Optional: Create order in database from backend
    // (Currently the mobile app creates the order, but this provides an alternative)
    if (createOrderInDatabase) {
      const orderResult = await createOrderInDatabase({
        bagId: orderBagId,
        customerId: orderCustomerId,
        quantity: parseInt(orderQuantity),
        totalPrice: parseFloat(totalAmount) / 100,
        paymentIntentId: paymentIntent.id,
        platformFee: parseFloat(platformFee) / 100,
        shopAmount: parseFloat(shopAmount) / 100,
      });

      if (orderResult.error) {
        console.error('Error creating order in database:', orderResult.error);
        // Don't fail the payment confirmation, just log the error
        // The mobile app will create the order as a fallback
      } else {
        console.log('Order created in database:', orderResult.data?.id);
      }
    }

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        platformFee: parseInt(platformFee || '0'),
        shopAmount: parseInt(shopAmount || '0'),
      },
      message: 'Payment confirmed successfully',
      orderCreated: !!createOrderInDatabase,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to confirm payment',
    });
  }
});

/**
 * Webhook endpoint for Stripe events
 * This handles payment status updates from Stripe
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Update order status in your database
      // You can add your database update logic here
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
});



