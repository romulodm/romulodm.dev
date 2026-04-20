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
  sanitizeHtmlFragment,
  sanitizePlainText,
} from "@/lib/api-validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function createCampaignSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    type: z.enum(["POST_BASED", "CUSTOM"]).optional().default("CUSTOM"),
    subject: z
      .string()
      .transform((value) => sanitizePlainText(value, 160))
      .refine((value) => value.length > 0, t("admin.newsletterCampaigns.subjectRequired")),
    previewText: z
      .unknown()
      .optional()
      .transform((value) => optionalPlainText(value, 200)),
    content: z
      .string()
      .optional()
      .transform((value) =>
        value === undefined ? undefined : sanitizeHtmlFragment(value, 50000),
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

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const body = await parseJsonBodyWithMessages(req, createCampaignSchema(t), {
      invalidBodyMessage: t("common.invalidBody"),
      fallbackMessage: t("common.invalidRequest"),
    });

    if (body.type === "POST_BASED") {
      if (!body.postId) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.postIdRequired"));
      }

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

      if (!post) {
        return notFoundResponse(t("admin.newsletterCampaigns.postNotFound"));
      }

      if (post.status !== "PUBLISHED") {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.postMustBePublished"),
        );
      }

      const translation = post.translations[0];
      if (!translation) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.missingPortugueseTranslation"),
        );
      }

      const campaign = await prisma.campaign.create({
        data: {
          type: "POST_BASED",
          subject: body.subject,
          previewText: body.previewText,
          content: buildPostContent(
            {
              title: translation.title,
              summary: translation.summary ?? null,
              slug: post.slug,
            },
            t("admin.newsletterCampaigns.readArticle"),
          ),
          postId: post.id,
          status: "DRAFT",
        },
      });

      return NextResponse.json(campaign, { status: 201 });
    }

    if (!body.content) {
      throw new RequestValidationError(
        t("admin.newsletterCampaigns.customContentRequired"),
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        type: "CUSTOM",
        subject: body.subject,
        previewText: body.previewText,
        content: body.content,
        status: "DRAFT",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-create",
      error,
      t("common.internalError"),
    );
  }
}
