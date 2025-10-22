-- Migration to update business_type to use enum with specific options
-- This script updates the shop_profiles table to use a business_type enum

-- Step 1: Create the new business_type enum
CREATE TYPE business_type AS ENUM ('bakery', 'restaurant', 'grocery_store', 'hotel');

-- Step 2: Add a new column with the enum type
ALTER TABLE shop_profiles ADD COLUMN business_type_new business_type;

-- Step 3: Migrate existing data (map current values to new enum values)
UPDATE shop_profiles SET business_type_new = 
  CASE 
    WHEN LOWER(business_type) LIKE '%bakery%' OR LOWER(business_type) LIKE '%bread%' OR LOWER(business_type) LIKE '%pastry%' THEN 'bakery'::business_type
    WHEN LOWER(business_type) LIKE '%restaurant%' OR LOWER(business_type) LIKE '%cafe%' OR LOWER(business_type) LIKE '%diner%' THEN 'restaurant'::business_type
    WHEN LOWER(business_type) LIKE '%grocery%' OR LOWER(business_type) LIKE '%supermarket%' OR LOWER(business_type) LIKE '%market%' THEN 'grocery_store'::business_type
    WHEN LOWER(business_type) LIKE '%hotel%' OR LOWER(business_type) LIKE '%resort%' OR LOWER(business_type) LIKE '%lodge%' THEN 'hotel'::business_type
    ELSE 'restaurant'::business_type -- Default fallback
  END;

-- Step 4: Make the new column NOT NULL
ALTER TABLE shop_profiles ALTER COLUMN business_type_new SET NOT NULL;

-- Step 5: Drop the old column
ALTER TABLE shop_profiles DROP COLUMN business_type;

-- Step 6: Rename the new column to the original name
ALTER TABLE shop_profiles RENAME COLUMN business_type_new TO business_type;

-- Step 7: Update the RPC function to use the new enum type
DROP FUNCTION IF EXISTS create_user_safe(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS create_user_safe(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL, DECIMAL);

-- Recreate the function with the new enum type
CREATE OR REPLACE FUNCTION create_user_safe(
    p_id UUID,
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_user_type VARCHAR(10),
    p_phone_number VARCHAR(20) DEFAULT NULL,
    p_business_name VARCHAR(255) DEFAULT NULL,
    p_business_type VARCHAR(255) DEFAULT NULL,
    p_business_address VARCHAR(255) DEFAULT NULL,
    p_business_city VARCHAR(255) DEFAULT NULL,
    p_business_lat DECIMAL DEFAULT NULL,
    p_business_lng DECIMAL DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
    mapped_business_type business_type;
BEGIN
    -- Map the input business_type string to the enum
    mapped_business_type := 
      CASE 
        WHEN LOWER(p_business_type) LIKE '%bakery%' OR LOWER(p_business_type) LIKE '%bread%' OR LOWER(p_business_type) LIKE '%pastry%' THEN 'bakery'::business_type
        WHEN LOWER(p_business_type) LIKE '%restaurant%' OR LOWER(p_business_type) LIKE '%cafe%' OR LOWER(p_business_type) LIKE '%diner%' THEN 'restaurant'::business_type
        WHEN LOWER(p_business_type) LIKE '%grocery%' OR LOWER(p_business_type) LIKE '%supermarket%' OR LOWER(p_business_type) LIKE '%market%' THEN 'grocery_store'::business_type
        WHEN LOWER(p_business_type) LIKE '%hotel%' OR LOWER(p_business_type) LIKE '%resort%' OR LOWER(p_business_type) LIKE '%lodge%' THEN 'hotel'::business_type
        ELSE 'restaurant'::business_type -- Default fallback
      END;

    -- Insert or update user record (bypasses RLS due to SECURITY DEFINER)
    INSERT INTO users (
        id, email, name, user_type, phone_number, password_hash
    ) VALUES (
        p_id, p_email, p_name, p_user_type::user_type, p_phone_number, ''
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        user_type = EXCLUDED.user_type,
        phone_number = EXCLUDED.phone_number,
        updated_at = NOW();
    
    -- Create customer profile if needed (also use UPSERT)
    IF p_user_type = 'customer' THEN
        INSERT INTO customer_profiles (id) VALUES (p_id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Create shop profile if needed (also use UPSERT)
    IF p_user_type = 'shop' THEN
        INSERT INTO shop_profiles (
            id, 
            business_name, 
            business_type, 
            address, 
            city,
            coordinates
        ) VALUES (
            p_id,
            COALESCE(p_business_name, p_name),
            mapped_business_type,
            COALESCE(p_business_address, ''),
            COALESCE(p_business_city, 'Colombo'),
            CASE 
                WHEN p_business_lat IS NOT NULL AND p_business_lng IS NOT NULL 
                THEN ST_SetSRID(ST_MakePoint(p_business_lng, p_business_lat), 4326)::geography
                ELSE ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)::geography
            END
        )
        ON CONFLICT (id) DO UPDATE SET
            business_name = COALESCE(p_business_name, p_name),
            business_type = mapped_business_type,
            address = COALESCE(p_business_address, shop_profiles.address),
            city = COALESCE(p_business_city, shop_profiles.city),
            coordinates = CASE 
                WHEN p_business_lat IS NOT NULL AND p_business_lng IS NOT NULL 
                THEN ST_SetSRID(ST_MakePoint(p_business_lng, p_business_lat), 4326)::geography
                ELSE shop_profiles.coordinates
            END,
            updated_at = NOW();
    END IF;
    
    -- Get the user record as JSON (also bypasses RLS)
    SELECT row_to_json(u.*) INTO result
    FROM users u
    WHERE u.id = p_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_safe TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_safe TO anon;
