# Migration Guide: From Context API to Supabase

This guide helps you migrate your existing FoodSaverr app from the current Context API approach to using Supabase as the backend database.

## Overview

The migration involves:
1. Setting up Supabase database
2. Installing required dependencies
3. Updating your contexts to use Supabase
4. Migrating existing data structures
5. Implementing real-time features

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

For Expo projects, AsyncStorage is already included, but you may need to install it separately for bare React Native projects.

## Step 2: Set Up Environment Variables

1. Copy `env.template` to `.env.local`
2. Fill in your Supabase project credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Update Your Contexts

### AuthContext Migration

Replace your current `AuthContext.tsx` with Supabase authentication:

```typescript
// Before (Context API)
const login = async (credentials: LoginCredentials) => {
  // Mock authentication
  await new Promise(resolve => setTimeout(resolve, 1000));
  // ... mock user creation
};

// After (Supabase)
const login = async (credentials: LoginCredentials) => {
  const { user, error } = await signInUser(credentials.email, credentials.password);
  if (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    return;
  }
  
  const { user: userData, profile } = await getCurrentUser();
  dispatch({ type: 'SET_USER', payload: { ...userData, ...profile } });
};
```

### SurpriseBagContext Migration

Replace mock data with Supabase queries:

```typescript
// Before (Context API)
const sampleBags: SurpriseBag[] = [
  // ... hardcoded data
];

// After (Supabase)
const loadBags = async () => {
  dispatch({ type: 'SET_LOADING', payload: true });
  
  const { bags, error } = await getAvailableSurpriseBags(state.filters);
  
  if (error) {
    console.error('Error loading bags:', error);
    return;
  }
  
  dispatch({ type: 'SET_BAGS', payload: bags });
  dispatch({ type: 'SET_LOADING', payload: false });
};
```

### ShopContext Migration

Replace mock operations with Supabase operations:

```typescript
// Before (Context API)
const createBag = async (bagData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newBag = { ...bagData, id: `bag-${Date.now()}` };
  dispatch({ type: 'ADD_BAG', payload: newBag });
};

// After (Supabase)
const createBag = async (bagData) => {
  dispatch({ type: 'SET_LOADING', payload: true });
  
  const { bag, error } = await createSurpriseBag({
    ...bagData,
    shop_id: currentUser.id,
  });
  
  if (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
    return;
  }
  
  dispatch({ type: 'ADD_BAG', payload: bag });
  dispatch({ type: 'SET_LOADING', payload: false });
};
```

## Step 4: Update Type Definitions

Replace your existing types with the new database types:

```typescript
// Before
import { SurpriseBag } from '@/types/SurpriseBag';

// After
import { SurpriseBag, SurpriseBagWithShop } from '@/types/Database';
```

## Step 5: Implement Real-time Features

Add real-time subscriptions for live updates:

```typescript
// In your SurpriseBagContext
useEffect(() => {
  const subscription = supabase
    .channel('surprise_bags')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'surprise_bags',
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_BAG', payload: payload.new });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_BAG', payload: payload.new });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_BAG', payload: payload.old.id });
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Step 6: Update Components

Update your components to handle the new data structure:

```typescript
// Before
const { bags, loading } = useSurpriseBag();

// After - data structure might be slightly different
const { bags, loading } = useSurpriseBag();
// bags now include shop_profiles relation
const shopName = bag.shop_profiles?.business_name;
```

## Step 7: Handle Authentication State

Update your app to handle Supabase auth state:

```typescript
// In your root _layout.tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { user, profile } = await getCurrentUser();
        // Update your auth context
      } else if (event === 'SIGNED_OUT') {
        // Clear user data
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## Step 8: Migrate Existing Data (Optional)

If you have existing user data you want to preserve:

```typescript
// Create a migration script
const migrateExistingData = async () => {
  const existingUsers = /* get from AsyncStorage or current state */;
  
  for (const user of existingUsers) {
    await signUpUser({
      email: user.email,
      password: 'temporary-password', // User will need to reset
      name: user.name,
      user_type: user.userType,
      // ... other fields
    });
  }
};
```

## Step 9: Update Navigation Guards

Update your navigation to work with Supabase auth:

```typescript
// In your navigation components
const { user, isLoading } = useAuth();

if (isLoading) {
  return <LoadingScreen />;
}

if (!user) {
  return <AuthStack />;
}

return user.user_type === 'shop' ? <ShopTabs /> : <CustomerTabs />;
```

## Step 10: Testing

1. **Test Authentication Flow**
   - Sign up new users
   - Sign in existing users
   - Sign out functionality

2. **Test Data Operations**
   - Create surprise bags (shops)
   - Browse bags (customers)
   - Place orders
   - Update order status

3. **Test Real-time Features**
   - New bag notifications
   - Order status updates
   - Quantity changes

## Common Issues and Solutions

### 1. Row Level Security Errors
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user is authenticated and policies are correctly configured.

### 2. PostGIS Coordinate Format
```
Error: Invalid coordinate format
```
**Solution**: Use `POINT(longitude latitude)` format for coordinates.

### 3. Type Errors
```
Error: Property 'shop_profiles' does not exist
```
**Solution**: Update your TypeScript types to match the new database schema.

### 4. Real-time Subscription Issues
```
Subscription not receiving updates
```
**Solution**: Check RLS policies allow reads for the subscribed table.

## Performance Optimizations

1. **Use Select Specific Columns**
   ```typescript
   .select('id, title, discounted_price, shop_profiles(business_name)')
   ```

2. **Implement Pagination**
   ```typescript
   .range(page * pageSize, (page + 1) * pageSize - 1)
   ```

3. **Use Indexes for Filtering**
   - The schema includes optimized indexes for common queries

4. **Cache Frequently Accessed Data**
   ```typescript
   // Use React Query or SWR for caching
   const { data: bags } = useQuery('surprise-bags', getAvailableSurpriseBags);
   ```

## Security Considerations

1. **Never expose service role key** in client code
2. **Validate user input** before database operations
3. **Use RLS policies** to ensure data security
4. **Implement proper error handling** to avoid exposing sensitive information

## Next Steps

After migration:
1. Implement push notifications using Supabase Edge Functions
2. Add image upload using Supabase Storage
3. Implement advanced analytics using Supabase's built-in analytics
4. Add payment processing integration
5. Implement advanced search with full-text search capabilities

## Rollback Plan

If you need to rollback:
1. Keep your existing Context API code in a separate branch
2. Test thoroughly before removing old code
3. Have a data export strategy from Supabase if needed

---

This migration will significantly improve your app's scalability, real-time capabilities, and data persistence. Take it step by step and test each component thoroughly before moving to the next.
