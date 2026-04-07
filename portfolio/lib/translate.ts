import 'server-only'
import OpenAI from 'openai'
import { getLocale } from './locales'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

export async function translatePost(
  post: TranslationInput,
  sourceLocale: string,
  targetLocale: string,
): Promise<TranslationOutput> {
  const sourceName = getLocale(sourceLocale)?.label ?? sourceLocale
  const targetName = getLocale(targetLocale)?.label ?? targetLocale

  const completion = await openai.chat.completions.create({
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
          `- Keep technical terms in their widely-accepted form in the target language.`,
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
  return parsed
}
