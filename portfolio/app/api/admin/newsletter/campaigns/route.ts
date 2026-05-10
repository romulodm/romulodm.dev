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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: APP_URL || "https://romulodm.com.br",
  accentColor: "#f57842",
  privacyUrl: `${APP_URL || "https://romulodm.com.br"}/privacy`,
};

function createCampaignSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    type: z.enum(["POST_BASED", "CUSTOM", "DIGEST"]).optional().default("CUSTOM"),
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
        value === undefined ? undefined : sanitizeNewsletterHtml(value, 50000),
      ),
    postId: z.string().trim().optional(),
    postIds: z.array(z.string().trim()).optional(),
  });
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

    // ── DIGEST ──────────────────────────────────────────────────────────────
    if (body.type === "DIGEST") {
      if (!body.postIds || body.postIds.length < 2) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.digestMinPosts"),
        );
      }

      // Valida que todos os posts existem e estão publicados
      const posts = await prisma.post.findMany({
        where: { id: { in: body.postIds }, status: "PUBLISHED" },
        select: { id: true },
      });

      if (posts.length !== body.postIds.length) {
        throw new RequestValidationError(
          t("admin.newsletterCampaigns.digestInvalidPosts"),
        );
      }

      const campaign = await prisma.campaign.create({
        data: {
          type: "DIGEST",
          subject: body.subject,
          previewText: body.previewText,
          // O worker renderiza o template por destinatário na hora do envio,
          // assim como faz com POST_BASED. Não há HTML pré-gerado aqui.
          content: "",
          status: "DRAFT",
          // Persiste a ordem escolhida pelo admin via tabela de relação
          campaignPosts: {
            create: body.postIds.map((postId, order) => ({ postId, order })),
          },
        },
      });

      return NextResponse.json(campaign, { status: 201 });
    }

    // ── POST_BASED ───────────────────────────────────────────────────────────
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
          coverImageUrl: true,
          postTags: { select: { tag: true } },
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
          content: campaignTemplate({
            subject: body.subject,
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
          }),
          postId: post.id,
          status: "DRAFT",
        },
      });

      return NextResponse.json(campaign, { status: 201 });
    }

    // ── CUSTOM ───────────────────────────────────────────────────────────────
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