-- Create the purchases table for collection purchases
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "purchases"("user_id");
CREATE INDEX IF NOT EXISTS "purchases_collection_id_idx" ON "purchases"("collection_id");
CREATE INDEX IF NOT EXISTS "purchases_stripe_session_id_idx" ON "purchases"("stripe_session_id");
CREATE INDEX IF NOT EXISTS "purchases_status_idx" ON "purchases"("status");
CREATE INDEX IF NOT EXISTS "purchases_user_collection_idx" ON "purchases"("user_id", "collection_id");

-- Create unique constraint to prevent duplicate purchases
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_user_collection_session_unique" 
ON "purchases"("user_id", "collection_id", "stripe_session_id");

-- Add foreign key constraints
ALTER TABLE "purchases" 
ADD CONSTRAINT "purchases_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "purchases" 
ADD CONSTRAINT "purchases_collection_id_fkey" 
FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own purchases" ON "purchases"
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own purchases" ON "purchases"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own purchases" ON "purchases"
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON "purchases" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 