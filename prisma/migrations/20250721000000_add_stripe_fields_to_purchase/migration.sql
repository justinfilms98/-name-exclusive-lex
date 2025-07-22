-- Add Stripe-related columns to Purchase table
ALTER TABLE "Purchase" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "amountPaid" DOUBLE PRECISION DEFAULT 0.00;

-- Create index for faster lookups by session ID
CREATE INDEX "Purchase_stripeSessionId_idx" ON "Purchase"("stripeSessionId"); 