import Redis from 'ioredis';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { logger } from '../../utils/index.js';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  cluster?: {
    enableOfflineQueue: boolean;
    redisOptions: Partial<Redis.RedisOptions>;
  };
  sentinel?: {
    sentinels: Array<{ host: string; port: number }>;
    name: string;
  };
}

export interface RedisCacheConfig extends RedisConfig {
  defaultTtl?: number;
  enableFallback?: boolean;
  keyPattern?: string;
  compression?: boolean;
  serialization?: 'json' | 'msgpack';
}

export class RedisCacheService {
  private redis: Redis;
  private fallbackCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStatus = { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  private config: RedisCacheConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(config: RedisCacheConfig = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: config.keyPrefix || 'tam_cache:',
      defaultTtl: config.defaultTtl || 3600,
      enableFallback: config.enableFallback !== false,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: config.lazyConnect !== false,
      keepAlive: config.keepAlive || 30000,
      connectTimeout: config.connectTimeout || 10000,
      commandTimeout: config.commandTimeout || 5000,
      ...config
    };

    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      // Create Redis instance with cluster or sentinel support
      if (this.config.cluster) {
        this.redis = new Redis.Cluster([], {
          enableOfflineQueue: this.config.cluster.enableOfflineQueue,
          redisOptions: {
            ...this.config.cluster.redisOptions,
            keyPrefix: this.config.keyPrefix,
            retryDelayOnFailover: this.config.retryDelayOnFailover,
            maxRetriesPerRequest: this.config.maxRetriesPerRequest,
            lazyConnect: this.config.lazyConnect,
            keepAlive: this.config.keepAlive,
            connectTimeout: this.config.connectTimeout,
            commandTimeout: this.config.commandTimeout,
          }
        });
      } else if (this.config.sentinel) {
        this.redis = new Redis({
          sentinels: this.config.sentinel.sentinels,
          name: this.config.sentinel.name,
          keyPrefix: this.config.keyPrefix,
          retryDelayOnFailover: this.config.retryDelayOnFailover,
          maxRetriesPerRequest: this.config.maxRetriesPerRequest,
          lazyConnect: this.config.lazyConnect,
          keepAlive: this.config.keepAlive,
          connectTimeout: this.config.connectTimeout,
          commandTimeout: this.config.commandTimeout,
          password: this.config.password,
          db: this.config.db,
        });
      } else {
        // Standard Redis connection
        this.redis = new Redis({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          db: this.config.db,
          keyPrefix: this.config.keyPrefix,
          retryDelayOnFailover: this.config.retryDelayOnFailover,
          maxRetriesPerRequest: this.config.maxRetriesPerRequest,
          lazyConnect: this.config.lazyConnect,
          keepAlive: this.config.keepAlive,
          connectTimeout: this.config.connectTimeout,
          commandTimeout: this.config.commandTimeout,
        });
      }

      this.setupEventHandlers();
    } catch (error) {
      logger.error('RedisCacheService: Failed to initialize Redis', { error });
      if (!this.config.enableFallback) {
        throw error;
      }
    }
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('RedisCacheService: Connected to Redis');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.redis.on('error', (error) => {
      logger.error('RedisCacheService: Redis error', { error });
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('RedisCacheService: Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (ms) => {
      this.reconnectAttempts++;
      logger.info('RedisCacheService: Reconnecting to Redis', { 
        attempt: this.reconnectAttempts, 
        delay: ms 
      });
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('RedisCacheService: Max reconnect attempts reached');
        this.redis.disconnect();
      }
    });

