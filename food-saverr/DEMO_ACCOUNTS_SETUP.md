# Demo Accounts Setup Guide

This guide will help you set up demo accounts for testing the FoodSaverr app.

## Quick Setup

### Step 1: Create Auth Users in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `bblcyyqmwmbovkecxuqz`
3. Navigate to **Authentication** > **Users**
4. Click **Add User** (or **Invite User**)

#### Create Customer Demo Account
- **Email**: `customer@demo.com`
- **Password**: `demo123`
- **Auto Confirm User**: ✅ (check this box)
- Click **Create User**
- **Copy the UUID** - you'll need it in the next step

#### Create Shop Demo Account
- **Email**: `shop@demo.com`
- **Password**: `demo123`
- **Auto Confirm User**: ✅ (check this box)
- Click **Create User**
- **Copy the UUID** - you'll need it in the next step

### Step 2: Add Profile Data

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the `demo-accounts.sql` file in this directory
4. **Replace the placeholder UUIDs**:
   - Replace `'demo-customer-uuid'` with the actual UUID from the customer account
   - Replace `'demo-shop-uuid'` with the actual UUID from the shop account
5. Paste the updated SQL into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

### Step 3: Verify Setup

Run this query in the SQL Editor to verify the accounts were created:

```sql
SELECT 
  u.email,
  u.user_type,
  u.name,
  CASE 
    WHEN u.user_type = 'customer' THEN cp.city
    WHEN u.user_type = 'shop' THEN sp.city
  END as city
FROM users u
LEFT JOIN customer_profiles cp ON u.id = cp.id
LEFT JOIN shop_profiles sp ON u.id = sp.id
WHERE u.email IN ('customer@demo.com', 'shop@demo.com');
```

You should see two rows returned with the customer and shop accounts.

## Using Demo Accounts in the App

### In the Login Screen

1. Start the app: `npm start`
2. Navigate to the login screen
3. Click either:
   - **Customer Demo** button - automatically logs in as customer@demo.com
   - **Shop Demo** button - automatically logs in as shop@demo.com

The buttons will automatically fill in the credentials and submit the login form.

## What's Included

### Customer Demo Account
- **Name**: Jane Doe
- **Email**: customer@demo.com
- **Location**: Colombo, Sri Lanka
- **Preferences**: Meals, Bread & Pastries

### Shop Demo Account
- **Business Name**: John's Bakery
- **Email**: shop@demo.com
- **Type**: Bakery
- **Location**: Colombo, Sri Lanka
- **Rating**: 4.5 stars (127 reviews)
- **Status**: Verified ✓
- **Operating Hours**: Monday-Friday 7:00-19:00

### Sample Data
The shop demo account includes 2 sample surprise bags:
1. **Fresh Bakery Surprise Bag** - Available tomorrow, 17:00-19:00
2. **End of Day Meal Deal** - Available today, 18:30-20:00

## Troubleshooting

### "Invalid login credentials" error
- Make sure you created the auth users in Supabase with the correct emails and passwords
- Verify the passwords are exactly `demo123` (case-sensitive)
- Check that you clicked "Auto Confirm User" when creating the accounts

### "Failed to load user profile" error
- Verify you ran the `demo-accounts.sql` script
- Make sure you replaced the placeholder UUIDs with the actual UUIDs from Supabase Auth
- Check that the UUIDs match exactly between `users`, `customer_profiles`, and `shop_profiles` tables

### Demo buttons don't work
- Clear the app cache and restart
- Check the console/logs for error messages
- Verify your `.env` file has the correct Supabase credentials

### How to reset demo accounts
1. Delete the auth users from Supabase Dashboard
2. Delete the corresponding rows from `users`, `customer_profiles`, and `shop_profiles` tables
3. Follow the setup steps again

## Environment Variables

Make sure your `.env` file contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Steps

After setting up demo accounts:

1. Test the customer flow:
   - Browse surprise bags
   - Add to favorites
   - Place orders
   - View order history

2. Test the shop flow:
   - Create surprise bags
   - Manage inventory
   - View orders
   - Update business profile

## Support

If you encounter issues:
1. Check the Supabase Dashboard for error logs
2. Review the app console for error messages
3. Verify all tables exist in your Supabase database
4. Ensure Row Level Security (RLS) policies are enabled

---

**Note**: These are demo accounts for development and testing purposes only. Do not use them in production.

