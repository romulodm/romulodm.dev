'use client'

import { useRouter, useParams } from 'next/navigation'
import { PostEditor } from '@/components/editor/PostEditor'
import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  contentMarkdown: string
  coverImageUrl: string | null
  youtubeUrl: string | null
  summary: string | null
  readingTime: number
  status: 'DRAFT' | 'PUBLISHED'
  postTags: { tag: string }[]
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetch(`/api/posts/${params.id}`)
        if (!res.ok) {
          if (res.status === 401) { router.push('/'); return }
          throw new Error('Failed to load post')
        }
        setPost(await res.json())
      } catch {
        setError('Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }
    loadPost()
  }, [params.id, router])

  const handleSave = async (data: {
    title: string
    contentMarkdown: string
    coverImageUrl: string
    tags: string[]
    status: 'DRAFT' | 'PUBLISHED'
    youtubeUrl: string
    summary: string
    readingTime: number
  }) => {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update post')
    router.push('/admin/posts')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error || 'Post not found'}</p>
      </div>
    )
  }

  return (
    <PostEditor
      initialData={{
        title: post.title,
        contentMarkdown: post.contentMarkdown,
        coverImageUrl: post.coverImageUrl ?? '',
        tags: post.postTags.map((pt) => pt.tag), // ← era post.tags (não existe)
        youtubeUrl: post.youtubeUrl ?? '',
        summary: post.summary ?? '',
        readingTime: post.readingTime,
      }}
      onSave={handleSave}
      onCancel={() => router.push('/admin/posts')}
    />
  )
}