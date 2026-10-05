import { getTranslations } from 'next-intl/server';

import { OtherPostsList } from '@/components/blog/PostArticle';
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
      {/* Capped at the viewport height so the table of contents never runs
          past the bottom of the screen; the TOC takes the remaining space and
          scrolls inside it (see TableOfContents). */}
      <OtherPostsList
        title={t('otherPosts')}
        posts={filtered}
        locale={locale}
        formatDate={(date) => formatDistanceToNow(date, locale)}
      />
      <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-3">

        <TableOfContents />
      </div>
    </div>
  );
}
