import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getLegalDocument, getLegalHeadings } from '@/lib/legal'
import { buildPageMetadata } from '@/lib/seo'
import { LegalPage } from '@/components/legal/LegalPage'

interface PageProps {
  params: Promise<{ locale: string }>
}

// Documento estático: revalida uma vez por dia.
export const revalidate = 86400

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const { title } = await getLegalDocument('privacy-policy', locale)
  const t = await getTranslations({ locale, namespace: 'legal.page.descriptions' })

  return buildPageMetadata({
    locale,
    path: 'legal/privacy-policy',
    title,
    description: t('privacyPolicy'),
    type: 'article',
  })
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params
  // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
  setRequestLocale(locale)

  let doc
  try {
    doc = await getLegalDocument('privacy-policy', locale)
  } catch {
    notFound()
  }

  return (
    <LegalPage
      locale={locale}
      slug="privacy-policy"
      title={doc.title}
      updatedAt={doc.updatedAt}
      headings={getLegalHeadings(doc.html)}
      html={doc.html}
    />
  )
}
