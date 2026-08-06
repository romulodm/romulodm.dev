import Link from 'next/link'
import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { FaArrowRightLong } from 'react-icons/fa6';
import { FiCode, FiHelpCircle, FiUser } from 'react-icons/fi';

import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata, personJsonLd, websiteJsonLd } from '@/lib/seo';

import Navbar from '@/components/navigation/Navbar';
import Hero from '@/components/sections/Hero';
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

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen default-scroll bg-background">
      {/* Dados estruturados: e o que faz o Google exibir nome, cargo e links
          sociais no painel lateral em vez de so o titulo da pagina. */}
      <JsonLd data={personJsonLd(locale)} />
      <JsonLd data={websiteJsonLd(locale)} />
      <Navbar />
      <Hero />
      <About />

      <section className="flex flex-col justify-center w-full -mt-14 md:mt-0 mb-4 px-4 max-w-7xl mx-auto">
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

        <hr className="mt-3 mb-5 dark:border-[#2f3031]" />

        <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-900 border rounded-lg dark:border-neutral-800 flex-col sm:flex-row text-center sm:text-left">
          <div className="mb-2 sm:mb-0">
            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('home.profile.link-title')} 📋</p>
            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('home.profile.link-content')}</p>
          </div>
          <Link href="/resume">
            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-blue-600 dark:bg-blue-600/50 hover:bg-blue-700 dark:hover:bg-blue-700/50 rounded-lg text-white">
              {t('home.profile.link-button')}
              <FaArrowRightLong />
            </button>
          </Link>
        </div>
      </section>

      <section className='w-full flex items-center justify-center py-16 px-4 max-w-7xl mx-auto'>
        <div className="flex flex-col justify-center items-center w-full">
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

      <section className='w-full flex items-center justify-center pb-16 px-4 max-w-7xl mx-auto'>
        <div className="w-full">
          <hr className="mt-3 mb-5 dark:border-[#2f3031]" />

          <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-900 border rounded-lg dark:border-neutral-800 flex-col sm:flex-row text-center sm:text-left">
            <div className="mb-2 sm:mb-0">
              <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('home.vision.link-title')} 📝</p>
              <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('home.vision.link-content')}</p>
            </div>
            <Link href="/blog">
              <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 rounded-lg text-white">
                {t('home.vision.link-button')}
                <FaArrowRightLong />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Vision />

      <section className='w-full flex items-center justify-center py-16 px-4 max-w-7xl mx-auto'>
        <div className="flex flex-col justify-center items-center w-full">
          <div className="flex flex-row justify-center w-full py-2">
            <SectionHeader
              accent="primary"
              icon={<FiHelpCircle />}
              eyebrow={t('home.faq.eyebrow')}
              title={t('home.faq.title')}
              description={t('home.faq.description')}
            />
          </div>

          <FAQ />
          <Bento />
        </div>
      </section>

      <Footer />
    </main >
  )
}
