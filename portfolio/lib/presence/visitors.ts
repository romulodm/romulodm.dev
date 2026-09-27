import 'server-only';

import { getRealtimeActiveUsers } from '@/lib/ga4';
import { cached } from '@/lib/status-cache';

/**
 * How many people are on the site right now, from GA4 realtime.
 *
 * Cached for 45s: the number is a live signal, but GA4 realtime has a quota per
 * property per day and one request per visitor would burn it in an afternoon.
 */
export async function getActiveVisitors(): Promise<number> {
    const { data } = await cached<number>(
        { key: 'presence:visitors', ttlSeconds: 45, staleSeconds: 300 },
        getRealtimeActiveUsers,
    );
    return data;
}
