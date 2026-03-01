-- Grant admin access to AnithSascy09@gmail.com
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
    target_email TEXT := lower('AnithSascy09@gmail.com');
    target_user_id UUID;
BEGIN
    SELECT id
    INTO target_user_id
    FROM auth.users
    WHERE lower(email) = target_email
    LIMIT 1;

    IF EXISTS (
        SELECT 1
        FROM public.admins
        WHERE lower(email) = target_email
    ) THEN
        UPDATE public.admins
        SET
            email = target_email,
            user_id = COALESCE(user_id, target_user_id)
        WHERE lower(email) = target_email;
    ELSE
        INSERT INTO public.admins (user_id, email)
        VALUES (target_user_id, target_email);
    END IF;
END;
$$;
