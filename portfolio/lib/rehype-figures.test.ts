import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeFigures from './rehype-figures'

// Same order as lib/markdown.ts: the plugin runs after sanitize.
async function render(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize)
    .use(rehypeFigures)
    .use(rehypeStringify)
    .process(md)
  return String(file)
}

describe('rehypeFigures', () => {
  it('uses the label as caption, with code, and keeps alt as plain text', async () => {
    const html = await render('Intro.\n\n![Commits per month. Source: `git log`.](/a.png)')
    expect(html).toContain(
      '<figure><img src="/a.png" alt="Commits per month. Source: git log."><figcaption>Commits per month. Source: <code>git log</code>.</figcaption></figure>',
    )
  })

  it('keeps the Markdown title as the img tooltip, not the caption', async () => {
    const html = await render('![Caption](/a.png "Tooltip")')
    expect(html).toBe(
      '<figure><img src="/a.png" alt="Caption" title="Tooltip"><figcaption>Caption</figcaption></figure>',
    )
  })

  it('leaves an image with an empty label alone', async () => {
    expect(await render('![](/a.png)')).toBe('<p><img src="/a.png" alt=""></p>')
  })

  it('leaves an image inside running text alone', async () => {
    expect(await render('See ![A](/a.png) here.')).not.toContain('<figure>')
  })

  it('does not turn an italic paragraph below an image into a caption', async () => {
    const html = await render('![A](/a.png)\n\n*Not a caption.*')
    expect(html).toContain('<p><em>Not a caption.</em></p>')
  })

  it('handles brackets inside code and escaped brackets', async () => {
    const html = await render('![Run `a[0]` and \\[x\\]](/a.png)')
    expect(html).toContain('<figcaption>Run <code>a[0]</code> and [x]</figcaption>')
  })

  it('escapes HTML and keeps unmatched backticks literal', async () => {
    const html = await render('![<b>x</b> and a ` alone](/a.png)')
    expect(html).toContain('<figcaption>&#x3C;b>x&#x3C;/b> and a ` alone</figcaption>')
  })

  it('supports double backticks around code that contains a backtick', async () => {
    const html = await render('![Run `` a`b `` now](/a.png)')
    expect(html).toContain('<figcaption>Run <code>a`b</code> now</figcaption>')
  })

  it('handles figures nested in a blockquote', async () => {
    const html = await render('> ![A `b`](/a.png)')
    expect(html).toContain('<figure><img src="/a.png" alt="A b"><figcaption>A <code>b</code></figcaption></figure>')
  })
})
