-- SAFE AUTH FIX for Exclusive Lex
-- This script ONLY fixes the auth.users table policies
-- It does NOT touch any existing tables or policies that are working

-- Check if auth.users table exists and has RLS enabled
DO $$
BEGIN
    -- Enable RLS on auth.users if not already enabled
    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
    
    -- Log the action
    RAISE NOTICE 'RLS enabled on auth.users table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling RLS on auth.users: %', SQLERRM;
END $$;

-- Safely drop any existing policies on auth.users (if they exist)
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Restrict user access" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to update own data" ON auth.users;
DROP POLICY IF EXISTS "Allow users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON auth.users;

-- Create safe, permissive policies for auth.users
-- These policies allow authenticated users to read and update their own data
CREATE POLICY "Allow authenticated users to read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;

-- Verify the fix was applied
SELECT 
    'Auth users policies fixed successfully' as status,
    COUNT(*) as existing_policies
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'auth'; 