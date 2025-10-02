# FoodSaverr Supabase Database Setup Guide

This guide explains how to set up and use the Supabase database for the FoodSaverr application.

## Overview

The database schema is designed to support a food waste reduction platform that connects customers with shops offering surplus food at discounted prices. The schema includes comprehensive user management, shop profiles, surprise bags, orders, reviews, and analytics.

## Database Schema Structure

### Core Tables

#### 1. Users (`users`)
Base table for all users (both customers and shops)
- **Primary Key**: `id` (UUID)
- **Key Fields**: `email`, `password_hash`, `name`, `user_type`
- **User Types**: `customer`, `shop`

#### 2. Customer Profiles (`customer_profiles`)
Extended profile information for customers
- **Extends**: `users` table
- **Key Features**: Address with coordinates, preferences, favorite categories
- **Location**: Uses PostGIS for geographic queries

#### 3. Shop Profiles (`shop_profiles`)
Extended profile information for shops/restaurants
- **Extends**: `users` table
- **Key Features**: Business info, location, verification status, ratings
- **Verification**: Supports document upload and verification workflow

#### 4. Surprise Bags (`surprise_bags`)
The core product - discounted food bags from shops
- **Key Features**: Pricing, quantities, collection times, availability
- **Auto-calculated**: Discount percentage, availability status
- **Media Support**: Multiple images and tags

#### 5. Orders (`bag_orders`)
Customer orders for surprise bags
- **Status Flow**: `pending` → `confirmed` → `ready_for_pickup` → `completed`
- **Automatic**: Quantity updates when orders are confirmed

### Supporting Tables

- **Shop Operating Hours** (`shop_operating_hours`): Weekly schedule for each shop
- **Customer Favorites** (`customer_favorites`): Saved shops and bags
- **Bag Schedules** (`bag_schedules`): Automated bag posting schedules
- **Reviews** (`reviews`): Customer reviews and ratings
- **Notifications** (`notifications`): In-app notifications
- **Shop Analytics** (`shop_analytics`): Daily analytics data for shops

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run the Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Execute the script

### 3. Configure Authentication

The schema includes Row Level Security (RLS) policies that work with Supabase Auth:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own profile" ON users 
FOR SELECT USING (auth.uid() = id);
```

### 4. Environment Variables

Add these to your `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Features

### 1. Geographic Queries
Uses PostGIS for location-based features:
- Find nearby shops
- Calculate distances
- Location-based filtering

```sql
-- Find shops within 5km of a point
SELECT * FROM shop_profiles 
WHERE ST_DWithin(
    coordinates, 
    ST_Point(79.8612, 6.9271)::geography, 
    5000
);
```

### 2. Automatic Calculations
- **Discount Percentage**: Auto-calculated from original and discounted prices
- **Availability**: Auto-calculated based on quantity, date, and active status
- **Shop Ratings**: Auto-updated when reviews are added/modified

### 3. Real-time Updates
Supabase real-time subscriptions work out of the box:
- Order status changes
- New bag availability
- Quantity updates

### 4. Security
Comprehensive RLS policies ensure:
- Users can only access their own data
- Public data (shops, bags) is readable by all authenticated users
- Shops can only modify their own content

## Usage Examples

### 1. User Registration

```typescript
// Customer registration
const { data, error } = await supabase.auth.signUp({
  email: 'customer@example.com',
  password: 'password',
  options: {
    data: {
      name: 'John Doe',
      user_type: 'customer'
    }
  }
});

// Create customer profile
const { error: profileError } = await supabase
  .from('customer_profiles')
  .insert({
    id: data.user?.id,
    address_city: 'Colombo',
    favorite_categories: ['meals', 'bread_pastries']
  });
```

### 2. Shop Registration

```typescript
// Shop registration
const { data, error } = await supabase.auth.signUp({
  email: 'shop@example.com',
  password: 'password',
  options: {
    data: {
      name: 'Johns Bakery',
      user_type: 'shop'
    }
  }
});

// Create shop profile
const { error: profileError } = await supabase
  .from('shop_profiles')
  .insert({
    id: data.user?.id,
    business_name: 'Johns Bakery',
    business_type: 'Bakery',
    address: '123 Main Street',
    city: 'Colombo',
    coordinates: `POINT(79.8612 6.9271)`
  });
```

