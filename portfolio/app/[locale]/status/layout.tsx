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

// Navbar and Footer live in the layout, not in StatusDashboard, so the client
// component's 30 s polling never re-renders the shell.
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
