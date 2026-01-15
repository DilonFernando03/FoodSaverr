-- Migration to add chain support for shops
-- This allows multiple shop locations with the same brand to have separate logins
-- while sharing common branding information

-- Create shop_chains table for chain-level information (optional)
-- This stores shared branding and information for chains
CREATE TABLE IF NOT EXISTS shop_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    website_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add chain support columns to shop_profiles
ALTER TABLE shop_profiles 
ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES shop_chains(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255); -- e.g., "Downtown Location", "Mall Branch", "Store #1"

-- Create index for chain lookups
CREATE INDEX IF NOT EXISTS idx_shop_profiles_chain_id ON shop_profiles(chain_id);

-- Create index for business name lookups (useful for finding all locations of a chain)
CREATE INDEX IF NOT EXISTS idx_shop_profiles_business_name ON shop_profiles(business_name);

-- Add trigger to update updated_at for shop_chains
CREATE TRIGGER update_shop_chains_updated_at 
BEFORE UPDATE ON shop_chains 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for shop_chains
ALTER TABLE shop_chains ENABLE ROW LEVEL SECURITY;

-- Anyone can view verified chains (chains with at least one verified shop)
CREATE POLICY "Anyone can view verified chains" ON shop_chains FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shop_profiles 
        WHERE shop_profiles.chain_id = shop_chains.id 
        AND shop_profiles.verification_status = 'verified'
    )
);

-- Shops can view chains they belong to
CREATE POLICY "Shops can view own chain" ON shop_chains FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM shop_profiles 
        WHERE shop_profiles.chain_id = shop_chains.id 
        AND shop_profiles.id = auth.uid()
    )
);

-- Only admins or shops in the chain can update (for now, allow shops to update their chain)
-- In production, you might want to restrict this to chain admins
CREATE POLICY "Shops can update own chain" ON shop_chains FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM shop_profiles 
        WHERE shop_profiles.chain_id = shop_chains.id 
        AND shop_profiles.id = auth.uid()
    )
);

-- Comments explaining the structure
COMMENT ON TABLE shop_chains IS 'Stores chain-level information for shops that belong to a chain/brand';
COMMENT ON COLUMN shop_profiles.chain_id IS 'Optional reference to shop_chains table. NULL for independent shops.';
COMMENT ON COLUMN shop_profiles.location_name IS 'Optional name to distinguish this location (e.g., "Downtown", "Mall Branch"). If NULL, business_name is used.';
COMMENT ON COLUMN shop_profiles.business_name IS 'The business/brand name. Can be duplicated across multiple locations.';





