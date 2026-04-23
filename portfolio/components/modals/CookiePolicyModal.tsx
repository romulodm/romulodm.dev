'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CookiePolicyModalProps {
  open: boolean;
  onClose: () => void;
}

interface Section {
  titleKey: string;
  bodyKey: string;
}

const SECTIONS: Section[] = [
  { titleKey: 'sections.whatAreCookies.title', bodyKey: 'sections.whatAreCookies.body' },
  { titleKey: 'sections.essential.title', bodyKey: 'sections.essential.body' },
  { titleKey: 'sections.performance.title', bodyKey: 'sections.performance.body' },
  { titleKey: 'sections.functionality.title', bodyKey: 'sections.functionality.body' },
  { titleKey: 'sections.targeting.title', bodyKey: 'sections.targeting.body' },
  { titleKey: 'sections.manage.title', bodyKey: 'sections.manage.body' },
];

export function CookiePolicyModal({ open, onClose }: CookiePolicyModalProps) {
  const t = useTranslations('legal.cookiePolicy');
  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-background border-border p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="flex-row items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold text-foreground leading-tight">
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {t('updatedAt')}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[60vh] px-5 py-4 space-y-5">
          {SECTIONS.map(({ titleKey, bodyKey }) => (
            <div key={titleKey}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                {t(titleKey as any)}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(bodyKey as any)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <Button
            onClick={handleClose}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}