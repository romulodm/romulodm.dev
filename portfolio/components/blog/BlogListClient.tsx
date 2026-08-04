'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { BlogHeader } from '@/components/blog/BlogHeader';
import { PostCard } from '@/components/blog/PostCard';
import type { PostLayout, PostSortOption } from '@/components/blog/BlogHeader';

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
  author?: { username: string; image: string | null } | null;
}

interface Props {
  initialPosts: Post[];
  allTags: string[];
  locale: string;
}

export function BlogListClient({ initialPosts, allTags, locale }: Props) {
  const t = useTranslations('blogUi.list');
  const router = useRouter();
  const [sort, setSort] = useState<PostSortOption>('newest');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 9);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [layout, setLayout] = useState<PostLayout>('grid');

  const fetchPosts = useCallback(async (newSort: PostSortOption, tag: string | null, cursor?: string) => {
    const params = new URLSearchParams({ sort: newSort, limit: '9', locale });
    if (cursor) params.set('cursor', cursor);
    if (tag) params.set('tag', tag);
    const res = await fetch(`/api/posts/public?${params}`);
    const data: { items: Post[]; nextCursor: string | null; hasMore: boolean } = await res.json();
    return data;
  }, [locale]);

  function handleSortChange(newSort: PostSortOption) {
    if (newSort === sort) return;
    setSort(newSort);
    startTransition(async () => {
      const data = await fetchPosts(newSort, activeTag);
      setPosts(data.items);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    });
  }

  function handleTagFilter(tag: string | null) {
    setActiveTag(tag);
    startTransition(async () => {
      const data = await fetchPosts(sort, tag);
      setPosts(data.items);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    });
  }

  async function handleRandom() {
    setLoadingRandom(true);
    try {
      const res = await fetch('/api/posts/random');
      const data = await res.json();
      if (data.slug) router.push(`/${locale}/blog/${data.slug}`);
    } finally {
      setLoadingRandom(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchPosts(sort, activeTag, nextCursor);
    setPosts((prev) => [...prev, ...data.items]);
    setNextCursor(data.nextCursor);
    setHasMore(data.hasMore);
    setLoadingMore(false);
  }

  const skeletonClass = layout === 'grid'
    ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
    : 'flex flex-col gap-3';

  const skeletonCardClass = layout === 'grid'
    ? 'h-72 animate-pulse rounded-2xl bg-muted'
    : 'h-36 animate-pulse rounded-2xl bg-muted';

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
        layout={layout}
        onLayoutChange={setLayout}
      />

      {isPending ? (
        <div className={skeletonClass}>
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className={skeletonCardClass} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-3 text-4xl">🔍</p>
          <p className="text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <>
          <div className={layout === 'grid'
            ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-3'
          }>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} layout={layout} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-border px-8 py-3 text-sm font-medium transition-all hover:border-foreground disabled:opacity-50"
              >
                {loadingMore ? t('loadingMore') : t('loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}