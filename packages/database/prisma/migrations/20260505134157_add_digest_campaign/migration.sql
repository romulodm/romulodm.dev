-- AlterEnum
ALTER TYPE "CampaignType" ADD VALUE 'DIGEST';

-- CreateTable
CREATE TABLE "CampaignPost" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CampaignPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignPost_campaignId_order_idx" ON "CampaignPost"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPost_campaignId_postId_key" ON "CampaignPost"("campaignId", "postId");

-- AddForeignKey
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPost" ADD CONSTRAINT "CampaignPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
