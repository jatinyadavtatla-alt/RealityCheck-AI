import "server-only";

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single-instance deployment; swap for Redis in multi-instance setups.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
      remaining: 0,
    };
  }

  bucket.timestamps.push(now);
  return {
    ok: true,
    retryAfterSec: 0,
    remaining: limit - bucket.timestamps.length,
  };
}

// Prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();
