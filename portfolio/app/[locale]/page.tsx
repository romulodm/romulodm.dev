import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FiCode, FiUser } from 'react-icons/fi';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata, personJsonLd, websiteJsonLd } from '@/lib/seo';

import Navbar from '@/components/navigation/Navbar';
import Hero from '@/components/sections/hero/Hero';
import About from '@/components/sections/About';
import SectionHeader from '@/components/sections/SectionHeader';
import Terminal from '@/components/sections/terminal/Terminal';
import Timeline from '@/components/sections/Timeline';
import Projects from '@/components/sections/projects/Projects';
import Stack from '@/components/sections/Stack';
import Vision from '@/components/sections/vision/Vision';
import { FAQ } from '@/components/FAQ';
import Bento from '@/components/sections/bento/Bento';
import { Footer } from '@/components/Footer';
import Presence from '@/components/sections/presence/Presence';
import ActivityCallout from '@/components/sections/presence/ActivityCallout';

// The blog preview near the bottom (components/sections/posts/BlogList.tsx)
// reads posts from the database. Without a revalidate this page would be
// generated once and keep the posts it saw on that first request until the
// next deploy, so a post published afterwards would never reach the home.
// Same value as the blog index and as HOME_BLOG_PREVIEW_REVALIDATE_SECONDS:
// if the HTML outlived the data cache it would serve stale markup anyway.
export const revalidate = 300

type HomeProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.home' })

  return buildPageMetadata({
    locale,
    path: '',
    title: t('title'),
    description: t('description'),
    type: 'profile',
  })
}

export default async function Home({ params }: HomeProps) {
  // Requisito do next-intl para render estatico. Ver o comentario extenso em
  // app/[locale]/layout.tsx — precisa ser repetido por arquivo.
  const { locale: routeLocale } = await params
  setRequestLocale(routeLocale)

  return <HomeContent />
}

function HomeContent() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen default-scroll bg-background">
      <JsonLd data={personJsonLd(locale, t('seo.home.description'))} />
      <JsonLd data={websiteJsonLd(locale, t('seo.home.description'))} />
      <Navbar />
      <Hero />
      <About />

      <section className="flex flex-col justify-center w-full -mt-14 mb-4 px-4 max-w-7xl mx-auto">
        <div className="flex flex-row justify-center w-full py-2">
          <SectionHeader
            accent="resume"
            icon={<FiUser />}
            eyebrow={t('home.profile.eyebrow')}
            title={t('home.profile.title')}
            description={t('home.profile.description')}
          />
        </div>

        <Terminal />
        <Timeline />

        <div className="my-5">
          <Presence />
        </div>
      </section>

      <section id="projects" className='scroll-mt-20 w-full flex items-center justify-center pb-16 px-4 max-w-7xl mx-auto'>
        <div className="flex flex-col justify-center items-center w-full max-w-7xl mx-auto">
          <div className="flex flex-row justify-center w-full py-2">
            <SectionHeader
              accent="projects"
              icon={<FiCode />}
              eyebrow={t('home.projects.eyebrow')}
              title={t('home.projects.title')}
              description={t('home.projects.description')}
            />
          </div>
          <Projects />
        </div>
      </section>

      <Stack />

      {/* GitHub contributions and the call to the blog, one card. The heat
          map only shows once the calendar arrives; the call-out always does. */}
      <ActivityCallout />
      <Vision />

      <section className='w-full flex items-center justify-center pb-16 px-4 max-w-7xl mx-auto'>
        <div className="flex flex-col justify-center items-center w-full">
          <FAQ />
          <div className="mt-16 w-full">
            <Bento />
          </div>
        </div>
      </section>
      <Footer />
    </main >
  )
}
