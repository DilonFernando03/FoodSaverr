# Fix Bag Display on Customer Screens

This document explains the fixes made to ensure bags created by shops are displayed on customer screens.

## Issues Found

1. **RLS Policy Restriction**: The Row Level Security policy only allowed viewing bags from `verified` shops, but the query was trying to fetch bags from both `verified` and `pending` shops. This caused bags from new shops to be blocked.

2. **Location-Dependent Display**: Bags might not display if customer location wasn't set, even though they should still be visible.

3. **Missing Quantity Filter**: The query wasn't explicitly filtering out bags with zero remaining quantity at the database level.

## Fixes Applied

### 1. Updated RLS Policies (`fix-bag-display-rls.sql`)

**Before:**
```sql
CREATE POLICY "Anyone can view available bags" ON surprise_bags FOR SELECT USING (
    is_available = true AND 
    EXISTS (SELECT 1 FROM shop_profiles WHERE id = shop_id AND verification_status = 'verified')
);
```

**After:**
```sql
CREATE POLICY "Anyone can view available bags" ON surprise_bags FOR SELECT USING (
    is_available = true AND 
    remaining_quantity > 0 AND
    EXISTS (
        SELECT 1 FROM shop_profiles 
        WHERE id = shop_id 
        AND verification_status IN ('verified', 'pending')
    )
);
```

**Changes:**
- Now allows viewing bags from both `verified` and `pending` shops
- Explicitly checks `remaining_quantity > 0` in the policy
- Updated shop_profiles policy to allow viewing pending shops

### 2. Enhanced Query in `lib/supabase.ts`

**Added filters:**
- `.eq('is_active', true)` - Only show active bags
- `.gt('remaining_quantity', 0)` - Only show bags with items remaining
- Added quantity filter in JavaScript as well for extra safety

**Distance filtering:**
- Bags are fetched even without user location
- Distance filtering is only applied if location is provided
- Better logging to debug filtering issues

### 3. Updated Display Logic in `app/(tabs)/index.tsx`

**Before:**
- Only showed bags within radius, even if location wasn't set

**After:**
- Shows all available bags if no location is set
- Filters by distance only when location is available
- Ensures bags are visible regardless of location status

### 4. Updated Context in `contexts/SurpriseBagContext.tsx`

**Changes:**
- Only applies distance filter if user location exists
- Always fetches bags from database regardless of location
- Better error handling and logging

## How to Apply

### Step 1: Update RLS Policies

Run the SQL script against Supabase. You can either:

- Use the Supabase SQL Editor and run:

  ```bash
  \i fix-bag-display-rls.sql
  ```

- **Or** run the new helper script (requires `SUPABASE_SERVICE_ROLE_KEY`):

  ```bash
  npm run apply-rls-fix
  ```

  This reads `fix-bag-display-rls.sql`, sends each statement through the `exec_sql` RPC, and prints back the active policies so you can confirm they now allow `pending` shops. Make sure your Supabase project has the helper function defined like this:

  ```sql
  create or replace function public.exec_sql(query text)
  returns json
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    normalized_query text := lower(regexp_replace(query, '^\s+', ''));
    result json;
  begin
    if normalized_query like 'select%' or normalized_query like 'with%' then
      execute format('select coalesce(json_agg(row_to_json(t)), ''[]''::json) from (%s) t', query)
      into result;
      return result;
    end if;

    execute query;
    return json_build_object('status', 'ok');
  end;
  $$;

  grant execute on function public.exec_sql to authenticated;
  grant execute on function public.exec_sql to anon;
  grant execute on function public.exec_sql to service_role;
  ```

  (If the function already exists, re-run the definition above so it can handle `DROP`/`CREATE` statements without returning data.)

### Step 2: Verify Bags Are Created Correctly

Ensure bags are created with:
- `is_available = true`
- `is_active = true`
- `remaining_quantity > 0`
- `collection_date >= today`

The `createSurpriseBag` function already sets these correctly.

### Step 3: Test

1. **As a Shop:**
   - Create a new bag
   - Verify it shows `is_available = true` and `remaining_quantity > 0` in database

2. **As a Customer:**
   - Open the discover screen
   - Check console logs for:
     - "Found X bags from database (before distance filtering)"
     - "After quantity filter: X bags with items remaining"
     - "After distance filtering: X bags within Xkm" (if location set)
   - Bags should appear in the "Available near you" section

## Debugging

If bags still don't appear, check:

1. **Console Logs:**
   - Look for "Loading bags with filters" message
   - Check "Found X bags from database" count
   - Verify "After quantity filter" and "After distance filtering" counts

2. **Database:**
   ```sql
   -- Check if bags exist
   SELECT 
     sb.id, 
     sb.title, 
     sb.is_available, 
     sb.is_active, 
     sb.remaining_quantity,
     sp.business_name,
     sp.verification_status
   FROM surprise_bags sb
   JOIN shop_profiles sp ON sp.id = sb.shop_id
   WHERE sb.is_available = true 
     AND sb.is_active = true
     AND sb.remaining_quantity > 0
     AND sp.verification_status IN ('verified', 'pending');
   ```

3. **RLS Policies:**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies 
   WHERE tablename = 'surprise_bags';
   ```

4. **Customer Location:**
   - Ensure customer has location set (either from device or saved coordinates)
   - Check `customer_profiles.address_coordinates` in database
   - Verify location is being loaded in `LocationContext`

## Expected Behavior

✅ **Bags from verified shops** → Always visible  
✅ **Bags from pending shops** → Visible (after RLS fix)  
✅ **Bags with quantity > 0** → Visible  
✅ **Bags with collection_date >= today** → Visible  
✅ **Bags filtered by distance** → Only if customer location is set  
✅ **All bags shown** → If no customer location is set (no distance filtering)

## Notes

- New shops start with `verification_status = 'pending'`
- Bags from pending shops will now be visible to customers
- Distance filtering is optional - bags show without location
- All filters are applied at both database and application level for safety


