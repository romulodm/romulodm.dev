import type { InvertedIndex } from './index'

export class VectorModel {
    constructor(private idx: InvertedIndex) { }

    // Peso TF-IDF do termo i no documento j
    // tf_{i,j} = freq_{i,j} / max_l(freq_{l,j})
    // idf_i    = log10(N / df_i)
    private async docWeight(term: string, docId: string, N: number): Promise<number> {
        const postings = await this.idx.getPostings(term)
        const freq = postings.get(docId) ?? 0
        if (freq === 0) return 0

        const maxFreq = await this.idx.getMaxFreq(docId)
        const df = await this.idx.getDf(term)
        if (df === 0) return 0

        const tf = freq / maxFreq
        const idf = Math.log10(N / df)
        return tf * idf
    }

    // Peso do termo na consulta
    // w_{i,q} = (0.5 + 0.5 * freq_{i,q} / max_l(freq_{l,q})) * log10(N / df_i)
    private async queryWeight(
        term: string,
        termFreq: number,
        maxQueryFreq: number,
        N: number,
    ): Promise<number> {
        if (termFreq === 0) return 0
        const df = await this.idx.getDf(term)
        if (df === 0) return 0

        const tf = 0.5 + 0.5 * (termFreq / maxQueryFreq)
        const idf = Math.log10(N / df)
        return tf * idf
    }

    async buildQueryVector(
        terms: string[],
        N: number,
    ): Promise<Map<string, number>> {
        const freq = new Map<string, number>()
        for (const t of terms) freq.set(t, (freq.get(t) ?? 0) + 1)

        const maxFreq = Math.max(...freq.values(), 1)
        const vec = new Map<string, number>()

        for (const [term, f] of freq) {
            const w = await this.queryWeight(term, f, maxFreq, N)
            if (w > 0) vec.set(term, w)
        }
        return vec
    }

    async cosineSimilarity(
        docId: string,
        queryVec: Map<string, number>,
        N: number,
    ): Promise<number> {
        let dot = 0
        let docMag = 0
        let queryMag = 0

        // Produto escalar — itera apenas nos termos da consulta (eficiente)
        for (const [term, wq] of queryVec) {
            const wd = await this.docWeight(term, docId, N)
            dot += wd * wq
            docMag += wd * wd
        }

        for (const wq of queryVec.values()) queryMag += wq * wq

        const denom = Math.sqrt(docMag) * Math.sqrt(queryMag)
        return denom === 0 ? 0 : dot / denom
    }
}