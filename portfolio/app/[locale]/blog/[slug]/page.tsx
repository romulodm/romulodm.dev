import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { markdownToHtml } from '@/lib/markdown'
import { formatDistanceToNow } from '@/lib/utils'
import { CommentsSection } from '@/components/comments/CommentsSection'
import { listPostComments } from '@/lib/comments'
import type { Metadata } from 'next'
import Navigation from '@/components/navigation/Navigation'

interface PageProps {
  params: { slug: string }
}

async function getPost(slug: string) {
  return prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      postTags: { select: { tag: true } },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post não encontrado' }

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
  if (!post) notFound()

  const tags = post.postTags.map((t) => t.tag)

  const [htmlContent, { items: initialComments, nextCursor }] = await Promise.all([
    markdownToHtml(post.contentMarkdown),
    listPostComments({ postId: post.id }),
  ])

  const totalComments = await prisma.comment.count({ where: { postId: post.id } })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="mt-20" />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-gray-100">
          {post.coverImageUrl && (
            <div className="overflow-hidden rounded-t-lg">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-5xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex items-center gap-4 text-gray-600 text-sm mb-8 pb-8 border-b border-gray-200">
              {post.publishedAt && (
                <span>Publicado {formatDistanceToNow(post.publishedAt)}</span>
              )}
              <span>•</span>
              <span>Por Seu Nome</span>
            </div>

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {post.canonicalUrl && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Publicado originalmente em:{' '}
                  <a href={post.canonicalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                    {post.canonicalUrl}
                  </a>
                </p>
              </div>
            )}

            {/* Comments */}
            <CommentsSection
              postId={post.id}
              initialComments={initialComments}
              initialNextCursor={nextCursor}
              totalCount={totalComments}
            />
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link href="/blog" className="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition">
            ← Voltar para todos os posts
          </Link>
        </div>
      </main>

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
