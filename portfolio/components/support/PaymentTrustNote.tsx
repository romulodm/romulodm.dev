'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

/**
 * Trust line shown under the donation widget in every step (form, PIX QR,
 * card form, success). It sits outside the widget card so it stays put while
 * the card swaps its content.
 *
 * The details live in the privacy policy (section 9 covers donations), not in
 * a modal: one source of truth for what is stored and who processes payments.
 */
export function PaymentTrustNote() {
    const t = useTranslations('support')

    return (
        <p className="flex items-start justify-center gap-1.5 px-2 text-center text-xs leading-relaxed text-muted-foreground">
            <span>
                {t.rich('trustNote', {
                    link: (chunks) => (
                        <Link
                            href="/legal/privacy-policy"
                            // New tab on purpose: navigating away mid-checkout would
                            // throw out an open PIX QR code or a half-filled card form.
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 transition-colors hover:text-foreground"
                        >
                            {chunks}
                        </Link>
                    ),
                })}
            </span>
        </p>
    )
}
