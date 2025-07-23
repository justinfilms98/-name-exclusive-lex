-- Add photo_paths column to collections table
ALTER TABLE "Collection" ADD COLUMN "photo_paths" TEXT[] DEFAULT '{}';

-- Add other missing columns that might be needed
ALTER TABLE "Collection" ADD COLUMN "video_path" TEXT;
ALTER TABLE "Collection" ADD COLUMN "thumbnail_path" TEXT;
ALTER TABLE "Collection" ADD COLUMN "price" INTEGER DEFAULT 0;
ALTER TABLE "Collection" ADD COLUMN "duration" INTEGER DEFAULT 0; 