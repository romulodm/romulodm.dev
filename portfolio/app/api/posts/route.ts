import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateExcerpt } from '@/lib/markdown'

// GET /api/posts - List posts (admin only)
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('List posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { title, contentMarkdown, coverImageUrl, tags, status, canonicalUrl } = data

    if (!title || !contentMarkdown) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    let slug = generateSlug(title)
    
    // Check if slug exists, add number if needed
    let counter = 1
    let finalSlug = slug
    while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    // Generate excerpt if not provided
    const excerpt = data.excerpt || generateExcerpt(contentMarkdown)

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        contentMarkdown,
        coverImageUrl: coverImageUrl || null,
        tags: tags || [],
        status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        canonicalUrl: canonicalUrl || null,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
