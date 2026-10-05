import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

import { SUPPORTED_LOCALES, getLocale } from '@/lib/locales'

/**
 * Pecas visuais do post, compartilhadas entre a pagina publica
 * (app/[locale]/blog/[slug]/page.tsx) e o preview do editor no admin
 * (components/editor/PostPreview.tsx).
 *
 * Nada aqui usa hooks nem APIs de servidor: os textos chegam ja traduzidos por
 * props. Assim o mesmo componente roda como Server Component na pagina e como
 * Client Component no preview, e o preview nao tem como divergir do post real.
 */

export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

export function PostYoutubeEmbed({ url, title }: { url: string; title: string }) {
  const videoId = extractYoutubeId(url)
  // The capture group already limits the id to [a-zA-Z0-9_-]{11}; the anchored
  // test makes that guarantee visible at the sink (CodeQL js/xss-through-dom).
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null
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

export function PostCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden md:rounded-t-2xl">
      <img src={src} alt={alt} className="w-full h-64 md:h-96 object-cover" />
    </div>
  )
}

export function PostTagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
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
  )
}

export function PostTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="type-h1 text-foreground mb-4">{children}</h1>
}

export interface PostAuthor {
  name: string
  avatarUrl: string | null
}

export function PostByline({
  author,
  publishedLabel,
  readingTimeLabel,
}: {
  author: PostAuthor
  /** Ja traduzido ("Publicado ha 3 dias"); null esconde o item. */
  publishedLabel: string | null
  /** Ja traduzido ("10 min de leitura"); null esconde o item. */
  readingTimeLabel: string | null
}) {
  return (
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

      {publishedLabel && (
        <>
          <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
          <span>{publishedLabel}</span>
        </>
      )}

      {readingTimeLabel && (
        <>
          <span className="h-1 w-1 bg-gray-300 dark:bg-neutral-700 rounded-full" />
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readingTimeLabel}
          </span>
        </>
      )}
    </div>
  )
}

export function PostSummary({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg text-muted-foreground my-4 leading-relaxed border-l-4 border-primary pl-4 italic">
      {children}
    </p>
  )
}

/**
 * Corpo do post. Code blocks, inline code e imagens sao estilizados em
 * globals.css sob .post-body; o PostBodyEnhancer adiciona os botoes de copiar
 * e o lightbox de imagem no cliente.
 */
export function PostBody({ id, html }: { id: string; html: string }) {
  return (
    <div
      id={id}
      className="post-body prose prose-lg dark:prose-invert max-w-none
        [--tw-prose-bullets:hsl(var(--muted-foreground))]
        [--tw-prose-counters:hsl(var(--muted-foreground))]
        [--tw-prose-invert-bullets:hsl(var(--muted-foreground))]
        [--tw-prose-invert-counters:hsl(var(--muted-foreground))]
        prose-headings:text-foreground
        prose-p:text-foreground/90
        prose-li:text-foreground/90
        prose-em:text-foreground/90
        prose-a:text-primary hover:prose-a:opacity-80
        prose-strong:text-foreground
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-hr:border-border
        prose-th:text-foreground prose-td:text-foreground/90"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export interface OtherPost {
  id: string
  title: string
  slug: string
  publishedAt: Date | string | null
}

/** Lista "Outras publicacoes" da coluna direita. */
export function OtherPostsList({
  title,
  posts,
  locale,
  formatDate,
}: {
  title: string
  posts: OtherPost[]
  locale: string
  formatDate: (date: Date) => string
}) {
  if (posts.length === 0) return null
  // In the editor preview the locale comes from a <select>; resolve it against
  // the fixed list so the href never carries arbitrary text (e.g. "/evil.com").
  const safeLocale = getLocale(locale)?.code ?? SUPPORTED_LOCALES[0].code
  return (
    <div className="shrink-0 p-5">
      <h3 className="type-small font-semibold mb-3 text-foreground">{title}</h3>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/${safeLocale}/blog/${post.slug}`} className="group flex gap-3">
            <div className="min-w-0 flex flex-col justify-center">
              <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">{post.title}</span>
              {post.publishedAt && <span className="mt-0.5 text-xs text-muted-foreground">{formatDate(new Date(post.publishedAt))}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
