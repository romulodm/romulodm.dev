'use client';

import { MdRocketLaunch } from 'react-icons/md';
import useMobileMode from '../Mobile';
import { useTranslations } from 'next-intl';

interface ProductivityProps {
  cardScrollProgress: number;
}

export default function Productivity({ cardScrollProgress }: ProductivityProps) {
  const t = useTranslations('vision');
  const mobile = useMobileMode();

  const cardColors = ['bg-red-500', 'bg-yellow-400', 'bg-green-500'] as const;
  const cardColorIndex = Math.min(Math.floor(cardScrollProgress * 3), 2);
  const cardColor = cardColors[cardColorIndex];

  const getCommitText = (progress: number): string => {
    if (progress < 0.35) return '1 new commit';
    if (progress < 0.45) return '5 new commits';
    if (progress < 0.50) return '8 new commits';
    if (progress < 0.55) return '13 new commits';
    if (progress < 0.65) return '18 new commits';
    if (progress < 0.70) return '21 new commits';
    if (progress < 0.75) return '25 new commits';
    return '33 new commits';
  };

  const commitText = getCommitText(cardScrollProgress);

  return (
    <div
      className="absolute"
      style={{
        top: mobile ? '32%' : '37%',
        left: mobile ? '2%' : '41.3%',
      }}
    >
      <div className="flex justify-center p-4 bg-white dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg relative gap-2 items-center">
        <div className="flex text-xl bg-purple-400 text-white rounded-lg w-10 h-10 items-center justify-center">
          <MdRocketLaunch />
        </div>
        <div>
          <h5 className="text-xl font-bold dark:text-white/80">
            {t('productivity.title')}
          </h5>
          <p className="text-sm text-gray-700 dark:text-neutral-400/90">
            {t('productivity.word-1')}
            <span className="font-bold text-black dark:text-neutral-300">
              {t('productivity.bold-1')}
            </span>
            {t('productivity.word-2')}
            <span className="font-bold text-black dark:text-neutral-300">
              {t('productivity.bold-2')}
            </span>
            {t('productivity.word-3')}
          </p>
        </div>
        <div
          className={`hidden sm:absolute w-32 text-center p-1 border-dashed border-2 dark:border-neutral-500/80 dark:text-white ${cardColor} indicator`}
          style={{
            top: '50%',
            left: 'calc(100% + 2rem)',
            transform: 'translateY(-50%)',
          }}
        >
          <code className="w-full text-sm text-center z-50 shadow-lg">
            {commitText}
          </code>
        </div>
        <div className="hidden sm:relative dashed-line" />
      </div>
    </div>
  );
}
