import NodeCache from "node-cache";
import { logger } from "../utils/index.js";

/**
 * CacheService - Centralized caching layer for API responses
 *
 * Prevents rate limit exhaustion by caching responses from external APIs.
 * Critical for deep agent loops that fetch the same data repeatedly.
 */
export class CacheService {
  private cache: NodeCache;
  private cacheTTL: number;
  private enabled: boolean;

  constructor() {
    // Read configuration from environment
    this.cacheTTL = parseInt(process.env.CACHE_TTL || "300", 10); // Default: 5 minutes
    const checkPeriod = parseInt(process.env.CACHE_CHECK_PERIOD || "600", 10); // Default: 10 minutes
    const useMockData = process.env.USE_MOCK_DATA === "true";

    // Disable cache in mock mode (not needed)
    this.enabled = !useMockData;

    this.cache = new NodeCache({
      stdTTL: this.cacheTTL,
      checkperiod: checkPeriod,
      useClones: true, // Clone objects to prevent mutations
    });

    if (this.enabled) {
      logger.info("✅ CacheService initialized", {
        ttl: this.cacheTTL,
        checkPeriod,
        enabled: this.enabled,
      });

      // Log cache statistics periodically
      this.cache.on("expired", (key, _value) => {
        logger.debug("Cache entry expired", { key });
      });
    } else {
      logger.info("⚠️  CacheService disabled (mock mode active)");
    }
  }

  /**
   * Generate a cache key from method name and parameters
   */
  private generateKey(prefix: string, params: any): string {
    const paramString = JSON.stringify(params);
    return `${prefix}:${paramString}`;
  }

  /**
   * Get cached value
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(prefix: string, params: any): T | undefined {
    if (!this.enabled) return undefined;

    const key = this.generateKey(prefix, params);
    const value = this.cache.get<T>(key);

    if (value !== undefined) {
      logger.debug("Cache HIT", { key, prefix });
    } else {
      logger.debug("Cache MISS", { key, prefix });
    }

    return value;
  }

  /**
   * Set cached value
   * @param ttl Optional TTL override (in seconds)
   */
  set<T>(prefix: string, params: any, value: T, ttl?: number): boolean {
    if (!this.enabled) return false;

    const key = this.generateKey(prefix, params);
    const success = this.cache.set(key, value, ttl || this.cacheTTL);

    if (success) {
      logger.debug("Cache SET", { key, prefix, ttl: ttl || this.cacheTTL });
    }

    return success;
  }

  /**
   * Delete cached value
   */
  delete(prefix: string, params: any): number {
    if (!this.enabled) return 0;

    const key = this.generateKey(prefix, params);
    return this.cache.del(key);
  }

  /**
   * Clear all cache entries
   */
  flush(): void {
    this.cache.flushAll();
    logger.info("Cache flushed");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
      enabled: this.enabled,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Wrapper for cached API calls
   *
   * Usage:
   * const result = await cache.withCache(
   *   'alphavantage:overview',
   *   { symbol: 'AAPL' },
   *   async () => this.apiCall(symbol)
   * );
   */
  async withCache<T>(
    prefix: string,
    params: any,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(prefix, params);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn();
      this.set(prefix, params, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get keys matching a pattern
   */
  getKeys(pattern?: string): string[] {
    const keys = this.cache.keys();
    if (!pattern) return keys;
    return keys.filter((k) => k.includes(pattern));
  }
}

// Singleton instance
export const cacheService = new CacheService();
export default cacheService;
