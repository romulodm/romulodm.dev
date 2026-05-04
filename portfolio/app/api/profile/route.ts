// portfolio/src/app/api/profile/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
});

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, provider: true },
    });

    if (!user || user.provider !== "EMAIL_PASSWORD" || !user.password) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
        return NextResponse.json({ error: "Wrong current password" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hash } });

    return NextResponse.json({ ok: true });
}