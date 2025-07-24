-- DIAGNOSE AUTH ISSUE
-- This script helps identify what's causing the auth loop

-- Check if we can read auth.users (this should work)
SELECT 
  'Can read auth.users' as test,
  COUNT(*) as user_count
FROM auth.users;

-- Check what policies exist on auth.users
SELECT 
  'Auth users policies' as info,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Check if there are any triggers on auth.users
SELECT 
  'Auth users triggers' as info,
  COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- Check if there are any functions that might be causing issues
SELECT 
  'Functions that reference auth.users' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_definition LIKE '%auth.users%'
AND routine_schema = 'public';

-- Check if profiles table exists (this might be causing the trigger to fail)
SELECT 
  'Profiles table check' as info,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) as profiles_exists;

-- Check current user and permissions
SELECT 
  'Current user info' as info,
  current_user as current_user,
  session_user as session_user;

-- Summary
SELECT 'Diagnostic complete - check results above' as status; 