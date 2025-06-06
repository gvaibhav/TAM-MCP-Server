import NodeCache from 'node-cache';
import { Logger } from '../utils/logger.js';

interface CacheConfig {
  ttl?: number;
  checkperiod?: number;
  maxKeys?: number;
}

export class CacheService {
  private cache: NodeCache;
  private logger: Logger;

  constructor(config: CacheConfig = {}) {
    // Initialize cache with configuration
    this.cache = new NodeCache({
      stdTTL: config.ttl || 3600, // Default TTL: 1 hour
      checkperiod: config.checkperiod || 600, // Check for expired keys every 10 minutes
      useClones: false, // Don't clone objects for better performance
      deleteOnExpire: true,
      maxKeys: config.maxKeys || 1000 // Limit cache size
    });

    this.logger = Logger.getInstance('CacheService');

    // Set up cache event listeners
    this.cache.on('set', (key, value) => {
      this.logger.debug('Cache set', { key, size: JSON.stringify(value).length });
    });

    this.cache.on('del', (key, _value) => {
      this.logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key, _value) => {
      this.logger.debug('Cache expired', { key });
    });

    this.cache.on('flush', () => {
      this.logger.info('Cache flushed');
    });

    // Log cache statistics periodically
    setInterval(() => {
      this.logCacheStats();
    }, 300000); // Every 5 minutes
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.logger.debug('Cache hit', { key });
        return value;
      } else {
        this.logger.debug('Cache miss', { key });
        return undefined;
      }
    } catch (error) {
      this.logger.error('Cache get error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return undefined;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const success = ttl !== undefined 
        ? this.cache.set(key, value, ttl)
        : this.cache.set(key, value);
      if (success) {
        this.logger.debug('Cache set successful', { 
          key, 
          ttl: ttl || this.cache.options.stdTTL,
          size: JSON.stringify(value).length 
        });
      } else {
        this.logger.warn('Cache set failed', { key });
      }
      return success;
    } catch (error) {
      this.logger.error('Cache set error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.del(key);
      if (deleted > 0) {
        this.logger.debug('Cache delete successful', { key, deletedCount: deleted });
        return true;
      } else {
        this.logger.debug('Cache delete - key not found', { key });
        return false;
      }
    } catch (error) {
      this.logger.error('Cache delete error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      this.logger.error('Cache has error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(keys: string[]): Promise<Record<string, T>> {
    try {
      const values = this.cache.mget<T>(keys);
      this.logger.debug('Cache multi-get', { 
        keysRequested: keys.length, 
        keysFound: Object.keys(values).length 
      });
      return values;
    } catch (error) {
      this.logger.error('Cache multi-get error', { 
        keys, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return {};
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      let allSuccessful = true;
      
      for (const { key, value, ttl } of keyValuePairs) {
        const success = ttl !== undefined 
          ? this.cache.set(key, value, ttl)
          : this.cache.set(key, value);
        if (!success) {
          allSuccessful = false;
          this.logger.warn('Cache multi-set failed for key', { key });
        }
      }

      this.logger.debug('Cache multi-set completed', { 
        keysSet: keyValuePairs.length, 
        allSuccessful 
      });
      
      return allSuccessful;
    } catch (error) {
      this.logger.error('Cache multi-set error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      const deletedCount = this.cache.del(keys);
      this.logger.debug('Cache multi-delete', { 
        keysRequested: keys.length, 
        keysDeleted: deletedCount 
      });
      return deletedCount;
    } catch (error) {
      this.logger.error('Cache multi-delete error', { 
        keys, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return 0;
    }
  }

  /**
   * Clear all cache entries
   */
  async flush(): Promise<void> {
    try {
      this.cache.flushAll();
      this.logger.info('Cache flushed successfully');
    } catch (error) {
      this.logger.error('Cache flush error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      ksize: stats.ksize,
      vsize: stats.vsize
    };
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get cache keys matching a pattern
   */
  getKeysByPattern(pattern: string): string[] {
    const allKeys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  /**
   * Set TTL for an existing key
   */
  async setTTL(key: string, ttl: number): Promise<boolean> {
    try {
      const success = this.cache.ttl(key, ttl);
      if (success) {
        this.logger.debug('Cache TTL updated', { key, ttl });
      } else {
        this.logger.warn('Cache TTL update failed - key not found', { key });
      }
      return success;
    } catch (error) {
      this.logger.error('Cache TTL update error', { 
        key, 
        ttl, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  getTTL(key: string): number | undefined {
    try {
      const ttl = this.cache.getTtl(key);
      return ttl ? Math.floor((ttl - Date.now()) / 1000) : undefined;
    } catch (error) {
      this.logger.error('Cache get TTL error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return undefined;
    }
  }

  /**
   * Get or set pattern - get value if exists, otherwise compute and cache
   */
  async getOrSet<T>(
    key: string, 
    computeFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // Compute value if not in cache
      this.logger.debug('Cache miss, computing value', { key });
      const value = await computeFn();
      
      // Cache the computed value
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      this.logger.error('Cache get-or-set error', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = this.getKeysByPattern(pattern);
      const deletedCount = await this.deleteMany(keys);
      this.logger.info('Cache invalidated by pattern', { 
        pattern, 
        keysFound: keys.length, 
        keysDeleted: deletedCount 
      });
      return deletedCount;
    } catch (error) {
      this.logger.error('Cache invalidate by pattern error', { 
        pattern, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return 0;
    }
  }

  /**
   * Log cache statistics
   */
  private logCacheStats(): void {
    const stats = this.getStats();
    this.logger.info('Cache statistics', {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      keySizeKB: `${(stats.ksize / 1024).toFixed(2)} KB`,
      valueSizeKB: `${(stats.vsize / 1024).toFixed(2)} KB`
    });
  }

  /**
   * Close cache and cleanup
   */
  close(): void {
    this.cache.close();
    this.logger.info('Cache service closed');
  }
}
