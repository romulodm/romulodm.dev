/**
 * Formata um número grande de forma legível.
 * Ex: 999 -> "999", 1000 -> "1k", 1500 -> "1.5k", 1_000_000 -> "1M"
 */
export function formatCount(n: number): string {
    if (n < 1_000) return String(n);
    if (n < 10_000) {
        const val = (n / 1_000).toFixed(1);
        return val.endsWith('.0') ? `${Math.floor(n / 1_000)}k` : `${val}k`;
    }
    if (n < 1_000_000) return `${Math.floor(n / 1_000)}k`;
    if (n < 10_000_000) {
        const val = (n / 1_000_000).toFixed(1);
        return val.endsWith('.0') ? `${Math.floor(n / 1_000_000)}M` : `${val}M`;
    }
    return `${Math.floor(n / 1_000_000)}M`;
}