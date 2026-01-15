# Next Steps Checklist - Stripe Payment Integration

## ✅ What You've Completed

- [x] Backend server installed and running
- [x] Environment variables configured
- [x] Server running on port 3001

## 📋 What To Do Next

### Step 1: Update Database Schema ⏳

**Run the migration to add payment fields:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Open `food-saverr/stripe-payment-migration.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

**What this does:**
- Adds `stripe_payment_intent_id` to orders
- Adds `platform_fee` and `shop_amount` fields
- Adds `payment_status` field
- Creates indexes for faster lookups

**✅ Check when done:** Database has new payment fields

---

### Step 2: Verify Environment Variables ✅

**Check Mobile App `.env` (`food-saverr/.env`):**
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBMENT_API_URL=http://localhost:3001
```

**Check Backend Server `.env` (`food-saverr/server/.env`):**
```env
STRIPE_SECRET_KEY=sk_test_...
PORT=3001
```

**✅ Check when done:** Both files exist with correct keys

---

### Step 3: Test Backend Server ✅

**Your server is already running!** 

Test it:
- Open browser: http://localhost:3001
- Should see: `{"message": "FoodSaverr Payment API is running"}`

**✅ Check when done:** Server responds correctly

---

### Step 4: Build App with Native Modules 🚀

**Stripe requires native modules (not available in Expo Go)**

**Option A: EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
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

**⏳ This takes 10-30 minutes**

**✅ Check when done:** App built and installed on device/simulator

---

### Step 5: Test Payment Flow 🧪

**Once app is built:**

1. **Start backend server** (if not already running):
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
   - Select a bag → Tap "Retrieve Bag"
   - Go to payment screen
   - Click "Pay Now"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123` (any 3 digits)
   - Complete payment

4. **Verify:**
   - Payment succeeds
   - Order created in database
   - Order shows `platform_fee` and `shop_amount`
   - Split is 30/70

**✅ Check when done:** Payment works end-to-end

---

## 🎯 Current Status

### ✅ Ready
- Backend server running
- Environment variables set
- Payment code implemented

### ⏳ Next Actions
1. Run database migration (2 minutes)
2. Build app with native modules (10-30 minutes)
3. Test payment flow (5 minutes)

---

## 💰 How Split Payment Works

**Example: $100 surprise bag**

```
Customer Payment: $100.00
    ↓
Backend Calculates:
├─ Platform Fee (30%): $30.00 → FoodSaverr
└─ Shop Amount (70%):  $70.00 → Shop
    ↓
Order Created with:
├─ platform_fee: $30.00
└─ shop_amount: $70.00
```

**The split is automatic - no manual calculation needed!**

---

## 🚀 Quick Test (Without Building)

**You can test the backend API directly:**

```bash
# Test payment intent creation
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "bagId": "test-bag-id",
    "shopId": "test-shop-id",
    "customerId": "test-customer-id",
    "quantity": 1
  }'
```

**Expected response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 10000,
  "platformFee": 3000,
  "shopAmount": 7000
}
```

**✅ Check:** Split is calculated correctly (3000 = 30%, 7000 = 70%)

---

## 📚 Documentation

- **Complete Setup**: `STRIPE_COMPLETE_SETUP.md`
- **Quick Start**: `STRIPE_QUICK_START.md`
- **Payment Flow**: `STRIPE_PAYMENT_FLOW.md`
- **Environment Setup**: `ENV_SETUP_GUIDE.md`

---

## 🎉 You're Almost There!

**Next immediate step:** Run the database migration (Step 1 above)

Then build your app and test payments! 🚀
