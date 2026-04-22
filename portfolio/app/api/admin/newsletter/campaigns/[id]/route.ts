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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

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
  });
}

function buildPostContent(
  post: { title: string; summary: string | null; slug: string },
  readArticleLabel: string,
): string {
  const url = `${APP_URL}/blog/${post.slug}`;
  return `
<h2 style="margin:0 0 12px;font-size:22px;color:#111;font-family:sans-serif;">${post.title}</h2>
${post.summary ? `<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;font-family:sans-serif;">${post.summary}</p>` : ""}
<a href="${url}"
   style="display:inline-block;padding:12px 28px;background:#16a34a;color:#ffffff;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;
          font-family:sans-serif;">
  ${readArticleLabel}
</a>
`.trim();
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

      updateData.postId = post.id;
      updateData.content = buildPostContent(
        {
          title: translation.title,
          summary: translation.summary ?? null,
          slug: post.slug,
        },
        t("admin.newsletterCampaigns.readArticle"),
      );
    } else if (existing.type === "CUSTOM" && body.content !== undefined) {
      if (!body.content) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.customContentRequired"),
        );
      }
      updateData.content = body.content;
    }

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
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
