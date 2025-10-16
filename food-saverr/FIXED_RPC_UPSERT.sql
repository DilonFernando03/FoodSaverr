-- FIXED RPC SOLUTION: Function that uses UPSERT to handle existing users
-- This completely bypasses RLS for both creation and retrieval

-- Drop existing function
DROP FUNCTION IF EXISTS create_user_safe(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR);

-- Create function that creates OR updates user and returns the data
CREATE OR REPLACE FUNCTION create_user_safe(
    p_id UUID,
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_user_type VARCHAR(10),
    p_phone_number VARCHAR(20) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
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
