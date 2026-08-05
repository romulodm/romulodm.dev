import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLegalDocument, getLegalHeadings } from '@/lib/legal'
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

  return {
    title,
    description: DESCRIPTION[locale] ?? DESCRIPTION.en,
    alternates: {
      canonical: `/${locale}/legal/terms`,
      languages: {
        'pt-BR': '/pt/legal/terms',
        'en-US': '/en/legal/terms',
        'es-ES': '/es/legal/terms',
      },
    },
    openGraph: {
      title,
      description: DESCRIPTION[locale] ?? DESCRIPTION.en,
      type: 'article',
    },
  }
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params

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
