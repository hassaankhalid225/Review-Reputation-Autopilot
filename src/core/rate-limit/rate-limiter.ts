/**
 * In-memory sliding-window rate limiter.
 *
 * Adequate for a single instance / dev. In multi-instance production, swap the
 * store for Upstash Redis / @vercel/kv behind this same `checkRateLimit` API —
 * call sites don't change (Dependency Inversion at the function level).
 */
import "server-only";

interface Window {
  hits: number[];
}

const store = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param key      bucket identity (e.g. `signin:user@x.com`, `ai-draft:<bizId>`)
 * @param limit    max events per window
 * @param windowMs window length in ms
 */
export function checkRateLimit(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  const cutoff = now - windowMs;
  const win = store.get(key) ?? { hits: [] };
  win.hits = win.hits.filter((t) => t > cutoff);

  if (win.hits.length >= limit) {
    const oldest = win.hits[0] ?? now;
    store.set(key, win);
    return { allowed: false, remaining: 0, retryAfterMs: oldest + windowMs - now };
  }

  win.hits.push(now);
  store.set(key, win);

  // Opportunistic cleanup to bound memory.
  if (store.size > 10_000) {
    for (const [k, v] of store) {
      if (v.hits.every((t) => t <= cutoff)) store.delete(k);
    }
  }

  return { allowed: true, remaining: limit - win.hits.length, retryAfterMs: 0 };
}
