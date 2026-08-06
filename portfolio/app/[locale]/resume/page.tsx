import { getLocale } from 'next-intl/server';
import { getResumeData } from '@/data/resume';
import { ResumePageClient } from '@/components/resume/ResumePageClient';
import Navbar from '@/components/navigation/Navbar';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.resume' })

  return buildPageMetadata({
    locale,
    path: 'resume',
    title: t('title'),
    description: t('description'),
    type: 'profile',
  })
}

export default async function Resume() {
    const locale = await getLocale();
    const data = getResumeData(locale);

    return (
        <main className="min-h-screen default-scroll bg-background">
            <div className="no-pdf">
                <Navbar />
            </div>

            <div className="py-6 no-pdf" />

            <ResumePageClient data={data} locale={locale} />

            <div className="no-pdf">
                <Footer />
            </div>

        </main>
    )

}
