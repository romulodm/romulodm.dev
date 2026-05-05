'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { ChevronDown, Languages, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { TagInput } from './TagInput';
import { SUPPORTED_LOCALES, getOtherLocales, type LocaleCode } from '@/lib/locales';

export interface PostEditorData {
  locale: LocaleCode;
  translateWithAI: boolean;
  title: string;
  contentMarkdown: string;
  coverImageUrl: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  youtubeUrl: string;
  summary: string;
  readingTime: number;
}

interface ExistingTranslation {
  locale: string;
  title: string;
}

interface PostEditorProps {
  mode?: 'new' | 'edit';
  existingTranslations?: ExistingTranslation[];
  selectedLocale?: LocaleCode;
  onLocaleChange?: (locale: LocaleCode) => void;
  initialData?: {
    title?: string;
    contentMarkdown?: string;
    coverImageUrl?: string;
    tags?: string[];
    youtubeUrl?: string;
    summary?: string;
    readingTime?: number;
  };
  onSave: (data: PostEditorData) => Promise<void>;
  onCancel?: () => void;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function NewPostLocaleBar({
  locale,
  translateWithAI,
  onLocaleChange,
  onToggleAI,
}: {
  locale: LocaleCode;
  translateWithAI: boolean;
  onLocaleChange: (locale: LocaleCode) => void;
  onToggleAI: () => void;
}) {
  const t = useTranslations('admin.postEditor');
  const others = getOtherLocales(locale);

  return (
    <div className="p-6 border-b border-border bg-muted/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{t('locale.postLanguage')}</span>
        <div className="relative">
          <select
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as LocaleCode)}
            className="appearance-none pl-3 pr-8 py-1.5 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {SUPPORTED_LOCALES.map((supportedLocale) => (
              <option key={supportedLocale.code} value={supportedLocale.code}>
                {supportedLocale.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {others.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={onToggleAI}
            className={`relative w-9 h-5 rounded-full transition-colors ${translateWithAI ? 'bg-primary' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${translateWithAI ? 'translate-x-4' : ''}`}
            />
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm text-foreground">{t('locale.translateWithAi')}</span>
          {translateWithAI && (
            <span className="text-xs text-muted-foreground">
              {"-> "}{others.map((item) => item.flag + ' ' + item.shortLabel).join(', ')}
            </span>
          )}
        </label>
      )}
    </div>
  );
}

