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
        <div className="hidden xl:block shrink-0 w-64">
            <div className="sticky top-20 space-y-3">


                {/* Outras publicações */}
                {filtered.length > 0 && (
                    <div className="p-5">
                        <h3 className="font-bold text-foreground text-sm mb-3">Outras publicações</h3>
                        <div className="space-y-3">
                            {filtered.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-3 group">
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

                {/* Índice */}
                <TableOfContents />
            </div>
        </div>
    )
}