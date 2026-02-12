-- BackTrack Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- ITEMS TABLE
-- ============================================
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    date_lost DATE NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'lost', 'found', 'claimed')),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    finder_name VARCHAR(255),
    submitted_by UUID REFERENCES auth.users(id),
    ai_tags TEXT[],
    ai_caption TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CATEGORIES TABLE (optional, for dynamic categories)
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50)
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
    ('Electronics', 'laptop'),
    ('Clothing', 'shirt'),
    ('Bottles', 'cup'),
    ('Books', 'book'),
    ('Accessories', 'watch'),
    ('Bags', 'briefcase'),
    ('Keys', 'key'),
    ('Other', 'box');

-- ============================================
-- LOCATIONS TABLE (optional, for dynamic locations)
-- ============================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    building VARCHAR(100),
    floor VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Insert default locations
INSERT INTO locations (name, building) VALUES
    ('Gym', 'Athletic Center'),
    ('Library', 'Main Library'),
    ('Cafeteria', 'Student Center'),
    ('Science Lab', 'Science Building'),
    ('Computer Lab', 'Technology Center'),
    ('Main Office', 'Administration Building'),
    ('Parking Lot', 'Outdoor'),
    ('Auditorium', 'Performing Arts Center');

-- ============================================
-- CLAIMS TABLE (for tracking item claims)
-- ============================================
CREATE TABLE claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    claimer_id UUID REFERENCES auth.users(id),
    claimer_email VARCHAR(255) NOT NULL,
    claimer_name VARCHAR(255),
    claimer_phone VARCHAR(20),
    proof_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADMINS TABLE (for moderating items/claims)
-- ============================================
CREATE TABLE admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own row" ON admins
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read items
CREATE POLICY "Items are viewable by everyone" ON items
    FOR SELECT USING (true);

-- Allow authenticated users to insert items
CREATE POLICY "Authenticated users can insert items" ON items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own items
CREATE POLICY "Users can update own items" ON items
    FOR UPDATE USING (auth.uid() = submitted_by);

-- Allow admins to update any items
CREATE POLICY "Admins can update items" ON items
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins));

-- Allow users to delete their own items
CREATE POLICY "Users can delete own items" ON items
    FOR DELETE USING (auth.uid() = submitted_by);

-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own claims
CREATE POLICY "Users can view own claims" ON claims
    FOR SELECT USING (auth.uid() = claimer_id);

-- Allow admins to view all claims
CREATE POLICY "Admins can view claims" ON claims
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

-- Allow authenticated users to create claims
CREATE POLICY "Authenticated users can create claims" ON claims
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to update claims
CREATE POLICY "Admins can update claims" ON claims
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_location ON items(location);
CREATE INDEX idx_items_date_lost ON items(date_lost);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_embedding ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- SEMANTIC SEARCH FUNCTION (VECTOR)
-- ============================================
CREATE OR REPLACE FUNCTION search_items(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 30,
    filter_category TEXT[] DEFAULT NULL,
    filter_location TEXT DEFAULT NULL,
    filter_start_date DATE DEFAULT NULL,
    filter_end_date DATE DEFAULT NULL,
    filter_status TEXT[] DEFAULT '{"found", "claimed"}'
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    location VARCHAR,
    date_lost DATE,
    image_url TEXT,
    status VARCHAR,
    contact_email VARCHAR,
    contact_phone VARCHAR,
    finder_name VARCHAR,
    submitted_by UUID,
    ai_tags TEXT[],
    ai_caption TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT
        items.id,
        items.name,
        items.description,
        items.category,
        items.location,
        items.date_lost,
        items.image_url,
        items.status,
        items.contact_email,
        items.contact_phone,
        items.finder_name,
        items.submitted_by,
        items.ai_tags,
        items.ai_caption,
        items.created_at,
        items.updated_at,
        1 - (items.embedding <=> query_embedding) AS similarity
    FROM items
    WHERE items.embedding IS NOT NULL
      AND (filter_category IS NULL OR items.category = ANY(filter_category))
      AND (filter_location IS NULL OR filter_location = 'All Locations' OR items.location = filter_location)
      AND (filter_start_date IS NULL OR items.date_lost >= filter_start_date)
      AND (filter_end_date IS NULL OR items.date_lost <= filter_end_date)
      AND (filter_status IS NULL OR items.status = ANY(filter_status))
    ORDER BY items.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================
-- Run this in the Supabase Dashboard under Storage:
-- 1. Create a new bucket called "images"
-- 2. Make it public
-- 3. Add policy to allow authenticated users to upload

-- Or run this SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policy for uploads (authenticated users only)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Storage policy for public viewing
CREATE POLICY "Anyone can view images"
USING (bucket_id = 'images');

-- ============================================
-- REDEMPTIONS TABLE (for claiming rewards)
-- ============================================
CREATE TABLE redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    reward_name VARCHAR(255) NOT NULL,
    points_cost INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for redemptions
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON redemptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

