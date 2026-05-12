'use client'

// app/[locale]/newsletter/NewsletterSubscribeForm.tsx
//
// Shared subscription form used in two visual variants:
//   - "hero"  → light background, horizontal layout
//   - "cta"   → dark background, styled accordingly

import { useState } from 'react'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'

type Variant = 'hero' | 'cta'
type FormState = 'idle' | 'loading' | 'success' | 'error'

interface Props {
    variant?: Variant
}

export function NewsletterSubscribeForm({ variant = 'hero' }: Props) {
    const [email, setEmail] = useState('')
    const [state, setState] = useState<FormState>('idle')
    const [message, setMessage] = useState('')

    const isCta = variant === 'cta'

    const t = useTranslations("newsletterCard");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !email.includes('@')) {
            setMessage('Digite um e-mail válido.')
            setState('error')
            return
        }

        setState('loading')
        setMessage('')

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()

            if (res.ok) {
                setState('success')
                setMessage(data.message ?? 'Verifique seu e-mail para confirmar!')
                setEmail('')
            } else {
                setState('error')
                setMessage(data.error ?? 'Erro ao se inscrever. Tente novamente.')
            }
        } catch {
            setState('error')
            setMessage('Erro de conexão. Tente novamente.')
        }
    }

    if (state === 'success') {
        return (
            <div
                className={`flex items-center gap-3 text-sm font-medium ${isCta ? 'text-background dark:text-white justify-center' : 'text-foreground'}`}
            >
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                {message}
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className={`flex gap-2 ${isCta ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>

                <form
                    onSubmit={handleSubmit}
                    className="flex items-stretch gap-3 bg-card w-full border border-border rounded-lg p-2 shadow-sm"
                >
                    <div className="flex-1 min-w-0 pl-2">
                        <label className="text-xs font-semibold text-foreground">
                            {t("emailLabel")}
                        </label>
                        <Input
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                if (state === "error") setState("idle");
                            }}
                            disabled={state === "loading"}
                            className="border-0 p-0 h-auto text-sm bg-transparent shadow-none focus-visible:ring-0 text-muted-foreground placeholder:text-muted-foreground disabled:opacity-50"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="rounded-lg self-center min-w-[110px]"
                        disabled={state === "loading" || !email}
                    >
                        {state === "loading" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t("submit")
                        )}
                    </Button>
                </form>
            </div>

            {
                state === 'error' && message && (
                    <p className={`mt-2 text-xs ${isCta ? 'text-red-400' : 'text-red-500'}`}>
                        {message}
                    </p>
                )
            }
        </div >
    )
}