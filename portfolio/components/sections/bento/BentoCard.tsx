'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import './Bento.css';

/**
 * Casca compartilhada dos cards do bento: borda arredondada, eyebrow em
 * caixa alta, titulo e uma area livre para a ilustracao.
 *
 * Quando recebe `href` o card inteiro vira link e ganha o estado interativo:
 * a borda e o eyebrow assumem `--primary`, a seta entra no canto inferior
 * direito e a ilustracao pode reagir via `group-hover:` (por isso a classe
 * `group` mora no wrapper, e nao no card — assim o `focus-visible` do <Link>
 * dispara exatamente o mesmo estado para quem navega por teclado).
 *
 * Sem `href` nao existe `.group` na arvore, entao nenhum `group-hover:`
 * dispara: o card do mapa continua estatico, que e o certo — ele nao leva
 * a lugar nenhum.
 */
export default function BentoCard({
  href,
  external = false,
  eyebrow,
  title,
  align = 'top',
  dots = false,
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
  /** malha de pontos ao fundo, esmaecendo antes das bordas */
  dots?: boolean;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const header = (
    <div className={align === 'top' ? 'relative z-10' : 'relative z-10 mt-auto'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary motion-reduce:transition-none dark:text-neutral-500">
        {eyebrow}
      </p>
      {/* `pr-12` reserva a coluna da seta: sem essa folga a ultima linha do
          titulo passa por baixo dela quando a seta aparece no hover. */}
      <h3
        className={`mt-2 text-balance text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-100 sm:text-xl ${href ? 'pr-12' : ''}`}
      >
        {title}
      </h3>
    </div>
  );

  const card = (
    <div
      className={`relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-sm border border-border/50 bg-neutral-200/90 p-6 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-300 ease-out group-hover:border-border/50 group-hover:bg-neutral-200 group-focus-visible:border-border/50 motion-reduce:transition-none dark:bg-neutral-900/80 dark:group-hover:bg-neutral-900 ${className}`}
    >
      {/* a malha vem antes de tudo e sem z proprio: o header e a seta ja sao
          `z-10`, entao ela fica atras sem criar contexto de empilhamento */}
      {dots && <span aria-hidden className="bento-dots pointer-events-none absolute inset-0" />}

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
          className="pointer-events-none absolute bottom-5 right-5 z-10 grid h-9 w-9 translate-y-1 place-items-center rounded-full border border-neutral-200 bg-white/80 text-neutral-500 opacity-0 backdrop-blur transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:border-primary/60 group-hover:text-primary group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:border-primary/60 group-focus-visible:text-primary group-focus-visible:opacity-100 motion-reduce:transition-none dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400"
        >
          <ArrowRight size={16} />
        </span>
      )}
    </div>
  );

  if (!href) return <div className="h-full">{card}</div>;

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group block h-full rounded-sm focus-visible:outline-none"
    >
      {card}
    </Link>
  );
}
