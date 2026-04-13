'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { EditorToolbar } from './EditorToolbar'
import { TagInput } from './TagInput'
import { MarkdownPreview } from './MarkdownPreview'
import { SUPPORTED_LOCALES, getOtherLocales, type LocaleCode } from '@/lib/locales'
import { Languages, Sparkles, ChevronDown } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostEditorData {
  locale: LocaleCode
  translateWithAI: boolean
  title: string
  contentMarkdown: string
  coverImageUrl: string
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
  youtubeUrl: string
  summary: string
  readingTime: number
}

interface ExistingTranslation {
  locale: string
  title: string
}

interface PostEditorProps {
  /** 'new' = creating; 'edit' = editing a specific translation */
  mode?: 'new' | 'edit'
  /** Translations that already exist for this post (edit mode) */
  existingTranslations?: ExistingTranslation[]
  /** Currently selected locale */
  selectedLocale?: LocaleCode
  /** Called when user switches locale in edit mode */
  onLocaleChange?: (locale: LocaleCode) => void
  initialData?: {
    title?: string
    contentMarkdown?: string
    coverImageUrl?: string
    tags?: string[]
    youtubeUrl?: string
    summary?: string
    readingTime?: number
  }
  onSave: (data: PostEditorData) => Promise<void>
  onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Locale selector for NEW posts — single locale + AI translation toggle */
function NewPostLocaleBar({
  locale,
  translateWithAI,
  onLocaleChange,
  onToggleAI,
}: {
  locale: LocaleCode
  translateWithAI: boolean
  onLocaleChange: (l: LocaleCode) => void
  onToggleAI: () => void
}) {
  const others = getOtherLocales(locale)
  const current = SUPPORTED_LOCALES.find((l) => l.code === locale)!

  return (
    <div className="p-6 border-b border-border bg-muted/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Primary locale selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Idioma do post:</span>
        <div className="relative">
          <select
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value as LocaleCode)}
            className="appearance-none pl-3 pr-8 py-1.5 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* AI Translation toggle */}
      {others.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
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
          <span className="text-sm text-foreground">Traduzir com IA</span>
          {translateWithAI && (
            <span className="text-xs text-muted-foreground">
              → {others.map((l) => l.flag + ' ' + l.shortLabel).join(', ')}
            </span>
          )}
        </label>
      )}
    </div>
  )
}

