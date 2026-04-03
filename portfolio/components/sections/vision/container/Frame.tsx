'use client';

import { useTranslations } from 'next-intl';

export default function Frame() {
  const t = useTranslations('vision');

  return (
    <div className="absolute top-[22%] left-[25%] max-sm:top-auto max-sm:bottom-[60%] max-sm:left-[5%] bg-white dark:bg-neutral-800 border-2 border-black/15 dark:border-white/10 shadow-xl dark:shadow-black/50 rounded-sm p-4 z-40 leading-relaxed">
      <p className="font-bold text-base text-neutral-400 dark:text-neutral-500">{t('frame.one')}</p>
      <p className="font-bold text-base text-neutral-800 dark:text-neutral-100">{t('frame.two')}</p>
      <p className="font-bold text-base text-green-500 dark:text-green-400">{t('frame.three')}</p>
      <p className="font-bold text-base text-neutral-800/30 dark:text-neutral-100/25">{t('frame.four')}</p>
    </div>
  );
}