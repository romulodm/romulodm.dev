"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WallMessageItem } from "../types";

const THEME_ICONS = ["📝", "🔥", "⚡", "🚀", "💡", "🎯"];

interface Props {
    messages: WallMessageItem[];
    locale: string;
    localeCode: string;
    isMe: boolean;
}

export function WallTab({ messages, locale, localeCode, isMe }: Props) {
    const t = useTranslations("profilePage.wall");
    if (messages.length === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <p className="text-4xl">📝</p>
                <p className="text-sm font-medium text-foreground">
                    {t("empty.title")}
                </p>
                <p className="text-xs text-muted-foreground">
                    {isMe ? t("empty.own") : t("empty.other")}
                </p>
                {isMe && (
                    <Link
                        href={`/${locale}/wall`}
                        className="inline-block mt-2 text-sm text-primary hover:underline"
                    >
                        {t("goToWall")}
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border border-border p-4 flex items-start gap-3">
                    <span className="text-xl shrink-0">{THEME_ICONS[msg.theme % THEME_ICONS.length]}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{msg.message}</p>
                        <time className="text-xs text-muted-foreground mt-1 block">
                            {new Intl.DateTimeFormat(localeCode, {
                                day: "numeric", month: "short", year: "numeric",
                            }).format(new Date(msg.createdAt))}
                        </time>
                    </div>
                </div>
            ))}
        </div>
    );
}