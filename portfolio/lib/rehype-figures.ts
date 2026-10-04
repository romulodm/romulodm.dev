/**
 * Turns a standalone image into a figure, using the text between the brackets
 * as the caption:
 *
 *   ![Commits per month. Source: `git log`.](url)
 *
 * becomes
 *
 *   <figure>
 *     <img src="url" alt="Commits per month. Source: git log.">
 *     <figcaption>Commits per month. Source: <code>git log</code>.</figcaption>
 *   </figure>
 *
 * - The caption keeps inline `code`, which Markdown already strips from alt,
 *   so alt stays plain text. To get the code back the plugin reads the raw
 *   label from the source through the node position (hast keeps the mdast
 *   positions, and they point into the string handed to unified).
 * - Only `code` and backslash escapes are parsed in the caption. Everything
 *   else stays literal text, escaped on output.
 * - Only an image alone in its paragraph becomes a figure (a <figure> cannot
 *   live inside a <p>). Images with an empty label are left untouched.
 * - The Markdown title ("...") is not involved: it stays the img tooltip.
 *
 * Runs after rehype-sanitize so it does not depend on figure/figcaption being
 * in the sanitize whitelist.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast'
import type { VFile } from 'vfile'

type Node = Root | Element

const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/

function isWhitespace(node: RootContent | ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === ''
}

/** The single element child of `node`, ignoring whitespace text; else null. */
function onlyElementChild(node: Element): Element | null {
  const meaningful = node.children.filter((child) => !isWhitespace(child))
  if (meaningful.length !== 1 || meaningful[0].type !== 'element') return null
  return meaningful[0]
}

/** Length of the backtick run starting at `i`. */
function backtickRun(s: string, i: number): number {
  let n = 0
  while (s[i + n] === '`') n++
  return n
}

/**
 * Index where the code span opened by a run of `run` backticks at `i` closes
 * (a run of exactly the same length, per CommonMark), or -1 if it never does.
 */
function closingRun(s: string, i: number, run: number): number {
  let k = i + run
  while (k < s.length) {
    if (s[k] !== '`') {
      k++
      continue
    }
    const n = backtickRun(s, k)
    if (n === run) return k
    k += n
  }
  return -1
}

/**
 * The raw text between `![` and its matching `]`, in the Markdown source.
 * Skips backslash escapes and code spans, which may contain brackets.
 */
export function rawImageLabel(source: string, start: number): string | null {
  if (!source.startsWith('![', start)) return null
  let depth = 0
  let i = start + 2
  while (i < source.length) {
    const c = source[i]
    if (c === '\\') {
      i += 2
    } else if (c === '`') {
      const run = backtickRun(source, i)
      const close = closingRun(source, i, run)
      i = close === -1 ? i + run : close + run
    } else if (c === '[') {
      depth++
      i++
    } else if (c === ']') {
      if (depth === 0) return source.slice(start + 2, i)
      depth--
      i++
    } else {
      i++
    }
  }
  return null
}

/**
 * Splits a caption into text and <code> nodes. Code spans follow CommonMark:
 * a run of N backticks closes only on a run of the same length, one leading
 * and trailing space is stripped when both exist, and an unmatched run stays
 * literal. Outside code, a backslash before ASCII punctuation is an escape.
 */
export function parseCaption(caption: string): ElementContent[] {
  const out: ElementContent[] = []
  let text = ''
  let i = 0

  while (i < caption.length) {
    const c = caption[i]
    if (c === '\\' && ASCII_PUNCTUATION.test(caption[i + 1] ?? '')) {
      text += caption[i + 1]
      i += 2
      continue
    }
    if (c !== '`') {
      text += c
      i++
      continue
    }

    const run = backtickRun(caption, i)
    const close = closingRun(caption, i, run)
    if (close === -1) {
      text += '`'.repeat(run)
      i += run
      continue
    }

    let code = caption.slice(i + run, close).replace(/\n/g, ' ')
    if (code.length > 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim() !== '') {
      code = code.slice(1, -1)
    }
    if (text) out.push({ type: 'text', value: text })
    text = ''
    out.push({ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: code }] })
    i = close + run
  }

  if (text) out.push({ type: 'text', value: text })
  return out
}

function captionOf(image: Element, source: string): string | null {
  const offset = image.position?.start.offset
  const raw = offset === undefined ? null : rawImageLabel(source, offset)
  // No position (should not happen with this pipeline): fall back to alt,
  // which is the same text without the code formatting.
  const caption = raw ?? (typeof image.properties.alt === 'string' ? image.properties.alt : '')
  return caption.trim() === '' ? null : caption.trim()
}

function transform(parent: Node, source: string): void {
  const children = parent.children as (RootContent | ElementContent)[]

  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (node.type !== 'element') continue

    const image = node.tagName === 'p' ? onlyElementChild(node) : null
    const caption = image?.tagName === 'img' ? captionOf(image, source) : null
    if (!image || !caption) {
      transform(node, source)
      continue
    }

    children[i] = {
      type: 'element',
      tagName: 'figure',
      properties: {},
      children: [
        image,
        { type: 'element', tagName: 'figcaption', properties: {}, children: parseCaption(caption) },
      ],
    }
  }
}

export default function rehypeFigures() {
  return (tree: Root, file: VFile) => {
    transform(tree, String(file.value ?? ''))
  }
}
