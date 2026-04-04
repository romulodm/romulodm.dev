// src/app/newsletter/confirm/[token]/page.tsx
import { Metadata } from "next";
import NewsletterConfirmClient from "./NewsletterConfirmClient";

export const metadata: Metadata = {
  title: "Confirmar inscrição",
  robots: "noindex",
};

export default function NewsletterConfirmPage({
  params,
}: {
  params: { token: string };
}) {
  return <NewsletterConfirmClient token={params.token} />;
}
