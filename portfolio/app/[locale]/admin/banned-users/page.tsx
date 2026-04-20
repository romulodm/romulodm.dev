'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getIntlLocaleCode } from '@/lib/locales';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

interface BannedUser {
  id: string;
  username: string;
  email: string;
  bannedAt: string | null;
  banReason: string | null;
}

interface ApiResponse {
  users: BannedUser[];
  total: number;
  page: number;
  pageSize: number;
}

export default function BannedUsersPage() {
  const t = useTranslations('admin.bannedUsers');
  const locale = useLocale();
  const localeCode = getIntlLocaleCode(locale);

  const [users, setUsers] = useState<BannedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // reason-preview modal
  const [reasonModal, setReasonModal] = useState<{ open: boolean; reason: string | null }>({
    open: false, reason: null,
  });

  const PAGE_SIZE = 20;

  const fetchBanned = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      const res = await fetch(`/api/admin/users/banned?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch banned users', err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanned(page, search); }, [page, search, fetchBanned]);

  // debounce search input
  function handleSearchChange(value: string) {
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, 350);
  }

  async function unban(id: string) {
    await fetch(`/api/admin/users/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned: false }),
    });
    fetchBanned(page, search);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fmt = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat(localeCode, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
      : '—';

  return (
    <main className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Loading */}
      {loading && <p className="text-muted-foreground text-sm">{t('loading')}</p>}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      )}

      {/* Table */}
      {!loading && users.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('table.username')}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">{t('table.email')}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">{t('table.bannedAt')}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="bg-red-950/20 hover:bg-red-950/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-red-400 hidden md:table-cell">{fmt(user.bannedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {user.banReason && (
                        <button
                          onClick={() => setReasonModal({ open: true, reason: user.banReason })}
                          className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          {t('viewReason')}
                        </button>
                      )}
                      <button
                        onClick={() => unban(user.id)}
                        className="rounded border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {t('unban')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {t('pagination.showing', {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, total),
              total,
            })}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-border px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('pagination.previous')}
            </button>
            <span className="px-3 py-1.5">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border px-3 py-1.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Reason preview modal */}
      <Dialog open={reasonModal.open} onOpenChange={(open) => setReasonModal({ open, reason: null })}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>{t('reasonModal.title')}</DialogTitle>
            <DialogDescription>{t('reasonModal.description')}</DialogDescription>
          </DialogHeader>
          <p className="mt-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
            {reasonModal.reason ?? '—'}
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}