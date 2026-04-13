// components/blog/BlogListClient.tsx
'use client';

import { useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { BlogHeader } from '@/components/blog/BlogHeader';
import type { PostSortOption } from '@/components/blog/BlogHeader';

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    summary: string | null;
    readingTime: number;
    coverImageUrl: string | null;
    publishedAt: Date | string | null;
    likes: number;
    views: number;
    commentsCount: number;
    postTags: { tag: string }[];
}

interface Props {
    initialPosts: Post[];
    allTags: string[];
    locale: string;
}

export function BlogListClient({ initialPosts, allTags, locale }: Props) {
    const router = useRouter();
    const [sort, setSort] = useState<PostSortOption>('newest');
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(initialPosts.length >= 9);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingRandom, setLoadingRandom] = useState(false);


    const fetchPosts = useCallback(
        async (newSort: PostSortOption, tag: string | null, cursor?: string) => {
            const params = new URLSearchParams({ sort: newSort, limit: '9', locale });
            if (cursor) params.set('cursor', cursor);
            if (tag) params.set('tag', tag);
            const res = await fetch(`/api/posts/public?${params}`);
            const data: { items: Post[]; nextCursor: string | null; hasMore: boolean } = await res.json();
            return data;
        },
        [locale]
    );

    const handleSortChange = (newSort: PostSortOption) => {
        if (newSort === sort) return;
        setSort(newSort);
        startTransition(async () => {
            const data = await fetchPosts(newSort, activeTag);
            setPosts(data.items);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        });
    };

    const handleTagFilter = (tag: string | null) => {
        setActiveTag(tag);
        startTransition(async () => {
            const data = await fetchPosts(sort, tag);
            setPosts(data.items);
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        });
    };

    const handleRandom = async () => {
        setLoadingRandom(true);
        try {
            const res = await fetch('/api/posts/random');
            const data = await res.json();
            if (data.slug) router.push(`/blog/${data.slug}`);
        } finally {
            setLoadingRandom(false);
        }
    };

    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        const data = await fetchPosts(sort, activeTag, nextCursor);
        setPosts((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setLoadingMore(false);
    };

    return (
        <div className="space-y-4">
            <BlogHeader
                allTags={allTags}
                posts={posts}
                sort={sort}
                onSortChange={handleSortChange}
                onTagFilter={handleTagFilter}
                activeTag={activeTag}
                onRandom={handleRandom}
                loadingRandom={loadingRandom}
            />

            {/* Grid de posts */}
            {isPending ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-muted-foreground">Nenhum post encontrado.</p>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-8 py-3 border border-border rounded-xl text-sm font-medium hover:border-foreground transition-all disabled:opacity-50"
                            >
                                {loadingMore ? 'Carregando...' : 'Carregar mais'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}