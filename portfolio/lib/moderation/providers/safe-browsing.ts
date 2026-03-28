import type { ModerationContext, ModerationProvider, ModerationResult } from "../types";

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const AUTOLINK = /<(https?:\/\/[^>]+)>/g;
const BARE_URL = /(?<!\(|<)https?:\/\/[^\s"'<>()[\]]+/g;

function extractUrls(text: string): string[] {
    const urls = new Set<string>();

    for (const m of text.matchAll(MARKDOWN_LINK)) {
        const href = m[2].trim();
        const normalized = href.startsWith("http") ? href : `https://${href}`;
        console.log(`[SafeBrowsing] Markdown link found: "${m[1]}" → ${normalized}`);
        urls.add(normalized);
    }

    for (const m of text.matchAll(AUTOLINK)) {
        console.log(`[SafeBrowsing] Autolink found: ${m[1].trim()}`);
        urls.add(m[1].trim());
    }

    for (const m of text.matchAll(BARE_URL)) {
        console.log(`[SafeBrowsing] Bare URL found: ${m[0].trim()}`);
        urls.add(m[0].trim());
    }

    return [...urls];
}

export class SafeBrowsingProvider implements ModerationProvider {
    readonly name = "google-safe-browsing";

    async check({ urls }: ModerationContext): Promise<ModerationResult> {
        console.log(`[SafeBrowsing] Extracted ${urls.length} URL(s):`, urls);

        if (urls.length === 0) {
            console.log("[SafeBrowsing] No URLs found, skipping.");
            return { allowed: true };
        }

        const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
        if (!apiKey) {
            console.warn("[SafeBrowsing] API key not configured, skipping.");
            return { allowed: true };
        }

        console.log("[SafeBrowsing] Sending request to Safe Browsing API...");
        const start = Date.now();

        const res = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client: { clientId: "seu-portfolio", clientVersion: "1.0" },
                    threatInfo: {
                        threatTypes: [
                            "MALWARE",
                            "SOCIAL_ENGINEERING",
                            "UNWANTED_SOFTWARE",
                            "POTENTIALLY_HARMFUL_APPLICATION",
                        ],
                        platformTypes: ["ANY_PLATFORM"],
                        threatEntryTypes: ["URL"],
                        threatEntries: urls.map((url) => ({ url })),
                    },
                }),
            }
        );

        console.log(`[SafeBrowsing] API responded in ${Date.now() - start}ms — status: ${res.status}`);

        if (!res.ok) {
            console.error("[SafeBrowsing] API error:", res.status, await res.text());
            return { allowed: true };
        }

        const data = await res.json();
        console.log("[SafeBrowsing] API response:", JSON.stringify(data, null, 2));

        if (!data.matches || data.matches.length === 0) {
            console.log("[SafeBrowsing] No threats detected, allowed.");
            return { allowed: true };
        }

        const matched = data.matches[0];
        console.warn(`[SafeBrowsing] Threat detected — type: ${matched.threatType}, url: ${matched.threat.url}`);

        return {
            allowed: false,
            reason: `safe_browsing:${matched.threatType}:${matched.threat.url}`,
        };
    }
}