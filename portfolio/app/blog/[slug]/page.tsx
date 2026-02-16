import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { markdownToHtml } from '@/lib/markdown'
import { formatDistanceToNow } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: {
      slug,
      status: 'PUBLISHED',
    },
  })

  return post
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug)

  if (!post) {
    return {
      title: 'Post não encontrado',
    }
  }

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  const htmlContent = await markdownToHtml(post.contentMarkdown)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900">
            ← Voltar para o blog
          </Link>
          <Link href="/" className="text-xl font-bold text-gray-900">
            Portfolio
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-gray-100">
          {/* Cover Image */}
          {post.coverImageUrl && (
            <div className="overflow-hidden rounded-t-lg">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-gray-600 text-sm mb-8 pb-8 border-b border-gray-200">
              {post.publishedAt && (
                <span>Publicado {formatDistanceToNow(post.publishedAt)}</span>
              )}
              <span>•</span>
              <span>Por Seu Nome</span>
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Canonical URL */}
            {post.canonicalUrl && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Publicado originalmente em:{' '}
                  <a
                    href={post.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {post.canonicalUrl}
                  </a>
                </p>
              </div>
            )}
          </div>
        </article>

        {/* Back to Blog */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition"
          >
            ← Voltar para todos os posts
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Seu Nome. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
