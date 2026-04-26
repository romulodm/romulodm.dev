import type { TokenKey } from './config'

export interface Prices {
    ethUsd: number
    ethBrl: number
    usdBrl: number
}

interface CacheEntry {
    data: Prices
    at: number
}

const TTL_MS = 60_000
let cache: CacheEntry | null = null

/**
 * Busca cotações do ETH e do dólar via CoinGecko.
 * Resultado cacheado por 60s — chamadas subsequentes são gratuitas.
 * Usada tanto pelo worker quanto pelo Next.js (API route + server components).
 */
export async function getPrices(): Promise<Prices> {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.data

    const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price' +
        '?ids=ethereum,usd-coin&vs_currencies=usd,brl',
        { cache: 'no-store' },
    )

    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)

    const raw = await res.json() as {
        ethereum: { usd: number; brl: number }
        'usd-coin': { usd: number; brl: number }
    }

    const data: Prices = {
        ethUsd: raw.ethereum['usd'],
        ethBrl: raw.ethereum['brl'],
        usdBrl: raw['usd-coin']['brl'],
    }

    cache = { data, at: Date.now() }
    return data
}

/**
 * Converte um rawAmount on-chain (em wei / 6 decimais) para BRL.
 *
 * @param rawAmount  Valor bruto como BigInt (wei para ETH, unidades para USDC/USDT)
 * @param token      'ETH' | 'USDC' | 'USDT'
 * @param prices     Resultado de getPrices()
 */
export function amountToBrl(rawAmount: bigint, token: TokenKey, prices: Prices): number {
    if (token === 'ETH') {
        return (Number(rawAmount) / 1e18) * prices.ethBrl
    }
    // USDC e USDT: 6 decimais, valor ≈ $1 cada
    return (Number(rawAmount) / 1e6) * prices.usdBrl
}

/**
 * Converte rawAmount para USD.
 */
export function amountToUsd(rawAmount: bigint, token: TokenKey, prices: Prices): number {
    if (token === 'ETH') {
        return (Number(rawAmount) / 1e18) * prices.ethUsd
    }
    return Number(rawAmount) / 1e6
}