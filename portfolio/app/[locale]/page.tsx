import Link from 'next/link'
import { useTranslations } from 'next-intl';

import { FaArrowRightLong } from 'react-icons/fa6';
import { FiAtSign, FiCode, FiUser } from 'react-icons/fi';
import { GoCodeOfConduct } from 'react-icons/go';

import Navbar from '@/components/navigation/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Terminal from '@/components/sections/terminal/Terminal';
import Timeline from '@/components/sections/Timeline';
import Projects from '@/components/sections/projects/Projects';
import Stack from '@/components/sections/Stack';
import Vision from '@/components/sections/vision/VisionClient';
import Contact from '@/components/sections/contact/Contact';
import { Footer } from '@/components/Footer';

function ShowcaseHeader({ eyebrow, title, description, highlight }: { eyebrow: string; title: string; description: string; highlight: string }) {
  return (
    <div className="relative z-10 mx-auto max-w-xl text-center mt-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-pretty text-base leading-relaxed text-neutral-500 sm:text-lg">
        {description}{' '}
        <strong className="font-semibold text-neutral-900">{highlight}</strong>
      </p>
    </div>
  )
}

export default function Home() {
  const t = useTranslations();

  const showcase = {
    eyebrow: t('home.showcase.eyebrow'),
    title: t('home.showcase.title'),
    description: t('home.showcase.description'),
    highlight: t('home.showcase.highlight'),
  }

  return (
    <main className="min-h-screen default-scroll bg-background">
      <Navbar />
      <Hero />
      <About />
      <section className="flex flex-col justify-center w-full -mt-14 md:mt-0 mb-4 px-4 max-w-7xl mx-auto">
        <div className="flex flex-row justify-center w-full py-2">
          <div className="flex flex-col items-center justify-center">
            <div id="resume-line" className="h-24 w-0.5" />
            <div id="resume-icon" className="flex items-center p-3 border-0 rounded-full text-blue-700 dark:text-white">
              <FiUser />
            </div>
            <ShowcaseHeader {...showcase} />
          </div>
        </div>

        <Terminal />
        <Timeline />

        <hr className="mt-3 mb-5 dark:border-[#2f3031]" />

        <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-900 border rounded-lg dark:border-neutral-800 flex-col sm:flex-row text-center sm:text-left items-center">
          <div className="mb-2 sm:mb-0">
            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('profile.link-title')} 📋</p>
            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('profile.link-content')}</p>
          </div>
          <Link href="/resume">
            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-blue-600 dark:bg-blue-600/50 hover:bg-blue-700 dark:hover:bg-blue-700/50 rounded-lg text-white">
              {t('profile.link-button')}
              <FaArrowRightLong />
            </button>
          </Link>
        </div>
      </section>

      <section className='w-full flex items-center justify-center py-16 px-4 max-w-7xl mx-auto'>
        <div className=" flex flex-col justify-center items-center">
          <div className="flex flex-row justify-center w-full">
            <div className="flex flex-row justify-center w-full py-2">
              <div className="flex flex-col items-center justify-center">
                <div id="projects-line" className="h-24 w-0.5" />
                <div id="projects-icon" className="flex items-center p-3 border-0 rounded-full text-primary dark:text-white">
                  <FiCode />
                </div>
                <ShowcaseHeader {...showcase} />
              </div>
            </div>
          </div>

          <Projects />
        </div>
      </section>

      <Stack />

      <section className='w-full flex items-center justify-center pb-16 px-4 max-w-7xl mx-auto'>
        <div className="w-full">
          <hr className="mt-3 mb-5 dark:border-[#2f3031]" />
          <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-900 border rounded-lg dark:border-neutral-800 flex-col sm:flex-row text-center sm:text-left items-center">
            <div className="mb-2 sm:mb-0">
              <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('profile.link-title')} 📋</p>
              <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('profile.link-content')}</p>
            </div>
            <Link href="/resume">
              <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 rounded-lg text-white">
                {t('profile.link-button')}
                <FaArrowRightLong />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col justify-center w-full max-w-7xl mx-auto">
        <div className="flex flex-row justify-center w-full py-2">
          <div className="flex flex-col items-center justify-center">
            <div id="vision-line" className="h-24 w-0.5" />
            <div id="vision-icon" className="flex items-center p-3 border-0 rounded-full text-green-700 dark:text-white">
              <GoCodeOfConduct />
            </div>
            <ShowcaseHeader {...showcase} />
          </div>
        </div>

        <Vision />

        <hr className="mt-1 mb-5 -mt-[250px] dark:border-[#2f3031]" />

        <div className="flex items-center justify-between w-full py-4 px-2 sm:py-8 sm:px-6 bg-gray-200 dark:bg-neutral-900 border rounded-lg dark:border-neutral-800 flex-col sm:flex-row text-center sm:text-left items-center">
          <div className="mb-2 sm:mb-0">
            <p className="text-slate-700 dark:text-neutral-300 font-bold mb-1 text-lg sm:text-2xl">{t('vision.link-title')} 📝</p>
            <p className="text-slate-500 dark:text-neutral-400 text-sm sm:text-lg">{t('vision.link-content')}</p>
          </div>
          <Link href="/blog">
            <button className="flex px-5 min-w-44 text-sm md:text-md justify-center w-full font-semibold items-center gap-2 p-3 bg-green-600 dark:bg-green-600/50 hover:bg-green-500 dark:hover:bg-green-500/50 rounded-lg text-white">
              {t('vision.link-button')}
              <FaArrowRightLong />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center w-full">
        <div className="flex flex-row justify-center w-full py-2">
          <div className="flex flex-col items-center justify-center">
            <div id="contact-line" className="h-24 w-0.5" />
            <div id="contact-icon" className="flex items-center p-3 border-0 rounded-full text-red-800 dark:text-white">
              <FiAtSign />
            </div>
            <ShowcaseHeader {...showcase} />
          </div>
        </div>

        <Contact />
      </div>
      <Footer />
    </main >
  )
}