    this.redis.on('ready', () => {
      logger.info('RedisCacheService: Redis ready');
      this.isConnected = true;
    });
  }

  private buildKey(key: string): string {
    // Key is automatically prefixed by ioredis if keyPrefix is set
    return key;
  }

  private serialize<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.error('RedisCacheService: Serialization error', { error });
      throw new Error('Failed to serialize cache value');
    }
  }

  private deserialize<T>(value: string | null): T | null {
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('RedisCacheService: Deserialization error', { error });
      return null;
    }
  }

  private async tryRedisOperation<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => T | Promise<T>
  ): Promise<T | null> {
    if (!this.isConnected && !this.config.enableFallback) {
      throw new Error('Redis is not connected and fallback is disabled');
    }

    try {
      if (this.isConnected) {
        return await operation();
      }
    } catch (error) {
      logger.error('RedisCacheService: Redis operation failed', { error });
      this.isConnected = false;
    }

    // Fallback to in-memory cache if enabled
    if (this.config.enableFallback && fallbackOperation) {
      logger.debug('RedisCacheService: Using fallback cache');
      return await fallbackOperation();
    }

    return null;
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.buildKey(key);
    
    const result = await this.tryRedisOperation(
      async () => {
        const value = await this.redis.get(cacheKey);
        if (value) {
          this.stats.hits++;
          return this.deserialize<T>(value);
        }
        this.stats.misses++;
        return null;
      },
      () => {
        const entry = this.fallbackCache.get(key);
        if (entry && (Date.now() < entry.timestamp + entry.ttl)) {
          this.stats.hits++;
          return entry.data as T;
        }
        this.stats.misses++;
        return null;
      }
    );

    return result;
  }

  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const cacheKey = this.buildKey(`entry:${key}`);
    
    const result = await this.tryRedisOperation(
      async () => {
        const value = await this.redis.get(cacheKey);
        return value ? this.deserialize<CacheEntry<T>>(value) : null;
      },
      () => {
        return this.fallbackCache.get(key) || null;
      }
    );

    return result;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const cacheKey = this.buildKey(key);
    const entryKey = this.buildKey(`entry:${key}`);
    const serializedValue = this.serialize(value);
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl
    };

    await this.tryRedisOperation(
      async () => {
        const pipeline = this.redis.pipeline();
        pipeline.setex(cacheKey, Math.ceil(ttl / 1000), serializedValue);
        pipeline.setex(entryKey, Math.ceil(ttl / 1000), this.serialize(entry));
        await pipeline.exec();
        
        this.stats.lastRefreshed = new Date();
        await this.updateCacheSize();
      },
      () => {
        this.fallbackCache.set(key, entry);
        this.stats.size = this.fallbackCache.size;
        this.stats.lastRefreshed = new Date();
      }
    );
  }

  async clear(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);
    const entryKey = this.buildKey(`entry:${key}`);
    
    await this.tryRedisOperation(
      async () => {
        await this.redis.del(cacheKey, entryKey);
        await this.updateCacheSize();
      },
      () => {
        this.fallbackCache.delete(key);
        this.stats.size = this.fallbackCache.size;
      }
    );
  }

  async clearAll(): Promise<void> {
    await this.tryRedisOperation(
      async () => {
        const pattern = this.config.keyPrefix + '*';
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        this.stats.size = 0;
      },
      () => {
        this.fallbackCache.clear();
        this.stats.size = 0;
      }
    );
    
    this.stats = { hits: 0, misses: 0, size: 0, lastRefreshed: new Date() };
  }

  async getStats(): Promise<CacheStatus> {
    await this.updateCacheSize();
    return { ...this.stats };
  }

  private async updateCacheSize(): Promise<void> {
    if (this.isConnected) {
      try {
        const pattern = this.config.keyPrefix + '*';
        const keys = await this.redis.keys(pattern);
        this.stats.size = keys.length;
      } catch (error) {
        logger.debug('RedisCacheService: Failed to get cache size', { error });
      }
    } else {
      this.stats.size = this.fallbackCache.size;
    }
  }

  // Advanced Redis operations
  async exists(key: string): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    
    const result = await this.tryRedisOperation(
      async () => {
        const exists = await this.redis.exists(cacheKey);
        return exists === 1;
      },
      () => {
        const entry = this.fallbackCache.get(key);
        return !!(entry && (Date.now() < entry.timestamp + entry.ttl));
      }
    );

    return result || false;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    
    const result = await this.tryRedisOperation(
      async () => {
        const result = await this.redis.expire(cacheKey, Math.ceil(ttl / 1000));
        return result === 1;
      },
      () => {
        const entry = this.fallbackCache.get(key);
        if (entry) {
          entry.ttl = ttl;
          entry.timestamp = Date.now();
          return true;
        }
        return false;
      }
    );

    return result || false;
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    const searchPattern = this.config.keyPrefix + pattern;
    
    const result = await this.tryRedisOperation(
      async () => {
        const keys = await this.redis.keys(searchPattern);
        return keys.map(key => key.replace(this.config.keyPrefix || '', ''));
      },
      () => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
      }
    );

    return result || [];
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.getKeysByPattern(pattern);
    if (keys.length === 0) return 0;

    const result = await this.tryRedisOperation(
      async () => {
        const fullKeys = keys.map(key => this.buildKey(key));
        await this.redis.del(...fullKeys);
        await this.updateCacheSize();
        return keys.length;
      },
      () => {
        let deleted = 0;
        for (const key of keys) {
          if (this.fallbackCache.delete(key)) {
            deleted++;
          }
        }
        this.stats.size = this.fallbackCache.size;
        return deleted;
      }
    );

    return result || 0;
  }

  // Pub/Sub for distributed cache invalidation
  async invalidateDistributed(key: string): Promise<void> {
    if (this.isConnected) {
      try {
        await this.redis.publish('cache_invalidation', JSON.stringify({ key, timestamp: Date.now() }));
      } catch (error) {
        logger.error('RedisCacheService: Failed to publish invalidation', { error, key });
      }
    }
  }

  subscribeToInvalidations(callback: (key: string) => void): void {
    if (this.isConnected) {
      const subscriber = this.redis.duplicate();
      subscriber.subscribe('cache_invalidation');
      
      subscriber.on('message', (channel, message) => {
        if (channel === 'cache_invalidation') {
          try {
            const { key } = JSON.parse(message);
            callback(key);
          } catch (error) {
            logger.error('RedisCacheService: Failed to parse invalidation message', { error });
          }
        }
      });
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      if (this.isConnected) {
        const start = Date.now();
        await this.redis.ping();
        const latency = Date.now() - start;
        
        const info = await this.redis.info('memory');
        const memoryUsage = this.parseMemoryInfo(info);
        
        return {
          status: latency < 100 ? 'healthy' : 'degraded',
          details: {
            connected: true,
            latency: `${latency}ms`,
            fallbackActive: false,
            memoryUsage,
            cacheStats: this.stats
          }
        };
      } else if (this.config.enableFallback) {
        return {
          status: 'degraded',
          details: {
            connected: false,
            fallbackActive: true,
            fallbackSize: this.fallbackCache.size,
            cacheStats: this.stats
          }
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            fallbackActive: false,
            error: 'Redis disconnected and fallback disabled'
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private parseMemoryInfo(info: string): any {
    const lines = info.split('\n');
    const memoryInfo: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.startsWith('used_memory')) {
          memoryInfo[key] = value.trim();
        }
      }
    }
    
    return memoryInfo;
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('RedisCacheService: Disconnected from Redis');
    } catch (error) {
      logger.error('RedisCacheService: Error disconnecting from Redis', { error });
    }
  }
}
