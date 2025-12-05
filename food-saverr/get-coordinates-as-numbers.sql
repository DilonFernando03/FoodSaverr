-- SQL helper to extract coordinates as numbers from PostGIS geography
-- This provides an alternative to hex WKB parsing in JavaScript

-- Option 1: Create a view that includes coordinates as numbers
-- This allows direct SELECT queries without parsing hex
CREATE OR REPLACE VIEW shop_profiles_with_coords AS
SELECT 
  sp.*,
  ST_Y(sp.coordinates::geometry) AS latitude,
  ST_X(sp.coordinates::geometry) AS longitude
FROM shop_profiles sp;

-- Grant select on view
GRANT SELECT ON shop_profiles_with_coords TO authenticated;
GRANT SELECT ON shop_profiles_with_coords TO anon;

-- Option 2: RPC function to get coordinates for a specific shop
CREATE OR REPLACE FUNCTION get_shop_coordinates(shop_id_param UUID)
RETURNS TABLE(latitude DOUBLE PRECISION, longitude DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(sp.coordinates::geometry) AS latitude,
    ST_X(sp.coordinates::geometry) AS longitude
  FROM shop_profiles sp
  WHERE sp.id = shop_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_shop_coordinates TO authenticated;
GRANT EXECUTE ON FUNCTION get_shop_coordinates TO anon;

-- Note: The JavaScript code will still parse hex WKB as fallback,
-- but you can optionally modify queries to use this view instead

