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

            {/* Comment list — reply composers open inline inside each CommentCard */}
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
                        postId={postId}
                        depth={0}
                        onReplySuccess={refresh}
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
                        ) : "Carregar mais comentários"}
                    </button>
                </div>
            )}
        </section>
    );
}
