/**
 * Pipeline única de conversão — usada tanto no servidor (page.tsx)
 * quanto no cliente (MarkdownPreview). Garante output idêntico nos dois lugares.
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Schema } from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
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

export async function markdownToHtml(markdown: string): Promise<string> {
  // Substitui ::youtube[...](url) por HTML raw ANTES do remark parsear
  // Isso evita que o remarkGfm interprete [título](url) como link markdown
  const preprocessed = preprocessYoutube(markdown)

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype as any, { allowDangerousHtml: true }) // converte raw HTML → HAST raw nodes
    .use(rehypeSanitize, youtubeSchema)                    // sanitiza por whitelist (remove raw nodes inseguros)
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
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