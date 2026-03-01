-- BackTrack admin-only item deletion migration
-- Run this in Supabase SQL Editor for existing projects.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'items'
          AND policyname = 'Users can delete own items'
    ) THEN
        DROP POLICY "Users can delete own items" ON public.items;
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'items'
          AND policyname = 'Admins can delete items'
    ) THEN
        DROP POLICY "Admins can delete items" ON public.items;
    END IF;
END;
$$;

CREATE POLICY "Admins can delete items" ON public.items
    FOR DELETE USING (
        auth.uid() IN (SELECT user_id FROM public.admins)
        OR auth.jwt()->>'email' IN (SELECT email FROM public.admins WHERE email IS NOT NULL)
    );
