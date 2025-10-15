# Fix Demo Accounts Guide

## Issue
The `shop@demo.com` account has `user_type = 'customer'` in the database, which is incorrect. This prevents proper login as a shop owner.

## Solution

### Step 1: Fix the User Type in Supabase

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Script**
   - Copy and paste the contents of `fix-demo-accounts.sql`
   - Or run this query directly:
   ```sql
   -- Update shop@demo.com to have user_type = 'shop'
   UPDATE users
   SET user_type = 'shop'
   WHERE email = 'shop@demo.com';
   
   -- Verify the fix
   SELECT 
     u.email,
     u.user_type,
     u.name
   FROM users u
   WHERE u.email IN ('customer@demo.com', 'shop@demo.com')
   ORDER BY u.email;
   ```

4. **Verify the Results**
   - The query should show:
     - `customer@demo.com` with `user_type = 'customer'`
     - `shop@demo.com` with `user_type = 'shop'`

### Step 2: Test the Logout and Login Flow

1. **Test Logout**
   - If you're currently logged in as a customer, click the "Logout" button in the top-right
   - Confirm the logout dialog
   - You should be redirected to the login screen

2. **Test Shop Login**
   - Click "Shop Demo" button
   - You should be logged in as a shop owner
   - You should be redirected to the shop dashboard at `/(shop-tabs)/dashboard`

3. **Test Customer Login**
   - Logout from the shop account
   - Click "Customer Demo" button
   - You should be logged in as a customer
   - You should be redirected to the customer UI at `/(tabs)/`

## What Was Fixed

### 1. Login Screen (`app/auth/login.tsx`)
- ✅ Removed the "already logged in" message that was blocking account switching
- ✅ Simplified the loading state to allow re-login
- ✅ Now allows switching between demo accounts without issues

### 2. Customer UI (`app/(tabs)/index.tsx`)
- ✅ Added header with FoodSaverr branding
- ✅ Added logout button with confirmation dialog
- ✅ Added proper error handling for logout
- ✅ Added console logs to track logout flow

### 3. Database Fix
- ✅ Created SQL script to fix `shop@demo.com` user_type
- ✅ Ensures shop accounts have correct `user_type = 'shop'`

## Testing Checklist

- [ ] Shop account has `user_type = 'shop'` in database
- [ ] Logout button appears in customer UI
- [ ] Logout confirmation dialog appears when clicked
- [ ] Logout successfully logs out and redirects to login
- [ ] Shop Demo button logs in as shop owner
- [ ] Customer Demo button logs in as customer
- [ ] Can switch between accounts multiple times
- [ ] No "already logged in" blocking message

## Troubleshooting

### If logout doesn't work:
1. Check browser console for errors
2. Verify `signOutUser()` function in `lib/supabase.ts` is working
3. Check AsyncStorage is being cleared
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### If shop login still shows as customer:
1. Verify the SQL update ran successfully
2. Check the `users` table in Supabase for the correct `user_type`
3. Clear app cache and AsyncStorage
4. Restart the development server

### If you're stuck on login screen after logout:
1. This is expected behavior - the app now always starts at login
2. Use the demo buttons to log in again
3. This ensures proper authentication flow

## Next Steps

After fixing the demo accounts, you should be able to:
1. Switch between customer and shop accounts freely
2. Test both UIs independently
3. Logout and login as needed
4. Verify the authentication flow works correctly


