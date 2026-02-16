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
  }
  onSave: (data: {
    title: string
    contentMarkdown: string
    coverImageUrl: string
    tags: string[]
    status: 'DRAFT' | 'PUBLISHED'
  }) => Promise<void>
  onCancel?: () => void
}

export function PostEditor({ initialData, onSave, onCancel }: PostEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [title, setTitle] = useState(initialData?.title || '')
  const [contentMarkdown, setContentMarkdown] = useState(initialData?.contentMarkdown || '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // 1. Get presigned URL
      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          kind: 'cover',
        }),
      })

      if (!presignRes.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await presignRes.json()

      // 2. Upload file directly to MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file')
      }

      // 3. Save public URL
      setCoverImageUrl(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInlineImageUpload = async (file: File) => {
    try {
      setIsUploading(true)

      const presignRes = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          kind: 'inline',
        }),
      })

      if (!presignRes.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await presignRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file')
      }

      // Insert image markdown at cursor
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = contentMarkdown
        const before = text.substring(0, start)
        const after = text.substring(end)
        const imageMarkdown = `![Image description](${publicUrl})`
        
        setContentMarkdown(before + imageMarkdown + after)
        
        // Set cursor after inserted image
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(
            start + imageMarkdown.length,
            start + imageMarkdown.length
          )
        }, 0)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!contentMarkdown.trim()) {
      alert('Please enter some content')
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        title,
        contentMarkdown,
        coverImageUrl,
        tags,
        status,
      })
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save post. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Create Post</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('edit')}
              className={`px-4 py-2 rounded-md font-medium ${
                mode === 'edit'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-4 py-2 rounded-md font-medium ${
                mode === 'preview'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {mode === 'edit' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Cover Image */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Cover Image'}
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
                  <img
                    src={coverImageUrl}
                    alt="Cover"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="p-6">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New post title here..."
                className="w-full text-5xl font-bold placeholder-gray-400 focus:outline-none resize-none"
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
                placeholder="Write your post content here..."
                className="w-full min-h-[500px] font-mono text-base focus:outline-none resize-none"
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
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isSaving ? 'Publishing...' : 'Publish'}
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving || isUploading}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Save draft
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSaving || isUploading}
              className="px-6 py-3 text-gray-600 hover:text-gray-900"
            >
              Revert changes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
