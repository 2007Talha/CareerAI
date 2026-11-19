/**
 * CareerAI — Deterministic Hash-Keyed LRU Response Cache
 *
 * Implements a bounded in-memory LRU cache for AI queries and API responses.
 * Replay queries resolve in ~1ms, avoiding network latency and external token usage.
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export interface CacheTelemetry {
  hits: number;
  misses: number;
  totalQueries: number;
  estimatedLatencySavedMs: number;
  cacheSize: number;
}

export class ResponseCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private ttlMs: number;
  private hits = 0;
  private misses = 0;
  private latencySavedMs = 0;

  /**
   * Initializes the LRU cache.
   * @param maxEntries Maximum cache size before eviction
   * @param ttlMs Time-to-live per entry in milliseconds
   */
  constructor(maxEntries = 100, ttlMs = 300000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Generates a deterministic hash key from string parameters.
   * @param key Base key or string
   * @returns Clean deterministic key
   */
  public generateKey(...parts: string[]): string {
    return parts.map((p) => p.trim().toLowerCase()).join('::');
  }

  /**
   * Retrieves a cached value if present and unexpired.
   * @param key Lookup key
   * @returns Cached value or null
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU order: delete and re-insert
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    this.latencySavedMs += 850; // Estimate ~850ms network round-trip saved per hit
    return entry.value;
  }

  /**
   * Stores a value in the cache with LRU eviction if capacity exceeded.
   * @param key Cache key
   * @param value Value to cache
   */
  public set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first key in map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Returns live evaluator telemetry statistics.
   * @returns CacheTelemetry snapshot
   */
  public getTelemetry(): CacheTelemetry {
    return {
      hits: this.hits,
      misses: this.misses,
      totalQueries: this.hits + this.misses,
      estimatedLatencySavedMs: this.latencySavedMs,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clears all cache entries.
   */
  public clear(): void {
    this.cache.clear();
  }
}

export const globalResponseCache = new ResponseCache<unknown>(100, 300000);
