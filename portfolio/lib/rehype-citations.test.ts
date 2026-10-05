import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeCitations, { parseReferences } from './rehype-citations'

// Same order as lib/markdown.ts: the plugin runs after sanitize.
async function render(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize)
    .use(rehypeCitations)
    .use(rehypeStringify)
    .process(md)
  return String(file)
}

const REFS = [
  '```references',
  '@datafolha2023 [Datafolha 2023]',
  'Datafolha (2023). *Produtos financeiros*. https://example.com/a.pdf',
  '',
  '@kearney2010 [Kearney et al. 2010]',
  'Kearney, M. S. et al. (2010).',
  'Making savers winners. NBER WP 16433.',
  '```',
].join('\n')

describe('parseReferences', () => {
  it('reads key, label and a multi-line body', () => {
    const entries = parseReferences(REFS.split('\n').slice(1, -1).join('\n'))
    expect(entries.map((e) => [e.key, e.label])).toEqual([
      ['datafolha2023', 'Datafolha 2023'],
      ['kearney2010', 'Kearney et al. 2010'],
    ])
    expect(entries[1].plain).toBe('Kearney, M. S. et al. (2010). Making savers winners. NBER WP 16433.')
  })

  it('ignores chunks without an @key [Label] head', () => {
    expect(parseReferences('just text\n\n@ok [Ok 2020] Body.')).toHaveLength(1)
  })
})

describe('rehypeCitations', () => {
  it('turns a marker into a linked author-year citation', async () => {
    const html = await render(`Dois terços [@datafolha2023].\n\n${REFS}`)
    expect(html).toContain(
      '<span class="cite">[<a class="cite__link" href="#ref-datafolha2023" id="cite-datafolha2023-1"',
    )
    expect(html).toContain('>Datafolha 2023</a>]</span>')
    expect(html).toContain('data-ref="Datafolha (2023). Produtos financeiros. https://example.com/a.pdf"')
  })

  it('handles several keys and a locator in one marker', async () => {
    const html = await render(`Ver [@kearney2010; @datafolha2023, p. 4].\n\n${REFS}`)
    expect(html).toMatch(/>Kearney et al\. 2010<\/a>; <a[^>]+>Datafolha 2023, p\. 4<\/a>]/)
  })

  it('renders the block as a list with markdown bodies and back-links', async () => {
    const html = await render(`A [@datafolha2023] e B [@datafolha2023].\n\n${REFS}`)
    expect(html).toContain('<ul class="references">')
    expect(html).toContain('<li class="references__item" id="ref-datafolha2023">')
    expect(html).toContain('<em>Produtos financeiros</em>')
    expect(html).toContain('<a href="https://example.com/a.pdf">')
    expect(html).toContain('href="#cite-datafolha2023-1"')
    expect(html).toContain('href="#cite-datafolha2023-2"')
    expect(html).not.toContain('language-references')
    // Not cited: listed, but without back-links.
    expect(html).toMatch(/id="ref-kearney2010">[^]*?NBER WP 16433\.<\/li>/)
  })

  it('flags a key that has no entry', async () => {
    const html = await render(`X [@nobody2020].\n\n${REFS}`)
    expect(html).toContain('<span class="cite cite--missing">[@nobody2020]</span>')
  })

  it('does nothing without a references block', async () => {
    const html = await render('Texto [@datafolha2023].')
    expect(html).toBe('<p>Texto [@datafolha2023].</p>')
  })

  it('leaves markers inside code alone', async () => {
    const html = await render(`Use \`[@datafolha2023]\` para citar.\n\n${REFS}`)
    expect(html).toContain('<code>[@datafolha2023]</code>')
  })

  it('sanitizes HTML inside a reference body', async () => {
    const md = 'Y [@x].\n\n```references\n@x [X 2020]\nX <script>alert(1)</script> <img src=x onerror=alert(1)>\n```'
    const html = await render(md)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('escapes quotes in the hover text', async () => {
    const md = 'Y [@x].\n\n```references\n@x [X 2020]\nX "quoted" title.\n```'
    const html = await render(md)
    expect(html).toContain('data-ref="X &#x22;quoted&#x22; title."')
  })
})
