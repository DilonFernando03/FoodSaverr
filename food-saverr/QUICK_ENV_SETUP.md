# Quick Environment Variables Setup

## Two `.env` Files Needed

### 1. Mobile App `.env`
**Location:** `food-saverr/.env`

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
```

### 2. Backend Server `.env`
**Location:** `food-saverr/server/.env`

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
PORT=3001
```

## Quick Setup

### Mobile App
```bash
cd food-saverr
# Copy example file
cp .env.example .env
# Edit .env and add your Stripe publishable key
```

### Backend Server
```bash
cd food-saverr/server
# Copy example file
cp .env.example .env
# Edit .env and add your Stripe secret key
```

## Get Your Stripe Keys

1. Go to https://dashboard.stripe.com
2. Developers > API keys
3. Copy:
   - **Publishable key** → Goes in mobile app `.env`
   - **Secret key** → Goes in server `.env`

## Important

- ✅ **Publishable key** (`pk_test_...`) → Safe for mobile app
- 🔒 **Secret key** (`sk_test_...`) → **ONLY** in backend server, never in mobile app!

See `ENV_SETUP_GUIDE.md` for complete details.
