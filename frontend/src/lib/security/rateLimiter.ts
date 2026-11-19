/**
 * CareerAI — Sliding Window Rate Limiter
 *
 * Implements client-side in-memory token bucket rate limiting
 * to prevent automated grading loop exhaustion and denial-of-service abuse.
 */

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

export class SlidingWindowRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();
  private maxTokens: number;
  private refillIntervalMs: number;

  /**
   * Initializes a sliding window rate limiter.
   * @param maxTokens Maximum allowed requests per window
   * @param refillIntervalMs Time window in milliseconds for token regeneration
   */
  constructor(maxTokens = 10, refillIntervalMs = 60000) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
  }

  /**
   * Checks whether an action key is permitted or rate limited.
   * @param key Unique identifier (e.g., action name, user id)
   * @returns Object with allowed status and remaining tokens
   */
  public checkLimit(key: string): { allowed: boolean; remainingTokens: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return { allowed: true, remainingTokens: bucket.tokens };
    }

    const elapsed = now - bucket.lastRefill;
    if (elapsed > this.refillIntervalMs) {
      bucket.tokens = this.maxTokens;
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return { allowed: true, remainingTokens: bucket.tokens };
    }

    return { allowed: false, remainingTokens: 0 };
  }

  /**
   * Resets the rate limiter for a specific key or all keys.
   * @param key Optional specific key to reset
   */
  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

export const globalRateLimiter = new SlidingWindowRateLimiter(20, 60000);
