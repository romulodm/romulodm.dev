// apps/web/src/lib/views.ts
"use server";

import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import { VIEWS_BUFFER_KEY } from "@romulo/queues";

export async function recordPostView(postId: string): Promise<void> {
    try {
        const jar = await cookies();
        const cookieKey = `viewed:${postId}`;

        console.log("[recordPostView] postId:", postId);
        console.log("[recordPostView] cookie exists:", jar.has(cookieKey));

        if (jar.has(cookieKey)) return;

        jar.set(cookieKey, "1", { maxAge: 60, httpOnly: true, sameSite: "strict", path: "/" });

        const result = await redis.hincrby(VIEWS_BUFFER_KEY, postId, 1);
        console.log("[recordPostView] Redis hincrby result:", result); // deve ser 1, 2, 3...
    } catch (err) {
        console.error("[recordPostView] error:", err);
    }
}