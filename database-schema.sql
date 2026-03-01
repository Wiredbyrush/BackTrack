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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'lost', 'found', 'claimed', 'bounty')),
    is_bounty BOOLEAN DEFAULT FALSE,
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
-- MAP TABLES (Denmark HS layout + alias mapping)
-- ============================================
CREATE TABLE map_rooms (
    id BIGSERIAL PRIMARY KEY,
    school VARCHAR(120) NOT NULL DEFAULT 'Denmark High School',
    floor SMALLINT NOT NULL CHECK (floor IN (0, 1, 2)),
    room_id VARCHAR(20) NOT NULL,
    name VARCHAR(120) NOT NULL,
    room_type VARCHAR(60) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    w INTEGER NOT NULL,
    h INTEGER NOT NULL,
    clickable BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    UNIQUE (school, floor, room_id)
);

CREATE TABLE map_location_aliases (
    id BIGSERIAL PRIMARY KEY,
    school VARCHAR(120) NOT NULL DEFAULT 'Denmark High School',
    alias VARCHAR(120) NOT NULL,
    room_id VARCHAR(20) NOT NULL,
    UNIQUE (school, alias)
);

-- Alias seed data used by map.html location parser.
INSERT INTO map_location_aliases (school, alias, room_id) VALUES
    ('Denmark High School', 'main office', 'ADM'),
    ('Denmark High School', 'attendance', 'ATT'),
    ('Denmark High School', 'counseling', 'CNS'),
    ('Denmark High School', 'clinic', 'CLN'),
    ('Denmark High School', 'media center', 'LIB'),
    ('Denmark High School', 'media commons', 'MCF'),
    ('Denmark High School', 'library', 'LIB'),
    ('Denmark High School', 'cafeteria', 'CAF'),
    ('Denmark High School', 'commons', 'COM'),
    ('Denmark High School', 'auditorium', 'AUD'),
    ('Denmark High School', 'band room', 'BND'),
    ('Denmark High School', 'chorus room', 'CHR'),
    ('Denmark High School', 'engineering lab', 'ENG'),
    ('Denmark High School', 'broadcast studio', 'BRD'),
    ('Denmark High School', 'main gym', 'GYM'),
    ('Denmark High School', 'aux gym', 'AUX'),
    ('Denmark High School', 'weight room', 'WT'),
    ('Denmark High School', 'locker room a', 'LK1'),
    ('Denmark High School', 'locker room b', 'LK2'),
    ('Denmark High School', 'biology lab', 'BIO'),
    ('Denmark High School', 'chemistry lab', 'CHEM'),
    ('Denmark High School', 'physics lab', 'PHYS'),
    ('Denmark High School', 'computer lab a', 'CL1'),
    ('Denmark High School', 'computer lab b', 'CL2'),
    ('Denmark High School', 'mac lab', 'CL3'),
    ('Denmark High School', 'teacher lounge', 'TLC'),
    ('Denmark High School', 'collaboration hub', 'COL'),
    ('Denmark High School', 'stadium', 'STADIUM'),
    ('Denmark High School', 'tennis courts', 'TENNIS'),
    ('Denmark High School', 'baseball field', 'BASE'),
    ('Denmark High School', 'softball field', 'SOFT'),
    ('Denmark High School', 'field house', 'FIELD'),
    ('Denmark High School', 'the barn', 'BARN')
ON CONFLICT (school, alias) DO NOTHING;

