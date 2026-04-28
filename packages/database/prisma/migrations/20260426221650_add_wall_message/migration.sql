/*
  Warnings:

  - You are about to alter the column `message` on the `Donation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(700)` to `VarChar(500)`.
  - You are about to drop the `OnChainDonation` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Donation" ALTER COLUMN "message" SET DATA TYPE VARCHAR(500);

-- DropTable
DROP TABLE "OnChainDonation";

-- CreateTable
CREATE TABLE "WallMessage" (
    "id" TEXT NOT NULL,
    "message" VARCHAR(100) NOT NULL,
    "authorId" TEXT NOT NULL,
    "theme" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WallMessage_createdAt_idx" ON "WallMessage"("createdAt");

-- CreateIndex
CREATE INDEX "WallMessage_authorId_idx" ON "WallMessage"("authorId");

-- AddForeignKey
ALTER TABLE "WallMessage" ADD CONSTRAINT "WallMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
