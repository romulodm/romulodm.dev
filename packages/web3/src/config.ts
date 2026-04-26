export type NetworkKey = 'arbitrum' | 'polygon' | 'base'
export type TokenKey = 'ETH' | 'USDC' | 'USDT'

export interface NetworkConfig {
    id: number
    name: string
    shortName: string
    rpcUrl: string
    explorer: string
    color: string
    supportsETH: boolean
    nativeCurrency: { name: string; symbol: string; decimals: number }
}

export interface TokenConfig {
    symbol: TokenKey
    decimals: number
    isNative: boolean
    addresses: Partial<Record<NetworkKey, `0x${string}`>>
}

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
    arbitrum: {
        id: 42161,
        name: 'Arbitrum',
        shortName: 'ARB',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',   // worker sobrescreve via getRpcUrl()
        explorer: 'https://arbiscan.io',
        color: '#28A0F0',
        supportsETH: true,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    polygon: {
        id: 137,
        name: 'Polygon',
        shortName: 'POL',
        rpcUrl: 'https://polygon-rpc.com',
        explorer: 'https://polygonscan.com',
        color: '#8247E5',
        supportsETH: false,
        nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    },
    base: {
        id: 8453,
        name: 'Base',
        shortName: 'BASE',
        rpcUrl: 'https://mainnet.base.org',
        explorer: 'https://basescan.org',
        color: '#0052FF',
        supportsETH: true,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
}

export function getRpcUrl(network: NetworkKey): string {
    const envKey = `${network.toUpperCase()}_RPC_URL`
    const env = (globalThis as any).process?.env ?? {}
    return (env[envKey] as string | undefined) ?? NETWORKS[network].rpcUrl
}

export const TOKENS: Record<TokenKey, TokenConfig> = {
    ETH: {
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        addresses: {},
    },
    USDC: {
        symbol: 'USDC',
        decimals: 6,
        isNative: false,
        addresses: {
            arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
    },
    USDT: {
        symbol: 'USDT',
        decimals: 6,
        isNative: false,
        addresses: {
            arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
        },
    },
}

export const COFFEE_USD = 1.5

export function getAvailableTokens(network: NetworkKey): TokenKey[] {
    return NETWORKS[network].supportsETH
        ? ['ETH', 'USDC', 'USDT']
        : ['USDC', 'USDT']
}

// ABI mínima usada pelo frontend — repetida aqui para o pacote ser self-contained
export const ERC20_TRANSFER_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const