// app/[locale]/newsletter/page.tsx
import { prisma } from '@romulo/database'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { Eye, Heart, MessageSquare, Clock, ArrowRight, Users, Mail, TrendingUp, BookOpen } from 'lucide-react'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { SUPPORTED_LOCALES, type LocaleCode } from '@/lib/locales'
import { formatCount } from '@/lib/format-number'
import { formatDistanceToNow } from '@/lib/utils'
import { NewsletterSubscribeForm } from './NewsletterSubscribeForm'

// ── Data fetching ────────────────────────────────────────────────────────────

const getNewsletterPageData = (locale: string) =>
    unstable_cache(
        async () => {
            const [rawPosts, subscriberCount, totalViews, totalLikes, totalComments, campaignStats] = await Promise.all([
                prisma.post.findMany({
                    where: { status: 'PUBLISHED', publishedAt: { not: null } },
                    orderBy: { publishedAt: 'desc' },
                    take: 6,
                    select: {
                        id: true,
                        slug: true,
                        readingTime: true,
                        coverImageUrl: true,
                        publishedAt: true,
                        likes: true,
                        views: true,
                        commentsCount: true,
                        postTags: { select: { tag: true } },
                        translations: {
                            where: { locale },
                            select: { title: true, summary: true, locale: true },
                        },
                    },
                }),
                prisma.newsletterSubscriber.count({
                    where: { isConfirmed: true, unsubscribedAt: null },
                }),
                prisma.post.aggregate({
                    where: { status: 'PUBLISHED' },
                    _sum: { views: true },
                }),
                prisma.post.aggregate({
                    where: { status: 'PUBLISHED' },
                    _sum: { likes: true },
                }),
                prisma.post.aggregate({
                    where: { status: 'PUBLISHED' },
                    _sum: { commentsCount: true },
                }),
                prisma.campaign.aggregate({
                    _sum: { sentCount: true, openCount: true },
                }),
            ])

            const posts = rawPosts.flatMap((post) => {
                const t = post.translations[0]
                if (!t) return []
                const { translations, ...rest } = post
                return [{ ...rest, title: t.title, summary: t.summary }]
            })

            return {
                posts,
                subscriberCount,
                totalViews: totalViews._sum.views ?? 0,
                totalLikes: totalLikes._sum.likes ?? 0,
                totalComments: totalComments._sum.commentsCount ?? 0,
                emailsSent: campaignStats._sum.sentCount ?? 0,
                openCount: campaignStats._sum.openCount ?? 0,
            }
        },
        [`newsletter-page-${locale}`],
        { revalidate: 300 },
    )()

// ── Metadata ─────────────────────────────────────────────────────────────────

export const metadata = {
    title: 'Newsletter — Romulo',
    description: 'Conteúdo sobre desenvolvimento web, TypeScript, e engenharia de software. Direto no seu e-mail.',
}

// ── Corner marker component ───────────────────────────────────────────────────

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
    const base = 'absolute w-5 h-5 pointer-events-none'
    const map = {
        tl: 'top-0 left-0 border-t border-l',
        tr: 'top-0 right-0 border-t border-r',
        bl: 'bottom-0 left-0 border-b border-l',
        br: 'bottom-0 right-0 border-b border-r',
    }
    return <span className={`${base} ${map[pos]} border-foreground/40 dark:border-white/30`} />
}

function CrossHair({ className = '' }: { className?: string }) {
    return (
        <span className={`absolute pointer-events-none select-none text-foreground/30 dark:text-white/25 text-2xl z-10 leading-none ${className}`}>
            +
        </span>
    )
}

// ── Post card ────────────────────────────────────────────────────────────────

type PostData = {
    id: string
    slug: string
    readingTime: number
    coverImageUrl: string | null
    publishedAt: Date | string | null
    likes: number
    views: number
    commentsCount: number
    postTags: { tag: string }[]
    title: string
    summary: string | null
}

