/**
 * Primitivas de serializacao XML do feed.
 *
 * Separado de `lib/feed.ts` de proposito: aquele arquivo importa Prisma e
 * `server-only`, o que impede testar estas funcoes isoladamente. Aqui nao ha
 * dependencia nenhuma, entao da para cobrir com teste unitario — e e justamente
 * este codigo que, se errar, corrompe o feed inteiro.
 */

/**
 * Escapa os cinco caracteres reservados de XML.
 *
 * Diferente de HTML, XML nao tem "tag permitida": um `&` ou `<` solto num
 * titulo de post torna o documento malformado e o leitor de RSS descarta o feed
 * inteiro em vez de pular o item.
 *
 * A ordem importa — `&` precisa vir primeiro, senao os `&` das proprias
 * entidades geradas depois seriam escapados de novo (`&lt;` viraria `&amp;lt;`).
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Envolve HTML num bloco CDATA.
 *
 * `]]>` e a unica sequencia capaz de encerrar um CDATA, entao ela e partida em
 * dois blocos adjacentes. Sem isso, um post que contenha `]]>` no meio do texto
 * fecharia a secao e o resto do HTML vazaria como marcacao do feed.
 */
export function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

/** Data no formato RFC 822, exigido pela spec do RSS 2.0 em pubDate/lastBuildDate. */
export function toRfc822(date: Date): string {
  return date.toUTCString()
}

/** Tag de idioma do canal, no formato que os leitores esperam. */
export function rssLanguage(locale: string): string {
  return locale === 'pt' ? 'pt-BR' : 'en-US'
}
