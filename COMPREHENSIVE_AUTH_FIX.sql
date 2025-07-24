-- COMPREHENSIVE AUTH FIX
-- This addresses the most likely causes of auth loops

-- 1. First, let's clean up any problematic functions or triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role CASCADE;

-- 2. Create safe utility functions
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email = 'contact.exclusivelex@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- 3. Check if there are any problematic triggers (read-only)
SELECT 
  'Checking for problematic triggers' as info,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 4. Verify our functions work
SELECT 
  'Auth functions created successfully' as status,
  public.is_admin('contact.exclusivelex@gmail.com') as admin_check,
  public.get_user_role('contact.exclusivelex@gmail.com') as admin_role,
  public.is_admin('test@example.com') as user_check,
  public.get_user_role('test@example.com') as user_role; 