'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import {
  NewsletterStatusCard,
  StatusButton,
  StatusLink,
  type NewsletterStatusTone,
} from "@/components/newsletter/NewsletterStatusCard";
import { useResendVerification } from "@/hooks/use-resend-verification";

// Same split as the newsletter confirmation page: "invalid" is the API's 400
// (expired, already used, or never existed) and is fixed with a new link;
// "failed" is anything else, where the same link still works on retry.
type State = "loading" | "success" | "invalid" | "failed";

const TONE: Record<State, NewsletterStatusTone> = {
  loading: "loading",
  success: "success",
  invalid: "error",
  failed: "error",
};

export default function VerifyEmailClient({ token }: { token: string }) {
  const t = useTranslations("verifyEmail");
  const { data: session, update } = useSession();
  const resend = useResendVerification();
  const [state, setState] = useState<State>("loading");
  const [serverError, setServerError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setState("success");
        // When the link opens in the browser that holds the session, unlock
        // the comment box now instead of on the next focus refetch.
        await update();
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
    // `update` is a new function on every session change; depending on it
    // would re-run the effect and consume the token twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // StrictMode runs effects twice in development; the second POST would find
  // the token already consumed and flip a success to "invalid".
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    void verify();
  }, [verify]);

  // The only state where "send a new link" makes sense right here: signed in
  // on this browser with the address still unconfirmed. Anyone else either is
  // already confirmed or has to sign in first, and the comment box offers the
  // button then.
  const canResend =
    session?.user?.provider === "EMAIL_PASSWORD" && session.user.emailVerified === false;

  let description = t(
    state === "invalid" && canResend ? "invalid.descriptionCanResend" : `${state}.description`,
  );
  if (state === "failed" && serverError) description = serverError;
  if (state === "invalid" && resend.status === "sent") description = t("invalid.sent");
  if (state === "invalid" && resend.error) description = resend.error;

  return (
    <NewsletterStatusCard
      tone={TONE[state]}
      eyebrow={t("eyebrow")}
      title={t(`${state}.title`)}
      description={description}
    >
      {state === "success" && (
        <>
          <StatusLink href="/blog" primary>{t("actions.blog")}</StatusLink>
          <StatusLink href="/wall">{t("actions.wall")}</StatusLink>
        </>
      )}
      {state === "invalid" && (
        <>
          {canResend && resend.status !== "sent" && (
            <StatusButton onClick={resend.send} disabled={resend.status === "sending"} primary>
              {t("actions.resend")}
            </StatusButton>
          )}
          <StatusLink href="/blog" primary={!canResend}>{t("actions.blog")}</StatusLink>
        </>
      )}
      {state === "failed" && (
        <>
          <StatusButton onClick={verify} primary>{t("actions.retry")}</StatusButton>
          <StatusLink href="/">{t("actions.home")}</StatusLink>
        </>
      )}
    </NewsletterStatusCard>
  );
}
