// lib/legal.ts

import 'server-only'

import fs from 'node:fs/promises'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeStringify from 'rehype-stringify'

export const LEGAL_DOCUMENTS = ['terms', 'privacy-policy'] as const
export type LegalDocumentSlug = (typeof LEGAL_DOCUMENTS)[number]

/** Mapeia o locale da rota para o sufixo do arquivo Markdown. */
const LOCALE_FILE_MAP: Record<string, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
}

const FALLBACK_FILE_LOCALE = 'en-US'

const LEGAL_DIR = path.join(process.cwd(), 'content', 'legal')

export interface LegalDocument {
  /** HTML sanitizado, pronto para injeção. */
  html: string
  /** Título extraído do primeiro `# ` do arquivo. */
  title: string
  /** Conteúdo da linha "Última atualização", quando presente. */
  updatedAt: string | null
  /** Locale efetivamente carregado (pode ser o fallback). */
  fileLocale: string
}

export interface LegalHeading {
  id: string
  text: string
}

function resolveFileLocale(locale: string): string {
  return LOCALE_FILE_MAP[locale] ?? FALLBACK_FILE_LOCALE
}

async function readRaw(slug: LegalDocumentSlug, fileLocale: string) {
  const filePath = path.join(LEGAL_DIR, `${slug}.${fileLocale}.md`)
  return fs.readFile(filePath, 'utf8')
}

/** Remove comentários HTML (blocos de personalização) antes de qualquer parsing. */
function stripHtmlComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, '')
}

function extractTitle(markdown: string): string {
  return markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? ''
}

// Rótulos usados nas três versões do documento (pt-BR, en-US, es-ES).
const UPDATED_AT_LABEL = 'Última atualização|Última actualización|Last updated'
const VERSION_LABEL = 'Versão|Versión|Version'

function extractUpdatedAt(markdown: string): string | null {
  const match = markdown.match(
    new RegExp(`^\\*\\*(?:${UPDATED_AT_LABEL}):\\*\\*\\s*(.+)$`, 'm'),
  )
  return match ? match[1].trim() : null
}

/** Remove o bloco de cabeçalho (título + versão) já exibido pelo layout da página. */
function stripFrontMatterBlock(markdown: string): string {
  return markdown
    .replace(/^#\s+.+$/m, '')
    .replace(new RegExp(`^\\*\\*(?:${UPDATED_AT_LABEL}):\\*\\*.*$`, 'm'), '')
    .replace(new RegExp(`^\\*\\*(?:${VERSION_LABEL}):\\*\\*.*$`, 'm'), '')
    .trimStart()
}

async function toHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    // Sem allowDangerousHtml: qualquer HTML bruto no Markdown é descartado.
    .use(remarkRehype as any)
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypeExternalLinks, {
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    })
    .use(rehypeStringify)
    .process(markdown)

  return file.toString()
}

/**
 * Carrega um documento legal para o locale informado.
 * Se o arquivo do locale não existir, cai para en-US.
 */
export async function getLegalDocument(
  slug: LegalDocumentSlug,
  locale: string,
): Promise<LegalDocument> {
  let fileLocale = resolveFileLocale(locale)
  let raw: string

  try {
    raw = await readRaw(slug, fileLocale)
  } catch {
    fileLocale = FALLBACK_FILE_LOCALE
    raw = await readRaw(slug, fileLocale)
  }

  const clean = stripHtmlComments(raw)

  return {
    html: await toHtml(stripFrontMatterBlock(clean)),
    title: extractTitle(clean),
    updatedAt: extractUpdatedAt(clean),
    fileLocale,
  }
}

/** Extrai os títulos de nível 2 para montar o índice lateral. */
export function getLegalHeadings(html: string): LegalHeading[] {
  const headings: LegalHeading[] = []
  const pattern = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g

  for (const match of html.matchAll(pattern)) {
    headings.push({
      id: match[1],
      text: match[2].replace(/<[^>]+>/g, '').trim(),
    })
  }

  return headings
}
