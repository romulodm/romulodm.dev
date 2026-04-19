import type { Redis } from 'ioredis'
import { InvertedIndex } from './index'
import { VectorModel } from './vector'
import { Preprocessor } from './preprocessor'
import type { IndexedDocument, SearchOptions, SearchResult } from './types'

export class SearchEngine {
    private idx: InvertedIndex
    private model: VectorModel
    private prep = new Preprocessor()

    constructor(private redis: Redis) {  // ← recebe Redis
        this.idx = new InvertedIndex(redis)
        this.model = new VectorModel(this.idx)
    }

    async indexDocument(doc: IndexedDocument): Promise<void> {
        await this.idx.addDocument(doc)
    }

    async removeDocument(docId: string): Promise<void> {
        await this.idx.removeDocument(docId)
    }

    async clearIndex(): Promise<void> {
        const keys: string[] = []
        let cursor = '0'

        do {
            const [next, found] = await this.redis.scan(
                cursor, 'MATCH', 'search:*', 'COUNT', '100'
            )
            cursor = next
            keys.push(...found)
        } while (cursor !== '0')

        if (keys.length > 0) {
            await this.redis.del(...keys)
        }
    }

    async search(
        query: string,
        options: SearchOptions = {},
    ): Promise<{ hits: SearchResult[]; processingTimeMs: number }> {
        const start = Date.now()
        const { locale, limit = 8, tags } = options

        const tokens = this.prep.tokenize(query)
        if (tokens.length === 0) return { hits: [], processingTimeMs: 0 }

        const N = await this.idx.getN()
        if (N === 0) return { hits: [], processingTimeMs: 0 }

        const candidates = await this.idx.getCandidates(tokens)
        const queryVec = await this.model.buildQueryVector(tokens, N)
        const scored: Array<{ docId: string; score: number }> = []

        for (const docId of candidates) {
            const meta = await this.idx.getDocMeta(docId)
            if (!meta) continue
            if (locale && meta.locale !== locale) continue
            if (tags?.length) {
                const docTags: string[] = JSON.parse(meta.tags ?? '[]')
                if (!tags.some(t => docTags.includes(t))) continue
            }

            const score = await this.model.cosineSimilarity(docId, queryVec, N)
            if (score > 0) scored.push({ docId, score })
        }

        scored.sort((a, b) => b.score - a.score)
        const top = scored.slice(0, limit)

        const hits: SearchResult[] = []
        for (const { docId, score } of top) {
            const meta = await this.idx.getDocMeta(docId)
            if (!meta) continue

            const title = this.highlight(meta.title, tokens)
            const summary = this.highlight(meta.summary, tokens)

            hits.push({
                slug: meta.slug,
                title,
                summary,
                coverImageUrl: meta.coverImageUrl || null,
                tags: JSON.parse(meta.tags ?? '[]'),
                publishedAt: Number(meta.publishedAt),
                score,
                highlights: { title, summary },
            })
        }

        return { hits, processingTimeMs: Date.now() - start }
    }

    private highlight(text: string, tokens: string[]): string {
        if (!text) return ''
        let result = text
        for (const token of tokens) {
            const regex = new RegExp(
                `(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
                'gi',
            )
            result = result.replace(regex, '<mark>$1</mark>')
        }
        return result
    }
}