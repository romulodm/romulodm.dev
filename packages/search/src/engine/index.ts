import type { Redis } from 'ioredis'
import type { IndexedDocument } from './types'
import { Preprocessor } from './preprocessor'

export class InvertedIndex {
    private prep = new Preprocessor()

    constructor(private redis: Redis) { }  // ← injeção

    async addDocument(doc: IndexedDocument): Promise<void> {
        const tokens = this.prep.tokenize(
            `${doc.title} ${doc.summary} ${doc.excerpt}`
        )

        const freq = new Map<string, number>()
        for (const token of tokens) {
            freq.set(token, (freq.get(token) ?? 0) + 1)
        }

        const maxFreq = Math.max(...freq.values(), 1)
        const existingTerms = new Set(
            await this.redis.smembers(`search:doc:${doc.id}:terms`)
        )

        const pipeline = this.redis.pipeline()

        pipeline.hset(`search:doc:${doc.id}`, {
            slug: doc.slug,
            locale: doc.locale,
            title: doc.title,
            summary: doc.summary.slice(0, 300),
            coverImageUrl: doc.coverImageUrl ?? '',
            tags: JSON.stringify(doc.tags),
            publishedAt: doc.publishedAt,
        })
        pipeline.set(`search:doc:${doc.id}:maxfreq`, maxFreq)
        pipeline.sadd('search:docs', doc.id)

        if (freq.size > 0) {
            pipeline.sadd(`search:doc:${doc.id}:terms`, ...freq.keys())
        }

        for (const [term, termFreq] of freq) {
            pipeline.hset(`search:postings:${term}`, { [doc.id]: termFreq })
            if (!existingTerms.has(term)) {
                pipeline.incr(`search:df:${term}`)
            }
        }

        pipeline.incr('search:N')
        await pipeline.exec()
    }

    async removeDocument(docId: string): Promise<void> {
        const terms = await this.redis.smembers(`search:doc:${docId}:terms`)
        const pipeline = this.redis.pipeline()

        for (const term of terms) {
            pipeline.hdel(`search:postings:${term}`, docId)
            pipeline.decr(`search:df:${term}`)
        }

        pipeline.del(`search:doc:${docId}`)
        pipeline.del(`search:doc:${docId}:maxfreq`)
        pipeline.del(`search:doc:${docId}:terms`)
        pipeline.srem('search:docs', docId)
        pipeline.decr('search:N')

        await pipeline.exec()
    }

    async getN(): Promise<number> {
        return Number((await this.redis.get('search:N')) ?? 0)
    }

    async getDf(term: string): Promise<number> {
        return Number((await this.redis.get(`search:df:${term}`)) ?? 0)
    }

    async getPostings(term: string): Promise<Map<string, number>> {
        const raw = await this.redis.hgetall(`search:postings:${term}`)
        const map = new Map<string, number>()
        if (raw) {
            for (const [docId, freq] of Object.entries(raw)) {
                map.set(docId, Number(freq))
            }
        }
        return map
    }

    async getMaxFreq(docId: string): Promise<number> {
        return Number((await this.redis.get(`search:doc:${docId}:maxfreq`)) ?? 1)
    }

    async getDocMeta(docId: string) {
        return this.redis.hgetall(`search:doc:${docId}`)
    }

    async getCandidates(terms: string[]): Promise<Set<string>> {
        const candidates = new Set<string>()

        for (const term of terms) {
            // 1. Match exato (já existia)
            const exact = await this.getPostings(term)
            for (const docId of exact.keys()) candidates.add(docId)

            // 2. Prefix match — varre chaves que começam com o termo
            // Só ativa para termos curtos (< 5 chars) para não ser custoso
            if (term.length >= 2 && term.length < 5) {
                let cursor = '0'
                do {
                    const [next, keys] = await this.redis.scan(
                        cursor,
                        'MATCH', `search:postings:${term}*`,
                        'COUNT', '50'
                    )
                    cursor = next
                    for (const key of keys) {
                        const prefixTerm = key.replace('search:postings:', '')
                        if (prefixTerm === term) continue // já pegou no exact
                        const postings = await this.getPostings(prefixTerm)
                        for (const docId of postings.keys()) candidates.add(docId)
                    }
                } while (cursor !== '0')
            }
        }

        return candidates
    }
}