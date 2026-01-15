# Environment Variables Setup Guide

You need **two separate `.env` files** in different locations. Here's exactly what goes in each:

## 📱 Mobile App `.env` File

**Location:** `food-saverr/.env`

**Contents:**
```env
# Stripe Configuration (for mobile app)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Payment API URL (backend server)
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001

# Supabase Configuration (if not already set)
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to get values:**
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe Dashboard > Developers > API keys > Publishable key (starts with `pk_test_`)
- `EXPO_PUBLIC_PAYMENT_API_URL`: 
  - Development: `http://localhost:3001`
  - Production: `https://your-backend-domain.com`

---

## 🖥️ Backend Server `.env` File

**Location:** `food-saverr/server/.env`

**Contents:**
```env
# Stripe Configuration (for backend server)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Server Configuration
PORT=3001

# Webhook Secret (optional, for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (optional - for backend to create orders)
SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API URL (for reference)
API_URL=http://localhost:3001
```

**Where to get values:**
- `STRIPE_SECRET_KEY`: Stripe Dashboard > Developers > API keys > Secret key (starts with `sk_test_`)
- `STRIPE_PUBLISHABLE_KEY`: Same as mobile app (starts with `pk_test_`)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard > Settings > API > service_role key (optional)

---

## 📋 Quick Setup Checklist

### Mobile App (`food-saverr/.env`)
- [ ] Create `.env` file in `food-saverr/` directory
- [ ] Add Stripe publishable key
- [ ] Add payment API URL
- [ ] Add Supabase keys (if needed)

### Backend Server (`food-saverr/server/.env`)
- [ ] Create `.env` file in `food-saverr/server/` directory
- [ ] Add Stripe secret key
- [ ] Add Stripe publishable key
- [ ] Set PORT=3001
- [ ] Add Supabase service role key (optional)

---

## 🔑 Key Differences

| Variable | Mobile App | Backend Server | Notes |
|----------|------------|----------------|-------|
| Stripe Publishable Key | ✅ Required | ✅ Optional | Same key for both |
| Stripe Secret Key | ❌ Never | ✅ Required | **Never put in mobile app!** |
| Payment API URL | ✅ Required | ❌ Not needed | Points to backend |
| Supabase Anon Key | ✅ Required | ❌ Not needed | For mobile app |
| Supabase Service Key | ❌ Never | ✅ Optional | **Never put in mobile app!** |

---

## ⚠️ Security Notes

### ✅ Safe for Mobile App (`.env` in `food-saverr/`)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Safe, public key
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Safe, public key
- `EXPO_PUBLIC_PAYMENT_API_URL` - Safe, public URL

### 🔒 Never in Mobile App
- `STRIPE_SECRET_KEY` - **Secret!** Only in backend
- `SUPABASE_SERVICE_ROLE_KEY` - **Secret!** Only in backend

### ✅ Safe for Backend Server (`.env` in `food-saverr/server/`)
- All keys are safe here (server-side only)

---

## 📝 Example Files

### `food-saverr/.env`
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbC123...
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `food-saverr/server/.env`
```env
STRIPE_SECRET_KEY=sk_test_51XyZ789...
STRIPE_PUBLISHABLE_KEY=pk_test_51AbC123...
PORT=3001
SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 After Setup

1. **Restart mobile app** - Changes to `.env` require app restart
2. **Restart backend server** - Changes to `.env` require server restart
3. **Verify** - Check that both are using correct values

---

## 🐛 Troubleshooting

**Mobile app can't connect to backend?**
- Check `EXPO_PUBLIC_PAYMENT_API_URL` is correct
- Verify backend server is running
- Check firewall/network settings

**Backend can't process payments?**
- Check `STRIPE_SECRET_KEY` is correct
- Verify key starts with `sk_test_` (test mode) or `sk_live_` (live mode)
- Check Stripe Dashboard for errors

**Both files created?**
- Mobile app: `food-saverr/.env`
- Backend: `food-saverr/server/.env`

Make sure both `.env` files exist and have the correct values! 🎉
