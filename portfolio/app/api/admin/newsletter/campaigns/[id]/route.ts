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

const updateCampaignSchema = z.object({
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
  }

  try {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return notFoundResponse("Campanha nao encontrada.");
    }
    if (existing.status !== "DRAFT") {
      throw new RequestValidationError("Apenas rascunhos podem ser editados.");
    }

    const body = await parseJsonBody(req, updateCampaignSchema);
    const updateData: Record<string, unknown> = {};

    if (body.subject !== undefined) {
      if (!body.subject) {
        throw new RequestValidationError("Assunto e obrigatorio.");
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
        throw new RequestValidationError("Post invalido ou nao publicado.");
      }

      const translation = post.translations[0];
      if (!translation) {
        throw new RequestValidationError("Post sem traducao em portugues.");
      }

      updateData.postId = post.id;
      updateData.content = buildPostContent({
        title: translation.title,
        summary: translation.summary ?? null,
        slug: post.slug,
      });

    } else if (existing.type === "CUSTOM" && body.content !== undefined) {
      if (!body.content) {
        throw new RequestValidationError("Conteudo e obrigatorio para campanhas personalizadas.");
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
      return validationErrorResponse(error);
    }

    return internalErrorResponse("admin-newsletter-campaigns-update", error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
  }

  try {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
      return notFoundResponse("Campanha nao encontrada.");
    }
    if (existing.status === "SENDING") {
      throw new RequestValidationError("Nao e possivel excluir uma campanha em envio.");
    }

    await prisma.campaign.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Campanha excluida." });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse("admin-newsletter-campaigns-delete", error);
  }
}
