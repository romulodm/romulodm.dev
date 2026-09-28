'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { FiAtSign, FiUser } from 'react-icons/fi';
import { BsSendCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { animated, useSpringRef, useSpringValue, useTransition } from '@react-spring/web';
import ProgressiveImage from './ProgressiveImage';
import { Button, Input, Textarea } from './ui';
import { Default, useMobileMode } from './Responsive';
import { ReachReadout, ReachStatusCards } from './ReachStatus';
import LinkCarousel, { LINK_CARROUSEL_WIDTH } from '../contact/ContactLinkCarrousel';
import { useTurnstile } from '@/hooks/useTurnstile';
import { ContactPrivacyNotice } from '../contact/ContactPrivacyNotice';

const SATELLITE = {
  dark: {
    src: '/assets/connect/satellite_dark.webp',
    min: '/assets/connect/satellite_dark.min.webp',
    top: '-2rem',
    left: 'max(65%, 36rem)',
    filter:
      'drop-shadow(-1rem -1rem 1.5rem #dcedfa41) drop-shadow(1rem 1rem 1rem #01012563)',
  },
  light: {
    src: '/assets/connect/satellite_light.webp',
    min: '/assets/connect/satellite_light.min.webp',
    top: '-1rem',
    left: 'max(67%, 36rem)',
    filter:
      'drop-shadow(-1rem -1rem 1.5rem #f4e9d068) drop-shadow(1rem 1rem 1rem #326c8c4c) hue-rotate(15deg)',
  },
} as const;


/**
 * Where the form sits on mobile, from the top of the #software box (its
 * containing block, padding included).
 *
 * On desktop the form slides from 80% to 67% of the section as the board
 * animates, which only works because the section height there is fixed. On
 * mobile a percentage ties the form to the section height, and that height
 * then has to leave a gap under the form for the 67% to land below the cards.
 * A fixed offset lets <Software /> size the section to end right after the
 * form. The value is where 67% of the old 2100px section used to put it.
 */
export const REACH_TOP_MOBILE = '88rem';

/** Height the form box is capped at (`maxHeight` below). */
export const REACH_MAX_HEIGHT = '27rem';

const SURPRISE_MESSAGES = ['surprise1', 'surprise2', 'surprise3'] as const;

export default function Reach({ step }: { step: number }) {
  const t = useTranslations('vision.lastConnect');
  const mobile = useMobileMode();
  // Separa este widget do formulario do modal nas analytics da Cloudflare.
  const turnstile = useTurnstile({ action: 'contact-home' });

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scheme: 'light' | 'dark' = resolvedTheme === 'light' ? 'light' : 'dark';

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  /** Honeypot: invisivel para gente, irresistivel para bot. */
  const [website, setWebsite] = useState('');

  const surprise = () => {
    const key = SURPRISE_MESSAGES[Math.floor(Math.random() * SURPRISE_MESSAGES.length)];
    setMessage(t(key));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Mesmo endpoint do formulario do modal: /api/contact, caminho relativo.
      // Este formulario nao tem seletor de assunto (a secao e uma cena animada
      // e um <select> quebraria a composicao), entao entra como OTHER — o que e
      // honesto, e o painel permite reclassificar em um clique.
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          topic: 'OTHER',
          message,
          website,
          turnstileToken: turnstile.token,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        setName('');
        setMessage('');
        return;
      }

      const payload = await response.json().catch(() => null);
      toast.error(payload?.message ?? t('genericError'));
      // O token foi queimado no siteverify; sem reset a proxima tentativa
      // falharia com `timeout-or-duplicate`.
      turnstile.reset();
    } catch {
      toast.error(t('genericError'));
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  };

  const opacity = useSpringValue(0);
  const top = useSpringValue('80%');
  const scale = useSpringValue(1);

  const submissionTextOpacity = useSpringValue(0);
  const submissionTextScale = useSpringValue(1);

  useEffect(() => {
    if (submitted) return;
    opacity.start(step >= 4 || mobile ? 1 : 0);
    top.start(step >= 4 || mobile ? '67%' : '80%');
  }, [step, mobile, submitted, opacity, top]);

  const satelliteTransitionRef = useSpringRef();
  const satelliteTransition = useTransition(mounted ? scheme : null, {
    ref: satelliteTransitionRef,
    initial: null,
    keys: null,
    from: { opacity: 0, scale: 0.7 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0.7 },
  });

  useEffect(() => {
    satelliteTransitionRef.start();
  }, [satelliteTransitionRef, scheme, mounted]);

  useEffect(() => {
    if (submitted) {
      opacity.start(0.2);
      scale.start(0.9);
      submissionTextOpacity.start(1);
      submissionTextScale.start(1);
    } else {
      opacity.start(1);
      scale.start(1);
      submissionTextOpacity.start(0);
      submissionTextScale.start(0.9);
    }
  }, [submitted, opacity, scale, submissionTextOpacity, submissionTextScale]);

  return (
    <>
      <animated.form
        id="lets-connect"
        onSubmit={submit}
        style={{
          position: 'absolute',
          left: 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: mobile ? 'center' : 'flex-start',
          // Sem recuo a esquerda no desktop: a coluna comeca na mesma borda
          // do FAQ abaixo. O satelite e posicionado em relacao ao form, entao
          // nao se move com isso.
          paddingLeft: 0,
          paddingRight: mobile ? 0 : '5%',
          alignItems: 'center',
          width: mobile ? 'calc(100% + 2rem)' : '100%',
          marginInline: mobile ? '-1rem' : 'auto',
          maxHeight: REACH_MAX_HEIGHT,
          pointerEvents: submitted ? 'none' : 'auto',
          opacity,
          top: mobile ? REACH_TOP_MOBILE : top,
          transform: scale.to((s) => `scale(${s})`),
        }}
      >
        <div
          style={{
            // On mobile the column is as wide as its content (the carousel sets
            // the width of every field), so centring the column centres the
            // form. At 30rem the content sat on the left of a wider column.
            width: mobile ? `min(${LINK_CARROUSEL_WIDTH}, 90%)` : 'min(30rem, 90%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <h2 className="type-h2 vs-t-primary">
            {t('title')}
          </h2>

          <LinkCarousel />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: '100%',
              maxWidth: LINK_CARROUSEL_WIDTH,
            }}
          >
            <Input
              className="bg-gray-300 dark:bg-neutral-900 py-2"
              placeholder={t('formEmail')}
              type="email"
              name="email"
              value={email}
              startDecorator={<FiAtSign />}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              className="bg-gray-300 dark:bg-neutral-900 py-2"
              placeholder={t('formName')}
              type="text"
              name="name"
              value={name}
              startDecorator={<FiUser />}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Textarea
              className="bg-gray-300 dark:bg-neutral-900 py-2"
              placeholder={t('formMessage')}
              name="message"
              value={message}
              required
              onChange={(event) => setMessage(event.target.value)}
              minRows={4}
            />

            {/*
              Honeypot. Escondido por posicao, nao por `display: none` — bots
              modernos pulam campos que o navegador nao renderiza.
            */}
            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, overflow: 'hidden' }}
            >
              <label htmlFor="reach-website">Website</label>
              <input
                type="text"
                name="website"
                id="reach-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            <Script
              src={turnstile.scriptSrc}
              strategy="afterInteractive"
              onLoad={turnstile.render}
            />
            {/* Este container e um flex column com `gap`, entao um filho de
                altura zero ainda consumiria um gap inteiro. Escondido, o widget
                sai do fluxo com `absolute` e o gap volta ao normal; visivel,
                ele entra como mais um filho e ganha o mesmo espacamento dos
                campos. Nunca `display: none`: iframe nao renderizado nao
                resolve desafio. */}
            <div
              ref={turnstile.hostRef}
              style={{
                position: turnstile.visible ? 'static' : 'absolute',
                display: 'flex',
                justifyContent: 'center',
              }}
            />

            {/*
              O erro de envio vai para TOAST, não para um alerta nesta coluna.
              A cena tem altura fixa (board de 40rem em `Software.tsx`) e a
              section corta o que passa disso (`overflow-hidden` em
              `Vision.tsx`). Um alerta inline aqui cresce ~3rem e empurra o
              aviso de privacidade para fora do corte — foi exatamente o que
              aconteceu. O `<ToastContainer />` já está montado no
              `app/[locale]/layout.tsx`.

              O formulário do modal continua com alerta inline: lá o container
              cresce junto e não há nada para cortar.
            */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: '0.5rem',
              }}
            >
              <Button
                type="submit"
                className="reach-submit w-full"
                loading={loading}
                disabled={loading || submitted || !turnstile.ready}
              >
                {submitted ? t('sentButton') : t('submitButton')}
              </Button>
            </div>

            {/* Mesmo aviso do formulario do modal, com o cinza desta cena. */}
            <ContactPrivacyNotice className="flex text-center items-start gap-2 text-xs leading-relaxed text-neutral-400" />
          </div>
        </div>

        <Default>
          <>
            {satelliteTransition((style, item) => {
              if (!item) return null;
              const config = SATELLITE[item];
              return (
                <ProgressiveImage
                  animate
                  src={config.src}
                  placeholder={config.min}
                  alt={t("satelliteAlt")}
                  style={{
                    ...style,
                    position: 'absolute',
                    top: config.top,
                    left: config.left,
                    height: '20rem',
                    rotate: opacity.to((o) => `${o * 15 - 15}deg`),
                    filter: config.filter,
                  }}
                />
              );
            })}
          </>
        </Default>

        {/*
          Status pieces, shown only from Tailwind's `lg` (1024px) up: that is
          the breakpoint where the FAQ below switches to its two-column grid,
          which the cards line up with. Below it the FAQ stacks, and there is
          no room for them beside the form. Hidden with CSS rather than with
          <Desktop>, so the breakpoint is exactly the FAQ's one.

          The readout sits next to the form column, centred on the page both
          ways, i.e. at the middle of the form box. The `36rem` floor keeps it
          clear of the form column (~25rem wide) near 1024px, where 50% is not
          enough.
        */}
        <div
          className="hidden lg:block"
          style={{
            position: 'absolute',
            left: 'max(50%, 36rem)',
            top: '50%',
            transform: 'translate(-80%, -50%)',
          }}
        >
          <ReachReadout />
        </div>

        {/*
          The cards sit against the right edge, which is the same right edge
          as the FAQ below (this form and the FAQ share the page gutter), at a
          fixed compact width.

          `bottom: -2rem` lines them up with the privacy notice: the form
          column is taller than the form box and overflows it by ~2rem.
        */}
        <div
          className="hidden lg:block"
          style={{ position: 'absolute', right: 0, bottom: '-2rem', width: '28rem' }}
        >
          <ReachStatusCards />
        </div>
      </animated.form>

      <animated.div
        style={{
          display: 'flex',
          flexDirection: mobile ? 'column' : 'row',
          gap: mobile ? '1rem' : '2rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          bottom: '12rem',
          left: '50%',
          width: '95%',
          pointerEvents: submitted ? undefined : 'none',
          opacity: submissionTextOpacity,
          transform: submissionTextScale.to((s) => `scale(${s}) translateX(-50%)`),
        }}
      >
        <BsSendCheck size="4rem" style={{ color: 'var(--vs-neutral-softColor)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="type-h2 vs-t-primary" style={{ textAlign: mobile ? 'center' : 'left' }}>
            {mobile ? t('thanksShort') : t('thanksLong')}
          </span>
          <span
            className="vs-h6 vs-t-secondary"
            style={{ textAlign: mobile ? 'center' : 'left' }}
          >
            {t('thanksBody')}
          </span>
        </div>
      </animated.div>
    </>
  );
}
