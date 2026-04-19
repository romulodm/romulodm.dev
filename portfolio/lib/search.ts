const SEARCH_URL = process.env.SEARCH_GO_URL ?? 'http://localhost:8080'

export interface GoSearchHit {
    slug: string
    title: string
    summary: string
    coverImageUrl: string
    tags: string[]
    score: number
}

export async function goSearch(query: string, locale: string, limit = 8) {
    const url = `${SEARCH_URL}/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=${limit}`
    const res = await fetch(url, { cache: 'no-store' })
    return res.json() as Promise<{
        hits: GoSearchHit[]
        processingTimeMs: number
        query: string
    }>
}

export async function goIndex(doc: {
    id: string; slug: string; locale: string;
    title: string; summary: string; excerpt: string;
    tags: string[]; publishedAt: number;
    coverImageUrl: string | null;
}) {
    await fetch(`${SEARCH_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
    })
}

export async function goRemove(docID: string) {
    await fetch(`${SEARCH_URL}/index/${docID}`, { method: 'DELETE' })
}