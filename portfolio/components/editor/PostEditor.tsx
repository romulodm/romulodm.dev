'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { EditorToolbar } from './EditorToolbar'
import { TagInput } from './TagInput'
import { MarkdownPreview } from './MarkdownPreview'

interface PostEditorProps {
  initialData?: {
    title?: string
    contentMarkdown?: string
    coverImageUrl?: string
    tags?: string[]
    youtubeUrl?: string
    summary?: string
    readingTime?: number
  }
  onSave: (data: {
    title: string
    contentMarkdown: string
    coverImageUrl: string
    tags: string[]
    status: 'DRAFT' | 'PUBLISHED'
    youtubeUrl: string
    summary: string
    readingTime: number
  }) => Promise<void>
  onCancel?: () => void
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export function PostEditor({ initialData, onSave, onCancel }: PostEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file')
      setCoverImageUrl(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
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
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file')
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageMarkdown = `![Image description](${publicUrl})`
        setContentMarkdown(
          contentMarkdown.substring(0, start) + imageMarkdown + contentMarkdown.substring(end)
        )
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length)
        }, 0)
      }
    } catch (error) {
      console.error('Upload error:', error)
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
      await onSave({ title, contentMarkdown, coverImageUrl, tags, status, youtubeUrl, summary, readingTime })
    } catch (error) {
      console.error('Save error:', error)
      alert('Falha ao salvar o post. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const youtubePreviewId = extractYoutubeId(youtubeUrl)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {initialData?.title ? 'Editar Post' : 'Novo Post'}
          </h1>
          <div className="flex items-center gap-2">
            {(['edit', 'preview'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === m
                  ? 'bg-accent text-foreground'
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
        {mode === 'edit' ? (
          <div className="bg-card rounded-lg shadow-sm border border-border">

            {/* Cover Image */}
            <div className="p-6 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-3">Imagem de capa</p>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 text-sm text-foreground transition-colors"
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
            {isSaving ? 'Publicando...' : 'Publicar'}
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 border border-border rounded-md hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
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