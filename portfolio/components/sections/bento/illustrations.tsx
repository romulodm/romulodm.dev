'use client';

import type { CSSProperties } from 'react';
import './Bento.css';


/**
 * Card do Mural: dois recadinhos inclinados no formato "depoimento" — a
 * moldura, a arte colorida do recado, as linhas do texto e o avatar de quem
 * escreveu. Nao ha texto de verdade aqui: e ilustracao, e texto falso em
 * miniatura vira ruido ilegivel.
 *
 * As molduras usam `stroke-*` do Tailwind (e nao `currentColor`) para poder
 * acompanhar o hover do card sem arrastar junto o resto do desenho: so a
 * borda vira `--primary`, as cores do recado ficam de pe.
 */
export function GuestbookArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" fill="none" className={className} aria-hidden>
      <defs>
        {/* arte do recado da esquerda — manchas frias */}
        <linearGradient id="bento-gb-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        {/* arte do recado da direita — lilas em diagonal */}
        <linearGradient id="bento-gb-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>

        <clipPath id="bento-gb-clip-a">
          <rect x="24" y="28" width="106" height="74" rx="7" />
        </clipPath>
        <clipPath id="bento-gb-clip-b">
          <rect x="134" y="34" width="102" height="72" rx="7" />
        </clipPath>
        <clipPath id="bento-gb-face-a">
          <circle cx="42" cy="128" r="11" />
        </clipPath>
        <clipPath id="bento-gb-face-b">
          <circle cx="150" cy="130" r="11" />
        </clipPath>
      </defs>

      {/* ---------------------------- recado da esquerda ----------------------------
          O <g> de fora e o que se move no hover: o de dentro guarda a
          inclinacao, e transform de CSS substituiria o atributo `transform`
          em vez de somar a ele. O deslocamento e para cima e para FORA, cada
          recado para o seu lado. */}
      <g className="bento-rise" style={{ '--rise-to': 'translate(-6px, -9px)' } as CSSProperties}>
        <g transform="rotate(-8 82 88)">
          <rect
            x="14"
            y="18"
            width="126"
            height="134"
            rx="12"
            className="bento-late-color fill-neutral-100 stroke-neutral-300/80 group-hover:stroke-primary/70 dark:fill-neutral-950 dark:stroke-neutral-700/70"
            strokeWidth="1.6"
          />

          <g clipPath="url(#bento-gb-clip-a)">
            <rect x="24" y="28" width="106" height="74" fill="url(#bento-gb-a)" />
            <circle cx="46" cy="46" r="30" fill="#f472b6" opacity=".75" />
            <circle cx="118" cy="34" r="26" fill="#f97316" opacity=".55" />
            <circle cx="112" cy="96" r="24" fill="#22d3ee" opacity=".5" />
          </g>

          {/* linhas do recado, por cima da arte */}
          <rect x="34" y="44" width="52" height="6" rx="3" fill="#fff" opacity=".85" />
          <rect x="34" y="56" width="76" height="6" rx="3" fill="#fff" opacity=".7" />
          <rect x="34" y="68" width="40" height="6" rx="3" fill="#fff" opacity=".55" />

          {/* avatar de quem escreveu */}
          <circle
            cx="42"
            cy="128"
            r="11"
            className="fill-neutral-200 dark:fill-neutral-800"
          />
          <g clipPath="url(#bento-gb-face-a)">
            <rect x="31" y="117" width="22" height="22" fill="#7dd3fc" opacity=".55" />
            <ellipse cx="42" cy="140" rx="10" ry="7.5" fill="#334155" />
            <circle cx="42" cy="126" r="5.4" fill="#f2c6a0" />
            <path d="M36.6 125.6a5.4 5.4 0 0 1 10.8 0v-1.4a5.4 5.4 0 0 0-10.8 0z" fill="#3f2d23" />
          </g>
          <rect
            x="58"
            y="124"
            width="46"
            height="5"
            rx="2.5"
            className="fill-neutral-300 dark:fill-neutral-700"
          />
          <rect
            x="58"
            y="134"
            width="30"
            height="5"
            rx="2.5"
            className="fill-neutral-200 dark:fill-neutral-800"
          />
        </g>

      </g>

      {/* ---------------------------- recado da direita ---------------------------- */}
      <g
        className="bento-rise"
        style={{ '--rise-to': 'translate(4px, -7px)', '--rise-delay': '70ms' } as CSSProperties}
      >
        <g transform="rotate(9 186 92)">
          <rect
            x="124"
            y="24"
            width="122"
            height="132"
            rx="12"
            className="bento-late-color fill-neutral-100 stroke-neutral-300/80 group-hover:stroke-primary/70 dark:fill-neutral-950 dark:stroke-neutral-700/70"
            strokeWidth="1.6"
          />

          <g clipPath="url(#bento-gb-clip-b)">
            <rect x="134" y="34" width="102" height="72" fill="url(#bento-gb-b)" />
            <circle cx="228" cy="44" r="26" fill="#c084fc" opacity=".7" />
            <circle cx="140" cy="102" r="24" fill="#e879f9" opacity=".5" />
          </g>

          <rect x="144" y="50" width="70" height="6" rx="3" fill="#fff" opacity=".85" />
          <rect x="144" y="62" width="50" height="6" rx="3" fill="#fff" opacity=".7" />
          <rect x="144" y="74" width="62" height="6" rx="3" fill="#fff" opacity=".55" />

          <circle
            cx="150"
            cy="130"
            r="11"
            className="fill-neutral-200 dark:fill-neutral-800"
          />
          <g clipPath="url(#bento-gb-face-b)">
            <rect x="139" y="119" width="22" height="22" fill="#fbcfe8" opacity=".6" />
            <ellipse cx="150" cy="142" rx="10" ry="7.5" fill="#4c1d95" />
            <circle cx="150" cy="128" r="5.4" fill="#e0ac82" />
            <path
              d="M144.6 128.4a5.4 5.4 0 0 1 10.8 0c1.2-3.6-.6-7-5.4-7s-6.6 3.4-5.4 7z"
              fill="#1f2937"
            />
          </g>
          <rect
            x="166"
            y="126"
            width="42"
            height="5"
            rx="2.5"
            className="fill-neutral-300 dark:fill-neutral-700"
          />
          <rect
            x="166"
            y="136"
            width="26"
            height="5"
            rx="2.5"
            className="fill-neutral-200 dark:fill-neutral-800"
          />
        </g>
      </g>
    </svg>
  );
}
