'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { FiAtSign, FiUser } from 'react-icons/fi';
import { MdErrorOutline } from 'react-icons/md';
import { BsSendCheck } from 'react-icons/bs';
import { animated, useSpringRef, useSpringValue, useTransition } from '@react-spring/web';
import ProgressiveImage from './ProgressiveImage';
import { Button, Input, Textarea } from './ui';
import { Default, useMobileMode } from './Responsive';
import LinkCarousel from '../contact/ContactLinkCarrousel';

const SATELLITE = {
  dark: {
    src: '/assets/nave.png',
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


const SURPRISE_MESSAGES = ['surprise1', 'surprise2', 'surprise3'] as const;
interface SubmitResponse {
  success: boolean;
  message: string;
}

export default function Reach({ step }: { step: number }) {
  const t = useTranslations('vision.lastConnect');
  const mobile = useMobileMode();

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const scheme: 'light' | 'dark' = resolvedTheme === 'light' ? 'light' : 'dark';

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const surprise = () => {
    const key = SURPRISE_MESSAGES[Math.floor(Math.random() * SURPRISE_MESSAGES.length)];
    setMessage(t(key));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_URL_EMAIL ?? '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_ACCESSKEY_EMAIL,
          email,
          name,
          message,
        }),
      });

      const result: SubmitResponse = await response.json();

      if (result.success) {
        setSubmitted(true);
        setEmail('');
        setName('');
        setMessage('');
      } else {
        setError(result.message);
      }
    } catch {
      setError(t('genericError'));
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
          paddingInline: mobile ? 0 : '5%',
          alignItems: 'center',
          width: mobile ? 'calc(100% + 2rem)' : '100%',
          marginInline: mobile ? '-1rem' : 'auto',
          maxHeight: '27rem',
          pointerEvents: submitted ? 'none' : 'auto',
          opacity,
          top,
          transform: scale.to((s) => `scale(${s})`),
        }}
      >
        <div
          style={{
            width: 'min(30rem, 90%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <h2 className="vs-h1">
            {t('titlePrefix')}{' '}
            <span className="vs-c-danger">{t('titleHighlight')}</span>
          </h2>

          <LinkCarousel />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

            {error && (
              <div className="vs-alert vs-alert--warning">
                <MdErrorOutline size="1.1rem" />
                {error || t('genericError')}
              </div>
            )}

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
                className="bg-[#5A7CE2]"
                loading={loading}
                disabled={loading || submitted}
              >
                {submitted ? t('sentButton') : t('submitButton')}
              </Button>
            </div>
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
                  alt="satellite"
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
          <span className="vs-h2" style={{ textAlign: mobile ? 'center' : 'left' }}>
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
