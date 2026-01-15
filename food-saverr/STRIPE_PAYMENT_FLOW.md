# Stripe Payment Flow - Complete Guide

## 💰 How Split Payment Works

### Example: Customer buys a $100 surprise bag

```
Customer Payment: $100.00
    ↓
Stripe Processes Payment
    ↓
┌─────────────────────────────────┐
│ Payment Split (Automatic)       │
├─────────────────────────────────┤
│ Platform Fee (30%):  $30.00    │ → FoodSaverr account
│ Shop Amount (70%):    $70.00    │ → Shop (manual transfer)
└─────────────────────────────────┘
```

**The split is calculated automatically in the backend server.**

## 🔄 Complete Payment Flow

### Step 1: Customer Initiates Payment
- Customer selects bag and quantity
- Clicks "Pay Now" button
- App calls: `POST /api/create-payment-intent`

### Step 2: Backend Creates Payment Intent
```javascript
// Backend calculates split automatically:
Total: $100.00
Platform Fee (30%): $30.00
Shop Amount (70%): $70.00

// Creates Stripe Payment Intent with metadata
```

### Step 3: Stripe Payment Sheet
- Stripe payment sheet appears
- Customer enters card details
- Payment processed by Stripe

### Step 4: Payment Confirmation
- App calls: `POST /api/confirm-payment`
- Backend verifies payment succeeded
- Returns payment details

### Step 5: Order Creation
- App creates order in Supabase database
- Stores payment information:
  - `stripe_payment_intent_id`
  - `platform_fee`: $30.00
  - `shop_amount`: $70.00
  - `payment_status`: 'succeeded'

### Step 6: Money Distribution
- **Immediate**: Full $100 goes to your Stripe account
- **Platform keeps**: $30 (30%)
- **Shop receives**: $70 (70%) - transfer manually or via Stripe Connect

## 📋 Setup Checklist

### ✅ Backend Server
- [ ] Install dependencies: `cd server && npm install`
- [ ] Create `server/.env` with Stripe secret key
- [ ] Start server: `npm run dev`
- [ ] Verify server running on port 3001

### ✅ Database
- [ ] Run `stripe-payment-migration.sql` in Supabase
- [ ] Verify new payment fields added to `bag_orders`

### ✅ Mobile App
- [ ] Add Stripe publishable key to `.env`
- [ ] Set `EXPO_PUBLIC_PAYMENT_API_URL`
- [ ] Build app with native modules (EAS Build)

### ✅ Stripe Account
- [ ] Create Stripe account
- [ ] Get test mode API keys
- [ ] Verify account setup complete

## 🧪 Testing

### Test Card (Stripe Test Mode)
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

### Test Flow
1. Start backend: `cd server && npm run dev`
2. Start app: `cd food-saverr && npm start`
3. Log in as customer
4. Select a bag → Payment screen
5. Click "Pay Now"
6. Enter test card details
7. Complete payment
8. Verify order created in database

## 📊 Where Money Goes

### Current Setup (Simple)
1. **Customer pays** → Full amount to your Stripe account
2. **You keep** → 30% (platform fee)
3. **You transfer** → 70% to shop (manually)

### Future: Stripe Connect (Automatic)
1. **Shops create** Stripe Connect accounts
2. **Customer pays** → Full amount to your account
3. **Stripe automatically**:
   - Keeps 30% in your account
   - Transfers 70% to shop's account
4. **No manual transfers** needed!

## 🔧 Backend API Endpoints

### POST `/api/create-payment-intent`
Creates payment intent with split calculation.

**Request:**
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

### POST `/api/confirm-payment`
Confirms payment after processing.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "bagId": "bag-uuid",
  "shopId": "shop-uuid",
  "customerId": "customer-uuid",
  "quantity": 1
}
```

## 💡 Important Notes

1. **Split is automatic** - Calculated in backend, no manual math needed
2. **Test mode** - Use test cards, no real money
3. **Production** - Switch to live keys when ready
4. **Shop payouts** - Currently manual, can automate with Stripe Connect
5. **Security** - Never commit Stripe keys to git

## 🚀 Quick Start

See `STRIPE_QUICK_START.md` for 5-minute setup guide.

## 📚 Full Documentation

See `STRIPE_COMPLETE_SETUP.md` for detailed instructions.

Your payment system is ready! The 30/70 split happens automatically. 🎉
