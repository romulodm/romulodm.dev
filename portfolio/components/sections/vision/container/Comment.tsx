'use client';

import useMobileMode from '../Mobile';
import { useTranslations } from 'next-intl';

interface CommentProps {
  step: number;
}

export default function Comment({ step }: CommentProps) {
  const t = useTranslations('vision');
  const mobile = useMobileMode();

  return (
    <div
      className="absolute w-72 bg-white dark:bg-neutral-700 shadow-lg flex flex-row items-center gap-2.5 p-2.5 border-red-500 border rounded-tl-none rounded-3xl"
      style={{
        top: mobile ? '-52%' : 'calc(1rem + 100%)',
        left: mobile ? '-10%' : '50%',
      }}
    >
      <div className="bg-red-500 text-white rounded-full w-8 h-8 p-1 flex items-center justify-center">
        M
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-neutral-300">
          Manager
          {' • '}
          <span className="text-gray-500 dark:text-neutral-400/90">
            {t('comment.time')}
          </span>
        </p>
        <p className="text-sm text-gray-700 dark:text-neutral-400 mr-2">
          {t('comment.content')}
        </p>
      </div>
    </div>
  );
}
