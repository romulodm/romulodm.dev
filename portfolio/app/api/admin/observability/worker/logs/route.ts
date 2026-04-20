// app/api/admin/worker/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = Math.min(
        Number(req.nextUrl.searchParams.get('limit') ?? '100'),
        200,
    );

    const raw = await getRedis().lrange('worker:logs:recent', 0, limit - 1);

    const logs = raw.map((entry) => {
        try { return JSON.parse(entry); }
        catch { return { raw: entry }; }
    });

    return NextResponse.json({ logs, fetchedAt: new Date().toISOString() });
}