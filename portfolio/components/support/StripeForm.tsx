'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface Props {
    onBack: () => void
    onSuccess: () => void
}

export function StripeForm({ onBack, onSuccess }: Props) {
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
                    ? (error.message ?? 'Erro no cartão.')
                    : 'Ocorreu um erro inesperado.'
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
                ← Voltar
            </button>

            <form onSubmit={handleSubmit}>
                {/* min-h garante que o iframe do Stripe tenha espaço para renderizar */}
                <div className="min-h-[200px]">
                    <PaymentElement
                        options={{
                            layout: 'tabs', // 'tabs' é mais compacto que 'accordion'
                        }}
                    />
                </div>

                {message && <p className="text-sm text-red-500 mt-3">{message}</p>}

                <button
                    type="submit"
                    disabled={isProcessing || !stripe || !elements}
                    className="w-full mt-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                    {isProcessing ? 'Processando...' : 'Pagar'}
                </button>
            </form>
        </div>
    )
}