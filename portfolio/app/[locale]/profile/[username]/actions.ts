"use server";

import { prisma } from "@romulo/database";
import { getLocale } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AVATAR_SELECT } from "@/lib/avatar";
import { revalidatePath, updateTag } from "next/cache";

import { PROFILE_CACHE_TAG } from "@/lib/cache-tags";

// ── Cached public profile ─────────────────────────────────────────────────────

export const getProfileByUsername = unstable_cache(
    async (username: string) => {
        return prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                ...AVATAR_SELECT,
                email: true,
                createdAt: true,
                banned: true,
                githubUrl: true,
                linkedinUrl: true,
                provider: true,
                _count: { select: { comments: true } },
            },
        });
    },
    [PROFILE_CACHE_TAG],
    { revalidate: 60, tags: [PROFILE_CACHE_TAG] },
);

// ── Comments (paginated) ──────────────────────────────────────────────────────

type ListUserCommentsArgs = {
    userId: string;
    take?: number;
    cursor?: { createdAt: string; id: string } | null;
};

export async function listUserComments({
    userId,
    take = 10,
    cursor = null,
}: ListUserCommentsArgs) {
    const locale = await getLocale();

    const comments = await prisma.comment.findMany({
        where: { authorId: userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor.id } } : {}),
        select: {
            id: true,
            bodyMd: true,
            createdAt: true,
            post: {
                select: {
                    slug: true,
                    translations: {
                        where: { locale },
                        select: { title: true },
                        take: 1,
                    },
                },
            },
            parent: {
                select: {
                    id: true,
                    bodyMd: true,
                    author: { select: { username: true } },
                },
            },
        },
    });

    const hasMore = comments.length > take;
    const items = hasMore ? comments.slice(0, take) : comments;
    const nextCursor = hasMore
        ? {
            id: items[items.length - 1].id,
            createdAt: items[items.length - 1].createdAt.toISOString(),
        }
        : null;

    return { items, nextCursor };
}

// ── Profile settings update ───────────────────────────────────────────────────

export async function updateProfileSettings(data: {
    username?: string;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const userId = (session.user as any).id as string;

    const nextUsername = data.username?.trim();

    // Username uniqueness check
    if (nextUsername) {
        const conflict = await prisma.user.findFirst({
            where: { username: nextUsername, id: { not: userId } },
            select: { id: true },
        });
        if (conflict) return { error: "username_taken" as const };
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(nextUsername ? { username: nextUsername } : {}),
            ...(data.githubUrl !== undefined ? { githubUrl: data.githubUrl } : {}),
            ...(data.linkedinUrl !== undefined ? { linkedinUrl: data.linkedinUrl } : {}),
        },
        select: { username: true },
    });

    // Sem isto a entrada de cache do username antigo sobrevive ate 60s: a URL
    // velha continua renderizando um perfil que ja nao existe e depois passa a
    // 404 sem aviso.
    //
    // `updateTag` e nao `revalidateTag`: aqui e uma Server Action e o usuario
    // acabou de mudar o proprio perfil, entao precisa ver o resultado agora
    // (read-your-own-writes). O `revalidateTag` de um argumento so virou erro de
    // tipo no Next 16.3, e a versao de dois argumentos serve conteudo velho de
    // proposito — o oposto do que se quer depois de um save.
    updateTag(PROFILE_CACHE_TAG);
    revalidatePath(`/`);

    // O client precisa do username final para trocar a URL e pedir um refresh
    // do token do NextAuth, que guarda o username do login.
    return { ok: true as const, username: updated.username };
}

// ── Newsletter locale update ──────────────────────────────────────────────────

export async function updateNewsletterLocale(locale: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const email = session.user.email;
    if (!email) throw new Error("No email on session");

    await prisma.newsletterSubscriber.updateMany({
        where: { email, isConfirmed: true, unsubscribedAt: null },
        data: { preferredLocale: locale },
    });

    return { ok: true };
}

// ── Newsletter subscribe (from profile, email is known) ───────────────────────

export async function subscribeFromProfile() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthorized");

    // Delegate to the newsletter API route logic via fetch
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/subscribe`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
        },
    );

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to subscribe");
    }

    return { ok: true };
}

// ── Wall messages ─────────────────────────────────────────────────────────────

export async function getWallMessages(userId: string) {
    return prisma.wallMessage.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, message: true, theme: true, createdAt: true },
    });
}

// ── Linked donations ──────────────────────────────────────────────────────────

export async function getLinkedDonations(userId: string) {
    return prisma.donation.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            coffees: true,
            amount: true,
            currency: true,
            message: true,
            isPrivate: true,
            createdAt: true,
            provider: true,
        },
    });
}