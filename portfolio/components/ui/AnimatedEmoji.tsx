const NOTO_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest'

interface Props {
    /** Noto codepoint as used in the CDN path, e.g. "1faf6" or "270d_fe0f". */
    code: string
    className?: string
}

/**
 * Animated Noto emoji (https://googlefonts.github.io/noto-emoji-animation/).
 *
 * Sized at 1em so it matches the surrounding text (a heading, a paragraph)
 * without per-call sizing. Decorative: callers place it next to text that
 * already carries the meaning, so it is hidden from screen readers. Visitors with
 * prefers-reduced-motion get the static SVG; everyone else gets the animated
 * WebP, with the GIF as fallback for browsers without animated WebP.
 */
export function AnimatedEmoji({ code, className }: Props) {
    const base = `${NOTO_BASE}/${code}`
    return (
        <picture aria-hidden="true" className={`inline-flex shrink-0 ${className ?? ''}`}>
            <source media="(prefers-reduced-motion: reduce)" srcSet={`${base}/emoji.svg`} type="image/svg+xml" />
            <source srcSet={`${base}/512.webp`} type="image/webp" />
            <img src={`${base}/512.gif`} alt="" width={32} height={32} decoding="async" className="w-[1em] h-[1em]" />
        </picture>
    )
}
