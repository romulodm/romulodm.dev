'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type State = "loading" | "success" | "error";

export default function NewsletterConfirmClient({ token }: { token: string }) {
  const t = useTranslations("newsletterConfirm");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const hasRun = useRef(false);  // ← fora do useEffect

  useEffect(() => {
    if (hasRun.current) return;  // ← segunda chamada do StrictMode é ignorada
    hasRun.current = true;

    async function confirm() {
      try {
        const res = await fetch(`/api/newsletter/confirm/${token}`, { method: "GET" });
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
    }

    confirm();
  }, [token, t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          {/* Top accent bar */}
          <div
            className={`h-1.5 w-full ${state === "loading"
              ? "bg-gradient-to-r from-muted to-muted animate-pulse"
              : state === "success"
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-red-400 to-rose-500"
              }`}
          />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
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
              {state === "loading" && t("heading.loading")}
              {state === "success" && t("heading.success")}
              {state === "error" && t("heading.error")}
            </h1>

            {/* Message */}
            <p className="text-muted-foreground text-sm mb-6">{message}</p>

            {/* Success details */}
            {state === "success" && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900 text-left">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  {t("benefits.title")}
                </p>
                <ul className="space-y-1">
                  {[
                    t("benefits.newPosts"),
                    t("benefits.tips"),
                    t("benefits.projects"),
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error details */}
            {state === "error" && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 text-left">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  {t("causes.title")}
                </p>
                <ul className="space-y-1">
                  {[
                    t("causes.expired"),
                    t("causes.alreadyConfirmed"),
                    t("causes.invalid"),
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            {state !== "loading" && (
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

            {state === "error" && (
              <p className="mt-4 text-xs text-muted-foreground">
                {t("persisting")}{" "}
                <Link href="/#newsletter" className="text-primary underline underline-offset-4">
                  {t("subscribeAgain")}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
