import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@romulo/database';

export const dynamic = 'force-dynamic';

const SEARCH_URL = process.env.SEARCH_GO_URL ?? 'http://localhost:8080';

// GET /api/admin/search — returns health + stats merged
export async function GET() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const [healthRes, statsRes] = await Promise.all([
            fetch(`${SEARCH_URL}/health`, { cache: 'no-store' }),
            fetch(`${SEARCH_URL}/stats`, { cache: 'no-store' }),
        ]);

        const health = await healthRes.json();
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
export async function POST() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

        // Build one IndexRequest per (post × translation) — same format the
        // Go /reindex endpoint expects.
        const docs = posts.flatMap((post) =>
            post.translations.map((t) => ({
                id: `${post.id}-${t.locale}`,
                slug: post.slug,
                locale: t.locale,
                title: t.title ?? '',
                summary: t.summary ?? '',
                excerpt: t.excerpt ?? '',
                tags: post.postTags.map((pt) => pt.tag),
                publishedAt: post.publishedAt ? Math.floor(post.publishedAt.getTime() / 1000) : 0,
                coverImageUrl: post.coverImageUrl ?? '',
            })),
        );

        const reindexRes = await fetch(`${SEARCH_URL}/reindex`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(docs),
        });

        if (!reindexRes.ok) {
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
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

let lastReindex: number | null = null;