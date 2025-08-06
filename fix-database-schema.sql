-- Fix database schema for purchases and collections
-- Run this in Supabase SQL Editor

-- 1. Create the purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS "purchases" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "amount_paid" INTEGER DEFAULT 0,
    "currency" TEXT DEFAULT 'usd',
    "status" TEXT DEFAULT 'pending',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add price column to collections table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Collection' AND column_name = 'price') THEN
        ALTER TABLE "Collection" ADD COLUMN "price" INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "purchases"("user_id");
CREATE INDEX IF NOT EXISTS "purchases_collection_id_idx" ON "purchases"("collection_id");
CREATE INDEX IF NOT EXISTS "purchases_stripe_session_id_idx" ON "purchases"("stripe_session_id");
CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases"("status");
CREATE INDEX IF NOT EXISTS "purchases_user_collection_idx" ON "purchases"("user_id", "collection_id");

-- 4. Create unique constraint to prevent duplicate purchases
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_user_collection_session_unique" 
ON "purchases"("user_id", "collection_id", "stripe_session_id");

-- 5. Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Check if foreign key constraint doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'purchases_user_id_fkey' AND table_name = 'purchases') THEN
        ALTER TABLE "purchases" 
        ADD CONSTRAINT "purchases_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'purchases_collection_id_fkey' AND table_name = 'purchases') THEN
        ALTER TABLE "purchases" 
        ADD CONSTRAINT "purchases_collection_id_fkey" 
        FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own purchases" ON "purchases";
DROP POLICY IF EXISTS "Users can insert their own purchases" ON "purchases";
DROP POLICY IF EXISTS "Users can update their own purchases" ON "purchases";

-- 8. Create RLS policies
CREATE POLICY "Users can view their own purchases" ON "purchases"
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own purchases" ON "purchases"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own purchases" ON "purchases"
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 9. Create function to automatically update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger to automatically update updated_at (if it doesn't exist)
DROP TRIGGER IF EXISTS update_purchases_updated_at ON "purchases";
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON "purchases" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Grant necessary permissions
GRANT ALL ON "purchases" TO authenticated;
GRANT ALL ON "purchases" TO service_role; 