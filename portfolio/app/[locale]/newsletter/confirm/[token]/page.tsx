// src/app/newsletter/confirm/[token]/page.tsx
import { Metadata } from "next";
import NewsletterConfirmClient from "./NewsletterConfirmClient";

export const metadata: Metadata = {
  title: "Confirmar inscrição",
  robots: "noindex",
};

export default async function NewsletterConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <NewsletterConfirmClient token={token} />;
}
