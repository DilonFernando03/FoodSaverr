# Stripe Payment Setup - Quick Start

## 🚀 5-Minute Setup

### 1. Get Stripe Keys
- Go to https://dashboard.stripe.com
- Copy **Test Mode** keys from Developers > API keys

### 2. Backend Setup
```bash
cd food-saverr/server
npm install
```

Create `server/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
PORT=3001
```

Start server:
```bash
npm run dev
```

### 3. Database
- Go to Supabase Dashboard > SQL Editor
- Run `stripe-payment-migration.sql`

### 4. Mobile App
Create `food-saverr/.env`:
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
```

### 5. Build App
```bash
# Install EAS CLI
npm install -g eas-cli

# Build
eas build --profile development --platform ios
```

### 6. Test
- Use test card: `4242 4242 4242 4242`
- Payment automatically splits: 30% app, 70% shop

## 💰 Split Payment

**Example: $100 bag**
- Customer pays: $100
- App receives: $30 (30%)
- Shop receives: $70 (70%)

Calculated automatically in backend!

## 📚 Full Guide

See `STRIPE_COMPLETE_SETUP.md` for detailed instructions.
