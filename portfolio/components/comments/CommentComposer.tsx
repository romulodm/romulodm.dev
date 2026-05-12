'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

import { MarkdownEditor } from '@/components/comments/MarkdownEditor';
import { useAuthGuard } from '@/hooks/auth-guard';

interface CommentComposerProps {
  postId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentComposer({ postId, parentId = null, onSuccess, onCancel, autoFocus = false }: CommentComposerProps) {
  const t = useTranslations('commentsUi.composer');
  const { data: session } = useSession();
  const { guard } = useAuthGuard();
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    guard(async () => {
      if (!body.trim()) return;
      setError(null);

      startTransition(async () => {
        try {
          const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, parentId, bodyMd: body.trim() }),
          });

          if (res.status === 429) {
            toast.error(t('tooManyComments'));
            return;
          }
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? t('publishError'));
          }

          setBody('');
          toast.success(t('published'));
          onSuccess?.();
        } catch (e: any) {
          setError(e.message ?? t('publishCommentError'));
        }
      });
    });
  }

  if (!session) {
    return (
      <div
        className="cursor-pointer rounded-lg border border-dashed border-border p-5 text-center transition-colors hover:bg-primary/30"
        onClick={() => guard(() => { })}
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground underline underline-offset-2">{t('loginAction')}</span>{' '}
          {t('loginPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <MarkdownEditor
        value={body}
        onChange={setBody}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        autoFocus={autoFocus}
        rows={parentId ? 4 : 6}
        submitLabel={parentId ? t('reply') : t('comment')}
        isPending={isPending}
      />
      {error && <p className="mt-1 px-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}