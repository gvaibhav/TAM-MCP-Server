import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { RedisCacheService, RedisCacheConfig } from './RedisCacheService.js';
import { logger } from '../../utils/index.js';

/**
 * Redis-based cache service that implements the same interface as the original CacheService
 * This provides a drop-in replacement for the existing Map-based cache implementation
 */
export class RedisCompatibleCacheService {
  private redisCache: RedisCacheService;

  constructor(config: RedisCacheConfig = {}) {
    this.redisCache = new RedisCacheService({
      enableFallback: true, // Always enable fallback for compatibility
      ...config
    });

    logger.info('RedisCompatibleCacheService: Initialized', {
      redisHost: config.host || 'localhost',
      redisPort: config.port || 6379,
      keyPrefix: config.keyPrefix || 'tam_cache:',
      fallbackEnabled: true
    });
  }

  /**
   * Get a value from cache - matches original CacheService interface
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redisCache.get<T>(key);
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Get operation failed', { key, error });
      return null;
    }
  }

  /**
   * Get cache entry with metadata - matches original CacheService interface
   */
  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      return await this.redisCache.getEntry<T>(key);
    } catch (error) {
      logger.error('RedisCompatibleCacheService: GetEntry operation failed', { key, error });
      return null;
    }
  }

  /**
   * Set a value in cache - matches original CacheService interface
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.redisCache.set<T>(key, value, ttl);
      logger.debug('RedisCompatibleCacheService: Set operation successful', { key, ttl });
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Set operation failed', { key, error });
      throw error;
    }
  }

  /**
   * Clear a specific key - matches original CacheService interface
   */
  async clear(key: string): Promise<void> {
    try {
      await this.redisCache.clear(key);
      logger.debug('RedisCompatibleCacheService: Clear operation successful', { key });
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Clear operation failed', { key, error });
      throw error;
    }
  }

  /**
   * Clear all cache entries - matches original CacheService interface
   */
  async clearAll(): Promise<void> {
    try {
      await this.redisCache.clearAll();
      logger.info('RedisCompatibleCacheService: ClearAll operation successful');
    } catch (error) {
      logger.error('RedisCompatibleCacheService: ClearAll operation failed', { error });
      throw error;
    }
  }

  /**
   * Get cache statistics - matches original CacheService interface
   */
  getStats(): CacheStatus {
    // Return synchronous stats for compatibility
    // This might not be as accurate as async Redis stats, but maintains interface compatibility
    return {
      hits: 0, // Will be updated in Redis implementation
      misses: 0, // Will be updated in Redis implementation
      size: 0, // Will be updated async
      lastRefreshed: new Date()
    };
  }

  /**
   * Get detailed async stats - enhanced functionality
   */
  async getDetailedStats(): Promise<CacheStatus> {
    try {
      return await this.redisCache.getStats();
    } catch (error) {
      logger.error('RedisCompatibleCacheService: GetDetailedStats failed', { error });
      return { hits: 0, misses: 0, size: 0, lastRefreshed: null };
    }
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      return await this.redisCache.healthCheck();
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Health check failed', { error });
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redisCache.disconnect();
      logger.info('RedisCompatibleCacheService: Disconnected successfully');
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Disconnect failed', { error });
    }
  }

  // Additional Redis-specific methods that enhance the original interface

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await this.redisCache.exists(key);
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Exists check failed', { key, error });
      return false;
    }
  }

  /**
   * Set TTL for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      return await this.redisCache.expire(key, ttl);
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Expire operation failed', { key, ttl, error });
      return false;
    }
  }

  /**
   * Get keys matching a pattern
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      return await this.redisCache.getKeysByPattern(pattern);
    } catch (error) {
      logger.error('RedisCompatibleCacheService: GetKeysByPattern failed', { pattern, error });
      return [];
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const deletedCount = await this.redisCache.deleteByPattern(pattern);
      logger.info('RedisCompatibleCacheService: Pattern deletion successful', { 
        pattern, 
        deletedCount 
      });
      return deletedCount;
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Pattern deletion failed', { pattern, error });
      return 0;
    }
  }

  /**
   * Invalidate cache entries across distributed instances
   */
  async invalidateDistributed(key: string): Promise<void> {
    try {
      await this.redisCache.invalidateDistributed(key);
      logger.debug('RedisCompatibleCacheService: Distributed invalidation sent', { key });
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Distributed invalidation failed', { key, error });
    }
  }

  /**
   * Subscribe to distributed cache invalidation events
   */
  subscribeToInvalidations(callback: (key: string) => void): void {
    try {
      this.redisCache.subscribeToInvalidations((key: string) => {
        logger.debug('RedisCompatibleCacheService: Received invalidation event', { key });
        callback(key);
      });
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Failed to subscribe to invalidations', { error });
    }
  }

  /**
   * Get cache metrics for monitoring
   */
  async getMetrics(): Promise<{
    performance: {
      hitRate: number;
      avgResponseTime: number;
      totalOperations: number;
    };
    redis: {
      connected: boolean;
      memoryUsage: any;
      latency: string;
    };
    fallback: {
      active: boolean;
      size: number;
    };
  }> {
    try {
      const healthCheck = await this.healthCheck();
      const stats = await this.getDetailedStats();
      
      return {
        performance: {
          hitRate: stats.hits > 0 ? stats.hits / (stats.hits + stats.misses) : 0,
          avgResponseTime: 0, // Could be tracked with performance monitoring
          totalOperations: stats.hits + stats.misses
        },
        redis: {
          connected: healthCheck.details?.connected || false,
          memoryUsage: healthCheck.details?.memoryUsage || {},
          latency: healthCheck.details?.latency || 'unknown'
        },
        fallback: {
          active: healthCheck.details?.fallbackActive || false,
          size: healthCheck.details?.fallbackSize || 0
        }
      };
    } catch (error) {
      logger.error('RedisCompatibleCacheService: Failed to get metrics', { error });
      return {
        performance: { hitRate: 0, avgResponseTime: 0, totalOperations: 0 },
        redis: { connected: false, memoryUsage: {}, latency: 'unknown' },
        fallback: { active: true, size: 0 }
      };
    }
  }
}
