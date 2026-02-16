'use client'

import { redirect, useRouter } from 'next/navigation'
import { PostEditor } from '@/components/editor/PostEditor'
import { useEffect, useState } from 'react'

export default function NewPostPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/check')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          router.push('/admin/login')
        }
      })
      .catch(() => {
        router.push('/admin/login')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [router])

  const handleSave = async (data: {
    title: string
    contentMarkdown: string
    coverImageUrl: string
    tags: string[]
    status: 'DRAFT' | 'PUBLISHED'
  }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      throw new Error('Failed to create post')
    }

    const post = await res.json()
    
    // Redirect to posts list
    router.push('/admin/posts')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <PostEditor
      onSave={handleSave}
      onCancel={() => router.push('/admin/posts')}
    />
  )
}
