// src/app/newsletter/unsubscribe/[token]/page.tsx
import { Metadata } from "next";
import NewsletterUnsubscribeClient from "./NewsletterUnsubscribeClient";

export const metadata: Metadata = {
  title: "Cancelar inscrição",
  robots: "noindex",
};

export default async function NewsletterUnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <NewsletterUnsubscribeClient token={token} />;
}