// src/app/newsletter/confirm/[token]/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NewsletterConfirmClient from "./NewsletterConfirmClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletterConfirm" });
  return { title: t("metaTitle"), robots: "noindex" };
}

export default async function NewsletterConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <NewsletterConfirmClient token={token} />;
}
