// components/ui/PostCard.tsx
import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';
import { PostMetaBadges } from '@/components/blog/BlogHeader';

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

export function PostCard({ post }: { post: Post }) {
  const tags = post.postTags.map((t) => t.tag);

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600">
        {/* Cover */}
        {post.coverImageUrl ? (
          <div className="overflow-hidden aspect-video">
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

        {/* Conteúdo */}
        <div className="flex flex-col flex-1 p-5 gap-3">
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

          {/* Título */}
          <h2 className="font-bold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>

          {/* Summary */}
          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
              {post.summary}
            </p>
          )}

          {/* Footer: data + badges */}
          <div className="flex flex-row items-center justify-between gap-2 pt-4 border-t border-border mt-auto">
            <PostMetaBadges likes={post.likes} views={post.views} />

            <div className="flex items-center gap-2">
              {post.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.publishedAt))}
                </span>
              )}
              <span className="mt-1 h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
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