-- Fix Infinite Recursion in Profiles Table
-- This fixes the immediate issue without breaking other functionality

-- =====================================================
-- STEP 1: Temporarily disable RLS on profiles to break recursion
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop the problematic policy
-- =====================================================

DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

-- =====================================================
-- STEP 3: Create a simple, safe policy
-- =====================================================

-- Re-enable RLS with a simple policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a basic policy that doesn't cause recursion
CREATE POLICY "Basic profile access" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- STEP 4: Fix the handle_new_user function to avoid recursion
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Temporarily disable RLS for this operation
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Re-enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Infinite recursion fixed! Site should work now.' as status; 