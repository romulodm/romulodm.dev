import type { ModerationContext, ModerationProvider, ModerationResult } from "../types";

export class OpenAIModerationProvider implements ModerationProvider {
    readonly name = "openai";

    async check({ text }: ModerationContext): Promise<ModerationResult> {
        console.log("[Moderation] Checking text with OpenAI:", text);

        const res = await fetch("https://api.openai.com/v1/moderations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({ input: text }),
        });

        if (!res.ok) {
            console.error("[Moderation] OpenAI API error:", res.status);
            return { allowed: true };
        }

        console.log("[Moderation] OpenAI API response status:", res.status);

        const data = await res.json();
        const result = data.results?.[0];

        console.log("[Moderation] OpenAI API moderation result:", result);

        return {
            allowed: !result?.flagged,
            reason: result?.flagged ? "openai_flagged" : undefined,
        };
    }
}