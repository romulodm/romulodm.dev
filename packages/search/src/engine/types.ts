export interface IndexedDocument {
    id: string
    slug: string
    locale: string
    title: string
    summary: string
    excerpt: string
    tags: string[]
    publishedAt: number
    coverImageUrl: string | null
}

export interface SearchResult {
    slug: string
    title: string
    summary: string
    coverImageUrl: string | null
    tags: string[]
    publishedAt: number
    score: number
    highlights: {
        title: string
        summary: string
    }
}

export interface SearchOptions {
    locale?: string
    limit?: number
    tags?: string[]
}