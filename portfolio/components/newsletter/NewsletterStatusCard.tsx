// Shared shell of the pages a visitor reaches from a newsletter email
// (confirm subscription, unsubscribe). It reuses the dusk valley and the dark
// mail pill of the /newsletter hero so the round trip, form -> email -> link,
// reads as one flow instead of landing on a generic alert box.
//
// The pill carries the state (working, done, failed), so the heading and the
// description never need a colored panel to say the same thing.

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Mail, MailCheck, MailX } from 'lucide-react'

import duskValley from '@/public/newsletter/dusk-valley.webp'

export type NewsletterStatusTone = 'idle' | 'loading' | 'success' | 'error'

// objectBoundingBox units: the bottom edge dips towards the center, where the
// pill sits, echoing the wave of the /newsletter hero at card size.
const WAVE_PATH = 'M0,0 H1 V0.8 C0.72,0.92 0.62,1 0.5,1 C0.38,1 0.28,0.92 0,0.8 Z'

const ICONS = {
    idle: <Mail className="h-6 w-6 text-white/90" strokeWidth={1.75} />,
    loading: <Loader2 className="h-6 w-6 animate-spin text-white/90" strokeWidth={1.75} />,
    success: <MailCheck className="h-6 w-6 text-emerald-400" strokeWidth={1.75} />,
    error: <MailX className="h-6 w-6 text-red-400" strokeWidth={1.75} />,
} satisfies Record<NewsletterStatusTone, ReactNode>

interface NewsletterStatusCardProps {
    tone: NewsletterStatusTone
    eyebrow: string
    title: string
    description: string
    children?: ReactNode
}

export function NewsletterStatusCard({ tone, eyebrow, title, description, children }: NewsletterStatusCardProps) {
    return (
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative h-44">
                <div className="absolute inset-0" style={{ clipPath: 'url(#nl-status-wave)' }}>
                    <Image
                        src={duskValley}
                        alt=""
                        fill
                        priority
                        sizes="512px"
                        placeholder="blur"
                        // Keeps the horizon and the river in frame; the crop falls on the sky.
                        className="object-cover object-[center_70%]"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40" />
                </div>

                {/* The ring matches the card background, so the pill reads as cut
                    out of the wave rather than pasted on top of it. The hairline
                    border keeps it visible in dark mode, where #111 on the card
                    background would otherwise disappear. */}
                <div
                    className="absolute bottom-0 left-1/2 flex h-14 w-24 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#111] ring-[6px] ring-card"
                    aria-hidden
                >
                    {ICONS[tone]}
                </div>

                <svg className="absolute h-0 w-0" aria-hidden>
                    <defs>
                        <clipPath id="nl-status-wave" clipPathUnits="objectBoundingBox">
                            <path d={WAVE_PATH} />
                        </clipPath>
                    </defs>
                </svg>
            </div>

            {/* The state changes after the page loads (the request runs on the
                client), so the copy is announced when it does. */}
            <div className="px-6 pb-8 pt-14 text-center sm:px-10" aria-live="polite">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
                {/* type-h2 rather than type-h1: at the h1 size the titles wrapped inside
                    the card and left the trailing emoji alone on the second line. */}
                <h1 className="type-h2 mb-3 text-balance text-foreground">{title}</h1>
                <p className="type-body text-pretty leading-relaxed text-muted-foreground">{description}</p>
                {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
            </div>
        </div>
    )
}

// Same two button styles as the locale 404 page, except the secondary hover:
// --accent is a brand color (green in light, blue in dark), not a neutral
// surface, so a bordered button turned solid green on hover. --muted is the
// neutral gray both themes define for exactly this.
const PRIMARY =
    'inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
const SECONDARY =
    'inline-flex items-center justify-center gap-2 rounded border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'

export function StatusLink({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
    return (
        <Link href={href} className={primary ? PRIMARY : SECONDARY}>
            {children}
        </Link>
    )
}

export function StatusButton({
    onClick,
    primary,
    disabled,
    children,
}: {
    onClick: () => void
    primary?: boolean
    disabled?: boolean
    children: ReactNode
}) {
    return (
        <button type="button" onClick={onClick} disabled={disabled} className={primary ? PRIMARY : SECONDARY}>
            {children}
        </button>
    )
}

// Page frame: the navbar is fixed, so the top padding keeps the card clear of it.
export function NewsletterStatusMain({ children }: { children: ReactNode }) {
    return (
        <main className="flex min-h-screen items-center justify-center px-4 pb-16 pt-28">{children}</main>
    )
}
