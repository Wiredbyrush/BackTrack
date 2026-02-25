-- BackTrack admin rewards migration
-- Run this in Supabase SQL Editor for existing projects.

-- Ensure updated_at helper exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Reward catalog table
CREATE TABLE IF NOT EXISTS reward_catalog (
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reward_catalog' AND policyname = 'Anyone can view active rewards'
    ) THEN
        CREATE POLICY "Anyone can view active rewards" ON reward_catalog
            FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reward_catalog' AND policyname = 'Admins can view all rewards'
    ) THEN
        CREATE POLICY "Admins can view all rewards" ON reward_catalog
            FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reward_catalog' AND policyname = 'Admins can insert rewards'
    ) THEN
        CREATE POLICY "Admins can insert rewards" ON reward_catalog
            FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reward_catalog' AND policyname = 'Admins can update rewards'
    ) THEN
        CREATE POLICY "Admins can update rewards" ON reward_catalog
            FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins))
            WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'reward_catalog' AND policyname = 'Admins can delete rewards'
    ) THEN
        CREATE POLICY "Admins can delete rewards" ON reward_catalog
            FOR DELETE USING (auth.uid() IN (SELECT user_id FROM admins));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_reward_catalog_active_cost ON reward_catalog(is_active, points_cost);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_reward_catalog_updated_at'
          AND tgrelid = 'public.reward_catalog'::regclass
    ) THEN
        CREATE TRIGGER update_reward_catalog_updated_at
            BEFORE UPDATE ON reward_catalog
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- Redemptions admin visibility and moderation
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'redemptions' AND policyname = 'Admins can view all redemptions'
    ) THEN
        CREATE POLICY "Admins can view all redemptions" ON redemptions
            FOR SELECT USING (auth.uid() IN (SELECT user_id FROM admins));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'redemptions' AND policyname = 'Admins can update redemptions'
    ) THEN
        CREATE POLICY "Admins can update redemptions" ON redemptions
            FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM admins))
            WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));
    END IF;
END;
$$;

-- Ensure item status allows bounty workflow
DO $$
DECLARE
    existing_constraint text;
BEGIN
    SELECT c.conname
    INTO existing_constraint
    FROM pg_constraint c
    WHERE c.conrelid = 'public.items'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%';

    IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.items DROP CONSTRAINT %I', existing_constraint);
    END IF;

    BEGIN
        ALTER TABLE public.items
            ADD CONSTRAINT items_status_check
            CHECK (status IN ('pending', 'lost', 'found', 'claimed', 'bounty'));
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END;
$$;
