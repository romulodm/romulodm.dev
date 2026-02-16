'use client'

import { useEffect, useState } from 'react'

interface MarkdownPreviewProps {
  title: string
  contentMarkdown: string
  coverImageUrl?: string
  tags: string[]
}

export function MarkdownPreview({
  title,
  contentMarkdown,
  coverImageUrl,
  tags,
}: MarkdownPreviewProps) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    // Convert markdown to HTML on client side
    const convertMarkdown = async () => {
      const { unified } = await import('unified')
      const remarkParse = (await import('remark-parse')).default
      const remarkGfm = (await import('remark-gfm')).default
      const remarkRehype = (await import('remark-rehype')).default
      const rehypeHighlight = (await import('rehype-highlight')).default
      const rehypeStringify = (await import('rehype-stringify')).default

      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .process(contentMarkdown)

      setHtml(result.toString())
    }

    convertMarkdown()
  }, [contentMarkdown])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {coverImageUrl && (
        <div className="overflow-hidden rounded-t-lg">
          <img
            src={coverImageUrl}
            alt="Cover"
            className="w-full h-80 object-cover"
          />
        </div>
      )}

      <article className="p-8 md:p-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          {title || 'Untitled'}
        </h1>

        {tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  )
}
