'use client';

import { MdSecurity } from 'react-icons/md';
import { SiTeespring } from 'react-icons/si';
import { FaCode } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import Comment from './Comment';

interface ProductivityProps {
  step: number; // 0–6, vem direto do animationStep do Vision
}

export default function Development({ step }: ProductivityProps) {
  const t = useTranslations('vision');

  return (
    <div className="absolute bottom-[16%] sm:bottom-[30%] left-1/2 -translate-x-1/2 flex flex-row max-sm:flex-col max-sm:w-[86%] gap-2 z-40 overflow-visible">
      <button className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-2 border-black/15 dark:border-white/10 shadow-md dark:shadow-black/40 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap">
        <MdSecurity className="shrink-0" />
        {t('development.left')}
      </button>

      <button className="flex items-center justify-center gap-1.5 bg-green-600 dark:bg-green-500 text-white border-2 border-transparent shadow-lg shadow-green-600/25 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap sm:min-w-[220px]">
        <FaCode className="shrink-0" />
        {t('development.center')}
      </button>

      <button className="flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-2 border-black/15 dark:border-white/10 shadow-md dark:shadow-black/40 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap">
        <SiTeespring className="shrink-0" />
        {t('development.right')}
      </button>

      <Comment visible={step >= 3} />

    </div>
  );
}