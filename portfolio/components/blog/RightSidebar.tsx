import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { TableOfContents } from '@/components/blog/TableOfContents';
import { formatDistanceToNow } from '@/lib/utils';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  coverImageUrl: string | null;
}

interface Props {
  relatedPosts: RelatedPost[];
  currentPostId: string;
  locale: string;
}

export async function RightSidebar({ relatedPosts, currentPostId, locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'blogUi.sidebar' });
  const filtered = relatedPosts.filter((post) => post.id !== currentPostId).slice(0, 3);

  return (
    <div className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-20 space-y-3">
        {filtered.length > 0 && (
          <div className="p-5">
            <h3 className="mb-3 text-sm font-bold text-foreground">{t('otherPosts')}</h3>
            <div className="space-y-3">
              {filtered.map((post) => (
                <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group flex gap-3">
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">{post.title}</span>
                    {post.publishedAt && <span className="mt-0.5 text-xs text-muted-foreground">{formatDistanceToNow(post.publishedAt, locale)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <TableOfContents />
      </div>
    </div>
  );
}
