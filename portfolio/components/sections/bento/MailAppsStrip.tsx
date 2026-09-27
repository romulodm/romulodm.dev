'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import './Bento.css';

/**
 * Fita de icones do card da newsletter: os apps onde o e-mail cai, com a
 * marca do site no centro — "sai daqui, chega ali".
 *
 * A fita e mais larga que o card de proposito. Ela fica centralizada e vaza
 * pelas duas bordas; quem corta e o `overflow-hidden` do <BentoCard />, e a
 * mascara em degrade dissolve as pontas para o corte nao parecer acidente.
 * Nao ha scroll: e ilustracao, nao lista navegavel — por isso o bloco inteiro
 * e `aria-hidden` (o titulo do card ja diz do que se trata).
 *
 * No hover o movimento sai do centro para as pontas: a marca sobe primeiro e
 * cada par lateral entra ~90ms depois do anterior. A borda de cada caixa so
 * fecha na cor da marca quando AQUELA caixa termina de subir — a coreografia
 * inteira esta em `.bento-rise` / `.bento-late-color` (Bento.css), aqui so
 * moram os tempos.
 *
 * Os desenhos sao SVG inline em vez de PNG: nenhuma request a mais na home
 * (que ja e a pagina mais pesada do site) e nitidez em qualquer densidade de
 * tela. Os tracos de Gmail, iCloud, Proton Mail, Substack e Thunderbird sao
 * os oficiais (Simple Icons, CC0); o do Outlook e redesenhado, porque a
 * Microsoft nao libera a marca dela nesse acervo.
 */

/**
 * O icone fica com pouco mais da metade da moldura interna — o resto e
 * respiro. Tiles de 4.5rem (5.25rem no centro) com gap 2 deixam 3 tiles
 * inteiros na coluna do bento e os dois vizinhos so espiando; mexer no
 * tamanho muda a conta. O icone tem o mesmo tamanho em todos os tiles: quem
 * cresce no centro e so a moldura.
 *
 * O `ring` existe pelo tema claro: sem ele os icones de fundo branco (Gmail,
 * iCloud, Outlook) somem contra o card claro.
 */
const ICON = 'h-[1.9rem] w-[1.9rem] shrink-0 rounded-[0.5rem] ring-1 ring-black/5 dark:ring-0';

function Gmail() {
  return (
    <svg viewBox="0 0 24 24" className={`${ICON} bg-white p-[0.3rem]`} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </svg>
  );
}

/** Outlook: o "O" sobre o envelope. Redesenhado — a Microsoft nao libera a
 *  marca dela nos acervos livres, e a caixa fica azul (e nao branca como as
 *  vizinhas) porque em 32px o "O" vazado e o que sobra de reconhecivel. */
