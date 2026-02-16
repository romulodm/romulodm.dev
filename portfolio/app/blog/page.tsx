import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/ui/PostCard'
import { NewsletterForm } from '@/components/ui/NewsletterForm'

export const metadata = {
  title: 'Blog - Posts recentes',
  description: 'Artigos sobre desenvolvimento web, JavaScript, TypeScript e muito mais.',
}

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      tags: true,
      publishedAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Blog
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tutoriais, dicas e experiências sobre desenvolvimento web fullstack
          </p>
        </div>

        {/* Newsletter CTA */}
        <div className="mb-16">
          <NewsletterForm />
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Nenhum post publicado ainda.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Seu Nome. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
