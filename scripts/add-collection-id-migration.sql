-- Add collectionId field to CollectionVideo table
ALTER TABLE "CollectionVideo"
ADD COLUMN IF NOT EXISTS "collectionId" TEXT;

-- Add foreign key constraint
ALTER TABLE "CollectionVideo"
ADD CONSTRAINT "collectionVideo_collectionId_fkey"
FOREIGN KEY ("collectionId") REFERENCES "Collection"(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "collectionVideo_collectionId_idx" ON "CollectionVideo"("collectionId"); 