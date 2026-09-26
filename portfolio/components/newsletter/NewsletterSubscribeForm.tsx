'use client'

// Single newsletter sign-up field used by the footer, the /newsletter page and
// the newsletter slide of the blog carousel. The form never swaps itself for a
// success panel: the outcome is reported through a toast, so the field stays
// in place and the surrounding layout does not jump after a submit.

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'dark'

interface NewsletterSubscribeFormProps {
    /**
     * "default" follows the site theme. "dark" pins the colors for surfaces
     * that stay dark in both themes (the footer card is always #0e0e0e, so
     * theme tokens like bg-card would render a white field on it in light mode).
     */
    tone?: Tone
    className?: string
}

const TONE_CLASSES: Record<Tone, string> = {
    default: 'border-border bg-card text-foreground placeholder:text-muted-foreground',
    dark: 'border-white/10 bg-white/5 text-white placeholder:text-white/40',
}

// The emoji sits inline before the title instead of in react-toastify's icon
// slot, which is why every toast from this form passes `icon: false`.
function ToastBody({ emoji, title, description }: { emoji: string; title: string; description: ReactNode }) {
    return (
        <div>
            <p className="font-semibold">
                <span aria-hidden className="mr-1.5">{emoji}</span>
                {title}
            </p>
            <p className="mt-0.5 text-sm opacity-80">{description}</p>
        </div>
    )
}

export function NewsletterSubscribeForm({ tone = 'default', className }: NewsletterSubscribeFormProps) {
    const t = useTranslations('newsletterForm')
    // useId instead of a fixed id: the footer and the carousel slide render on
    // the same page, and a duplicated id would bind both labels to one input.
    const inputId = useId()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const showError = (description: string) => {
        toast.error(<ToastBody emoji="😕" title={t('error.title')} description={description} />, {
            icon: false,
        })
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const value = email.trim().toLowerCase()
        if (!value || loading) return

        setLoading(true)
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value }),
            })

            if (res.ok) {
                setEmail('')
                toast.success(
                    <ToastBody emoji="📬" title={t('success.title')} description={t('success.description')} />,
                    { icon: false, autoClose: 6000 },
                )
                return
            }

            // The route answers with an already translated `error`. The body is
            // parsed defensively because a proxy error page (502/504 from nginx)
            // is HTML, and failing to parse it must not be reported as a
            // connection problem on the visitor's side.
            const data: { error?: unknown } | null = await res.json().catch(() => null)
            showError(typeof data?.error === 'string' ? data.error : t('errors.generic'))
        } catch {
            showError(t('errors.connection'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
            <label htmlFor={inputId} className="sr-only">
                {t('emailLabel')}
            </label>
            <Input
                id={inputId}
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                className={cn(
                    'h-14 w-full rounded-sm pl-6 pr-16 text-base shadow-sm transition-colors focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50',
                    TONE_CLASSES[tone],
                )}
            />
            <Button
                type="submit"
                size="icon"
                aria-label={t('submit')}
                disabled={loading || !email.trim()}
                className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-sm transition-transform hover:scale-105 disabled:opacity-40"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
        </form>
    )
}
