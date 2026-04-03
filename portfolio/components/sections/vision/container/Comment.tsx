'use client';

import { useTranslations } from 'next-intl';
import { useSpring, animated } from '@react-spring/web';

interface CommentProps {
  /** Controla quando o balão aparece — passe true quando o step correto for atingido */
  visible: boolean;
}

export default function Comment({ visible }: CommentProps) {
  const t = useTranslations('vision');

  const spring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(0px) scale(1)'
      : 'translateY(12px) scale(0.96)',
    config: {
      tension: 160,   // quanto mais alto, mais rápido
      friction: 22,   // quanto mais alto, menos oscila
      clamp: !visible, // ao sair, não oscila — some reto
    },
  });

  return (
    <animated.div
      style={spring}
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-[8%] max-sm:left-[20%] max-sm:-translate-x-1/2 w-64 max-sm:w-64 bg-white dark:bg-neutral-800 border-2 border-red-400 dark:border-red-400 rounded-tl-none rounded-3xl shadow-xl dark:shadow-black/50 p-3 flex items-start gap-2.5 z-50 pointer-events-none"
    >
      <div className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
        M
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Manager
          {' • '}
          <span className="font-normal text-neutral-400 dark:text-neutral-500">
            {t('comment.time')}
          </span>
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
          {t('comment.content')}
        </p>
      </div>
    </animated.div>
  );
}