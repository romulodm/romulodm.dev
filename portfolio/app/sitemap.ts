import type { MetadataRoute } from 'next'

import { prisma } from '@romulo/database'

import { routing } from '@/i18n/routing'
import { absoluteUrl, localeAlternates } from '@/lib/seo'

// Renderiza a cada request em vez de ser prerenderizado no build.
//
// Antes era `revalidate = 3600`, o que fazia o Next executar a query no momento
// do `next build` — e o build da imagem Docker nao tem Postgres. Nem o runner do
// CI. O sitemap so e lido por crawler, algumas vezes por dia, entao prerender
// nao comprava quase nada e custava acoplar o build ao banco.
//
// Deliberadamente NAO usamos try/catch com fallback vazio aqui: sitemap vazio
// servido ao Google e pior que erro visivel, e o catch tambem mascararia uma
// instabilidade real do banco em producao.
//
// `revalidate` nao pode coexistir com force-dynamic — o Next rejeita a
// combinacao. O cache vive uma camada acima: nginx/conf.d/app.conf tem um
// `location = /sitemap.xml` com proxy_cache (TTL 1h), entao na pratica uma
// request por hora chega ate aqui. Sem ele, cada GET seria o findMany abaixo,
// que nao tem `take` e cresce com o numero de posts — alvo facil de abuso,
// porque a rota e publica e o rate limit por IP sozinho ainda deixa passar
// 30 varreduras por segundo.
export const dynamic = 'force-dynamic'

/**
 * Rotas publicas que existem em todo locale.
 *
 * Esta lista e manual de proposito: "esta rota deve ser indexada?" nao da para
 * derivar do sistema de arquivos. /admin e /newsletter/unsubscribe/[token] sao
 * rotas do Next iguais as outras, e as duas precisam ficar de fora por motivos
 * diferentes. Ao adicionar uma pagina publica nova, adicione aqui tambem — o
 * teste em app/sitemap.test.ts falha se voce esquecer.
 *
 * Deliberadamente fora daqui:
 *   /admin/*                          privada
 *   /profile/[username], /comments/*  conteudo de usuario, sem valor de busca
 *   /newsletter/confirm|unsubscribe   token na URL
 *   /legal                            redirect 307 para /legal/terms; sitemap
 *                                     so deve anunciar o destino final
 *   /blog/[slug]                      vem do banco, mais abaixo
 */
export const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: 'blog', priority: 0.9, changeFrequency: 'daily' },
  { path: 'resume', priority: 0.8, changeFrequency: 'monthly' },
  { path: 'newsletter', priority: 0.6, changeFrequency: 'monthly' },
  { path: 'wall', priority: 0.5, changeFrequency: 'weekly' },
  { path: 'support', priority: 0.5, changeFrequency: 'monthly' },
  { path: 'status', priority: 0.3, changeFrequency: 'daily' },
  { path: 'legal/privacy-policy', priority: 0.2, changeFrequency: 'yearly' },
  { path: 'legal/terms', priority: 0.2, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(route.path ? `/${locale}/${route.path}` : `/${locale}`),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: localeAlternates(route.path) },
    })),
  )

  // Banco fora do ar nao pode derrubar o sitemap inteiro — as rotas estaticas
  // ainda sao uteis para o crawler.
  let postEntries: MetadataRoute.Sitemap = []

  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        translations: { select: { locale: true } },
      },
      orderBy: { publishedAt: 'desc' },
    })

    postEntries = posts.flatMap((post) => {
      // So anuncia o par (locale, slug) que realmente tem traducao — apontar
      // para uma traducao inexistente gera soft 404 no Search Console.
      const locales = post.translations
        .map((t) => t.locale)
        .filter((locale): locale is (typeof routing.locales)[number] =>
          routing.locales.includes(locale as (typeof routing.locales)[number]),
        )

      return locales.map((locale) => ({
        url: absoluteUrl(`/${locale}/blog/${post.slug}`),
        lastModified: post.updatedAt ?? post.publishedAt ?? now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, absoluteUrl(`/${l}/blog/${post.slug}`)]),
          ),
        },
      }))
    })
  } catch {
    postEntries = []
  }

  return [...staticEntries, ...postEntries]
}