-- Denmark map room seed data.
INSERT INTO map_rooms (school, floor, room_id, name, room_type, x, y, w, h, clickable, sort_order) VALUES
    ('Denmark High School', 0, 'BUS', 'Bus Loop', 'Road', 30, 60, 220, 90, false, 1),
    ('Denmark High School', 0, 'VISPK', 'Visitor Parking', 'Parking', 30, 160, 220, 120, false, 2),
    ('Denmark High School', 0, 'STUPK', 'Student Parking', 'Parking', 30, 285, 220, 210, false, 3),
    ('Denmark High School', 0, 'MAIN', 'Main Building', 'Building', 275, 155, 320, 360, true, 4),
    ('Denmark High School', 0, 'ENTRY', 'Entry Plaza', 'Facility', 360, 120, 150, 34, false, 5),
    ('Denmark High School', 0, 'ROAD1', 'Mullinax Dr Entrance', 'Road', 250, 120, 640, 24, false, 6),
    ('Denmark High School', 0, 'ROAD2', 'Campus Spine', 'Road', 565, 144, 24, 390, false, 7),
    ('Denmark High School', 0, 'STADIUM', 'Stadium', 'Athletic', 620, 30, 250, 160, false, 8),
    ('Denmark High School', 0, 'TRACK', 'Track', 'Athletic', 875, 50, 95, 130, false, 9),
    ('Denmark High School', 0, 'TENNIS', 'Tennis Courts', 'Athletic', 620, 205, 250, 108, false, 10),
    ('Denmark High School', 0, 'BASE', 'Baseball Field', 'Athletic', 620, 330, 190, 170, false, 11),
    ('Denmark High School', 0, 'SOFT', 'Softball Field', 'Athletic', 815, 330, 155, 150, false, 12),
    ('Denmark High School', 0, 'BARN', 'The Barn', 'Facility', 300, 530, 130, 90, false, 13),
    ('Denmark High School', 0, 'FIELD', 'Field House', 'Athletic', 830, 510, 140, 96, false, 14),
    ('Denmark High School', 1, 'ADM', 'Main Office', 'Administration', 60, 52, 130, 96, false, 1),
    ('Denmark High School', 1, 'ATT', 'Attendance', 'Administration', 190, 52, 120, 96, false, 2),
    ('Denmark High School', 1, 'CNS', 'Counseling', 'Administration', 310, 52, 130, 96, false, 3),
    ('Denmark High School', 1, 'CLN', 'Clinic', 'Medical', 440, 52, 130, 96, false, 4),
    ('Denmark High School', 1, 'STA1', 'Stairwell West', 'Facilities', 570, 52, 78, 96, false, 5),
    ('Denmark High School', 1, 'MCF', 'Media Commons', 'Academic', 648, 52, 262, 96, false, 6),
    ('Denmark High School', 1, 'H1S', 'Main Spine', 'Corridor', 60, 160, 850, 38, false, 7),
    ('Denmark High School', 1, '101', 'Room 101', 'Classroom', 60, 202, 120, 92, false, 8),
    ('Denmark High School', 1, '102', 'Room 102', 'Classroom', 180, 202, 120, 92, false, 9),
    ('Denmark High School', 1, '103', 'Room 103', 'Classroom', 300, 202, 120, 92, false, 10),
    ('Denmark High School', 1, '104', 'Room 104', 'Classroom', 420, 202, 120, 92, false, 11),
    ('Denmark High School', 1, 'COM', 'Student Commons', 'Common Area', 540, 202, 370, 122, false, 12),
    ('Denmark High School', 1, 'H1W', 'West Hall', 'Corridor', 60, 296, 480, 30, false, 13),
    ('Denmark High School', 1, '105', 'Room 105', 'Classroom', 60, 330, 120, 90, false, 14),
    ('Denmark High School', 1, '106', 'Room 106', 'Classroom', 180, 330, 120, 90, false, 15),
    ('Denmark High School', 1, '107', 'Room 107', 'Classroom', 300, 330, 120, 90, false, 16),
    ('Denmark High School', 1, '108', 'Room 108', 'Classroom', 420, 330, 120, 90, false, 17),
    ('Denmark High School', 1, 'ENG', 'Engineering Lab', 'CTAE', 540, 338, 180, 82, false, 18),
    ('Denmark High School', 1, 'BRD', 'Broadcast Studio', 'CTAE', 720, 338, 190, 82, false, 19),
    ('Denmark High School', 1, 'H1A', 'Arts Corridor', 'Corridor', 540, 422, 370, 30, false, 20),
    ('Denmark High School', 1, 'AUD', 'Auditorium', 'Performance', 540, 456, 220, 124, false, 21),
    ('Denmark High School', 1, 'BND', 'Band Room', 'Elective', 760, 456, 150, 58, false, 22),
    ('Denmark High School', 1, 'CHR', 'Chorus Room', 'Elective', 760, 522, 150, 58, false, 23),
    ('Denmark High School', 1, 'CAF', 'Cafeteria', 'Dining', 60, 456, 220, 124, false, 24),
    ('Denmark High School', 1, 'KIT', 'Kitchen', 'Dining', 280, 456, 90, 124, false, 25),
    ('Denmark High School', 1, 'GYM', 'Main Gym', 'Athletic', 370, 456, 220, 124, false, 26),
    ('Denmark High School', 1, 'AUX', 'Aux Gym', 'Athletic', 600, 456, 140, 124, false, 27),
    ('Denmark High School', 1, 'WT', 'Weight Room', 'Athletic', 740, 456, 90, 58, false, 28),
    ('Denmark High School', 1, 'LK1', 'Locker Room A', 'Athletic', 830, 456, 80, 58, false, 29),
    ('Denmark High School', 1, 'LK2', 'Locker Room B', 'Athletic', 740, 522, 170, 58, false, 30),
    ('Denmark High School', 2, 'BIO', 'Biology Lab', 'Science', 60, 52, 170, 96, false, 1),
    ('Denmark High School', 2, 'CHEM', 'Chemistry Lab', 'Science', 230, 52, 170, 96, false, 2),
    ('Denmark High School', 2, 'PHYS', 'Physics Lab', 'Science', 400, 52, 170, 96, false, 3),
    ('Denmark High School', 2, 'SCI4', 'Science Prep', 'Science', 570, 52, 120, 96, false, 4),
    ('Denmark High School', 2, 'STA2', 'Stairwell East', 'Facilities', 690, 52, 70, 96, false, 5),
    ('Denmark High School', 2, 'LIB', 'Media Center', 'Academic', 760, 52, 150, 96, false, 6),
    ('Denmark High School', 2, 'H2S', 'Main Spine', 'Corridor', 60, 160, 850, 38, false, 7),
    ('Denmark High School', 2, '201', 'Room 201', 'Classroom', 60, 202, 120, 90, false, 8),
    ('Denmark High School', 2, '202', 'Room 202', 'Classroom', 180, 202, 120, 90, false, 9),
    ('Denmark High School', 2, '203', 'Room 203', 'Classroom', 300, 202, 120, 90, false, 10),
    ('Denmark High School', 2, '204', 'Room 204', 'Classroom', 420, 202, 120, 90, false, 11),
    ('Denmark High School', 2, '205', 'Room 205', 'Classroom', 540, 202, 120, 90, false, 12),
    ('Denmark High School', 2, 'CL1', 'Computer Lab A', 'Technology', 660, 202, 120, 90, false, 13),
    ('Denmark High School', 2, 'CL2', 'Computer Lab B', 'Technology', 780, 202, 130, 90, false, 14),
    ('Denmark High School', 2, 'H2M', 'Middle Hall', 'Corridor', 60, 294, 850, 30, false, 15),
    ('Denmark High School', 2, '206', 'Room 206', 'Classroom', 60, 328, 120, 90, false, 16),
    ('Denmark High School', 2, '207', 'Room 207', 'Classroom', 180, 328, 120, 90, false, 17),
    ('Denmark High School', 2, '208', 'Room 208', 'Classroom', 300, 328, 120, 90, false, 18),
    ('Denmark High School', 2, '209', 'Room 209', 'Classroom', 420, 328, 120, 90, false, 19),
    ('Denmark High School', 2, 'WL1', 'World Language 1', 'Classroom', 540, 328, 120, 90, false, 20),
    ('Denmark High School', 2, 'WL2', 'World Language 2', 'Classroom', 660, 328, 120, 90, false, 21),
    ('Denmark High School', 2, 'CL3', 'Mac Lab', 'Technology', 780, 328, 130, 90, false, 22),
    ('Denmark High School', 2, 'H2L', 'Lower Hall', 'Corridor', 60, 420, 850, 30, false, 23),
    ('Denmark High School', 2, '210', 'Room 210', 'Classroom', 60, 454, 120, 90, false, 24),
    ('Denmark High School', 2, '211', 'Room 211', 'Classroom', 180, 454, 120, 90, false, 25),
    ('Denmark High School', 2, '212', 'Room 212', 'Classroom', 300, 454, 120, 90, false, 26),
    ('Denmark High School', 2, '213', 'Room 213', 'Classroom', 420, 454, 120, 90, false, 27),
    ('Denmark High School', 2, '214', 'Room 214', 'Classroom', 540, 454, 120, 90, false, 28),
    ('Denmark High School', 2, 'COL', 'Collaboration Hub', 'Academic', 660, 454, 120, 90, false, 29),
    ('Denmark High School', 2, 'TLC', 'Teacher Lounge', 'Staff', 780, 454, 130, 90, false, 30)
