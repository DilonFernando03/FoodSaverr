# Complete Stripe Payment Setup Guide - 30/70 Split

This guide will help you complete the Stripe payment integration with automatic split payments (30% to app, 70% to shop).

## ✅ What's Already Implemented

1. ✅ Backend Express server (`server/index.js`) with split payment logic
2. ✅ Payment service (`services/PaymentService.ts`) for API calls
3. ✅ Payment screen (`app/payment/[bagId].tsx`) with payment flow
4. ✅ Database migration (`stripe-payment-migration.sql`) for payment fields
5. ✅ Stripe React Native SDK installed

## 🎯 How Split Payment Works

When a customer buys a surprise bag for **$100**:
- **Total Payment**: $100 (customer pays this)
- **Platform Fee (30%)**: $30 → Goes to FoodSaverr
- **Shop Amount (70%)**: $70 → Goes to the shop

This is calculated automatically in the backend.

## 📋 Step-by-Step Setup

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Developers > API keys**
4. Copy:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Step 2: Set Up Backend Server

```bash
# Navigate to server directory
cd food-saverr/server

# Install dependencies
npm install

# Create .env file
# Windows PowerShell:
New-Item -Path .env -ItemType File

# Mac/Linux:
touch .env
```

Add to `server/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
PORT=3001
```

**Start the server:**
```bash
npm run dev
```

You should see: `Payment server running on port 3001`

### Step 3: Update Database

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Copy contents of `food-saverr/stripe-payment-migration.sql`
4. Paste and click **Run**

This adds payment tracking fields to your database.

### Step 4: Configure Mobile App

**Add environment variables:**

Create/update `food-saverr/.env`:
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
```

**For production**, update `EXPO_PUBLIC_PAYMENT_API_URL` to your deployed backend URL.

### Step 5: Build App with Native Modules

Stripe React Native requires native modules. You need a development build:

**Option A: EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS
eas build --profile development --platform ios

# Or Android
eas build --profile development --platform android
```

**Option B: Expo Prebuild**
```bash
cd food-saverr
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

### Step 6: Test Payment Flow

1. **Start backend server:**
   ```bash
   cd food-saverr/server
   npm run dev
   ```

2. **Start mobile app:**
   ```bash
   cd food-saverr
   npm start
   ```

3. **Test payment:**
   - Log in as customer
   - Browse surprise bags
   - Select a bag → Go to payment
   - Click "Pay Now"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)

## 💰 How Money Flow Works

### Current Implementation (Simple Split)

1. **Customer pays** → Full amount goes to your Stripe account
2. **Platform keeps** → 30% automatically calculated
3. **Shop receives** → 70% (you'll transfer manually or via Stripe Connect)

### Future Enhancement: Stripe Connect (Automatic Transfers)

For automatic transfers to shops, you'll need Stripe Connect:

1. Shops create Stripe Connect accounts
2. When payment succeeds, Stripe automatically:
   - Keeps 30% in your account
   - Transfers 70% to shop's account
3. No manual transfers needed

## 🔧 Payment Flow Explained

```
1. Customer clicks "Pay Now"
   ↓
2. App calls: POST /api/create-payment-intent
   - Calculates: 30% platform fee, 70% shop amount
   - Creates Stripe Payment Intent
   ↓
3. Stripe Payment Sheet appears
   - Customer enters card details
   ↓
4. Payment processed by Stripe
   ↓
5. App calls: POST /api/confirm-payment
   - Verifies payment succeeded
   - Creates order in database
   - Stores payment info (fees, amounts)
   ↓
6. Order created with:
   - stripe_payment_intent_id
   - platform_fee: $30
   - shop_amount: $70
   - payment_status: 'succeeded'
```

## 📊 Database Fields Added

The migration adds these fields to `bag_orders`:

- `stripe_payment_intent_id` - Stripe payment ID
- `stripe_charge_id` - Stripe charge ID
- `payment_status` - Payment status
- `platform_fee` - 30% fee amount
- `shop_amount` - 70% shop amount
- `payment_method` - Payment method used

## 🚀 Deploy Backend Server

For production, deploy your backend server:

**Option 1: Vercel**
```bash
cd food-saverr/server
vercel
```

**Option 2: Railway**
- Connect GitHub repo
- Set root directory to `food-saverr/server`
- Add environment variables
- Deploy

**Option 3: Render**
- Create Web Service
- Connect repo
- Set build: `npm install`
- Set start: `npm start`
- Add environment variables

**Update mobile app:**
Change `EXPO_PUBLIC_PAYMENT_API_URL` to your deployed backend URL.

## ✅ Verification Checklist

- [ ] Stripe account created
- [ ] Stripe keys obtained (test mode)
- [ ] Backend server running (`npm run dev`)
- [ ] Database migration run
- [ ] Environment variables set in app
- [ ] App built with native modules (EAS Build)
- [ ] Payment flow tested with test card
- [ ] Order created in database with payment info
- [ ] Split amounts calculated correctly (30/70)

## 🐛 Troubleshooting

**Backend won't start?**
- Check Node.js is installed
- Verify `.env` file exists
- Check port 3001 isn't in use

**Payment fails?**
- Verify backend is running
- Check API URL in app is correct
- Verify Stripe keys are correct
- Check backend logs for errors

**Stripe not available?**
- App needs development build (not Expo Go)
- Use EAS Build or Expo Prebuild
- Verify Stripe publishable key is set

## 📚 Next Steps

1. **Complete setup** using steps above
2. **Test payments** with test cards
3. **Deploy backend** to production
4. **Set up Stripe Connect** (optional, for automatic shop payouts)
5. **Switch to live mode** when ready for production

## 💡 Important Notes

- **Test Mode**: Use test cards, no real money charged
- **Live Mode**: Switch when ready, requires live keys
- **Split Calculation**: Happens automatically in backend
- **Shop Payouts**: Currently manual, can automate with Stripe Connect
- **Security**: Never commit Stripe keys to git

Your payment system is ready! Follow the steps above to complete the setup. 🎉
