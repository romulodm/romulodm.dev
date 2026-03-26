// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { prisma } from "@romulo/database";
import { generateSlug, generateExcerpt } from "@/lib/markdown";
import { requireAdmin } from "@/lib/auth";

// GET /api/posts - List posts (admin only)
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        postTags: { select: { tag: true } },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("List posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
    }

    const userId = (auth.session.user as any).id as string;

    const data = await request.json();
    const { title, summary, readingTime, contentMarkdown, coverImageUrl, youtubeUrl, tags, status, canonicalUrl, excerpt } = data;

    if (!title || !contentMarkdown) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(title);
    let counter = 1;
    let finalSlug = slug;
    while (await prisma.post.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const resolvedExcerpt = excerpt || generateExcerpt(contentMarkdown);
    const isPublished = status === "PUBLISHED";

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: resolvedExcerpt,
        contentMarkdown,
        coverImageUrl: coverImageUrl || null,
        summary: summary || null,
        readingTime: readingTime || 0,
        youtubeUrl: youtubeUrl || null,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        publishedAt: isPublished ? new Date() : null,
        canonicalUrl: canonicalUrl || null,
        authorId: userId,
        // Create PostTag rows in the same transaction
        postTags: tags?.length
          ? { create: (tags as string[]).map((tag) => ({ tag: tag.trim().toLowerCase() })) }
          : undefined,
      },
      include: { postTags: { select: { tag: true } } },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}