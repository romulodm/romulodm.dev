'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldCheck, Coffee } from 'lucide-react'
import { PrivacyPolicyModal } from '@/components/modals/PrivacyPolicyModal'

interface Props {
    pixId: string
    donationId: string
    brCode: string
    brCodeBase64: string
    coffees: number
    amount: number   // in cents
    onSuccess: () => void
}

export function PixView({ pixId, donationId, brCode, brCodeBase64, coffees, amount, onSuccess }: Props) {
    const t = useTranslations('support')
    const [copied, setCopied] = useState(false)
    const [simulating, setSimulating] = useState(false)
    const [privacyOpen, setPrivacyOpen] = useState(false)
    const isDev = process.env.NODE_ENV === 'development'

    const amountBRL = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await fetch(`/api/donations/pix/check?pixId=${pixId}&donationId=${donationId}`)
            const { status } = await res.json()
            if (status === 'PAID') {
                clearInterval(interval)
                onSuccess()
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [pixId, donationId, onSuccess])

    function handleCopy() {
        navigator.clipboard.writeText(brCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function handleSimulate() {
        setSimulating(true)
        try {
            const res = await fetch('/api/donations/pix/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pixId, donationId }),
            })
            if (res.ok) onSuccess()
        } finally {
            setSimulating(false)
        }
    }

    return (
        <>
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm space-y-4">

                {/* Payment summary */}
                <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Coffee className="w-4 h-4" />
                        <span>
                            {coffees} {coffees === 1 ? 'café' : 'cafés'}
                        </span>
                    </div>
                    <span className="font-semibold text-foreground">{amountBRL}</span>
                </div>

                {/* Title */}
                <div>
                    <h3 className="font-bold text-foreground mb-1">{t('pix.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('pix.description')}
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                    <img
                        src={brCodeBase64}
                        alt={t('pix.qrAlt')}
                        width={180}
                        height={180}
                        className="rounded-xl"
                    />
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="w-full py-2.5 rounded-lg border border-border text-sm hover:bg-muted/50 transition text-foreground"
                >
                    {copied ? `✓ ${t('pix.copied')}` : t('pix.copy')}
                </button>

                {/* Dev simulate */}
                {isDev && (
                    <button
                        onClick={handleSimulate}
                        disabled={simulating}
                        className="w-full py-2.5 rounded-lg border border-dashed border-yellow-500 text-yellow-600 dark:text-yellow-400 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition disabled:opacity-50"
                    >
                        {simulating ? t('pix.simulating') : `⚡ ${t('pix.simulate')}`}
                    </button>
                )}

                {/* Already paid */}
                <button
                    onClick={onSuccess}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                >
                    {t('pix.alreadyPaid')} ✓
                </button>

                {/* Security badge + privacy link */}
                <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span>PIX seguro via AbacatePay · Banco Central do Brasil</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Você pode checar a política de privacidade{' '}
                        <button
                            type="button"
                            onClick={() => setPrivacyOpen(true)}
                            className="underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                            aqui
                        </button>
                        .
                    </p>
                </div>
            </div>

            <PrivacyPolicyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
        </>
    )
}