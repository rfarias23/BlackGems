/** Simple in-memory rate limiter for auth routes.
 *  Tracks request counts per key (IP) within a sliding window. */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
    }
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

/** Check and consume a rate limit token.
 *  @param key    Unique identifier (typically IP address)
 *  @param limit  Max requests per window
 *  @param windowMs  Window duration in milliseconds (default: 60s)
 */
export function rateLimit(
    key: string,
    limit: number = 10,
    windowMs: number = 60_000
): RateLimitResult {
    cleanup();
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
