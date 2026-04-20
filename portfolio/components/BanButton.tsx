'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
    userId: string;
    initialBanned: boolean;
    onSuccess?: () => void;
}

export default function BanButton({ userId, initialBanned, onSuccess }: Props) {
    const t = useTranslations('admin.banButton');
    const [banned, setBanned] = useState(initialBanned);
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleBan() {
        setLoading(true);
        try {
            await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: true, banReason: reason.trim() || undefined }),
            });
            setBanned(true);
            setOpen(false);
            setReason('');
            onSuccess?.();
        } finally {
            setLoading(false);
        }
    }

    async function handleUnban() {
        setLoading(true);
        try {
            await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: false }),
            });
            setBanned(false);
            onSuccess?.();
        } finally {
            setLoading(false);
        }
    }

    if (banned) {
        return (
            <button
                onClick={handleUnban}
                disabled={loading}
                className="shrink-0 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
                {t('unban')}
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
                {t('ban')}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md bg-background border-border">
                    <DialogHeader>
                        <DialogTitle>{t('modal.title')}</DialogTitle>
                        <DialogDescription>{t('modal.description')}</DialogDescription>
                    </DialogHeader>

                    <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('modal.reasonLabel')}
                            <span className="ml-1 text-muted-foreground font-normal">({t('modal.optional')})</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            rows={4}
                            placeholder={t('modal.reasonPlaceholder')}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                        <p className="mt-1 text-right text-xs text-muted-foreground">{reason.length}/500</p>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <button
                            onClick={() => { setOpen(false); setReason(''); }}
                            className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                            {t('modal.cancel')}
                        </button>
                        <button
                            onClick={handleBan}
                            disabled={loading}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? t('modal.banning') : t('modal.confirm')}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}