# Remove Dummy Data from Accounts

This document explains how to remove default/dummy data from all accounts (except demo accounts) so that shops only show real data they've entered.

## Problem

Previously, when shops signed up, they were automatically assigned placeholder values:
- **Business Name**: "Demo Shop" (if not provided)
- **Business Type**: "Restaurant" (if not provided)
- **City**: "Colombo" (if not provided)
- **Coordinates**: Default Colombo coordinates (6.9271, 79.8612)

This caused shops to display dummy data even when they hadn't entered their real information.

## Solution

The following changes have been made:

### 1. Code Changes

#### `contexts/AuthContext.tsx`
- Removed default values: `'Demo Shop'`, `'Restaurant'`, `'Colombo'`
- Changed to use empty strings (`''`) when data is not available
- Coordinates now properly parse from database or return `null` if not set
- Updated in three places: `checkAuthStatus()`, `login()`, and `signup()`

#### `lib/supabase.ts`
- Updated `signUpUser()` type to allow `coordinates: null`
- RPC function calls now pass `null` for coordinates when not provided

#### `types/User.ts`
- Updated `Customer.address.coordinates` to allow `null`
- Updated `Shop.location.coordinates` to allow `null`

### 2. Database Changes

#### `update-rpc-no-defaults.sql`
This script updates the `create_user_safe` RPC function to:
- Use empty strings instead of default values for `city`, `address`, `business_name`
- Use placeholder coordinates (0, 0) instead of Colombo coordinates when not provided
- Only update fields when valid values are provided (not empty/null)

**To apply:**
```sql
-- Run in Supabase SQL Editor
\i update-rpc-no-defaults.sql
```

### 3. Cleanup Script

#### `remove-dummy-data.sql`
This script removes dummy data from existing accounts (except demo accounts):
- Clears "Demo Shop", "John's Bakery", "Johns Bakery" → empty string
- Clears "Restaurant" → empty string (if it was a default)
- Clears "Colombo" → empty string
- Clears "123 Main Street" → empty string
- Clears demo-related descriptions

**To apply:**
```sql
-- Run in Supabase SQL Editor
\i remove-dummy-data.sql
```

**Note:** Demo accounts (`customer@demo.com` and `shop@demo.com`) are preserved with their full data.

## How It Works Now

### New Shop Signups
1. Shop provides business name and type during signup
2. Location fields start empty (no default city/coordinates)
3. Shop must use "Capture Current Location" button to set coordinates
4. All fields show empty until shop enters real data

### Existing Shops
1. Run `remove-dummy-data.sql` to clear placeholder values
2. Shops will see empty fields until they update their profile
3. Shop profile screen will prompt them to enter missing information

### Demo Accounts
- Demo accounts are **not affected** by cleanup scripts
- Demo shop (`shop@demo.com`) keeps all its sample data
- Demo customer (`customer@demo.com`) keeps all its sample data

## Verification

After running the cleanup script, verify results:

```sql
-- Check shop profiles (should see empty strings for non-demo shops)
SELECT 
    u.email,
    sp.business_name,
    sp.business_type,
    sp.city,
    sp.address
FROM shop_profiles sp
JOIN users u ON u.id = sp.id
WHERE u.email NOT IN ('customer@demo.com', 'shop@demo.com')
ORDER BY u.created_at DESC;
```

## Important Notes

1. **Coordinates are NOT NULL**: The database schema requires coordinates, so new shops get placeholder (0, 0) which they must update. This is intentional to ensure shops set their location.

2. **Business Type Enum**: The `business_type` field uses an enum that requires a valid value. If not provided, it defaults to `'restaurant'` (required by NOT NULL constraint). Shops should set this during signup.

3. **Empty vs Null**: We use empty strings (`''`) for text fields, not `NULL`, to work with the existing schema constraints.

4. **UI Updates**: The shop profile screen should handle empty fields gracefully and prompt users to fill them in.

## Testing

1. Create a new shop account
2. Verify it shows empty fields (no "Demo Shop", "Colombo", etc.)
3. Fill in real data
4. Verify it displays correctly
5. Run cleanup script on existing accounts
6. Verify demo accounts are unchanged

















