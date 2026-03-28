// src/app/api/admin/newsletter/campaigns/[id]/route.ts
//
// PATCH  /api/admin/newsletter/campaigns/:id  → update draft campaign
// DELETE /api/admin/newsletter/campaigns/:id  → delete campaign (non-SENDING)
//

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { prisma } from "@romulo/database";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function buildPostContent(post: {
    title: string;
    summary: string | null;
    slug: string;
}): string {
    const url = `${APP_URL}/blog/${post.slug}`;
    return `
<h2 style="margin:0 0 12px;font-size:22px;color:#111;font-family:sans-serif;">${post.title}</h2>
${post.summary
            ? `<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;font-family:sans-serif;">${post.summary}</p>`
            : ""
        }
<a href="${url}"
   style="display:inline-block;padding:12px 28px;background:#16a34a;color:#ffffff;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;
          font-family:sans-serif;">
  Ler artigo →
</a>
`.trim();
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
        return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }
    if (existing.status !== "DRAFT") {
        return NextResponse.json({ error: "Apenas rascunhos podem ser editados." }, { status: 400 });
    }

    let body: {
        subject?: string;
        previewText?: string;
        content?: string;
        postId?: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.subject !== undefined) updateData.subject = body.subject.trim();
    if (body.previewText !== undefined) updateData.previewText = body.previewText.trim() || null;

    // For POST_BASED campaigns: regenerate content if postId changed
    if (existing.type === "POST_BASED" && body.postId && body.postId !== existing.postId) {
        const post = await prisma.post.findUnique({
            where: { id: body.postId },
            select: { id: true, title: true, summary: true, slug: true, status: true },
        });
        if (!post || post.status !== "PUBLISHED") {
            return NextResponse.json({ error: "Post inválido ou não publicado." }, { status: 400 });
        }
        updateData.postId = post.id;
        updateData.content = buildPostContent(post);
    } else if (existing.type === "CUSTOM" && body.content !== undefined) {
        updateData.content = body.content.trim();
    }

    const updated = await prisma.campaign.update({
        where: { id: params.id },
        data: updateData,
    });

    return NextResponse.json(updated);
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } },
) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const existing = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!existing) {
        return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }
    if (existing.status === "SENDING") {
        return NextResponse.json({ error: "Não é possível excluir uma campanha em envio." }, { status: 400 });
    }

    await prisma.campaign.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Campanha excluída." });
}
