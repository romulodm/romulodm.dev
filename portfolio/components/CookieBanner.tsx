'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';
import { CookiePolicyModal } from './modals/CookiePolicyModal';

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

type ConsentStatus = 'accepted' | 'declined' | null;

function getConsentCookie(): ConsentStatus {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return value === 'accepted' || value === 'declined' ? value : null;
}

function setConsentCookie(status: 'accepted' | 'declined') {
  document.cookie = `${CONSENT_COOKIE_NAME}=${status}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

function removeNonEssentialCookies() {
  const essential = [CONSENT_COOKIE_NAME, '__next', '__vercel', 'next-auth'];
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (!essential.some((e) => name === e || name.startsWith(e)) && name) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    }
  });
}

interface CookieBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieBanner({ onAccept, onDecline }: CookieBannerProps) {
  const t = useTranslations('cookieBanner');
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getConsentCookie()) setVisible(true);
  }, []);

  const handleAccept = useCallback(() => {
    setConsentCookie('accepted');
    setVisible(false);
    window.dispatchEvent(new Event('cookie-consent-accepted'));
    onAccept?.();
  }, [onAccept]);

  const handleDecline = useCallback(() => {
    setConsentCookie('declined');
    removeNonEssentialCookies();
    setVisible(false);
    onDecline?.();
  }, [onDecline]);

  if (!mounted) return null;

  return (
    <>
      {/* Banner */}
      <div
        role="dialog"
        aria-label={t('ariaLabel')}
        aria-modal="false"
        className={[
          'fixed bottom-5 right-5 z-50 w-[min(480px,calc(100vw-40px))]',
          'rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl',
          'p-5 transition-all duration-300 ease-out',
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-6 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('title')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t('safeExperience')} {t('descriptionPrefix')}{' '}
              <button
                onClick={() => setPolicyOpen(true)}
                className="font-medium text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {t('policyLink')}
              </button>
              .
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            {t('accept')}
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]"
          >
            {t('decline')}
          </button>
        </div>
      </div>

      <CookiePolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}