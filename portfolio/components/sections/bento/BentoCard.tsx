'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Casca compartilhada dos cards do bento: borda arredondada, eyebrow em
 * caixa alta, titulo e uma area livre para a ilustracao. Quando recebe
 * `href` o card inteiro vira link e ganha a seta no canto inferior direito.
 */
export default function BentoCard({
  href,
  external = false,
  eyebrow,
  title,
  align = 'top',
  children,
  className = '',
  contentClassName = '',
}: {
  href?: string;
  external?: boolean;
  eyebrow: string;
  title: string;
  /** posicao do bloco de texto em relacao a ilustracao */
  align?: 'top' | 'bottom';
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const header = (
    <div className={align === 'top' ? 'relative z-10' : 'relative z-10 mt-auto'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-balance text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-100 sm:text-xl">
        {title}
      </h3>
    </div>
  );

  const card = (
    <div
      className={`group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-colors duration-300 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700 ${className}`}
    >
      {align === 'top' && header}

      <div
        className={`relative flex flex-1 items-center justify-center ${align === 'top' ? 'mt-4' : 'mb-4'} ${contentClassName}`}
      >
        {children}
      </div>

      {align === 'bottom' && header}

      {href && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-5 right-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white/80 text-neutral-500 backdrop-blur transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-neutral-300 group-hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400 dark:group-hover:border-neutral-600 dark:group-hover:text-neutral-100"
        >
          <ArrowRight size={16} />
        </span>
      )}
    </div>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      {card}
    </Link>
  );
}
