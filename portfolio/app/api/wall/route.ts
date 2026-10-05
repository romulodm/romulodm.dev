// app/api/wall/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

import { AVATAR_SELECT } from "@/lib/avatar";
import { rateLimitResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { PICKABLE_CARD_ART_TONES, isCardArtStyle, isCardArtTone } from "@/components/wall/cardArt";

const WALL_WRITE_MAX = 10;
const WALL_WRITE_WINDOW_SECONDS = 60 * 10;

const MAX_MESSAGE_LENGTH = 100;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getRequestIp(req);
  const limited = await rateLimit(
    `wall:write:${session.user.id}:${ip}`,
    WALL_WRITE_MAX,
    WALL_WRITE_WINDOW_SECONDS,
  );

  if (limited) {
    const t = await getApiTranslator(req);
    return rateLimitResponse(t("common.rateLimited"));
  }

  let message: unknown;
  let artStyle: unknown;
  let artTone: unknown;
  try {
    ({ message, artStyle, artTone } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const text = typeof message === "string" ? message.trim() : "";

  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message must be 1–${MAX_MESSAGE_LENGTH} characters` },
      { status: 400 },
    );
  }

  // The modal only offers valid values, so anything else is a hand-made
  // request. Rejecting it (instead of silently defaulting) keeps the stored
  // column honest: every row holds a style someone actually picked.
  if (
    !isCardArtStyle(artStyle) ||
    !isCardArtTone(artTone) ||
    !PICKABLE_CARD_ART_TONES.includes(artTone)
  ) {
    return NextResponse.json({ error: "Invalid card style" }, { status: 400 });
  }

  const existing = await prisma.wallMessage.findFirst({
    where: { authorId: session.user.id },
    select: { id: true },
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
    data: { message: text, authorId: session.user.id, theme, artStyle, artTone },
    include: { author: { select: { id: true, ...AVATAR_SELECT } } },
  });

  return NextResponse.json(created, { status: 201 });
}
