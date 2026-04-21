'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';

import { editDonationMessage, deleteDonation } from '@/app/[locale]/admin/donations/actions';
import { MessageModal } from '@/components/support/MessageModal';
import { getIntlLocaleCode } from '@/lib/locales';
import { formatDistanceToNow } from '@/lib/utils';

type Donation = {
  id: string;
  name: string | null;
  message: string | null;
  amount: number;
  coffees: number;
  currency: string;
  status: string;
  isPrivate: boolean;
  provider: string;
  createdAt: Date;
};

type Filter = 'ALL' | 'COMPLETED' | 'PENDING';

interface Props {
  donations: Donation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filter: Filter;
}

type ModalState = { name: string | null; message: string } | null;

export function DonationsTable({ donations, total, page, totalPages, filter }: Props) {
  const t = useTranslations('admin.donationsTable');
  const locale = useLocale();
  const localeCode = getIntlLocaleCode(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalState>(null);

  const statusLabels: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: t('status.completed'), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PENDING: { label: t('status.pending'), cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    FAILED: { label: t('status.failed'), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    EXPIRED: { label: t('status.expired'), cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  };

  const filterOptions: Array<{ value: Filter; label: string }> = [
    { value: 'ALL', label: t('filters.all') },
    { value: 'COMPLETED', label: t('filters.completed') },
    { value: 'PENDING', label: t('filters.pending') },
  ];

  function navigate(newPage: number, newFilter: Filter) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    if (newFilter === 'ALL') params.delete('filter');
    else params.set('filter', newFilter);
    router.push(`${pathname}?${params.toString()}`);
  }

  function startEdit(donation: Donation) {
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
      if (res?.error) setError(res.error);
      else {
        setEditingId(null);
        setError(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return;
    startTransition(async () => {
      await deleteDonation(id);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">{t('title')} <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span></h2>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {filterOptions.map((option) => (
            <button key={option.value} onClick={() => navigate(1, option.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground"><p className="mb-3 text-4xl">☕</p><p className="text-sm">{t('empty')}</p></div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {donations.map((donation) => {
              const badge = statusLabels[donation.status] ?? statusLabels.PENDING;
              const isEditing = editingId === donation.id;
              const amountFmt = donation.currency === 'ETH' ? `${(donation.amount / 1e18).toFixed(4)} ETH` : (donation.amount / 100).toLocaleString(localeCode, { style: 'currency', currency: 'BRL' });

              return (
                <div key={donation.id} className="px-6 py-4 transition-colors hover:bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{donation.name ? donation.name.charAt(0).toUpperCase() : '?'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{donation.name || t('anonymous')}</span>
                        {donation.isPrivate && <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{t('private')}</span>}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(donation.createdAt, locale)}</span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{amountFmt}</span>
                        <span>·</span>
                        <span>{t('coffees', { count: donation.coffees })}</span>
                        <span>·</span>
                        <span>{donation.provider}</span>
                      </div>

                      <div className="mt-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea value={editValue} onChange={(event) => setEditValue(event.target.value.slice(0, 500))} maxLength={500} rows={3} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('messagePlaceholder')} />
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
                          <button onClick={() => setModal({ name: donation.name, message: donation.message! })} className="max-w-full text-left text-xs italic text-muted-foreground transition-colors hover:text-foreground" title={t('viewFullMessage')}>
                            <span className="block max-w-sm truncate">"{donation.message}"</span>
                          </button>
                        ) : (
                          <p className="text-xs italic text-muted-foreground/50">{t('noMessage')}</p>
                        )}
                      </div>
                    </div>
                    {!isEditing && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => startEdit(donation)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title={t('editMessage')}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(donation.id)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" title={t('deleteDonation')}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">{t('page', { page, totalPages })}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(page - 1, filter)} disabled={page <= 1} className="rounded-lg border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => navigate(page + 1, filter)} disabled={page >= totalPages} className="rounded-lg border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      <MessageModal open={modal !== null} onOpenChange={(open) => { if (!open) setModal(null); }} name={modal?.name ?? null} message={modal?.message ?? ''} />
    </div>
  );
}
