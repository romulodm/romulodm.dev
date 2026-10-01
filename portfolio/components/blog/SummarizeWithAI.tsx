'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { RiClaudeFill, RiGrokAiFill, RiOpenaiFill, RiPerplexityFill } from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * "Summarize with AI": opens the reader's assistant of choice with a prompt
 * that asks it to read this post and summarize it.
 *
 * Nothing here calls an AI API. The site only builds a link; the summary is
 * produced by the reader's own account on the provider they pick. That keeps
 * the feature free to run and keeps the post text off any third-party API.
 *
 * HOW THE PROMPT REACHES EACH PROVIDER
 * Every provider listed here accepts a prefilled prompt in the URL (`?q=`).
 * That is the selection criterion: Gemini and DeepSeek were left out because
 * their web apps ignore query parameters and would open an empty chat. The
 * prompt is also copied to the clipboard on every click, so a provider that
 * silently drops `?q=` in the future still leaves the reader one paste away
 * from it.
 *
 * WHY THE URL COMES FROM `window.location`
 * The post URL is read at click time (origin + pathname, no query or hash),
 * so each locale sends its own page and no prop has to be threaded through
 * the server component. On localhost the link points at localhost, which no
 * AI can open; that is expected and only matters in development.
 *
 * THE `#resumir` ANCHOR
 * A post body can link to `#resumir` (e.g. "too long? get the TL;DR") to open
 * this dialog. Markdown cannot trigger client code on its own, so the
 * instance that sets `listenForAnchor` intercepts clicks on those links.
 * Only one instance per page may listen: the sidebar and the mobile bar are
 * both mounted (one is hidden with CSS), and two listeners would open two
 * dialogs on top of each other.
 */

export const SUMMARIZE_ANCHOR = '#resumir';

interface Provider {
  id: 'chatgpt' | 'claude' | 'grok' | 'perplexity';
  name: string;
  Icon: IconType;
  /** Brand tint for the icon; undefined keeps the current text color. */
  color?: string;
  href: (prompt: string) => string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    Icon: RiOpenaiFill,
    href: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`,
  },
  {
    id: 'claude',
    name: 'Claude',
    Icon: RiClaudeFill,
    color: '#D97757',
    href: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`,
  },
  {
    id: 'grok',
    name: 'Grok',
    Icon: RiGrokAiFill,
    href: (p) => `https://grok.com/?q=${encodeURIComponent(p)}`,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    Icon: RiPerplexityFill,
    color: '#20808D',
    href: (p) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`,
  },
];

function currentPostUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard access can be refused (insecure context, permissions, the
    // page losing focus). The prompt is still visible in the dialog, so a
    // failed copy needs no message of its own.
    return false;
  }
}

interface Props {
  variant: 'sidebar' | 'inline';
  /** Set on exactly one instance per page. See the note on `#resumir`. */
  listenForAnchor?: boolean;
}

export function SummarizeWithAI({ variant, listenForAnchor = false }: Props) {
  const t = useTranslations('blogUi.summarize');
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const openDialog = useCallback(() => {
    setPrompt(t('prompt', { url: currentPostUrl() }));
    setCopied(false);
    setOpen(true);
  }, [t]);

  useEffect(() => {
    if (!listenForAnchor) return;

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.(`a[href="${SUMMARIZE_ANCHOR}"]`);
      if (!link) return;
      event.preventDefault();
      openDialog();
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [listenForAnchor, openDialog]);

  function handleProvider(provider: Provider) {
    // The copy is started before window.open on purpose: the new tab takes
    // focus, and browsers refuse clipboard writes from an unfocused page.
    void copyToClipboard(prompt).then((ok) => ok && setCopied(true));
    window.open(provider.href(prompt), '_blank', 'noopener,noreferrer');
  }

  async function handleCopy() {
    if (await copyToClipboard(prompt)) setCopied(true);
  }

  const trigger =
    variant === 'sidebar' ? (
      <button
        type="button"
        onClick={openDialog}
        className="flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary"
        aria-label={t('buttonAria')}
      >
        <Sparkles size={20} />
        <span className="text-xs">{t('button')}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={openDialog}
        className="flex items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-primary"
        aria-label={t('buttonAria')}
      >
        <Sparkles size={15} />
        <span className="text-xs">{t('button')}</span>
      </button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('title')}
            </DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleProvider(provider)}
                className={cn(
                  'group flex flex-col items-center justify-center gap-2 rounded-lg border border-border px-3 py-4',
                  'transition-colors hover:border-primary/60 hover:bg-muted/60',
                )}
              >
                <provider.Icon size={28} style={provider.color ? { color: provider.color } : undefined} />
                <span className="text-sm font-medium">{provider.name}</span>
              </button>
            ))}
          </div>

          <details className="group rounded-lg border border-border text-sm">
            <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground hover:text-foreground">
              {t('showPrompt')}
            </summary>
            <div className="border-t border-border p-3">
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                {prompt}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          </details>

          <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
