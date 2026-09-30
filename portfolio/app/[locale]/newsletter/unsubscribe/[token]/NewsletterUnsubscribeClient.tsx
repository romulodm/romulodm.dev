'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  NewsletterStatusCard,
  StatusButton,
  StatusLink,
  type NewsletterStatusTone,
} from "@/components/newsletter/NewsletterStatusCard";

// Unsubscribing waits for a click instead of running on load: mail scanners
// and link previewers open every URL in an email, and a GET that unsubscribes
// would drop people who never asked for it.
//
// "invalid" is the 400 from the API. The unsubscribe token never changes for a
// subscriber, so a 400 means the link was cut or edited, not that it expired.
type State = "confirm" | "loading" | "success" | "invalid" | "failed";

const TONE: Record<State, NewsletterStatusTone> = {
  confirm: "idle",
  loading: "loading",
  success: "success",
  invalid: "error",
  failed: "error",
};

export default function NewsletterUnsubscribeClient({ token }: { token: string }) {
  const t = useTranslations("newsletterUnsubscribe");
  const [state, setState] = useState<State>("confirm");
  const [serverError, setServerError] = useState<string | null>(null);

  const unsubscribe = async () => {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch(`/api/newsletter/unsubscribe/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (res.ok) {
        setState("success");
        return;
      }
      if (res.status === 400) {
        setState("invalid");
        return;
      }
      const data = await res.json().catch(() => null);
      setServerError(typeof data?.error === "string" ? data.error : null);
      setState("failed");
    } catch {
      setState("failed");
    }
  };

  // While the request runs, the confirm copy and buttons stay on screen so the
  // card does not jump between two layouts; only the primary button changes.
  const copyState = state === "loading" ? "confirm" : state;

  return (
    <NewsletterStatusCard
      tone={TONE[state]}
      eyebrow={t("eyebrow")}
      title={t(`${copyState}.title`)}
      description={state === "failed" && serverError ? serverError : t(`${copyState}.description`)}
    >
      {(state === "confirm" || state === "loading") && (
        <>
          <StatusButton onClick={unsubscribe} primary disabled={state === "loading"}>
            {state === "loading" ? t("actions.working") : t("actions.unsubscribe")}
          </StatusButton>
          <StatusLink href="/">{t("actions.stay")}</StatusLink>
        </>
      )}
      {state === "success" && (
        <>
          <StatusLink href="/" primary>{t("actions.home")}</StatusLink>
          <StatusLink href="/newsletter">{t("actions.newsletter")}</StatusLink>
        </>
      )}
      {state === "invalid" && <StatusLink href="/" primary>{t("actions.home")}</StatusLink>}
      {state === "failed" && (
        <>
          <StatusButton onClick={unsubscribe} primary>{t("actions.retry")}</StatusButton>
          <StatusLink href="/">{t("actions.home")}</StatusLink>
        </>
      )}
    </NewsletterStatusCard>
  );
}
