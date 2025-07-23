-- Add missing columns to collections table
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "photo_paths" TEXT[] DEFAULT '{}';
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "video_path" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "thumbnail_path" TEXT;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "price" INTEGER DEFAULT 0;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 0;

-- Update existing collections to have some sample data
UPDATE "collections" 
SET 
  "photo_paths" = ARRAY['collections/sample/photo1.jpg', 'collections/sample/photo2.jpg'],
  "video_path" = 'collections/sample/video.mp4',
  "thumbnail_path" = 'collections/sample/thumbnail.jpg',
  "price" = 999,
  "duration" = 300
WHERE "photo_paths" IS NULL; 