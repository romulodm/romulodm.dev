'use client'

import { useRouter, useParams } from 'next/navigation'
import { PostEditor } from '@/components/editor/PostEditor'
import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  contentMarkdown: string
  coverImageUrl: string | null
  tags: string[]
  status: 'DRAFT' | 'PUBLISHED'
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
          if (res.status === 401) {
            router.push('/admin/login')
            return
          }
          throw new Error('Failed to load post')
        }

        const data = await res.json()
        setPost(data)
      } catch (err) {
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
  }) => {
    const res = await fetch(`/api/posts/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      throw new Error('Failed to update post')
    }

    router.push('/admin/posts')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading post...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || 'Post not found'}</div>
      </div>
    )
  }

  return (
    <PostEditor
      initialData={{
        title: post.title,
        contentMarkdown: post.contentMarkdown,
        coverImageUrl: post.coverImageUrl || '',
        tags: post.tags,
      }}
      onSave={handleSave}
      onCancel={() => router.push('/admin/posts')}
    />
  )
}
