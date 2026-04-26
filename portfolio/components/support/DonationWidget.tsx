// src/components/support/DonationWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Info, ExternalLink, Wallet, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react'
import { encodeFunctionData } from 'viem'
import { FaPix } from 'react-icons/fa6'
import { FaCreditCard } from 'react-icons/fa'

import { StripeForm } from './StripeForm'
import { PixView } from './PixView'
import { SuccessView } from './SuccessView'

import {
    NETWORKS, TOKENS, ERC20_TRANSFER_ABI, COFFEE_USD,
    getAvailableTokens, encryptMessage,
    type NetworkKey, type TokenKey,
} from '@romulo/web3'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const COFFEE_PRICE_BRL = 5
const QUANTITIES = [1, 3, 5, 10]

type PaymentMethod = 'pix' | 'card' | 'crypto'
type Step = 'form' | 'pix-qr' | 'stripe' | 'success'
type SendStep = 'idle' | 'switching' | 'sending' | 'confirming' | 'done'

interface FormState {
    coffees: number
    customCoffees: string
    name: string
    message: string
    isPrivate: boolean
    isMonthly: boolean
    method: PaymentMethod
}

interface EIP6963Provider {
    info: { uuid: string; name: string; icon: string }
    provider: EthProvider
}

interface EthProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const INITIAL_FORM: FormState = {
    coffees: 1, customCoffees: '', name: '', message: '',
    isPrivate: false, isMonthly: false, method: 'pix',
}

