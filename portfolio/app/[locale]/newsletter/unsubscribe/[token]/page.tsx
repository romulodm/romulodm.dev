// src/app/newsletter/unsubscribe/[token]/page.tsx
import { Metadata } from "next";
import NewsletterUnsubscribeClient from "./NewsletterUnsubscribeClient";

export const metadata: Metadata = {
  title: "Cancelar inscrição",
  robots: "noindex",
};

export default function NewsletterUnsubscribePage({
  params,
}: {
  params: { token: string };
}) {
  return <NewsletterUnsubscribeClient token={params.token} />;
}
