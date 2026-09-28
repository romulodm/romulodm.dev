import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import { prisma } from '@romulo/database'
import { unstable_cache } from 'next/cache'
import { markdownToHtml } from '@/lib/markdown'
import { formatDistanceToNow } from '@/lib/utils'
import { CommentsSection } from '@/components/comments/CommentsSection'
import type { Metadata } from 'next'
import Navbar from '@/components/navigation/Navbar'
import { PostReactionSidebar } from '@/components/blog/PostReactionsSidebar'
import { PostStatsMobile } from '@/components/blog/PostStatsMobile'
import { RightSidebar } from '@/components/blog/RightSidebar'
import { Footer } from '@/components/Footer'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { ViewTracker } from './ViewTracker'
import { JsonLd } from '@/components/seo/JsonLd'
import { absoluteUrl, blogPostingJsonLd, breadcrumbJsonLd, buildPageMetadata } from '@/lib/seo'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

const BLOG_POST_REVALIDATE_SECONDS = 300

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

function YoutubeEmbed({ url, title }: { url: string; title: string }) {
  const videoId = extractYoutubeId(url)
  if (!videoId) return null
  return (
    <div className="mb-10">
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

// ✅ Factory por slug — cada post tem sua própria entrada de cache
const getCachedPostBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      return prisma.post.findFirst({
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
          translations: {
            select: {
              locale: true,
              title: true,
              summary: true,
              excerpt: true,
              contentMarkdown: true,
              canonicalUrl: true,
            },
          },
        },
      })
    },
    [`blog-post-by-slug-${slug}`], // ✅ chave única por slug
    { revalidate: BLOG_POST_REVALIDATE_SECONDS },
  )()

