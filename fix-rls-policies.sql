-- Fix RLS Policies for Exclusive Lex Platform
-- This script fixes the infinite recursion issue in profiles table policies

-- =====================================================
-- STEP 1: Drop existing problematic policies
-- =====================================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- =====================================================
-- STEP 2: Create simplified, safe RLS policies
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows users to manage their own profile
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (id = auth.uid());

-- =====================================================
-- STEP 3: Fix other table policies that might cause issues
-- =====================================================

-- Collections policies (simplified)
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;

CREATE POLICY "Everyone can view collections" ON collections
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Hero videos policies (simplified)
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;

CREATE POLICY "Everyone can view hero videos" ON hero_videos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hero videos" ON hero_videos
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Purchases policies (simplified)
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;

CREATE POLICY "Users can manage own purchases" ON purchases
    FOR ALL USING (user_id = auth.uid());

-- Watch logs policies (simplified)
DROP POLICY IF EXISTS "Users can view own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Users can insert own watch logs" ON watch_logs;

CREATE POLICY "Users can manage own watch logs" ON watch_logs
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 4: Create profiles table if it doesn't exist
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
-- STEP 5: Create trigger for updated_at
-- =====================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'RLS policies fixed successfully! ✅' as status; 