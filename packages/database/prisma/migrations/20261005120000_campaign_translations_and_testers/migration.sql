-- Localized subject/preview text for newsletter campaigns.
--
-- Nullable JSON: campaigns created before this migration (and CUSTOM campaigns,
-- whose HTML body is written in a single language) simply have no
-- translations, and dispatch falls back to the source subject/previewText.
ALTER TABLE "Campaign" ADD COLUMN "translations" JSONB;

-- Subscribers flagged as testers receive "send test" deliveries of draft
-- campaigns. A test delivery creates no CampaignRecipient row, so it never
-- blocks or counts toward the real send.
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "isTestRecipient" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "NewsletterSubscriber_isTestRecipient_idx" ON "NewsletterSubscriber"("isTestRecipient");
