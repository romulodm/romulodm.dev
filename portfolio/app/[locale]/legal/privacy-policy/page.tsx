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
  pt: 'Quais dados são coletados, por que, com que base legal, por quanto tempo, com quem são compartilhados e como exercer seus direitos sob a LGPD.',
  en: 'What data is collected, why, on what legal basis, for how long, who it is shared with, and how to exercise your rights under the LGPD.',
  es: 'Qué datos se recogen, por qué, con qué base legal, durante cuánto tiempo, con quién se comparten y cómo ejercer tus derechos conforme a la LGPD.',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const { title } = await getLegalDocument('privacy-policy', locale)

  return {
    title,
    description: DESCRIPTION[locale] ?? DESCRIPTION.en,
    alternates: {
      canonical: `/${locale}/legal/privacy-policy`,
      languages: {
        'pt-BR': '/pt/legal/privacy-policy',
        'en-US': '/en/legal/privacy-policy',
        'es-ES': '/es/legal/privacy-policy',
      },
    },
    openGraph: {
      title,
      description: DESCRIPTION[locale] ?? DESCRIPTION.en,
      type: 'article',
    },
  }
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params

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
