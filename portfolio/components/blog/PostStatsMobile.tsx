// components/blog/PostStatsMobile.tsx
'use client';

import Link from 'next/link';
import { Coffee, Eye, Heart, MessageSquare, Share2 } from 'lucide-react';
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
        <div className="flex justify-between md:hidden">
            <div className="flex items-center gap-4 items-center text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                    <Eye size={15} />
                    {formatCount(views)}
                </span>

                <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    className={cn(
                        'flex items-center gap-1 transition-colors',
                        liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                    )}
                >
                    <Heart size={15} className={cn(liked && 'fill-current')} />
                    {formatCount(likes)}
                </button>

                <button
                    onClick={scrollToComments}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    <MessageSquare size={15} />
                    {formatCount(comments)}
                </button>

            </div>

            <div className="flex items-center gap-4 items-center text-sm text-muted-foreground mt-2">

                <Link
                    href={"/support"}
                    className="flex items-center justify-center gap-1 rounded-xl hover:text-primary transition-colors text-muted-foreground"
                >
                    <Coffee size={15} />
                    <span className="text-xs">Apoie</span>
                </Link>

                <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1 rounded-xl hover:text-primary transition-colors text-muted-foreground"
                    aria-label="Compartilhar"
                >
                    <Share2 size={15} />
                    <span className="text-xs">Share</span>
                </button>
            </div>

        </div>
    );
}