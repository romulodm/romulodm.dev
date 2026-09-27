'use client';

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { NewsletterSubscribeForm } from "@/components/newsletter/NewsletterSubscribeForm";
import { getIntlLocaleCode } from "@/lib/locales";

interface NewsletterCardProps {
  subscriberCount?: number;
}

export default function NewsletterCard({ subscriberCount = 0 }: NewsletterCardProps) {
  const locale = useLocale();
  const t = useTranslations("newsletterCard");
  const localeCode = useMemo(() => getIntlLocaleCode(locale), [locale]);
  const formatNumber = useMemo(() => new Intl.NumberFormat(localeCode), [localeCode]);

  return (
    <section className="w-full mx-auto px-6 py-12">
      <div className="w-full flex flex-col sm:flex-row items-center justify-center mb-1 gap-1">
        <h2 className="type-h2 mb-1.5 text-center text-secondary sm:whitespace-nowrap">
          {t("title")}
        </h2>
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

        <NewsletterSubscribeForm />

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
