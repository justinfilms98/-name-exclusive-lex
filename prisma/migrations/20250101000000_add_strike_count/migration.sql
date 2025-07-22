-- Add strike_count column to purchases table
ALTER TABLE "purchases" ADD COLUMN "strike_count" INTEGER NOT NULL DEFAULT 0; 