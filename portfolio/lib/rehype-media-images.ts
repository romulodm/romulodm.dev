/**
 * Rewrites `<img>` elements that point at our own media (`/media/...`, see
 * lib/media.ts) inside rendered markdown.
 *
 * Post bodies are rendered to an HTML string (lib/markdown.ts), so there is no
 * React tree in which to swap `<img>` for `next/image`. This plugin produces
 * the same result at the HAST level: `getImageProps()` is the function
 * `next/image` itself uses to build its `src`, `srcset` and `sizes`, so the
 * markdown images go through the Next.js optimizer with the same widths,
 * quality and loader as every other image on the site.
 *
 * Two modes:
 *   - optimized (default): src/srcset point at `/_next/image`. Used by the
 *     post page and the editor preview.
 *   - absolute (`origin` given): src becomes `<origin>/media/...` and is left
 *     unoptimized. Used by the RSS feed, whose readers resolve neither
 *     relative URLs nor the optimizer.
 *
 * Images hosted elsewhere are left untouched: they are not in
 * `images.remotePatterns`, so the optimizer would refuse them.
 *
 * Markdown carries no image dimensions, so `fill` is used to obtain a srcset
 * keyed on `sizes` alone; the positioning style that `fill` adds is dropped
 * because the article CSS already lays these images out.
 */
import type { Element, Root, RootContent, ElementContent } from 'hast'
import { getImageProps } from 'next/image'

import { isMediaUrl } from './media'

export interface RehypeMediaImagesOptions {
  /** Absolute origin to prefix media URLs with instead of optimizing them. */
  origin?: string
  /** `sizes` attribute for optimized images; match the article column width. */
  sizes?: string
}

/**
 * The post body column: max-w-4xl (56rem) minus the md:p-6 padding on each
 * side. Below that breakpoint the body spans the viewport.
 */
const DEFAULT_SIZES = '(min-width: 56rem) 53rem, 100vw'

function visit(node: Root | Element, onImage: (image: Element) => void): void {
  for (const child of node.children as (RootContent | ElementContent)[]) {
    if (child.type !== 'element') continue
    if (child.tagName === 'img') onImage(child)
    else visit(child, onImage)
  }
}

export default function rehypeMediaImages({ origin, sizes = DEFAULT_SIZES }: RehypeMediaImagesOptions = {}) {
  const base = origin?.replace(/\/+$/, '')

  return (tree: Root) => {
    visit(tree, (image) => {
      const src = image.properties.src
      if (typeof src !== 'string' || !isMediaUrl(src)) return

      if (base) {
        image.properties.src = `${base}${src}`
        return
      }

      const { props } = getImageProps({ src, alt: '', fill: true, sizes })
      image.properties.src = props.src
      // Kept as the string Next built: hast-util-to-html writes a string value
      // verbatim, and the element typing here only accepts a string.
      if (props.srcSet) image.properties.srcSet = props.srcSet
      if (props.sizes) image.properties.sizes = props.sizes
      image.properties.loading = 'lazy'
      image.properties.decoding = 'async'
    })
  }
}
