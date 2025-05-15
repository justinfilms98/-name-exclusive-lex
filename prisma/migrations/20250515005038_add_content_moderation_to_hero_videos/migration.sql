-- AlterTable
ALTER TABLE "HeroVideo" ADD COLUMN     "ageRating" TEXT NOT NULL DEFAULT 'PG',
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'entertainment',
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tags" TEXT[];

-- CreateIndex
CREATE INDEX "HeroVideo_status_idx" ON "HeroVideo"("status");

-- CreateIndex
CREATE INDEX "HeroVideo_category_idx" ON "HeroVideo"("category");

-- CreateIndex
CREATE INDEX "HeroVideo_ageRating_idx" ON "HeroVideo"("ageRating");
