-- Step 1: Add new columns to purchases table
ALTER TABLE "purchases" ADD COLUMN "bound_ip" TEXT;
ALTER TABLE "purchases" ADD COLUMN "last_access_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "purchases" ADD COLUMN "access_count" INTEGER DEFAULT 0;

-- Step 2: Create security_logs table
CREATE TABLE "security_logs" (
    "id" SERIAL PRIMARY KEY,
    "purchase_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "original_ip" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX "idx_security_logs_purchase_id" ON "security_logs" ("purchase_id");
CREATE INDEX "idx_security_logs_event_type" ON "security_logs" ("event_type");
CREATE INDEX "idx_security_logs_created_at" ON "security_logs" ("created_at");

-- Step 4: Add foreign key constraint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_purchase_id_fkey" 
    FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE; 