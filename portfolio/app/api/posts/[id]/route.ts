import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { getOtherLocales } from "@/lib/locales";
import { translatePost } from "@/lib/translate";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  internalErrorResponse,
  logApiError,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { slugify, uniqueSlug, generateExcerpt } from "@/lib/markdown";
import { deletePostMedia } from "@/lib/s3";
import { removePostFromSearch, syncPostToSearch } from "@/lib/search-sync";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;

  try {
    if (!(await isAdminAuthenticated())) {
      return unauthorizedResponse(t("common.unauthorized"));
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        postTags: { select: { tag: true } },
        translations: {
          select: {
            locale: true,
            title: true,
            contentMarkdown: true,
            summary: true,
            excerpt: true,
            canonicalUrl: true,
          },
        },
      },
    });

    if (!post) {
      return notFoundResponse(t("posts.notFound"));
    }

    return NextResponse.json(post);
  } catch (error) {
    return internalErrorResponse("admin-posts-get", error, t("common.internalError"));
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(request);
  const params = await props.params;

  try {
    if (!(await isAdminAuthenticated())) {
      return unauthorizedResponse(t("common.unauthorized"));
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse(t("common.invalidBody"));
    }

    const {
      locale,
      title,
      contentMarkdown,
      coverImageUrl,
      youtubeUrl,
      tags,
      status,
      canonicalUrl,
      summary,
      readingTime,
      translateWithAI,
    } = body;

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
      include: { translations: { where: { locale: String(locale) } } },
    });

    if (!existingPost) {
      return notFoundResponse(t("posts.notFound"));
    }

    // Build the top-level post update payload (fields shared across all locales)
    const postUpdate: Record<string, unknown> = {};
    if (readingTime !== undefined) postUpdate.readingTime = readingTime ?? 0;
    if (coverImageUrl !== undefined) postUpdate.coverImageUrl = coverImageUrl || null;
    if (youtubeUrl !== undefined) postUpdate.youtubeUrl = youtubeUrl || null;
    if (status !== undefined) {
      postUpdate.status = status;
      // Stamp publishedAt only on the first DRAFT → PUBLISHED transition
      if (status === "PUBLISHED" && existingPost.status === "DRAFT") {
        postUpdate.publishedAt = new Date();
      }
    }

    const existingTranslation = existingPost.translations[0];

    // Regenerate the slug only when the title actually changes
    if (title !== undefined && title !== existingTranslation?.title) {
      postUpdate.slug = await uniqueSlug(slugify(String(title)), params.id);
    }

    // Build the locale-specific translation update payload
    const translationUpdate: Record<string, unknown> = {};
    if (title !== undefined) translationUpdate.title = title;
    if (contentMarkdown !== undefined) {
      translationUpdate.contentMarkdown = contentMarkdown;
      translationUpdate.excerpt = generateExcerpt(String(contentMarkdown));
    }
    if (summary !== undefined) translationUpdate.summary = summary || null;
    if (canonicalUrl !== undefined) translationUpdate.canonicalUrl = canonicalUrl || null;

    // Persist all core changes atomically: post metadata, translation, and tags
    await prisma.$transaction(async (tx) => {
      if (Object.keys(postUpdate).length > 0) {
        await tx.post.update({ where: { id: params.id }, data: postUpdate });
      }

      if (Object.keys(translationUpdate).length > 0) {
        if (existingTranslation) {
          await tx.postTranslation.update({
            where: { postId_locale: { postId: params.id, locale: String(locale) } },
            data: translationUpdate,
          });
        } else {
          // First time saving this locale — create the translation row
          await tx.postTranslation.create({
            data: {
              postId: params.id,
              locale: String(locale),
              title: title ? String(title) : "",
              contentMarkdown: contentMarkdown ? String(contentMarkdown) : "",
              summary: summary ? String(summary) : null,
              excerpt: contentMarkdown ? generateExcerpt(String(contentMarkdown)) : null,
              canonicalUrl: canonicalUrl ? String(canonicalUrl) : null,
            },
          });
        }
      }

      // Replace tags wholesale: delete existing ones and re-insert
      if (tags !== undefined) {
        await tx.postTag.deleteMany({ where: { postId: params.id } });
        if (Array.isArray(tags) && tags.length > 0) {
          await tx.postTag.createMany({
            data: tags.map((tag) => ({
              postId: params.id,
              tag: String(tag).trim().toLowerCase(),
            })),
          });
        }
      }
    });

    // Generate AI translations for any locale that doesn't have one yet.
    // Runs after the main transaction so a translation failure never rolls
    // back the user's actual save. allSettled ensures one failure doesn't
    // cancel the remaining locales.
    if (translateWithAI && locale && title && contentMarkdown) {
      const existingLocales = await prisma.postTranslation.findMany({
        where: { postId: params.id },
        select: { locale: true },
      });
      const existingCodes = new Set(existingLocales.map((tr) => tr.locale));
      const missingLocales = getOtherLocales(String(locale)).filter(
        (l) => !existingCodes.has(l.code),
      );

      await Promise.allSettled(
        missingLocales.map(async (target) => {
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
            await prisma.postTranslation.create({
              data: {
                postId: params.id,
                locale: target.code,
                title: result.title,
                contentMarkdown: result.contentMarkdown,
                summary: result.summary ?? null,
                excerpt: result.excerpt ?? null,
              },
            });
          } catch (error) {
            logApiError("posts.translate", error, { postId: params.id, targetLocale: target.code });
          }
        }),
      );
    }

    const updated = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        postTags: { select: { tag: true } },
        translations: {
          select: {
            locale: true,
            title: true,
            contentMarkdown: true,
            summary: true,
            excerpt: true,
            canonicalUrl: true,
          },
        },
      },
    });

    // Cobre os dois sentidos: publicar indexa, despublicar remove. Tambem
    // reindexa quando so o conteudo mudou — titulo e resumo entram no indice.
    await syncPostToSearch(params.id);

    return NextResponse.json(updated);
  } catch (error) {
    return internalErrorResponse("admin-posts-update", error, t("common.internalError"));
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;

  try {
    if (!(await isAdminAuthenticated())) {
      return unauthorizedResponse(t("common.unauthorized"));
    }

    // Os locales precisam ser lidos ANTES do delete: as traducoes somem em
    // cascata e depois nao ha como saber quais documentos remover do indice.
    const translations = await prisma.postTranslation.findMany({
      where: { postId: params.id },
      select: { locale: true },
    });

    await prisma.post.delete({ where: { id: params.id } });

    await removePostFromSearch(
      params.id,
      translations.map((tr) => tr.locale),
    );

    // The post is already gone at this point, so a storage failure must not
    // turn the response into an error. Leftover objects stay findable under
    // posts/<id>/ and can be removed by hand.
    try {
      await deletePostMedia(params.id);
    } catch (error) {
      logApiError("admin-posts-delete.media", error, { postId: params.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalErrorResponse("admin-posts-delete", error, t("common.internalError"));
  }
}
