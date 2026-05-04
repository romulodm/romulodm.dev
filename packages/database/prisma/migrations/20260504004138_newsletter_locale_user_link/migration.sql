-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN     "preferredLocale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_userId_idx" ON "NewsletterSubscriber"("userId");

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