function Outlook() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={`${ICON} p-[0.1rem]`}
    >
      <path
        fill="#40c4ff"
        d="M31.323,8.502L7.075,23.872l-2.085-3.29v-2.835c0-1.032,0.523-1.994,1.389-2.556l14.095-9.146c2.147-1.393,4.914-1.394,7.061-0.001L31.323,8.502z"
      />
      <path
        fill="#1976d2"
        d="M27.317,5.911c0.073,0.043,0.145,0.088,0.217,0.135l11,7.136L11.259,30.47l-4.185-6.603l20.017-12.713C28.988,9.95,29.071,7.241,27.317,5.911z"
      />
      <path
        fill="#0d47a1"
        d="M22.142,33.771L11.26,30.47l23.136-14.666c1.949-1.235,1.944-4.08-0.009-5.308l-0.104-0.065l0.3,0.186l7.041,4.568c0.866,0.562,1.389,1.524,1.389,2.556v2.744L22.142,33.771z"
      />
      <path
        fill="#29b6f6"
        d="M20.886,43h15.523c3.646,0,6.602-2.956,6.602-6.602V17.797c0,1.077-0.554,2.079-1.466,2.652l-23.09,14.498c-1.246,0.782-2.001,2.15-2.001,3.62C16.454,41.016,18.438,43,20.886,43z"
      />
      <radialGradient
        id="outlook-gradient"
        cx="-509.142"
        cy="-26.522"
        r=".07"
        gradientTransform="matrix(-170.8609 259.7254 674.0181 443.4041 -69097.734 144024.688)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#49deff" />
        <stop offset=".724" stopColor="#29c3ff" />
      </radialGradient>
      <path
        fill="url(#outlook-gradient)"
        d="M27.198,42.999H11.589c-3.646,0-6.602-2.956-6.602-6.602V17.783c0,1.076,0.552,2.076,1.461,2.649l23.067,14.543c1.263,0.796,2.029,2.185,2.029,3.678C31.544,41.053,29.598,42.999,27.198,42.999z"
      />
      <path
        fill="#80d8ff"
        d="M27.198,42.999H11.589c-3.646,0-6.602-2.956-6.602-6.602V17.783c0,1.076,0.552,2.076,1.461,2.649l23.067,14.543c1.263,0.796,2.029,2.185,2.029,3.678C31.544,41.053,29.598,42.999,27.198,42.999z"
      />
      <path
        fill="#fff"
        d="M11.282,36.236c-1.398,0-2.545-0.437-3.442-1.312c-0.897-0.874-1.346-2.015-1.346-3.423c0-1.486,0.455-2.689,1.366-3.607c0.911-0.918,2.103-1.377,3.577-1.377c1.393,0,2.526,0.439,3.401,1.318c0.879,0.879,1.319,2.037,1.319,3.475c0,1.478-0.456,2.669-1.366,3.574C13.885,35.786,12.716,36.236,11.282,36.236z M11.323,34.381c0.762,0,1.375-0.26,1.839-0.78c0.464-0.52,0.696-1.244,0.696-2.171c0-0.966-0.226-1.718-0.676-2.256c-0.451-0.538-1.053-0.806-1.805-0.806c-0.775,0-1.4,0.278-1.873,0.833c-0.473,0.551-0.71,1.281-0.71,2.19c0,0.923,0.237,1.653,0.71,2.19C9.977,34.114,10.583,34.381,11.323,34.381z"
      />
      <path
        fill="#1565c0"
        d="M6.453,23h10.094C18.454,23,20,24.546,20,26.453v10.094C20,38.454,18.454,40,16.547,40H6.453C4.546,40,3,38.454,3,36.547V26.453C3,24.546,4.546,23,6.453,23z"
      />
      <path
        fill="#fff"
        d="M11.453,36.518c-1.4,0-2.55-0.452-3.449-1.355c-0.899-0.903-1.348-2.082-1.348-3.537c0-1.536,0.456-2.778,1.369-3.726c0.913-0.949,2.107-1.423,3.584-1.423c1.396,0,2.532,0.454,3.408,1.362c0.881,0.908,1.321,2.105,1.321,3.591c0,1.527-0.456,2.758-1.369,3.692C14.061,36.053,12.889,36.518,11.453,36.518z M11.493,34.601c0.763,0,1.378-0.269,1.843-0.806c0.465-0.538,0.698-1.285,0.698-2.243c0-0.998-0.226-1.775-0.677-2.331c-0.452-0.556-1.055-0.833-1.809-0.833c-0.777,0-1.403,0.287-1.877,0.861c-0.474,0.569-0.711,1.323-0.711,2.263c0,0.953,0.237,1.707,0.711,2.263C10.145,34.326,10.752,34.601,11.493,34.601z"
      />
    </svg>
  );
}




function ICloud() {
  return (
    <svg viewBox="0 0 24 24" className={`${ICON} bg-white p-[0.3rem]`} aria-hidden>
      <path
        fill="#3693F3"
        d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914 4.93 4.93 0 0 0 .617-.045h14.42c2.305-.272 4.041-2.258 4.043-4.589v-.009a4.594 4.594 0 0 0-3.727-4.508 6.51 6.51 0 0 0-6.511-6.27z"
      />
    </svg>
  );
}

function ProtonMail() {
  return (
    <svg viewBox="0 0 24 24" className={`${ICON} bg-[#1B1340] p-[0.32rem]`} aria-hidden>
      <path
        fill="#8A6EFF"
        d="m15.24 8.998 3.656-3.073v15.81H2.482C1.11 21.735 0 20.609 0 19.223V6.944l7.58 6.38a2.186 2.186 0 0 0 2.871-.042l4.792-4.284h-.003zm-5.456 3.538 1.809-1.616a2.438 2.438 0 0 1-1.178-.533L.905 2.395A.552.552 0 0 0 0 2.826v2.811l8.226 6.923a1.186 1.186 0 0 0 1.558-.024zM23.871 2.463a.551.551 0 0 0-.776-.068l-3.199 2.688v16.653h1.623c1.371 0 2.481-1.127 2.481-2.513V2.824a.551.551 0 0 0-.129-.36z"
      />
    </svg>
  );
}

function YahooMail() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={`${ICON} bg-[#1B1340] p-[0.32rem]`}
      aria-hidden="true"
    >
      <polygon
        fill="#5e35b1"
        points="4.209,14.881 11.632,14.881 16.189,26.715 20.966,14.881 28.315,14.881 17.07,42 9.501,42 12.587,34.96"
      />
      <circle
        cx="29.276"
        cy="30.522"
        r="4.697"
        fill="#5e35b1"
      />
      <polygon
        fill="#5e35b1"
        points="34.693,6 27.213,24.042 35.444,24.042 42.925,6"
      />
    </svg>
  );
}

