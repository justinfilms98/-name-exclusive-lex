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
