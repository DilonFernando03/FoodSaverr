-- FoodSaverr Supabase Database Schema
-- This schema supports a food waste reduction app connecting customers with shops offering surplus food

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types/enums
CREATE TYPE user_type AS ENUM ('customer', 'shop');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled');
CREATE TYPE bag_category AS ENUM ('meals', 'bread_pastries', 'groceries', 'desserts', 'beverages', 'snacks', 'fresh_produce', 'other');
CREATE TYPE schedule_frequency AS ENUM ('daily', 'weekly', 'custom');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Users table (base table for both customers and shops)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    phone_number VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Customer profiles (extends users table)
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_coordinates GEOGRAPHY(POINT, 4326),
    favorite_categories bag_category[] DEFAULT '{}',
    max_distance_km INTEGER DEFAULT 5,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop profiles (extends users table)
CREATE TABLE shop_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    website_url TEXT,
    
    -- Location information
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Verification
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_documents TEXT[], -- URLs to verification documents
    
    -- Rating
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Settings
    auto_post_bags BOOLEAN DEFAULT false,
    default_bag_quantity INTEGER DEFAULT 5,
    default_discount_percentage INTEGER DEFAULT 60,
    
    -- Notification settings
    notifications_new_orders BOOLEAN DEFAULT true,
    notifications_low_stock BOOLEAN DEFAULT true,
    notifications_reviews BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop operating hours
CREATE TABLE shop_operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shop_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    open_time TIME,
    close_time TIME,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shop_id, day_of_week)
);

-- Surprise bags/shop bags
CREATE TABLE surprise_bags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shop_profiles(id) ON DELETE CASCADE,
    category bag_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2) NOT NULL,
    discount_percentage INTEGER GENERATED ALWAYS AS (
        ROUND(((original_price - discounted_price) / original_price * 100)::numeric, 0)::integer
    ) STORED,
    total_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    
    -- Collection details
    collection_date DATE NOT NULL,
    collection_start_time TIME NOT NULL,
    collection_end_time TIME NOT NULL,
    
    -- Media and tags
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN GENERATED ALWAYS AS (
        is_active AND remaining_quantity > 0 AND collection_date >= CURRENT_DATE
    ) STORED,
    is_popular BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders for surprise bags
CREATE TABLE bag_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id UUID NOT NULL REFERENCES surprise_bags(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10,2) NOT NULL,
    order_status order_status DEFAULT 'pending',
    notes TEXT,
    collection_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer favorites (shops and bags)
CREATE TABLE customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shop_profiles(id) ON DELETE CASCADE,
    bag_id UUID REFERENCES surprise_bags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either shop_id or bag_id is provided, but not both
    CONSTRAINT check_favorite_type CHECK (
        (shop_id IS NOT NULL AND bag_id IS NULL) OR 
        (shop_id IS NULL AND bag_id IS NOT NULL)
    ),
    
    -- Prevent duplicate favorites
    UNIQUE(customer_id, shop_id),
    UNIQUE(customer_id, bag_id)
);

-- Bag schedules (for automated posting)
CREATE TABLE bag_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shop_profiles(id) ON DELETE CASCADE,
    frequency schedule_frequency NOT NULL,
    category bag_category NOT NULL,
    default_title VARCHAR(255) NOT NULL,
    default_description TEXT,
    default_original_price DECIMAL(10,2) NOT NULL,
    default_discount_percentage INTEGER NOT NULL,
    default_quantity INTEGER NOT NULL,
    default_collection_start_time TIME NOT NULL,
    default_collection_end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    next_post_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shop_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES bag_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent multiple reviews for the same order
    UNIQUE(customer_id, order_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'new_order', 'bag_available', 'collection_reminder', etc.
    is_read BOOLEAN DEFAULT false,
    metadata JSONB, -- Additional data specific to notification type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics data (for shops)
CREATE TABLE shop_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shop_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    bags_posted INTEGER DEFAULT 0,
    orders_received INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    bags_sold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shop_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_customer_profiles_coordinates ON customer_profiles USING GIST(address_coordinates);
CREATE INDEX idx_shop_profiles_coordinates ON shop_profiles USING GIST(coordinates);
CREATE INDEX idx_shop_profiles_verification ON shop_profiles(verification_status);
CREATE INDEX idx_surprise_bags_shop_id ON surprise_bags(shop_id);
CREATE INDEX idx_surprise_bags_category ON surprise_bags(category);
CREATE INDEX idx_surprise_bags_collection_date ON surprise_bags(collection_date);
CREATE INDEX idx_surprise_bags_is_available ON surprise_bags(is_available) WHERE is_available = true;
CREATE INDEX idx_bag_orders_customer_id ON bag_orders(customer_id);
CREATE INDEX idx_bag_orders_bag_id ON bag_orders(bag_id);
CREATE INDEX idx_bag_orders_status ON bag_orders(order_status);
CREATE INDEX idx_customer_favorites_customer_id ON customer_favorites(customer_id);
CREATE INDEX idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_shop_analytics_shop_date ON shop_analytics(shop_id, date);

-- Create functions and triggers for automatic updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_profiles_updated_at BEFORE UPDATE ON shop_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surprise_bags_updated_at BEFORE UPDATE ON surprise_bags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bag_orders_updated_at BEFORE UPDATE ON bag_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bag_schedules_updated_at BEFORE UPDATE ON bag_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update shop rating when new review is added
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shop_profiles 
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE shop_id = NEW.shop_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE shop_id = NEW.shop_id
        )
    WHERE id = NEW.shop_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update shop rating on review insert/update/delete
