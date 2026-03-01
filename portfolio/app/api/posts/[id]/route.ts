// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateExcerpt } from "@/lib/markdown";

// GET /api/posts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: { postTags: { select: { tag: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/posts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, contentMarkdown, coverImageUrl, tags, status, canonicalUrl, excerpt } = data;

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      if (title !== existingPost.title) {
        let slug = generateSlug(title);
        let counter = 1;
        let finalSlug = slug;
        while (
          await prisma.post.findFirst({
            where: { slug: finalSlug, NOT: { id: params.id } },
          })
        ) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      }
    }

    if (contentMarkdown !== undefined) {
      updateData.contentMarkdown = contentMarkdown;
      if (!excerpt) updateData.excerpt = generateExcerpt(contentMarkdown);
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl;

    if (status !== undefined) {
      updateData.status = status;
      if (status === "PUBLISHED" && existingPost.status === "DRAFT") {
        updateData.publishedAt = new Date();
      }
    }

    // Handle tags: delete all existing, re-create
    // We do this in a transaction to keep it atomic
    const [post] = await prisma.$transaction([
      prisma.post.update({
        where: { id: params.id },
        data: updateData,
        include: { postTags: { select: { tag: true } } },
      }),
      ...(tags !== undefined
        ? [
          prisma.postTag.deleteMany({ where: { postId: params.id } }),
          ...(tags as string[]).map((tag) =>
            prisma.postTag.create({
              data: { postId: params.id, tag: tag.trim().toLowerCase() },
            })
          ),
        ]
        : []),
    ]);

    // Re-fetch after tag update so response is consistent
    const updated = await prisma.post.findUnique({
      where: { id: params.id },
      include: { postTags: { select: { tag: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.post.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}