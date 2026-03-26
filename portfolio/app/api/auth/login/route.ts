// app/api/auth/login/route.ts
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@romulo/database"
import { SignJWT } from "jose"

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    const { email, password } = body ?? {}

    if (!email || !password) {
        return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: {
            id: true,
            email: true,
            username: true,
            password: true,
            provider: true,
            admin: true,
        },
    })

    if (!user || user.provider !== "EMAIL_PASSWORD" || !user.password) {
        return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
        return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

    const token = await new SignJWT({
        id: user.id,
        email: user.email,
        username: user.username,
        admin: user.admin,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret)

    return NextResponse.json({
        id: user.id,
        email: user.email,
        username: user.username,
        admin: user.admin,
        token, // 👈 JWT para usar no Postman
    })
}
