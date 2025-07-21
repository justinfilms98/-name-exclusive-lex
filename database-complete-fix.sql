-- Complete database fix - adds all missing columns safely
-- This handles any missing columns that the stable commit expects

-- Add is_active column to hero_videos if it doesn't exist
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

-- Add order_index column to hero_videos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'order_index'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add subtitle column to hero_videos if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'subtitle'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN subtitle TEXT;
    END IF;
END $$;

-- Add duration column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE collections ADD COLUMN duration INTEGER NOT NULL DEFAULT 1800;
    END IF;
END $$;

-- Add photo_paths column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'photo_paths'
    ) THEN
        ALTER TABLE collections ADD COLUMN photo_paths TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add stripe_product_id column to collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'stripe_product_id'
    ) THEN
        ALTER TABLE collections ADD COLUMN stripe_product_id TEXT;
    END IF;
END $$;

-- Add updated_at columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collections' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE collections ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hero_videos' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE hero_videos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Recreate indexes for any newly added columns
DROP INDEX IF EXISTS idx_hero_videos_order;
CREATE INDEX idx_hero_videos_order ON hero_videos(order_index);

DROP INDEX IF EXISTS idx_hero_videos_active;
CREATE INDEX idx_hero_videos_active ON hero_videos(is_active);

-- Recreate policies that might reference the new columns
DROP POLICY IF EXISTS "Everyone can view hero videos" ON hero_videos;
CREATE POLICY "Everyone can view hero videos" ON hero_videos
  FOR SELECT USING (is_active = true);

-- Create function (safe to recreate)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and recreate (AFTER ensuring all columns exist)
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
SELECT 'All missing columns added successfully! ✅' as status; 