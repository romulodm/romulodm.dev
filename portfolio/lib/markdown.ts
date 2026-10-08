/**
 * Pipeline única de conversão — usada tanto no servidor (page.tsx)
 * quanto no cliente (PostPreview do editor). Garante output idêntico nos dois lugares.
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Schema } from 'hast-util-sanitize'
import rehypeHighlight from 'rehype-highlight'
import { common } from 'lowlight'
import rehypeCodeBlocks from './rehype-code-blocks'
import rehypeCitations from './rehype-citations'
import rehypeFigures from './rehype-figures'
import rehypeMediaImages from './rehype-media-images'
import prismaGrammar from './highlight-prisma'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
import { preprocessYoutube } from './remark-youtube'
import { prisma } from '@romulo/database'

/**
 * Schema de sanitização que estende o padrão seguro do rehype-sanitize com
 * suporte explícito a iframes do YouTube (únicos embeds permitidos).
 *
 * Ordem da pipeline:
 *   remarkRehype (allowDangerousHtml) → converte HTML raw em nós HAST
 *   rehypeSanitize                    → limpa o HAST por whitelist
 *   rehypeCitations                   → [@chave] vira citação autor-ano (lib/rehype-citations.ts)
 *   rehypeFigures                     → imagem sozinha vira <figure>; o texto de ![...] vira <figcaption> (lib/rehype-figures.ts)
 *   rehypeMediaImages                 → imagens de /media/ passam pelo otimizador do Next (lib/rehype-media-images.ts)
 *   rehypeSlug / rehypeHighlight / rehypeExternalLinks → enriquecem o HTML limpo
 *   rehypeStringify                   → serializa sem allowDangerousHtml (não há mais raw nodes)
 */
const youtubeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className', 'youtube-embed'],
    ],
    iframe: [
      // Apenas iframes do YouTube embed são permitidos
      ['src', /^https:\/\/www\.youtube\.com\/embed\//],
      'title',
      'allow',
      'allowfullscreen',
    ],
  },
}

export interface MarkdownToHtmlOptions {
  /**
   * Frame code blocks with a language header and a copy button (see
   * lib/rehype-code-blocks.ts). Off by default: the RSS feed (lib/feed.ts)
   * reuses this pipeline, and feed readers would show the button as junk.
   */
  codeBlockChrome?: boolean
  /**
   * Absolute origin for images stored in our media bucket. When set, those
   * images get `<origin>/media/...` instead of optimizer URLs. The RSS feed
   * needs this: feed readers resolve neither relative URLs nor `/_next/image`.
   */
  mediaOrigin?: string
}

export async function markdownToHtml(
  markdown: string,
  { codeBlockChrome = false, mediaOrigin }: MarkdownToHtmlOptions = {},
): Promise<string> {
  // Substitui ::youtube[...](url) por HTML raw ANTES do remark parsear
  // Isso evita que o remarkGfm interprete [título](url) como link markdown
  const preprocessed = preprocessYoutube(markdown)

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype as any, { allowDangerousHtml: true }) // converte raw HTML → HAST raw nodes
    .use(rehypeSanitize, youtubeSchema)                    // sanitiza por whitelist (remove raw nodes inseguros)
    // After sanitize (it would prefix the anchor ids but not the #links) and
    // before highlight (it consumes the ```references fence).
    .use(rehypeCitations)
    .use(rehypeFigures)
    .use(rehypeMediaImages, { origin: mediaOrigin })
    .use(rehypeSlug)
    // `languages` replaces the default set instead of extending it, so the
    // common grammars are spread back in next to the custom Prisma one.
    .use(rehypeHighlight, { languages: { ...common, prisma: prismaGrammar } })
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
    // Runs after sanitize on purpose: the frame adds a <button>, inline SVG
    // and an inline style that the sanitize schema would strip.
    .use(rehypeCodeBlocks, { enabled: codeBlockChrome })
    .use(rehypeStringify) // sem allowDangerousHtml — sanitize já eliminou os raw nodes
    .process(preprocessed)

  return result.toString()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base
  let attempt = 0
  while (true) {
    const exists = await prisma.post.findUnique({ where: { slug } })
    if (!exists || exists.id === excludeId) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

export function generateExcerpt(markdown: string, maxLength: number = 160): string {
  const text = markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/::youtube\[.*?\]\(.*?\)/g, '') // remove sintaxe youtube do excerpt
    .replace(/>\s+/g, '')
    .trim()

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength).trim() + '...'
}