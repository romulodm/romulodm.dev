import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { isAdminAuthenticated, getSession } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  internalErrorResponse,
  logApiError,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getOtherLocales } from "@/lib/locales";
import { isValidPostId } from "@/lib/s3";
import { slugify, uniqueSlug } from "@/lib/markdown";
import { syncPostToSearch } from "@/lib/search-sync";
import { translatePost } from "@/lib/translate";

export async function GET(request: NextRequest) {
  const t = await getApiTranslator(request);

  try {
    if (!(await isAdminAuthenticated())) {
      return unauthorizedResponse(t("common.unauthorized"));
    }

    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        postTags: { select: { tag: true } },
        translations: {
          select: { locale: true, title: true },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    return internalErrorResponse("admin-posts-list", error, t("common.internalError"));
  }
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const session = await getSession();

  if (!session?.user?.admin) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  const authorId = (session.user as { id: string }).id;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequestResponse(t("common.invalidBody"));
  }

  const {
    id,
    locale,
    translateWithAI,
    title,
    contentMarkdown,
    coverImageUrl,
    tags,
    status,
    youtubeUrl,
    summary,
    readingTime,
  } = body;

  if (!locale || !title || !contentMarkdown) {
    return badRequestResponse(t("posts.missingRequiredFields"));
  }

  // The editor pre-generates the id so uploads made before the first save
  // share the post's media prefix. Without one, Prisma's default applies.
  if (id !== undefined && !isValidPostId(id)) {
    return badRequestResponse(t("common.invalidRequest"));
  }
  const postId = isValidPostId(id) ? id : undefined;

  try {
    const normalizedStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const slug = await uniqueSlug(slugify(String(title)));

    const translations: Array<{
      locale: string;
      title: string;
      contentMarkdown: string;
      summary: string;
      excerpt: string;
    }> = [
      {
        locale: String(locale),
        title: String(title),
        contentMarkdown: String(contentMarkdown),
        summary: typeof summary === "string" ? summary : "",
        excerpt: typeof summary === "string" ? summary : "",
      },
    ];

    if (translateWithAI) {
      const otherLocales = getOtherLocales(String(locale));
      await Promise.all(
        otherLocales.map(async (target) => {
          try {
            const result = await translatePost(
              {
                title: String(title),
                contentMarkdown: String(contentMarkdown),
                summary: typeof summary === "string" ? summary : undefined,
                excerpt: typeof summary === "string" ? summary : undefined,
              },
              String(locale),
              target.code,
            );
            translations.push({
              locale: target.code,
              title: result.title,
              contentMarkdown: result.contentMarkdown,
              summary: result.summary,
              excerpt: result.excerpt,
            });
          } catch (error) {
            logApiError("posts.translate", error, { targetLocale: target.code });
          }
        }),
      );
    }

    const post = await prisma.post.create({
      data: {
        ...(postId ? { id: postId } : {}),
        slug,
        readingTime: typeof readingTime === "number" ? readingTime : 0,
        coverImageUrl: typeof coverImageUrl === "string" ? coverImageUrl : null,
        youtubeUrl: typeof youtubeUrl === "string" ? youtubeUrl : null,
        status: normalizedStatus,
        publishedAt: normalizedStatus === "PUBLISHED" ? new Date() : null,
        authorId,
        postTags: {
          create: Array.isArray(tags)
            ? (tags as string[]).map((tag) => ({ tag }))
            : [],
        },
        translations: {
          create: translations,
        },
      },
      include: {
        translations: true,
        postTags: true,
      },
    });

    // Nao indexa se nasceu como rascunho — a propria funcao decide pelo status.
    await syncPostToSearch(post.id);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return internalErrorResponse("admin-posts-create", error, t("common.internalError"));
  }
}
