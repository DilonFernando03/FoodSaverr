-- Migration: Add Stripe payment fields to support payment processing
-- Run this in your Supabase SQL Editor

-- Add Stripe account ID to shop_profiles (for Stripe Connect)
ALTER TABLE shop_profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_account_enabled BOOLEAN DEFAULT false;

-- Add payment fields to bag_orders
ALTER TABLE bag_orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS shop_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Create index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_bag_orders_payment_intent ON bag_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bag_orders_payment_status ON bag_orders(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN shop_profiles.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN bag_orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID for this order';
COMMENT ON COLUMN bag_orders.platform_fee IS 'Platform fee (30% of total)';
COMMENT ON COLUMN bag_orders.shop_amount IS 'Amount going to shop (70% of total)';



