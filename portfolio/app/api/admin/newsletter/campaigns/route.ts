import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import {
  RequestValidationError,
  optionalPlainText,
  parseJsonBody,
  sanitizeHtmlFragment,
  sanitizePlainText,
} from "@/lib/api-validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const createCampaignSchema = z.object({
  type: z.enum(["POST_BASED", "CUSTOM"]).optional().default("CUSTOM"),
  subject: z
    .string()
    .transform((value) => sanitizePlainText(value, 160))
    .refine((value) => value.length > 0, "Assunto e obrigatorio."),
  previewText: z.unknown().optional().transform((value) => optionalPlainText(value, 200)),
  content: z
    .string()
    .optional()
    .transform((value) =>
      value === undefined ? undefined : sanitizeHtmlFragment(value, 50000),
    ),
  postId: z.string().trim().optional(),
});

function buildPostContent(post: {
  title: string;
  summary: string | null;
  slug: string;
}): string {
  const url = `${APP_URL}/blog/${post.slug}`;
  return `
<h2 style="margin:0 0 12px;font-size:22px;color:#111;font-family:sans-serif;">${post.title}</h2>
${post.summary ? `<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;font-family:sans-serif;">${post.summary}</p>` : ""}
<a href="${url}"
   style="display:inline-block;padding:12px 28px;background:#16a34a;color:#ffffff;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;
          font-family:sans-serif;">
  Ler artigo ->
</a>
`.trim();
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
  }

  try {
    const body = await parseJsonBody(req, createCampaignSchema);

    if (body.type === "POST_BASED") {
      if (!body.postId) {
        throw new RequestValidationError(
          "postId e obrigatorio para campanhas baseadas em post.",
        );
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
        return notFoundResponse("Post nao encontrado.");
      }

      if (post.status !== "PUBLISHED") {
        throw new RequestValidationError("So e possivel criar campanhas para posts publicados.");
      }

      const translation = post.translations[0];
      if (!translation) {
        throw new RequestValidationError("Post sem traducao em portugues.");
      }

      const campaign = await prisma.campaign.create({
        data: {
          type: "POST_BASED",
          subject: body.subject,
          previewText: body.previewText,
          content: buildPostContent({
            title: translation.title,
            summary: translation.summary ?? null,
            slug: post.slug,
          }),
          postId: post.id,
          status: "DRAFT",
        },
      });

      return NextResponse.json(campaign, { status: 201 });
    }

    if (!body.content) {
      throw new RequestValidationError(
        "Conteudo e obrigatorio para campanhas personalizadas.",
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
      return validationErrorResponse(error);
    }

    return internalErrorResponse("admin-newsletter-campaigns-create", error);
  }
}
