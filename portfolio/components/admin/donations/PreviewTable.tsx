'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Check, Clock, Pencil, Trophy, X } from 'lucide-react';

import { editDonationMessage } from '@/app/[locale]/admin/donations/actions';
import { MessageModal } from '@/components/support/MessageModal';
import { getIntlLocaleCode } from '@/lib/locales';
import { formatDistanceToNow } from '@/lib/utils';

type PreviewDonation = {
  id: string;
  name: string | null;
  message: string | null;
  amount: number;
  coffees: number;
  createdAt: Date;
  currency: string;
};

interface Props {
  title: string;
  subtitle: string;
  icon: 'trophy' | 'clock';
  donations: PreviewDonation[];
}

type ModalState = { name: string | null; message: string } | null;

export function PreviewTable({ title, subtitle, icon, donations }: Props) {
  const t = useTranslations('admin.donationsPreview');
  const locale = useLocale();
  const localeCode = getIntlLocaleCode(locale);
  const Icon = icon === 'trophy' ? Trophy : Clock;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalState>(null);

  function startEdit(donation: PreviewDonation) {
    setEditingId(donation.id);
    setEditValue(donation.message ?? '');
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
    setError(null);
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const res = await editDonationMessage(id, editValue);
      if (res && 'error' in res && res.error) setError(res.error);
      else {
        setEditingId(null);
        setError(null);
      }
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="h-4 w-4 text-muted-foreground" />{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>

        {donations.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ol className="divide-y divide-border">
            {donations.map((donation, index) => {
              const isEditing = editingId === donation.id;
              const amountFmt = donation.currency === 'ETH' ? `${(donation.amount / 1e18).toFixed(4)} ETH` : (donation.amount / 100).toLocaleString(localeCode, { style: 'currency', currency: 'BRL' });
              return (
                <li key={donation.id} className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {icon === 'trophy' ? <span className={`w-6 shrink-0 text-xs font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>#{index + 1}</span> : <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{donation.name ? donation.name.charAt(0).toUpperCase() : '?'}</div>
                    <span className="flex-1 truncate text-sm text-foreground">{donation.name || t('anonymous')}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(donation.createdAt, locale)}</span>
                    <span className="shrink-0 text-sm font-semibold text-foreground">{amountFmt}</span>
                    {!isEditing && <button onClick={() => startEdit(donation)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title={t('editMessage')}><Pencil className="h-3.5 w-3.5" /></button>}
                  </div>

                  <div className="ml-[60px] mt-1.5">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea value={editValue} onChange={(event) => setEditValue(event.target.value.slice(0, 500))} maxLength={500} rows={2} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('messagePlaceholder')} autoFocus />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{editValue.length}/500</span>
                          {error && <span className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle className="h-3 w-3" />{error}</span>}
                          <div className="ml-auto flex gap-2">
                            <button onClick={cancelEdit} disabled={isPending} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"><X className="h-3 w-3" /> {t('cancel')}</button>
                            <button onClick={() => saveEdit(donation.id)} disabled={isPending} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-green-700 disabled:opacity-50"><Check className="h-3 w-3" />{isPending ? t('saving') : t('save')}</button>
                          </div>
                        </div>
                      </div>
                    ) : donation.message ? (
                      <button onClick={() => setModal({ name: donation.name, message: donation.message! })} className="max-w-full text-left text-xs italic text-muted-foreground transition-colors hover:text-foreground" title={t('viewFullMessage')}><span className="block max-w-xs truncate">"{donation.message}"</span></button>
                    ) : (
                      <p className="text-xs italic text-muted-foreground/40">{t('noMessage')}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <MessageModal open={modal !== null} onOpenChange={(open) => { if (!open) setModal(null); }} name={modal?.name ?? null} message={modal?.message ?? ''} />
    </>
  );
}
