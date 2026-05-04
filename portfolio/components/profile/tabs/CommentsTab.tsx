"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CommentItem } from "../types";

const PREVIEW_MAX = 280;

// ── Single comment card ───────────────────────────────────────────────────────

function CommentCard({
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
    const preview =
        comment.bodyMd.length > PREVIEW_MAX
            ? `${comment.bodyMd.slice(0, PREVIEW_MAX)}…`
            : comment.bodyMd;

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
        return () => { cancelled = true; };
    }, [preview]);

    return (
        <Link href={`/${locale}/comments/${comment.id}`} className="block group">
            <div className="rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 min-w-0">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="shrink-0">{t("commentingOn")}</span>
                    <span className="truncate">
                        {comment.post.translations[0]?.title ?? comment.post.slug}
                    </span>
                </p>

                {html ? (
                    <div
                        className="text-sm text-foreground/80 leading-relaxed line-clamp-3 overflow-hidden prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0"
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
                            day: "numeric", month: "short", year: "numeric",
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

// ── Tab ───────────────────────────────────────────────────────────────────────

interface Props {
    comments: CommentItem[];
    loading: boolean;
    nextCursor: { id: string; createdAt: string } | null;
    onLoadMore: (cursor: { id: string; createdAt: string } | null) => void;
    locale: string;
    localeCode: string;
}

export function CommentsTab({ comments, loading, nextCursor, onLoadMore, locale, localeCode }: Props) {
    const t = useTranslations("profilePage");

    return (
        <div className="space-y-3">
            {comments.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-12 text-sm">
                    {t("emptyComments")}
                </p>
            )}

            {comments.map((comment) => (
                <CommentCard
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
                        onClick={() => onLoadMore(nextCursor)}
                        className="px-5 py-2 border border-border rounded-md text-sm hover:bg-secondary transition-colors"
                    >
                        {t("loadMore")}
                    </button>
                </div>
            )}
        </div>
    );
}