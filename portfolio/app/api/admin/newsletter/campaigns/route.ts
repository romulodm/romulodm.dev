// src/app/api/admin/newsletter/campaigns/route.ts
//
// POST /api/admin/newsletter/campaigns  → create campaign (DRAFT)
//
// Supports two types:
//   type: "POST_BASED"  — generates content from a linked post (title + summary + link)
//   type: "CUSTOM"      — free-form HTML content provided by the admin
//

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { prisma } from "@romulo/database";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

// ── Template: generates the inner HTML body for a post-based campaign ─────────

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

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    let body: {
        type?: string;
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

    const type = body.type === "POST_BASED" ? "POST_BASED" : "CUSTOM";
    const subject = (body.subject ?? "").trim();

    if (!subject) {
        return NextResponse.json({ error: "Assunto é obrigatório." }, { status: 400 });
    }

    // ── POST_BASED path ────────────────────────────────────────────────────────

    if (type === "POST_BASED") {
        const postId = body.postId;
        if (!postId) {
            return NextResponse.json({ error: "postId é obrigatório para campanhas baseadas em post." }, { status: 400 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, title: true, summary: true, slug: true, status: true },
        });

        if (!post) {
            return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
        }
        if (post.status !== "PUBLISHED") {
            return NextResponse.json({ error: "Só é possível criar campanhas para posts publicados." }, { status: 400 });
        }

        const content = buildPostContent(post);

        const campaign = await prisma.campaign.create({
            data: {
                type: "POST_BASED",
                subject,
                previewText: (body.previewText ?? "").trim() || null,
                content,
                postId: post.id,
                status: "DRAFT",
            },
        });

        return NextResponse.json(campaign, { status: 201 });
    }

    // ── CUSTOM path ────────────────────────────────────────────────────────────

    const content = (body.content ?? "").trim();
    if (!content) {
        return NextResponse.json({ error: "Conteúdo é obrigatório para campanhas personalizadas." }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
        data: {
            type: "CUSTOM",
            subject,
            previewText: (body.previewText ?? "").trim() || null,
            content,
            status: "DRAFT",
        },
    });

    return NextResponse.json(campaign, { status: 201 });
}
