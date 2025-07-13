-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "videoKey" TEXT NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- CreateTable
CREATE TABLE "HeroVideo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionVideo" (
    "id" SERIAL NOT NULL,
    "collection" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionVideo_pkey" PRIMARY KEY ("id")
);
-- AlterTable
ALTER TABLE "CollectionVideo" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00;
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
-- AlterTable
ALTER TABLE "CollectionVideo" ADD COLUMN     "thumbnailPath" TEXT,
ADD COLUMN     "videoPath" TEXT;
-- AlterTable
ALTER TABLE "HeroVideo" ADD COLUMN "moderated" BOOLEAN NOT NULL DEFAULT false; 
/*
  Warnings:

  - The primary key for the `CollectionVideo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `collection` on the `CollectionVideo` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailPath` on the `CollectionVideo` table. All the data in the column will be lost.
  - You are about to drop the column `videoPath` on the `CollectionVideo` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `CollectionVideo` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `collectionId` to the `CollectionVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CollectionVideo" DROP CONSTRAINT "CollectionVideo_pkey",
DROP COLUMN "collection",
DROP COLUMN "thumbnailPath",
DROP COLUMN "videoPath",
ADD COLUMN     "collectionId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "price" DROP DEFAULT,
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ADD CONSTRAINT "CollectionVideo_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CollectionVideo_id_seq";

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CollectionVideo" ADD CONSTRAINT "CollectionVideo_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
/*
  Warnings:

  - You are about to drop the column `videoId` on the `Purchase` table. All the data in the column will be lost.
  - Added the required column `collectionVideoId` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_videoId_fkey";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "videoId",
ADD COLUMN     "collectionVideoId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_collectionVideoId_fkey" FOREIGN KEY ("collectionVideoId") REFERENCES "CollectionVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
