'use client';

import { useTranslations } from 'next-intl';

export default function Frame() {
  const t = useTranslations('vision');

  return (
    <div className="absolute bg-white z-50 dark:bg-neutral-700 sm:top-[23%] sm:left-[25%] right-auto top-[42%] left-[65%]">
      <div className="p-2.5 border-2 dark:border-neutral-500/80 shadow-lg">
        <h3 className="text-lg font-bold">
          <span className="text-gray-500 dark:text-neutral-400">{t('frame.one')}</span>
          <br />
          <span className="text-gray-700 dark:text-white/80">{t('frame.two')}</span>
          <br />
          <span className="text-green-500">{t('frame.three')}</span>
          <br />
          <span className="text-black dark:text-neutral-900">{t('frame.four')}</span>
        </h3>
      </div>
    </div>
  );
}
