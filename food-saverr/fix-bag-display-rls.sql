-- Fix RLS policy to allow viewing bags from both verified and pending shops
-- This ensures new shops' bags can be displayed to customers even before verification

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view available bags" ON surprise_bags;

-- Create new policy that allows viewing bags from verified OR pending shops
CREATE POLICY "Anyone can view available bags" ON surprise_bags FOR SELECT USING (
    is_available = true AND 
    remaining_quantity > 0 AND
    EXISTS (
        SELECT 1 FROM shop_profiles 
        WHERE id = shop_id 
        AND verification_status IN ('verified', 'pending')
    )
);

-- Also ensure shop_profiles policy allows viewing pending shops
DROP POLICY IF EXISTS "Anyone can view verified shops" ON shop_profiles;

-- Update shop profiles policy to allow viewing both verified and pending shops
CREATE POLICY "Anyone can view verified shops" ON shop_profiles FOR SELECT USING (
    verification_status IN ('verified', 'pending')
);









