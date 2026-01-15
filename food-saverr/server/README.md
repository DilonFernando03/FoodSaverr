# FoodSaverr Payment Server

Express.js backend server for handling Stripe payments with split payment functionality (30% platform, 70% shop).

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Stripe keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Add your webhook secret (after setting up webhooks)

3. **Get Stripe Keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to Developers > API keys
   - Copy your **Publishable key** and **Secret key**
   - For testing, use test mode keys (start with `pk_test_` and `sk_test_`)

4. **Set up Webhooks (for production):**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret to `.env`

5. **Run the server:**
   ```bash
   npm run dev  # Development mode with auto-reload
   # or
   npm start    # Production mode
   ```

## API Endpoints

### POST `/api/create-payment-intent`
Creates a Stripe Payment Intent for a purchase with automatic 30/70 split calculation.

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "usd",
  "bagId": "bag-uuid",
  "shopId": "shop-uuid",
  "customerId": "customer-uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 10000,
  "platformFee": 3000,
  "shopAmount": 7000
}
```

**Split Calculation:**
- Total: $100.00 (10000 cents)
- Platform Fee (30%): $30.00 (3000 cents) → FoodSaverr
- Shop Amount (70%): $70.00 (7000 cents) → Shop

### POST `/api/confirm-payment`
Confirms a payment after it's been processed.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx",
  "bagId": "bag-uuid",
  "shopId": "shop-uuid",
  "customerId": "customer-uuid",
  "quantity": 1
}
```

### POST `/api/webhook`
Stripe webhook endpoint for payment events.

## Payment Flow

1. Client calls `/api/create-payment-intent` with order details
2. Server creates Payment Intent with 30% platform fee
3. Client uses Stripe React Native SDK to confirm payment
4. Client calls `/api/confirm-payment` to finalize order
5. Server processes the split payment (30% platform, 70% shop)

## Deployment

For production, deploy this server to:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean
- Or any Node.js hosting service

Make sure to:
- Set environment variables in your hosting platform
- Update `API_URL` in the mobile app to point to your deployed server
- Set up webhooks in Stripe Dashboard pointing to your production URL



