-- Create entry_access table for $20 entry fee
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "entry_access" (
    "user_id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    "stripe_customer_id" TEXT,
    "stripe_session_id" TEXT,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "entry_access_user_id_idx" ON "entry_access"("user_id");
CREATE INDEX IF NOT EXISTS "entry_access_status_idx" ON "entry_access"("status");
CREATE INDEX IF NOT EXISTS "entry_access_stripe_session_id_idx" ON "entry_access"("stripe_session_id");

-- Enable Row Level Security (RLS)
ALTER TABLE "entry_access" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own entry access" ON "entry_access"
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for webhook processing)
-- Note: Service role bypasses RLS by default, so no policy needed for admin operations
