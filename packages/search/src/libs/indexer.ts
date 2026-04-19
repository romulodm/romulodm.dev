import { PrismaClient } from '@romulo/database'
import type { SearchEngine } from '../engine/engine'
import type { IndexedDocument } from '../engine/types'

export class PostIndexer {
    constructor(
        private engine: SearchEngine,
        private prisma: PrismaClient,
        private locales: string[] = ['pt', 'en'],
    ) { }

    async indexPost(postId: string): Promise<void> {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                postTags: { select: { tag: true } },
                translations: {
                    select: {
                        locale: true,
                        title: true,
                        summary: true,
                        excerpt: true,
                    },
                },
            },
        })

        if (!post || post.status !== 'PUBLISHED') {
            await this.removePost(postId)
            return
        }

        for (const t of post.translations) {
            const doc: IndexedDocument = {
                id: `${post.id}_${t.locale}`,
                slug: post.slug,
                locale: t.locale,
                title: t.title,
                summary: t.summary ?? '',
                excerpt: t.excerpt?.slice(0, 500) ?? '',
                tags: post.postTags.map((pt) => pt.tag),
                publishedAt: post.publishedAt
                    ? Math.floor(post.publishedAt.getTime() / 1000)
                    : 0,
                coverImageUrl: post.coverImageUrl,
            }
            await this.engine.indexDocument(doc)
        }
    }

    async removePost(postId: string): Promise<void> {
        for (const locale of this.locales) {
            await this.engine.removeDocument(`${postId}_${locale}`)
        }
    }

    async reindexAll(): Promise<void> {
        console.log('[search] iniciando reindexação completa...')
        const start = Date.now()

        await this.engine.clearIndex()

        const posts = await this.prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            select: { id: true },
        })

        console.log(`[search] ${posts.length} posts encontrados`)

        const BATCH_SIZE = 10
        for (let i = 0; i < posts.length; i += BATCH_SIZE) {
            const batch = posts.slice(i, i + BATCH_SIZE)
            await Promise.all(batch.map((p) => this.indexPost(p.id)))
            console.log(`[search] ${Math.min(i + BATCH_SIZE, posts.length)}/${posts.length}`)
        }

        console.log(`[search] ✓ reindexação concluída em ${Date.now() - start}ms`)
    }
}