import { prisma } from "@romulo/database";
import { enqueuePasswordReset } from "@/lib/queues/email.queue";
import { displayNameFromEmail, resolveLocale } from "@romulo/templates";

export async function sendPasswordResetEmail(email: string, token: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { username: true },
    });

    await enqueuePasswordReset(
        email,
        token,
        user?.username ?? displayNameFromEmail(email),
        resolveLocale(undefined),
    );
}