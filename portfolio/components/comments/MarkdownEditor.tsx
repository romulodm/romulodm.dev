'use client';

import { useRef, useState } from 'react';
import { Bold, Code, FileCode, Italic, Link as LinkIcon, List, ListOrdered, Quote, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MAX = 2000;

async function renderToHtml(markdown: string): Promise<string> {
  const { unified } = await import('unified');
  const remarkParse = (await import('remark-parse')).default;
  const remarkGfm = (await import('remark-gfm')).default;
  const remarkRehype = (await import('remark-rehype')).default;
  const rehypeHighlight = (await import('rehype-highlight')).default;
  const rehypeSanitize = (await import('rehype-sanitize')).default;
  const rehypeStringify = (await import('rehype-stringify')).default;

  const result = await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeHighlight).use(rehypeSanitize).use(rehypeStringify).process(markdown);
  return result.toString();
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  rows?: number;
  submitLabel?: string;
  isPending?: boolean;
  headerLabel?: React.ReactNode;
  placeholder?: string;
  /**
   * Renders the preview tab. When given, the preview shows the comment as it
   * will appear in the thread (see CommentPreview) instead of bare markdown.
   */
  renderPreview?: (markdown: string) => React.ReactNode;
}

export function MarkdownEditor({ value, onChange, onSubmit, onCancel, autoFocus = false, rows = 6, submitLabel, isPending = false, headerLabel, placeholder, renderPreview }: MarkdownEditorProps) {
  const t = useTranslations('commentsUi.editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [previewHtml, setPreviewHtml] = useState('');
  const remaining = MAX - value.length;

  const tools: Array<{ icon: LucideIcon; label: string; before: string; after: string }> = [
    { icon: Bold, label: t('tools.bold'), before: '**', after: '**' },
    { icon: Italic, label: t('tools.italic'), before: '*', after: '*' },
    { icon: LinkIcon, label: t('tools.link'), before: '[', after: '](url)' },
    { icon: List, label: t('tools.list'), before: '\n- ', after: '' },
    { icon: ListOrdered, label: t('tools.orderedList'), before: '\n1. ', after: '' },
    { icon: Quote, label: t('tools.quote'), before: '\n> ', after: '' },
    { icon: Code, label: t('tools.inlineCode'), before: '`', after: '`' },
    { icon: FileCode, label: t('tools.codeBlock'), before: '\n```\n', after: '\n```\n' },
  ];

  function insert(before: string, after = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const cursor = start + before.length + selected.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }

  async function switchTab(nextTab: 'write' | 'preview') {
    setTab(nextTab);
    if (nextTab === 'preview' && !renderPreview) setPreviewHtml(await renderToHtml(value));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {headerLabel && <div className="flex items-center gap-2 border-b border-border bg-gray-300/30 px-3 py-2 text-xs font-medium text-muted-foreground dark:bg-neutral-800/50">{headerLabel}</div>}

      <div className="flex border-b border-border px-2 pt-1">
        {(['write', 'preview'] as const).map((nextTab) => (
          <button key={nextTab} type="button" onClick={() => switchTab(nextTab)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${tab === nextTab ? 'border-b-2 border-foreground -mb-px text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {nextTab === 'write' ? t('tabs.write') : t('tabs.preview')}
          </button>
        ))}
      </div>

      {tab === 'write' && (
        <div className="flex gap-0.5 border-b border-border bg-gray-300/30 px-2 py-1.5 dark:bg-neutral-800/50">
          {tools.map((tool) => (
            <button key={tool.label} type="button" title={tool.label} onClick={() => insert(tool.before, tool.after)} className="rounded p-1.5 transition-colors hover:bg-gray-300 hover:dark:bg-neutral-800">
              <tool.icon size={16} className="text-gray-700 dark:text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {tab === 'write' ? (
        <textarea ref={textareaRef} value={value} onChange={(event) => onChange(event.target.value)} autoFocus={autoFocus} rows={rows} maxLength={MAX} placeholder={placeholder ?? t('placeholder')} className="w-full resize-none bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none" onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); onSubmit(); }
          if ((event.metaKey || event.ctrlKey) && event.key === 'b') { event.preventDefault(); insert('**', '**'); }
          if ((event.metaKey || event.ctrlKey) && event.key === 'i') { event.preventDefault(); insert('*', '*'); }
          if (event.key === 'Escape' && onCancel) { event.preventDefault(); onCancel(); }
        }} />
      ) : renderPreview ? (
        <div className="min-h-24 px-3 pt-3">
          {value.trim()
            ? renderPreview(value)
            : <span className="text-sm italic text-muted-foreground">{t('nothingToPreview')}</span>}
        </div>
      ) : (
        <div className="prose prose-sm min-h-24 max-w-none px-3 py-2.5 dark:prose-invert prose-p:my-1 prose-headings:mb-1 prose-headings:mt-3 prose-code:rounded prose-code:bg-accent prose-code:px-1 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-ul:my-1 prose-ol:my-1 prose-li:my-0" dangerouslySetInnerHTML={{ __html: previewHtml || `<span class="text-muted-foreground text-sm italic">${t('nothingToPreview')}</span>` }} />
      )}

      <div className="flex items-center justify-between border-t border-border bg-gray-300/30 px-3 py-2 dark:bg-neutral-800/50">
        <span className={`text-xs tabular-nums ${remaining < 50 ? 'text-red-500' : remaining < 150 ? 'text-orange-500' : 'text-muted-foreground'}`}>{t('remaining', { count: remaining })}</span>
        <div className="flex items-center gap-2">
          {onCancel && <button type="button" onClick={onCancel} disabled={isPending} className="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">{t('cancel')}</button>}
          <button type="button" onClick={onSubmit} disabled={isPending || !value.trim()} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {isPending ? <span className="flex items-center gap-1.5"><span className="h-3 w-3 animate-spin rounded-full border-2 border-background/30 border-t-background" />{t('saving')}</span> : submitLabel ?? t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
