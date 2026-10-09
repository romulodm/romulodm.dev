'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PostEditor, saveError, type PostEditorData } from '@/components/editor/PostEditor'
import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { LocaleCode } from '@/lib/locales'

interface PostTranslation {
    locale: string
    title: string
    contentMarkdown: string
    summary: string | null
    excerpt: string | null
    canonicalUrl: string | null
}

interface PostWithTranslations {
    id: string
    slug: string
    coverImageUrl: string | null
    youtubeUrl: string | null
    readingTime: number
    publishedAt: string | null
    status: 'DRAFT' | 'PUBLISHED'
    postTags: { tag: string }[]
    translations: PostTranslation[]
}

export default function EditPostClient() {
    const t = useTranslations('admin.postEditor.errors')
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()

    const [post, setPost] = useState<PostWithTranslations | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    // locale comes from ?locale=pt-BR or defaults to first translation
    const [selectedLocale, setSelectedLocale] = useState<LocaleCode | null>(
        (searchParams.get('locale') as LocaleCode) ?? null,
    )

    useEffect(() => {
        const loadPost = async () => {
            try {
                const res = await fetch(`/api/posts/${params.id}`)
                if (!res.ok) {
                    if (res.status === 401) { router.push('/'); return }
                    throw new Error('Failed to load post')
                }
                const data: PostWithTranslations = await res.json()
                setPost(data)
                // Default to first translation locale if not set via URL
                if (!selectedLocale && data.translations.length > 0) {
                    setSelectedLocale(data.translations[0].locale as LocaleCode)
                }
            } catch (error) {
                setError(t('load'))
                console.error('Error loading post:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadPost()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, t])

    const handleLocaleChange = useCallback(
        (locale: LocaleCode) => {
            setSelectedLocale(locale)
            // Optionally update URL so refresh preserves locale
            const url = new URL(window.location.href)
            url.searchParams.set('locale', locale)
            window.history.replaceState(null, '', url.toString())
        },
        [],
    )

    const handleSave = async (data: PostEditorData) => {
        const res = await fetch(`/api/posts/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locale: selectedLocale,
                title: data.title,
                contentMarkdown: data.contentMarkdown,
                summary: data.summary,
                youtubeUrl: data.youtubeUrl,
                coverImageUrl: data.coverImageUrl,
                tags: data.tags,
                status: data.status,
                readingTime: data.readingTime,
                translateWithAI: data.translateWithAI,
                slug: data.slug,
            }),
        })
        if (!res.ok) throw await saveError(res)
        router.push('/admin/posts')
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <span className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !post || !selectedLocale) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <p className="text-destructive">{error || t('notFound')}</p>
            </div>
        )
    }

    const activeTranslation = post.translations.find((t) => t.locale === selectedLocale)

    return (
        <PostEditor
            key={selectedLocale}
            postId={post.id}
            mode="edit"
            existingTranslations={post.translations.map((t) => ({ locale: t.locale, title: t.title }))}
            selectedLocale={selectedLocale}
            onLocaleChange={handleLocaleChange}
            initialData={{
                title: activeTranslation?.title ?? '',
                contentMarkdown: activeTranslation?.contentMarkdown ?? '',
                coverImageUrl: post.coverImageUrl ?? '',
                tags: post.postTags.map((pt) => pt.tag),
                youtubeUrl: post.youtubeUrl ?? '',
                summary: activeTranslation?.summary ?? '',
                readingTime: post.readingTime,
                slug: post.slug,
                publishedAt: post.publishedAt,
            }}
            onSave={handleSave}
            onCancel={() => router.push('/admin/posts')}
        />
    )
}