'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { TbActivityHeartbeat, TbTopologyStar3 } from 'react-icons/tb';
import { MdRocketLaunch, MdSecurity } from 'react-icons/md';
import { FaCode, FaPeopleCarry } from 'react-icons/fa';
import { SiTeespring } from 'react-icons/si';
import { IoFlashOutline } from 'react-icons/io5';
import { HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineSparkles } from 'react-icons/hi2';
import { Parallax } from 'react-scroll-parallax';
import { animated, useSpringValue } from '@react-spring/web';
import { Avatar, Button, Card, Chip } from './ui';
import { Default, Mobile, useMobileMode } from './Responsive';
import Reach from './Reach';

const SURFACE_GLOW = 'drop-shadow(0 0 20px var(--vs-background-body))';

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
    mobile: { top: '1%', left: '1rem' },
  },
  {
    key: 'engineering',
    speed: 16,
    cards: [
      { key: 'web3', icon: <TbTopologyStar3 /> },
      { key: 'security', icon: <HiOutlineShieldCheck /> },
      { key: 'performance', icon: <IoFlashOutline /> },
      { key: 'observability', icon: <TbActivityHeartbeat /> },
    ],
    columns: 2,
    desktop: { top: '46%', left: '3%' },
    mobile: { top: '64%', left: '1rem' },
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
function CardStack({ stack }: { stack: StackDefinition }) {
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

  return (
    <Parallax
      speed={stack.speed}
      style={{ position: 'absolute', ...(mobile ? stack.mobile : stack.desktop) }}
    >
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
    </Parallax>
  );
}

function BoardCards() {
  return (
    <>
      {CARD_STACKS.map((stack) => (
        <CardStack key={stack.key} stack={stack} />
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
  { top: '12%', left: '51%', rotate: '0deg', opacity: '1' },
  { top: '51%', left: '40%', rotate: '-90deg', opacity: '1' },
  { top: '58.5%', left: '54%', rotate: '-90deg', opacity: '1' },
  { top: '81%', left: '4%', rotate: '0deg', opacity: '1' },
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
        // no mobile tudo empilha em coluna, entao o board precisa de mais altura
        height: mobile ? '58rem' : '40rem',
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
          top: mobile ? '20%' : '20%',
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
          top: mobile ? '42%' : '34%',
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
      <BoardCards />

      {/* ------------------------------ botoes ------------------------------- */}
      <Card
        variant="outlined"
        style={{
          position: 'absolute',
          top: mobile ? '86%' : '82%',
          left: '50%',
          transform: 'translateX(-50%)',
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Software (Goals)                              */
/* -------------------------------------------------------------------------- */

export default function Software() {
  const t = useTranslations('vision.software');
  const mobile = useMobileMode();

  const animationDelay = 0.2;

  const [scrollingProgress, setScrollingProgress] = useState(0);
  const animationStep = useMemo(
    () =>
      Math.min(
        Math.round(Math.max(0, scrollingProgress - animationDelay) * (6 / (1 - animationDelay))),
        5,
      ),
    [scrollingProgress],
  );

  return (
    <Parallax
      shouldAlwaysCompleteAnimation
      onProgressChange={(progress) => setScrollingProgress(progress)}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          // o board mobile e mais alto, entao a secao acompanha para o
          // formulario (posicionado em 67%) nao subir por cima dos cards
          height: mobile ? '1800px' : '1200px',
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