// Adiciona Ethereum mainnet
const ALL_NETWORKS = {
    ethereum: {
        id: 1,
        name: 'Ethereum',
        shortName: 'ETH',
        rpcUrl: 'https://eth.llamarpc.com',
        explorer: 'https://etherscan.io',
        color: '#627EEA',
        supportsETH: true,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    ...NETWORKS,
} as const

type AllNetworkKey = keyof typeof ALL_NETWORKS

const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`
const USDT_ETHEREUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`

function getTokensForNetwork(network: AllNetworkKey): TokenKey[] {
    if (network === 'ethereum') return ['ETH', 'USDC', 'USDT']
    return getAvailableTokens(network as NetworkKey)
}

function getTokenAddress(token: TokenKey, network: AllNetworkKey): `0x${string}` | undefined {
    if (network === 'ethereum') {
        if (token === 'USDC') return USDC_ETHEREUM
        if (token === 'USDT') return USDT_ETHEREUM
        return undefined
    }
    return TOKENS[token].addresses[network as NetworkKey]
}

export function DonationWidget() {
    const t = useTranslations('support')
    const { resolvedTheme } = useTheme()

    // ── Form state ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>('form')
    const [form, setForm] = useState<FormState>(INITIAL_FORM)
    const [clientSecret, setClientSecret] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [pixData, setPixData] = useState<{
        pixId: string; donationId: string; brCode: string; brCodeBase64: string
    } | null>(null)

    // ── Crypto state ─────────────────────────────────────────────────────────────
    const [network, setNetwork] = useState<AllNetworkKey>('base')
    const [token, setToken] = useState<TokenKey>('USDC')
    const [wallets, setWallets] = useState<EIP6963Provider[]>([])
    const [showWallets, setShowWallets] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [connected, setConnected] = useState<{ address: string; provider: EthProvider; name: string } | null>(null)
    const [ethPrice, setEthPrice] = useState<number | null>(null)
    const [sendStep, setSendStep] = useState<SendStep>('idle')
    const [txHash, setTxHash] = useState<string | null>(null)
    const [cryptoError, setCryptoError] = useState<string | null>(null)

    const coffees = form.customCoffees ? Math.max(1, parseInt(form.customCoffees) || 1) : form.coffees
    const totalBrl = coffees * COFFEE_PRICE_BRL
    const totalUsd = coffees * COFFEE_USD
    const walletAddr = process.env.NEXT_PUBLIC_WALLET_ADDRESS!
    const netConfig = ALL_NETWORKS[network]
    const tokenConfig = TOKENS[token]
    const availTokens = getTokensForNetwork(network)

    // Reset token se rede não suportar
    useEffect(() => {
        if (!availTokens.includes(token)) setToken(availTokens[0])
    }, [network])

    // Preço ETH
    useEffect(() => {
        if (form.method !== 'crypto' || token !== 'ETH') return
        fetch('/api/prices').then(r => r.json()).then(d => setEthPrice(d.ethUsd)).catch(() => { })
    }, [token, network, form.method])

    // Detecta carteiras EIP-6963
    useEffect(() => {
        if (form.method !== 'crypto') return
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
        const t = setTimeout(() => {
            if (found.length === 0 && (window as any).ethereum)
                setWallets([{ info: { uuid: 'legacy', name: 'MetaMask', icon: '' }, provider: (window as any).ethereum }])
        }, 200)
        return () => { window.removeEventListener('eip6963:announceProvider', handler); clearTimeout(t) }
    }, [form.method])

    function reset() {
        setStep('form'); setForm(INITIAL_FORM); setClientSecret(''); setPixData(null)
        setError(''); setSendStep('idle'); setTxHash(null); setCryptoError(null)
    }

    // ── PIX / Card ───────────────────────────────────────────────────────────────
    async function handleSupport() {
        if (form.method === 'crypto') return
        setError(''); setLoading(true)
        const payload = { coffees, name: form.name, message: form.message, isPrivate: form.isPrivate, isMonthly: form.isMonthly }
        try {
            if (form.method === 'pix') {
                const res = await fetch('/api/donations/pix/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                const data = await res.json()
                setPixData(data); setStep('pix-qr')
            } else {
                const res = await fetch('/api/donations/stripe/create-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                const data = await res.json()
                setClientSecret(data.clientSecret); setStep('stripe')
            }
        } catch { setError(t('widget.genericError')) }
        finally { setLoading(false) }
    }

    // ── Crypto ───────────────────────────────────────────────────────────────────
    async function connectWallet(wallet: EIP6963Provider) {
        try {
            const accounts = await wallet.provider.request({ method: 'eth_requestAccounts' }) as string[]
            setConnected({ address: accounts[0], provider: wallet.provider, name: wallet.info.name })
            setShowWallets(false)
        } catch { setCryptoError('Falha ao conectar carteira.') }
    }

    async function ensureNetwork(provider: EthProvider) {
        const chainHex = '0x' + netConfig.id.toString(16)
        try {
            await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex }] })
        } catch (err: any) {
            if (err.code === 4902) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{ chainId: chainHex, chainName: netConfig.name, nativeCurrency: netConfig.nativeCurrency, rpcUrls: [netConfig.rpcUrl], blockExplorerUrls: [netConfig.explorer] }],
                })
            } else throw new Error('Não foi possível trocar de rede.')
        }
    }

    async function handleCryptoSend() {
        if (!connected) { setShowWallets(true); return }
        setCryptoError(null)
        try {
            setSendStep('switching')
            await ensureNetwork(connected.provider)
            setSendStep('sending')
            let tx: string

            if (token === 'ETH') {
                if (!ethPrice) throw new Error('Preço do ETH indisponível.')
                const valueWei = BigInt(Math.round((totalUsd / ethPrice) * 1e18))
                tx = await connected.provider.request({
                    method: 'eth_sendTransaction',
                    params: [{ from: connected.address, to: walletAddr, value: '0x' + valueWei.toString(16) }],
                }) as string
            } else {
                const tokenAddress = getTokenAddress(token, network)!
                const totalRaw = BigInt(totalUsd * 10 ** tokenConfig.decimals)
                const data = encodeFunctionData({ abi: ERC20_TRANSFER_ABI, functionName: 'transfer', args: [walletAddr as `0x${string}`, totalRaw] })
                tx = await connected.provider.request({
                    method: 'eth_sendTransaction',
                    params: [{ from: connected.address, to: tokenAddress, data }],
                }) as string
            }

            setTxHash(tx)
            setSendStep('confirming')

            const encryptedMsg = form.isPrivate ? encryptMessage(form.message, process.env.NEXT_PUBLIC_ENCRYPTION_PUBLIC_KEY!) : null
            await fetch('/api/donations/onchain/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash: tx, network, token, coffees, name: form.isPrivate ? '' : form.name, message: form.isPrivate ? '' : form.message, encryptedMessage: encryptedMsg, isPrivate: form.isPrivate, walletAddress: connected.address }),
            })

            setSendStep('done')
            setStep('success')
        } catch (err: any) {
            setSendStep('idle')
            if (err.code === 4001) setCryptoError('Transação cancelada.')
            else setCryptoError(err.message ?? 'Erro inesperado.')
        }
    }

    // ── Derived ──────────────────────────────────────────────────────────────────
    const ethEquiv = ethPrice ? (totalUsd / ethPrice).toFixed(5) : null
    const isCryptoLoading = ['switching', 'sending', 'confirming'].includes(sendStep)
    const explorerTx = txHash ? `${netConfig.explorer}/tx/${txHash}` : null

    const cryptoLabel: Record<SendStep, string> = {
        idle: `Apoiar com $${totalUsd.toFixed(2)}`,
        switching: 'Trocando de rede…',
        sending: 'Aguardando carteira…',
        confirming: 'Enviando…',
        done: 'Enviado!',
    }

    // ── Fiat label ───────────────────────────────────────────────────────────────
    const fiatLabel = loading ? t('widget.loading') : t('widget.supportWith', { amount: totalBrl })

    // ── Early returns ────────────────────────────────────────────────────────────
    if (step === 'success') return <SuccessView onReset={reset} />
    if (step === 'pix-qr' && pixData) return <PixView {...pixData} onSuccess={() => setStep('success')} />
    if (step === 'stripe' && clientSecret) {
        const stripeTheme = resolvedTheme === 'dark' ? 'night' : 'stripe'
        return (
            <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt-BR', appearance: { theme: stripeTheme, variables: { borderRadius: '8px', colorBackground: stripeTheme === 'night' ? '#1c1c1e' : '#ffffff' } }, loader: 'always' }}>
                <StripeForm onBack={() => setStep('form')} onSuccess={() => setStep('success')} />
            </Elements>
        )
    }

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">

            {/* Quantidade de cafés */}
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">☕</span>
                <span className="text-lg font-medium text-foreground">×</span>
                <div className="flex gap-2 flex-wrap">
                    {QUANTITIES.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, coffees: q, customCoffees: '' }))}
                            className={`w-10 h-10 rounded-full font-bold text-sm border transition-all
                ${q === 3 ? 'hidden sm:flex items-center justify-center' : ''}
                ${form.coffees === q && !form.customCoffees
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:border-primary text-foreground'}`}
                        >
                            {q}
                        </button>
                    ))}
                    <input
                        type="number" min={1} placeholder="?"
                        value={form.customCoffees}
                        onChange={(e) => setForm(f => ({ ...f, customCoffees: e.target.value }))}
                        className={`w-10 h-10 rounded-full border text-center text-sm bg-background text-foreground focus:outline-none transition-all
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${form.customCoffees ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'}`}
                    />
                </div>
            </div>

            {/* Valor — muda conforme método */}
            <p className="text-sm text-muted-foreground mb-5">
                {form.method !== 'crypto' ? (
                    <>= <span className="font-bold text-foreground text-base">R$ {totalBrl},00</span></>
                ) : token === 'ETH' && ethEquiv ? (
                    <>= <span className="font-bold text-foreground text-base">${totalUsd.toFixed(2)}</span>
                        <span className="ml-2 text-muted-foreground">≈ {ethEquiv} ETH</span></>
                ) : (
                    <>= <span className="font-bold text-foreground text-base">${totalUsd.toFixed(2)}</span>
                        {(token === 'USDC' || token === 'USDT') && <span className="ml-2 text-muted-foreground">= {totalUsd.toFixed(2)} {token}</span>}</>
                )}
            </p>

            {/* Nome + mensagem */}
            <div className="space-y-3 mb-4">
                <input
                    type="text"
                    placeholder={t('widget.namePlaceholder')}
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary"
                />
                <textarea
                    placeholder={t('widget.messagePlaceholder')}
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} maxLength={200}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
            </div>

            {/* Método de pagamento */}
            <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">{t('widget.payWith')}</p>
                <div className="grid grid-cols-3 gap-2">
                    {(['pix', 'card', 'crypto'] as const).map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, method }))}
                            className={`py-2.5 flex items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-all ${form.method === method
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                        >
                            {method === 'pix' ? <FaPix /> :
                                method === 'card' ? <FaCreditCard /> :
                                    <span className="text-base">₿</span>}
                            {method === 'pix' ? t('widget.methods.pix') :
                                method === 'card' ? t('widget.methods.card') :
                                    'Crypto'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Painel crypto ──────────────────────────────────────────────────────── */}
            {form.method === 'crypto' && (
                <div className="space-y-4 mb-4">

                    {/* Rede — estilo tabs */}
                    <div>
                        <div className="flex border-b border-border gap-1">
                            {(Object.keys(ALL_NETWORKS) as AllNetworkKey[]).map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNetwork(n)}
                                    className={`px-3 py-2 text-xs font-semibold transition-all border-b-2 -mb-px ${network === n
                                            ? 'border-primary text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                    style={network === n ? { borderBottomColor: ALL_NETWORKS[n].color, color: ALL_NETWORKS[n].color } : {}}
                                >
                                    {ALL_NETWORKS[n].shortName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Token */}
                    <div className="flex gap-2">
                        {availTokens.map(tk => (
                            <button
                                key={tk}
                                type="button"
                                onClick={() => setToken(tk)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${token === tk
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/50'
                                    }`}
                            >
                                {tk}
                            </button>
                        ))}
                    </div>

                    {/* Destino */}
                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                        <span className="text-xs text-muted-foreground shrink-0">Para</span>
                        <span className="font-mono text-xs text-foreground truncate flex-1">{walletAddr}</span>
                        <a href={`${netConfig.explorer}/address/${walletAddr}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                    {/* Carteira */}
                    {connected ? (
                        <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-mono text-xs text-foreground">{connected.address.slice(0, 6)}…{connected.address.slice(-4)}</span>
                                <span className="text-muted-foreground text-xs">({connected.name})</span>
                            </div>
                            <button type="button" onClick={() => setConnected(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowWallets(true)}
                            className="w-full py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition flex items-center justify-center gap-2"
                        >
                            <Wallet className="h-4 w-4" />
                            Conectar carteira
                        </button>
                    )}

                    {/* TX confirmado */}
                    {explorerTx && (
                        <a href={explorerTx} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            Ver transação no explorer
                        </a>
                    )}

                    {cryptoError && (
                        <div className="flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            {cryptoError}
                        </div>
                    )}
                </div>
            )}

            {/* Mensagem privada */}
            <div className="flex gap-4 mb-5 text-sm text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={form.isPrivate}
                        onChange={(e) => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                    />
                    {t('widget.privateMessage')}
                </label>

                {form.isPrivate && form.method === 'crypto' && (
                    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                        <Info className="h-3.5 w-3.5 cursor-help text-primary/70 mt-0.5" />
                        {showTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-popover border border-border shadow-lg px-3 py-2 text-xs text-foreground z-50">
                                Criptografada com X25519 antes de sair do navegador.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            {/* Botão */}
            {form.method === 'crypto' ? (
                <button
                    type="button"
                    onClick={handleCryptoSend}
                    disabled={isCryptoLoading || sendStep === 'done'}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {isCryptoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {sendStep === 'done' && <CheckCircle2 className="h-4 w-4" />}
                    {cryptoLabel[sendStep]}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSupport}
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition disabled:opacity-50"
                >
                    {fiatLabel}
                </button>
            )}

            {/* Modal carteiras */}
            {showWallets && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">Escolha sua carteira</h3>
                            <button type="button" onClick={() => setShowWallets(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {wallets.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma carteira detectada. Instale MetaMask, Rainbow ou Coinbase Wallet.</p>
                        ) : (
                            <div className="space-y-2">
                                {wallets.map(w => (
                                    <button key={w.info.uuid} type="button" onClick={() => connectWallet(w)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition text-left">
                                        {w.info.icon
                                            ? <img src={w.info.icon} alt={w.info.name} className="w-7 h-7 rounded-md" />
                                            : <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center"><Wallet className="h-4 w-4 text-muted-foreground" /></div>
                                        }
                                        <span className="text-sm font-medium text-foreground">{w.info.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}