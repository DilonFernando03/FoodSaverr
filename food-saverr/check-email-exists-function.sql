-- Function to check if an email exists in auth.users
-- This function can be called from the client to check email existence
-- before attempting signup

CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists BOOLEAN := FALSE;
BEGIN
  -- Check in auth.users (requires SECURITY DEFINER to access auth schema)
  SELECT EXISTS(
    SELECT 1 
    FROM auth.users 
    WHERE email = LOWER(TRIM(p_email))
  ) INTO email_exists;
  
  -- Also check in our users table
  IF NOT email_exists THEN
    SELECT EXISTS(
      SELECT 1 
      FROM public.users 
      WHERE email = LOWER(TRIM(p_email))
    ) INTO email_exists;
  END IF;
  
  RETURN email_exists;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;












