/**
 * Sanitizador HTML para campanhas de newsletter — SERVER ONLY.
 *
 * Não importar em componentes client-side: usa `sanitize-html` (Node.js).
 * Use apenas nas rotas de admin de campanhas.
 */
import sanitizeHtml from 'sanitize-html'

/** Tags e atributos seguros para email HTML. */
const NEWSLETTER_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    th: ['style', 'align'],
    td: ['style', 'align'],
    '*': ['style', 'class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Garante que todos os links abram em aba nova com atributos de segurança.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  },
  // Não permite javascript: em qualquer atributo.
  allowedSchemesByTag: {},
  disallowedTagsMode: 'discard',
}

/**
 * Sanitiza HTML de campanha de newsletter usando whitelist explícita.
 * Substitui a abordagem anterior baseada em regex, que era bypassável.
 */
export function sanitizeNewsletterHtml(value: string, maxLength?: number): string {
  const clean = sanitizeHtml(value, NEWSLETTER_SANITIZE_OPTIONS)
  return typeof maxLength === 'number' ? clean.slice(0, maxLength) : clean
}
