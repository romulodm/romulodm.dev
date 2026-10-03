"use client";

import { useEffect, useState } from "react";

/**
 * Renders a comment's markdown the same way everywhere: in the thread
 * (CommentCard) and in the editor's preview tab (CommentPreview). Keeping a
 * single component is what makes the preview trustworthy.
 */
export function CommentBody({ markdown }: { markdown: string }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { unified } = await import("unified");
      const remarkParse = (await import("remark-parse")).default;
      const remarkGfm = (await import("remark-gfm")).default;
      const remarkRehype = (await import("remark-rehype")).default;
      const rehypeHighlight = (await import("rehype-highlight")).default;
      const rehypeSanitize = (await import("rehype-sanitize")).default;
      const rehypeStringify = (await import("rehype-stringify")).default;
      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(markdown);

      if (!cancelled) setHtml(result.toString());
    }

    render();
    return () => { cancelled = true; };
  }, [markdown]);

  if (!html) {
    return (
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {markdown}
      </p>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground prose-headings:mt-3 prose-headings:mb-1 prose-headings:text-foreground prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground/80 prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline prose-code:bg-accent prose-code:text-foreground prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-accent prose-pre:rounded-lg prose-pre:p-3 prose-pre:text-xs prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