ON CONFLICT (school, floor, room_id) DO NOTHING;

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
    FOR UPDATE 
    USING (auth.jwt()->>'email' IN (SELECT email FROM admins))
    WITH CHECK (auth.jwt()->>'email' IN (SELECT email FROM admins));

-- Allow users to delete their own items
CREATE POLICY "Users can delete own items" ON items
    FOR DELETE USING (auth.uid() = submitted_by);

-- Allow admins to delete any items
CREATE POLICY "Admins can delete items" ON items
    FOR DELETE USING (auth.jwt()->>'email' IN (SELECT email FROM admins));

-- Enable RLS on map tables
ALTER TABLE map_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_location_aliases ENABLE ROW LEVEL SECURITY;

-- Map data is read-only for clients (managed by admins/service role)
CREATE POLICY "Map rooms are viewable by everyone" ON map_rooms
    FOR SELECT USING (true);

CREATE POLICY "Map aliases are viewable by everyone" ON map_location_aliases
    FOR SELECT USING (true);

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
CREATE INDEX idx_map_rooms_school_floor ON map_rooms(school, floor);
CREATE INDEX idx_map_aliases_school_alias ON map_location_aliases(school, alias);

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

-- ============================================
-- REWARD CATALOG TABLE (admin-managed prizes)
-- ============================================
CREATE TABLE reward_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL DEFAULT 'other',
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    stock INTEGER CHECK (stock IS NULL OR stock >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards" ON reward_catalog
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all rewards" ON reward_catalog
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can insert rewards" ON reward_catalog
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can update rewards" ON reward_catalog
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can delete rewards" ON reward_catalog
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE INDEX idx_reward_catalog_active_cost ON reward_catalog(is_active, points_cost);

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_catalog_updated_at
    BEFORE UPDATE ON reward_catalog
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
ON storage.objects FOR SELECT
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

CREATE POLICY "Admins can view all redemptions" ON redemptions
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Users can insert own redemptions" ON redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update redemptions" ON redemptions
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));

-- ============================================
-- ADMIN MESSAGES TABLE (for dashboard messaging)
-- ============================================
CREATE TABLE admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id),
    sender_email VARCHAR(255),
    recipient_type VARCHAR(32) NOT NULL,
    recipient_value VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Admins can read/send dashboard messages.
CREATE POLICY "Admins can view admin messages" ON admin_messages
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));

CREATE POLICY "Admins can insert admin messages" ON admin_messages
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));

CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at DESC);
