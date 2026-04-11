// apps/web/src/lib/views.ts
"use server";

import { getRedis } from "@/lib/redis";
import { VIEWS_BUFFER_KEY } from "@romulo/queues";

const VIEW_DEDUPE_TTL_SECONDS = 30 * 60;

type ViewRecordResult = {
    counted: boolean;
    reason?: "cooldown";
};

async function incrementBufferedView(postId: string): Promise<ViewRecordResult> {
    const result = await getRedis().hincrby(VIEWS_BUFFER_KEY, postId, 1);
    console.log("[recordPostView] Redis hincrby result:", result);

    return { counted: true };
}

export async function recordPostViewWithCookie(postId: string): Promise<ViewRecordResult> {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const cookieKey = `viewed:${postId}`;

    if (jar.has(cookieKey)) {
        return { counted: false, reason: "cooldown" };
    }

    jar.set(cookieKey, "1", {
        maxAge: VIEW_DEDUPE_TTL_SECONDS,
        httpOnly: true,
        sameSite: "strict",
        path: "/",
    });

    return incrementBufferedView(postId);
}

export async function recordPostViewByIdentifier(
    postId: string,
    identifier: string,
): Promise<ViewRecordResult> {
    const cooldownKey = `view:cooldown:${postId}:${identifier}`;
    const wasSet = await getRedis().set(cooldownKey, "1", "EX", VIEW_DEDUPE_TTL_SECONDS, "NX");

    if (wasSet !== "OK") {
        return { counted: false, reason: "cooldown" };
    }

    return incrementBufferedView(postId);
}

export async function recordPostView(postId: string): Promise<void> {
    try {
        console.log("[recordPostView] postId:", postId);
        const result = await recordPostViewWithCookie(postId);
        console.log("[recordPostView] counted:", result.counted);
    } catch (err) {
        console.error("[recordPostView] error:", err);
    }
}
