'use client';

import { useTranslations } from 'next-intl';
import { MdRocketLaunch } from 'react-icons/md';

interface ProductivityProps {
  step: number; // 0–6, vem direto do animationStep do Vision
}

const commitTexts = [
  '1 new commit',
  '5 new commits',
  '8 new commits',
  '13 new commits',
  '18 new commits',
  '25 new commits',
  '33 new commits',
];

export default function Productivity({ step }: ProductivityProps) {
  const t = useTranslations('vision');

  // Clipa o índice para nunca ultrapassar o array
  const commitText = commitTexts[Math.min(step, commitTexts.length - 1)];

  return (
    <div className="absolute  top-[42%] left-[37%] max-sm:top-[47%] max-sm:left-[20%] z-40">
      <div className="relative flex items-center gap-3 bg-white dark:bg-neutral-800 border-2 dark:border-neutral-600/80 shadow-lg shadow-xl dark:shadow-black/50 p-3 max-sm:max-w-[340px]">
        <div className="w-10 h-10 text-white text-xl rounded-lg bg-purple-400 flex items-center justify-center flex-shrink-0">
          <MdRocketLaunch />
        </div>

        <div>
          <p className="text-sm sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {t('productivity.title')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
            {t('productivity.word-1')}
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {t('productivity.bold-1')}
            </span>
            {t('productivity.word-2')}
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {t('productivity.bold-2')}
            </span>
            {t('productivity.word-3')}
          </p>
        </div>

        {/* Badge de commits — visível só em telas maiores */}
        <div className="hidden sm:flex absolute left-[calc(100%+1px)] top-1/2 -translate-y-1/2 items-center">
          <div className="w-7 h-px border-t-2 border-dashed border-neutral-300 dark:border-neutral-600" />
          <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap transition-all duration-300">
            {commitText}
          </span>
        </div>
      </div>
    </div>
  );
}