-- Demo Accounts Setup for FoodSaverr
-- Run this script in your Supabase SQL Editor to create demo accounts

-- Note: You'll need to create the auth users in Supabase Dashboard or via API
-- These are the corresponding profile records

-- Demo Customer Account
-- Email: customer@demo.com
-- Password: demo123
INSERT INTO users (id, email, name, user_type, phone_number, created_at, last_login_at)
VALUES (
  'demo-customer-uuid', -- Replace with actual UUID from auth.users
  'customer@demo.com',
  'Jane Doe',
  'customer',
  '+94 77 987 6543',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_profiles (id, dietary_preferences, address, city, postal_code, coordinates, created_at, updated_at)
VALUES (
  'demo-customer-uuid', -- Same UUID as above
  ARRAY['meals', 'bread_pastries'],
  '456 Oak Avenue',
  'Colombo',
  '00300',
  ST_GeomFromText('POINT(79.8612 6.9271)', 4326),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Demo Shop Account
-- Email: shop@demo.com
-- Password: demo123
INSERT INTO users (id, email, name, user_type, phone_number, created_at, last_login_at)
VALUES (
  'demo-shop-uuid', -- Replace with actual UUID from auth.users
  'shop@demo.com',
  'John''s Bakery',
  'shop',
  '+94 77 123 4567',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_profiles (
  id, 
  business_name, 
  business_type, 
  description, 
  address, 
  city, 
  postal_code, 
  coordinates,
  operating_hours,
  is_verified,
  verified_at,
  average_rating,
  total_reviews,
  logo_url,
  banner_url,
  created_at,
  updated_at
)
VALUES (
  'demo-shop-uuid', -- Same UUID as above
  'John''s Bakery',
  'Bakery',
  'Fresh baked goods daily - reducing food waste one surprise bag at a time!',
  '123 Main Street',
  'Colombo',
  '00100',
  ST_GeomFromText('POINT(79.8612 6.9271)', 4326),
  jsonb_build_object(
    'monday', jsonb_build_object('open', '07:00', 'close', '19:00', 'isOpen', true),
    'tuesday', jsonb_build_object('open', '07:00', 'close', '19:00', 'isOpen', true),
    'wednesday', jsonb_build_object('open', '07:00', 'close', '19:00', 'isOpen', true),
    'thursday', jsonb_build_object('open', '07:00', 'close', '19:00', 'isOpen', true),
    'friday', jsonb_build_object('open', '07:00', 'close', '19:00', 'isOpen', true),
    'saturday', jsonb_build_object('open', '08:00', 'close', '18:00', 'isOpen', true),
    'sunday', jsonb_build_object('open', '09:00', 'close', '17:00', 'isOpen', true)
  ),
  true,
  NOW(),
  4.5,
  127,
  'https://example.com/logo.png',
  'https://example.com/banner.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add some sample surprise bags for the demo shop
INSERT INTO surprise_bags (
  shop_id,
  category,
  title,
  description,
  original_price,
  discounted_price,
  total_quantity,
  remaining_quantity,
  collection_date,
  collection_start_time,
  collection_end_time,
  is_available,
  tags,
  created_at,
  updated_at
)
VALUES
(
  'demo-shop-uuid',
  'bread_pastries',
  'Fresh Bakery Surprise Bag',
  'A delightful selection of fresh breads, pastries, and baked goods from today. Save them from going to waste!',
  1500.00,
  500.00,
  5,
  5,
  CURRENT_DATE + INTERVAL '1 day',
  '17:00',
  '19:00',
  true,
  ARRAY['fresh', 'variety', 'bakery'],
  NOW(),
  NOW()
),
(
  'demo-shop-uuid',
  'meals',
  'End of Day Meal Deal',
  'Assorted prepared meals and sandwiches from our deli counter. Perfect for dinner!',
  2000.00,
  700.00,
  3,
  3,
  CURRENT_DATE,
  '18:30',
  '20:00',
  true,
  ARRAY['meals', 'ready-to-eat', 'dinner'],
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verification query to check if accounts were created
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

