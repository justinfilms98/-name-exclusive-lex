-- Add Stripe-related columns to purchases table
ALTER TABLE "purchases" ADD COLUMN "stripe_session_id" TEXT;
ALTER TABLE "purchases" ADD COLUMN "amount_paid" DOUBLE PRECISION DEFAULT 0.00;

-- Create index for faster lookups by session ID
CREATE INDEX "purchases_stripe_session_id_idx" ON "purchases"("stripe_session_id"); 