import { prisma } from '@romulo/database'
import { unstable_cache } from 'next/cache'
import { BlogListClient } from '@/components/blog/BlogListClient'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCarrousel } from '@/components/blog//carousel/BlogCarousel'
import { SUPPORTED_LOCALES, type LocaleCode } from '@/lib/locales'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'

const BLOG_INDEX_REVALIDATE_SECONDS = 300

// Estatica com revalidacao. Nao ha `dynamic` aqui: a pagina e gerada na primeira
// requisicao (ver generateStaticParams em app/[locale]/layout.tsx) e o HTML fica
// cacheado, entao a navegacao nao passa pelo loading.tsx.
//
// Mesmo TTL do unstable_cache abaixo, de proposito: se o HTML durasse mais que o
// dado, a pagina serviria markup velho com cache de dados ja renovado.
export const revalidate = 300

const getCachedBlogIndexData = (locale: string) =>
  unstable_cache(
    async () => {
      const [rawPosts, tagRows] = await Promise.all([
        prisma.post.findMany({
          where: { status: 'PUBLISHED', publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 9,
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
            author: { select: { username: true, image: true } },
            translations: {
              select: {
                locale: true,
                title: true,
                summary: true,
                excerpt: true,
              },
            },
          },
        }),
        prisma.postTag.findMany({
          where: { post: { status: 'PUBLISHED', publishedAt: { not: null } } },
          distinct: ['tag'],
          select: { tag: true },
          orderBy: { tag: 'asc' },
        }),
      ])

      const posts = rawPosts.flatMap((post) => {
        const t =
          post.translations.find((t) => t.locale === locale) ??
          post.translations[0]

        if (!t) return []

        const { translations, ...rest } = post
        return [{ ...rest, title: t.title, summary: t.summary, excerpt: t.excerpt }]
      })

      return {
        posts,
        allTags: tagRows.map((t) => t.tag),
      }
    },
    [`blog-index-data-${locale}`],
    { revalidate: BLOG_INDEX_REVALIDATE_SECONDS },
  )()

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.blog' })

  return buildPageMetadata({
    locale,
    path: 'blog',
    title: t('title'),
    description: t('description'),
  })
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: LocaleCode }>
}) {
  const { locale: rawLocale } = await params
  // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
  setRequestLocale(rawLocale)
  const locale = SUPPORTED_LOCALES.find((l) => l.code === rawLocale)?.code ?? 'pt-BR'
  const { posts, allTags } = await getCachedBlogIndexData(locale)
  const t = await getTranslations({ locale: rawLocale, namespace: 'blogUi' })
  const tSeo = await getTranslations({ locale: rawLocale, namespace: 'seo.blog' })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mt-10 mb-5 pb-5 border-b border-border">
          {/*
           * The page had no h1. It is visually hidden because the layout reads
           * fine without a big "Blog" on top, but crawlers and screen readers
           * still get the page's main heading. The text is the same as <title>,
           * so the hidden copy says nothing the page doesn't already show.
           */}
          <h1 className="sr-only">{tSeo('title')}</h1>
          <p className="type-body text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
            {t('intro')}
          </p>
        </div>
        <BlogCarrousel />
        <BlogListClient initialPosts={posts} allTags={allTags} locale={locale} />
      </main>
      <Footer />
    </div>
  )
}