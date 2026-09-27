// app/[locale]/newsletter/page.tsx
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@romulo/database'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { Eye, Heart, Clock, ArrowRight } from 'lucide-react'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { SUPPORTED_LOCALES, type LocaleCode } from '@/lib/locales'
import { formatCount } from '@/lib/format-number'
import { buildPageMetadata } from '@/lib/seo'
import { NewsletterHero } from '@/components/newsletter/NewsletterHero'

interface PageProps {
    params: Promise<{ locale: LocaleCode }>
}

// Casa com o `{ revalidate: 300 }` do unstable_cache mais abaixo.
export const revalidate = 300

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

// ── Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'newsletterPage.meta' })

    return buildPageMetadata({
        locale,
        path: 'newsletter',
        title: t('title'),
        description: t('description'),
    })
}

// ── Post card

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

function NewsletterPostCard({ post, readingTime }: { post: PostData; readingTime: string }) {

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group relative flex flex-col p-6 bg-background dark:bg-neutral-950 transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.03]"
        >
            {/* Category tag */}
            {post.postTags[0] && (
                <span className="text-xs tracking-widest uppercase font-semibold text-muted-foreground mb-3">
                    {post.postTags[0].tag}
                </span>
            )}

            {/* Title */}
            <h3 className="type-h3 text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-3 flex-1">
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
                    <span className="flex items-center gap-1"><Clock size={13} />{readingTime}</span>
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
    // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
    setRequestLocale(rawLocale)
    const locale = SUPPORTED_LOCALES.find((l) => l.code === rawLocale)?.code ?? 'pt'
    const t = await getTranslations({ locale, namespace: 'newsletterPage' })
    const { posts, subscriberCount, totalViews, totalLikes, totalComments, emailsSent, openCount } =
        await getNewsletterPageData(locale)

    const stats = [
        { label: t('stats.posts'), value: formatCount(posts.length > 0 ? posts.length : 0) },
        { label: t('stats.views'), value: formatCount(totalViews) + '+' },
        { label: t('stats.likes'), value: formatCount(totalLikes) + '+' },
        { label: t('stats.comments'), value: formatCount(totalComments) + '+' },
    ]

    const benefits = [
        t('hero.benefits.newPosts'),
        t('hero.benefits.tips'),
        t('hero.benefits.projects'),
    ]

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* ── HERO ───────────────────────────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 md:px-4 pt-20 pb-10">
                <NewsletterHero
                    title={t('hero.title', { count: subscriberCount })}
                    description={t('hero.description')}
                    note={t('hero.note')}
                    benefits={benefits}
                />
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
                            {t('recent.title')}
                        </h2>
                        <Link
                            href="/blog"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            {t('recent.viewAll')} <ArrowRight size={12} />
                        </Link>
                    </div>

                    {/* Posts grid */}
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                        {posts.map((post) => (
                            <NewsletterPostCard
                                key={post.id}
                                post={post}
                                readingTime={t('recent.readingTime', { minutes: post.readingTime })}
                            />
                        ))}
                        {posts.length === 0 && (
                            <div className="col-span-3 py-20 text-center text-muted-foreground text-sm">
                                {t('recent.empty')}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}