'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

import { StripeForm } from './StripeForm'
import { PixView } from './PixView'
import { CryptoView } from './CryptoView'
import { SuccessView } from './SuccessView'
import { FaPix } from 'react-icons/fa6'
import { FaCreditCard, FaEthereum } from 'react-icons/fa'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const COFFEE_PRICE_BRL = 5
const QUANTITIES = [1, 3, 5, 10]

type PaymentMethod = 'pix' | 'card' | 'eth'

type Step = 'form' | 'pix-qr' | 'stripe' | 'eth' | 'success'

interface FormState {
    coffees: number
    customCoffees: string
    name: string
    message: string
    isPrivate: boolean
    isMonthly: boolean
    method: PaymentMethod
}

const INITIAL_FORM: FormState = {
    coffees: 1,
    customCoffees: '',
    name: '',
    message: '',
    isPrivate: false,
    isMonthly: false,
    method: 'pix',
}

export function DonationWidget() {
    const t = useTranslations('support')
    const { resolvedTheme } = useTheme()
    const [step, setStep] = useState<Step>('form')
    const [form, setForm] = useState<FormState>(INITIAL_FORM)
    const [clientSecret, setClientSecret] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [pixData, setPixData] = useState<{
        pixId: string
        donationId: string
        brCode: string
        brCodeBase64: string
    } | null>(null)

    const coffees = form.customCoffees ? Math.max(1, parseInt(form.customCoffees) || 1) : form.coffees
    const total = coffees * COFFEE_PRICE_BRL

    function reset() {
        setStep('form')
        setForm(INITIAL_FORM)
        setClientSecret('')
        setPixData(null)
        setError('')
    }

    async function handleSupport() {
        setError('')
        setLoading(true)

        const payload = {
            coffees,
            name: form.name,
            message: form.message,
            isPrivate: form.isPrivate,
            isMonthly: form.isMonthly,
        }

        try {
            if (form.method === 'pix') {
                const res = await fetch('/api/donations/pix/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                setPixData(data)
                setStep('pix-qr')
            } else if (form.method === 'card') {
                const res = await fetch('/api/donations/stripe/create-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                setClientSecret(data.clientSecret)
                setStep('stripe')
            } else {
                setStep('eth')
            }
        } catch {
            setError(t('widget.genericError'))
        } finally {
            setLoading(false)
        }
    }

    if (step === 'success') {
        return <SuccessView onReset={reset} />
    }

    if (step === 'pix-qr' && pixData) {
        return <PixView {...pixData} onSuccess={() => setStep('success')} />
    }

    if (step === 'stripe' && clientSecret) {
        const stripeTheme = resolvedTheme === 'dark' ? 'night' : 'stripe'

        return (
            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret,
                    locale: 'pt-BR',
                    appearance: {
                        theme: stripeTheme,
                        variables: {
                            borderRadius: '8px',
                            colorBackground: stripeTheme === 'night' ? '#1c1c1e' : '#ffffff',
                        },
                    },
                    loader: 'always',
                }}
            >
                <StripeForm onBack={() => setStep('form')} onSuccess={() => setStep('success')} />
            </Elements>
        )
    }

    if (step === 'eth') {
        return (
            <CryptoView
                coffees={coffees}
                name={form.name}
                message={form.message}
                isPrivate={form.isPrivate}
                onBack={() => setStep('form')}
                onSuccess={() => setStep('success')}
            />
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">☕</span>
                <span className="text-lg font-medium text-foreground">×</span>
                <div className="flex gap-2 flex-wrap">
                    {QUANTITIES.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, coffees: q, customCoffees: '' }))}
                            className={`w-10 h-10 rounded-full font-bold text-sm border transition-all
                                        ${q === 3 ? 'hidden sm:flex items-center justify-center' : ''}
                                        ${form.coffees === q && !form.customCoffees
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:border-primary text-foreground'
                                }`}
                        >
                            {q}
                        </button>
                    ))}

                    <input
                        type="number"
                        min={1}
                        placeholder="?"
                        value={form.customCoffees}
                        onChange={(e) => setForm((f) => ({ ...f, customCoffees: e.target.value }))}
                        className={`w-10 h-10 rounded-full border text-center text-sm bg-background text-foreground focus:outline-none transition-all
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                    ${form.customCoffees
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary text-foreground'
                            }`}
                    />
                </div>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
                = <span className="font-bold text-foreground text-base">R$ {total},00</span>
            </p>

            <div className="space-y-3 mb-4">
                <input
                    type="text"
                    placeholder={t('widget.namePlaceholder')}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary"
                />
                <textarea
                    placeholder={t('widget.messagePlaceholder')}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary resize-none"
                />
            </div>

            <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">{t('widget.payWith')}</p>
                <div className="grid grid-cols-3 gap-2">
                    {(['pix', 'card', 'eth'] as const).map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, method }))}
                            className={`py-2.5 flex items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-all ${form.method === method
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                                }`}
                        >
                            {method === 'pix' ? <FaPix /> : method === 'card' ? <FaCreditCard /> : <FaEthereum />}
                            {method === 'pix' ? t('widget.methods.pix') : method === 'card' ? t('widget.methods.card') : t('widget.methods.eth')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 mb-5 text-sm text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={form.isPrivate}
                        onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                    />
                    {t('widget.privateMessage')}
                </label>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <button
                type="button"
                onClick={handleSupport}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition disabled:opacity-50"
            >
                {loading ? t('widget.loading') : t('widget.supportWith', { amount: total })}
            </button>
        </div>
    )
}
