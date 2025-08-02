-- Fix Supabase Database Schema
-- Run this in your Supabase SQL Editor to ensure proper schema setup

-- 1. Check if tables exist and create them if they don't
DO $$ 
BEGIN
    -- Create collections table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collections') THEN
        CREATE TABLE collections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            duration INTEGER NOT NULL DEFAULT 1800,
            video_path TEXT NOT NULL,
            thumbnail_path TEXT NOT NULL,
            photo_paths TEXT[] DEFAULT '{}',
            stripe_product_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created collections table';
    END IF;

    -- Create hero_videos table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hero_videos') THEN
        CREATE TABLE hero_videos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            subtitle TEXT,
            video_path TEXT NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created hero_videos table';
    END IF;

    -- Create purchases table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchases') THEN
        CREATE TABLE purchases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id),
            collection_id UUID NOT NULL REFERENCES collections(id),
            stripe_session_id TEXT,
            amount_paid DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
        RAISE NOTICE 'Created purchases table';
    END IF;

    -- Create watch_logs table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'watch_logs') THEN
        CREATE TABLE watch_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id),
            collection_id UUID NOT NULL REFERENCES collections(id),
            purchase_id UUID REFERENCES purchases(id),
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created watch_logs table';
    END IF;
END $$;

-- 2. Add missing columns to existing tables
DO $$
BEGIN
    -- Add stripe_product_id to collections if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'stripe_product_id') THEN
        ALTER TABLE collections ADD COLUMN stripe_product_id TEXT;
        RAISE NOTICE 'Added stripe_product_id to collections table';
    END IF;

    -- Add photo_paths to collections if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'photo_paths') THEN
        ALTER TABLE collections ADD COLUMN photo_paths TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added photo_paths to collections table';
    END IF;

    -- Add duration to collections if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'duration') THEN
        ALTER TABLE collections ADD COLUMN duration INTEGER NOT NULL DEFAULT 1800;
        RAISE NOTICE 'Added duration to collections table';
    END IF;

    -- Add expires_at to purchases if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'expires_at') THEN
        ALTER TABLE purchases ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 year');
        RAISE NOTICE 'Added expires_at to purchases table';
    END IF;

    -- Add amount_paid to purchases if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount_paid') THEN
        ALTER TABLE purchases ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Added amount_paid to purchases table';
    END IF;
END $$;

-- 3. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Create storage policies
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
    
    -- Create storage policies
    CREATE POLICY "Authenticated users can view media" ON storage.objects
        FOR SELECT USING (bucket_id = 'media' AND auth.role() = 'authenticated');

    CREATE POLICY "Admins can upload media" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'media' AND 
            auth.email() = 'contact.exclusivelex@gmail.com'
        );

    CREATE POLICY "Admins can update media" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'media' AND 
            auth.email() = 'contact.exclusivelex@gmail.com'
        );

    CREATE POLICY "Admins can delete media" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'media' AND 
            auth.email() = 'contact.exclusivelex@gmail.com'
        );
    
    RAISE NOTICE 'Created storage policies';
END $$;

-- 5. Enable RLS and create policies for collections
DO $$
BEGIN
    ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
    DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
    
    -- Create policies
    CREATE POLICY "Everyone can view collections" ON collections
        FOR SELECT USING (true);

    CREATE POLICY "Admins can manage collections" ON collections
        FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');
    
    RAISE NOTICE 'Created collections RLS policies';
END $$;

-- 6. Enable RLS and create policies for purchases
DO $$
BEGIN
    ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
    DROP POLICY IF EXISTS "System can create purchases" ON purchases;
    DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
    
    -- Create policies
    CREATE POLICY "Users can view their own purchases" ON purchases
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "System can create purchases" ON purchases
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Admins can view all purchases" ON purchases
        FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');
    
    RAISE NOTICE 'Created purchases RLS policies';
END $$;

-- 7. Enable RLS and create policies for hero_videos
DO $$
BEGIN
    ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
    DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
    
    -- Create policies
    CREATE POLICY "Everyone can view hero videos" ON hero_videos
        FOR SELECT USING (is_active = true);

    CREATE POLICY "Admins can manage hero videos" ON hero_videos
        FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');
    
    RAISE NOTICE 'Created hero_videos RLS policies';
END $$;

-- 8. Enable RLS and create policies for watch_logs
DO $$
BEGIN
    ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
    DROP POLICY IF EXISTS "System can create watch logs" ON watch_logs;
    DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;
    
    -- Create policies
    CREATE POLICY "Users can view their own watch logs" ON watch_logs
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "System can create watch logs" ON watch_logs
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Admins can view all watch logs" ON watch_logs
        FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');
    
    RAISE NOTICE 'Created watch_logs RLS policies';
END $$;

-- 9. Create indexes for better performance
DO $$
BEGIN
    -- Collections indexes
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_collections_created_at') THEN
        CREATE INDEX idx_collections_created_at ON collections(created_at);
    END IF;
    
    -- Hero videos indexes
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_hero_videos_order') THEN
        CREATE INDEX idx_hero_videos_order ON hero_videos(order_index);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_hero_videos_active') THEN
        CREATE INDEX idx_hero_videos_active ON hero_videos(is_active);
    END IF;
    
    -- Purchases indexes
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_purchases_user_id') THEN
        CREATE INDEX idx_purchases_user_id ON purchases(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_purchases_collection_id') THEN
        CREATE INDEX idx_purchases_collection_id ON purchases(collection_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_purchases_expires_at') THEN
        CREATE INDEX idx_purchases_expires_at ON purchases(expires_at);
    END IF;
    
    -- Watch logs indexes
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_watch_logs_user_id') THEN
        CREATE INDEX idx_watch_logs_user_id ON watch_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_watch_logs_collection_id') THEN
        CREATE INDEX idx_watch_logs_collection_id ON watch_logs(collection_id);
    END IF;
    
    RAISE NOTICE 'Created performance indexes';
END $$;

-- 10. Create function and trigger for updated_at
DO $$
BEGIN
    -- Create function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Create triggers
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
    
    RAISE NOTICE 'Created updated_at triggers';
END $$;

-- 11. Verify schema setup
SELECT 
    'Schema verification complete' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('collections', 'purchases', 'hero_videos', 'watch_logs')) as tables_created,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'media') as storage_bucket_created; 