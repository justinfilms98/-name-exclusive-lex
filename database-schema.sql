-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 1800, -- access duration in seconds
  video_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  photo_paths TEXT[] DEFAULT '{}',
  stripe_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hero_videos table
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

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id UUID NOT NULL REFERENCES collections(id),
  stripe_session_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create watch_logs table for tracking access
CREATE TABLE watch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id UUID NOT NULL REFERENCES collections(id),
  purchase_id UUID REFERENCES purchases(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', false);

-- Create storage policies for media bucket
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

-- Row Level Security policies for hero_videos
ALTER TABLE hero_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view hero videos" ON hero_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hero videos" ON hero_videos
  FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Row Level Security policies for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections" ON collections
  FOR ALL USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Row Level Security policies for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Row Level Security policies for watch_logs
ALTER TABLE watch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch logs" ON watch_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create watch logs" ON watch_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all watch logs" ON watch_logs
  FOR SELECT USING (auth.email() = 'contact.exclusivelex@gmail.com');

-- Create indexes for better performance
CREATE INDEX idx_hero_videos_order ON hero_videos(order_index);
CREATE INDEX idx_hero_videos_active ON hero_videos(is_active);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_collection_id ON purchases(collection_id);
CREATE INDEX idx_purchases_expires_at ON purchases(expires_at);
CREATE INDEX idx_watch_logs_user_id ON watch_logs(user_id);
CREATE INDEX idx_watch_logs_collection_id ON watch_logs(collection_id);
CREATE INDEX idx_collections_created_at ON collections(created_at);

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Create trigger for hero_videos updated_at
CREATE TRIGGER update_hero_videos_updated_at 
  BEFORE UPDATE ON hero_videos 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column(); 