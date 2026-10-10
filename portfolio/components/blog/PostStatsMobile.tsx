'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Coffee, Eye, Heart, MessageSquare, Plus, Share2, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { formatCount } from '@/lib/format-number';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { cn } from '@/lib/utils';
import { SummarizeWithAI } from '@/components/blog/SummarizeWithAI';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

/**
 * Barra de reacoes mobile sem estado; ver PostReactionSidebarView.
 *
 * Abaixo de `sm` nao cabem os tres atalhos ao lado dos contadores (o "Resumo"
 * encostava no numero de comentarios), entao fica so o "Apoie" visivel e
 * "Resumo"/"Compartilhar" vao para o menu "+". O dialogo do resumo continua
 * montado fora do menu, controlado por `summaryOpen`, porque o conteudo do
 * dropdown desmonta ao fechar e levaria o dialogo junto.
 */
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
  const tSummary = useTranslations('blogUi.summarize');
  const locale = useLocale();
  const [summaryOpen, setSummaryOpen] = useState(false);

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
        <SummarizeWithAI
          variant="inline"
          triggerClassName="hidden sm:flex"
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
        />
        <Link href={`/${locale}/support`} className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary">
          <Coffee size={15} />
          <span className="text-xs">{t('support')}</span>
        </Link>
        <button onClick={onShare} className="hidden items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary sm:flex" aria-label={t('shareAria')}>
          <Share2 size={15} />
          <span className="text-xs">{t('share')}</span>
        </button>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary sm:hidden"
              aria-label={t('moreActions')}
            >
              <Plus size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem] border-border bg-card">
            <DropdownMenuItem onSelect={() => setSummaryOpen(true)} className="flex cursor-pointer items-center gap-2" aria-label={tSummary('buttonAria')}>
              <Sparkles size={15} />
              {tSummary('button')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onShare?.()} className="flex cursor-pointer items-center gap-2" aria-label={t('shareAria')}>
              <Share2 size={15} />
              {t('share')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
