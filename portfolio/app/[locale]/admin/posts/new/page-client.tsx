'use client'

import { useRouter } from 'next/navigation'
import { PostEditor, type PostEditorData } from '@/components/editor/PostEditor'

export default function NewPostClient({ postId }: { postId: string }) {
    const router = useRouter()

    const handleSave = async (data: PostEditorData) => {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id: postId }),
        })
        if (!res.ok) throw new Error('Failed to create post')
        router.push('/admin/posts')
    }

    return (
        <PostEditor
            postId={postId}
            mode="new"
            onSave={handleSave}
            onCancel={() => router.push('/admin/posts')}
        />
    )
}