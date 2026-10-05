import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Footer } from '@/components/Footer'
import Navbar from '@/components/navigation/Navbar'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.status' })

  return buildPageMetadata({
    locale,
    path: 'status',
    title: t('title'),
    description: t('description'),
  })
}

// Navbar e Footer ficam no layout, e nao na page, porque a page e client
// component (polling de /api/status) e assim o shell nao re-renderiza a cada
// atualizacao.
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
