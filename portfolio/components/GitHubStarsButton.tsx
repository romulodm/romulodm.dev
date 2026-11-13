'use client'

import { useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { useTranslations } from 'next-intl'

interface GitHubStarsButtonProps {
    user: string
    repo: string
    showCount?: boolean
    variant?: 'default' | 'dark' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function GitHubStarsButton({
    user,
    repo,
    showCount = true,
    variant = 'default',
    size = 'md',
    className = '',
}: GitHubStarsButtonProps) {
    const t = useTranslations('githubStars')
    const [stars, setStars] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Served by our own route (app/api/github/stars), which caches the
        // count: calling api.github.com from the browser hit its per-IP limit
        // and logged a 403 to the console. That route only knows this site's
        // repository, so `user`/`repo` here only build the link.
        fetch('/api/github/stars')
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { stars?: unknown } | null) => {
                if (typeof data?.stars === 'number') {
                    setStars(data.stars)
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [user, repo])

    const href = `https://github.com/${user}/${repo}`

    // ── Tamanhos ──────────────────────────────────────────────────
    const sizes = {
        sm: { btn: 'h-6 px-2.5 text-xs gap-1.5', icon: 12 },
        md: { btn: 'h-7 px-3 text-xs gap-2', icon: 13 },
        lg: { btn: 'h-9 px-4 text-sm gap-2.5', icon: 15 },
    }

    // ── Variantes ─────────────────────────────────────────────────
    const variants = {
        default:
            'bg-[#f6f8fa] text-[#24292f] border border-[#d0d7de] hover:bg-[#f3f4f6] shadow-[0_1px_0_rgba(31,35,40,0.04)]',
        dark: 'bg-[#21262d] text-[#c9d1d9] border border-[rgba(240,246,252,0.1)] hover:bg-[#30363d] hover:border-[rgba(240,246,252,0.18)] shadow-[0_1px_0_rgba(27,31,35,0.04)]',
        ghost:
            'bg-transparent text-white/60 border border-white/10 hover:bg-white/5 hover:text-white/90 hover:border-white/20',
    }

    const { btn: btnSize, icon: iconSize } = sizes[size]
    const variantClass = variants[variant]

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('aria', { repo: `${user}/${repo}` })}
            className={[
                'inline-flex items-center rounded font-medium no-underline select-none',
                'transition-colors duration-150 cursor-pointer',
                btnSize,
                variantClass,
                className,
            ].join(' ')}
        >
            <FaGithub size={iconSize} aria-hidden="true" />

            <span>{t('label')}</span>

            {showCount && (
                <>
                    {/* Divisor */}
                    <span
                        className={[
                            'block w-px self-stretch',
                            variant === 'dark'
                                ? 'bg-white/10'
                                : variant === 'ghost'
                                    ? 'bg-white/10'
                                    : 'bg-[#d0d7de]',
                        ].join(' ')}
                    />

                    {/* Contador */}
                    <span
                        className={[
                            'font-semibold tabular-nums',
                            loading ? 'opacity-40' : 'opacity-100',
                        ].join(' ')}
                    >
                        {loading ? '–' : formatCount(stars ?? 0)}
                    </span>
                </>
            )}
        </a>
    )
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return String(n)
}