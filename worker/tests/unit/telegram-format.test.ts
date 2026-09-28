import { describe, expect, it } from "vitest";

import {
    ALERT_MESSAGE_MAX,
    clamp,
    escape,
    escapeCode,
    escapeUrl,
    formatComment,
    formatContact,
    formatDailyStatus,
    formatWorkerAlert,
    groupThousands,
    refDateLabel,
} from "../../lib/telegram-format";

const links = { siteUrl: "https://romulodm.dev/", locale: "pt" };

describe("MarkdownV2 escaping", () => {
    it("escapes all 18 reserved characters in plain text", () => {
        const reserved = "_*[]()~`>#+-=|{}.!";
        expect(escape(reserved)).toBe(reserved.split("").map((c) => `\\${c}`).join(""));
        expect(escape("a\\b")).toBe("a\\\\b");
    });

    it("escapes only ` and \\ inside a code span", () => {
        expect(escapeCode("worker.job_failed")).toBe("worker.job_failed");
        expect(escapeCode("a`b\\c")).toBe("a\\`b\\\\c");
    });

    it("escapes only ) and \\ inside a link URL", () => {
        expect(escapeUrl("https://x.dev/a_b-c.d?e=f#g")).toBe("https://x.dev/a_b-c.d?e=f#g");
        expect(escapeUrl("https://x.dev/(a)")).toBe("https://x.dev/(a\\)");
    });
});

describe("clamp", () => {
    it("leaves short text alone", () => {
        expect(clamp("abc", 3)).toBe("abc");
    });

    it("cuts, trims trailing space and appends an ellipsis", () => {
        expect(clamp("abc def", 4)).toBe("abc…");
    });

    it("never splits a surrogate pair", () => {
        expect(clamp("😀😀😀", 2)).toBe("😀😀…");
    });

    it("is applied before escaping, so no dangling backslash survives", () => {
        const text = formatWorkerAlert({ event: "e", message: ".".repeat(ALERT_MESSAGE_MAX + 50) });
        const line = text.split("\n").find((l) => l.startsWith("💬"))!;
        expect(line).toBe(`💬 ${"\\.".repeat(ALERT_MESSAGE_MAX)}…`);
    });
});

describe("formatters", () => {
    it("keeps identifiers raw inside code spans", () => {
        const text = formatWorkerAlert({
            event: "worker.job_failed",
            message: "boom!",
            queue: "email-transactional",
            jobId: "42",
            environment: "production",
        });
        expect(text).toContain("`worker.job_failed`");
        expect(text).toContain("`email-transactional`");
        expect(text).toContain("💬 boom\\!");
    });

    it("builds a locale-prefixed comment link with the anchor", () => {
        const text = formatComment(
            { id: "c_1", author: "Ana.", postTitle: "Hello (world)", postSlug: "hello-world" },
            links,
        );
        expect(text).toContain("👤 Ana\\.");
        expect(text).toContain("📝 Hello \\(world\\)");
        expect(text).toContain("(https://romulodm.dev/pt/blog/hello-world#c_1)");
    });

    it("links the contact message by id and maps the topic label", () => {
        const text = formatContact(
            { id: "abc 1", name: "Bob", topic: "FREELANCE", preview: "oi_tudo" },
            links,
        );
        expect(text).toContain("🏷 Projeto freelance");
        expect(text).toContain("_oi\\_tudo_");
        expect(text).toContain("(https://romulodm.dev/pt/admin/contact?message=abc%201)");
    });

    it("formats the daily status for the reference date", () => {
        const text = formatDailyStatus({
            date: "2026-09-27",
            totalSubscribers: 1234,
            newToday: 3,
            unsubscribedToday: 1,
            totalPosts: 12,
            totalViews: 1234567,
            viewsToday: 89,
            visitors: 40,
            sessions: 50,
            avgTimeSec: 125,
            likes: 2,
            comments: 1,
        });
        expect(text).toContain("📊 *Status diário* — 27/09/2026");
        expect(text).toContain("📈 No dia: `+3` / `-1`");
        expect(text).toContain("*1,234,567*");
        expect(text).toContain("*2m 05s*");
    });
});

describe("helpers", () => {
    it("groups thousands", () => {
        expect(groupThousands(0)).toBe("0");
        expect(groupThousands(999)).toBe("999");
        expect(groupThousands(1000)).toBe("1,000");
    });

    it("turns YYYY-MM-DD into dd/mm/yyyy and passes anything else through", () => {
        expect(refDateLabel("2026-01-05")).toBe("05/01/2026");
        expect(refDateLabel("ontem")).toBe("ontem");
    });
});
