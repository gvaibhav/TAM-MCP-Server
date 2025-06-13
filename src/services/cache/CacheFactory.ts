import { CacheService } from './cacheService.js';
import { RedisCacheService, RedisCacheConfig } from './RedisCacheService.js';
import { PersistenceService } from './persistenceService.js';
import { logger } from '../../utils/index.js';

export type CacheType = 'memory' | 'redis' | 'hybrid';

export interface CacheFactoryConfig {
  type: CacheType;
  redis?: RedisCacheConfig;
  memory?: {
    persistenceOptions?: { filePath: string };
  };
  hybrid?: {
    redis: RedisCacheConfig;
    memory: { persistenceOptions?: { filePath: string } };
    fallbackTimeout?: number;
  };
}

export interface UnifiedCacheService {
  get<T>(key: string): Promise<T | null>;
  getEntry<T>(key: string): Promise<any | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  clear(key: string): Promise<void>;
  clearAll(): Promise<void>;
  getStats(): Promise<any> | any;
  healthCheck?(): Promise<any>;
  disconnect?(): Promise<void>;
}

export class CacheFactory {
  static async create(config: CacheFactoryConfig): Promise<UnifiedCacheService> {
    switch (config.type) {
      case 'memory':
        return CacheFactory.createMemoryCache(config.memory || {});
      
      case 'redis':
        return CacheFactory.createRedisCache(config.redis || {});
      
      case 'hybrid':
        return CacheFactory.createHybridCache(config.hybrid!);
      
      default:
        throw new Error(`Unsupported cache type: ${config.type}`);
    }
  }

  private static createMemoryCache(config: { persistenceOptions?: { filePath: string } }): UnifiedCacheService {
    const persistenceService = new PersistenceService(config.persistenceOptions);
    const cacheService = new CacheService(persistenceService);
    
    return {
      async get<T>(key: string): Promise<T | null> {
        return cacheService.get<T>(key);
      },
      
      async getEntry<T>(key: string): Promise<any | null> {
        return cacheService.getEntry<T>(key);
      },
      
      async set<T>(key: string, value: T, ttl: number): Promise<void> {
        return cacheService.set<T>(key, value, ttl);
      },
      
      async clear(key: string): Promise<void> {
        return cacheService.clear(key);
      },
      
      async clearAll(): Promise<void> {
        return cacheService.clearAll();
      },
      
      getStats(): any {
        return cacheService.getStats();
      },
      
      async healthCheck(): Promise<any> {
        const stats = cacheService.getStats();
        return {
          status: 'healthy',
          details: {
            type: 'memory',
            stats
          }
        };
      }
    };
  }

  private static createRedisCache(config: RedisCacheConfig): UnifiedCacheService {
    const redisCacheService = new RedisCacheService(config);
    
    return {
      async get<T>(key: string): Promise<T | null> {
        return redisCacheService.get<T>(key);
      },
      
      async getEntry<T>(key: string): Promise<any | null> {
        return redisCacheService.getEntry<T>(key);
      },
      
      async set<T>(key: string, value: T, ttl: number): Promise<void> {
        return redisCacheService.set<T>(key, value, ttl);
      },
      
      async clear(key: string): Promise<void> {
        return redisCacheService.clear(key);
      },
      
      async clearAll(): Promise<void> {
        return redisCacheService.clearAll();
      },
      
      async getStats(): Promise<any> {
        return redisCacheService.getStats();
      },
      
      async healthCheck(): Promise<any> {
        return redisCacheService.healthCheck();
      },
      
      async disconnect(): Promise<void> {
        return redisCacheService.disconnect();
      }
    };
  }

  private static createHybridCache(config: {
    redis: RedisCacheConfig;
    memory: { persistenceOptions?: { filePath: string } };
    fallbackTimeout?: number;
  }): UnifiedCacheService {
    const redisCache = new RedisCacheService(config.redis);
    const memoryCache = CacheFactory.createMemoryCache(config.memory);
    const fallbackTimeout = config.fallbackTimeout || 1000;

    return new HybridCacheService(redisCache, memoryCache, fallbackTimeout);
  }
}

class HybridCacheService implements UnifiedCacheService {
  constructor(
    private redisCache: RedisCacheService,
    private memoryCache: UnifiedCacheService,
    private fallbackTimeout: number
  ) {}

  private async withTimeout<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    timeout: number = this.fallbackTimeout
  ): Promise<T> {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
    } catch (error) {
      logger.debug('HybridCacheService: Falling back to memory cache', { error });
      return await fallback();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.withTimeout(
      () => this.redisCache.get<T>(key),
      () => this.memoryCache.get<T>(key)
    );
  }

  async getEntry<T>(key: string): Promise<any | null> {
    return this.withTimeout(
      () => this.redisCache.getEntry<T>(key),
      () => this.memoryCache.getEntry<T>(key)
    );
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Try to set in both caches, but don't fail if one fails
    const redisPromise = this.redisCache.set(key, value, ttl).catch(error => {
      logger.debug('HybridCacheService: Redis set failed', { error, key });
    });
    
    const memoryPromise = this.memoryCache.set(key, value, ttl).catch(error => {
      logger.debug('HybridCacheService: Memory set failed', { error, key });
    });

    await Promise.allSettled([redisPromise, memoryPromise]);
  }

  async clear(key: string): Promise<void> {
    const redisPromise = this.redisCache.clear(key).catch(error => {
      logger.debug('HybridCacheService: Redis clear failed', { error, key });
    });
    
    const memoryPromise = this.memoryCache.clear(key).catch(error => {
      logger.debug('HybridCacheService: Memory clear failed', { error, key });
    });

    await Promise.allSettled([redisPromise, memoryPromise]);
  }

  async clearAll(): Promise<void> {
    const redisPromise = this.redisCache.clearAll().catch(error => {
      logger.debug('HybridCacheService: Redis clearAll failed', { error });
    });
    
    const memoryPromise = this.memoryCache.clearAll().catch(error => {
      logger.debug('HybridCacheService: Memory clearAll failed', { error });
    });

    await Promise.allSettled([redisPromise, memoryPromise]);
  }

  async getStats(): Promise<any> {
    try {
      const [redisStats, memoryStats] = await Promise.allSettled([
        this.redisCache.getStats(),
        Promise.resolve(this.memoryCache.getStats())
      ]);

      return {
        redis: redisStats.status === 'fulfilled' ? redisStats.value : null,
        memory: memoryStats.status === 'fulfilled' ? memoryStats.value : null,
        hybrid: true
      };
    } catch (error) {
      logger.error('HybridCacheService: Failed to get stats', { error });
      return { error: 'Failed to get cache stats' };
    }
  }

  async healthCheck(): Promise<any> {
    const [redisHealth, memoryHealth] = await Promise.allSettled([
      this.redisCache.healthCheck(),
      this.memoryCache.healthCheck ? this.memoryCache.healthCheck() : Promise.resolve({ status: 'healthy' })
    ]);

    return {
      status: redisHealth.status === 'fulfilled' && redisHealth.value.status === 'healthy' 
        ? 'healthy' : 'degraded',
      details: {
        redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy' },
        memory: memoryHealth.status === 'fulfilled' ? memoryHealth.value : { status: 'unhealthy' },
        hybrid: true
      }
    };
  }

  async disconnect(): Promise<void> {
    await Promise.allSettled([
      this.redisCache.disconnect(),
      this.memoryCache.disconnect ? this.memoryCache.disconnect() : Promise.resolve()
    ]);
  }
}
