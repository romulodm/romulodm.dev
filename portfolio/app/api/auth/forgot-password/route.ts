import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { z } from "zod"
import { prisma } from "@romulo/database"
import { sendPasswordResetEmail } from "@/lib/mail"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
    try {
        const { email } = schema.parse(await req.json())

        // Always return 200 to avoid leaking whether the e-mail is registered.
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ message: "Se esse e-mail estiver cadastrado, você receberá um link em breve." })
        }

        // Invalidate previous tokens for this user.
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

        const token = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 h

        await prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt },
        })

        await sendPasswordResetEmail(email, token)

        return NextResponse.json({ message: "Se esse e-mail estiver cadastrado, você receberá um link em breve." })
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ message: err.errors[0].message }, { status: 422 })
        }
        console.error("[forgot-password]", err)
        return NextResponse.json({ message: "Erro interno." }, { status: 500 })
    }
}