// src/app/newsletter/unsubscribe/[token]/page.tsx
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NewsletterUnsubscribeClient from "./NewsletterUnsubscribeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletterUnsubscribe" });
  return { title: t("metaTitle"), robots: "noindex" };
}

export default async function NewsletterUnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <NewsletterUnsubscribeClient token={token} />;
}