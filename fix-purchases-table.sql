-- Add missing columns to purchases table
-- This will fix the "Could not find the 'amount_paid' column" error

-- Add stripe_session_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'stripe_session_id') THEN
        ALTER TABLE "purchases" ADD COLUMN "stripe_session_id" TEXT;
    END IF;
END $$;

-- Add amount_paid column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'amount_paid') THEN
        ALTER TABLE "purchases" ADD COLUMN "amount_paid" DOUBLE PRECISION DEFAULT 0.00;
    END IF;
END $$;

-- Create index for faster lookups by session ID
CREATE INDEX IF NOT EXISTS "purchases_stripe_session_id_idx" ON "purchases"("stripe_session_id");

-- Show the current structure of the purchases table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchases'
ORDER BY ordinal_position; 