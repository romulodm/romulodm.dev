"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { voteComment } from "@/lib/comments";

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
    userVote?: number; // +1, -1 or 0/undefined
    replies?: CommentData[];
    post?: { slug: string; title: string };
};

interface CommentCardProps {
    comment: CommentData;
    depth?: number;
    onReply?: (parentId: string) => void;
    /** When true, shows the post context (used on /comments/[id] page) */
    showContext?: boolean;
}

export function CommentCard({ comment, depth = 0, onReply, showContext = false }: CommentCardProps) {
    const { data: session } = useSession();
    const [optimisticScore, setOptimisticScore] = useState(comment.score);
    const [optimisticVote, setOptimisticVote] = useState(comment.userVote ?? 0);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [showReplies, setShowReplies] = useState(true);

    const maxDepth = 4;
    const indentClass = depth > 0 ? "ml-6 border-l border-border pl-4" : "";

    function handleVote(value: 1 | -1) {
        if (!session) return;
        const newVote = optimisticVote === value ? 0 : value;
        const delta = newVote - optimisticVote;
        setOptimisticScore(s => s + delta);
        setOptimisticVote(newVote);

        startTransition(async () => {
            await voteComment({ commentId: comment.id, value: newVote as 1 | -1 | 0 });
        });
    }

    function handleShare() {
        const url = `${window.location.origin}/comments/${comment.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const timeAgo = formatTimeAgo(new Date(comment.createdAt));

    return (
        <div className={`${indentClass} py-1`}>
            <div className="group">
                {/* Context badge (for standalone view) */}
                {showContext && comment.post && (
                    <div className="mb-3">
                        <Link
                            href={`/blog/${comment.post.slug}`}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Publicação: <span className="font-medium text-foreground">{comment.post.title}</span>
                        </Link>
                    </div>
                )}

                {/* Comment Header */}
                <div className="flex items-start gap-3">
                    {/* Voting */}
                    <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                        <button
                            onClick={() => handleVote(1)}
                            disabled={!session || isPending}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                ${optimisticVote === 1
                                    ? "text-orange-500"
                                    : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                                }`}
                            aria-label="Upvote"
                        >
                            <svg className="w-4 h-4" fill={optimisticVote === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <span className={`text-xs font-mono font-medium leading-none
                            ${optimisticScore > 0 ? "text-orange-500" : optimisticScore < 0 ? "text-blue-500" : "text-muted-foreground"}`}>
                            {optimisticScore}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            disabled={!session || isPending}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                ${optimisticVote === -1
                                    ? "text-blue-500"
                                    : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                                }`}
                            aria-label="Downvote"
                        >
                            <svg className="w-4 h-4" fill={optimisticVote === -1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Author + time */}
                        <div className="flex items-center gap-2 mb-1.5">
                            <Link href={`/profile/${comment.author.username}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                <Image
                                    src={comment.author.image ?? "/default.png"}
                                    alt={comment.author.username}
                                    width={20}
                                    height={20}
                                    className="rounded-full w-5 h-5 object-cover"
                                />
                                <span className="text-sm font-medium">@{comment.author.username}</span>
                            </Link>
                            <span className="text-muted-foreground text-xs">·</span>
                            <time className="text-xs text-muted-foreground">{timeAgo}</time>
                        </div>

                        {/* Body */}
                        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {comment.bodyMd}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onReply && depth < maxDepth && session && (
                                <button
                                    onClick={() => onReply(comment.id)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Responder
                                </button>
                            )}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {copied ? "Copiado!" : "Compartilhar"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2">
                        {!showReplies && (
                            <button
                                onClick={() => setShowReplies(true)}
                                className="text-xs text-muted-foreground hover:text-foreground ml-9 transition-colors"
                            >
                                ↳ {comment.replies.length} {comment.replies.length === 1 ? "resposta" : "respostas"}
                            </button>
                        )}
                        {showReplies && comment.replies.map(reply => (
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

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} dias atrás`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}
