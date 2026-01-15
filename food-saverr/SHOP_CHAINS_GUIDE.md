# Shop Chains Support Guide

## Overview

FoodSaverr now supports **shop chains** - multiple shop locations that share the same brand/business name but have separate logins and locations. This is perfect for businesses with multiple locations (e.g., "Joe's Bakery - Downtown", "Joe's Bakery - Mall Branch").

## How It Works

### Current Structure (Already Supports Chains!)

The existing database structure **already supports** multiple shops with the same business name:

- ✅ Each shop location has its own **separate login** (unique email/password)
- ✅ Each shop location has its own **unique location** (address, coordinates)
- ✅ Each shop location has its own **phone number**
- ✅ Multiple shops can share the same `business_name` (no unique constraint)

### New Chain Features (Optional Enhancement)

The migration adds **optional** chain support for better organization:

1. **`shop_chains` table**: Stores shared branding information for chains
2. **`chain_id` field**: Links shops to their chain (optional - NULL for independent shops)
3. **`location_name` field**: Distinguishes locations (e.g., "Downtown", "Mall Branch")

## Usage Scenarios

### Scenario 1: Simple Chain (No Migration Needed)

**Joe's Bakery** wants to register two locations:

**Location 1:**
- Email: `downtown@joesbakery.com`
- Password: `password123`
- Business Name: `Joe's Bakery`
- Address: `123 Main St, Colombo`
- Phone: `+94771234567`

**Location 2:**
- Email: `mall@joesbakery.com`
- Password: `password456`
- Business Name: `Joe's Bakery` (same name!)
- Address: `456 Mall Road, Colombo`
- Phone: `+94771234568`

**Result**: ✅ Both shops can register with the same business name. Each has separate login credentials and location.

### Scenario 2: Chain with Shared Branding (After Migration)

After running the migration, you can optionally create a chain:

1. **Create the chain** (optional):
```sql
INSERT INTO shop_chains (chain_name, description, logo_url, website_url)
VALUES (
  'Joe''s Bakery',
  'Fresh baked goods since 1990',
  'https://example.com/logo.png',
  'https://joesbakery.com'
)
RETURNING id;
```

2. **Register Location 1**:
```sql
-- During signup, include chain_id
INSERT INTO shop_profiles (
  id, business_name, business_type, address, city, coordinates,
  chain_id, location_name, phone_number
) VALUES (
  'user-id-1',
  'Joe''s Bakery',
  'bakery',
  '123 Main St',
  'Colombo',
  ST_Point(79.8612, 6.9271),
  'chain-id-from-step-1', -- Link to chain
  'Downtown Location',     -- Location identifier
  '+94771234567'
);
```

3. **Register Location 2**:
```sql
-- Same chain_id, different location_name
INSERT INTO shop_profiles (
  id, business_name, business_type, address, city, coordinates,
  chain_id, location_name, phone_number
) VALUES (
  'user-id-2',
  'Joe''s Bakery',
  'bakery',
  '456 Mall Road',
  'Colombo',
  ST_Point(79.8620, 6.9280),
  'chain-id-from-step-1', -- Same chain
  'Mall Branch',          -- Different location
  '+94771234568'
);
```

## Implementation Steps

### Step 1: Run the Migration

Execute the migration SQL file in your Supabase SQL editor:

```bash
# In Supabase Dashboard > SQL Editor
# Run: shop-chains-migration.sql
```

### Step 2: Update Your Signup Flow (Optional)

If you want to support chain selection during signup, update `app/auth/signup.tsx`:

```typescript
// Add optional fields for chain support
const [locationName, setLocationName] = useState('');
const [chainId, setChainId] = useState<string | undefined>();

// In handleSignup, include these fields:
await signup({
  email: email.trim(),
  password,
  name: businessName.trim(),
  userType: UserType.SHOP,
  businessInfo: {
    businessName: businessName.trim(),
    businessType: businessType,
    phoneNumber: phoneNumber.trim(),
    locationName: locationName.trim() || undefined,
    chainId: chainId || undefined,
  },
});
```

### Step 3: Update AuthContext (Optional)

Update `contexts/AuthContext.tsx` to load chain information:

```typescript
// When loading shop profile, also load chain info if chain_id exists
if (profile?.chain_id) {
  const { data: chain } = await supabase
    .from('shop_chains')
    .select('*')
    .eq('id', profile.chain_id)
    .single();
  
  // Include chain in businessInfo
}
```

## Querying Chain Shops

### Find All Locations of a Chain

```typescript
// By business name
const { data: locations } = await supabase
  .from('shop_profiles')
  .select('*')
  .eq('business_name', "Joe's Bakery")
  .eq('verification_status', 'verified');

// By chain_id (if using chain table)
const { data: locations } = await supabase
  .from('shop_profiles')
  .select('*, shop_chains(*)')
  .eq('chain_id', chainId)
  .eq('verification_status', 'verified');
```

### Display Shop Name with Location

```typescript
const displayName = shop.locationName 
  ? `${shop.businessName} - ${shop.locationName}`
  : shop.businessName;
// Result: "Joe's Bakery - Downtown Location"
```

## Benefits

1. **Separate Logins**: Each location manager has their own account
2. **Independent Operations**: Each location manages its own bags, orders, analytics
3. **Shared Branding**: Optional chain table allows shared logo, website, etc.
4. **Easy Discovery**: Customers can find all locations of a chain
5. **Flexible**: Works with or without the chain table (backward compatible)

## Important Notes

- ✅ **Email must be unique** - Each location needs a different email
- ✅ **Business name can be duplicated** - Multiple shops can share the same name
- ✅ **Chain support is optional** - Existing shops continue to work without changes
- ✅ **Location name is optional** - If not provided, just use business_name
- ✅ **Each location is independent** - Separate bags, orders, ratings, analytics

## Example: Registering a Chain Location

```typescript
// 1. First location registers normally
await signup({
  email: 'downtown@joesbakery.com',
  password: 'secure123',
  name: "Joe's Bakery",
  userType: UserType.SHOP,
  businessInfo: {
    businessName: "Joe's Bakery",
    businessType: 'bakery',
    phoneNumber: '+94771234567',
    locationName: 'Downtown Location', // Optional
  },
});

// 2. Second location registers with same business name
await signup({
  email: 'mall@joesbakery.com', // Different email!
  password: 'secure456',
  name: "Joe's Bakery",
  userType: UserType.SHOP,
  businessInfo: {
    businessName: "Joe's Bakery", // Same name!
    businessType: 'bakery',
    phoneNumber: '+94771234568', // Different phone
    locationName: 'Mall Branch', // Different location name
  },
});
```

Both shops will appear in search results, but each has:
- ✅ Separate login credentials
- ✅ Separate location and phone
- ✅ Separate bags and orders
- ✅ Separate analytics

## Migration Backward Compatibility

The migration is **fully backward compatible**:
- Existing shops continue to work (chain_id is NULL)
- No breaking changes to existing code
- Chain features are optional enhancements





