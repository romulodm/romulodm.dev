import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@romulo/database";

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    const username = body?.username?.trim();

    if (!email || !password) {
        return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, provider: true },
    });

    if (existing) {
        if (existing.provider === "GOOGLE") {
            return NextResponse.json({ error: "use_google" }, { status: 409 });
        }
        return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
        data: {
            email,
            provider: "EMAIL_PASSWORD",
            password: passwordHash,
            username: username?.length ? username : email.split("@")[0],
            emailVerified: false,
        },
        select: { id: true },
    });

    return NextResponse.json({ ok: true, userId: created.id }, { status: 201 });
}