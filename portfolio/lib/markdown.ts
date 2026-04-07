/**
 * Pipeline única de conversão — usada tanto no servidor (page.tsx)
 * quanto no cliente (MarkdownPreview). Garante output idêntico nos dois lugares.
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'
import { preprocessYoutube } from './remark-youtube'
import { prisma } from '@romulo/database'

export async function markdownToHtml(markdown: string): Promise<string> {
  // Substitui ::youtube[...](url) por HTML raw ANTES do remark parsear
  // Isso evita que o remarkGfm interprete [título](url) como link markdown
  const preprocessed = preprocessYoutube(markdown)

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype as any, { allowDangerousHtml: true }) // necessário para passar html raw
    .use(rehypeSlug)
    .use(rehypeHighlight)
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
    .use(rehypeStringify, { allowDangerousHtml: true }) // necessário para renderizar o iframe
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