import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getLegalDocument, getLegalHeadings } from '@/lib/legal'
import { buildPageMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/legal/LegalPage'

interface PageProps {
  params: Promise<{ locale: string }>
}

// Documento estático: revalida uma vez por dia.
export const revalidate = 86400

const DESCRIPTION: Record<string, string> = {
  pt: 'Regras de uso do site, conteúdo publicado por usuários, moderação, propriedade intelectual, apoio financeiro e limitação de responsabilidade.',
  en: 'Rules for using the site, user-generated content, moderation, intellectual property, financial support, and limitation of liability.',
  es: 'Reglas de uso del sitio, contenido publicado por usuarios, moderación, propiedad intelectual, apoyo económico y limitación de responsabilidad.',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const { title } = await getLegalDocument('terms', locale)

  return buildPageMetadata({
    locale,
    path: 'legal/terms',
    title,
    description: DESCRIPTION[locale] ?? DESCRIPTION.en,
    type: 'article',
  })
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params
  // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
  setRequestLocale(locale)

  let doc
  try {
    doc = await getLegalDocument('terms', locale)
  } catch {
    notFound()
  }

  return (
    <LegalPage
      locale={locale}
      slug="terms"
      title={doc.title}
      updatedAt={doc.updatedAt}
      headings={getLegalHeadings(doc.html)}
      html={doc.html}
    />
  )
}
