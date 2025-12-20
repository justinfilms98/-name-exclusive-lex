-- ============================================================================
-- EXCLUSIVE LEX - MASTER DATABASE MIGRATION
-- ============================================================================
-- This file consolidates all essential database setup in one organized place.
-- SAFE TO RUN MULTIPLE TIMES - All operations are idempotent (check before apply)
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALBUMS TABLE SETUP
-- ============================================================================

-- Create albums table if it doesn't exist
CREATE TABLE IF NOT EXISTS "albums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "thumbnail_path" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add thumbnail_path column if it doesn't exist (for existing albums tables)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'albums' AND column_name = 'thumbnail_path') THEN
            ALTER TABLE "albums" ADD COLUMN "thumbnail_path" TEXT;
        END IF;
        
        -- Rename 'title' to 'name' if needed (for legacy tables)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'albums' AND column_name = 'title') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'albums' AND column_name = 'name') THEN
                ALTER TABLE "albums" RENAME COLUMN "title" TO "name";
            END IF;
        END IF;
    END IF;
END $$;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS "albums_slug_idx" ON "albums"("slug");

-- ============================================================================
-- SECTION 2: COLLECTIONS TABLE - ADD ALBUM SUPPORT
-- ============================================================================

-- Add album_id column to collections (nullable, safe for existing data)
DO $$ 
DECLARE
    albums_id_type TEXT;
BEGIN
    -- Get the data type of albums.id column to match it
    SELECT data_type INTO albums_id_type
    FROM information_schema.columns
    WHERE table_name = 'albums' AND column_name = 'id';
    
    -- Only add album_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collections' AND column_name = 'album_id') THEN
        -- Match the type of albums.id (default to TEXT)
        IF albums_id_type = 'uuid' THEN
            ALTER TABLE "collections" ADD COLUMN "album_id" UUID;
        ELSE
            ALTER TABLE "collections" ADD COLUMN "album_id" TEXT;
        END IF;
    END IF;
END $$;

-- Add foreign key constraint (only if both tables and columns exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collections' AND column_name = 'album_id') THEN
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
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "collections_album_id_idx" ON "collections"("album_id");

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Albums: Public read access for browsing
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
        ALTER TABLE "albums" ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to avoid duplicates
        DROP POLICY IF EXISTS "albums_select_public" ON "albums";
        DROP POLICY IF EXISTS "albums_select_admin" ON "albums";
        
        -- Public can read all albums (for browsing)
        CREATE POLICY "albums_select_public" ON "albums"
            FOR SELECT USING (true);
    END IF;
END $$;

-- Collections: Public read access for browsing metadata
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
        ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to avoid duplicates
        DROP POLICY IF EXISTS "collections_read_all" ON "collections";
        DROP POLICY IF EXISTS "collections_select_public" ON "collections";
        
        -- Public can read collection metadata (title, description, price, thumbnail_path)
        -- This allows browsing without authentication
        CREATE POLICY "collections_select_public" ON "collections"
            FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: SEED DATA (Only if empty)
-- ============================================================================

-- Seed default albums if table is empty
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
            -- Generate IDs based on the actual type (both UUID and TEXT can use gen_random_uuid())
            night_id := gen_random_uuid()::TEXT;
            day_id := gen_random_uuid()::TEXT;
            
            INSERT INTO "albums" ("id", "name", "slug", "description", "created_at", "updated_at")
            VALUES 
                (night_id, 'Night Vibe', 'night-vibe', 'Exclusive night content collection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                (day_id, 'Day Vibe', 'day-vibe', 'Exclusive day content collection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All operations completed successfully!
-- Your database is now set up with:
--   ✓ Albums table with thumbnail support
--   ✓ Collections table with album_id foreign key
--   ✓ Public RLS policies for browsing
--   ✓ Default seed albums (if table was empty)
-- ============================================================================

