-- Exclusive Lex Database Consolidation & Fix Migration (SAFE VERSION)
-- This migration consolidates collections schema and fixes all missing columns
-- Run this step by step to avoid errors

-- =====================================================
-- STEP 1: Add missing columns to collections table
-- =====================================================

-- Add price column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE collections ADD COLUMN price INTEGER NOT NULL DEFAULT 2999;
        RAISE NOTICE 'Added price column to collections';
    ELSE
        RAISE NOTICE 'Price column already exists in collections';
    END IF;
END $$;

-- Add video_path column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'video_path'
    ) THEN
        ALTER TABLE collections ADD COLUMN video_path TEXT;
        RAISE NOTICE 'Added video_path column to collections';
    ELSE
        RAISE NOTICE 'Video_path column already exists in collections';
    END IF;
END $$;

-- Add thumbnail_path column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'thumbnail_path'
    ) THEN
        ALTER TABLE collections ADD COLUMN thumbnail_path TEXT;
        RAISE NOTICE 'Added thumbnail_path column to collections';
    ELSE
        RAISE NOTICE 'Thumbnail_path column already exists in collections';
    END IF;
END $$;

-- Add stripe_price_id column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE collections ADD COLUMN stripe_price_id TEXT;
        RAISE NOTICE 'Added stripe_price_id column to collections';
    ELSE
        RAISE NOTICE 'Stripe_price_id column already exists in collections';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Add missing columns to hero_videos table
-- =====================================================

-- Add video_path column to hero_videos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'video_path'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN video_path TEXT;
        RAISE NOTICE 'Added video_path column to hero_videos';
    ELSE
        RAISE NOTICE 'Video_path column already exists in hero_videos';
    END IF;
END $$;

-- Add thumbnail_path column to hero_videos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'thumbnail_path'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN thumbnail_path TEXT;
        RAISE NOTICE 'Added thumbnail_path column to hero_videos';
    ELSE
        RAISE NOTICE 'Thumbnail_path column already exists in hero_videos';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Add videos JSONB column to collections
-- =====================================================

-- Add videos JSONB column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'videos'
    ) THEN
        ALTER TABLE collections ADD COLUMN videos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added videos JSONB column to collections';
    ELSE
        RAISE NOTICE 'Videos column already exists in collections';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Create purchases table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    stripe_session_id TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, collection_id)
);

-- =====================================================
-- STEP 5: Create watch_logs table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS watch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    watch_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    watch_ended_at TIMESTAMP WITH TIME ZONE,
    watch_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- STEP 7: Enable Row Level Security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: Create RLS Policies
-- =====================================================

-- Collections policies
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
CREATE POLICY "Everyone can view collections" ON collections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
CREATE POLICY "Admins can manage collections" ON collections
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Hero videos policies
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
CREATE POLICY "Everyone can view hero videos" ON hero_videos
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
CREATE POLICY "Admins can manage hero videos" ON hero_videos
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'contact.exclusivelex@gmail.com',
            'admin@exclusivelex.com'
        )
    );

-- Purchases policies
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
CREATE POLICY "Users can insert own purchases" ON purchases
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Watch logs policies
DROP POLICY IF EXISTS "Users can view own watch logs" ON watch_logs;
CREATE POLICY "Users can view own watch logs" ON watch_logs
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own watch logs" ON watch_logs;
CREATE POLICY "Users can insert own watch logs" ON watch_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- STEP 9: Create indexes for performance
-- =====================================================

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_price ON collections(price);

-- Hero videos indexes
CREATE INDEX IF NOT EXISTS idx_hero_videos_order ON hero_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_hero_videos_active ON hero_videos(is_active);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_expires_at ON purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_purchases_session_id ON purchases(stripe_session_id);

-- Watch logs indexes
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);

-- =====================================================
-- STEP 10: Create triggers for updated_at
-- =====================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at 
    BEFORE UPDATE ON collections 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_hero_videos_updated_at ON hero_videos;
CREATE TRIGGER update_hero_videos_updated_at 
    BEFORE UPDATE ON hero_videos 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON purchases 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- STEP 11: Migrate data from collection_videos (SAFE)
-- =====================================================

-- Only attempt migration if collection_videos table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_videos') THEN
        -- Check if collection_videos has the expected columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collection_videos' 
            AND column_name = 'collection_id'
        ) THEN
            -- Migrate existing collection_videos data into collections.videos
            WITH cv AS (
                SELECT 
                    collection_id, 
                    jsonb_agg(
                        jsonb_build_object(
                            'id', id,
                            'title', title,
                            'description', description,
                            'price', price,
                            'video_url', video_url,
                            'thumbnail_url', thumbnail_url,
                            'order', "order",
                            'created_at', created_at,
                            'updated_at', updated_at
                        )
                    ) AS vids
                FROM collection_videos 
                GROUP BY collection_id
            )
            UPDATE collections c
            SET videos = cv.vids
            FROM cv 
            WHERE c.id = cv.collection_id;
            
            RAISE NOTICE 'Successfully migrated collection_videos data to collections.videos';
            
            -- Update collections with data from collection_videos
            UPDATE collections c
            SET 
                price = COALESCE(c.price, (SELECT MIN(price) FROM collection_videos cv WHERE cv.collection_id = c.id)),
                video_path = COALESCE(c.video_path, (SELECT video_url FROM collection_videos cv WHERE cv.collection_id = c.id LIMIT 1)),
                thumbnail_path = COALESCE(c.thumbnail_path, (SELECT thumbnail_url FROM collection_videos cv WHERE cv.collection_id = c.id LIMIT 1))
            WHERE EXISTS (SELECT 1 FROM collection_videos cv WHERE cv.collection_id = c.id);
            
            RAISE NOTICE 'Successfully updated collections with collection_videos data';
            
            -- Now safely drop the collection_videos table
            DROP TABLE collection_videos;
            RAISE NOTICE 'Successfully dropped collection_videos table';
        ELSE
            RAISE NOTICE 'collection_videos table exists but does not have expected columns - skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'collection_videos table does not exist - skipping migration';
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Database consolidation and fixes completed successfully! ✅' as status; 