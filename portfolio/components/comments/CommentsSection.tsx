"use client";

import { useState, useCallback } from "react";
import { CommentCard, CommentData } from "@/components/comments/CommentCard";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { listPostComments, SortOrder } from "@/lib/comments";
import { ArrowUpDown, Clock, TrendingUp } from "lucide-react";

interface CommentsSectionProps {
    postId: string;
    initialComments: CommentData[];
    initialNextCursor: string | null;
    totalCount: number;
    initialSort?: SortOrder;
}

const SORT_OPTIONS: { value: SortOrder; label: string; icon: React.ElementType }[] = [
    { value: "score", label: "Relevância", icon: TrendingUp },
    { value: "newest", label: "Mais recentes", icon: Clock },
    { value: "oldest", label: "Mais antigos", icon: ArrowUpDown },
];

export function CommentsSection({
    postId,
    initialComments,
    initialNextCursor,
    totalCount,
    initialSort = "score",
}: CommentsSectionProps) {
    const [comments, setComments] = useState<CommentData[]>(initialComments);
    const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState<SortOrder>(initialSort);

    // Fetch with a given sort, resetting pagination
    const fetchSorted = useCallback(async (newSort: SortOrder) => {
        setLoading(true);
        try {
            const result = await listPostComments({ postId, cursor: null, sort: newSort });
            setComments(result.items);
            setNextCursor(result.nextCursor);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const handleSortChange = (newSort: SortOrder) => {
        if (newSort === sort) return;
        setSort(newSort);
        fetchSorted(newSort);
    };

    // Load more keeps current sort
    const loadMore = async () => {
        if (!nextCursor) return;
        setLoading(true);
        try {
            const result = await listPostComments({ postId, cursor: nextCursor, sort });
            setComments((prev) => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
        } finally {
            setLoading(false);
        }
    };

    // Refresh after posting — respects current sort
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await listPostComments({ postId, cursor: null, sort });
            setComments(result.items);
            setNextCursor(result.nextCursor);
        } finally {
            setLoading(false);
        }
    }, [postId, sort]);

    return (
        <section className="mt-12 pt-8 border-t border-border">
            {/* Header: count + sort selector */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <h2 className="text-lg font-semibold">
                    {totalCount > 0
                        ? `${totalCount} comentário${totalCount !== 1 ? "s" : ""}`
                        : "Comentários"}
                </h2>

                {/* Sort tab-pills */}
                <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-gray-300/30 dark:bg-neutral-800/50">
                    {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => handleSortChange(value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                ${sort === value
                                    ? "bg-gray-400/40 dark:bg-neutral-800 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Composer */}
            <div className="mb-8">
                <CommentComposer postId={postId} onSuccess={refresh} />
            </div>

            {/* List */}
            <div className="space-y-2 relative">
                {/* Soft loading overlay when re-sorting (keeps existing comments visible) */}
                {loading && comments.length > 0 && (
                    <div className="absolute inset-0 bg-background/60 rounded-lg z-10 flex items-start justify-center pt-16 pointer-events-none">
                        <span className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                    </div>
                )}

                {comments.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground py-10 text-center">
                        Nenhum comentário ainda. Seja o primeiro!
                    </p>
                )}

                {loading && comments.length === 0 && (
                    <div className="flex justify-center py-10">
                        <span className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                    </div>
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
            {nextCursor && !loading && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        className="px-5 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
                    >
                        Carregar mais comentários
                    </button>
                </div>
            )}
        </section>
    );
}
