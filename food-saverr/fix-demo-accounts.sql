-- Fix Demo Accounts User Types
-- Run this in your Supabase SQL Editor to fix the user_type for shop@demo.com

-- Update shop@demo.com to have user_type = 'shop'
UPDATE users
SET user_type = 'shop'
WHERE email = 'shop@demo.com';

-- Verify the fix
SELECT 
  u.email,
  u.user_type,
  u.name,
  CASE 
    WHEN u.user_type = 'customer' THEN 'Has customer profile'
    WHEN u.user_type = 'shop' THEN 'Should have shop profile'
  END as profile_type
FROM users u
WHERE u.email IN ('customer@demo.com', 'shop@demo.com')
ORDER BY u.email;


