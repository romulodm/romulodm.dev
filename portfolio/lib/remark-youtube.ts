/**
 * YouTube embeds in post Markdown: ::youtube[title](url)
 *
 * Two steps, both wired in lib/markdown.ts:
 *
 * 1. preprocessYoutube runs on the Markdown string, before unified. It swaps
 *    the directive for a marker <div> on its own block, so remark-gfm never
 *    reads [title](url) as a link.
 * 2. remarkYoutube runs on the mdast. It finds those marker blocks and turns
 *    them into a real <div class="youtube-embed"><iframe></div> through
 *    data.hName / hProperties / hChildren, which remark-rehype turns into hast
 *    elements.
 *
 * Why not just emit the <iframe> HTML in step 1: remark-rehype turns raw HTML
 * into `raw` nodes, and rehype-sanitize drops every `raw` node, so the embed
 * vanished from the page without any error. Built as elements, the embed
 * still goes through the sanitize whitelist (youtubeSchema in markdown.ts).
 */
import type { ElementContent } from 'hast'
import type { Paragraph, Parent, Root } from 'mdast'

function extractYoutubeId(url: string): string | null {
    const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
}

/**
 * The title is URI-encoded so the marker attribute never holds a quote or an
 * angle bracket, and decoding it back needs no HTML entity parsing.
 */
const MARKER = /^<div class="youtube-embed" data-video-id="([a-zA-Z0-9_-]{11})" data-title="([^"<>]*)"><\/div>$/

/**
 * Run on the Markdown string BEFORE handing it to unified.
 * Blank lines around the marker keep it a block of its own: an HTML block
 * only ends at a blank line, so without the trailing one the next paragraph
 * would be swallowed into it.
 */
export function preprocessYoutube(markdown: string): string {
    return markdown.replace(
        /::youtube\[([^\]]*)\]\(([^)]+)\)/g,
        (original, title: string, url: string) => {
            const videoId = extractYoutubeId(url)
            if (!videoId) return original // invalid URL: leave the text as written

            const encodedTitle = encodeURIComponent(title || 'YouTube video')
            return `\n\n<div class="youtube-embed" data-video-id="${videoId}" data-title="${encodedTitle}"></div>\n\n`
        }
    )
}

function decodeTitle(encoded: string): string {
    try {
        return decodeURIComponent(encoded)
    } catch {
        return 'YouTube video'
    }
}

function embedNode(videoId: string, title: string): Paragraph {
    const iframe: ElementContent = {
        type: 'element',
        tagName: 'iframe',
        properties: {
            src: `https://www.youtube.com/embed/${videoId}`,
            title,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowFullScreen: true,
        },
        children: [],
    }
    // A paragraph only because mdast needs a known node type; hName renames
    // it to a div and hChildren replaces its (empty) content.
    return {
        type: 'paragraph',
        children: [],
        data: {
            hName: 'div',
            hProperties: { className: ['youtube-embed'] },
            hChildren: [iframe],
        },
    }
}

function walk(parent: Parent): void {
    parent.children.forEach((child, index) => {
        if (child.type === 'html') {
            const match = child.value.trim().match(MARKER)
            if (match) {
                const node = embedNode(match[1], decodeTitle(match[2]))
                node.position = child.position
                parent.children[index] = node
            }
        } else if ('children' in child) {
            walk(child)
        }
    })
}

/** Remark plugin: marker blocks from preprocessYoutube become embed elements. */
export default function remarkYoutube() {
    return (tree: Root) => {
        walk(tree)
    }
}
