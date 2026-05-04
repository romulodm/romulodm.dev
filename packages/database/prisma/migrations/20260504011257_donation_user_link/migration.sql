-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
