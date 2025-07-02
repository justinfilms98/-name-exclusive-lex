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
