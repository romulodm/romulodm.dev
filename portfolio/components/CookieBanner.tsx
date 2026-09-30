'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';
import { CookiePolicyModal } from './modals/CookiePolicyModal';
import { readConsent, writeConsent } from '@/lib/consent';

interface CookieBannerProps {
  onAccept?: () => void;
  onEssentialOnly?: () => void;
}

// GA4 measurement is always on (legitimate interest, see lib/consent.ts). The
// two buttons only decide Google signals, and the copy says so explicitly: a
// banner that implies analytics can be refused while it keeps running would be
// the misleading-choice problem the ANPD cookie guide warns about.
export function CookieBanner({ onAccept, onEssentialOnly }: CookieBannerProps) {
  const t = useTranslations('cookieBanner');
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!readConsent()) setVisible(true);
  }, []);

  const handleAccept = useCallback(() => {
    writeConsent('all');
    setVisible(false);
    onAccept?.();
  }, [onAccept]);

  const handleEssentialOnly = useCallback(() => {
    writeConsent('essential');
    setVisible(false);
    onEssentialOnly?.();
  }, [onEssentialOnly]);

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
              {t('description')} {t('descriptionPrefix')}{' '}
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
            onClick={handleEssentialOnly}
            className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]"
          >
            {t('essentialOnly')}
          </button>
        </div>
      </div>

      <CookiePolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}