// components/blog/RightSidebar.tsx
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import { TableOfContents } from '@/components/blog/TableOfContents'

interface RelatedPost {
    id: string
    title: string
    slug: string
    publishedAt: Date | null
    coverImageUrl: string | null
}

interface Props {
    relatedPosts: RelatedPost[]
    currentPostId: string
}

export function RightSidebar({ relatedPosts, currentPostId }: Props) {
    const filtered = relatedPosts.filter((p) => p.id !== currentPostId).slice(0, 3)

    return (
        <div className="hidden xl:block max-w-72 shrink-0">
            <div className="sticky top-20 space-y-4">
                {/* Índice da página */}
                <TableOfContents />

                {/* Outras publicações */}
                {filtered.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                        <h3 className="font-bold text-foreground text-sm mb-3">Outras publicações</h3>
                        <div className="space-y-3">
                            {filtered.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="flex gap-3 group"
                                >
                                    {post.coverImageUrl ? (
                                        <img
                                            src={post.coverImageUrl}
                                            alt={post.title}
                                            className="w-14 h-14 rounded-lg object-cover shrink-0 group-hover:opacity-90 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                                    )}
                                    <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                            {post.title}
                                        </span>
                                        {post.publishedAt && (
                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(post.publishedAt)}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}