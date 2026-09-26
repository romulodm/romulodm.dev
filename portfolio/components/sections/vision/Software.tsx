'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { TbActivityHeartbeat, TbTopologyStar3 } from 'react-icons/tb';
import { MdRocketLaunch, MdSecurity } from 'react-icons/md';
import { FaCode, FaPeopleCarry } from 'react-icons/fa';
import { SiTeespring } from 'react-icons/si';
import { IoFlashOutline } from 'react-icons/io5';
import {
  HiOutlineAcademicCap,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { Parallax } from 'react-scroll-parallax';
import { animated, useSpringValue } from '@react-spring/web';
import { pixels } from 'seedicon/pixels';
import { Avatar, Button, Card, Chip } from './ui';
import { Default, Mobile, useMobileMode } from './Responsive';
import Reach, { REACH_MAX_HEIGHT, REACH_TOP_MOBILE } from './Reach';

const SURFACE_GLOW = 'drop-shadow(0 0 20px var(--vs-background-body))';

/* -------------------------------------------------------------------------- */
/*                              Wallet comment                                */
/* -------------------------------------------------------------------------- */

/**
 * The address hanging under the Web3 card. It is both the link target and the
 * seed of the avatar next to it, which is the whole point of the card: the
 * drawing is not a picture of the address, it IS the address, run through
 * seedicon. Changing this string changes the drawing.
 */
const WALLET_ADDRESS = '0xba32a6076cd558947b3da6148fc4994b421eed56';

const WALLET_EXPLORER_URL = `https://etherscan.io/address/${WALLET_ADDRESS}`;

/** Matches `.vs-avatar--sm` (2rem), so the SVG fills it instead of sitting in it. */
const WALLET_AVATAR_SIZE = 32;

/**
 * Scroll step that reveals the comment: the one where the cursor has reached
 * the "collaborative development" button.
 *
 * It cannot simply be a late step. The board scrolls up as the animation
 * advances, and this comment sits near the top of it, so by step 4 it is
 * already off screen — it would fade in above the viewport and never be seen.
 * Step 2 is the last one where the stack it hangs from is still comfortably in
 * frame, and it is also where the cursor lands on the button. The manager's
 * comment can afford step 3 because it sits at the bottom of the board, which
 * is still on screen by then.
 */
const WALLET_COMMENT_STEP = 2;

/**
 * How far right of the stack's left edge the bubble hangs. This is the knob for
 * sliding it sideways: the stack is positioned by `desktop.left`, and the
 * comment just follows that edge, so an indent here moves the comment alone and
 * leaves the four cards where they are.
 */
const WALLET_COMMENT_INDENT = '6rem';

/** Same knob on mobile, smaller: there the bubble is as wide as the stack. */
const WALLET_COMMENT_INDENT_MOBILE = '1.5rem';

/**
 * An address is 42 characters and the middle of it is never read: wallets and
 * explorers all show the ends and drop the rest, so the card does the same.
 */
function shortenAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

/**
 * A second comment on the board, under the Web3 card. Unlike everything else
 * here — mock UI that only exists to be looked at — this one is a real link to
 * the address on Etherscan, which is why it opts back into pointer events that
 * the board turns off wholesale.
 */
function WalletComment({ step }: { step: number }) {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const visible = step >= WALLET_COMMENT_STEP;

  const opacity = useSpringValue(0);

  useEffect(() => {
    opacity.start(visible ? 1 : 0);
  }, [visible, opacity]);

  return (
    <Card
      as={animated.a}
      href={WALLET_EXPLORER_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="vs-wallet-comment"
      variant="outlined"
      // Opacity alone would leave an invisible link that still takes clicks and
      // still stops the keyboard on its way down the page, so both follow the
      // same flag the animation does.
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        marginTop: '0.5rem',
        // On mobile the bubble would be wider than the stack (and than a 360px
        // screen), so it takes the stack's width and lets the sentence wrap.
        marginLeft: mobile ? WALLET_COMMENT_INDENT_MOBILE : WALLET_COMMENT_INDENT,
        width: mobile ? 'auto' : 'max-content',
        borderRadius: '1.5rem',
        // Same clipped corner as the manager's comment: it reads as a bubble
        // hanging from the card above instead of a card floating on its own.
        borderTopLeftRadius: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0.7rem',
        padding: '0.5rem',
        filter: SURFACE_GLOW,
        // The board container sets `pointerEvents: none` so none of the fake UI
        // can be clicked. This card is the one thing on it that really is a
        // link, so it turns them back on for itself — but only once it is on
        // screen.
        pointerEvents: visible ? 'auto' : 'none',
        opacity,
      }}
    >
      <Avatar size="sm" style={{ overflow: 'hidden' }}>
        {/*
         * Same reasoning as the project card on the home page: "seedicon/pixels"
         * is the single-style entry point, so the other sixteen renderers never
         * reach the bundle. The markup is raw because `pixels()` returns an SVG
         * string; it is built from the constant above, never from user input,
         * and it is deterministic, so server and client render the same bytes.
         */}
        <span
          aria-hidden="true"
          style={{ display: 'flex' }}
          dangerouslySetInnerHTML={{
            __html: pixels({
              seed: WALLET_ADDRESS,
              size: WALLET_AVATAR_SIZE,
              shape: 'circle',
            }),
          }}
        />
      </Avatar>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          className="vs-body3 vs-t-secondary"
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          {shortenAddress(WALLET_ADDRESS)}
          <HiOutlineArrowTopRightOnSquare aria-hidden />
        </span>
        {/*
          * One line, no wrapping: the card is `width: max-content`, so the
          * sentence sets its width instead of being folded into a block. Keep
          * the translations short enough that the bubble still fits the board.
          */}
        <span
          className="vs-body2 vs-t-secondary"
          style={{ marginRight: '0.5rem', whiteSpace: mobile ? 'normal' : 'nowrap' }}
        >
          {t('walletCommentBody')}
        </span>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Pilhas de cards sobre o board                       */
/* -------------------------------------------------------------------------- */

type Placement = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

type StackDefinition = {
  key: string;
  /** velocidade do parallax — a pilha inteira se move como um bloco so */
  speed: number;
  /** sufixo das chaves em `vision.software` (xTitle / xBody) + icone */
  cards: { key: string; icon: ReactNode }[];
  /**
   * Numero de colunas no desktop. Com 2, o preenchimento e por coluna
   * (`gridAutoFlow: column`), entao os dois primeiros cards ficam a esquerda
   * e os dois seguintes a direita. No mobile sempre colapsa para 1.
   */
  columns?: number;
  /**
   * Rendered under the stack, aligned with its first column — so under the last
   * card of that column, which on the engineering stack is Web3. On mobile the
   * columns collapse into one, so it lands under the last card instead.
   */
  footer?: (step: number) => ReactNode;
  /**
   * Mobile only: rendered below the stack (and its footer), centred on the
   * board. The buttons card goes here so it moves with the stack's parallax
   * instead of on its own; as separate layers they drifted into each other
   * and the buttons covered the last cards.
   */
  mobileTail?: (step: number) => ReactNode;
  desktop: Placement;
  mobile: Placement;
};

/** Espaco vertical entre um card e o proximo da mesma pilha. */
const STACK_GAP = { desktop: '0.2rem', mobile: '0.5rem' };

/** Espaco horizontal entre as colunas — "perto um do outro", sem colar. */
const STACK_COLUMN_GAP = '0.4rem';

const CARD_STACKS: StackDefinition[] = [
  {
    key: 'people',
    speed: 10,
    cards: [
      { key: 'innovate', icon: <HiOutlineSparkles /> },
      { key: 'community', icon: <FaPeopleCarry /> },
      { key: 'academia', icon: <HiOutlineAcademicCap /> },
    ],
    desktop: { top: '0%', left: '52%' },
    mobile: { top: '0.6rem', left: '1rem' },
  },
  {
    key: 'engineering',
    speed: 16,
    cards: [
      { key: 'security', icon: <HiOutlineShieldCheck /> },
      { key: 'web3', icon: <TbTopologyStar3 /> },
      { key: 'performance', icon: <IoFlashOutline /> },
      { key: 'observability', icon: <TbActivityHeartbeat /> },
    ],
    columns: 2,
    footer: (step) => <WalletComment step={step} />,
    mobileTail: (step) => <CtaCard step={step} inline />,
    desktop: { top: '46%', left: '3%' },
    // Full width so the column can centre the stack and the buttons under it.
    mobile: { top: '37rem', left: '0', right: '0' },
  },
];

/**
 * Coluna flex com `width: max-content`:
 *   - a largura do container e a do card mais largo;
 *   - `align-items: stretch` (padrao) estica os outros dois ate ela;
 *   - o `gap` cuida do espaco vertical.
 * Larguras identicas e espacamento limpo sem numero magico — e sem precisar
 * saber a altura do card, que era o problema do translateY com offset fixo.
 */
function CardStack({ stack, step }: { stack: StackDefinition; step: number }) {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const gap = mobile ? STACK_GAP.mobile : STACK_GAP.desktop;

  // Multi-coluna so no desktop: no mobile nao ha largura para duas colunas.
  const columns = mobile ? 1 : (stack.columns ?? 1);
  const multiColumn = columns > 1;

  /*
   * O texto nunca quebra (`nowrap` nos dois spans), entao a largura de cada
   * card e ditada pelo conteudo mais longo. Para os quatro terminarem com a
   * MESMA largura, o grid usa `1fr` nas trilhas com o container em
   * `max-content`: sob sizing max-content, trilhas de fr iguais convergem para
   * a maior contribuicao entre elas, e o `stretch` padrao do grid faz cada Card
   * preencher a propria trilha. Largura uniforme sem numero magico.
   */
  const layout: React.CSSProperties = multiColumn
    ? {
      display: 'grid',
      gridAutoFlow: 'column',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gridTemplateRows: `repeat(${Math.ceil(stack.cards.length / columns)}, auto)`,
      columnGap: STACK_COLUMN_GAP,
      rowGap: gap,
      width: 'max-content',
    }
    : {
      display: 'flex',
      flexDirection: 'column',
      gap,
      width: 'max-content',
    };

  const tail = mobile ? stack.mobileTail?.(step) : null;

  const cards = (
      <div style={layout}>
        {stack.cards.map((card) => (
          <Card
            key={card.key}
            variant="outlined"
            style={{
              padding: '0.5rem',
              filter: SURFACE_GLOW,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Avatar
                size="lg"
                style={{
                  fontSize: '1.5rem',
                  borderRadius: 'var(--vs-radius-md)',
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="vs-body1" style={{ whiteSpace: 'nowrap' }}>
                  {t(`${card.key}Title`)}
                </span>
                <span className="vs-body2" style={{ whiteSpace: 'nowrap' }}>
                  {t(`${card.key}Body`)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
  );

  return (
    <Parallax
      speed={stack.speed}
      style={{ position: 'absolute', ...(mobile ? stack.mobile : stack.desktop) }}
    >
      {tail ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          {/*
           * `min-content` makes this box as wide as the cards (they never wrap)
           * and not as wide as the footer, whose sentence wraps on mobile.
           */}
          <div style={{ width: 'min-content' }}>
            {cards}
            {stack.footer?.(step)}
          </div>
          {tail}
        </div>
      ) : (
        <>
          {cards}
          {stack.footer?.(step)}
        </>
      )}
    </Parallax>
  );
}

function BoardCards({ step }: { step: number }) {
  return (
    <>
      {CARD_STACKS.map((stack) => (
        <CardStack key={stack.key} stack={stack} step={step} />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Grid                                    */
/* -------------------------------------------------------------------------- */

function Grid() {
  return <div className="vs-grid" />;
}

/* -------------------------------------------------------------------------- */
/*                                   Comment                                  */
/* -------------------------------------------------------------------------- */

function Comment({ step }: { step: number }) {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const opacity = useSpringValue(0);

  useEffect(() => {
    opacity.start(step >= 3 ? 1 : 0);
  }, [step, opacity]);

  return (
    <Card
      as={animated.div}
      variant="outlined"
      color="danger"
      style={{
        position: 'absolute',
        top: 'calc(1rem + 100%)',
        left: mobile ? '10%' : '50%',
        width: 'max-content',
        maxWidth: mobile ? '17rem' : undefined,
        borderRadius: '1.5rem',
        borderTopLeftRadius: 0,
        borderColor: 'var(--vs-danger-400)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0.7rem',
        padding: '0.5rem',
        opacity,
      }}
    >
      <Avatar color="danger" variant="solid" size="sm">
        M
      </Avatar>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="vs-body3 vs-t-secondary" style={{ fontWeight: 600 }}>
          {t('commentAuthor')}
          {' • '}
          <span className="vs-t-tertiary">{t('commentTime')}</span>
        </span>
        <span className="vs-body2 vs-t-secondary" style={{ marginRight: '0.5rem' }}>
          {t('commentBody')}
        </span>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Cursor                                   */
/* -------------------------------------------------------------------------- */

/*
 * A seta e um SVG de 25px de altura com viewBox 17x18, ou seja ~23.6x25px,
 * e gira em torno de `top right`. Isso muda a area que ela ocupa:
 *
 *   rotate(0deg)   -> x de 0 a 23.6, y de 0 a 25    (seta a DIREITA da ancora)
 *   rotate(-90deg) -> x de 23.6 a 48.6, y de 0 a 23.6 (seta a ESQUERDA... )
 *
 * Por isso o label nao pode ser empurrado por `100%` da propria largura no
 * caso girado: a largura do chip nao tem relacao com onde a seta foi parar.
 * Os dois valores abaixo encostam o label na seta com a mesma folga (~6px de
 * sobreposicao horizontal), cada um do lado onde a seta de fato esta.
 *
 * As duas strings precisam ter o MESMO formato — `calc(N% + Npx)` — porque o
 * react-spring interpola numero a numero. Trocar uma delas por um `42px` seco
 * quebra a animacao no meio do caminho.
 */
const LABEL_TRANSFORMS = {
  left: 'translate(calc(-100% + 6px), 18px)',
  right: 'translate(calc(0% + 42px), 16px)',
};

const CURSOR_STATES = [
  { top: '0', left: '20%', rotate: '0deg', opacity: '0' },
  { top: '5%', left: '51%', rotate: '0deg', opacity: '1' },
  { top: '51%', left: '40%', rotate: '-90deg', opacity: '1' },
  { top: '58.5%', left: '54%', rotate: '-90deg', opacity: '1' },
  { top: '80%', left: '-1%', rotate: '0deg', opacity: '1' },
  { top: '100%', left: '30%', rotate: '0deg', opacity: '0' },
];

function Cursor({ step, name }: { step: number; name: string }) {
  const currentState = useMemo(() => {
    const state = CURSOR_STATES[step] ?? CURSOR_STATES[0];
    return {
      ...state,
      labelTransform: LABEL_TRANSFORMS[state.rotate === '0deg' ? 'left' : 'right'],
    };
  }, [step]);

  const top = useSpringValue(currentState.top);
  const left = useSpringValue(currentState.left);
  const rotate = useSpringValue(currentState.rotate);
  const labelTransform = useSpringValue(currentState.labelTransform);
  const opacity = useSpringValue(currentState.opacity);

  useEffect(() => {
    top.start(currentState.top);
    left.start(currentState.left);
    rotate.start(currentState.rotate);
    labelTransform.start(currentState.labelTransform);
    opacity.start(currentState.opacity);
  }, [currentState, top, left, rotate, labelTransform, opacity]);

  return (
    <animated.div style={{ zIndex: 99, position: 'absolute', top, left, opacity }}>
      <Chip
        as={animated.div}
        variant="solid"
        color="danger"
        style={{
          position: 'absolute',
          borderRadius: 'var(--vs-radius-sm)',
          transformOrigin: 'top right',
          filter: 'drop-shadow(0 0 10px var(--vs-background-body))',
          transform: labelTransform,
        }}
      >
        {name}
      </Chip>
      <animated.div
        className="vs-cursor-arrow"
        style={{ position: 'absolute', transformOrigin: 'top right', rotate }}
      >
        <svg
          height="25"
          viewBox="0 0 17 18"
          fill="var(--vs-danger-500)"
          filter="drop-shadow(0 0 10px var(--vs-background-body))"
        >
          <path
            d="M15.5036 3.11002L12.5357 15.4055C12.2666 16.5204 10.7637 16.7146 10.22 15.7049L7.4763 10.6094L2.00376 8.65488C0.915938 8.26638 0.891983 6.73663 1.96711 6.31426L13.8314 1.65328C14.7729 1.28341 15.741 2.12672 15.5036 3.11002ZM7.56678 10.6417L7.56645 10.6416C7.56656 10.6416 7.56667 10.6416 7.56678 10.6417L7.65087 10.4062L7.56678 10.6417Z"
            strokeWidth="1.5"
          />
        </svg>
      </animated.div>
    </animated.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CTA card                                  */
/* -------------------------------------------------------------------------- */

/**
 * The three buttons, with the manager's comment hanging under them. On desktop
 * it is placed on the board by itself; `inline` drops the positioning so the
 * mobile layout can put it in the flow under the engineering stack.
 */
function CtaCard({ step, inline = false }: { step: number; inline?: boolean }) {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const placement: React.CSSProperties = inline
    ? {}
    : {
      position: 'absolute',
      top: '82%',
      left: '50%',
      transform: 'translateX(-50%)',
    };

  return (
    <Card
      variant="outlined"
      style={{
        ...placement,
        filter: SURFACE_GLOW,
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
      }}
    >
      <Button variant="outlined" color="neutral" startDecorator={<MdSecurity />}>
        {t('ctaSecurity')}
      </Button>
      <Button
        variant="solid"
        color="success"
        startDecorator={<FaCode />}
        style={{ whiteSpace: 'nowrap' }}
      >
        {t('ctaCollaborative')}
      </Button>
      <Button variant="outlined" color="neutral" startDecorator={<SiTeespring />}>
        {t('ctaFlexibility')}
      </Button>
      <Comment step={step} />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Board                                   */
/* -------------------------------------------------------------------------- */

/** Quantidade de commits exibida no badge, avancando conforme o scroll. */
const COMMIT_STEPS = [1, 5, 8, 13, 18, 25];

function Board({ step }: { step: number }) {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const commits = COMMIT_STEPS[Math.min(step, COMMIT_STEPS.length - 1)];
  const commitsBadge = (
    <Chip variant="solid" color="success" style={{ borderRadius: 'var(--vs-radius-sm)' }}>
      {t('commits', { count: commits })}
    </Chip>
  );

  return (
    <div
      style={{
        pointerEvents: 'none',
        width: 'min(50rem, 100%)',
        // o board e mais estreito que a secao: sem isso ele encosta na esquerda
        marginInline: 'auto',
        // no mobile tudo empilha em coluna, entao o board precisa de mais altura.
        // Posicoes mobile ficam em rem (nao %) para nao andarem quando esta
        // altura muda.
        height: mobile ? '78rem' : '40rem',
        overflow: 'visible',
        background: 'transparent',
        position: 'relative',
      }}
    >
      <Parallax
        speed={0}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '130%' }}
      >
        <Grid />
      </Parallax>

      {/* ------------------------ Design / Prototipar / ... ------------------ */}
      <Parallax
        speed={10}
        style={{
          position: 'absolute',
          top: mobile ? '11.6rem' : '20%',
          left: mobile ? '1rem' : '2%',
        }}
      >
        <Card variant="outlined" style={{ filter: SURFACE_GLOW, gap: 0 }}>
          <span className="vs-h5 vs-t-tertiary" style={{ fontWeight: 700 }}>
            {t('frameOne')}
          </span>
          <span className="vs-h5 vs-t-primary" style={{ fontWeight: 700 }}>
            {t('frameTwo')}
          </span>
          <span className="vs-h5 vs-c-success" style={{ fontWeight: 700 }}>
            {t('frameThree')}
          </span>
          <span className="vs-h5 vs-t-primary" style={{ fontWeight: 700, opacity: 0.3 }}>
            {t('frameFour')}
          </span>
        </Card>
      </Parallax>

      {/* ---------------------------- Produtividade -------------------------- */}
      <Parallax
        speed={15}
        style={{
          position: 'absolute',
          top: mobile ? '24.4rem' : '34%',
          right: mobile ? undefined : '22%',
          left: mobile ? '1rem' : undefined,
        }}
      >
        <Card
          variant="outlined"
          style={{
            filter: SURFACE_GLOW,
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Avatar
            variant="solid"
            color="info"
            size="lg"
            style={{ fontSize: '1.5rem', borderRadius: 'var(--vs-radius-md)' }}
          >
            <MdRocketLaunch />
          </Avatar>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span className="vs-h6" style={{ fontWeight: 700 }}>
              {t('productivityTitle')}
            </span>
            <span className="vs-body2">
              {t.rich('productivityBody', {
                b: (chunks) => (
                  <span className="vs-t-primary" style={{ fontWeight: 700 }}>
                    {chunks}
                  </span>
                ),
              })}
            </span>
          </div>

          <Default>
            <div className="vs-commits">{commitsBadge}</div>
          </Default>
          <Mobile>
            <div className="vs-commits vs-commits--mobile">{commitsBadge}</div>
          </Mobile>
        </Card>
      </Parallax>

      {/* --------------------------- pilhas de cards ------------------------- */}
      <BoardCards step={step} />

      {/* ------------------------------ botoes ------------------------------- */}
      {/* On mobile the buttons ride along with the engineering stack (mobileTail). */}
      {!mobile && <CtaCard step={step} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Software (Goals)                              */
/* -------------------------------------------------------------------------- */

/** Share of the scroll progress spent before the board animation starts. */
const ANIMATION_DELAY = 0.2;

export default function Software() {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  /*
   * The step is stored, not the raw progress. react-scroll-parallax calls
   * onProgressChange whenever it recomputes, including when its props change
   * on a re-render; storing a float that jitters between recomputes re-renders
   * on every call and ends in "Maximum update depth exceeded". An integer step
   * only changes a handful of times, so React bails out of the rest, and the
   * callback is stable so re-renders do not re-register the element.
   */
  const [animationStep, setAnimationStep] = useState(0);
  const handleProgress = useCallback((progress: number) => {
    const next = Math.min(
      Math.round(Math.max(0, progress - ANIMATION_DELAY) * (6 / (1 - ANIMATION_DELAY))),
      5,
    );
    setAnimationStep(next);
  }, []);

  return (
    <Parallax
      shouldAlwaysCompleteAnimation
      onProgressChange={handleProgress}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          // On mobile the section should close right after the form. The form
          // sits at a fixed offset (from this box's edge, not from inside the
          // padding) with a capped height; this box stops 2.5rem short of its
          // bottom, and the `pb-20` (5rem) of <Vision /> makes up the rest, so
          // the section's `overflow-hidden` ends 2.5rem below the form. That
          // leaves room for the privacy notice, which overflows the form box a
          // little. The padding is the same at every width on purpose, so the
          // desktop layout does not depend on a responsive class.
          height: mobile
            ? `calc(${REACH_TOP_MOBILE} + ${REACH_MAX_HEIGHT} - 2.5rem)`
            : '1200px',
          marginTop: mobile ? '4rem' : '2rem',
          position: 'relative',
          padding: '37px',
        }}
        id="software"
      >
        <Default>
          <Cursor step={animationStep} name={t('cursorName')} />
        </Default>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: mobile ? '100vw' : '100%',
            height: '100%',
            margin: mobile ? '0 calc(-50vw + 50%)' : 0,
          }}
        >
          <Board step={animationStep} />
          <Reach step={animationStep} />
        </div>
      </div>
    </Parallax>
  );
}
