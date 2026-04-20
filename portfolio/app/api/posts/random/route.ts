import { NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { getApiTranslator } from "@/lib/api-intl";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const t = await getApiTranslator(request);

  const count = await prisma.post.count({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
  });

  if (count === 0) {
    return NextResponse.json({ error: t("posts.noPosts") }, { status: 404 });
  }

  const skip = Math.floor(Math.random() * count);

  const post = await prisma.post.findFirst({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    skip,
    select: { slug: true },
  });

  if (!post) {
    return NextResponse.json({ error: t("posts.notFound") }, { status: 404 });
  }

  return NextResponse.json({ slug: post.slug });
}
