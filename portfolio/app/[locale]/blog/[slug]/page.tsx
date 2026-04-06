// app/[locale]/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from "@romulo/database"
import { markdownToHtml } from '@/lib/markdown'
import { formatDistanceToNow } from '@/lib/utils'
import { CommentsSection } from '@/components/comments/CommentsSection'
import { listPostComments } from '@/lib/comments'
import type { Metadata } from 'next'
import Navbar from '@/components/navigation/Navbar'
import { PostReactionSidebar } from '@/components/blog/PostReactionsSidebar'
import { PostStatsMobile } from '@/components/blog/PostStatsMobile'
import { RightSidebar } from '@/components/blog/RightSidebar'
import { Footer } from '@/components/Footer'
import { Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: { slug: string }
}

/** Extrai o ID do YouTube de qualquer formato de link */
function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

/** Embed responsivo do YouTube */
function YoutubeEmbed({ url }: { url: string }) {
  const videoId = extractYoutubeId(url)
  if (!videoId) return null

  return (
    <div className="mb-10">
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Vídeo do post"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

async function getPost(slug: string) {
  return prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      postTags: { select: { tag: true } },
      author: {
        select: {
          id: true,
          username: true,
          image: true,
          about: true,
          githubUrl: true,
          linkedinUrl: true,
        },
      },
    },
  })
}

async function getRelatedPosts() {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED', publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      coverImageUrl: true,
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post não encontrado' }

  return {
    title: post.title,
    description: post.summary ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.summary ?? post.excerpt ?? undefined,
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
  const defaultSort = 'score' as const

  const [htmlContent, { items: initialComments, nextCursor }, relatedPosts] =
    await Promise.all([
      markdownToHtml(post.contentMarkdown),
      listPostComments({ postId: post.id, sort: defaultSort }),
      getRelatedPosts(),
    ])

  // Build author object from DB, falling back gracefully
  const dbAuthor = post.author
  const author = dbAuthor
    ? {
      name: dbAuthor.username,
      bio: dbAuthor.about ?? 'Autor do blog.',
      avatarUrl: dbAuthor.image ?? undefined,
      githubUrl: dbAuthor.githubUrl ?? undefined,
      linkedinUrl: dbAuthor.linkedinUrl ?? undefined,
      twitterUrl: undefined as string | undefined,
      websiteUrl: undefined as string | undefined,
    }
    : {
      name: 'Autor',
      bio: '',
      avatarUrl: undefined as string | undefined,
      githubUrl: undefined as string | undefined,
      linkedinUrl: undefined as string | undefined,
      twitterUrl: undefined as string | undefined,
      websiteUrl: undefined as string | undefined,
    }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto md:px-4 py-20 flex gap-2 relative">
        {/* Sidebar esquerda: reações (apenas desktop) */}
        <aside className="hidden md:flex flex-col items-center w-16 shrink-0">
          <div className="sticky top-20">
            <PostReactionSidebar
              postId={post.id}
              initialLikes={post.likes}
              initialViews={post.views}
              initialComments={post.commentsCount}
            />
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 min-w-0 max-w-4xl md:px-4 pb-12">
          <article className="rounded-lg shadow-sm">
            {post.coverImageUrl && (
              <div className="overflow-hidden md:rounded-t-2xl">
                <img
                  src={post.coverImageUrl}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}

            <div className="p-4 md:p-6">
              {tags.length > 0 && (
                <div className="flex gap-2 mb-6 flex-wrap">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                {post.title}
              </h1>

              <div className="flex flex-col gap-2 mb-8 pb-2 border-b border-border">
                <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
                  {/* Author avatar + name */}
                  <div className="flex items-center gap-2">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        width={24}
                        height={24}
                        className="rounded-full w-6 h-6 object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        @{author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link href={`/profile/${author.name}`} className="hover:underline">
                      <span className="font-medium text-foreground">@{author.name}</span>
                    </Link>
                  </div>

                  {post.publishedAt && (
                    <>
                      <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
                      <span>Publicado {formatDistanceToNow(post.publishedAt)}</span>
                    </>
                  )}

                  {post.readingTime > 0 && (
                    <>
                      <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingTime} min de leitura
                      </span>
                    </>
                  )}
                </div>

                {/* Summary */}
                {post.summary && (
                  <p className="text-lg text-muted-foreground my-4 leading-relaxed border-l-4 border-primary pl-4 italic">
                    {post.summary}
                  </p>
                )}

                <PostStatsMobile
                  postId={post.id}
                  initialLikes={post.likes}
                  initialViews={post.views}
                  initialComments={post.commentsCount}
                />
              </div>

              {post.youtubeUrl && <YoutubeEmbed url={post.youtubeUrl} />}

              <div
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:text-foreground
                  prose-p:text-foreground/90
                  prose-a:text-primary hover:prose-a:opacity-80
                  prose-strong:text-foreground
                  prose-code:bg-muted prose-code:text-foreground
                  prose-pre:bg-muted
                  prose-blockquote:border-primary prose-blockquote:text-muted-foreground
                  prose-hr:border-border
                  prose-th:text-foreground prose-td:text-foreground/90"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {post.canonicalUrl && (
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Publicado originalmente em:{' '}
                    <a
                      href={post.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:opacity-80"
                    >
                      {post.canonicalUrl}
                    </a>
                  </p>
                </div>
              )}

              <div id="comments-section">
                <CommentsSection
                  postId={post.id}
                  initialComments={initialComments}
                  initialNextCursor={nextCursor}
                  totalCount={post.commentsCount}
                  initialSort={defaultSort}
                />
              </div>
            </div>
          </article>
        </main>

        <RightSidebar
          relatedPosts={relatedPosts}
          currentPostId={post.id}
        />
      </div>

      <Footer />
    </div>
  )
}