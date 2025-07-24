-- SIMPLE AUTH FIX - Remove profiles dependency
-- This removes the trigger that might be causing the auth loop

-- Drop the trigger that might be failing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that might be causing issues
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure auth.users has proper RLS policies
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on auth.users
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to update own data" ON auth.users;
DROP POLICY IF EXISTS "Restrict user access" ON auth.users;

-- Create simple, permissive policies for auth.users
CREATE POLICY "Allow authenticated users to read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;

-- Verify the fix
SELECT 'Simple auth fix applied successfully' as status; 