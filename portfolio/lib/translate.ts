import 'server-only'
import OpenAI from 'openai'
import { getLocale } from './locales'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não definida')
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

interface TranslationInput {
  title: string
  contentMarkdown: string
  summary?: string | null
  excerpt?: string | null
}

interface TranslationOutput {
  title: string
  contentMarkdown: string
  summary: string
  excerpt: string
}

/** Matches PostTranslation.summary (@db.VarChar(500)) and the editor's maxLength. */
const SUMMARY_MAX_LENGTH = 500

/**
 * Cuts text to at most `max` characters, at a word boundary when one is close,
 * ending with an ellipsis. Counts code points (as Postgres VARCHAR does), so a
 * surrogate pair is never split.
 */
function clampText(text: string, max: number): string {
  const chars = Array.from(text.trim())
  if (chars.length <= max) return chars.join('')
  const cut = chars.slice(0, max - 1).join('')
  const lastSpace = cut.lastIndexOf(' ')
  const head = lastSpace > max * 0.8 ? cut.slice(0, lastSpace) : cut
  return head.trimEnd() + '…'
}

export async function translatePost(
  post: TranslationInput,
  sourceLocale: string,
  targetLocale: string,
): Promise<TranslationOutput> {
  const sourceName = getLocale(sourceLocale)?.label ?? sourceLocale
  const targetName = getLocale(targetLocale)?.label ?? targetLocale

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          `You are a professional technical blog translator.`,
          `Translate from ${sourceName} to ${targetName}.`,
          `Rules:`,
          `- Preserve ALL markdown formatting, code blocks, inline code, and links exactly as-is.`,
          `- Translate text content only, never translate code or URLs.`,
          `- Keep citation markers such as [@key] or [@a; @b, p. 3] exactly as-is, and do not translate the \`\`\`references block.`,
          `- Keep technical terms in their widely-accepted form in the target language.`,
          `- Translate summary and excerpt as given; never write new ones. If a field is an empty string, return an empty string.`,
          `- summary must stay under ${SUMMARY_MAX_LENGTH} characters.`,
          `- Return ONLY a valid JSON object with keys: title, contentMarkdown, summary, excerpt.`,
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify({
          title: post.title,
          contentMarkdown: post.contentMarkdown,
          summary: post.summary ?? '',
          excerpt: post.excerpt ?? '',
        }),
      },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as TranslationOutput

  // The model's output is not bound by the column: a translated summary can
  // run longer than the source, and with an empty source the model tends to
  // write a summary of its own. Either one overflows VARCHAR(500) and the
  // insert fails, so the translation is lost.
  const summary = post.summary?.trim() && typeof parsed.summary === 'string'
    ? clampText(parsed.summary, SUMMARY_MAX_LENGTH)
    : ''
  const excerpt = post.excerpt?.trim() && typeof parsed.excerpt === 'string'
    ? parsed.excerpt
    : ''

  return { ...parsed, summary, excerpt }
}

// ── Newsletter campaign copy ─────────────────────────────────────────────────

export interface CampaignCopy {
  subject: string
  previewText: string | null
}

/**
 * Translates a campaign's subject line and inbox preview text into every
 * target locale in a single request. Throws when the model omits a locale or
 * returns an empty subject, so the caller never stores a half-translated set.
 */
export async function translateCampaignCopy(
  copy: CampaignCopy,
  sourceLocale: string,
  targetLocales: readonly string[],
): Promise<Record<string, CampaignCopy>> {
  const sourceName = getLocale(sourceLocale)?.label ?? sourceLocale
  const targets = targetLocales.map((code) => `${code} (${getLocale(code)?.label ?? code})`)

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          `You translate newsletter email copy for a personal technical blog.`,
          `Source language: ${sourceName}. Target locales: ${targets.join(', ')}.`,
          `Rules:`,
          `- "subject" is an email subject line: keep it natural and idiomatic in the target language, not word-for-word, and about the same length.`,
          `- "previewText" is the inbox preview line shown after the subject. If it is empty, return an empty string.`,
          `- Keep product names, package names, people's names, numbers and emoji exactly as written.`,
          `- Keep technical terms in their widely-accepted form in the target language.`,
          `- Return ONLY a JSON object keyed by locale code, e.g. {"en": {"subject": "...", "previewText": "..."}}.`,
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify({ subject: copy.subject, previewText: copy.previewText ?? '' }),
      },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as Record<string, { subject?: unknown; previewText?: unknown }>

  const result: Record<string, CampaignCopy> = {}
  for (const code of targetLocales) {
    const entry = parsed[code]
    const subject = typeof entry?.subject === 'string' ? entry.subject.trim() : ''
    if (!subject) throw new Error(`Campaign translation missing subject for locale "${code}"`)
    const previewText =
      copy.previewText && typeof entry?.previewText === 'string' && entry.previewText.trim()
        ? entry.previewText.trim()
        : null
    result[code] = { subject, previewText }
  }
  return result
}
