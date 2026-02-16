import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateExcerpt } from '@/lib/markdown'

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { title, contentMarkdown, coverImageUrl, tags, status, canonicalUrl, excerpt } = data

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (title !== undefined) {
      updateData.title = title
      // Regenerate slug if title changed
      if (title !== existingPost.title) {
        let slug = generateSlug(title)
        let counter = 1
        let finalSlug = slug
        while (await prisma.post.findFirst({
          where: { slug: finalSlug, NOT: { id: params.id } }
        })) {
          finalSlug = `${slug}-${counter}`
          counter++
        }
        updateData.slug = finalSlug
      }
    }

    if (contentMarkdown !== undefined) {
      updateData.contentMarkdown = contentMarkdown
      // Regenerate excerpt if content changed
      if (!excerpt) {
        updateData.excerpt = generateExcerpt(contentMarkdown)
      }
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl
    if (tags !== undefined) updateData.tags = tags
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl

    // Handle status change
    if (status !== undefined) {
      updateData.status = status
      // Set publishedAt when first published
      if (status === 'PUBLISHED' && existingPost.status === 'DRAFT') {
        updateData.publishedAt = new Date()
      }
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
