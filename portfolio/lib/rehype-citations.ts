/**
 * Author-year citations for posts, in the style of an academic paper
 * ("... no Brasil [Datafolha 2023]").
 *
 * Markdown syntax:
 *
 *   Texto com uma citação [@datafolha2023] e duas [@kearney2010; @cole2022, p. 5].
 *
 *   ## Referências
 *
 *   ```references
 *   @datafolha2023 [Datafolha 2023]
 *   Datafolha (2023). *Produtos financeiros: poupança e aposentadoria*. https://...
 *
 *   @kearney2010 [Kearney et al. 2010]
 *   Kearney, M. S., Tufano, P., ... (2010). Making savers winners. ...
 *   ```
 *
 * Each entry of the `references` block starts with `@key [Label]`; the lines
 * that follow (until a blank line) are the reference itself, in inline
 * markdown. The label is what the citation shows, so the author decides how
 * "et al." and same-year suffixes ("2023a") read.
 *
 * Output:
 *
 *   <span class="cite">[<a class="cite__link" href="#ref-datafolha2023"
 *     id="cite-datafolha2023-1" data-ref="Datafolha (2023). ...">Datafolha 2023</a>]</span>
 *
 *   <ul class="references">
 *     <li class="references__item" id="ref-datafolha2023">Datafolha (2023). ...
 *       <span class="references__backrefs"><a href="#cite-datafolha2023-1">↩</a></span></li>
 *   </ul>
 *
 * The plugin is opt-in per post: without a `references` block nothing changes,
 * so `[@x]` typed for any other reason is left alone. A marker whose key has no
 * entry is kept as text and flagged with `cite--missing`, which the editor
 * preview paints red.
 *
 * Runs AFTER rehype-sanitize: the sanitizer prefixes every `id` with
 * "user-content-" but not the `#` links pointing at them, which would break the
 * anchors. Everything this plugin emits is built as hast nodes (text is never
 * parsed as HTML), and the reference bodies go through their own
 * remark → rehype → sanitize pass before being inserted, so the trust boundary
 * is the same as the rest of the post. Runs BEFORE rehype-highlight, so the
 * `references` fence is consumed before highlight sees an unknown language.
 */
import type { Element, ElementContent, Root, RootContent, Text } from 'hast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'

export const REFERENCES_LANG = 'references'

/** `@key [Label] optional start of the body` */
const ENTRY_HEAD = /^@([\w:.-]+)\s*\[([^\]]+)\]\s*(.*)$/
/** A whole `[@a; @b, p. 3]` marker inside a text node. */
const MARKER = /\[(@[\w:.-]+(?:,[^\];]*)?(?:;\s*@[\w:.-]+(?:,[^\];]*)?)*)\]/g
/** One item of a marker: `@key` with an optional locator after a comma. */
const ITEM = /^@([\w:.-]+)(?:,\s*(.+))?$/

export interface ReferenceEntry {
  key: string
  label: string
  body: ElementContent[]
  plain: string
}

const referenceProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)

/** Renders the body of one reference (inline markdown) into safe hast. */
function renderBody(markdown: string): ElementContent[] {
  const tree = referenceProcessor.runSync(referenceProcessor.parse(markdown)) as Root
  const blocks = tree.children.filter(
    (n): n is Element => n.type === 'element',
  )
  // A reference is one paragraph; unwrap it so the <li> holds inline content.
  if (blocks.length === 1 && blocks[0].tagName === 'p') return blocks[0].children
  return blocks
}

function toText(node: RootContent | ElementContent): string {
  if (node.type === 'text') return node.value
  if (node.type === 'element') return node.children.map(toText).join('')
  return ''
}

/** Parses the raw text of a `references` fence. Exported for tests. */
export function parseReferences(raw: string): ReferenceEntry[] {
  const entries: ReferenceEntry[] = []
  const chunks = raw.replace(/\r\n/g, '\n').split(/\n\s*\n/)
  for (const chunk of chunks) {
    const lines = chunk.trim().split('\n')
    const head = lines[0]?.trim().match(ENTRY_HEAD)
    if (!head) continue
    const [, key, label, rest] = head
    const markdown = [rest, ...lines.slice(1)].map((l) => l.trim()).filter(Boolean).join(' ')
    const body = renderBody(markdown)
    entries.push({
      key,
      label: label.trim(),
      body,
      plain: body.map(toText).join('').replace(/\s+/g, ' ').trim(),
    })
  }
  return entries
}

function codeLanguage(pre: Element): { code: Element; lang: string } | null {
  const code = pre.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code',
  )
  const classes = code?.properties?.className
  if (!code || !Array.isArray(classes)) return null
  for (const cls of classes) {
    if (typeof cls === 'string' && cls.startsWith('language-')) {
      return { code, lang: cls.slice('language-'.length).toLowerCase() }
    }
  }
  return null
}

