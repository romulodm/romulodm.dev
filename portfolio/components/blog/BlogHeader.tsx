'use client';

import { Shuffle, Tag, SlidersHorizontal, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PostSortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';

const SORT_OPTIONS: { value: PostSortOption; label: string }[] = [
    { value: 'newest', label: 'Mais recentes' },
    { value: 'most_liked', label: 'Mais curtidos' },
    { value: 'most_viewed', label: 'Mais vistos' },
    { value: 'oldest', label: 'Mais antigos' },
];

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    publishedAt: Date | string | null;
    likes: number;
    views: number;
    commentsCount: number;
    postTags: { tag: string }[];
}

interface BlogHeaderProps {
    allTags: string[];
    posts: Post[];
    sort: PostSortOption;
    onSortChange: (sort: PostSortOption) => void;
    onTagFilter: (tag: string | null) => void;
    activeTag: string | null;
    onRandom: () => void;
    loadingRandom: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BlogHeader({
    allTags,
    posts,
    sort,
    onSortChange,
    onTagFilter,
    activeTag,
    onRandom,
    loadingRandom,
}: BlogHeaderProps) {
    const handleTagChange = (value: string) => {
        if (value === 'all' || value === activeTag) {
            onTagFilter(null);
        } else {
            onTagFilter(value);
        }
    };

    return (
        <div className="w-full space-y-4 mt-4">
            <div className="border-b border-border">
                <div className="max-w-7xl mx-auto md:px-0 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">

                    {/* Sort */}
                    <div className="w-full">
                        <Select
                            value={sort}
                            onValueChange={(value) => onSortChange(value as PostSortOption)}
                        >
                            <SelectTrigger className="w-full rounded-xs border-border">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={16} className="shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Ordenar por" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="dark:bg-background border-border rounded-xs">
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="hover:cursor-pointer"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Random */}
                    <Button
                        variant="outline"
                        onClick={onRandom}
                        disabled={posts.length === 0 || loadingRandom}
                        className="flex items-center w-full gap-2 hover:text-black dark:hover:text-white bg-primary/20 dark:bg-primary/10 hover:bg-primary/30 hover:dark:bg-primary/20 py-3 rounded-xs border-border"
                    >
                        {loadingRandom ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Carregando...
                            </>
                        ) : (
                            <>
                                <Shuffle size={16} />
                                Post aleatório
                            </>
                        )}
                    </Button>

                    {/* Tag filter */}
                    <div className="w-full">
                        <Select
                            value={activeTag ?? 'all'}
                            onValueChange={handleTagChange}
                        >
                            <SelectTrigger className="w-full rounded-xs border-border">
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por tag" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="dark:bg-background border-border rounded-xs">
                                <SelectItem value="all" className="hover:cursor-pointer">
                                    Todas as tags
                                </SelectItem>
                                {allTags.map((tag) => (
                                    <SelectItem
                                        key={tag}
                                        value={tag}
                                        className="hover:cursor-pointer"
                                    >
                                        #{tag}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>
            </div>
        </div>
    );
}