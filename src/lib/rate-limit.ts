/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for serverless (Netlify Functions) where each cold start resets state.
 * For production-grade limiting, consider Upstash Redis or Netlify rate limiting.
 */

const hits = new Map<string, number[]>();

// Clean old entries every 60s to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) hits.delete(key);
    else hits.set(key, filtered);
  }
}, 60_000);

/**
 * Check if a request should be rate-limited.
 * @param key - unique identifier (e.g. IP address)
 * @param windowMs - time window in milliseconds
 * @param maxHits - max requests allowed in the window
 * @returns true if the request should be BLOCKED
 */
export function isRateLimited(
  key: string,
  windowMs: number,
  maxHits: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = (hits.get(key) || []).filter((t) => t > cutoff);
  existing.push(now);
  hits.set(key, existing);
  return existing.length > maxHits;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
