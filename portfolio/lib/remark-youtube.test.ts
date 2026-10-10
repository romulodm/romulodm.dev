import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import type { Schema } from 'hast-util-sanitize'
import remarkYoutube, { preprocessYoutube } from './remark-youtube'

// Same order and whitelist as lib/markdown.ts (which imports Prisma, so the
// pipeline is rebuilt here instead of calling markdownToHtml).
const schema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'iframe'],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), ['className', 'youtube-embed']],
    iframe: [['src', /^https:\/\/www\.youtube\.com\/embed\//], 'title', 'allow', 'allowFullScreen'],
  },
}

async function render(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkYoutube)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(preprocessYoutube(md))
  return String(file)
}

describe('remarkYoutube', () => {
  it('renders the directive as an iframe that survives sanitize', async () => {
    const html = await render(
      'Intro:\n\n::youtube[Modern Live Messenger 2025](https://www.youtube.com/watch?v=ChkLj9lVLps)\n\nAfter.',
    )
    expect(html).toContain(
      '<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/ChkLj9lVLps" title="Modern Live Messenger 2025"',
    )
    expect(html).toContain('allowfullscreen')
    expect(html).toContain('<p>After.</p>')
  })

  it('does not swallow the next line when there is no blank line around the directive', async () => {
    const html = await render('Before\n::youtube[x](https://youtu.be/ChkLj9lVLps)\nAfter')
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/ChkLj9lVLps"')
    expect(html).toContain('<p>After</p>')
  })

  it('keeps quotes and accents in the title, escaped', async () => {
    const html = await render('::youtube[Um "vídeo" & mais](https://youtu.be/ChkLj9lVLps)')
    expect(html).toContain('title="Um &#x22;vídeo&#x22; &#x26; mais"')
  })

  it('leaves a non-YouTube URL as written', async () => {
    const html = await render('::youtube[x](https://example.com/v)')
    expect(html).not.toContain('<iframe')
  })

  it('still strips an iframe written as raw HTML in the post', async () => {
    const html = await render('<div class="youtube-embed"><iframe src="https://evil.example"></iframe></div>')
    expect(html).not.toContain('<iframe')
  })
})
