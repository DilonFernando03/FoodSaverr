# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe payments for FoodSaverr with split payment functionality (30% platform fee, 70% to shop).

## Overview

The payment system consists of:
1. **Backend Server** (Express.js) - Handles payment processing and split payments
2. **Mobile App** (React Native) - Integrates Stripe React Native SDK for payment UI
3. **Database** - Stores payment and order information

## Prerequisites

- A Stripe account (create one at https://dashboard.stripe.com/register)
- Node.js installed on your machine
- Your FoodSaverr app running

## Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Navigate to **Developers > API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

⚠️ **Important**: Use test keys for development. For production, switch to live mode and use live keys.

## Step 2: Set Up Backend Server

### 2.1 Install Dependencies

```bash
cd food-saverr/server
npm install
```

### 2.2 Configure Environment Variables

1. Create a `.env` file in the `server` directory:

```bash
cd food-saverr/server
# Copy the example file
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

2. Edit `.env` and add your Stripe keys:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
API_URL=http://localhost:3001
```

### 2.3 Start the Server

```bash
npm run dev
```

The server should start on `http://localhost:3001`

## Step 3: Update Database Schema

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `stripe-payment-migration.sql`
4. Click **Run** to execute the migration

This adds the following fields:
- `stripe_account_id` to `shop_profiles` (for future Stripe Connect integration)
- Payment fields to `bag_orders` (payment intent ID, charge ID, fees, etc.)

## Step 4: Configure Mobile App

### 4.1 Add Environment Variables

Add your Stripe publishable key to your app's environment:

**Option A: Using `.env` file (Recommended)**

Create or update `.env` in the `food-saverr` directory:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
```

**Option B: Using `app.config.js`**

Update `food-saverr/app.config.js`:

```javascript
export default {
  // ... existing config
  extra: {
    stripePublishableKey: 'pk_test_your_publishable_key_here',
    paymentApiUrl: 'http://localhost:3001',
  },
};
```

### 4.2 Update API URL for Production

When deploying your backend server, update the API URL:

- For local development: `http://localhost:3001`
- For production: `https://your-backend-domain.com`

Update this in:
- `.env` file: `EXPO_PUBLIC_PAYMENT_API_URL`
- Or `app.config.js`: `extra.paymentApiUrl`

## Step 5: Test the Integration

### 5.1 Test Payment Flow

1. Start your backend server:
   ```bash
   cd food-saverr/server
   npm run dev
   ```

2. Start your mobile app:
   ```bash
   cd food-saverr
   npm start
   ```

3. In the app:
   - Log in as a customer
   - Browse surprise bags
   - Select a bag and go to payment
   - Click "Pay Now"

4. Use Stripe test card:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

### 5.2 Verify Payment Split

After a successful payment:
1. Check Stripe Dashboard > Payments
2. Verify the payment was created
3. Check your database - the order should have:
   - `stripe_payment_intent_id`
   - `platform_fee` (30% of total)
   - `shop_amount` (70% of total)
   - `payment_status` = 'succeeded'

## Step 6: Set Up Webhooks (For Production)

Webhooks allow Stripe to notify your server about payment events.

### 6.1 Install Stripe CLI (Optional, for local testing)

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhook
```

### 6.2 Set Up Production Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click **Add endpoint**
3. Enter your production URL: `https://your-backend-domain.com/api/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add it to your production `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 7: Deploy Backend Server

Deploy your backend server to a hosting service:

### Option A: Heroku

```bash
cd food-saverr/server
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
git push heroku main
```

### Option B: Railway

1. Connect your GitHub repo
2. Set root directory to `food-saverr/server`
3. Add environment variables in Railway dashboard
4. Deploy

### Option C: Render

1. Create a new Web Service
2. Connect your repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

## Step 8: Switch to Production Mode

### 8.1 Get Live Stripe Keys

1. In Stripe Dashboard, toggle to **Live Mode**
2. Get your live keys from Developers > API keys
3. Update your backend `.env` with live keys
4. Update your mobile app with live publishable key

### 8.2 Update Mobile App

Update the publishable key in your app configuration to use the live key.

## Payment Flow Explanation

1. **Customer initiates payment** → App calls `/api/create-payment-intent`
2. **Backend creates Payment Intent** → Calculates 30% platform fee, 70% shop amount
3. **Stripe Payment Sheet** → Customer enters card details
4. **Payment processed** → Stripe handles the payment
5. **Order created** → App creates order in database with payment info
6. **Payment confirmed** → Backend confirms payment and processes split

## Split Payment Details

- **Total Amount**: Customer pays full amount (e.g., $100)
- **Platform Fee**: 30% goes to FoodSaverr (e.g., $30)
- **Shop Amount**: 70% goes to the shop (e.g., $70)

The split is calculated automatically in the backend when creating the payment intent.

## Troubleshooting

### Payment fails to initialize

- Check that backend server is running
- Verify `EXPO_PUBLIC_PAYMENT_API_URL` is correct
- Check backend logs for errors

### Stripe not initialized

- Verify `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check app logs for initialization errors
- Make sure StripeProvider is in your app layout

### Payment succeeds but order not created

- Check database connection
- Verify user is logged in
- Check backend logs for order creation errors

### Webhook not working

- Verify webhook secret is correct
- Check that webhook endpoint is accessible
- Test with Stripe CLI first

## Next Steps

1. **Stripe Connect** (Optional): Set up connected accounts so shops can receive payments directly
2. **Refunds**: Implement refund functionality
3. **Payment Methods**: Allow customers to save payment methods
4. **Subscriptions**: If you plan to add subscription features

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Native SDK](https://stripe.dev/stripe-react-native/)
- [Stripe Support](https://support.stripe.com/)

## Security Notes

⚠️ **Never commit your secret keys to version control!**

- Always use `.env` files (which should be in `.gitignore`)
- Use test keys for development
- Use environment variables in production hosting
- Regularly rotate your API keys
- Monitor your Stripe dashboard for suspicious activity



