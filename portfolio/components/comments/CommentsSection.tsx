"use client";

import { useState, useCallback } from "react";
import { CommentCard, CommentData } from "@/components/comments/CommentCard";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { listPostComments } from "@/lib/comments";

interface CommentsSectionProps {
    postId: string;
    initialComments: CommentData[];
    initialNextCursor: string | null;
    totalCount: number;
}

export function CommentsSection({
    postId,
    initialComments,
    initialNextCursor,
    totalCount,
}: CommentsSectionProps) {
    const [comments, setComments] = useState<CommentData[]>(initialComments);
    const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
    const [loading, setLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const loadMore = async () => {
        if (!nextCursor) return;
        setLoading(true);
        try {
            const result = await listPostComments({ postId, cursor: nextCursor });
            setComments((prev) => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
        } finally {
            setLoading(false);
        }
    };

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listPostComments({ postId, cursor: null });
            setComments(result.items);
            setNextCursor(result.nextCursor);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const handleReply = (parentId: string) => {
        setReplyingTo((prev) => (prev === parentId ? null : parentId));
    };

    // Recursively finds if a commentId is nested somewhere in a comment tree
    function findCommentById(list: CommentData[], id: string): CommentData | null {
        for (const c of list) {
            if (c.id === id) return c;
            if (c.replies) {
                const found = findCommentById(c.replies, id);
                if (found) return found;
            }
        }
        return null;
    }

    const replyingComment = replyingTo ? findCommentById(comments, replyingTo) : null;

    return (
        <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold mb-6">
                {totalCount > 0
                    ? `${totalCount} comentário${totalCount !== 1 ? "s" : ""}`
                    : "Comentários"}
            </h2>

            {/* New top-level comment */}
            <div className="mb-8">
                <CommentComposer postId={postId} onSuccess={refresh} />
            </div>

            {/* Reply composer (floating context) */}
            {replyingTo && replyingComment && (
                <div className="mb-6 rounded-lg border border-border/60 bg-accent/20 p-3">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Respondendo @{replyingComment.author.username}
                    </p>
                    <CommentComposer
                        postId={postId}
                        parentId={replyingTo}
                        autoFocus
                        onSuccess={() => {
                            setReplyingTo(null);
                            refresh();
                        }}
                        onCancel={() => setReplyingTo(null)}
                    />
                </div>
            )}

            {/* Comment list */}
            <div className="space-y-2">
                {comments.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground py-10 text-center">
                        Nenhum comentário ainda. Seja o primeiro!
                    </p>
                )}

                {comments.map((comment) => (
                    <CommentCard
                        key={comment.id}
                        comment={comment}
                        depth={0}
                        onReply={handleReply}
                    />
                ))}
            </div>

            {/* Load more */}
            {nextCursor && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-5 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                                Carregando…
                            </span>
                        ) : (
                            "Carregar mais comentários"
                        )}
                    </button>
                </div>
            )}
        </section>
    );
}
