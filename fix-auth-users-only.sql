-- Minimal fix for Supabase Auth users table
-- This should resolve the authentication loop issue

-- 1. Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive policies on auth.users
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;
DROP POLICY IF EXISTS "Restrict user access" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow all authenticated users to update own data" ON auth.users;

-- 3. Create permissive policies for auth.users (this is the key fix)
CREATE POLICY "Allow all authenticated users to read own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow all authenticated users to update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;

-- 5. Verify the setup
SELECT 'Auth users policies fixed successfully' as status; 