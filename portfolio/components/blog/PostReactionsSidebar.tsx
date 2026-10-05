'use client';

import Link from 'next/link';
import { Coffee, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatCount } from '@/lib/format-number';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { cn } from '@/lib/utils';
import { SummarizeWithAI } from '@/components/blog/SummarizeWithAI';

interface Props {
  postId: string;
  initialLikes: number;
  initialViews: number;
  initialComments: number;
}

export function scrollToComments() {
  document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
}

export async function sharePostUrl() {
  if (navigator.share) await navigator.share({ url: window.location.href }).catch(() => {});
  else await navigator.clipboard.writeText(window.location.href);
}

export interface PostReactionsViewProps {
  views: number;
  likes: number;
  comments: number;
  liked: boolean;
  likeLoading?: boolean;
  onLike?: () => void;
  onComments?: () => void;
  onShare?: () => void;
  /** Ver SummarizeWithAI: so uma instancia por pagina pode escutar #resumir. */
  listenForAnchor?: boolean;
}

/**
 * Coluna de reacoes sem estado. A pagina do post usa via PostReactionSidebar
 * (com o hook que registra view e like); o preview do editor usa direto, com
 * numeros ficticios, para nao registrar visualizacao nem like de verdade.
 */
export function PostReactionSidebarView({
  views,
  likes,
  comments,
  liked,
  likeLoading = false,
  onLike,
  onComments,
  onShare,
  listenForAnchor = false,
}: PostReactionsViewProps) {
  const t = useTranslations('blogUi.reactions');
  const locale = useLocale();

  return (
    <div className="mt-4 flex flex-col items-center gap-8">
      <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground"><Eye size={20} /><span className="text-xs">{formatCount(views)}</span></div>

      <button onClick={onLike} disabled={likeLoading} className={cn('flex flex-col items-center justify-center gap-1 rounded-xl transition-colors', liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-400')} aria-label={liked ? t('unlike') : t('like')}>
        <Heart size={20} className={cn('transition-all', liked && 'fill-current')} />
        <span className="text-xs">{formatCount(likes)}</span>
      </button>

      <button onClick={onComments} className="flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary" aria-label={t('viewComments')}>
        <MessageSquare size={20} />
        <span className="text-xs">{formatCount(comments)}</span>
      </button>

      <SummarizeWithAI variant="sidebar" listenForAnchor={listenForAnchor} />

      <Link href={`/${locale}/support`} target="_blank" className="flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary">
        <Coffee size={20} />
        <span className="text-xs">{t('support')}</span>
      </Link>

      <button onClick={onShare} className="flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary" aria-label={t('shareAria')}>
        <Share2 size={20} />
        <span className="text-xs">{t('share')}</span>
      </button>
    </div>
  );
}

export function PostReactionSidebar({ postId, initialLikes, initialViews, initialComments }: Props) {
  const { likes, views, comments, liked, likeLoading, toggleLike } = usePostInteractions({ postId, initialLikes, initialViews, initialComments });

  return (
    <PostReactionSidebarView
      views={views}
      likes={likes}
      comments={comments}
      liked={liked}
      likeLoading={likeLoading}
      onLike={toggleLike}
      onComments={scrollToComments}
      onShare={sharePostUrl}
      listenForAnchor
    />
  );
}
