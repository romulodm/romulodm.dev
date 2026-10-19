"use client";

// components/auth/EmailVerificationNotice.tsx

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";

import { useResendVerification } from "@/hooks/use-resend-verification";

/** True for a signed-in e-mail/password account that has not confirmed yet. */
export function useNeedsEmailVerification(): boolean {
  const { data: session } = useSession();
  return session?.user?.provider === "EMAIL_PASSWORD" && session.user.emailVerified === false;
}

/**
 * Stands in for a composer (comment box, wall message) while the address is
 * unconfirmed. Says what is blocked, where the link went, and offers a new
 * one. It disappears on its own once the session refreshes (window focus,
 * or the confirmation page in this browser), because the session re-reads the
 * account while it is unconfirmed (lib/auth.ts, jwt callback).
 */
export function EmailVerificationNotice({ action }: { action: "comment" | "wall" }) {
  const t = useTranslations("verifyEmail.notice");
  const { data: session } = useSession();
  const { status, error, send } = useResendVerification();
  const email = session?.user?.email ?? "";

  return (
    <div className="rounded-lg border border-dashed border-border p-5 text-sm">
      <div className="flex items-start gap-3">
        <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="grid gap-1">
          <p className="font-medium text-foreground">{t(`title.${action}`)}</p>
          <p className="text-muted-foreground">
            {status === "sent" ? t("sent", { email }) : t("description", { email })}
          </p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {status !== "sent" && (
            <button
              type="button"
              onClick={send}
              disabled={status === "sending"}
              className="mt-1 w-fit text-sm font-medium text-primary underline underline-offset-2
                         hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? t("sending") : t("resend")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
