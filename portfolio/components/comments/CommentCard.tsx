"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useAuthGuard } from "@/hooks/auth-guard";
import { toast } from "sonner";

export type CommentData = {
    id: string;
    bodyMd: string;
    score: number;
    createdAt: Date;
    author: {
        id: string;
        username: string;
        image: string | null;
    };
    userVote?: number;
    replies?: CommentData[];
    post?: { slug: string; title: string };
};

interface CommentCardProps {
    comment: CommentData;
    depth?: number;
    onReply?: (parentId: string) => void;
    showContext?: boolean;
}

export function CommentCard({ comment, depth = 0, onReply, showContext = false }: CommentCardProps) {
    const { data: session } = useSession();
    const { guard } = useAuthGuard();
    const [optimisticScore, setOptimisticScore] = useState(comment.score);
    const [optimisticVote, setOptimisticVote] = useState(comment.userVote ?? 0);
    const [isPending, startTransition] = useTransition();
    // collapsed: true = this comment (and replies) are hidden, only the collapsed indicator shows
    const [collapsed, setCollapsed] = useState(false);

    const maxDepth = 5;
    // Each depth level gets a left border with a distinct color
    const borderColors = [
        "border-border/0",       // depth 0 — no indent
        "border-blue-500/40",
        "border-purple-500/40",
        "border-green-500/40",
        "border-orange-500/40",
        "border-pink-500/40",
    ];
    const borderColor = borderColors[Math.min(depth, borderColors.length - 1)];

    // ── Vote ────────────────────────────────────────────────────────────────

    function handleVote(value: 1 | -1) {
        guard(async () => {
            const newVote = optimisticVote === value ? 0 : value;
            const delta = newVote - optimisticVote;
            setOptimisticScore((s) => s + delta);
            setOptimisticVote(newVote);

            startTransition(async () => {
                try {
                    const res = await fetch(`/api/comments/${comment.id}/vote`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ value: newVote }),
                    });
                    if (!res.ok) {
                        // revert
                        setOptimisticScore((s) => s - delta);
                        setOptimisticVote(optimisticVote);
                    }
                } catch {
                    setOptimisticScore((s) => s - delta);
                    setOptimisticVote(optimisticVote);
                }
            });
        });
    }

    // ── Share ───────────────────────────────────────────────────────────────

    async function handleShare() {
        const url = `${window.location.origin}/comments/${comment.id}`;
        const shareData = {
            title: `Comentário de @${comment.author.username}`,
            text: comment.bodyMd.slice(0, 100) + (comment.bodyMd.length > 100 ? "…" : ""),
            url,
        };

        // Always copy to clipboard first
        try {
            await navigator.clipboard.writeText(url);
        } catch (_) { }

        // Try Web Share API (mobile / supported browsers)
        if (navigator.share && navigator.canShare?.(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (e: any) {
                // User cancelled — that's fine, link is already copied
                if (e.name === "AbortError") return;
            }
        }

        // Fallback: just notify clipboard copy
        toast.success("Link copiado!", { description: url });
    }

    // ── Render ──────────────────────────────────────────────────────────────

    const timeAgo = formatTimeAgo(new Date(comment.createdAt));
    const hasReplies = (comment.replies?.length ?? 0) > 0;

    // Collapsed state — show only a one-liner
    if (collapsed) {
        return (
            <div className={depth > 0 ? `ml-4 pl-3 border-l-2 ${borderColor}` : ""}>
                <div className="flex items-center gap-2 py-1">
                    {/* Expand thread line / button */}
                    <button
                        onClick={() => setCollapsed(false)}
                        className="shrink-0 w-4 flex flex-col items-center self-stretch group"
                        title="Expandir"
                    >
                        <span className="w-0.5 flex-1 bg-border/50 group-hover:bg-foreground/40 transition-colors rounded-full" />
                    </button>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Image
                            src={comment.author.image ?? "/default.png"}
                            alt={comment.author.username}
                            width={16}
                            height={16}
                            className="rounded-full w-4 h-4 object-cover opacity-60"
                        />
                        <span className="font-medium text-foreground/70">@{comment.author.username}</span>
                        <span>·</span>
                        <span>{timeAgo}</span>
                        <span>·</span>
                        <button
                            onClick={() => setCollapsed(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            [{hasReplies ? `${1 + (comment.replies?.length ?? 0)} ocultos` : "oculto"}]
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={depth > 0 ? `ml-4 pl-0 border-l-2 ${borderColor}` : ""}>
            <div className="py-1.5">
                {/* Context badge */}
                {showContext && comment.post && (
                    <div className="mb-2 ml-7">
                        <Link
                            href={`/blog/${comment.post.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Publicação:{" "}
                            <span className="font-medium text-foreground">{comment.post.title}</span>
                        </Link>
                    </div>
                )}

                <div className="flex items-start gap-2">
                    {/* Left gutter: collapse line + vote */}
                    <div className="flex flex-col items-center shrink-0 self-stretch" style={{ width: 28 }}>
                        {/* Collapse thread line (clickable vertical bar) */}
                        <button
                            onClick={() => setCollapsed(true)}
                            title="Ocultar thread"
                            className="group flex flex-col items-center w-full"
                            style={{ minHeight: 20 }}
                        >
                            <Image
                                src={comment.author.image ?? "/default.png"}
                                alt={comment.author.username}
                                width={24}
                                height={24}
                                className="rounded-full w-6 h-6 object-cover ring-1 ring-border shrink-0"
                            />
                            {/* Thread line below avatar */}
                            <span className="w-0.5 flex-1 mt-1 bg-border/40 group-hover:bg-foreground/30 transition-colors rounded-full cursor-pointer" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                        {/* Author + time */}
                        <div className="flex items-center gap-1.5 mb-1">
                            <Link
                                href={`/profile/${comment.author.username}`}
                                className="text-sm font-semibold hover:underline"
                            >
                                @{comment.author.username}
                            </Link>
                            <span className="text-muted-foreground text-xs">·</span>
                            <time className="text-xs text-muted-foreground">{timeAgo}</time>
                        </div>

                        {/* Body — render markdown */}
                        <div
                            className="text-sm text-foreground/90 leading-relaxed prose prose-sm max-w-none
                                prose-strong:text-foreground prose-em:text-foreground/80
                                prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                                prose-code:bg-accent prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                                prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.bodyMd) }}
                        />

                        {/* Actions — always visible */}
                        <div className="flex items-center gap-1 mt-2">
                            {/* Vote */}
                            <div className="flex items-center gap-0.5 mr-1">
                                <button
                                    onClick={() => handleVote(1)}
                                    disabled={isPending}
                                    title="Upvote"
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                        ${optimisticVote === 1
                                            ? "text-orange-500"
                                            : "text-muted-foreground hover:text-orange-500"
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill={optimisticVote === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <span className={`text-xs font-mono font-semibold min-w-[1.5ch] text-center
                                    ${optimisticScore > 0 ? "text-orange-500" : optimisticScore < 0 ? "text-blue-500" : "text-muted-foreground"}`}>
                                    {optimisticScore}
                                </span>
                                <button
                                    onClick={() => handleVote(-1)}
                                    disabled={isPending}
                                    title="Downvote"
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                        ${optimisticVote === -1
                                            ? "text-blue-500"
                                            : "text-muted-foreground hover:text-blue-500"
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill={optimisticVote === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Reply */}
                            {onReply && depth < maxDepth && (
                                <button
                                    onClick={() => guard(() => onReply!(comment.id))}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Responder
                                </button>
                            )}

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Compartilhar
                            </button>

                            {/* Collapse */}
                            <button
                                onClick={() => setCollapsed(true)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors ml-auto"
                                title="Ocultar"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {hasReplies && (
                    <div className="mt-0.5">
                        {comment.replies!.map((reply) => (
                            <CommentCard
                                key={reply.id}
                                comment={reply}
                                depth={depth + 1}
                                onReply={onReply}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Markdown renderer (client-side, same logic as preview) ────────────────────

function renderMarkdown(md: string): string {
    return md
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
        .replace(/\n/g, "<br>");
}

// ── Time helper ───────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} dias atrás`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}
