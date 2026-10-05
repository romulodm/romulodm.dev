import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import {
  optionalPlainText,
  parseJsonBodyWithMessages,
  RequestValidationError,
  sanitizePlainText,
} from "@/lib/api-validation";
import { sanitizeNewsletterHtml } from "@/lib/newsletter-html-sanitizer";
import { campaignTemplate, type BrandConfig } from "@romulo/templates";
import {
  buildCampaignTranslations,
  submittedTranslationsSchema,
  translationsToJson,
} from "@/lib/newsletter/campaign-translations.server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: APP_URL || "https://romulodm.dev",
  accentColor: "#f57842",
};

function createUpdateCampaignSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    subject: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined ? undefined : sanitizePlainText(value, 160),
      ),
    previewText: z
      .unknown()
      .optional()
      .transform((value) =>
        value === undefined ? undefined : optionalPlainText(value, 200),
      ),
    content: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined ? undefined : sanitizeNewsletterHtml(value, 50000),
      ),
    postId: z.string().trim().optional(),
    postIds: z.array(z.string().trim()).optional(),
    translations: submittedTranslationsSchema,
  });
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return notFoundResponse(t("admin.newsletterCampaigns.notFound"));
    }
    if (existing.status !== "DRAFT") {
      throw new RequestValidationError(t("admin.newsletterCampaigns.draftOnlyEdit"));
    }

    const body = await parseJsonBodyWithMessages(req, createUpdateCampaignSchema(t), {
      invalidBodyMessage: t("common.invalidBody"),
      fallbackMessage: t("common.invalidRequest"),
    });
    const updateData: Record<string, unknown> = {};

    if (body.subject !== undefined) {
      if (!body.subject) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.subjectRequired"));
      }
      updateData.subject = body.subject;
    }
    if (body.previewText !== undefined) {
      updateData.previewText = body.previewText;
    }

    if (existing.type === "POST_BASED" && body.postId && body.postId !== existing.postId) {
      const post = await prisma.post.findUnique({
        where: { id: body.postId },
        select: {
          id: true,
          slug: true,
          status: true,
          coverImageUrl: true,
          postTags: { select: { tag: true } },
          translations: {
            where: { locale: "pt" },
            select: { title: true, summary: true },
            take: 1,
          },
        },
      });

      if (!post || post.status !== "PUBLISHED") {
        throw new RequestValidationError(t("admin.newsletterCampaigns.invalidPost"));
      }

      const translation = post.translations[0];
      if (!translation) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.missingPortugueseTranslation"),
        );
      }

      const subject = (updateData.subject as string | undefined) ?? existing.subject;

      updateData.postId = post.id;
      updateData.content = campaignTemplate({
        subject,
        post: {
          imageUrl: post.coverImageUrl ?? undefined,
          title: translation.title,
          summary: translation.summary ?? undefined,
          tags: post.postTags.map((pt) => pt.tag),
          url: `${APP_URL}/pt/blog/${post.slug}`,
        },
        unsubscribeUrl: "{{unsubscribeUrl}}",
        trackingPixelUrl: "{{trackingPixelUrl}}",
        brand: BRAND,
        recipient: { displayName: "{{displayName}}", locale: "pt" },
      });
    } else if (existing.type === "CUSTOM" && body.content !== undefined) {
      if (!body.content) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.customContentRequired"),
        );
      }
      updateData.content = body.content;
    }

    // DIGEST: the form sends the full ordered list on every save. Without this
    // branch, reordering, adding or removing posts on an existing draft was
    // silently dropped by the schema.
    let digestPostIds: string[] | undefined;
    if (existing.type === "DIGEST" && body.postIds !== undefined) {
      const uniqueIds = [...new Set(body.postIds)];
      if (uniqueIds.length < 2) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.digestMinPosts"));
      }
      const published = await prisma.post.count({
        where: { id: { in: uniqueIds }, status: "PUBLISHED" },
      });
      if (published !== uniqueIds.length) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.digestInvalidPosts"));
      }
      digestPostIds = uniqueIds;
    }

    const { translations, translationFailed } = await buildCampaignTranslations({
      type: existing.type,
      source: {
        subject: (updateData.subject as string | undefined) ?? existing.subject,
        previewText:
          body.previewText !== undefined ? body.previewText : existing.previewText,
      },
      stored: existing.translations,
      submitted: body.translations,
    });
    updateData.translations = translationsToJson(translations);

    const updated = await prisma.$transaction(async (tx) => {
      if (digestPostIds) {
        await tx.campaignPost.deleteMany({ where: { campaignId: params.id } });
        await tx.campaignPost.createMany({
          data: digestPostIds.map((postId, order) => ({
            campaignId: params.id,
            postId,
            order,
          })),
        });
      }
      return tx.campaign.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    return NextResponse.json({ ...updated, translationFailed });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-update",
      error,
      t("common.internalError"),
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return notFoundResponse(t("admin.newsletterCampaigns.notFound"));
    }
    if (existing.status === "SENDING") {
      throw new RequestValidationError(t("admin.newsletterCampaigns.cannotDeleteSending"));
    }

    await prisma.campaign.delete({ where: { id: params.id } });
    return NextResponse.json({ message: t("admin.newsletterCampaigns.deleted") });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-delete",
      error,
      t("common.internalError"),
    );
  }
}