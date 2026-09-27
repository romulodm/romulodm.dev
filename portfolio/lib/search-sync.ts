import 'server-only'

import { prisma } from '@romulo/database'

import { logApiError } from '@/lib/api-errors'
import { goIndex, goRemove } from '@/lib/search'


/**
 * The index holds one document per TRANSLATION, not per post — search is scoped
 * by locale. This is the id convention, and it must be identical on indexing and
 * on removal; otherwise we delete documents that don't exist and orphan the ones
 * that do.
 */
function docId(postId: string, locale: string): string {
    return `${postId}_${locale}`
}

/**
 * Mirrors the post's current state in the index.
 *
 * One call covers all four paths, because they all follow from the status read
 * from the database:
 *   - created already published   -> index
 *   - created as a draft          -> don't index
 *   - draft becomes published     -> index
 *   - published becomes a draft   -> REMOVE (it would otherwise stay searchable)
 *
 * Never throws. An indexing failure must not take down the save — the database
 * is the source of truth and the index can be rebuilt from it. It does log,
 * though: an index drifting out of sync in silence was the original bug.
 */
export async function syncPostToSearch(postId: string): Promise<void> {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                slug: true,
                status: true,
                publishedAt: true,
                coverImageUrl: true,
                postTags: { select: { tag: true } },
                translations: {
                    select: { locale: true, title: true, summary: true, excerpt: true },
                },
            },
        })

        if (!post) return

        const isPublic = post.status === 'PUBLISHED' && post.publishedAt !== null

        if (!isPublic) {
            await Promise.all(
                post.translations.map((t) => goRemove(docId(postId, t.locale))),
            )
            return
        }

        const tags = post.postTags.map((pt) => pt.tag)
        const publishedAt = Math.floor(post.publishedAt!.getTime() / 1000)

        await Promise.all(
            post.translations.map((t) =>
                goIndex({
                    id: docId(postId, t.locale),
                    slug: post.slug,
                    locale: t.locale,
                    title: t.title,
                    // O servico espera string; o schema permite null nos dois.
                    summary: t.summary ?? '',
                    excerpt: t.excerpt ?? '',
                    tags,
                    publishedAt,
                    coverImageUrl: post.coverImageUrl,
                }),
            ),
        )
    } catch (error) {
        logApiError('search.sync', error, { postId })
    }
}

export async function removePostFromSearch(
    postId: string,
    locales: string[],
): Promise<void> {
    try {
        await Promise.all(locales.map((locale) => goRemove(docId(postId, locale))))
    } catch (error) {
        logApiError('search.remove', error, { postId, locales })
    }
}
