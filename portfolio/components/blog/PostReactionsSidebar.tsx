// components/blog/PostReactionSidebar.tsx
'use client';

import { Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
import { formatCount } from '@/lib/format-number';
import { usePostInteractions } from '@/hooks/use-post-interactions';
import { cn } from '@/lib/utils';

interface Props {
    postId: string;
    initialLikes: number;
    initialViews: number;
    initialComments: number;
}

export function PostReactionSidebar({ postId, initialLikes, initialViews, initialComments }: Props) {
    const { likes, views, comments, liked, likeLoading, toggleLike } = usePostInteractions({
        postId,
        initialLikes,
        initialViews,
        initialComments,
    });

    const scrollToComments = () => {
        document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({ url: window.location.href }).catch(() => { });
        } else {
            await navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <div className="mt-4 flex flex-col items-center gap-8">
            {/* Views (apenas leitura) */}
            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                <Eye size={20} />
                <span className="text-xs">{formatCount(views)}</span>
            </div>

            {/* Like */}
            <button
                onClick={toggleLike}
                disabled={likeLoading}
                className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl transition-colors',
                    liked
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-muted-foreground hover:text-red-400'
                )}
                aria-label={liked ? 'Descurtir post' : 'Curtir post'}
            >
                <Heart
                    size={20}
                    className={cn('transition-all', liked && 'fill-current')}
                />
                <span className="text-xs">{formatCount(likes)}</span>
            </button>

            {/* Comentários */}
            <button
                onClick={scrollToComments}
                className="flex flex-col items-center justify-center gap-1 rounded-xl hover:text-primary transition-colors text-muted-foreground"
                aria-label="Ver comentários"
            >
                <MessageSquare size={20} />
                <span className="text-xs">{formatCount(comments)}</span>
            </button>

            {/* Share */}
            <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1 rounded-xl hover:text-primary transition-colors text-muted-foreground"
                aria-label="Compartilhar"
            >
                <Share2 size={20} />
            </button>
        </div>
    );
}