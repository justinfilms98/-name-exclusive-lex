-- Fix Supabase Database Schema (Simplified Version)
-- Run this in your Supabase SQL Editor to ensure proper schema setup

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS collections (
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

CREATE TABLE IF NOT EXISTS hero_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    video_path TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    collection_id UUID NOT NULL REFERENCES collections(id),
    stripe_session_id TEXT,
    amount_paid DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 year')
);

CREATE TABLE IF NOT EXISTS watch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    collection_id UUID NOT NULL REFERENCES collections(id),
    purchase_id UUID REFERENCES purchases(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns
ALTER TABLE collections ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS photo_paths TEXT[] DEFAULT '{}';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 1800;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 year');
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 3. Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "System can create purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "System can create watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- 6. Create policies
CREATE POLICY "Everyone can view collections" ON collections
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
    FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all purchases" ON purchases
    FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Everyone can view hero videos" ON hero_videos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hero videos" ON hero_videos
    FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Users can view their own watch logs" ON watch_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create watch logs" ON watch_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all watch logs" ON watch_logs
    FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

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

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);
CREATE INDEX IF NOT EXISTS idx_hero_videos_order ON hero_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_hero_videos_active ON hero_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_collection_id ON purchases(collection_id);
CREATE INDEX IF NOT EXISTS idx_purchases_expires_at ON purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);

-- 8. Create function for updated_at (simplified)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ language plpgsql;

-- 9. Create triggers
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

-- 10. Verify setup
SELECT 
    'Schema setup complete' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('collections', 'purchases', 'hero_videos', 'watch_logs')) as tables_created,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'media') as storage_bucket_created; 