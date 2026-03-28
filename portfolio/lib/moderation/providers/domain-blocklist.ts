// src/lib/moderation/providers/domain-blocklist.ts
import type { ModerationProvider, ModerationContext, ModerationResult } from "../types";
import pornDomains from "../data/porn-domains.json";
import gamblingDomains from "../data/gambling-domains.json";

// Carregado uma vez em memória no startup — lookup O(1)
const BLOCKED = new Set<string>([...pornDomains, ...gamblingDomains]);

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    }
}

export class DomainBlocklistProvider implements ModerationProvider {
    readonly name = "domain-blocklist";

    async check({ urls }: ModerationContext): Promise<ModerationResult> {
        if (urls.length === 0) return { allowed: true };

        for (const url of urls) {
            const domain = extractDomain(url);
            console.log(`[Blocklist] Checking domain: ${domain}`);

            if (BLOCKED.has(domain)) {
                console.warn(`[Blocklist] Blocked domain: ${domain}`);
                return { allowed: false, reason: `blocked_domain:${domain}` };
            }
        }

        return { allowed: true };
    }
}