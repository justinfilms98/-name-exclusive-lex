/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateTable
CREATE TABLE "VideoAnalytics" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "watchTime" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "device" TEXT,
    "referrer" TEXT,

    CONSTRAINT "VideoAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPricing" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "duration" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "discount" DOUBLE PRECISION,
    "promoCode" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VideoPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentModerationLog" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoAnalytics_videoId_date_idx" ON "VideoAnalytics"("videoId", "date");

-- CreateIndex
CREATE INDEX "VideoAnalytics_country_idx" ON "VideoAnalytics"("country");

-- CreateIndex
CREATE INDEX "VideoAnalytics_device_idx" ON "VideoAnalytics"("device");

-- CreateIndex
CREATE INDEX "VideoPricing_videoId_type_idx" ON "VideoPricing"("videoId", "type");

-- CreateIndex
CREATE INDEX "VideoPricing_isActive_idx" ON "VideoPricing"("isActive");

-- CreateIndex
CREATE INDEX "VideoPricing_promoCode_idx" ON "VideoPricing"("promoCode");

-- CreateIndex
CREATE INDEX "ContentModerationLog_videoId_idx" ON "ContentModerationLog"("videoId");

-- CreateIndex
CREATE INDEX "ContentModerationLog_moderatorId_idx" ON "ContentModerationLog"("moderatorId");

-- CreateIndex
CREATE INDEX "ContentModerationLog_action_idx" ON "ContentModerationLog"("action");

-- AddForeignKey
ALTER TABLE "HeroVideo" ADD CONSTRAINT "HeroVideo_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAnalytics" ADD CONSTRAINT "VideoAnalytics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "HeroVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPricing" ADD CONSTRAINT "VideoPricing_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "HeroVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModerationLog" ADD CONSTRAINT "ContentModerationLog_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "HeroVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
