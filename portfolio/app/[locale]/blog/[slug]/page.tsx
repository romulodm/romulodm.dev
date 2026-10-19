import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@romulo/database'
import { unstable_cache } from 'next/cache'
import { markdownToHtml } from '@/lib/markdown'
import { mediaUrl } from '@/lib/media'
import { formatDistanceToNow } from '@/lib/utils'
import { CommentsSection } from '@/components/comments/CommentsSection'
import { getPublicPostComments } from '@/lib/comments-query'
import type { Metadata } from 'next'
import Navbar from '@/components/navigation/Navbar'
import { PostReactionSidebar } from '@/components/blog/PostReactionsSidebar'
import { PostStatsMobile } from '@/components/blog/PostStatsMobile'
import { RightSidebar } from '@/components/blog/RightSidebar'
import { Footer } from '@/components/Footer'
import { PostBodyEnhancer } from '@/components/blog/PostBodyEnhancer'
import {
  PostBody,
  PostByline,
  PostCover,
  PostSummary,
  PostTagList,
  PostTitle,
  PostYoutubeEmbed,
} from '@/components/blog/PostArticle'
import { JsonLd } from '@/components/seo/JsonLd'
import { blogPostCacheTag } from '@/lib/cache-tags'
import { postLikeStateUrl } from '@/lib/post-like-state'
import { preload } from 'react-dom'
import { absoluteUrl, blogPostingJsonLd, breadcrumbJsonLd, buildPageMetadata } from '@/lib/seo'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

const BLOG_POST_REVALIDATE_SECONDS = 300

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
    { revalidate: BLOG_POST_REVALIDATE_SECONDS, tags: [blogPostCacheTag(slug)] },
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
    image: post.coverImageUrl ? mediaUrl(post.coverImageUrl) : null,
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

  // The page is cached and shared by every visitor, so whether *this* visitor
  // liked the post, and the live like count, cannot be part of the HTML. The
  // reaction bar fetches them from the client (usePostInteractions). Preloading
  // that URL here starts the request while the HTML is still downloading,
  // instead of after hydration, so the answer is usually already there when the
  // hook asks for it and the heart renders filled without a visible delay.
  // `crossOrigin: 'anonymous'` matches the mode of a default same-origin
  // fetch(); with any other value the browser would not reuse the preload.
  preload(postLikeStateUrl(post.id), { as: 'fetch', crossOrigin: 'anonymous' })

  const tags = post.postTags.map((t) => t.tag)
  const defaultSort = 'score' as const

  const author = {
    name: post.author.username,
    avatarUrl: post.author.image ?? null,
  }

  // Comments render with the page, but only as anyone sees them.
  //
  // `listPostComments` calls getServerSession to mark which comments the visitor
  // voted on, i.e. it reads a cookie. A page that reads a cookie while rendering
  // cannot be static: Next aborts with DYNAMIC_SERVER_USAGE and answers 500,
  // which was the cause of an earlier error on /[locale]/blog/[slug].
  //
  // So the page renders the public list (getPublicPostComments: same query, no
  // session, no vote marked) and CommentsSection swaps in the visitor's copy
  // right after hydration. Before this, the HTML carried an empty list and a
  // spinner until the client fetch answered.
  const [htmlContent, relatedRaw, publicComments] = await Promise.all([
    markdownToHtml(translation.contentMarkdown, { codeBlockChrome: true }),
    getCachedRelatedPosts(locale, post.id),
    getPublicPostComments(post.id),
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
          image: post.coverImageUrl ? mediaUrl(post.coverImageUrl) : null,
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
              <PostCover coverKey={post.coverImageUrl} alt={translation.title} />
            )}

            <div className="p-4 md:p-6">
              <PostTagList tags={tags} />

              <PostTitle>{translation.title}</PostTitle>

              <div className="flex flex-col gap-2 mb-8 pb-2 border-b border-border">
                <PostByline
                  author={author}
                  locale={locale}
                  publishedLabel={
                    post.publishedAt
                      ? t('published', { time: formatDistanceToNow(post.publishedAt, locale) })
                      : null
                  }
                  readingTimeLabel={
                    post.readingTime > 0 ? t('readingTime', { minutes: post.readingTime }) : null
                  }
                />

                {translation.summary && <PostSummary>{translation.summary}</PostSummary>}

                <PostStatsMobile
                  postId={post.id}
                  initialLikes={post.likes}
                  initialViews={post.views}
                  initialComments={post.commentsCount}
                />
              </div>

              {post.youtubeUrl && <PostYoutubeEmbed url={post.youtubeUrl} title={t('videoTitle')} />}

              <PostBody id="post-body" html={htmlContent} />
              <PostBodyEnhancer targetId="post-body" />

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
                  initialComments={publicComments.items}
                  initialNextCursor={publicComments.nextCursor}
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