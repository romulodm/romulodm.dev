'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
    pixId: string
    donationId: string
    brCode: string
    brCodeBase64: string
    onSuccess: () => void
}

export function PixView({ pixId, donationId, brCode, brCodeBase64, onSuccess }: Props) {
    const t = useTranslations('support')
    const [copied, setCopied] = useState(false)
    const [simulating, setSimulating] = useState(false)
    const isDev = process.env.NODE_ENV === 'development'

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
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <h3 className="font-bold text-foreground mb-1">{t('pix.title')}</h3>
            <p className="text-sm text-muted-foreground mb-5">
                {t('pix.description')}
            </p>

            <div className="flex justify-center mb-4">
                <img
                    src={brCodeBase64}
                    alt={t('pix.qrAlt')}
                    width={180}
                    height={180}
                    className="rounded-xl"
                />
            </div>

            <button
                onClick={handleCopy}
                className="w-full py-2.5 mb-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition text-foreground"
            >
                {copied ? `✓ ${t('pix.copied')}` : t('pix.copy')}
            </button>

            {isDev && (
                <button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="w-full py-2.5 mb-3 rounded-lg border border-dashed border-yellow-500 text-yellow-600 dark:text-yellow-400 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition disabled:opacity-50"
                >
                    {simulating ? t('pix.simulating') : `⚡ ${t('pix.simulate')}`}
                </button>
            )}

            <button
                onClick={onSuccess}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
                {t('pix.alreadyPaid')} ✓
            </button>
        </div>
    )
}
