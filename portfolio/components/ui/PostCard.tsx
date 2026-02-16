import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'

interface PostCardProps {
  post: {
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    tags: string[]
    publishedAt: Date | null
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
    >
      {post.coverImageUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        {post.tags.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          {post.publishedAt && (
            <span>{formatDistanceToNow(post.publishedAt)}</span>
          )}
          <span className="text-blue-600 group-hover:text-blue-700 font-medium">
            Ler mais →
          </span>
        </div>
      </div>
    </Link>
  )
}
