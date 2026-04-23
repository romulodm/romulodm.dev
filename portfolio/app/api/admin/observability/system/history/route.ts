import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });
    }

    const limit = Math.min(
        Number(req.nextUrl.searchParams.get('limit') ?? '60'),
        120,
    );

    const raw = await getRedis().lrange('system:metrics:history', 0, limit - 1);

    // lrange retorna do mais recente ao mais antigo; revertemos para ordem cronológica
    const history = raw
        .map((entry) => {
            try { return JSON.parse(entry); }
            catch { return null; }
        })
        .filter(Boolean)
        .reverse();

    return NextResponse.json({ history, fetchedAt: new Date().toISOString() });
}