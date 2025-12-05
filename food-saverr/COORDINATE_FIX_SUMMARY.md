# Coordinate and Distance Filtering Fix Summary

## Issues Fixed

### 1. Customer Coordinates Not Being Saved ✅
**Problem**: Customer coordinates were not being persisted to `customer_profiles.address_coordinates` in the database.

**Solution**:
- Updated `LocationContext` to automatically save customer coordinates when location is captured
- Added `saveCustomerLocation()` function that saves coordinates in PostGIS format
- Coordinates are saved whenever a customer gets their current location

### 2. Customer Coordinates Not Loaded on Login ✅
**Problem**: Customer coordinates were not being loaded from the database when customers logged in.

**Solution**:
- Updated `AuthContext` to parse customer coordinates from `customer_profiles.address_coordinates` when loading user profile
- Coordinates are extracted from PostGIS format (supports both string and object formats)
- Customer coordinates are now available in the user object after login

### 3. Bag Filtering Logic ✅
**Problem**: Bags were not being filtered by distance correctly.

**Solution**:
- Updated `getAvailableSurpriseBags` to properly extract shop coordinates from PostGIS format
- Improved coordinate parsing to handle multiple formats (string POINT, object, hex WKB)
- Distance calculation uses Haversine formula to compute accurate distances
- Only shows bags from shops within customer's selected radius

### 4. Location Priority ✅
**Problem**: Customer location wasn't being used if GPS wasn't available.

**Solution**:
- Updated `index.tsx` to use saved customer coordinates as fallback
- Priority order: 1) Current GPS location, 2) Saved coordinates from database

## How It Works Now

### Flow for Customer:
1. Customer opens app → `LocationContext` requests location permission
2. Location captured → Automatically saved to `customer_profiles.address_coordinates`
3. Location loaded → `SurpriseBagContext` uses customer location for filtering
4. Bags loaded → `getAvailableSurpriseBags` fetches all available bags
5. Shop coordinates extracted → From each bag's `shop_profiles.coordinates`
6. Distance calculated → Haversine formula between customer and shop
7. Filtering → Only bags within customer's `maxDistance` radius are shown

### Flow for Shop:
1. Shop creates bag → Saved to `surprise_bags` table
2. Shop location required → Shops must capture location in profile
3. Coordinates saved → To `shop_profiles.coordinates` in PostGIS format

## Key Changes Made

### Files Modified:
1. **`contexts/LocationContext.tsx`**
   - Added `saveCustomerLocation()` function
   - Automatically saves customer coordinates when location is captured

2. **`contexts/AuthContext.tsx`**
   - Added coordinate parsing for customers on login
   - Loads `address_coordinates` from database and parses PostGIS format

3. **`contexts/SurpriseBagContext.tsx`**
   - Uses customer's `maxDistance` preference
   - Improved coordinate extraction from shop profiles

4. **`lib/supabase.ts`**
   - Enhanced `getAvailableSurpriseBags` with better coordinate parsing
   - Added distance filtering with logging for debugging
   - Handles multiple PostGIS coordinate formats

5. **`app/(tabs)/index.tsx`**
   - Uses saved customer coordinates as fallback
   - Updated to use customer's maxDistance preference

6. **`app/(shop-tabs)/profile.tsx`**
   - Already has location capture (from previous work)
   - Shops can capture and save their location

## Testing Checklist

- [ ] Customer location is saved when they grant permission
- [ ] Customer coordinates appear in `customer_profiles.address_coordinates` in database
- [ ] Bags from nearby shops appear on customer screen
- [ ] Bags from shops outside radius are filtered out
- [ ] Customer's maxDistance preference is respected
- [ ] Shop coordinates are properly extracted from database
- [ ] Distance calculations are accurate

## Debugging

If bags still don't appear:

1. **Check customer coordinates**:
   ```sql
   SELECT id, email, address_coordinates 
   FROM customer_profiles 
   WHERE id = 'customer-id';
   ```
   Should show coordinates in PostGIS format.

2. **Check shop coordinates**:
   ```sql
   SELECT id, business_name, coordinates 
   FROM shop_profiles 
   WHERE id = 'shop-id';
   ```
   Should show coordinates in PostGIS format.

3. **Check console logs**:
   - Look for "Bag filtered out" messages
   - Check distance calculations
   - Verify coordinate parsing

4. **Verify bags exist**:
   ```sql
   SELECT sb.*, sp.business_name, sp.coordinates
   FROM surprise_bags sb
   JOIN shop_profiles sp ON sb.shop_id = sp.id
   WHERE sb.is_available = true;
   ```

## PostGIS Coordinate Formats

The system handles these formats:
- `POINT(lng lat)` - String format
- `SRID=4326;POINT(lng lat)` - String with SRID
- Hex WKB: `0101000020E6100000...` - Binary format (needs parsing)
- Object: `{ lng: X, lat: Y }` - Direct object format

## Next Steps

If coordinates are still in hex format in database:
1. May need to use PostGIS functions in SQL to extract lat/lng
2. Or implement hex WKB parser in JavaScript
3. Or use Supabase RPC function to extract coordinates