/** Locale switcher tabs for EDIT mode */
function EditLocaleTabs({
  existingTranslations,
  selectedLocale,
  onLocaleChange,
}: {
  existingTranslations: ExistingTranslation[]
  selectedLocale: string
  onLocaleChange: (l: LocaleCode) => void
}) {
  return (
    <div className="p-3 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap">
      <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground mr-1">Tradução:</span>
      {existingTranslations.map((t) => {
        const meta = SUPPORTED_LOCALES.find((l) => l.code === t.locale)
        const isActive = t.locale === selectedLocale
        return (
          <button
            key={t.locale}
            onClick={() => onLocaleChange(t.locale as LocaleCode)}
            title={t.title}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${isActive
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'
              }`}
          >
            {meta?.flag} {meta?.shortLabel ?? t.locale}
          </button>
        )
      })}
      <span className="text-xs text-muted-foreground ml-1">
        — editando: <strong>{SUPPORTED_LOCALES.find((l) => l.code === selectedLocale)?.label}</strong>
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PostEditor({
  mode = 'new',
  existingTranslations = [],
  selectedLocale,
  onLocaleChange,
  initialData,
  onSave,
  onCancel,
}: PostEditorProps) {
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit')
  const [locale, setLocale] = useState<LocaleCode>(
    selectedLocale ?? (SUPPORTED_LOCALES[0].code as LocaleCode),
  )
  const [translateWithAI, setTranslateWithAI] = useState(false)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [contentMarkdown, setContentMarkdown] = useState(initialData?.contentMarkdown ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl ?? '')
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl ?? '')
  const [youtubeError, setYoutubeError] = useState('')
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [readingTime, setReadingTime] = useState<number>(initialData?.readingTime ?? 0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savingLabel, setSavingLabel] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLocaleSelect = (code: LocaleCode) => {
    setLocale(code)
    if (mode === 'edit' && onLocaleChange) onLocaleChange(code)
  }

  const handleYoutubeChange = (value: string) => {
    setYoutubeUrl(value)
    if (value && !extractYoutubeId(value)) {
      setYoutubeError('Link inválido. Use um link do YouTube (ex: https://youtu.be/xxxxx)')
    } else {
      setYoutubeError('')
    }
  }

  const handleCoverImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, kind: 'cover' }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignRes.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setCoverImageUrl(publicUrl)
    } catch {
      alert('Falha ao fazer upload da imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleInlineImageUpload = async (file: File) => {
    try {
      setIsUploading(true)
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, kind: 'inline' }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignRes.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageMarkdown = `![Image description](${publicUrl})`
        setContentMarkdown(
          contentMarkdown.substring(0, start) + imageMarkdown + contentMarkdown.substring(end),
        )
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(
            start + imageMarkdown.length,
            start + imageMarkdown.length,
          )
        }, 0)
      }
    } catch {
      alert('Falha ao fazer upload da imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) { alert('Por favor, insira um título'); return }
    if (!contentMarkdown.trim()) { alert('Por favor, insira o conteúdo do post'); return }
    if (youtubeUrl && youtubeError) { alert('O link do YouTube é inválido.'); return }
    try {
      setIsSaving(true)
      setSavingLabel(
        translateWithAI && mode === 'new'
          ? 'Gerando traduções com IA...'
          : status === 'PUBLISHED'
            ? 'Publicando...'
            : 'Salvando...',
      )
      await onSave({
        locale,
        translateWithAI: mode === 'new' ? translateWithAI : false,
        title,
        contentMarkdown,
        coverImageUrl,
        tags,
        status,
        youtubeUrl,
        summary,
        readingTime,
      })
    } catch {
      alert('Falha ao salvar o post. Tente novamente.')
    } finally {
      setIsSaving(false)
      setSavingLabel('')
    }
  }

  const youtubePreviewId = extractYoutubeId(youtubeUrl)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {mode === 'edit' ? 'Editar Post' : 'Novo Post'}
          </h1>
          <div className="flex items-center gap-2">
            {(['edit', 'preview'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setEditorMode(m)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${editorMode === m
                  ? 'bg-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {m === 'edit' ? 'Editar' : 'Preview'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {editorMode === 'edit' ? (
          <div className="bg-card rounded-lg shadow-sm border border-border">
            {/* Locale bar */}
            {mode === 'new' ? (
              <NewPostLocaleBar
                locale={locale}
                translateWithAI={translateWithAI}
                onLocaleChange={handleLocaleSelect}
                onToggleAI={() => setTranslateWithAI((v) => !v)}
              />
            ) : (
              existingTranslations.length > 0 && (
                <EditLocaleTabs
                  existingTranslations={existingTranslations}
                  selectedLocale={selectedLocale ?? locale}
                  onLocaleChange={handleLocaleSelect}
                />
              )
            )}

            {/* Cover Image */}
            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-3">Imagem de capa</p>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 border border-border rounded-md hover:bg-primary disabled:opacity-50 text-sm text-foreground transition-colors"
                >
                  {isUploading ? 'Enviando...' : 'Upload imagem de capa'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
              </div>
              {coverImageUrl && (
                <div className="mt-4 relative">
                  <img src={coverImageUrl} alt="Cover" className="w-full h-64 object-cover rounded-lg" />
                  <button
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 text-sm"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* YouTube Video */}
            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">
                Vídeo do YouTube <span className="text-muted-foreground font-normal">(opcional)</span>
              </p>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => handleYoutubeChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=xxxxx"
                className={`w-full px-3 py-2 border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${youtubeError ? 'border-destructive' : 'border-border'
                  }`}
              />
              {youtubeError && <p className="mt-1 text-xs text-destructive">{youtubeError}</p>}
              {youtubePreviewId && !youtubeError && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                      title="YouTube preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
              {youtubeUrl && youtubePreviewId && (
                <button
                  onClick={() => { setYoutubeUrl(''); setYoutubeError('') }}
                  className="mt-2 text-xs text-destructive hover:opacity-80"
                >
                  Remover vídeo
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-1">
                Resumo <span className="text-muted-foreground font-normal">(opcional)</span>
              </p>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Uma breve descrição do que o leitor vai encontrar neste post..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground"
              />
              <p className={`text-xs mt-1 text-right ${500 - summary.length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {500 - summary.length} restantes
              </p>
            </div>

            {/* Reading Time */}
            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-1">
                Tempo de leitura <span className="text-muted-foreground font-normal">(minutos)</span>
              </p>
              <input
                type="number"
                min={0}
                max={999}
                value={readingTime}
                onChange={(e) => setReadingTime(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Title */}
            <div className="p-6">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do post..."
                className="w-full text-5xl font-bold placeholder:text-muted-foreground text-foreground bg-transparent focus:outline-none resize-none"
                rows={2}
              />
            </div>

            {/* Tags */}
            <div className="px-6 pb-4">
              <TagInput tags={tags} onChange={setTags} maxTags={4} />
            </div>

            {/* Toolbar */}
            <EditorToolbar
              textareaRef={textareaRef}
              contentMarkdown={contentMarkdown}
              setContentMarkdown={setContentMarkdown}
              onImageUpload={handleInlineImageUpload}
              isUploading={isUploading}
            />

            {/* Content Editor */}
            <div className="p-6">
              <textarea
                ref={textareaRef}
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Escreva o conteúdo do post aqui..."
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

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 font-medium transition-opacity"
          >
            {isSaving && savingLabel ? savingLabel : 'Publicar'}
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 border border-border rounded-md hover:bg-primary disabled:opacity-50 text-foreground transition-colors"
          >
            Salvar rascunho
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSaving || isUploading}
              className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
