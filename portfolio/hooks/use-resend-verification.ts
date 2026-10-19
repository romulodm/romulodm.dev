"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "sent";

/**
 * Requests a new confirmation link for the signed-in account. Shared by the
 * notice that stands in for the comment box / wall composer and by the
 * confirmation page when a link has expired.
 */
export function useResendVerification() {
  const t = useTranslations("verifyEmail");
  const { update } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : t("resendError"));
        setStatus("idle");
        return;
      }
      if (data?.alreadyVerified) {
        // Confirmed somewhere else in the meantime: refreshing the session
        // is what removes the notice.
        await update();
      }
      setStatus("sent");
    } catch {
      setError(t("resendError"));
      setStatus("idle");
    }
  }, [t, update]);

  return { status, error, send };
}
