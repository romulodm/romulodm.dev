-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banReason" VARCHAR(500);

-- CreateIndex
CREATE INDEX "Donation_status_isPrivate_createdAt_idx" ON "Donation"("status", "isPrivate", "createdAt");

-- CreateIndex
CREATE INDEX "Donation_status_isPrivate_currency_amount_idx" ON "Donation"("status", "isPrivate", "currency", "amount");

-- CreateIndex
CREATE INDEX "Post_status_likes_publishedAt_idx" ON "Post"("status", "likes", "publishedAt");

-- CreateIndex
CREATE INDEX "Post_status_views_publishedAt_idx" ON "Post"("status", "views", "publishedAt");
