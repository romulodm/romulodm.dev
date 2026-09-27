import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

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

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children
}
