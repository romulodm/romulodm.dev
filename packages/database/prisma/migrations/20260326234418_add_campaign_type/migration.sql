-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('POST_BASED', 'CUSTOM');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "type" "CampaignType" NOT NULL DEFAULT 'CUSTOM';

-- CreateIndex
CREATE INDEX "Campaign_type_idx" ON "Campaign"("type");