### 3. Creating Surprise Bags

```typescript
const { data, error } = await supabase
  .from('surprise_bags')
  .insert({
    shop_id: shopId,
    category: 'bread_pastries',
    title: 'Fresh Bread & Pastries',
    description: 'Assorted bread and pastries from today',
    original_price: 1000,
    discounted_price: 400,
    total_quantity: 10,
    remaining_quantity: 10,
    collection_date: '2024-01-15',
    collection_start_time: '18:00',
    collection_end_time: '20:00',
    tags: ['bread', 'pastries', 'fresh']
  });
```

### 4. Browsing Available Bags

```typescript
const { data, error } = await supabase
  .from('surprise_bags')
  .select(`
    *,
    shop_profiles (
      business_name,
      logo_url,
      average_rating,
      address,
      city
    )
  `)
  .eq('is_available', true)
  .gte('collection_date', new Date().toISOString().split('T')[0])
  .order('created_at', { ascending: false });
```

### 5. Placing Orders

```typescript
const { data, error } = await supabase
  .from('bag_orders')
  .insert({
    bag_id: bagId,
    customer_id: customerId,
    quantity: 1,
    total_price: bag.discounted_price,
    order_status: 'pending'
  });
```

### 6. Real-time Subscriptions

```typescript
// Listen for new bags from favorite shops
const subscription = supabase
  .channel('surprise_bags')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'surprise_bags',
      filter: `shop_id=in.(${favoriteShopIds.join(',')})`
    },
    (payload) => {
      console.log('New bag from favorite shop!', payload);
    }
  )
  .subscribe();
```

## Data Migration

If you have existing data, you can migrate it using the following approach:

### 1. Export Current Data
```typescript
// Export from your current context/state
const existingUsers = /* your current user data */;
const existingBags = /* your current bag data */;
```

### 2. Transform and Import
```typescript
// Transform to match schema
const transformedUsers = existingUsers.map(user => ({
  email: user.email,
  name: user.name,
  user_type: user.userType,
  // ... other fields
}));

// Bulk insert
const { error } = await supabase
  .from('users')
  .insert(transformedUsers);
```

## Performance Considerations

### 1. Indexes
The schema includes optimized indexes for:
- Geographic queries (PostGIS indexes)
- User lookups by email
- Bag filtering by category, date, availability
- Order queries by customer and status

### 2. Query Optimization
- Use `select()` to limit returned columns
- Use proper filtering with `eq()`, `gte()`, etc.
- Leverage geographic queries for location-based features

### 3. Real-time Subscriptions
- Be selective with subscriptions to avoid performance issues
- Use filters to limit subscription scope
- Unsubscribe when components unmount

## Security Best Practices

### 1. Row Level Security
All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Public data is readable by authenticated users
- Shops can only modify their own content

### 2. API Keys
- Use the anon key for client-side operations
- Never expose the service role key in client code
- Use environment variables for configuration

### 3. Data Validation
- Implement client-side validation
- Use database constraints for data integrity
- Validate user input before database operations

## Monitoring and Analytics

### 1. Built-in Analytics
The schema includes a `shop_analytics` table for tracking:
- Daily bag posts
- Order counts
- Revenue tracking
- Performance metrics

### 2. Supabase Dashboard
Use the Supabase dashboard to monitor:
- Database performance
- API usage
- Real-time connections
- Error logs

## Backup and Recovery

### 1. Automated Backups
Supabase provides automated daily backups for paid plans.

### 2. Manual Exports
You can export data using the Supabase CLI:
```bash
supabase db dump --data-only > backup.sql
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure user is authenticated
   - Check policy conditions match your use case
   - Verify user has proper permissions

2. **Geographic Query Issues**
   - Ensure PostGIS extension is enabled
   - Use proper coordinate format (longitude, latitude)
   - Check coordinate reference system (SRID 4326)

3. **Real-time Subscription Issues**
   - Verify table has RLS policies allowing reads
   - Check subscription filters are correct
   - Ensure proper cleanup of subscriptions

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Supabase Community Discord](https://discord.supabase.com/)

---

This schema provides a solid foundation for the FoodSaverr application with room for future enhancements and scaling.
