import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeMediaImages, { type RehypeMediaImagesOptions } from './rehype-media-images'

// Same order as lib/markdown.ts: the plugin runs after sanitize.
async function render(md: string, options?: RehypeMediaImagesOptions): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize)
    .use(rehypeMediaImages, options)
    .use(rehypeStringify)
    .process(md)
  return String(file)
}

describe('rehypeMediaImages', () => {
  it('sends /media/ images through the Next.js optimizer', async () => {
    const html = await render('![x](/media/posts/abc/x.png)')
    expect(html).toContain('src="/_next/image?url=%2Fmedia%2Fposts%2Fabc%2Fx.png')
    expect(html).toMatch(/srcset="[^"]+ 640w/)
    expect(html).toContain('sizes="')
    expect(html).toContain('loading="lazy"')
  })

  it('makes /media/ images absolute when an origin is given', async () => {
    const html = await render('![x](/media/posts/abc/x.png)', { origin: 'https://romulodm.dev/' })
    expect(html).toContain('src="https://romulodm.dev/media/posts/abc/x.png"')
    expect(html).not.toContain('/_next/image')
  })

  it('leaves images hosted elsewhere untouched', async () => {
    const html = await render('![x](https://example.com/x.png)')
    expect(html).toContain('src="https://example.com/x.png"')
    expect(html).not.toContain('srcset')
  })
})
