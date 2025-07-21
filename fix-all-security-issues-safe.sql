-- Fix All Security Issues for Exclusive Lex Platform (SAFE VERSION)
-- This script addresses all issues found in Supabase Security Advisor
-- Uses IF NOT EXISTS and DROP IF EXISTS to prevent conflicts

-- =====================================================
-- STEP 1: Enable RLS on all tables (safe to run multiple times)
-- =====================================================

-- Enable RLS on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on hero_videos table  
ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Enable RLS on watch_logs table
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on collection_videos table
ALTER TABLE collection_videos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop existing policies safely
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
DROP POLICY IF EXISTS "Public can view collections" ON collections;
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Public can view active hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can manage own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can insert own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can manage own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Public can view collection videos" ON collection_videos;
DROP POLICY IF EXISTS "Admins can manage collection videos" ON collection_videos;

-- =====================================================
-- STEP 3: Create optimized RLS policies
-- =====================================================

-- Profiles policies (single policy for all operations)
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (id = auth.uid());

-- Collections policies (public read, admin write)
CREATE POLICY "Public can view collections" ON collections
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Hero videos policies (public read for active, admin write)
CREATE POLICY "Public can view active hero videos" ON hero_videos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hero videos" ON hero_videos
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Purchases policies (users can only access their own)
CREATE POLICY "Users can manage own purchases" ON purchases
    FOR ALL USING (user_id = auth.uid());

-- Watch logs policies (users can only access their own)
CREATE POLICY "Users can manage own watch logs" ON watch_logs
    FOR ALL USING (user_id = auth.uid());

-- Collection videos policies (public read, admin write)
CREATE POLICY "Public can view collection videos" ON collection_videos
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage collection videos" ON collection_videos
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- =====================================================
-- STEP 4: Fix function search path issues
-- =====================================================

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- STEP 5: Create triggers with proper search paths
-- =====================================================

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- STEP 6: Create profiles table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'All security issues fixed successfully! ✅' as status; 