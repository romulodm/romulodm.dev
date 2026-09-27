import type { MetadataRoute } from 'next'

import { absoluteUrl, SITE_URL } from '@/lib/seo'

/**
 * OBRIGATORIO. Sem isto o Next prerenderiza esta rota no build e o opt-in
 * abaixo nunca acontece.
 *
 * ROBOTS_ALLOW_INDEXING e SITE_URL sao definidas em runtime, no
 * `environment:` do docker-compose.prod.yml. No momento do build nenhuma das
 * duas existe, entao `allowIndexing` e false, `isLocalhost` e true, e o
 * `Disallow: /` era gravado como arquivo estatico dentro da imagem. Definir a
 * variavel no container depois nao mudava nada: o arquivo ja estava pronto.
 *
 * Nao troque por `revalidate` — o primeiro valor ainda sairia do build.
 */
export const dynamic = 'force-dynamic'

/**
 * Substitui o antigo `app/robots.txt` estatico, que era `Allow: *` sem nenhuma
 * restricao e sem referencia ao sitemap.
 *
 * `/admin` nunca deveria aparecer em busca, e as rotas com token na URL
 * (confirmacao e cancelamento de newsletter) nao podem ser rastreadas: o
 * crawler seguindo o link de unsubscribe cancelaria a inscricao sozinho.
 */
export default function robots(): MetadataRoute.Robots {
  /**
   * Indexacao e OPT-IN explicito, e o default e bloquear.
   *
   * A alternativa obvia — liberar sempre que NODE_ENV for production — falha
   * justamente no caso que motivou isto: homologacao roda com NODE_ENV=production
   * e serve o mesmo conteudo do site real. Liberada, ela seria indexada e
   * competiria com o proprio site como conteudo duplicado, com o agravante de
   * que o Google pode escolher a URL de homologacao como canonica.
   *
   * Com opt-in, qualquer ambiente novo (preview, staging, container de teste)
   * nasce bloqueado. Esquecer a variavel custa indexacao adiada; o inverso
   * custaria remover URLs do indice depois — bem mais caro.
   */
  const allowIndexing = process.env.ROBOTS_ALLOW_INDEXING === 'true'

  const isLocalhost = SITE_URL.includes('localhost')

  if (!allowIndexing || isLocalhost) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/*/admin',
          '/api/',
          '/monitoring',
          '/*/profile/',
          '/*/comments/',
          '/*/newsletter/confirm/',
          '/*/newsletter/unsubscribe/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
