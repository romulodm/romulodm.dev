// src/lib/moderation/index.ts
import { DomainBlocklistProvider } from "./providers/domain-blocklist";
import { SafeBrowsingProvider } from "./providers/safe-browsing";
import { OpenAIModerationProvider } from "./providers/openai";
import type { ModerationResult } from "./types";

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const AUTOLINK = /<(https?:\/\/[^>]+)>/g;
const BARE_URL = /(?<!\(|<)https?:\/\/[^\s"'<>()[\]]+/g;

function extractUrls(text: string): string[] {
    const urls = new Set<string>();

    for (const m of text.matchAll(MARKDOWN_LINK)) {
        const href = m[2].trim();
        urls.add(href.startsWith("http") ? href : `https://${href}`);
    }
    for (const m of text.matchAll(AUTOLINK)) urls.add(m[1].trim());
    for (const m of text.matchAll(BARE_URL)) urls.add(m[0].trim());

    return [...urls];
}

const providers = [
    new DomainBlocklistProvider(),
    new SafeBrowsingProvider(),
    new OpenAIModerationProvider(),
];

export async function moderate(text: string): Promise<ModerationResult> {
    const urls = extractUrls(text);

    console.log(`[Moderation] Extracted ${urls.length} URL(s):`, urls);

    const ctx = { text, urls };

    for (const provider of providers) {
        const result = await provider.check(ctx);
        if (!result.allowed) return result;
    }

    return { allowed: true };
}