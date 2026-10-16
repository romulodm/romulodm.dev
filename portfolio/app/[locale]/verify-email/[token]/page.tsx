import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewsletterStatusMain } from "@/components/newsletter/NewsletterStatusCard";
import VerifyEmailClient from "./VerifyEmailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "verifyEmail" });
  return { title: t("metaTitle"), robots: "noindex" };
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NewsletterStatusMain>
        <VerifyEmailClient token={token} />
      </NewsletterStatusMain>
    </div>
  );
}
