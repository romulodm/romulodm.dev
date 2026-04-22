"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { listUserComments } from "@/app/[locale]/profile/[username]/actions";
import BanButton from "./BanButton";
import { getIntlLocaleCode } from "@/lib/locales";

type Profile = {
  id: string;
  username: string;
  email: string;
  banned: boolean;
  image: string | null;
  createdAt: string | Date;
  _count: { comments: number };
};

type CommentItem = {
  id: string;
  bodyMd: string;
  createdAt: Date;
  post: { slug: string; translations: { title: string }[] };
  parent?: { id: string; bodyMd: string; author: { username: string } } | null;
};

type Tab = "profile" | "comments";

export default function ProfileClient({
  profile,
  isAdmin,
  sessionId,
}: {
  profile: Profile;
  isAdmin?: boolean;
  sessionId?: string | null;
}) {
  const { data } = useSession();
  const locale = useLocale();
  const t = useTranslations("profilePage");
  const localeCode = getIntlLocaleCode(locale);
  const isMe = data?.user?.id === profile.id;
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<{ id: string; createdAt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadComments = useCallback(async (cursor: { id: string; createdAt: string } | null = null) => {
    setLoading(true);
    try {
      const result = await listUserComments({ userId: profile.id, take: 10, cursor });
      if (cursor) {
        setComments((previous) => [...previous, ...(result.items as CommentItem[])]);
      } else {
        setComments(result.items as CommentItem[]);
      }
      setNextCursor(result.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    if (activeTab === "comments" && !initialized) {
      setInitialized(true);
      loadComments();
    }
  }, [activeTab, initialized, loadComments]);

  const joinedDate = new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "long",
  }).format(new Date(profile.createdAt));

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
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
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="shrink-0 px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
          >
            {t("signOut")}
          </button>
        )}

        {isAdmin && !isMe && (
          <BanButton userId={profile.id} initialBanned={profile.banned ?? false} />
        )}
      </div>

      <div className="border-b border-border mb-6">
        <div className="flex gap-0">
          {[
            { id: "profile" as Tab, label: t("tabs.profile") },
            { id: "comments" as Tab, label: t("tabs.comments"), count: profile._count.comments },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
              {"count" in tab && tab.count != null && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-accent text-accent-foreground font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("stats.title")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-md bg-accent/50">
                <p className="text-2xl font-bold">{profile._count.comments}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("stats.comments")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "comments" && (
        <div className="space-y-3">
          {comments.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              {t("emptyComments")}
            </p>
          )}

          {comments.map((comment) => (
            <ProfileCommentItem
              key={comment.id}
              comment={comment}
              locale={locale}
              localeCode={localeCode}
            />
          ))}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          )}

          {nextCursor && !loading && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => loadComments(nextCursor)}
                className="px-5 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
              >
                {t("loadMore")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PREVIEW_MAX = 280;

function ProfileCommentItem({
  comment,
  locale,
  localeCode,
}: {
  comment: CommentItem;
  locale: string;
  localeCode: string;
}) {
  const t = useTranslations("profilePage");
  const [html, setHtml] = useState("");
  const isTruncated = comment.bodyMd.length > PREVIEW_MAX;
  const preview = isTruncated ? `${comment.bodyMd.slice(0, PREVIEW_MAX)}…` : comment.bodyMd;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { unified } = await import("unified");
      const remarkParse = (await import("remark-parse")).default;
      const remarkGfm = (await import("remark-gfm")).default;
      const remarkRehype = (await import("remark-rehype")).default;
      const rehypeSanitize = (await import("rehype-sanitize")).default;
      const rehypeStringify = (await import("rehype-stringify")).default;
      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(preview);
      if (!cancelled) setHtml(result.toString());
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [preview]);

  return (
    <Link href={`/${locale}/comments/${comment.id}`} className="block group">
      <div className="rounded-lg border border-border p-4 hover:bg-accent/30 transition-colors">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 min-w-0">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="shrink-0">{t("commentingOn")}</span>
          <span className="truncate">{comment.post.translations[0]?.title ?? comment.post.slug}</span>
        </p>

        {html ? (
          <div
            className="text-sm text-foreground/80 leading-relaxed line-clamp-3 overflow-hidden prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0 prose-strong:text-foreground prose-em:text-foreground/70 prose-a:text-blue-500 prose-a:no-underline prose-code:bg-accent prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-2 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-ul:my-0 prose-ol:my-0 prose-li:my-0"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {preview}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <time className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(localeCode, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(comment.createdAt))}
          </time>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
            {t("viewComment")}
          </span>
        </div>
      </div>
    </Link>
  );
}
