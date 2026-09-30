'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  NewsletterStatusCard,
  StatusButton,
  StatusLink,
  type NewsletterStatusTone,
} from "@/components/newsletter/NewsletterStatusCard";

// "invalid" is the 400 from the API: the token expired or was already used
// (confirming clears it), which the visitor fixes by signing up again.
// "failed" is everything else (rate limit, server error, no network), where
// the same link still works and retrying is the concrete next step.
type State = "loading" | "success" | "invalid" | "failed";

const TONE: Record<State, NewsletterStatusTone> = {
  loading: "loading",
  success: "success",
  invalid: "error",
  failed: "error",
};

export default function NewsletterConfirmClient({ token }: { token: string }) {
  const t = useTranslations("newsletterConfirm");
  const [state, setState] = useState<State>("loading");
  // Server text for "failed" (already translated by the API); null falls back
  // to the local copy.
  const [serverError, setServerError] = useState<string | null>(null);

  const confirm = useCallback(async () => {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch(`/api/newsletter/confirm/${encodeURIComponent(token)}`);
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
  }, [token]);

  // StrictMode runs effects twice in development; the second GET would find
  // the token already consumed and flip a successful confirmation to "invalid".
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    void confirm();
  }, [confirm]);

  return (
    <NewsletterStatusCard
      tone={TONE[state]}
      eyebrow={t("eyebrow")}
      title={t(`${state}.title`)}
      description={state === "failed" && serverError ? serverError : t(`${state}.description`)}
    >
      {state === "success" && (
        <>
          <StatusLink href="/blog" primary>{t("actions.blog")}</StatusLink>
          <StatusLink href="/">{t("actions.home")}</StatusLink>
        </>
      )}
      {state === "invalid" && (
        <>
          <StatusLink href="/newsletter" primary>{t("actions.subscribeAgain")}</StatusLink>
          <StatusLink href="/">{t("actions.home")}</StatusLink>
        </>
      )}
      {state === "failed" && (
        <>
          <StatusButton onClick={confirm} primary>{t("actions.retry")}</StatusButton>
          <StatusLink href="/">{t("actions.home")}</StatusLink>
        </>
      )}
    </NewsletterStatusCard>
  );
}
