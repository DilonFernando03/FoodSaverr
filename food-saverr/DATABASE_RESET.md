# Database Reset Guide

This guide explains how to reset your database while preserving demo accounts.

## ⚠️ Warning

**This will permanently delete ALL data except demo accounts!**
- All users except `customer@demo.com` and `shop@demo.com` will be deleted
- All surprise bags except those from the demo shop will be deleted
- All orders, favorites, reviews, and other data will be deleted
- **Demo accounts and their data will be preserved**

## 📋 Prerequisites

Before running the reset:
1. ✅ Demo accounts must exist (`customer@demo.com` and `shop@demo.com`)
2. ✅ You have access to Supabase SQL Editor or service role key

## 🚀 Method 1: Using SQL Script (Recommended)

This is the easiest and most reliable method.

### Steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to **SQL Editor**
   - Click **New Query**

2. **Copy and paste the reset script**
   - Open `reset-database.sql` from the project root
   - Copy the entire contents
   - Paste into the SQL Editor

3. **Run the script**
   - Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Wait for the script to complete

4. **Verify the reset**
   - The script will show verification queries at the end
   - You should see only 2 users remaining (the demo accounts)
   - Check that demo shop's bags are still present

## 🔧 Method 2: Using Node.js Script

If you prefer using a script, you can use the Node.js version.

### Steps:

1. **Set up environment variables**
   - Make sure your `.env` file has:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

2. **Run the script**
   ```bash
   npm run reset-database
   ```

3. **Verify the reset**
   - The script will output confirmation messages
   - Check Supabase to verify only demo accounts remain

## 📊 What Gets Deleted

The reset script deletes data from these tables (except demo account data):

- ✅ `notifications` - All notifications except for demo accounts
- ✅ `reviews` - All reviews except those involving demo accounts
- ✅ `customer_favorites` - All favorites except demo customer's
- ✅ `bag_orders` - All orders except demo account orders
- ✅ `surprise_bags` - All bags except demo shop's bags
- ✅ `bag_schedules` - All schedules except demo shop's
- ✅ `shop_operating_hours` - All hours except demo shop's
- ✅ `shop_analytics` - All analytics except demo shop's
- ✅ `customer_profiles` - All profiles except demo customer's
- ✅ `shop_profiles` - All profiles except demo shop's
- ✅ `users` - All users except demo accounts

## 🎯 What Gets Preserved

The following demo account data is **preserved**:

- ✅ Demo customer account (`customer@demo.com`)
- ✅ Demo shop account (`shop@demo.com`)
- ✅ Demo shop's surprise bags
- ✅ Demo shop's bag schedules
- ✅ Demo shop's operating hours
- ✅ Demo customer's favorites
- ✅ Orders placed by demo customer
- ✅ Reviews involving demo accounts

## 🔍 Verification Queries

After running the reset, verify with these queries:

### Check remaining users:
```sql
SELECT email, user_type, name FROM users;
```
Should return only 2 rows: `customer@demo.com` and `shop@demo.com`

### Check remaining bags:
```sql
SELECT 
    sb.title,
    sb.category,
    sp.business_name
FROM surprise_bags sb
JOIN shop_profiles sp ON sb.shop_id = sp.id
WHERE sp.business_name = 'John''s Bakery';
```
Should show demo shop's bags

### Check data counts:
```sql
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Surprise Bags', COUNT(*) FROM surprise_bags
UNION ALL
SELECT 'Bag Orders', COUNT(*) FROM bag_orders
UNION ALL
SELECT 'Customer Favorites', COUNT(*) FROM customer_favorites;
```

## 🐛 Troubleshooting

### Error: "Demo accounts not found"

**Solution**: Create demo accounts first:
```bash
npm run create-demo-accounts
```

Or manually create them in Supabase Dashboard:
1. Go to **Authentication** > **Users**
2. Create `customer@demo.com` with password `demo123`
3. Create `shop@demo.com` with password `demo123`
4. Run the demo accounts SQL script

### Error: "Foreign key constraint violation"

**Solution**: The SQL script should handle this automatically. If you see this error:
1. Make sure you're running the complete script (not just parts)
2. The script deletes in the correct order to respect foreign keys

### Some data still remains

**Solution**: 
1. Check that demo accounts exist with correct emails
2. Verify the script ran completely (check for errors)
3. Manually delete remaining data if needed:
   ```sql
   -- Only run this if you're sure!
   DELETE FROM notifications WHERE user_id NOT IN (
       SELECT id FROM users WHERE email IN ('customer@demo.com', 'shop@demo.com')
   );
   ```

## 📝 Notes

- The reset preserves the database schema - no tables are dropped
- All foreign key relationships are maintained
- Demo accounts remain fully functional after reset
- You can create new accounts immediately after reset

## 🎯 After Reset

Once the reset is complete:

1. ✅ Demo accounts are ready to use
2. ✅ You can create new customer and shop accounts
3. ✅ Database is clean and ready for fresh data
4. ✅ Demo shop's bags are available for testing

## 📚 Related Files

- `reset-database.sql` - SQL script for manual reset
- `scripts/reset-database.js` - Node.js script for automated reset
- `demo-accounts.sql` - Demo accounts setup script
- `DEMO_ACCOUNTS_SETUP.md` - Demo accounts setup guide

---

**Need help?** Check the main [README.md](./README.md) or [DEMO_ACCOUNTS_SETUP.md](./DEMO_ACCOUNTS_SETUP.md)









