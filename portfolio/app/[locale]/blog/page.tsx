// app/[locale]/blog/page.tsx
import { prisma } from "@romulo/database"
import { BlogListClient } from '@/components/blog/BlogListClient'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { BlogCarrousel } from "@/components/blog/BlogCarrousel"

export const metadata = {
  title: 'Blog - Posts recentes',
  description: 'Artigos sobre desenvolvimento web, JavaScript, TypeScript e muito mais.',
}

export default async function BlogPage() {
  // SSR: carrega posts iniciais (newest) e todas as tags disponíveis em paralelo
  const [posts, tagRows] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED', publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 9,
      select: {
        id: true,
        title: true,
        summary: true,
        readingTime: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        likes: true,
        views: true,
        commentsCount: true,
        postTags: { select: { tag: true } },
      },
    }),
    // Tags distintas de posts publicados
    prisma.postTag.findMany({
      where: { post: { status: 'PUBLISHED' } },
      distinct: ['tag'],
      select: { tag: true },
      orderBy: { tag: 'asc' },
    }),
  ])

  const allTags = tagRows.map((t) => t.tag)

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

        <BlogListClient initialPosts={posts} allTags={allTags} />
      </main>


      <Footer />
    </div>
  )
}