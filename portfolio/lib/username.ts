// lib/username.ts
import { prisma } from "@romulo/database";

function normalizeUsername(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24);
}

export async function generateUniqueUsername(email: string, name?: string | null) {
    const base = normalizeUsername(name?.length ? name : email.split("@")[0]) || "user";

    for (let i = 0; i < 50; i++) {
        const candidate = i === 0 ? base : `${base}${i}`;
        const exists = await prisma.user.findUnique({
            where: { username: candidate },
            select: { id: true },
        });
        if (!exists) return candidate;
    }

    return `${base}${Date.now().toString().slice(-6)}`;
}