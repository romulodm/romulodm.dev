// app/[locale]/blog/page.tsx
import { prisma } from "@romulo/database"
import { unstable_cache } from "next/cache"
import { BlogListClient } from '@/components/blog/BlogListClient'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCarrousel } from "@/components/blog/BlogCarrousel"
import { SUPPORTED_LOCALES, type LocaleCode } from '@/lib/locales'

const BLOG_INDEX_REVALIDATE_SECONDS = 300

const getCachedBlogIndexData = unstable_cache(
  async (locale: string) => {
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
          translations: {
            where: { locale },
            select: {
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
      const t = post.translations[0]
      if (!t) return []
      const { translations, ...rest } = post
      return [{ ...rest, ...t }]
    })

    return {
      posts,
      allTags: tagRows.map((t) => t.tag),
    }
  },
  ["blog-index-data"],
  { revalidate: BLOG_INDEX_REVALIDATE_SECONDS },
)

export const metadata = {
  title: 'Blog - Posts recentes',
  description: 'Artigos sobre desenvolvimento web, JavaScript, TypeScript e muito mais.',
}

export default async function BlogPage({
  params,
}: {
  params: { locale: LocaleCode }
}) {
  const locale = SUPPORTED_LOCALES.find(l => l.code === params.locale)?.code ?? 'pt-BR'
  const { posts, allTags } = await getCachedBlogIndexData(locale)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mt-10 mb-5 pb-5 border-b border-border">
          <p className="text-base text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
            The opinions expressed here are personal reflections that relate to my views on technology and other matters; feel free to interact, share your ideas and send suggestions.
          </p>
        </div>

        <BlogCarrousel />

        <BlogListClient initialPosts={posts} allTags={allTags} locale={locale} />
      </main>

      <Footer />
    </div>
  )
}
