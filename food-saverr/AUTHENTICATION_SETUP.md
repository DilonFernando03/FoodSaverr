# Authentication Setup - FoodSaverr

## ✅ What Was Fixed

Your app's authentication system has been updated to use **real Supabase authentication** instead of the mocked system. Here's what changed:

### 1. AuthContext Integration
- Updated `contexts/AuthContext.tsx` to use Supabase client
- Integrated with `@supabase/supabase-js` for real authentication
- Added session persistence with AsyncStorage
- Implemented automatic session refresh

### 2. Demo Login Enhancement
- Demo buttons now **automatically submit** the login form
- No need to manually click "Sign In" after clicking a demo button
- Instant one-click demo access

### 3. Environment Configuration
- Fixed `.env` template to use `EXPO_PUBLIC_` prefix (required for Expo)
- Added proper Supabase credentials configuration

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Add Service Role Key to `.env`**
   ```bash
   cd food-saverr
   ```
   
   Edit your `.env` file and add:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   
   Get the key from: [Supabase Dashboard](https://app.supabase.com) > Your Project > Settings > API > `service_role` key

2. **Run the setup script**
   ```bash
   npm run create-demo-accounts
   ```

3. **Start the app**
   ```bash
   npm start
   ```

That's it! The demo accounts are ready to use.

### Option 2: Manual Setup

If you prefer manual setup or the script doesn't work:

1. **Create Auth Users in Supabase Dashboard**
   - Go to Authentication > Users
   - Create two users:
     - Email: `customer@demo.com`, Password: `demo123`, Auto-confirm: ✅
     - Email: `shop@demo.com`, Password: `demo123`, Auto-confirm: ✅
   - Copy each user's UUID

2. **Run SQL Script**
   - Open `demo-accounts.sql`
   - Replace `'demo-customer-uuid'` and `'demo-shop-uuid'` with actual UUIDs
   - Run the updated SQL in Supabase SQL Editor

3. **Start the app**
   ```bash
   npm start
   ```

See [DEMO_ACCOUNTS_SETUP.md](./DEMO_ACCOUNTS_SETUP.md) for detailed manual setup instructions.

## 📱 Using Demo Accounts

### In the App

1. Navigate to the login screen
2. Click one of the demo buttons:
   - **Customer Demo** - Access customer features
   - **Shop Demo** - Access shop owner features
3. The app will automatically log you in!

### Demo Account Details

#### Customer Account
- **Email**: `customer@demo.com`
- **Password**: `demo123`
- **Features**: Browse bags, place orders, manage favorites

#### Shop Account
- **Email**: `shop@demo.com`
- **Password**: `demo123`
- **Features**: Create bags, manage orders, view analytics

## 🔧 Technical Details

### Authentication Flow

```
Login Button Click
    ↓
AuthContext.login()
    ↓
Supabase Auth (signInWithPassword)
    ↓
Fetch User Profile (users + customer_profiles/shop_profiles)
    ↓
Convert to App User Type
    ↓
Store in AsyncStorage
    ↓
Update Auth State
    ↓
Navigate to Dashboard
```

### Files Modified

- ✅ `contexts/AuthContext.tsx` - Integrated Supabase authentication
- ✅ `app/auth/login.tsx` - Auto-submit on demo button click
- ✅ `env.template` - Fixed environment variable naming
- ✅ `package.json` - Added `create-demo-accounts` script

### Files Created

- 📄 `demo-accounts.sql` - SQL script for manual setup
- 📄 `scripts/create-demo-accounts.js` - Automated setup script
- 📄 `DEMO_ACCOUNTS_SETUP.md` - Detailed setup guide
- 📄 `AUTHENTICATION_SETUP.md` - This file

## 🔐 Security Notes

### Environment Variables

Your `.env` file should contain:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Only for create-demo-accounts script
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important**:
- The `.env` file is gitignored - never commit it
- The `ANON_KEY` is safe to use in the app (public key)
- The `SERVICE_ROLE_KEY` should NEVER be in client-side code
- The service role key is only used in the Node.js setup script

### Fallback Credentials

The app has fallback credentials hardcoded in `lib/supabase.ts`:
- This ensures the app works even without a `.env` file
- Only use this for development
- In production, always use environment variables

## 🐛 Troubleshooting

### "Invalid login credentials"

**Cause**: Demo accounts don't exist in Supabase yet

**Solution**:
1. Run `npm run create-demo-accounts`, OR
2. Follow manual setup in `DEMO_ACCOUNTS_SETUP.md`

### "Failed to load user profile"

**Cause**: Auth user exists but profile data is missing

**Solution**:
1. Check if `users` table has the user record
2. Verify `customer_profiles` or `shop_profiles` table has matching ID
3. Re-run the `demo-accounts.sql` script

### Demo button does nothing

**Cause**: JavaScript error or network issue

**Solution**:
1. Open browser/app console to see error messages
2. Check network tab for failed requests
3. Verify Supabase URL is correct in `.env`
4. Test Supabase connection with `/test-supabase` route

### "Missing Supabase environment variables"

**Cause**: `.env` file not found or malformed

**Solution**:
1. Ensure `.env` file exists in `food-saverr/` directory
2. Copy from `env.template` if needed
3. Restart the Expo dev server after changing `.env`

### Row Level Security (RLS) errors

**Cause**: RLS policies blocking queries

**Solution**:
1. Run the full `supabase-schema.sql` to set up RLS policies
2. Or temporarily disable RLS for testing (not recommended)

## 📚 Next Steps

### For Development

1. **Test the Authentication Flow**
   - Try logging in with both demo accounts
   - Test signup with new accounts
   - Verify session persistence (close/reopen app)

2. **Customize Demo Data**
   - Edit `scripts/create-demo-accounts.js` to change demo data
   - Add more sample surprise bags
   - Create additional test accounts

3. **Test Protected Routes**
   - Ensure authenticated users can access their dashboards
   - Verify unauthenticated users are redirected to login

### For Production

1. **Remove Demo Buttons**
   - Delete the demo button section from `app/auth/login.tsx`
   - Keep the regular login form only

2. **Secure Environment Variables**
   - Use Expo's environment variable system
   - Set secrets in EAS Build configuration
   - Never expose service role key in client code

3. **Enable Email Verification**
   - Configure email templates in Supabase
   - Require email confirmation for new signups
   - Implement password reset flow

4. **Add Extra Security**
   - Implement rate limiting
   - Add CAPTCHA for signup
   - Enable MFA (Multi-Factor Authentication)

## 🔗 Related Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Demo Accounts Setup](./DEMO_ACCOUNTS_SETUP.md)
- [Database Schema](./supabase-schema.sql)
- [Location Usage Guide](./LOCATION_USAGE.md)

## 📞 Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Review the Supabase Dashboard for auth logs
3. Verify all environment variables are set correctly
4. Test the Supabase connection using `/test-supabase` route

---

**Last Updated**: October 2025  
**App Version**: 1.0.0

