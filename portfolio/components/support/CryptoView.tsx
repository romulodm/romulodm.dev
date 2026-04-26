// src/components/support/CryptoView.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Info, ExternalLink, Wallet, Loader2,
    CheckCircle2, X, AlertCircle,
} from 'lucide-react'
import { encodeFunctionData } from 'viem'
import {
    NETWORKS, TOKENS, ERC20_TRANSFER_ABI, COFFEE_USD,
    getAvailableTokens,
    type NetworkKey, type TokenKey,
} from '@romulo/web3'
import { encryptMessage } from '@romulo/web3'
import { WalletModal } from '../modals/WalletModal'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EthProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export interface EIP6963Provider {
    info: { uuid: string; name: string; icon: string }
    provider: EthProvider
}

interface Props {
    coffees: number
    name: string
    message: string
    isPrivate: boolean
    onBack: () => void
    onSuccess: () => void
}

type Step = 'idle' | 'switching' | 'sending' | 'confirming' | 'done'

// ─── Component ───────────────────────────────────────────────────────────────

export function CryptoView({ coffees, name, message, isPrivate, onBack, onSuccess }: Props) {
    const [network, setNetwork] = useState<NetworkKey>('base')
    const [token, setToken] = useState<TokenKey>('USDC')
    const [wallets, setWallets] = useState<EIP6963Provider[]>([])
    const [showWallets, setShowWallets] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [connected, setConnected] = useState<{
        address: string
        provider: EthProvider
        name: string
    } | null>(null)
    const [ethPrice, setEthPrice] = useState<number | null>(null)
    const [step, setStep] = useState<Step>('idle')
    const [txHash, setTxHash] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const netConfig = NETWORKS[network]
    const tokenConfig = TOKENS[token]
    const availableTokens = getAvailableTokens(network)
    const totalUsd = coffees * COFFEE_USD
    const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS!

    // Reset token se rede não suportar
    useEffect(() => {
        if (!availableTokens.includes(token)) setToken(availableTokens[0])
    }, [network])

    // Preço do ETH para mostrar equivalência
    useEffect(() => {
        if (token !== 'ETH') return
        fetch('/api/prices')
            .then(r => r.json())
            .then(d => setEthPrice(d.ethUsd))
            .catch(() => { })
    }, [token, network])

    // Detecta carteiras via EIP-6963
    useEffect(() => {
        const found: EIP6963Provider[] = []

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as EIP6963Provider
            if (!found.find(w => w.info.uuid === detail.info.uuid)) {
                found.push(detail)
                setWallets([...found])
            }
        }

        window.addEventListener('eip6963:announceProvider', handler)
        window.dispatchEvent(new Event('eip6963:requestProvider'))

        // Fallback MetaMask legado
        const t = setTimeout(() => {
            if (found.length === 0 && (window as any).ethereum) {
                setWallets([{
                    info: { uuid: 'legacy', name: 'MetaMask', icon: '' },
                    provider: (window as any).ethereum,
                }])
            }
        }, 200)

        return () => {
            window.removeEventListener('eip6963:announceProvider', handler)
            clearTimeout(t)
        }
    }, [])

    // ─── Wallet ──────────────────────────────────────────────────────────────────

    async function connectWallet(wallet: EIP6963Provider) {
        try {
            const accounts = await wallet.provider.request({
                method: 'eth_requestAccounts',
            }) as string[]
            setConnected({ address: accounts[0], provider: wallet.provider, name: wallet.info.name })
            setShowWallets(false)
        } catch {
            setError('Falha ao conectar carteira.')
        }
    }

    async function ensureNetwork(provider: EthProvider): Promise<void> {
        const chainHex = '0x' + netConfig.id.toString(16)
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainHex }],
            })
        } catch (err: any) {
            if (err.code === 4902) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: chainHex,
                        chainName: netConfig.name,
                        nativeCurrency: netConfig.nativeCurrency,
                        rpcUrls: [netConfig.rpcUrl],
                        blockExplorerUrls: [netConfig.explorer],
                    }],
                })
            } else {
                throw new Error('Não foi possível trocar de rede.')
            }
        }
    }

    // ─── Send ────────────────────────────────────────────────────────────────────

    async function handleSend() {
        if (!connected) { setShowWallets(true); return }
        setError(null)

        try {
            setStep('switching')
            await ensureNetwork(connected.provider)

            setStep('sending')
            let tx: string

            if (token === 'ETH') {
                if (!ethPrice) throw new Error('Preço do ETH indisponível. Tente novamente.')
                const ethAmount = totalUsd / ethPrice
                const valueWei = BigInt(Math.round(ethAmount * 1e18))

                tx = await connected.provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: connected.address,
                        to: walletAddress,
                        value: '0x' + valueWei.toString(16),
                    }],
                }) as string

            } else {
                const tokenAddress = tokenConfig.addresses[network]!
                const totalRaw = BigInt(totalUsd * 10 ** tokenConfig.decimals)

                const data = encodeFunctionData({
                    abi: ERC20_TRANSFER_ABI,
                    functionName: 'transfer',
                    args: [walletAddress as `0x${string}`, totalRaw],
                })

                tx = await connected.provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: connected.address,
                        to: tokenAddress,
                        data,
                    }],
                }) as string
            }

            setTxHash(tx)
            setStep('confirming')

            // Notifica backend — sem bloquear UX
            const encryptedMsg = isPrivate
                ? encryptMessage(message, process.env.NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY!)
                : null

            await fetch('/api/donations/onchain/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: tx,
                    network,
                    token,
                    coffees,
                    name: isPrivate ? '' : name,
                    message: isPrivate ? '' : message,
                    encryptedMessage: encryptedMsg,
                    isPrivate,
                    walletAddress: connected.address,
                }),
            })

            setStep('done')
            onSuccess()

        } catch (err: any) {
            setStep('idle')
            if (err.code === 4001) setError('Transação cancelada.')
            else setError(err.message ?? 'Erro inesperado.')
        }
    }

    // ─── UI helpers ──────────────────────────────────────────────────────────────

    const ethEquiv = ethPrice
        ? (totalUsd / ethPrice).toFixed(5)
        : null

    const isLoading = ['switching', 'sending', 'confirming'].includes(step)
    const explorerTx = txHash ? `${netConfig.explorer}/tx/${txHash}` : null

    const stepLabel: Record<Step, string> = {
        idle: `Apoiar com $${totalUsd.toFixed(2)}`,
        switching: 'Trocando de rede…',
        sending: 'Aguardando confirmação na carteira…',
        confirming: 'Enviando…',
        done: 'Enviado!',
    }

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">

            {/* Back */}
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                ← Voltar
            </button>

            {/* Rede */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Rede
                </p>
                <div className="flex gap-2 flex-wrap">
                    {(Object.keys(NETWORKS) as NetworkKey[]).map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setNetwork(n)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${network === n
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                            style={network === n
                                ? { borderColor: NETWORKS[n].color, color: NETWORKS[n].color, backgroundColor: NETWORKS[n].color + '18' }
                                : {}
                            }
                        >
                            {NETWORKS[n].name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Token */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Token
                </p>
                <div className="flex gap-2">
                    {availableTokens.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setToken(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${token === t
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Valor */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-2xl font-bold text-foreground">
                    ${totalUsd.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                        = {coffees} café{coffees > 1 ? 's' : ''}
                    </span>
                </p>
                {token === 'ETH' && ethEquiv && (
                    <p className="text-sm text-muted-foreground">≈ {ethEquiv} ETH</p>
                )}
                {(token === 'USDC' || token === 'USDT') && (
                    <p className="text-sm text-muted-foreground">
                        {totalUsd.toFixed(2)} {token}
                    </p>
                )}
            </div>

            {/* Destino */}
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                <span className="text-xs text-muted-foreground shrink-0">Para</span>
                <span className="font-mono text-xs text-foreground truncate flex-1">{walletAddress}</span>
                <a
                    href={`${netConfig.explorer}/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>

            {/* Carteira conectada / botão conectar */}
            {
                connected ? (
                    <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-mono text-xs text-foreground">
                                {connected.address.slice(0, 6)}…{connected.address.slice(-4)}
                            </span>
                            <span className="text-muted-foreground text-xs">({connected.name})</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setConnected(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowWallets(true)}
                        className="w-full py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition flex items-center justify-center gap-2"
                    >
                        <Wallet className="h-4 w-4" />
                        Conectar carteira
                    </button>
                )
            }

            {/* Mensagem privada — tooltip */}
            {
                isPrivate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                            className="relative"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <Info className="h-3.5 w-3.5 cursor-help text-primary/70" />
                            {showTooltip && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg bg-popover border border-border shadow-lg px-3 py-2 text-xs text-foreground z-50">
                                    Sua mensagem é criptografada localmente com X25519 antes de sair do seu navegador. Só o dono do blog consegue ler.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                                </div>
                            )}
                        </div>
                        Mensagem privada — será criptografada antes do envio
                    </div>
                )
            }

            {/* Erro */}
            {
                error && (
                    <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )
            }

            {/* Botão principal */}
            <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || step === 'done'}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {step === 'done' && <CheckCircle2 className="h-4 w-4" />}
                {stepLabel[step]}
            </button>

            {/* Link da transação */}
            {
                explorerTx && (
                    <a
                        href={explorerTx}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Ver transação no explorer
                    </a >
                )
            }

            <WalletModal
                open={showWallets}
                onOpenChange={setShowWallets}
                wallets={wallets}
                onConnect={connectWallet}
            />
        </div >
    )
}