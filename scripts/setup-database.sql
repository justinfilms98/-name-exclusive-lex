-- Create Collections table
CREATE TABLE IF NOT EXISTS "public"."Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- Create MediaItem table
CREATE TABLE IF NOT EXISTS "public"."MediaItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- Create MediaPurchase table
CREATE TABLE IF NOT EXISTS "public"."MediaPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "MediaPurchase_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."MediaItem" ADD CONSTRAINT "MediaItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."MediaPurchase" ADD CONSTRAINT "MediaPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."MediaPurchase" ADD CONSTRAINT "MediaPurchase_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "public"."MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "MediaItem_collectionId_idx" ON "public"."MediaItem"("collectionId");
CREATE INDEX IF NOT EXISTS "MediaItem_mediaType_idx" ON "public"."MediaItem"("mediaType");

-- Insert a default collection
INSERT INTO "public"."Collection" ("id", "name", "createdAt") 
VALUES ('default', 'Default Collection', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Enable Row Level Security
ALTER TABLE "public"."Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MediaItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MediaPurchase" ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on Collection" ON "public"."Collection"
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on MediaItem" ON "public"."MediaItem"
    FOR SELECT USING (true);

-- Create policies for admin/service role operations
CREATE POLICY "Allow service role full access on MediaItem" ON "public"."MediaItem"
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access on Collection" ON "public"."Collection"
    FOR ALL USING (true);

CREATE POLICY "Allow service role full access on MediaPurchase" ON "public"."MediaPurchase"
    FOR ALL USING (true); 