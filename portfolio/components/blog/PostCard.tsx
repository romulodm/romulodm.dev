// components/ui/PostCard.tsx
import Link from 'next/link';
import { Heart, Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { formatCount } from '@/lib/format-number';
import type { PostLayout } from '@/components/blog/BlogHeader';

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

export function PostMetaBadges({ likes, views, comments }: { likes: number; views: number; comments: number }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Eye size={15} className="mt-[1px]" />
        {formatCount(views)}
      </span>
      <span className="flex items-center gap-1">
        <Heart size={15} className="mt-[1px]" />
        {formatCount(likes)}
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={15} className="mt-[1px]" />
        {formatCount(comments)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row (list) layout
// ---------------------------------------------------------------------------
function PostCardRow({ post }: { post: Post }) {
  const tags = post.postTags.map((t) => t.tag);

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="flex flex-row h-full border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-400/70 dark:hover:border-neutral-700">
        {/* Cover — fixed width on the left */}
        <div className="shrink-0 w-48 sm:w-56 md:w-64 overflow-hidden">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-3xl opacity-30">✍️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-5 py-4 gap-2 min-w-0">
          {/* Top row: language badge + date */}
          <div className="flex items-center justify-between gap-2">
            <span className="bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-white/60 text-xs flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0">
              Portuguese
            </span>
            {post.publishedAt && (
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(post.publishedAt))}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="font-bold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>

          {/* Summary */}
          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {post.summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex flex-row items-center justify-between gap-2 pt-3 border-t border-border mt-auto">
            <PostMetaBadges likes={post.likes} views={post.views} comments={post.commentsCount} />
            {post.publishedAt && (
              <span className="text-xs text-muted-foreground shrink-0">
                {post.readingTime} min de leitura
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Grid layout (original)
// ---------------------------------------------------------------------------
function PostCardGrid({ post }: { post: Post }) {
  const tags = post.postTags.map((t) => t.tag);

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-400/70 dark:hover:border-neutral-700">
        <div className="flex px-4 py-4 justify-between items-center text-gray-500">
          <span className="bg-blue-100 dark:bg-sky-950/60 text-blue-900 dark:text-white/60 text-sm flex items-center gap-1 px-1.5 py-0.5 rounded">
            Portuguese
          </span>
          <div className="flex items-center text-sm gap-1 dark:text-neutral-500">
            {post.publishedAt && (
              <>{formatDistanceToNow(new Date(post.publishedAt))}</>
            )}
          </div>
        </div>

        {/* Cover */}
        {post.coverImageUrl ? (
          <div className="overflow-hidden px-4 aspect-video">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-3xl opacity-30">✍️</span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 gap-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-bold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>

          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {post.summary}
            </p>
          )}

          <div className="flex flex-row items-center justify-between gap-2 pt-4 border-t border-border mt-auto">
            <PostMetaBadges likes={post.likes} views={post.views} comments={post.commentsCount} />
            <div className="flex items-center gap-2">
              {post.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  {post.readingTime} min de leitura
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Exported component — delegates based on layout prop
// ---------------------------------------------------------------------------
export function PostCard({ post, layout = 'grid' }: { post: Post; layout?: PostLayout }) {
  if (layout === 'list') return <PostCardRow post={post} />;
  return <PostCardGrid post={post} />;
}