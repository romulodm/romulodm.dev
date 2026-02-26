"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthGuard } from "@/hooks/auth-guard";
import { toast } from "sonner";
import { CommentComposer } from "@/components/comments/CommentComposer";

export type CommentData = {
    id: string;
    bodyMd: string;
    score: number;
    createdAt: Date;
    author: { id: string; username: string; image: string | null };
    userVote?: number;
    replies?: CommentData[];
    post?: { slug: string; title: string };
};

interface CommentCardProps {
    comment: CommentData;
    postId: string;
    depth?: number;
    onReplySuccess?: () => void;
    showContext?: boolean;
}

// ── Markdown rendered with the same unified pipeline as the blog ──────────────
function CommentBody({ markdown }: { markdown: string }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function render() {
            const { unified } = await import("unified");
            const remarkParse = (await import("remark-parse")).default;
            const remarkGfm = (await import("remark-gfm")).default;
            const remarkRehype = (await import("remark-rehype")).default;
            const rehypeHighlight = (await import("rehype-highlight")).default;
            const rehypeStringify = (await import("rehype-stringify")).default;
            const result = await unified()
                .use(remarkParse).use(remarkGfm).use(remarkRehype)
                .use(rehypeHighlight).use(rehypeStringify)
                .process(markdown);
            if (!cancelled) setHtml(result.toString());
        }
        render();
        return () => { cancelled = true; };
    }, [markdown]);

    if (!html) {
        return <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{markdown}</p>;
    }
    return (
        <div
            className="prose prose-sm max-w-none
                prose-p:my-1 prose-p:leading-relaxed
                prose-headings:mt-3 prose-headings:mb-1
                prose-strong:font-semibold prose-strong:text-foreground
                prose-em:text-foreground/80
                prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                prose-code:bg-accent prose-code:px-1 prose-code:rounded prose-code:text-xs
                prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-accent prose-pre:rounded-lg prose-pre:p-3 prose-pre:text-xs
                prose-blockquote:border-l-2 prose-blockquote:border-border
                prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

export function CommentCard({
    comment,
    postId,
    depth = 0,
    onReplySuccess,
    showContext = false,
}: CommentCardProps) {
    const { guard } = useAuthGuard();
    const [optimisticScore, setOptimisticScore] = useState(comment.score);
    const [optimisticVote, setOptimisticVote] = useState(comment.userVote ?? 0);
    const [isPending, startTransition] = useTransition();
    const [collapsed, setCollapsed] = useState(false);
    const [replying, setReplying] = useState(false);

    const maxDepth = 5;

    // ── Vote ───────────────────────────────────────────────────────────────
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
                    if (!res.ok) { setOptimisticScore((s) => s - delta); setOptimisticVote(optimisticVote); }
                } catch { setOptimisticScore((s) => s - delta); setOptimisticVote(optimisticVote); }
            });
        });
    }

    // ── Share ──────────────────────────────────────────────────────────────
    async function handleShare() {
        const url = `${window.location.origin}/comments/${comment.id}`;
        try { await navigator.clipboard.writeText(url); } catch (_) { }
        const shareData = { title: `Comentário de @${comment.author.username}`, text: comment.bodyMd.slice(0, 100), url };
        if (navigator.share && navigator.canShare?.(shareData)) {
            try { await navigator.share(shareData); return; } catch (e: any) { if (e.name === "AbortError") return; }
        }
        toast.success("Link copiado!", { description: url });
    }

    const timeAgo = formatTimeAgo(new Date(comment.createdAt));
    const totalReplies = countReplies(comment);
    const scoreColor = optimisticScore > 0 ? "text-orange-500" : optimisticScore < 0 ? "text-blue-500" : "text-muted-foreground";

    // ── Collapsed state ────────────────────────────────────────────────────
    if (collapsed) {
        return (

            <div
                className={`flex items-start gap-0 
                ${depth > 0 ? "mt-2 -mb-1 border-t border-dashed pt-2 pl-[5px]" : ""}
                `}
            >

                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1 py-1">
                    <button onClick={() => setCollapsed(false)}
                        className="font-medium text-muted-foreground hover:text-green-600 font-bold transition-colors">
                        [+]
                    </button>
                    <Image src={comment.author.image ?? "/default.png"} alt={comment.author.username}
                        width={18} height={18} className="rounded-full w-4 h-4 object-cover opacity-50 shrink-0" />
                    <span>
                        <span className="font-medium text-foreground/60">@{comment.author.username}</span>
                        {" · "}{timeAgo}
                        {totalReplies > 0 && ` · ${totalReplies + 1} ocultos`}
                    </span>
                </div>
            </div>
        );
    }

    // ── Expanded ───────────────────────────────────────────────────────────
    return (
        <div
            className={`flex items-start gap-0 
                ${depth > 0 ? "mt-3 border-t border-dashed pt-3 pl-[5px]" : ""}
                `}
        >

            {/* ── LEFT COLUMN: avatar + vote + collapse bar ── */}
            <div className="flex items-start gap-2 flex-1 min-w-0">

                {/*
                  Single column that holds:
                  1. Avatar (top)
                  2. Vote buttons (desktop only)
                  3. Collapse bar with [-] button — spans remaining height
                */}
                <div className="flex flex-col items-center shrink-0 self-stretch" style={{ width: 28 }}>
                    {/* Avatar */}
                    <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                        <Image src={comment.author.image ?? "/default.png"} alt={comment.author.username}
                            width={28} height={28}
                            className="rounded-full w-7 h-7 object-cover ring-1 ring-border hover:opacity-80 transition-opacity" />
                    </Link>

                    {/* Desktop vote — vertical under avatar */}
                    <div className="hidden sm:flex flex-col items-center mt-0.5">
                        <button onClick={() => handleVote(1)} disabled={isPending} title="Upvote"
                            className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                ${optimisticVote === 1 ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}`}>
                            <svg className="w-3.5 h-3.5" fill={optimisticVote === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <span className={`text-xs font-mono font-semibold leading-none my-0.5 ${scoreColor}`}>{optimisticScore}</span>
                        <button onClick={() => handleVote(-1)} disabled={isPending} title="Downvote"
                            className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                ${optimisticVote === -1 ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}>
                            <svg className="w-3.5 h-3.5" fill={optimisticVote === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/*
                      Collapse bar — sits below vote, spans rest of column height.
                      group/thread: hover turns bar + button red, click collapses.
                    */}
                    <div
                        className="group/thread flex-1 flex flex-col items-center w-full cursor-pointer mt-1"
                        onClick={() => setCollapsed(true)}
                        title="Ocultar comentário"
                    >
                        {/* Top segment */}
                        <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors" style={{ minHeight: 8 }} />

                        {/* Always-visible [-] button */}
                        <div className="shrink-0 w-4 h-4 rounded-full border border-border bg-background
                            flex items-center justify-center
                            text-muted-foreground group-hover/thread:text-red-500 group-hover/thread:border-red-400
                            transition-colors text-[10px] font-bold leading-none select-none my-0.5">
                            −
                        </div>

                        {/* Bottom segment */}
                        <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors" style={{ minHeight: 8 }} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-2 pl-2">
                    {/* Context badge */}
                    {showContext && comment.post && (
                        <div className="mb-2">
                            <Link href={`/blog/${comment.post.slug}`}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium text-foreground">{comment.post.title}</span>
                            </Link>
                        </div>
                    )}

                    {/* Author + time */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Link href={`/profile/${comment.author.username}`} className="text-sm font-semibold hover:underline">
                            @{comment.author.username}
                        </Link>
                        <span className="text-muted-foreground text-xs">·</span>
                        <time className="text-xs text-muted-foreground">{timeAgo}</time>
                    </div>

                    {/* Body */}
                    <CommentBody markdown={comment.bodyMd} />

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {/* Mobile vote */}
                        <div className="flex sm:hidden items-center gap-0.5 mr-2">
                            <button onClick={() => handleVote(1)} disabled={isPending}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                    ${optimisticVote === 1 ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}`}>
                                <svg className="w-3.5 h-3.5" fill={optimisticVote === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className={`text-xs font-mono font-semibold min-w-[1.5ch] text-center ${scoreColor}`}>{optimisticScore}</span>
                            <button onClick={() => handleVote(-1)} disabled={isPending}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                    ${optimisticVote === -1 ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}>
                                <svg className="w-3.5 h-3.5" fill={optimisticVote === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Reply */}
                        {depth < maxDepth && (
                            <button
                                onClick={() => guard(() => setReplying((r) => !r))}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                                    ${replying ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Responder
                            </button>
                        )}

                        {/* Share */}
                        <button onClick={handleShare}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Compartilhar
                        </button>
                    </div>

                    {/* Reply composer */}
                    {replying && (
                        <div className="mt-3">
                            <CommentComposer
                                postId={postId}
                                parentId={comment.id}
                                autoFocus
                                onSuccess={() => { setReplying(false); onReplySuccess?.(); }}
                                onCancel={() => setReplying(false)}
                            />
                        </div>
                    )}

                    {/* Nested replies — indentation handled by marginLeft on each CommentCard */}
                    {(comment.replies?.length ?? 0) > 0 && (
                        <>
                            {comment.replies!.map((reply) => (
                                <CommentCard key={reply.id} comment={reply} postId={postId}
                                    depth={depth + 1} onReplySuccess={onReplySuccess} />
                            ))}
                        </>
                    )}
                </div>{/* end content */}
            </div>{/* end left column + content row */}
        </div>
    );
}

function countReplies(c: CommentData): number {
    if (!c.replies?.length) return 0;
    return c.replies.length + c.replies.reduce((acc, r) => acc + countReplies(r), 0);
}

function formatTimeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} dias atrás`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}