function NewsletterPostCard({ post }: { post: PostData; }) {

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group relative flex flex-col p-6 bg-background dark:bg-neutral-950 transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.03]"
        >
            {/* Category tag */}
            {post.postTags[0] && (
                <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground mb-3">
                    {post.postTags[0].tag}
                </span>
            )}

            {/* Title */}
            <h3 className="font-bold text-foreground text-base leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-3 flex-1">
                {post.title}
            </h3>

            {/* Summary */}
            {post.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-5">
                    {post.summary}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye size={13} />{formatCount(post.views)}</span>
                    <span className="flex items-center gap-1"><Heart size={13} />{formatCount(post.likes)}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{post.readingTime}m</span>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
        </Link>
    )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function NewsletterPage({
    params,
}: {
    params: Promise<{ locale: LocaleCode }>
}) {
    const { locale: rawLocale } = await params
    const locale = SUPPORTED_LOCALES.find((l) => l.code === rawLocale)?.code ?? 'pt-BR'
    const { posts, subscriberCount, totalViews, totalLikes, totalComments, emailsSent, openCount } =
        await getNewsletterPageData(locale)

    const stats = [
        { label: 'Posts publicados', value: formatCount(posts.length > 0 ? posts.length : 0) },
        { label: 'Visualizações totais', value: formatCount(totalViews) + '+' },
        { label: 'Curtidas nos posts', value: formatCount(totalLikes) + '+' },
        { label: 'Comentários', value: formatCount(totalComments) + '+' },
    ]

    const benefits = [
        'Novos artigos assim que publicados',
        'Dicas e conteúdo técnico exclusivo',
        'Projetos e novidades em primeira mão',
    ]

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* ── HERO ───────────────────────────────────────────────────────── */}
            <section className="">
                {/* Outer grid lines */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
                    {/* Vertical rule lines */}
                    <div className="absolute inset-0 flex pointer-events-none" aria-hidden>
                        <div className="w-px bg-border/60 dark:bg-white/[0.06] self-stretch ml-0" />
                        <div className="flex-1" />
                        <div className="w-px bg-border/60 dark:bg-white/[0.06] self-stretch mr-0" />
                    </div>

                    {/* Crosshairs at key intersections */}
                    <CrossHair className="-bottom-[10px] -left-[7px]" />
                    <CrossHair className="-bottom-[10px] -right-[7.5px]" />

                    <div className="grid md:grid-cols-2 min-h-[480px]">
                        {/* Left */}
                        <div className="flex flex-col justify-center py-24 pr-0 md:pr-12 border-b md:border-b-0 md:border-r border-border">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-5">
                                Junte-se com <span className="text-secondary">
                                    {subscriberCount.toLocaleString(locale)}
                                </span>+ leitores inscritos
                            </h1>

                            <p className="text-base text-muted-foreground leading-relaxed mb-8">
                                Receba posts sobre desenvolvimento, arquitetura, carreira, vida acadêmica e muito mais diretamente no seu e-mail.
                                Sem enrolação, só conteúdo sobre o que aprendi e estou aprendendo no caminho.
                            </p>

                            {/* Inline subscribe form */}
                            <NewsletterSubscribeForm variant="hero" />

                            <p className="mt-3 text-xs text-muted-foreground">
                                Sem spam, cancele quando quiser. Seu e-mail nunca será compartilhado.
                            </p>
                        </div>

                        {/* Right */}
                        <div className="relative flex flex-col py-24 pl-0 md:pl-12 gap-6">

                            {/* Benefits list */}
                            <div className="relative p-6 flex-1">
                                <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                                <p className="text-xs tracking-widest uppercase font-semibold text-muted-foreground mb-4">
                                    O que você recebe
                                </p>
                                <ul className="space-y-3">
                                    {benefits.map((b) => (
                                        <li key={b} className="flex items-start gap-3 text-sm text-foreground">
                                            <span className="mt-0.5 w-4 h-4 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </span>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* E-mails enviados */}
                            <div className="relative p-6">
                                <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                                <div className="text-5xl font-bold tabular-nums text-foreground mb-1">
                                    {formatCount(emailsSent)}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">e-mails enviados</div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <TrendingUp size={12} className="text-green-500" />
                                    Com taxa de abertura de
                                    {emailsSent > 0
                                        ? `${" " + ((openCount / emailsSent) * 100).toFixed(1)}%`
                                        : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ──────────────────────────────────────────────────────── */}
            <section className="">
                <div className="max-w-7xl mx-auto border border-border px-4 md:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4">
                        {stats.map((s, i) => (
                            <div
                                key={s.label}
                                className={`relative flex flex-col items-center justify-center py-8 px-4 text-center ${i < stats.length - 1 ? 'border-r border-border' : ''}`}
                            >
                                <div className={`text-4xl font-bold tabular-nums mb-1 text-foreground`}>
                                    {s.value}
                                </div>
                                <div className="text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── RECENT POSTS ───────────────────────────────────────────────── */}
            <section className="">
                <div className="border-b border-l border-r border-border max-w-7xl mx-auto">
                    {/* Section header */}
                    <div className="relative px-4 flex items-center justify-between py-5 border-b border-border">

                        <h2 className="text-xs tracking-widest uppercase font-semibold text-muted-foreground">
                            Posts recentes
                        </h2>
                        <Link
                            href="/blog"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            Ver todos <ArrowRight size={12} />
                        </Link>
                    </div>

                    {/* Posts grid */}
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                        {posts.map((post) => (
                            <NewsletterPostCard key={post.id} post={post} />
                        ))}
                        {posts.length === 0 && (
                            <div className="col-span-3 py-20 text-center text-muted-foreground text-sm">
                                Nenhum post publicado ainda.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}