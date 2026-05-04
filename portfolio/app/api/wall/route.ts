// app/api/wall/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

const PAGE_SIZE = 21;

export async function GET(req: NextRequest) {
  const cursor = new URL(req.url).searchParams.get("cursor");

  const rows = await prisma.wallMessage.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, username: true, image: true } } },
  });

  const hasMore = rows.length > PAGE_SIZE;
  if (hasMore) rows.pop();

  return NextResponse.json({
    messages: rows,
    nextCursor: hasMore ? rows[rows.length - 1].id : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  const text: string = (message ?? "").trim();

  if (!text || text.length > 100) {
    return NextResponse.json({ error: "Message must be 1–100 characters" }, { status: 400 });
  }

  const existing = await prisma.wallMessage.findFirst({
    where: { authorId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already left a message on the wall" },
      { status: 409 },
    );
  }

  // Deterministic theme from userId so the user always gets the same card colour
  const theme =
    session.user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 8;

  const created = await prisma.wallMessage.create({
    data: { message: text, authorId: session.user.id, theme },
    include: { author: { select: { id: true, username: true, image: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}
