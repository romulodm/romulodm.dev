/**
 * Wraps every fenced code block of a post in a small frame: a header with the
 * language name and a copy button, and the original <pre> below it.
 *
 *   <div class="code-block" data-lang="typescript" style="--lang-accent:#3178c6">
 *     <div class="code-block__header">
 *       <span class="code-block__lang"><span class="code-block__dot"></span>TypeScript</span>
 *       <button class="code-block__copy" data-code-copy>…two icons…</button>
 *     </div>
 *     <pre><code class="hljs language-ts">…</code></pre>
 *   </div>
 *
 * The button is inert HTML. The post page is rendered on the server and cached,
 * so the click handler lives in components/blog/PostBodyEnhancer.tsx, which
 * delegates clicks from the article container. The same component sets the
 * localized aria-label, because this pipeline has no locale.
 *
 * Must run AFTER rehype-sanitize (the frame uses a button, an inline style and
 * inline SVG, all of which the sanitize schema strips) and AFTER
 * rehype-highlight (it reads the `language-*` class that highlight keeps).
 */
import type { Element, ElementContent, Root } from 'hast'

interface LanguageInfo {
  label: string
  /** Brand color of the language, used for the dot and the header tint. */
  accent: string
}

const LANGUAGES: Record<string, LanguageInfo> = {
  typescript: { label: 'TypeScript', accent: '#3178c6' },
  tsx: { label: 'TSX', accent: '#3178c6' },
  javascript: { label: 'JavaScript', accent: '#f1c40f' },
  jsx: { label: 'JSX', accent: '#61dafb' },
  json: { label: 'JSON', accent: '#8b8b8b' },
  python: { label: 'Python', accent: '#3776ab' },
  go: { label: 'Go', accent: '#00add8' },
  rust: { label: 'Rust', accent: '#dea584' },
  java: { label: 'Java', accent: '#e76f00' },
  kotlin: { label: 'Kotlin', accent: '#a97bff' },
  csharp: { label: 'C#', accent: '#9b4f96' },
  cpp: { label: 'C++', accent: '#00599c' },
  c: { label: 'C', accent: '#555555' },
  php: { label: 'PHP', accent: '#777bb4' },
  ruby: { label: 'Ruby', accent: '#cc342d' },
  swift: { label: 'Swift', accent: '#f05138' },
  bash: { label: 'Bash', accent: '#4eaa25' },
  shell: { label: 'Shell', accent: '#4eaa25' },
  sql: { label: 'SQL', accent: '#e38c00' },
  prisma: { label: 'Prisma', accent: '#5a67d8' },
  graphql: { label: 'GraphQL', accent: '#e10098' },
  yaml: { label: 'YAML', accent: '#cb171e' },
  xml: { label: 'HTML', accent: '#e34c26' },
  css: { label: 'CSS', accent: '#663399' },
  scss: { label: 'SCSS', accent: '#c6538c' },
  markdown: { label: 'Markdown', accent: '#8b8b8b' },
  diff: { label: 'Diff', accent: '#8b8b8b' },
  dockerfile: { label: 'Dockerfile', accent: '#2496ed' },
  ini: { label: 'INI', accent: '#8b8b8b' },
  plaintext: { label: 'Text', accent: '#8b8b8b' },
}

/** Fence names people actually type, mapped to a key of LANGUAGES. */
const ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  golang: 'go',
  rs: 'rust',
  kt: 'kotlin',
  cs: 'csharp',
  'c#': 'csharp',
  'c++': 'cpp',
  rb: 'ruby',
  sh: 'bash',
  zsh: 'bash',
  console: 'shell',
  yml: 'yaml',
  html: 'xml',
  svg: 'xml',
  md: 'markdown',
  docker: 'dockerfile',
  toml: 'ini',
  text: 'plaintext',
  txt: 'plaintext',
}

const NEUTRAL_ACCENT = '#8b8b8b'

function languageOf(code: Element): string | null {
  const classes = code.properties?.className
  if (!Array.isArray(classes)) return null
  for (const cls of classes) {
    if (typeof cls === 'string' && cls.startsWith('language-')) {
      return cls.slice('language-'.length).toLowerCase()
    }
  }
  return null
}

function svg(children: Element[], className: string): Element {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: [className],
      viewBox: '0 0 24 24',
      width: '16',
      height: '16',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
    },
    children,
  }
}

function shape(tagName: string, properties: Element['properties']): Element {
  return { type: 'element', tagName, properties, children: [] }
}

// Lucide "copy" and "check" icons. Both are always in the markup; CSS shows one
// or the other based on the button's data-copied attribute.
const copyIcon = () =>
  svg(
    [
      shape('rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }),
      shape('path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }),
    ],
    'code-block__icon-copy',
  )

const checkIcon = () =>
  svg([shape('path', { d: 'M20 6 9 17l-5-5' })], 'code-block__icon-check')

function frame(pre: Element, lang: string | null): Element {
  const key = lang ? (ALIASES[lang] ?? lang) : null
  const info = key ? LANGUAGES[key] : undefined
  // A fence with an unknown name still shows that name, so the reader knows
  // what the snippet is even without highlighting.
  const label = info?.label ?? lang
  const accent = info?.accent ?? NEUTRAL_ACCENT

  const headerChildren: ElementContent[] = []
  if (label) {
    headerChildren.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['code-block__lang'] },
      children: [
        { type: 'element', tagName: 'span', properties: { className: ['code-block__dot'] }, children: [] },
        { type: 'text', value: label },
      ],
    })
  }
  headerChildren.push({
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['code-block__copy'],
      dataCodeCopy: '',
      // English fallback; PostBodyEnhancer replaces it with the page locale.
      ariaLabel: 'Copy code',
    },
    children: [copyIcon(), checkIcon()],
  })

  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['code-block'],
      dataLang: key ?? 'none',
      style: `--lang-accent:${accent}`,
    },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block__header'] },
        children: headerChildren,
      },
      pre,
    ],
  }
}

function walk(node: Root | Element) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type !== 'element') continue

    const code = child.tagName === 'pre'
      ? child.children.find(
          (c): c is Element => c.type === 'element' && c.tagName === 'code',
        )
      : undefined

    if (code) {
      children[i] = frame(child, languageOf(code))
    } else {
      walk(child)
    }
  }
}

export interface RehypeCodeBlocksOptions {
  /** When false the plugin is a no-op (lets the pipeline stay one chain). */
  enabled?: boolean
}

export default function rehypeCodeBlocks({ enabled = true }: RehypeCodeBlocksOptions = {}) {
  return (tree: Root) => {
    if (enabled) walk(tree)
  }
}
