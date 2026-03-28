-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SuspiciousComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "bodyMd" VARCHAR(2000) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspiciousComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuspiciousComment_authorId_idx" ON "SuspiciousComment"("authorId");

-- CreateIndex
CREATE INDEX "SuspiciousComment_postId_idx" ON "SuspiciousComment"("postId");

-- CreateIndex
CREATE INDEX "SuspiciousComment_createdAt_idx" ON "SuspiciousComment"("createdAt");

-- AddForeignKey
ALTER TABLE "SuspiciousComment" ADD CONSTRAINT "SuspiciousComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousComment" ADD CONSTRAINT "SuspiciousComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
