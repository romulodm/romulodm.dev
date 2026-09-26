/**
 * Published papers where Romulo is an author, listed by the interactive
 * terminal's `papers` command. Titles stay in the language they were published in; only the venue note and
 * the award line are localized.
 */

type Localized = { pt: string; en: string };

export interface Paper {
    title: string;
    authors: string;
    venue: Localized;
    year: number;
    award?: Localized;
    /** Proceedings page on SBC OpenLib (SOL). */
    url: string;
}

export const PAPERS: readonly Paper[] = [
    {
        title: 'Verificação Determinística com Incremental Merkle Tree On-Chain em Loterias Descentralizadas',
        authors: 'Romulo de Moraes, Vinícius G. Pinto, Eder Gonçalves, Roger Immich, Bruno L. Dalmazo',
        venue: {
            pt: 'CBlockchain · CSBC 2026, Gramado/RS',
            en: 'CBlockchain · CSBC 2026, Gramado, Brazil',
        },
        year: 2026,
        award: { pt: 'Best Paper', en: 'Best Paper' },
        url: 'https://sol.sbc.org.br/index.php/cblockchain/article/view/43037',
    },
    {
        title: 'Arquitetura híbrida para Loterias em Blockchain com compressão de estado via Merkle Tree',
        authors: 'Romulo de Moraes, Arthur G. Bubolz, Denner G. Ayres, Vinícius G. Pinto, Bruno L. Dalmazo',
        venue: {
            pt: 'XXII Escola Regional de Redes de Computadores (ERRC 2025)',
            en: '22nd Regional School of Computer Networks (ERRC 2025)',
        },
        year: 2025,
        url: 'https://sol.sbc.org.br/index.php/errc/article/view/39174',
    },
];
