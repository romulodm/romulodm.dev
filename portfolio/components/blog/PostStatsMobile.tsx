'use client';

import Link from 'next/link';
import { Coffee, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatCount } from '@/lib/format-number';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { cn } from '@/lib/utils';
import { SummarizeWithAI } from '@/components/blog/SummarizeWithAI';
import {
  scrollToComments,
  sharePostUrl,
  type PostReactionsViewProps,
} from '@/components/blog/PostReactionsSidebar';

interface Props {
  postId: string;
  initialLikes: number;
  initialViews: number;
  initialComments: number;
}

/** Barra de reacoes mobile sem estado; ver PostReactionSidebarView. */
export function PostStatsMobileView({
  views,
  likes,
  comments,
  liked,
  likeLoading = false,
  onLike,
  onComments,
  onShare,
}: Omit<PostReactionsViewProps, 'listenForAnchor'>) {
  const t = useTranslations('blogUi.reactions');
  const locale = useLocale();

  return (
    <div className="flex justify-between md:hidden">
      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Eye size={15} />{formatCount(views)}</span>
        <button onClick={onLike} disabled={likeLoading} className={cn('flex items-center gap-1 transition-colors', liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400')} aria-label={liked ? t('unlike') : t('like')}>
          <Heart size={15} className={cn(liked && 'fill-current')} />
          {formatCount(likes)}
        </button>
        <button onClick={onComments} className="flex items-center gap-1 transition-colors hover:text-foreground" aria-label={t('viewComments')}>
          <MessageSquare size={15} />
          {formatCount(comments)}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <SummarizeWithAI variant="inline" />
        <Link href={`/${locale}/support`} className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary">
          <Coffee size={15} />
          <span className="text-xs">{t('support')}</span>
        </Link>
        <button onClick={onShare} className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary" aria-label={t('shareAria')}>
          <Share2 size={15} />
          <span className="text-xs">{t('share')}</span>
        </button>
      </div>
    </div>
  );
}

export function PostStatsMobile({ postId, initialLikes, initialViews, initialComments }: Props) {
  const { likes, views, comments, liked, likeLoading, toggleLike } = usePostInteractions({ postId, initialLikes, initialViews, initialComments });

  return (
    <PostStatsMobileView
      views={views}
      likes={likes}
      comments={comments}
      liked={liked}
      likeLoading={likeLoading}
      onLike={toggleLike}
      onComments={scrollToComments}
      onShare={sharePostUrl}
    />
  );
}
