import { getRedis } from "@/lib/redis"

export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<boolean> {
  try {
    const current = await getRedis().incr(key)
    if (current === 1) {
      await getRedis().expire(key, windowSec)
    }

    return current > max;
  } catch {
    return false;
  }
}

export function getRequestIp(request: Request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Nginx appends $remote_addr to X-Forwarded-For via $proxy_add_x_forwarded_for,
  // so the last entry is always the real client IP and cannot be spoofed.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const entries = forwardedFor.split(",");
    return entries[entries.length - 1]?.trim() ?? "anonymous";
  }

  return "anonymous";
}
