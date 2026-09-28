"use client";

import { useTranslations } from "next-intl";
import type { LinkedDonation } from "../types";

const PROVIDERS = ["PIX", "STRIPE", "ETH"] as const;

function formatAmount(d: LinkedDonation): string {
    if (d.currency === "ETH") return `${(d.amount / 1e18).toFixed(5)} ETH`;
    if (d.currency === "USD") return `$${(d.amount / 100).toFixed(2)}`;
    return `R$ ${(d.amount / 100).toFixed(2)}`;
}

interface Props {
    donations: LinkedDonation[];
    localeCode: string;
    isMe: boolean;
}

export function DonationsTab({ donations, localeCode, isMe }: Props) {
    const t = useTranslations("profilePage.donations");
    if (donations.length === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <p className="text-4xl">☕</p>
                <p className="text-sm font-medium text-foreground">{t("empty.title")}</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {isMe ? t("empty.own") : t("empty.other")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {donations.map((d) => (
                <div
                    key={d.id}
                    className="rounded-lg border border-border p-4 flex items-start gap-4"
                >
                    <span className="text-2xl shrink-0 mt-0.5">☕</span>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                                {t("coffees", { count: d.coffees })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                · {(PROVIDERS as readonly string[]).includes(d.provider)
                                    ? t(`providers.${d.provider as (typeof PROVIDERS)[number]}`)
                                    : d.provider}
                            </span>
                        </div>

                        {!d.isPrivate && d.message && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                "{d.message}"
                            </p>
                        )}
                        {d.isPrivate && (
                            <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                                {t("privateMessage")}
                            </p>
                        )}
                    </div>

                    <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{formatAmount(d)}</p>
                        <time className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat(localeCode, {
                                day: "numeric",
                                month: "short",
                            }).format(new Date(d.createdAt))}
                        </time>
                    </div>
                </div>
            ))}
        </div>
    );
}