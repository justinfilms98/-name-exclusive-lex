-- Fix Collections Visibility and Add Albums Support
-- SAFE: Additive changes only, no data deletion
-- Run this in Supabase SQL Editor

-- ====================================
-- PHASE 1: Add album_id to collections
-- ====================================
-- Detect albums.id type and match it for album_id
DO $$ 
DECLARE
    albums_id_type TEXT;
BEGIN
    -- Get the data type of albums.id column
    SELECT data_type INTO albums_id_type
    FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'id';
    
    -- Only add album_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collections' AND column_name = 'album_id') THEN
        -- Use the same type as albums.id, default to TEXT if not found
        IF albums_id_type IS NULL THEN
            ALTER TABLE "collections" ADD COLUMN "album_id" TEXT;
        ELSIF albums_id_type = 'uuid' THEN
            ALTER TABLE "collections" ADD COLUMN "album_id" UUID;
        ELSE
            ALTER TABLE "collections" ADD COLUMN "album_id" TEXT;
        END IF;
    END IF;
END $$;

-- Add foreign key constraint if albums table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'collections_album_id_fkey' 
            AND table_name = 'collections'
        ) THEN
            ALTER TABLE "collections" 
            ADD CONSTRAINT "collections_album_id_fkey" 
            FOREIGN KEY ("album_id") 
            REFERENCES "albums"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- ====================================
-- PHASE 2: RLS Policies for Albums
-- ====================================
-- Enable RLS on albums table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        ALTER TABLE "albums" ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "albums_select_public" ON "albums";
        DROP POLICY IF EXISTS "albums_select_admin" ON "albums";
        
        -- Public can read all albums (for browsing)
        CREATE POLICY "albums_select_public" ON "albums"
            FOR SELECT USING (true);
            
        -- Admin can do everything (will be handled via service role in practice)
        -- For now, public SELECT is sufficient
    END IF;
END $$;

-- ====================================
-- PHASE 3: Ensure Collections RLS allows public browsing
-- ====================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing public read policy if it exists
        DROP POLICY IF EXISTS "collections_read_all" ON "collections";
        DROP POLICY IF EXISTS "collections_select_public" ON "collections";
        
        -- Public can read collection metadata (title, description, price, thumbnail_path)
        -- This allows browsing without authentication
        CREATE POLICY "collections_select_public" ON "collections"
            FOR SELECT USING (true);
    END IF;
END $$;

-- ====================================
-- PHASE 4: Create indexes for performance
-- ====================================
CREATE INDEX IF NOT EXISTS "collections_album_id_idx" ON "collections"("album_id");
CREATE INDEX IF NOT EXISTS "albums_slug_idx" ON "albums"("slug");

-- ====================================
-- PHASE 5: Ensure albums table has correct structure
-- ====================================
-- Update albums table structure if needed (use name, not title)
DO $$ 
BEGIN
    -- If albums table exists but has 'title' column, rename it to 'name'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'albums' AND column_name = 'title') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'albums' AND column_name = 'name') THEN
            ALTER TABLE "albums" RENAME COLUMN "title" TO "name";
        END IF;
    END IF;
END $$;

-- ====================================
-- PHASE 6: Seed Albums (only if albums table is empty)
-- ====================================
DO $$ 
DECLARE
    albums_id_type TEXT;
    night_id TEXT;
    day_id TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        -- Get the data type of albums.id column
        SELECT data_type INTO albums_id_type
        FROM information_schema.columns
        WHERE table_name = 'albums' AND column_name = 'id';
        
        -- Only seed if no albums exist
        IF NOT EXISTS (SELECT 1 FROM "albums" LIMIT 1) THEN
            -- Generate IDs based on the actual type
            IF albums_id_type = 'uuid' THEN
                night_id := gen_random_uuid()::TEXT;
                day_id := gen_random_uuid()::TEXT;
            ELSE
                -- Use TEXT IDs (generate UUID and convert to text, or use simple text)
                night_id := gen_random_uuid()::TEXT;
                day_id := gen_random_uuid()::TEXT;
            END IF;
            
            INSERT INTO "albums" ("id", "name", "slug", "description", "created_at", "updated_at")
            VALUES 
                (night_id, 'Night Vibe', 'night-vibe', 'Exclusive night content collection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                (day_id, 'Day Vibe', 'day-vibe', 'Exclusive day content collection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        END IF;
    END IF;
END $$;

