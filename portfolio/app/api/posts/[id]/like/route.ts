import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { routing } from "@/i18n/routing";
import { blogPostCacheTag } from "@/lib/cache-tags";

import { requireAuth } from "@/lib/auth-helpers";
import {
  internalErrorResponse,
  logApiError,
  rateLimitResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAuth();

  if (!auth.ok) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  const postId = params.id;
  const userId = auth.user.id;

  try {
    const limited = await rateLimit(
      `posts:like:${userId}:${postId}:${getRequestIp(req)}`,
      30,
      60,
    );
    if (limited) {
      return rateLimitResponse(t("common.rateLimited"));
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existing) {
        await tx.postLike.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          select: { likes: true, slug: true },
        });
        return { liked: false, likes: Math.max(0, updated.likes), slug: updated.slug };
      }

      await tx.postLike.create({ data: { postId, userId } });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
        select: { likes: true, slug: true },
      });
      return { liked: true, likes: updated.likes, slug: updated.slug };
    });

    revalidatePostPage(result.slug);

    return NextResponse.json({ liked: result.liked, likes: result.likes });
  } catch (error) {
    return internalErrorResponse("posts-like", error, t("common.internalError"));
  }
}

/**
 * Live like state of a post for the current visitor: `{ liked, likes }`.
 *
 * The post page is cached and shared by everyone, so the count baked into its
 * HTML can be minutes old and it can never say whether this visitor liked the
 * post. The page preloads this URL (see lib/post-like-state.ts) and the
 * reaction bar reads it right after hydration.
 *
 * Anonymous visitors get the count too, with `liked: false`. The client does not
 * wait for next-auth's session before asking: the session is resolved here from
 * the cookie, which saves a full round trip on every post load.
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { id: postId } = await props.params;
  const auth = await requireAuth();

  const [post, existing] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId }, select: { likes: true } }),
    auth.ok
      ? prisma.postLike.findUnique({
          where: { postId_userId: { postId, userId: auth.user.id } },
          select: { id: true },
        })
      : null,
  ]);

  return NextResponse.json(
    { liked: !!existing, likes: Math.max(0, post?.likes ?? 0) },
    // Per-visitor answer: no shared cache (Cloudflare, nginx) may keep it.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/**
 * Drops the cached post page so the next visitor gets the new count in the HTML
 * instead of a count up to two revalidation windows old (the page and the
 * `unstable_cache` entry under it expire separately, and `revalidatePath` does
 * not touch the latter).
 *
 * Best effort: the like is already committed when this runs, and failing the
 * request over a cache error would make the client roll back a like that
 * actually happened.
 */
function revalidatePostPage(slug: string): void {
  try {
    revalidateTag(blogPostCacheTag(slug), { expire: 0 });
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/blog/${slug}`);
    }
  } catch (error) {
    logApiError("posts-like-revalidate", error);
  }
}
