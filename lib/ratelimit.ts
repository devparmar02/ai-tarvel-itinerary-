/**
 * Rate limiting for AI generation routes.
 * Uses Upstash Redis if configured; gracefully allows requests if not.
 */
import { UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN } from './env';
import type { NextRequest } from 'next/server';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Simple in-memory fallback for local dev (resets on cold start)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit for a request.
 * @param request  Incoming Next.js request
 * @param limit    Max requests allowed per window (default: 10)
 * @param windowMs Window size in milliseconds (default: 60 000 = 1 minute)
 */
export async function checkRateLimit(
  request: NextRequest,
  limit = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const ip     = getClientIp(request);
  const key    = `ratelimit:${ip}`;
  const now    = Date.now();
  const resetAt = now + windowMs;

  // ── Try Upstash Redis ────────────────────────────────────────────────
  const redisUrl   = UPSTASH_REDIS_URL();
  const redisToken = UPSTASH_REDIS_TOKEN();

  if (redisUrl && redisToken) {
    try {
      // Use Upstash REST API directly (no SDK instantiation at module level)
      const pipeline = [
        ['INCR', key],
        ['PEXPIRE', key, windowMs],
      ];

      const res = await fetch(`${redisUrl}/pipeline`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(pipeline),
      });

      if (res.ok) {
        const data = await res.json() as [{ result: number }, { result: number }];
        const count = data[0].result;
        return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
      }
    } catch {
      // Fall through to in-memory
    }
  }

  // ── In-memory fallback ───────────────────────────────────────────────
  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  existing.count++;
  return {
    allowed:   existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt:   existing.resetAt,
  };
}
