-- Add price column to collections table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'collections' AND column_name = 'price') THEN
        ALTER TABLE "collections" ADD COLUMN "price" INTEGER DEFAULT 0;
    END IF;
END $$; 