// ✅ Factory por locale + postId
const getCachedRelatedPosts = (locale: string, currentPostId: string) =>
  unstable_cache(
    async () => {
      return prisma.post.findMany({
        where: {
          id: { not: currentPostId },
          status: 'PUBLISHED',
          publishedAt: { not: null },
          translations: { some: { locale } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          slug: true,
          publishedAt: true,
          coverImageUrl: true,
          translations: {
            where: { locale },
            select: { title: true },
          },
        },
      })
    },
    [`blog-related-posts-${locale}-${currentPostId}`], // ✅ chave única
    { revalidate: BLOG_POST_REVALIDATE_SECONDS },
  )()

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        translations: { select: { locale: true } },
      },
    })
    return posts.flatMap((p) =>
      p.translations.map((t) => ({ locale: t.locale, slug: p.slug })),
    )
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params // ✅ await params
  const t = await getTranslations({ locale, namespace: 'blogPost' })

  const post = await getCachedPostBySlug(slug)
  if (!post) return { title: t('notFound'), robots: { index: false, follow: false } }

  const translation =
    post.translations.find((t) => t.locale === locale) ?? post.translations[0]
  if (!translation) {
    return { title: t('notFound'), robots: { index: false, follow: false } }
  }

  const metadata = buildPageMetadata({
    locale,
    path: `blog/${post.slug}`,
    title: translation.title,
    description: translation.summary ?? translation.excerpt ?? undefined,
    image: post.coverImageUrl,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: post.postTags.map((t) => t.tag),
  })

  // hreflang so para os locales que o post realmente tem — o helper generico
  // assume as duas linguas, o que geraria link para traducao inexistente.
  metadata.alternates = {
    ...metadata.alternates,
    languages: Object.fromEntries(
      post.translations.map((t) => [
        t.locale,
        absoluteUrl(`/${t.locale}/blog/${post.slug}`),
      ]),
    ),
  }

  // Post republicado de outro lugar aponta para a fonte original, senao o
  // Google trata como conteudo duplicado.
  if (translation.canonicalUrl) {
    metadata.alternates.canonical = translation.canonicalUrl
  }

  return metadata
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params // ✅ await params

  // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blogPost' })

  const post = await getCachedPostBySlug(slug)
  if (!post) notFound()

  const translation =
    post.translations.find((t) => t.locale === locale) ?? post.translations[0]
  if (!translation) notFound()

  const tags = post.postTags.map((t) => t.tag)
  const defaultSort = 'score' as const

  const author = {
    name: post.author.username,
    avatarUrl: post.author.image ?? null,
  }

  // Os comentarios NAO sao buscados aqui de proposito.
  //
  // `listPostComments` chama getServerSession para marcar em quais comentarios o
  // visitante votou — ou seja, le cookie. Uma pagina que le cookie no render nao
  // pode ser estatica: o Next aborta com DYNAMIC_SERVER_USAGE e devolve 500. Era
  // a causa do erro em /[locale]/blog/[slug].
  //
  // O conteudo do post e igual para todo mundo e deve ser cacheado; o estado de
  // voto e por usuario e nao pode. Entao a parte por usuario sai do render e vai
  // para o cliente: o CommentsSection ja busca sozinho quando recebe a lista
  // vazia (ver o useEffect com o comentario "pagina estatica" la dentro).
  const [htmlContent, relatedRaw] = await Promise.all([
    markdownToHtml(translation.contentMarkdown),
    getCachedRelatedPosts(locale, post.id),
  ])

  const relatedPosts = relatedRaw.map((p) => ({
    id: p.id,
    title: p.translations[0]?.title ?? '',
    slug: p.slug,
    publishedAt: p.publishedAt,
    coverImageUrl: p.coverImageUrl,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* BlogPosting + breadcrumb: e o que rende data, autor e trilha de
          navegacao no resultado de busca em vez de so titulo e snippet. */}
      <JsonLd
        data={blogPostingJsonLd({
          locale,
          slug: post.slug,
          title: translation.title,
          description: translation.summary ?? translation.excerpt,
          image: post.coverImageUrl,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          authorName: post.author.username,
          tags,
          wordCount: translation.contentMarkdown.trim().split(/\s+/).length,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: `/${locale}` },
          { name: 'Blog', path: `/${locale}/blog` },
          { name: translation.title, path: `/${locale}/blog/${post.slug}` },
        ])}
      />
      <Navbar />
      <ViewTracker postId={post.id} />

      <div className="max-w-7xl mx-auto md:px-4 py-20 flex gap-2 relative">
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

        <main className="flex-1 min-w-0 max-w-4xl md:px-4 pb-12">
          <article className="rounded-lg shadow-sm">
            {post.coverImageUrl && (
              <div className="overflow-hidden md:rounded-t-2xl">
                <img
                  src={post.coverImageUrl}
                  alt={translation.title}
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

              <h1 className="type-h1 text-foreground mb-4">
                {translation.title}
              </h1>

              <div className="flex flex-col gap-2 mb-8 pb-2 border-b border-border">
                <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
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
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Link href={`/profile/${author.name}`} className="hover:underline">
                      <span className="font-medium text-foreground">@{author.name}</span>
                    </Link>
                  </div>

                  {post.publishedAt && (
                    <>
                      <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
                      <span>{t('published', { time: formatDistanceToNow(post.publishedAt, locale) })}</span>
                    </>
                  )}

                  {post.readingTime > 0 && (
                    <>
                      <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t('readingTime', { minutes: post.readingTime })}
                      </span>
                    </>
                  )}
                </div>

                {translation.summary && (
                  <p className="text-lg text-muted-foreground my-4 leading-relaxed border-l-4 border-primary pl-4 italic">
                    {translation.summary}
                  </p>
                )}

                <PostStatsMobile
                  postId={post.id}
                  initialLikes={post.likes}
                  initialViews={post.views}
                  initialComments={post.commentsCount}
                />
              </div>

              {post.youtubeUrl && <YoutubeEmbed url={post.youtubeUrl} title={t('videoTitle')} />}

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

              {translation.canonicalUrl && (
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t('originallyPublished')}{' '}
                    <a
                      href={translation.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:opacity-80"
                    >
                      {translation.canonicalUrl}
                    </a>
                  </p>
                </div>
              )}

              <div id="comments-section">
                <CommentsSection
                  postId={post.id}
                  initialComments={[]}
                  initialNextCursor={null}
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
          locale={locale}
        />
      </div>

      <Footer />
    </div >
  )
}