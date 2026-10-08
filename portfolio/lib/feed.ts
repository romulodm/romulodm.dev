import 'server-only'

import { prisma } from '@romulo/database'

import { cdata, escapeXml, rssLanguage, toRfc822 } from '@/lib/feed-xml'
import { markdownToHtml } from '@/lib/markdown'
import { mediaUrl } from '@/lib/media'
import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from '@/lib/seo'

/** Quantos posts o feed carrega. Leitores de RSS raramente mostram mais que isso. */
const FEED_ITEM_LIMIT = 20

type FeedPost = {
  slug: string
  title: string
  description: string
  contentHtml: string
  publishedAt: Date
  coverImageUrl: string | null
  tags: string[]
  author: string
}

async function getFeedPosts(locale: string): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      // So entra no feed o post que tem traducao neste idioma — feed em /en
      // com item em portugues e pior que feed curto.
      translations: { some: { locale } },
    },
    orderBy: { publishedAt: 'desc' },
    take: FEED_ITEM_LIMIT,
    select: {
      slug: true,
      publishedAt: true,
      coverImageUrl: true,
      postTags: { select: { tag: true } },
      author: { select: { username: true } },
      translations: {
        where: { locale },
        select: { title: true, summary: true, excerpt: true, contentMarkdown: true },
      },
    },
  })

  const rendered = await Promise.all(
    posts.map(async (post) => {
      const translation = post.translations[0]
      if (!translation || !post.publishedAt) return null

      return {
        slug: post.slug,
        title: translation.title,
        description: translation.summary ?? translation.excerpt ?? '',
        contentHtml: await markdownToHtml(translation.contentMarkdown, { mediaOrigin: SITE_URL }),
        publishedAt: post.publishedAt,
        coverImageUrl: post.coverImageUrl,
        tags: post.postTags.map((t) => t.tag),
        author: post.author.username,
      } satisfies FeedPost
    }),
  )

  return rendered.filter((post): post is FeedPost => post !== null)
}

/**
 * Monta o documento RSS 2.0 do blog para um locale.
 *
 * `content:encoded` carrega o post inteiro (o HTML ja sanitizado por
 * markdownToHtml) e `description` fica com o resumo — leitores que so entendem
 * RSS basico mostram o resumo, os demais mostram o texto completo.
 */
export async function buildRssFeed(locale: string): Promise<string> {
  const posts = await getFeedPosts(locale)

  const feedUrl = absoluteUrl(`/${locale}/feed.xml`)
  const blogUrl = absoluteUrl(`/${locale}/blog`)
  const lastBuild = posts[0]?.publishedAt ?? new Date()

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/${locale}/blog/${post.slug}`)

      // coverImageUrl holds a storage key (lib/media.ts); feed readers need
      // an absolute URL.
      const enclosure = post.coverImageUrl
        ? `      <enclosure url="${escapeXml(absoluteUrl(mediaUrl(post.coverImageUrl)))}" type="image/jpeg" length="0" />\n`
        : ''

      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>\n`)
        .join('')

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(post.publishedAt)}</pubDate>
      <dc:creator>${escapeXml(post.author || AUTHOR_NAME)}</dc:creator>
      <description>${escapeXml(post.description)}</description>
      <content:encoded>${cdata(post.contentHtml)}</content:encoded>
${categories}${enclosure}    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>${rssLanguage(locale)}</language>
    <managingEditor>${escapeXml(AUTHOR_NAME)}</managingEditor>
    <webMaster>${escapeXml(AUTHOR_NAME)}</webMaster>
    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>
    <generator>Next.js</generator>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}
