import { prisma } from "@romulo/database";
import { logWorkerError, logWorkerEvent } from "../lib/worker-observability";
import { redis } from "../lib/redis";

const SEARCH_URL = process.env.SEARCH_GO_URL ?? "http://localhost:8080";

// ── HTTP client para o serviço Go ─────────────────────────────────────────────

async function goIndex(doc: {
    id: string; slug: string; locale: string;
    title: string; summary: string; excerpt: string;
    tags: string[]; publishedAt: number; coverImageUrl: string | null;
}) {
    await fetch(`${SEARCH_URL}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
    });
}

async function goRemove(docId: string) {
    await fetch(`${SEARCH_URL}/index/${encodeURIComponent(docId)}`, {
        method: "DELETE",
    });
}

async function goReindex(docs: Array<{
    id: string; slug: string; locale: string;
    title: string; summary: string; excerpt: string;
    tags: string[]; publishedAt: number; coverImageUrl: string | null;
}>) {
    await fetch(`${SEARCH_URL}/reindex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docs),
    });
}

// ── Indexador de posts ────────────────────────────────────────────────────────

async function indexPost(postId: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            postTags: { select: { tag: true } },
            translations: {
                select: { locale: true, title: true, summary: true, excerpt: true },
            },
        },
    });

    if (!post || post.status !== "PUBLISHED") {
        // Despublicado — remove todos os locales do índice Go
        const locales = ["pt", "en"];
        for (const locale of locales) {
            await goRemove(`${postId}_${locale}`);
        }
        return;
    }

    for (const t of post.translations) {
        await goIndex({
            id: `${post.id}_${t.locale}`,
            slug: post.slug,
            locale: t.locale,
            title: t.title,
            summary: t.summary ?? "",
            excerpt: t.excerpt?.slice(0, 500) ?? "",
            tags: post.postTags.map((pt) => pt.tag),
            publishedAt: post.publishedAt
                ? Math.floor(post.publishedAt.getTime() / 1000)
                : 0,
            coverImageUrl: post.coverImageUrl,
        });
    }
}

// ── Reindexação completa ──────────────────────────────────────────────────────

export async function reindexAll() {
    logWorkerEvent("info", "search_consumer.reindex_start");
    const start = Date.now();

    const posts = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        include: {
            postTags: { select: { tag: true } },
            translations: {
                select: { locale: true, title: true, summary: true, excerpt: true },
            },
        },
    });

    const docs = posts.flatMap((post) =>
        post.translations.map((t) => ({
            id: `${post.id}_${t.locale}`,
            slug: post.slug,
            locale: t.locale,
            title: t.title,
            summary: t.summary ?? "",
            excerpt: t.excerpt?.slice(0, 500) ?? "",
            tags: post.postTags.map((pt) => pt.tag),
            publishedAt: post.publishedAt
                ? Math.floor(post.publishedAt.getTime() / 1000)
                : 0,
            coverImageUrl: post.coverImageUrl,
        }))
    );

    await goReindex(docs);

    logWorkerEvent("info", "search_consumer.reindex_done", {
        count: docs.length,
        ms: Date.now() - start,
    });
}

// ── Consumer da fila de eventos ───────────────────────────────────────────────

interface SearchConsumer {
    stop: () => void;
}

export function startSearchConsumer(): SearchConsumer {
    let running = true;

    (async () => {
        logWorkerEvent("info", "search_consumer.started");

        while (running) {
            try {
                const item = await redis.brpop("search:events", 2);
                if (!item) continue;

                const event = JSON.parse(item[1]) as
                    | { type: "index"; postId: string }
                    | { type: "remove"; postId: string };

                if (event.type === "index") {
                    await indexPost(event.postId);
                    logWorkerEvent("info", "search_consumer.indexed", { postId: event.postId });
                }

                if (event.type === "remove") {
                    const locales = ["pt", "en"];
                    for (const locale of locales) {
                        await goRemove(`${event.postId}_${locale}`);
                    }
                    logWorkerEvent("info", "search_consumer.removed", { postId: event.postId });
                }
            } catch (err) {
                logWorkerError("search_consumer.error", err);
                await new Promise((r) => setTimeout(r, 1_000));
            }
        }

        logWorkerEvent("info", "search_consumer.stopped");
    })();

    return { stop: () => { running = false; } };
}