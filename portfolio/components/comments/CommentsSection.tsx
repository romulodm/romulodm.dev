"use client";

import { useState, useCallback } from "react";
import { CommentCard, CommentData } from "@/components/comments/CommentCard";
import { CommentComposer } from "@/components//comments/CommentComposer";
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
            setComments(prev => [...prev, ...result.items]);
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
        setReplyingTo(prev => prev === parentId ? null : parentId);
    };

    return (
        <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold mb-6">
                {totalCount > 0 ? `${totalCount} comentário${totalCount !== 1 ? "s" : ""}` : "Comentários"}
            </h2>

            {/* New comment */}
            <div className="mb-8">
                <CommentComposer
                    postId={postId}
                    onSuccess={refresh}
                    placeholder="O que você achou? Compartilhe sua opinião..."
                />
            </div>

            {/* List */}
            <div className="space-y-1 divide-y divide-border/50">
                {comments.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Nenhum comentário ainda. Seja o primeiro!
                    </p>
                )}

                {comments.map(comment => (
                    <div key={comment.id} className="py-3">
                        <CommentCard
                            comment={comment}
                            depth={0}
                            onReply={handleReply}
                        />
                        {replyingTo === comment.id && (
                            <div className="ml-9 mt-3">
                                <CommentComposer
                                    postId={postId}
                                    parentId={comment.id}
                                    autoFocus
                                    placeholder={`Respondendo @${comment.author.username}...`}
                                    onSuccess={() => {
                                        setReplyingTo(null);
                                        refresh();
                                    }}
                                    onCancel={() => setReplyingTo(null)}
                                />
                            </div>
                        )}
                        {/* Nested replies reply boxes */}
                        {comment.replies?.map(reply => (
                            replyingTo === reply.id && (
                                <div key={`reply-composer-${reply.id}`} className="ml-16 mt-3">
                                    <CommentComposer
                                        postId={postId}
                                        parentId={reply.id}
                                        autoFocus
                                        placeholder={`Respondendo @${reply.author.username}...`}
                                        onSuccess={() => {
                                            setReplyingTo(null);
                                            refresh();
                                        }}
                                        onCancel={() => setReplyingTo(null)}
                                    />
                                </div>
                            )
                        ))}
                    </div>
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
