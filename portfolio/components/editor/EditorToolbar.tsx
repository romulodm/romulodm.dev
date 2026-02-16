'use client'

import { RefObject, useRef, ChangeEvent } from 'react'
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  FileCode,
  Image,
} from 'lucide-react'

interface EditorToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>
  contentMarkdown: string
  setContentMarkdown: (content: string) => void
  onImageUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export function EditorToolbar({
  textareaRef,
  contentMarkdown,
  setContentMarkdown,
  onImageUpload,
  isUploading,
}: EditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = contentMarkdown.substring(start, end)
    const text = contentMarkdown

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    
    setContentMarkdown(newText)

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onImageUpload(file)
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const tools = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => insertMarkdown('**', '**'),
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => insertMarkdown('*', '*'),
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertMarkdown('[', '](url)'),
    },
    {
      icon: List,
      label: 'Unordered List',
      action: () => insertMarkdown('\n- ', ''),
    },
    {
      icon: ListOrdered,
      label: 'Ordered List',
      action: () => insertMarkdown('\n1. ', ''),
    },
    {
      icon: Heading2,
      label: 'Heading',
      action: () => insertMarkdown('\n## ', ''),
    },
    {
      icon: Quote,
      label: 'Quote',
      action: () => insertMarkdown('\n> ', ''),
    },
    {
      icon: Code,
      label: 'Inline Code',
      action: () => insertMarkdown('`', '`'),
    },
    {
      icon: FileCode,
      label: 'Code Block',
      action: () => insertMarkdown('\n```\n', '\n```\n'),
    },
    {
      icon: Image,
      label: 'Upload Image',
      action: () => imageInputRef.current?.click(),
      disabled: isUploading,
    },
  ]

  return (
    <div className="border-t border-b border-gray-200 bg-gray-50 p-2">
      <div className="flex gap-1">
        {tools.map((tool, index) => (
          <button
            key={index}
            onClick={tool.action}
            disabled={tool.disabled}
            title={tool.label}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <tool.icon size={18} className="text-gray-700" />
          </button>
        ))}
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  )
}
