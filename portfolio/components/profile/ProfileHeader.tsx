"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import BanButton from "@/components/BanButton";
import type { Profile } from "./types";

interface Props {
    profile: Profile;
    isMe: boolean;
    isAdmin: boolean;
    locale: string;
    localeCode: string;
}

export function ProfileHeader({ profile, isMe, isAdmin, localeCode }: Props) {
    const t = useTranslations("profilePage");

    const joinedDate = new Intl.DateTimeFormat(localeCode, {
        year: "numeric",
        month: "long",
    }).format(new Date(profile.createdAt));

    return (
        <div className="flex items-start gap-5 mb-8">
            <div className="relative shrink-0">
                <Image
                    src={profile.image ?? "/default.png"}
                    alt={profile.username}
                    width={80}
                    height={80}
                    className="rounded-full w-20 h-20 object-cover ring-2 ring-border"
                />
            </div>

            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">@{profile.username}</h1>
                {isMe && (
                    <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                    {t("memberSince", { date: joinedDate })}
                </p>
            </div>

            {isMe && (
                <button
                    onClick={() => signOut({ callbackUrl: window.location.href })}
                    className="shrink-0 px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
                >
                    {t("signOut")}
                </button>
            )}

            {isAdmin && !isMe && (
                <BanButton userId={profile.id} initialBanned={profile.banned ?? false} />
            )}
        </div>
    );
}