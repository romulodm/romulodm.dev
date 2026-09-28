import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@romulo/database';
import { forbiddenResponse, unauthorizedResponse } from '@/lib/api-errors';
import { getApiTranslator } from '@/lib/api-intl';

export const dynamic = 'force-dynamic';

const SEARCH_URL = process.env.SEARCH_GO_URL ?? 'http://localhost:8080';

// The Go service protects every route except /health and /search with a
// Bearer token (SEARCH_INTERNAL_SECRET). When the secret is unset, the Go
// side skips the check, so sending no header is fine in that case.
function authHeaders(): Record<string, string> {
    const secret = process.env.SEARCH_INTERNAL_SECRET;
    return secret ? { Authorization: `Bearer ${secret}` } : {};
}

// GET /api/admin/search — returns health + stats merged
export async function GET(req: NextRequest) {
    const t = await getApiTranslator(req);
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401
            ? unauthorizedResponse(t("common.unauthorized"))
            : forbiddenResponse(t("common.forbidden"));
    }

    try {
        const [healthRes, statsRes] = await Promise.all([
            fetch(`${SEARCH_URL}/health`, { cache: 'no-store' }),
            fetch(`${SEARCH_URL}/stats`, { cache: 'no-store', headers: authHeaders() }),
        ]);

        const health = await healthRes.json();
        if (!statsRes.ok) {
            return NextResponse.json({
                health,
                stats: null,
                error: `Go service returned ${statsRes.status} on /stats`,
                fetchedAt: new Date().toISOString(),
            });
        }
        const stats = await statsRes.json();

        return NextResponse.json({ health, stats, fetchedAt: new Date().toISOString() });
    } catch (err) {
        return NextResponse.json(
            { error: 'Search service unreachable', details: String(err) },
            { status: 503 },
        );
    }
}

// POST /api/admin/search — fetches all published posts and sends to Go /reindex
export async function POST(req: NextRequest) {
    const t = await getApiTranslator(req);
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401
            ? unauthorizedResponse(t("common.unauthorized"))
            : forbiddenResponse(t("common.forbidden"));
    }

    // In-memory rate limit: max 1 reindex per 60s per process
    const now = Date.now();
    if (lastReindex && now - lastReindex < 60_000) {
        return NextResponse.json(
            { error: 'Rate limited — wait before reindexing again' },
            { status: 429 },
        );
    }
    lastReindex = now;

    try {
        // Fetch all published posts with their translations — same shape the
        // worker uses in reindexAll() so index results are consistent.
        const posts = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            include: { translations: true, postTags: true },
        });

        // Build one IndexRequest per (post × translation). The id format and
        // the excerpt cap must match the worker (worker/workers/search.worker.ts):
        // the worker removes docs by `${postId}_${locale}` on unpublish.
        const docs = posts.flatMap((post) =>
            post.translations.map((t) => ({
                id: `${post.id}_${t.locale}`,
                slug: post.slug,
                locale: t.locale,
                title: t.title ?? '',
                summary: t.summary ?? '',
                excerpt: t.excerpt?.slice(0, 500) ?? '',
                tags: post.postTags.map((pt) => pt.tag),
                publishedAt: post.publishedAt ? Math.floor(post.publishedAt.getTime() / 1000) : 0,
                coverImageUrl: post.coverImageUrl ?? '',
            })),
        );

        const reindexRes = await fetch(`${SEARCH_URL}/reindex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(docs),
        });

        if (!reindexRes.ok) {
            // A failed attempt should not lock the button for 60s.
            lastReindex = null;
            const text = await reindexRes.text();
            return NextResponse.json(
                { error: `Go service returned ${reindexRes.status}`, details: text },
                { status: 502 },
            );
        }

        const result = await reindexRes.json();
        return NextResponse.json({
            ok: true,
            indexed: result.indexed ?? docs.length,
            reindexedAt: new Date().toISOString(),
        });
    } catch (err) {
        lastReindex = null;
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

let lastReindex: number | null = null;