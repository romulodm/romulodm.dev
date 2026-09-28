'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'
import { Coffee } from 'lucide-react'

interface Props {
    coffees: number
    amount: number   // in cents
    onBack: () => void
    onSuccess: () => void
}

export function StripeForm({ coffees, amount, onBack, onSuccess }: Props) {
    const t = useTranslations('support')
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const amountBRL = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return

        setIsProcessing(true)
        setMessage('')

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/support?success=1`,
            },
            redirect: 'if_required',
        })

        if (error) {
            setMessage(
                error.type === 'card_error' || error.type === 'validation_error'
                    ? (error.message ?? t('stripe.cardError'))
                    : t('stripe.unexpectedError')
            )
            setIsProcessing(false)
        } else {
            onSuccess()
        }
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">

            {/* Back */}
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                ← {t('stripe.back')}
            </button>

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

            {/* Stripe form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="min-h-[200px]">
                    <PaymentElement options={{ layout: 'tabs' }} />
                </div>

                {message && <p className="text-sm text-red-500">{message}</p>}

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
                    <span>
                        {t.rich('stripe.securityNote', {
                            link: (chunks) => (
                                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                                    <strong className="text-foreground">{chunks}</strong>
                                </a>
                            ),
                        })}
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={isProcessing || !stripe || !elements}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                    {isProcessing ? t('stripe.processing') : `${t('stripe.pay')} · ${amountBRL}`}
                </button>
            </form>
        </div>
    )
}