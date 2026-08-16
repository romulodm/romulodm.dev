'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getIntlLocaleCode } from "@/lib/locales";

interface NewsletterCardProps {
  subscriberCount?: number;
}

export default function NewsletterCard({ subscriberCount = 0 }: NewsletterCardProps) {
  const locale = useLocale();
  const t = useTranslations("newsletterCard");
  const localeCode = useMemo(() => getIntlLocaleCode(locale), [locale]);
  const formatNumber = useMemo(() => new Intl.NumberFormat(localeCode), [localeCode]);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || state === "loading") return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setState("success");
        setEmail("");
        return;
      }

      setState("error");
      setErrorMsg(data.error ?? t("errors.generic"));
    } catch {
      setState("error");
      setErrorMsg(t("errors.connection"));
    }
  };

  if (state === "success") {
    return (
      <section className="w-full h-full mx-auto px-6 py-12">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-secondary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("success.title")}
          </h2>
          <p className="text-muted-foreground">{t("success.description")}</p>
          <button
            onClick={() => setState("idle")}
            className="mt-6 text-sm text-secondary underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            {t("success.useAnotherEmail")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mx-auto px-6 py-12">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center mb-1 gap-1">
        <h1 className="text-2xl sm:text-3xl mb-1.5 text-center font-extrabold text-secondary leading-tight sm:whitespace-nowrap">
          {t("title")}
        </h1>
        <img
          src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/512.gif"
          alt={t("medalAlt")}
          width="27"
          height="27"
          className="shrink-0"
        />
      </div>

      <div className="max-w-xl mx-auto">
        <p className="text-lg text-center text-foreground mb-4">
          {t("description")}
          <br />
          {subscriberCount > 0 && (
            <>
              {t("subscribers.prefix")}{" "}
              <span className="font-bold text-foreground">
                {formatNumber.format(subscriberCount)}
              </span>{" "}
              {t("subscribers.suffix", { count: subscriberCount })}
            </>
          )}
        </p>

        <form onSubmit={handleSubmit} className="relative w-full">
          <label htmlFor="newsletter-email" className="sr-only">
            {t("emailLabel")}
          </label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (state === "error") setState("idle");
            }}
            disabled={state === "loading"}
            className="h-14 w-full rounded-sm border-border bg-card pl-6 pr-16 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            aria-label={t("submit")}
            className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-sm transition-transform hover:scale-105 disabled:opacity-40"
            disabled={state === "loading" || !email}
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </form>

        {state === "error" && (
          <p className="mt-2 text-sm text-destructive text-center">{errorMsg}</p>
        )}

        <p className="text-sm mt-4 text-muted-foreground text-center">
          <span className="font-bold text-foreground">{t("privacy.prefix")} </span>
          {t.rich("privacy.suffix", {
            link: (chunks) => (
              <Link
                href="/legal/privacy-policy"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </section>
  );
}