interface Block {
  parent: Root | Element
  pre: Element
  entries: ReferenceEntry[]
}

function collectBlocks(node: Root | Element, out: Block[]) {
  node.children.forEach((child) => {
    if (child.type !== 'element') return
    if (child.tagName === 'pre') {
      const info = codeLanguage(child)
      if (info?.lang === REFERENCES_LANG) {
        out.push({ parent: node, pre: child, entries: parseReferences(toText(info.code)) })
      }
      return
    }
    collectBlocks(child, out)
  })
}

const SKIP = new Set(['code', 'pre', 'a', 'script', 'style'])

function citeNodes(
  text: string,
  refs: Map<string, ReferenceEntry>,
  uses: Map<string, number>,
): ElementContent[] | null {
  const out: ElementContent[] = []
  let last = 0
  let changed = false
  MARKER.lastIndex = 0
  for (let m = MARKER.exec(text); m; m = MARKER.exec(text)) {
    const items = m[1].split(';').map((s) => s.trim().match(ITEM))
    if (items.some((i) => !i)) continue
    changed = true
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) })
    last = m.index + m[0].length

    const missing = items.some((i) => !refs.has(i![1]))
    if (missing) {
      out.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['cite', 'cite--missing'] },
        children: [{ type: 'text', value: m[0] }],
      })
      continue
    }

    const children: ElementContent[] = [{ type: 'text', value: '[' }]
    items.forEach((item, i) => {
      const [, key, locator] = item!
      const ref = refs.get(key)!
      const n = (uses.get(key) ?? 0) + 1
      uses.set(key, n)
      if (i > 0) children.push({ type: 'text', value: '; ' })
      children.push({
        type: 'element',
        tagName: 'a',
        properties: {
          className: ['cite__link'],
          href: `#ref-${key}`,
          id: `cite-${key}-${n}`,
          dataRef: ref.plain,
        },
        children: [{ type: 'text', value: locator ? `${ref.label}, ${locator.trim()}` : ref.label }],
      })
    })
    children.push({ type: 'text', value: ']' })
    out.push({ type: 'element', tagName: 'span', properties: { className: ['cite'] }, children })
  }
  if (!changed) return null
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

function replaceCitations(
  node: Root | Element,
  refs: Map<string, ReferenceEntry>,
  uses: Map<string, number>,
) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === 'text') {
      const replaced = citeNodes((child as Text).value, refs, uses)
      if (replaced) {
        node.children.splice(i, 1, ...(replaced as typeof node.children))
        i += replaced.length - 1
      }
    } else if (child.type === 'element' && !SKIP.has(child.tagName)) {
      replaceCitations(child, refs, uses)
    }
  }
}

function referenceList(entries: ReferenceEntry[], uses: Map<string, number>): Element {
  return {
    type: 'element',
    tagName: 'ul',
    properties: { className: ['references'] },
    children: entries.map((entry): Element => {
      const count = uses.get(entry.key) ?? 0
      const backrefs: ElementContent[] = []
      for (let n = 1; n <= count; n++) {
        backrefs.push({
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#cite-${entry.key}-${n}`,
            className: ['references__backref'],
            ariaLabel: `↩ ${n}`,
          },
          children: [{ type: 'text', value: count > 1 ? `↩${n}` : '↩' }],
        })
      }
      const children: ElementContent[] = [...entry.body]
      if (backrefs.length) {
        children.push({ type: 'text', value: ' ' })
        children.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['references__backrefs'] },
          children: backrefs,
        })
      }
      return {
        type: 'element',
        tagName: 'li',
        properties: { className: ['references__item'], id: `ref-${entry.key}` },
        children,
      }
    }),
  }
}

export default function rehypeCitations() {
  return (tree: Root) => {
    const blocks: Block[] = []
    collectBlocks(tree, blocks)
    if (blocks.length === 0) return

    const refs = new Map<string, ReferenceEntry>()
    for (const block of blocks) {
      for (const entry of block.entries) {
        // First definition wins, like markdown link definitions.
        if (!refs.has(entry.key)) refs.set(entry.key, entry)
      }
    }

    // Citations are numbered in reading order, so the blocks are swapped for
    // their lists only after the whole tree has been walked.
    const uses = new Map<string, number>()
    replaceCitations(tree, refs, uses)

    for (const block of blocks) {
      const seen = new Set<string>()
      const own = block.entries.filter((e) => {
        if (seen.has(e.key) || refs.get(e.key) !== e) return false
        seen.add(e.key)
        return true
      })
      // Looked up now, not when collected: replacing citations splices
      // text nodes and may have shifted the positions in this parent.
      const index = block.parent.children.indexOf(block.pre)
      block.parent.children[index] = referenceList(own, uses)
    }
  }
}
