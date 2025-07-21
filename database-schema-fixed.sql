-- Safe database schema - handles missing columns properly
-- This version safely creates everything without column conflicts

-- Create collections table (only if it doesn't exist)
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

-- Create hero_videos table (only if it doesn't exist)
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

-- Add is_active column to existing hero_videos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Create purchases table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id UUID NOT NULL REFERENCES collections(id),
  stripe_session_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create watch_logs table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id UUID NOT NULL REFERENCES collections(id),
  purchase_id UUID REFERENCES purchases(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket (will skip if exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (safe to run multiple times)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Admins can manage hero videos" ON hero_videos;
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "System can create purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "System can create watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;

-- Storage policies (drop and recreate)
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

-- Create fresh policies
CREATE POLICY "Everyone can view collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
  FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Everyone can view hero videos" ON hero_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hero videos" ON hero_videos
  FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

CREATE POLICY "Users can view their own watch logs" ON watch_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create watch logs" ON watch_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all watch logs" ON watch_logs
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Storage policies
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

-- Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_hero_videos_order ON hero_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_hero_videos_active ON hero_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_collection_id ON purchases(collection_id);
CREATE INDEX IF NOT EXISTS idx_purchases_expires_at ON purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Create function (safe to recreate)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and recreate (AFTER ensuring is_active column exists)
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS update_hero_videos_updated_at ON hero_videos;

CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hero_videos_updated_at 
  BEFORE UPDATE ON hero_videos 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Success message
SELECT 'Database schema updated successfully! ✅' as status; 