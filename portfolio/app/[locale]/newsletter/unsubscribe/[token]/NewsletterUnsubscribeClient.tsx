'use client';

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type State = "confirm" | "loading" | "success" | "error";

export default function NewsletterUnsubscribeClient({ token }: { token: string }) {
  const t = useTranslations("newsletterUnsubscribe");
  const [state, setState] = useState<State>("confirm");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async () => {
    setState("loading");

    try {
      const res = await fetch(`/api/newsletter/unsubscribe/${token}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setState("success");
        setMessage(data.message ?? t("messages.success"));
      } else {
        setState("error");
        setMessage(data.error ?? t("messages.error"));
      }
    } catch {
      setState("error");
      setMessage(t("messages.network"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Top bar */}
          <div
            className={`h-1.5 w-full ${
              state === "confirm" || state === "loading"
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : state === "success"
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-red-400 to-rose-500"
            }`}
          />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {(state === "confirm") && (
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                </div>
              )}
              {state === "loading" && (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="w-9 h-9 text-muted-foreground animate-spin" />
                </div>
              )}
              {state === "success" && (
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              )}
              {state === "error" && (
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
              )}
            </div>

            {/* Heading */}
            <h1 className="type-h1 text-foreground mb-2">
              {state === "confirm" && t("heading.confirm")}
              {state === "loading" && t("heading.loading")}
              {state === "success" && t("heading.success")}
              {state === "error" && t("heading.error")}
            </h1>

            {/* Subtext */}
            {state === "confirm" && (
              <p className="text-muted-foreground text-sm mb-6">
                {t("confirmDescription")}
              </p>
            )}
            {(state === "success" || state === "error") && (
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
            )}

            {/* Confirm buttons */}
            {state === "confirm" && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleUnsubscribe}
                  className="w-full px-6 py-3 bg-destructive text-destructive-foreground
                             rounded-xl font-semibold text-sm
                             hover:opacity-90 transition-opacity"
                >
                  {t("confirmAction")}
                </button>
                <Link
                  href="/"
                  className="w-full px-6 py-3 bg-secondary text-secondary-foreground
                             rounded-xl font-semibold text-sm text-center
                             hover:opacity-90 transition-opacity"
                >
                  {t("cancelAction")}
                </Link>
              </div>
            )}

            {/* Success CTA */}
            {state === "success" && (
              <>
                <div className="mb-6 p-4 bg-muted rounded-xl text-left">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("missYou")}
                    <br />
                    <span className="text-xs">
                      {t("resubscribeAnytime")}
                    </span>
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 w-full justify-center
                             px-6 py-3 bg-primary text-primary-foreground
                             rounded-xl font-semibold text-sm
                             hover:opacity-90 transition-opacity"
                >
                  {t("home")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Error CTA */}
            {state === "error" && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 w-full justify-center
                           px-6 py-3 bg-primary text-primary-foreground
                           rounded-xl font-semibold text-sm
                           hover:opacity-90 transition-opacity"
              >
                {t("home")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
