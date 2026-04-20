import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const raw = await getRedis().get('system:metrics');
        if (!raw) {
            return NextResponse.json(
                { error: 'Metrics not yet available — worker may still be starting up' },
                { status: 503 },
            );
        }

        return NextResponse.json(JSON.parse(raw));
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}