'use client';

import { IoSparkles } from 'react-icons/io5';
import { FaPeopleCarry } from 'react-icons/fa';
import useMobileMode from '../Mobile';
import { useTranslations } from 'next-intl';

export default function Icons() {
  const t = useTranslations('vision');
  const mobile = useMobileMode();

  return (
    <div className="z-50">
      {/* Background/shadow card */}
      <div
        className="absolute bg-white p-1 dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg w-64"
        style={{
          top: mobile ? '12%' : '3%',
          right: mobile ? '20%' : 'auto',
          left: mobile ? 'auto' : '49%',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center" />
          <div>
            <p className="text-base">Productivity</p>
            <p className="text-sm text-gray-500 whitespace-nowrap">
              Shaping tomorrow&apos;s guidelines..
            </p>
          </div>
        </div>
      </div>

      {/* First icon card */}
      <div
        className="absolute bg-white p-1 dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg w-64"
        style={{
          top: mobile ? '13.5%' : '5%',
          right: mobile ? '18%' : 'auto',
          left: mobile ? 'auto' : '50%',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
            <IoSparkles />
          </div>
          <div>
            <p className="text-base dark:text-white/90">{t('icons.first-title')}</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400/90 whitespace-nowrap">
              {t('icons.first-content')}
            </p>
          </div>
        </div>
      </div>

      {/* Second icon card */}
      <div
        className="absolute bg-white p-1 dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg w-64"
        style={{
          top: mobile ? '21.5%' : '15%',
          right: mobile ? '18%' : 'auto',
          left: mobile ? 'auto' : '50%',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
            <FaPeopleCarry />
          </div>
          <div>
            <p className="text-base dark:text-white/90">{t('icons.second-title')}</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400/90 whitespace-nowrap">
              {t('icons.second-content')}
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute bg-white p-1 dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg w-64"
        style={{
          top: mobile ? '29.5%' : '25%',
          right: mobile ? '18%' : 'auto',
          left: mobile ? 'auto' : '50%',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl bg-gray-200 dark:bg-neutral-500 dark:text-white rounded-lg w-10 h-10 flex items-center justify-center">
            <FaPeopleCarry />
          </div>
          <div>
            <p className="text-base dark:text-white/90">{t('icons.second-title')}</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400/90 whitespace-nowrap">
              {t('icons.second-content')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
