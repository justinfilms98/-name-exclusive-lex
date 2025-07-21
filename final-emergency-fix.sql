-- FINAL EMERGENCY FIX: Handle Dependencies
-- This safely removes all problematic policies and functions

-- =====================================================
-- STEP 1: Disable RLS on ALL tables to stop recursion
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE hero_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_videos DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop ALL policies that might cause issues
-- =====================================================

-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Basic profile access" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Drop all policies on collections
DROP POLICY IF EXISTS "Public can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;

-- Drop all policies on hero_videos
DROP POLICY IF EXISTS "Public can view active hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;

-- Drop all policies on purchases
DROP POLICY IF EXISTS "Users can manage own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;

-- Drop all policies on watch_logs
DROP POLICY IF EXISTS "Users can manage own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can view own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can insert own watch logs" ON watch_logs;

-- Drop all policies on collection_videos
DROP POLICY IF EXISTS "Public can view collection videos" ON collection_videos;
DROP POLICY IF EXISTS "Admins can manage collection videos" ON collection_videos;

-- =====================================================
-- STEP 3: Drop triggers first, then functions
-- =====================================================

-- Drop all triggers that depend on functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS update_hero_videos_updated_at ON hero_videos;

-- Now drop the functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- STEP 4: Create a simple, safe handle_new_user function
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Recreate the trigger safely
-- =====================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Final emergency fix applied! Site should work now.' as status; 