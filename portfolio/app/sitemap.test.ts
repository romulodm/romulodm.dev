import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { STATIC_ROUTES } from './sitemap'

/**
 * Guarda contra a unica falha real de manutencao do sitemap: criar uma pagina
 * publica nova e esquecer de anuncia-la.
 *
 * O teste varre app/[locale] no disco em vez de conferir uma lista escrita a
 * mao — uma lista de referencia teria exatamente o mesmo problema que ela
 * deveria detectar.
 *
 * A decisao de indexar continua humana: rota nova cai em INTENTIONALLY_EXCLUDED
 * ou em STATIC_ROUTES, e o teste so exige que voce escolha uma das duas.
 */

const LOCALE_DIR = join(__dirname, '[locale]')

/**
 * Rotas publicas que NAO entram no sitemap, com o motivo.
 *
 * Prefixo (`admin`) exclui a subarvore inteira; o resto e match exato.
 */
const INTENTIONALLY_EXCLUDED: Array<{ prefix: string; reason: string }> = [
  { prefix: 'admin', reason: 'area privada' },
  { prefix: 'profile', reason: 'conteudo de usuario' },
  { prefix: 'comments', reason: 'conteudo de usuario' },
  { prefix: 'newsletter/confirm', reason: 'token na URL' },
  { prefix: 'newsletter/unsubscribe', reason: 'token na URL' },
  { prefix: 'blog/[slug]', reason: 'rota dinamica, vem do banco' },
  { prefix: 'legal', reason: 'redirect para /legal/terms' },
]

/** Todos os diretorios com page.tsx sob app/[locale], como paths sem locale. */
function discoverRoutes(dir: string, prefix = ''): string[] {
  const found: string[] = []

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (!statSync(full).isDirectory()) continue

    const routePath = prefix ? `${prefix}/${entry}` : entry
    if (readdirSync(full).includes('page.tsx')) found.push(routePath)
    found.push(...discoverRoutes(full, routePath))
  }

  return found
}

const isExcluded = (route: string) =>
  INTENTIONALLY_EXCLUDED.some(
    (e) => route === e.prefix || route.startsWith(`${e.prefix}/`),
  )

describe('sitemap — cobertura das rotas', () => {
  const declared = new Set(STATIC_ROUTES.map((r) => r.path).filter(Boolean))

  it('toda pagina publica esta no sitemap ou explicitamente excluida', () => {
    const orphans = discoverRoutes(LOCALE_DIR).filter(
      (route) => !declared.has(route) && !isExcluded(route),
    )

    expect(
      orphans,
      `Rota(s) sem decisao de indexacao: ${orphans.join(', ')}.\n` +
        `Adicione a STATIC_ROUTES em app/sitemap.ts, ou a ` +
        `INTENTIONALLY_EXCLUDED neste teste com o motivo.`,
    ).toEqual([])
  })

  it('nao declara rota que nao existe mais no disco', () => {
    const onDisk = new Set(discoverRoutes(LOCALE_DIR))
    const stale = [...declared].filter((route) => !onDisk.has(route))

    expect(stale, `Rota(s) removidas do disco mas ainda no sitemap: ${stale.join(', ')}`)
      .toEqual([])
  })

  it('inclui a home', () => {
    expect(STATIC_ROUTES.some((r) => r.path === '')).toBe(true)
  })

  it('nao tem path duplicado', () => {
    const paths = STATIC_ROUTES.map((r) => r.path)
    expect(paths).toHaveLength(new Set(paths).size)
  })

  it('priority esta no intervalo valido do protocolo', () => {
    for (const route of STATIC_ROUTES) {
      expect(route.priority, `priority de "${route.path}"`).toBeGreaterThanOrEqual(0)
      expect(route.priority, `priority de "${route.path}"`).toBeLessThanOrEqual(1)
    }
  })
})

describe('exports de metadata', () => {
  /**
   * O Next falha o build se um arquivo exporta `metadata` e `generateMetadata`
   * ao mesmo tempo, mas so descobre isso ao compilar a rota — o que faz o erro
   * aparecer tarde, uma pagina por vez. Aqui e imediato e mostra todas.
   */
  it('nenhum arquivo exporta metadata e generateMetadata juntos', () => {
    const conflicts: string[] = []

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.tsx?$/.test(entry)) continue

        const src = readFileSync(full, 'utf8')
        const hasStatic = /^export const metadata\b/m.test(src)
        const hasDynamic = /^export (async )?function generateMetadata\b/m.test(src)

        if (hasStatic && hasDynamic) {
          conflicts.push(full.replace(LOCALE_DIR, 'app/[locale]'))
        }
      }
    }

    walk(LOCALE_DIR)

    expect(
      conflicts,
      `Exporta os dois (o Next aceita so um):\n  ${conflicts.join('\n  ')}`,
    ).toEqual([])
  })
})

describe('hreflang', () => {
  /**
   * hreflang apontando para locale inexistente e reportado como erro no Search
   * Console e invalida o grupo inteiro de alternates.
   */
  it('nenhuma pagina declara locale fora de routing.locales', () => {
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.endsWith('.tsx') && !entry.endsWith('.ts')) continue

        // Comentarios sao removidos antes do scan: este proprio arquivo e as
        // notas em legal/* mencionam o 'es-ES' antigo ao explicar por que ele
        // saiu, e sem isso a explicacao dispararia o teste que ela documenta.
        const src = readFileSync(full, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^:])\/\/.*$/gm, '$1')

        // Procura chaves de hreflang tipo 'es-ES': '/es/...'
        for (const match of src.matchAll(/['"]([a-z]{2})(?:-[A-Z]{2})?['"]\s*:\s*['"]\/([a-z]{2})\//g)) {
          const [, tag, pathLocale] = match
          if (!['en', 'pt'].includes(tag) || !['en', 'pt'].includes(pathLocale)) {
            offenders.push(`${full.replace(LOCALE_DIR, 'app/[locale]')}: ${match[0]}`)
          }
        }
      }
    }

    walk(LOCALE_DIR)

    expect(
      offenders,
      `hreflang para locale que nao existe:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })
})
