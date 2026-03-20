// components/blog/PostStatsMobile.tsx
'use client';

import { Eye, Heart, MessageSquare } from 'lucide-react';
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

    return (
        <div className="flex md:hidden items-center gap-4 text-sm text-muted-foreground mt-2">
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
    );
}