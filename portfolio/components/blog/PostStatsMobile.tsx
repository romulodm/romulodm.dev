'use client';

import Link from 'next/link';
import { Coffee, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatCount } from '@/lib/format-number';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { cn } from '@/lib/utils';

interface Props {
  postId: string;
  initialLikes: number;
  initialViews: number;
  initialComments: number;
}

export function PostStatsMobile({ postId, initialLikes, initialViews, initialComments }: Props) {
  const t = useTranslations('blogUi.reactions');
  const locale = useLocale();
  const { likes, views, comments, liked, likeLoading, toggleLike } = usePostInteractions({ postId, initialLikes, initialViews, initialComments });

  function scrollToComments() {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleShare() {
    if (navigator.share) await navigator.share({ url: window.location.href }).catch(() => {});
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="flex justify-between md:hidden">
      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Eye size={15} />{formatCount(views)}</span>
        <button onClick={toggleLike} disabled={likeLoading} className={cn('flex items-center gap-1 transition-colors', liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400')} aria-label={liked ? t('unlike') : t('like')}>
          <Heart size={15} className={cn(liked && 'fill-current')} />
          {formatCount(likes)}
        </button>
        <button onClick={scrollToComments} className="flex items-center gap-1 transition-colors hover:text-foreground" aria-label={t('viewComments')}>
          <MessageSquare size={15} />
          {formatCount(comments)}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <Link href={`/${locale}/support`} className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary">
          <Coffee size={15} />
          <span className="text-xs">{t('support')}</span>
        </Link>
        <button onClick={handleShare} className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary" aria-label={t('shareAria')}>
          <Share2 size={15} />
          <span className="text-xs">{t('share')}</span>
        </button>
      </div>
    </div>
  );
}
