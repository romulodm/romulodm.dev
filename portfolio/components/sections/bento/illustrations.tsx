'use client';

/**
 * Ilustracoes planas em SVG usadas pelos cards do bento. Todas herdam a cor
 * via `currentColor`, entao o ajuste de tema claro/escuro acontece na classe
 * do elemento pai.
 */

/**
 * Caixa de entrada: tres e-mails escalonados em perspectiva, o da frente
 * nitido com avatar e linhas de assunto. Mesma linguagem do card do mural.
 */
export function EnvelopeArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="bento-nl-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* terceiro plano — o mais recuado e apagado */}
      <rect x="74" y="14" width="112" height="34" rx="9" fill="currentColor" opacity=".07" />

      {/* segundo plano */}
      <rect x="58" y="38" width="144" height="40" rx="10" fill="currentColor" opacity=".11" />
      <circle cx="80" cy="58" r="8" fill="currentColor" opacity=".16" />
      <rect x="96" y="50" width="58" height="6" rx="3" fill="currentColor" opacity=".16" />
      <rect x="96" y="62" width="86" height="6" rx="3" fill="currentColor" opacity=".11" />

      {/* primeiro plano — o e-mail "aberto" */}
      <rect
        x="40"
        y="70"
        width="180"
        height="86"
        rx="12"
        fill="currentColor"
        opacity=".14"
      />
      <rect x="40" y="70" width="180" height="4" rx="2" fill="url(#bento-nl-accent)" opacity=".9" />

      <circle cx="66" cy="98" r="11" fill="url(#bento-nl-accent)" opacity=".55" />
      <rect x="86" y="90" width="70" height="7" rx="3.5" fill="currentColor" opacity=".26" />
      <rect x="86" y="103" width="46" height="6" rx="3" fill="currentColor" opacity=".16" />

      <rect x="58" y="124" width="144" height="7" rx="3.5" fill="currentColor" opacity=".16" />
      <rect x="58" y="138" width="98" height="7" rx="3.5" fill="currentColor" opacity=".11" />

      {/* selo de "novo" */}
      <circle cx="206" cy="88" r="7" fill="#38bdf8" opacity=".85" />
    </svg>
  );
}

/** Dois recadinhos inclinados com topo colorido — card do Mural. */
export function GuestbookArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="bento-gb-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="bento-gb-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>
      </defs>

      <g transform="rotate(-8 92 86)">
        <rect x="24" y="26" width="118" height="120" rx="10" fill="currentColor" opacity=".08" />
        <path d="M24 36a10 10 0 0 1 10-10h98a10 10 0 0 1 10 10v34H24z" fill="url(#bento-gb-a)" opacity=".8" />
        <circle cx="44" cy="90" r="9" fill="currentColor" opacity=".2" />
        <rect x="62" y="84" width="62" height="7" rx="3.5" fill="currentColor" opacity=".2" />
        <rect x="38" y="110" width="86" height="7" rx="3.5" fill="currentColor" opacity=".14" />
      </g>

      <g transform="rotate(9 176 90)">
        <rect x="122" y="34" width="114" height="116" rx="10" fill="currentColor" opacity=".10" />
        <path d="M122 44a10 10 0 0 1 10-10h94a10 10 0 0 1 10 10v26h-114z" fill="url(#bento-gb-b)" opacity=".85" />
        <rect x="138" y="88" width="70" height="7" rx="3.5" fill="currentColor" opacity=".2" />
        <rect x="138" y="106" width="86" height="7" rx="3.5" fill="currentColor" opacity=".14" />
        <rect x="138" y="124" width="48" height="7" rx="3.5" fill="currentColor" opacity=".14" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                      Caixa aberta, em duas camadas                         */
/* -------------------------------------------------------------------------- */
/*
 * A caixa vem partida em duas para que o item possa passar POR DENTRO dela:
 *   BoxBackArt  -> abas de tras + a boca (interior escuro)   [atras do item]
 *   BoxFrontArt -> corpo da caixa + abas da frente           [na frente]
 * As duas usam o mesmo viewBox e o mesmo tamanho, entao basta empilhar as
 * duas na mesma posicao que elas encaixam.
 *
 * Geometria (viewBox 260x180):
 *   boca da caixa  -> quadrilatero (62,58) (198,58) (214,82) (46,82)
 *   corpo          -> comeca em y=82 e afina levemente ate y=170
 */

/** Abas de tras e o interior da caixa — fica ATRAS do item. */
export function BoxBackArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 180" fill="none" className={className} aria-hidden>
      {/* aba traseira esquerda, dobrada para cima e para fora */}
      <path d="M62 58 L20 34 L6 48 L48 72 Z" fill="currentColor" opacity=".10" />
      {/* aba traseira direita */}
      <path d="M198 58 L240 34 L254 48 L212 72 Z" fill="currentColor" opacity=".10" />

      {/* boca da caixa: o tom mais escuro do desenho, e o "dentro" */}
      <path d="M62 58 L198 58 L214 82 L46 82 Z" fill="currentColor" opacity=".30" />
      {/* parede interna do fundo, um degrau mais clara */}
      <path d="M62 58 L198 58 L196 66 L64 66 Z" fill="currentColor" opacity=".14" />
    </svg>
  );
}

/** Corpo da caixa e abas da frente — fica NA FRENTE do item. */
export function BoxFrontArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 180" fill="none" className={className} aria-hidden>
      {/* corpo, levemente afunilado para dar perspectiva */}
      <path d="M46 82 L214 82 L205 172 L55 172 Z" fill="currentColor" opacity=".17" />
      {/* face lateral esquerda, um pouco mais escura */}
      <path d="M46 82 L60 82 L66 172 L55 172 Z" fill="currentColor" opacity=".07" />
      {/* aresta da boca */}
      <path d="M46 82 L214 82" stroke="currentColor" strokeWidth="2.5" opacity=".34" />
      {/* fita no meio */}
      <path d="M130 82 L130 172" stroke="currentColor" strokeWidth="2" opacity=".09" />

      {/* abas da frente, para fora — deixam o meio livre para o item passar */}
      <path d="M46 82 L8 62 L22 48 L60 70 Z" fill="currentColor" opacity=".2" />
      <path d="M214 82 L252 62 L238 48 L200 70 Z" fill="currentColor" opacity=".2" />
    </svg>
  );
}

/** Pilha de artigos com linhas de texto — card do Blog. */
export function ArticlesArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" fill="none" className={className} aria-hidden>
      <g transform="rotate(-5 130 92)">
        <rect x="52" y="18" width="156" height="40" rx="8" fill="currentColor" opacity=".08" />
      </g>
      <rect x="40" y="44" width="180" height="112" rx="10" fill="currentColor" opacity=".13" />
      <rect x="58" y="64" width="60" height="40" rx="6" fill="currentColor" opacity=".2" />
      <rect x="130" y="66" width="72" height="8" rx="4" fill="currentColor" opacity=".24" />
      <rect x="130" y="82" width="54" height="8" rx="4" fill="currentColor" opacity=".16" />
      <rect x="130" y="98" width="64" height="8" rx="4" fill="currentColor" opacity=".16" />
      <rect x="58" y="118" width="144" height="8" rx="4" fill="currentColor" opacity=".14" />
      <rect x="58" y="134" width="104" height="8" rx="4" fill="currentColor" opacity=".1" />
    </svg>
  );
}