function Thunderbird() {
  return (
    <svg viewBox="0 0 24 24" className={`${ICON} bg-white p-[0.28rem]`} aria-hidden>
      <path
        fill="#0A84FF"
        d="M9.948 4.444h-.005c-1.92.788-2.126 2.55-1.817 3.499v.02C9.236 7.18 10.658 6.76 12 6.76c3.26 0 5.902 2.156 5.902 4.815 0 2.66-2.643 4.816-5.902 4.816l-.083-.002c-.155-.006-.354-.013-.435.118-.096.156.116.397.238.536 1.274 1.441 3.123 1.622 3.608 1.67l.076.008c-4.281.414-9.304-2.32-9.306-7.076 0-1.12.414-2.073 1.075-2.83l-.005-.002h-.003C7.31 6.38 6.376 3.47 4.629 2.898c-.124-.04-.246.054-.262.183-.23 1.924-.727 2.59-1.264 3.31-.805 1.08-1.39 2.328-1.365 3.698a10.99 10.99 0 0 1-.705-1.91c-.024-.09-.17-.365-.333-.272-.13.072-.227.274-.296.485A12.137 12.137 0 0 0 0 11.489c0 6.536 5.475 12 12 12 6.627 0 12-5.372 12-12 0-2.526-.781-4.87-2.115-6.805l.167-.002c.518 0 1.024.045 1.51.129-.734-.816-1.724-1.475-2.877-1.904a8.54 8.54 0 0 1 2.494-.495c-1.426-1.166-3.508-1.9-5.827-1.9-3.355 0-6.648 1.29-7.404 3.93zm.682 9.166c-.87-.905-3.473-3.91-3.473-3.91l.202.01 4.075 3.042c.305.223.74.22 1.043-.004l3.996-3.034.212-.018s-2.518 2.935-3.483 3.9c-.964.968-1.703.919-2.572.014zm2.774-10.083s.055.625-.576.824c-.722.227-1.042-.38-1.042-.38s.09-.417.676-.61c.626-.206.942.166.942.166z"
      />
    </svg>
  );
}

/** A marca no centro da fita — o unico tile que nao e app de terceiro. */
function Brand() {
  return (
    <span className={`${ICON} grid place-items-center bg-white text-primary dark:bg-neutral-950`}>
      <Logo size={22} />
    </span>
  );
}

const APPS: { key: string; node: ReactNode }[] = [
  { key: 'proton', node: <ProtonMail /> },
  { key: 'outlook', node: <Outlook /> },
  { key: 'gmail', node: <Gmail /> },
  { key: 'brand', node: <Brand /> },
  { key: 'icloud', node: <ICloud /> },
  { key: 'yahoo', node: <YahooMail /> },
  { key: 'thunderbird', node: <Thunderbird /> },
];

/** indice da marca — a onda do hover sai daqui para as duas pontas */
const CENTER = APPS.findIndex((a) => a.key === 'brand');

/** quanto cada anel lateral espera para comecar a subir */
const STEP_MS = 90;
const RISE_MS = 320;

export default function MailAppsStrip() {
  return (
    <div
      aria-hidden
      className="relative py-5 flex w-full justify-center [-webkit-mask-image:linear-gradient(to_right,transparent,#000_11%,#000_89%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_11%,#000_89%,transparent)]"
    >
      <ul className="flex shrink-0 items-center gap-2">
        {APPS.map(({ key, node }, i) => {
          const center = i === CENTER;
          const style = {
            '--rise-to': 'translateY(-0.6rem)',
            '--rise-delay': `${Math.abs(i - CENTER) * STEP_MS}ms`,
            '--rise-dur': `${RISE_MS}ms`,
          } as CSSProperties;

          /* duas molduras concentricas: a de fora (borda grossa, sem fundo)
             segura o respiro e a de dentro e a "tecla" rebaixada com sombra
             interna que abraca o icone. O centro e maior — e a marca. A de
             dentro so pinta; quem sobe (e quem calcula `--late`) e o <li>. */
          return (
            <li
              key={key}
              style={style}
              className={`bento-rise shrink-0 rounded-[1.1rem] border-2 p-1.5 group-hover:border-primary/60 ${center
                ? 'h-[5.25rem] w-[5.25rem] border-border'
                : 'h-[4.5rem] w-[4.5rem] border-border/60'
                }`}
            >
              <span
                className="bento-late-color grid h-full w-full place-items-center rounded-[0.7rem] border-2 border-black/[0.04] bg-neutral-100 shadow-inner group-hover:bg-primary/10 dark:border-white/[0.06] dark:bg-white/[0.04] dark:group-hover:bg-primary/10"
              >
                {node}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