function EditLocaleTabs({
  existingTranslations,
  selectedLocale,
  onLocaleChange,
  translateWithAI,
  onToggleAI,
}: {
  existingTranslations: ExistingTranslation[];
  selectedLocale: string;
  onLocaleChange: (locale: LocaleCode) => void;
  translateWithAI: boolean;
  onToggleAI: () => void;
}) {
  const t = useTranslations('admin.postEditor');
  const existingCodes = existingTranslations.map((tr) => tr.locale);
  const missingLocales = SUPPORTED_LOCALES.filter(
    (l) => !existingCodes.includes(l.code),
  );

  return (
    <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap">
      <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground mr-1">{t('locale.translation')}</span>
      {existingTranslations.map((translation) => {
        const meta = SUPPORTED_LOCALES.find((item) => item.code === translation.locale);
        const isActive = translation.locale === selectedLocale;
        return (
          <button
            key={translation.locale}
            onClick={() => onLocaleChange(translation.locale as LocaleCode)}
            title={translation.title}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isActive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              }`}
          >
            {meta?.flag} {meta?.shortLabel ?? translation.locale}
          </button>
        );
      })}
      <span className="text-xs text-muted-foreground ml-1">
        - {t('locale.editing')}:{' '}
        <strong>{SUPPORTED_LOCALES.find((item) => item.code === selectedLocale)?.label}</strong>
      </span>

      {/* Toggle de tradução — só aparece se há locales sem tradução */}
      {missingLocales.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
          <div
            onClick={onToggleAI}
            className={`relative w-9 h-5 rounded-full transition-colors ${translateWithAI ? 'bg-primary' : 'bg-border'
              }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${translateWithAI ? 'translate-x-4' : ''
                }`}
            />
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-sm text-foreground">{t('locale.translateWithAi')}</span>
          {translateWithAI && (
            <span className="text-xs text-muted-foreground">
              {'-> '}{missingLocales.map((l) => l.flag + ' ' + l.shortLabel).join(', ')}
            </span>
          )}
        </label>
      )}
    </div>
  );
}

export function PostEditor({
  mode = 'new',
  existingTranslations = [],
  selectedLocale,
  onLocaleChange,
  initialData,
  onSave,
  onCancel,
}: PostEditorProps) {
  const t = useTranslations('admin.postEditor');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [locale, setLocale] = useState<LocaleCode>(
    selectedLocale ?? (SUPPORTED_LOCALES[0].code as LocaleCode),
  );
  const [translateWithAI, setTranslateWithAI] = useState(false);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [contentMarkdown, setContentMarkdown] = useState(initialData?.contentMarkdown ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl ?? '');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl ?? '');
  const [youtubeError, setYoutubeError] = useState('');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [readingTime, setReadingTime] = useState<number>(initialData?.readingTime ?? 0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocaleSelect = (code: LocaleCode) => {
    setLocale(code);
    if (mode === 'edit' && onLocaleChange) onLocaleChange(code);
  };

  const handleYoutubeChange = (value: string) => {
    setYoutubeUrl(value);
    if (value && !extractYoutubeId(value)) {
      setYoutubeError(t('errors.invalidYoutube'));
    } else {
      setYoutubeError('');
    }
  };

  const handleCoverImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, kind: 'cover' }),
      });
      if (!presignRes.ok) throw new Error(t('errors.upload'));

      const { uploadUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);

      setCoverImageUrl(publicUrl);
    } catch {
      alert(t('errors.upload'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInlineImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, kind: 'inline' }),
      });
      if (!presignRes.ok) throw new Error(t('errors.upload'));

      const { uploadUrl, publicUrl } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imageMarkdown = `![${t('content.imageAlt')}](${publicUrl})`;
        setContentMarkdown(
          contentMarkdown.substring(0, start) + imageMarkdown + contentMarkdown.substring(end),
        );
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
        }, 0);
      }
    } catch {
      alert(t('errors.upload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert(t('errors.titleRequired'));
      return;
    }
    if (!contentMarkdown.trim()) {
      alert(t('errors.contentRequired'));
      return;
    }
    if (youtubeUrl && youtubeError) {
      alert(t('errors.invalidYoutubeShort'));
      return;
    }

    try {
      setIsSaving(true);
      setSavingLabel(
        translateWithAI && mode === 'new'
          ? t('saving.translating')
          : status === 'PUBLISHED'
            ? t('saving.publishing')
            : t('saving.saving'),
      );
      await onSave({
        locale,
        translateWithAI,
        title,
        contentMarkdown,
        coverImageUrl,
        tags,
        status,
        youtubeUrl,
        summary,
        readingTime,
      });
    } catch {
      alert(t('errors.save'));
    } finally {
      setIsSaving(false);
      setSavingLabel('');
    }
  };

  const youtubePreviewId = extractYoutubeId(youtubeUrl);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {mode === 'edit' ? t('title.edit') : t('title.new')}
          </h1>
          <div className="flex items-center gap-2">
            {(['edit', 'preview'] as const).map((currentMode) => (
              <button
                key={currentMode}
                onClick={() => setEditorMode(currentMode)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${editorMode === currentMode
                  ? 'bg-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'}`}
              >
                {currentMode === 'edit' ? t('mode.edit') : t('mode.preview')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {editorMode === 'edit' ? (
          <div className="bg-card rounded-lg shadow-sm border border-border">
            {mode === 'new' ? (
              <NewPostLocaleBar
                locale={locale}
                translateWithAI={translateWithAI}
                onLocaleChange={handleLocaleSelect}
                onToggleAI={() => setTranslateWithAI((value) => !value)}
              />
            ) : (
              existingTranslations.length > 0 && (
                <EditLocaleTabs
                  existingTranslations={existingTranslations}
                  selectedLocale={selectedLocale ?? locale}
                  onLocaleChange={handleLocaleSelect}
                  translateWithAI={translateWithAI}
                  onToggleAI={() => setTranslateWithAI((v) => !v)}
                />
              )
            )}

            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-3">{t('cover.title')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 border border-border rounded-md hover:bg-primary disabled:opacity-50 text-sm text-foreground transition-colors"
                >
                  {isUploading ? t('cover.uploading') : t('cover.upload')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
              </div>
              {coverImageUrl && (
                <div className="mt-4 relative">
                  <img src={coverImageUrl} alt={t('cover.alt')} className="w-full h-64 object-cover rounded-lg" />
                  <button
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 text-sm"
                  >
                    {t('cover.remove')}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">
                {t('youtube.title')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
              </p>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(event) => handleYoutubeChange(event.target.value)}
                placeholder={t('youtube.placeholder')}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${youtubeError ? 'border-destructive' : 'border-border'}`}
              />
              {youtubeError && <p className="mt-1 text-xs text-destructive">{youtubeError}</p>}
              {youtubePreviewId && !youtubeError && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">{t('youtube.preview')}</p>
                  <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                      title={t('youtube.previewTitle')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
              {youtubeUrl && youtubePreviewId && (
                <button
                  onClick={() => { setYoutubeUrl(''); setYoutubeError(''); }}
                  className="mt-2 text-xs text-destructive hover:opacity-80"
                >
                  {t('youtube.remove')}
                </button>
              )}
            </div>

            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-1">
                {t('summary.title')} <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
              </p>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t('summary.placeholder')}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
              />
              <p className={`text-xs mt-1 text-right ${500 - summary.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {t('summary.remaining', { count: 500 - summary.length })}
              </p>
            </div>

            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-1">
                {t('readingTime.title')} <span className="text-muted-foreground font-normal">({t('readingTime.unit')})</span>
              </p>
              <input
                type="number"
                min={0}
                max={999}
                value={readingTime}
                onChange={(event) => setReadingTime(Math.max(0, parseInt(event.target.value, 10) || 0))}
                className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="p-6">
              <textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('title.placeholder')}
                className="w-full text-5xl font-bold placeholder:text-muted-foreground text-foreground bg-transparent focus:outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="px-6 pb-4">
              <TagInput tags={tags} onChange={setTags} maxTags={4} />
            </div>

            <EditorToolbar
              textareaRef={textareaRef}
              contentMarkdown={contentMarkdown}
              setContentMarkdown={setContentMarkdown}
              onImageUpload={handleInlineImageUpload}
              isUploading={isUploading}
            />

            <div className="p-6">
              <textarea
                ref={textareaRef}
                value={contentMarkdown}
                onChange={(event) => setContentMarkdown(event.target.value)}
                placeholder={t('content.placeholderEditor')}
                className="w-full min-h-[500px] font-mono text-base bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              />
            </div>
          </div>
        ) : (
          <MarkdownPreview
            title={title}
            contentMarkdown={contentMarkdown}
            coverImageUrl={coverImageUrl}
            tags={tags}
          />
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 font-medium transition-opacity"
          >
            {isSaving && savingLabel ? savingLabel : t('actions.publish')}
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 border border-border rounded-md hover:bg-primary disabled:opacity-50 text-foreground transition-colors"
          >
            {t('actions.saveDraft')}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSaving || isUploading}
              className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('actions.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
