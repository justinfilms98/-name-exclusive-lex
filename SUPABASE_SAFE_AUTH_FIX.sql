-- SUPABASE SAFE AUTH FIX
-- This works within Supabase's permission constraints

-- First, let's check what policies exist on auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Create a simple function to check if user exists (safe to run)
CREATE OR REPLACE FUNCTION public.check_user_exists(user_email text)
RETURNS boolean AS $$
BEGIN
  -- This is a safe way to check if a user exists without modifying auth.users
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user role (safe to run)
CREATE OR REPLACE FUNCTION public.get_user_role(user_email text)
RETURNS text AS $$
BEGIN
  IF user_email = 'contact.exclusivelex@gmail.com' THEN
    RETURN 'admin';
  ELSE
    RETURN 'user';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the functions work
SELECT 
  'Safe auth functions created successfully' as status,
  public.check_user_exists('contact.exclusivelex@gmail.com') as admin_exists,
  public.get_user_role('contact.exclusivelex@gmail.com') as admin_role; 