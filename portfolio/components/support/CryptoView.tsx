'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
    coffees: number
    name: string
    message: string
    isPrivate: boolean
    onBack: () => void
    onSuccess: () => void
}

const ETH_PER_COFFEE = 0.002

export function CryptoView({ coffees, name, message, isPrivate, onBack, onSuccess }: Props) {
    const t = useTranslations('support')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const walletAddress = process.env.NEXT_PUBLIC_ETH_WALLET_ADDRESS!
    const ethAmount = (coffees * ETH_PER_COFFEE).toFixed(4)

    async function handleEthPay() {
        if (!window.ethereum) {
            setError(t('crypto.missingWallet'))
            return
        }

        setLoading(true)
        setError('')

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            }) as string[]

            const from = accounts[0]
            const valueHex = '0x' + BigInt(Math.round(parseFloat(ethAmount) * 1e18)).toString(16)

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{ from, to: walletAddress, value: valueHex }],
            }) as string

            const res = await fetch('/api/donations/eth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ txHash, coffees, name, message, isPrivate, walletAddress: from }),
            })

            if (!res.ok) throw new Error(t('crypto.verifyError'))

            onSuccess()
        } catch (err) {
            const messageText = err instanceof Error ? err.message : t('crypto.genericError')
            setError(messageText)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
                ← {t('crypto.back')}
            </button>

            <div className="text-center mb-5">
                <p className="text-4xl mb-2">Ξ</p>
                <p className="text-2xl font-bold text-foreground">{ethAmount} ETH</p>
                <p className="text-sm text-muted-foreground mt-1">
                    ≈ {t('crypto.coffees', { count: coffees })}
                </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mb-4 break-all">
                <span className="font-medium text-foreground">{t('crypto.wallet')} </span>
                {walletAddress}
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <button
                onClick={handleEthPay}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
            >
                {loading ? t('crypto.waiting') : t('crypto.send')}
            </button>
        </div>
    )
}