CREATE TRIGGER update_shop_rating_on_review_insert AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_shop_rating();
CREATE TRIGGER update_shop_rating_on_review_update AFTER UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_shop_rating();
CREATE TRIGGER update_shop_rating_on_review_delete AFTER DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

-- Function to update remaining quantity when order is placed
CREATE OR REPLACE FUNCTION update_bag_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_status = 'confirmed' AND (OLD.order_status IS NULL OR OLD.order_status != 'confirmed') THEN
        UPDATE surprise_bags 
        SET remaining_quantity = remaining_quantity - NEW.quantity
        WHERE id = NEW.bag_id;
    ELSIF OLD.order_status = 'confirmed' AND NEW.order_status != 'confirmed' THEN
        UPDATE surprise_bags 
        SET remaining_quantity = remaining_quantity + NEW.quantity
        WHERE id = NEW.bag_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update bag quantity on order status change
CREATE TRIGGER update_bag_quantity_on_order_change AFTER INSERT OR UPDATE ON bag_orders FOR EACH ROW EXECUTE FUNCTION update_bag_quantity();

-- Function to create daily analytics entry
CREATE OR REPLACE FUNCTION create_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO shop_analytics (shop_id, date, bags_posted, orders_received, revenue, bags_sold)
    VALUES (NEW.shop_id, CURRENT_DATE, 0, 0, 0, 0)
    ON CONFLICT (shop_id, date) DO NOTHING;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE surprise_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bag_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bag_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Customer profiles policies
CREATE POLICY "Customers can view own profile" ON customer_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customers can update own profile" ON customer_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Customers can insert own profile" ON customer_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shop profiles policies (public read for discovery, own write)
CREATE POLICY "Anyone can view verified shops" ON shop_profiles FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "Shops can view own profile" ON shop_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Shops can update own profile" ON shop_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Shops can insert own profile" ON shop_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shop operating hours policies
CREATE POLICY "Anyone can view shop hours" ON shop_operating_hours FOR SELECT USING (
    EXISTS (SELECT 1 FROM shop_profiles WHERE id = shop_id AND verification_status = 'verified')
);
CREATE POLICY "Shops can manage own hours" ON shop_operating_hours FOR ALL USING (
    auth.uid() = shop_id
);

-- Surprise bags policies (public read, shop write)
CREATE POLICY "Anyone can view available bags" ON surprise_bags FOR SELECT USING (
    is_available = true AND 
    EXISTS (SELECT 1 FROM shop_profiles WHERE id = shop_id AND verification_status = 'verified')
);
CREATE POLICY "Shops can manage own bags" ON surprise_bags FOR ALL USING (
    auth.uid() = shop_id
);

-- Bag orders policies
CREATE POLICY "Customers can view own orders" ON bag_orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Shops can view orders for their bags" ON bag_orders FOR SELECT USING (
    auth.uid() IN (SELECT shop_id FROM surprise_bags WHERE id = bag_id)
);
CREATE POLICY "Customers can create orders" ON bag_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own orders" ON bag_orders FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Shops can update orders for their bags" ON bag_orders FOR UPDATE USING (
    auth.uid() IN (SELECT shop_id FROM surprise_bags WHERE id = bag_id)
);

-- Customer favorites policies
CREATE POLICY "Customers can manage own favorites" ON customer_favorites FOR ALL USING (auth.uid() = customer_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO authenticated;
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = customer_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Shop analytics policies
CREATE POLICY "Shops can view own analytics" ON shop_analytics FOR SELECT USING (auth.uid() = shop_id);

-- Sample data insertion (optional - for testing)
-- Note: This would typically be done through your application, not in the schema

-- Create some sample users (passwords would be hashed in real implementation)
INSERT INTO users (id, email, password_hash, name, user_type, phone_number) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'customer@example.com', '$2b$10$example_hash', 'Jane Doe', 'customer', '+94771234567'),
    ('550e8400-e29b-41d4-a716-446655440002', 'shop@example.com', '$2b$10$example_hash', 'Johns Bakery', 'shop', '+94771234568');

-- Create sample customer profile
INSERT INTO customer_profiles (id, address_street, address_city, address_postal_code, address_coordinates, favorite_categories) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '456 Oak Avenue', 'Colombo', '00300', ST_Point(79.8612, 6.9271), ARRAY['meals', 'bread_pastries']::bag_category[]);

-- Create sample shop profile
INSERT INTO shop_profiles (id, business_name, business_type, description, address, city, postal_code, coordinates, verification_status, verified_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Johns Bakery', 'Bakery', 'Fresh baked goods daily', '123 Main Street', 'Colombo', '00100', ST_Point(79.8612, 6.9271), 'verified', NOW());

-- Create sample operating hours
INSERT INTO shop_operating_hours (shop_id, day_of_week, open_time, close_time, is_open) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 1, '07:00', '19:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 2, '07:00', '19:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 3, '07:00', '19:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 4, '07:00', '19:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 5, '07:00', '19:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 6, '08:00', '18:00', true),
    ('550e8400-e29b-41d4-a716-446655440002', 0, '09:00', '17:00', true);

-- Create sample surprise bag
INSERT INTO surprise_bags (shop_id, category, title, description, original_price, discounted_price, total_quantity, remaining_quantity, collection_date, collection_start_time, collection_end_time, tags) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'bread_pastries', 'Bread & Cookies', 'Fresh bread and cookies that need to go today', 600.00, 220.00, 5, 5, CURRENT_DATE + INTERVAL '1 day', '09:30', '10:00', ARRAY['bread', 'cookies', 'bakery']);
