"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getIntlLocaleCode } from "@/lib/locales";
import { listUserComments } from "@/app/[locale]/profile/[username]/actions";

import { ProfileHeader } from "./ProfileHeader";
import { ProfileTab } from "./tabs/ProfileTab";
import { CommentsTab } from "./tabs/CommentsTab";
import { WallTab } from "./tabs/WallTab";
import { NewsletterTab } from "./tabs/NewsletterTab";
import { DonationsTab } from "./tabs/DonationsTab";
import { SettingsTab } from "./tabs/SettingsTab";

import type {
    CommentItem,
    LinkedDonation,
    NewsletterSub,
    Profile,
    Tab,
    WallMessageItem,
} from "./types";

// Re-export types so consumers only need to import from one place
export type {
    Profile,
    NewsletterSub,
    LinkedDonation,
    WallMessageItem,
} from "./types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    profile: Profile;
    isAdmin?: boolean;
    sessionId?: string | null;
    isMe: boolean;
    newsletterSub: NewsletterSub;
    linkedDonations: LinkedDonation[];
    wallMessages: WallMessageItem[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfileClient({
    profile,
    isAdmin = false,
    sessionId,
    isMe,
    newsletterSub,
    linkedDonations,
    wallMessages,
}: Props) {
    const locale = useLocale();
    const tTabs = useTranslations("profilePage.tabs");
    const localeCode = getIntlLocaleCode(locale);

    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [nextCursor, setNextCursor] = useState<{ id: string; createdAt: string } | null>(null);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsInitialized, setCommentsInitialized] = useState(false);

    const loadComments = useCallback(
        async (cursor: { id: string; createdAt: string } | null = null) => {
            setLoadingComments(true);
            try {
                const result = await listUserComments({ userId: profile.id, take: 10, cursor });
                setComments((prev) =>
                    cursor ? [...prev, ...(result.items as CommentItem[])] : (result.items as CommentItem[]),
                );
                setNextCursor(result.nextCursor);
            } finally {
                setLoadingComments(false);
            }
        },
        [profile.id],
    );

    useEffect(() => {
        if (activeTab === "comments" && !commentsInitialized) {
            setCommentsInitialized(true);
            loadComments();
        }
    }, [activeTab, commentsInitialized, loadComments]);

    // ── Tab definitions ───────────────────────────────────────────────────────

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: "profile", label: tTabs("profile") },
        { id: "comments", label: tTabs("comments"), count: profile._count.comments },
        { id: "wall", label: tTabs("wall") },
        // Donations: always visible for everyone
        { id: "donations", label: tTabs("donations") },
        // Owner-only tabs
        ...(isMe
            ? [
                { id: "newsletter" as const, label: tTabs("newsletter") },
                { id: "settings" as const, label: tTabs("settings") },
            ]
            : []),
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto px-4 py-24">
            <ProfileHeader
                profile={profile}
                isMe={isMe}
                isAdmin={isAdmin}
                locale={locale}
                localeCode={localeCode}
            />

            {/* Tab bar — overflow-x scroll with hidden scrollbar */}
            <div className="border-b border-border mb-6">
                <div
                    className="flex overflow-x-auto"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id
                                ? "text-foreground border-b-2 border-foreground -mb-px"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                            {tab.count != null && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-secondary text-accent-foreground font-mono">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab panels */}
            {activeTab === "profile" && <ProfileTab profile={profile} />}

            {activeTab === "comments" && (
                <CommentsTab
                    comments={comments}
                    loading={loadingComments}
                    nextCursor={nextCursor}
                    onLoadMore={loadComments}
                    locale={locale}
                    localeCode={localeCode}
                />
            )}

            {activeTab === "wall" && (
                <WallTab
                    messages={wallMessages}
                    locale={locale}
                    localeCode={localeCode}
                    isMe={isMe}
                />
            )}

            {activeTab === "donations" && (
                <DonationsTab
                    donations={linkedDonations}
                    localeCode={localeCode}
                    isMe={isMe}
                />
            )}

            {activeTab === "newsletter" && isMe && (
                <NewsletterTab sub={newsletterSub} email={profile.email} />
            )}

            {activeTab === "settings" && isMe && (
                <SettingsTab profile={profile} />
            )}
        </div>
    );
}