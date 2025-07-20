-- Safe Database Schema - Only creates what doesn't exist
-- Run this to check what you have and add missing pieces

-- Check existing tables first
DO $$
BEGIN
    -- Create collections table only if it doesn't exist
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
    ELSE
        RAISE NOTICE 'Collections table already exists';
    END IF;

    -- Create purchases table only if it doesn't exist
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
    ELSE
        RAISE NOTICE 'Purchases table already exists';
    END IF;

    -- Create watch_logs table only if it doesn't exist
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
    ELSE
        RAISE NOTICE 'Watch_logs table already exists';
    END IF;
END $$;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop existing and recreate to ensure they're correct)
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;

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

-- Enable RLS and create policies for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view collections" ON collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;

CREATE POLICY "Everyone can view collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
  FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Enable RLS and create policies for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "System can create purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;

CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Enable RLS and create policies for watch_logs
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watch logs" ON watch_logs;
DROP POLICY IF EXISTS "System can create watch logs" ON watch_logs;
DROP POLICY IF EXISTS "Admins can view all watch logs" ON watch_logs;

CREATE POLICY "Users can view their own watch logs" ON watch_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create watch logs" ON watch_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all watch logs" ON watch_logs
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_collection_id ON purchases(collection_id);
CREATE INDEX IF NOT EXISTS idx_purchases_expires_at ON purchases(expires_at);
CREATE INDEX IF NOT EXISTS idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_logs_collection_id ON watch_logs(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Create function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column(); 