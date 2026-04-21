'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'

interface Props {
    onBack: () => void
    onSuccess: () => void
}

export function StripeForm({ onBack, onSuccess }: Props) {
    const t = useTranslations('support')
    const stripe = useStripe()
    const elements = useElements()
    const [message, setMessage] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

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
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
                ← {t('stripe.back')}
            </button>

            <form onSubmit={handleSubmit}>
                <div className="min-h-[200px]">
                    <PaymentElement
                        options={{
                            layout: 'tabs',
                        }}
                    />
                </div>

                {message && <p className="text-sm text-red-500 mt-3">{message}</p>}

                <button
                    type="submit"
                    disabled={isProcessing || !stripe || !elements}
                    className="w-full mt-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                    {isProcessing ? t('stripe.processing') : t('stripe.pay')}
                </button>
            </form>
        </div>
    )
}
