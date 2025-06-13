import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RedisCacheService } from '../../../src/services/cache/RedisCacheService';
import { RedisCompatibleCacheService } from '../../../src/services/cache/RedisCompatibleCacheService';
import { CacheFactory } from '../../../src/services/cache/CacheFactory';
import { EnhancedDataService } from '../../../src/services/EnhancedDataService';
import Redis from 'ioredis';

// Mock Redis for testing
vi.mock('ioredis');

describe('Redis Cache Integration Tests', () => {
  let mockRedis: any;
  let redisCacheService: RedisCacheService;
  let redisCompatibleService: RedisCompatibleCacheService;

  beforeEach(() => {
    // Create mock Redis instance
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      expire: vi.fn(),
      keys: vi.fn(),
      pipeline: vi.fn(() => ({
        setex: vi.fn(),
        exec: vi.fn()
      })),
      ping: vi.fn(),
      info: vi.fn(),
      publish: vi.fn(),
      subscribe: vi.fn(),
      duplicate: vi.fn(() => mockRedis),
      on: vi.fn(),
      quit: vi.fn(),
      disconnect: vi.fn()
    };

    // Mock Redis constructor
    vi.mocked(Redis).mockImplementation(() => mockRedis);

    // Initialize services
    redisCacheService = new RedisCacheService({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test_cache:',
      enableFallback: true
    });

    redisCompatibleService = new RedisCompatibleCacheService({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test_cache:',
      enableFallback: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RedisCacheService', () => {
    it('should store and retrieve data successfully', async () => {
      const testData = { symbol: 'AAPL', price: 150.00 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));
      mockRedis.setex.mockResolvedValue('OK');

      await redisCacheService.set('test_key', testData, 3600000);
      const result = await redisCacheService.get('test_key');

      expect(result).toEqual(testData);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle Redis connection failures with fallback', async () => {
      const testData = { symbol: 'MSFT', price: 300.00 };
      
      // Simulate Redis failure
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      // Set data (should use fallback)
      await redisCacheService.set('fallback_key', testData, 3600000);
      
      // Get data (should use fallback)
      const result = await redisCacheService.get('fallback_key');
      
      // Should work via fallback mechanism
      expect(result).toBeDefined();
    });

    it('should support pattern-based operations', async () => {
      const testKeys = ['test_cache:alpha_AAPL', 'test_cache:alpha_MSFT', 'test_cache:fred_GDP'];
      mockRedis.keys.mockResolvedValue(testKeys);
      mockRedis.del.mockResolvedValue(2);

      const keys = await redisCacheService.getKeysByPattern('alpha_*');
      const deletedCount = await redisCacheService.deleteByPattern('alpha_*');

      expect(keys).toHaveLength(2);
      expect(deletedCount).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith('test_cache:alpha_*');
    });

    it('should provide health check information', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockResolvedValue('used_memory:1024\nused_memory_human:1K');

      const health = await redisCacheService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toHaveProperty('connected', true);
      expect(health.details).toHaveProperty('latency');
    });
  });

  describe('RedisCompatibleCacheService', () => {
    it('should maintain compatibility with original CacheService interface', async () => {
      const testData = { company: 'Apple Inc', ticker: 'AAPL' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      await redisCompatibleService.set('compat_test', testData, 3600000);
      const result = await redisCompatibleService.get('compat_test');

      expect(result).toEqual(testData);
      
      // Test synchronous stats method for compatibility
      const stats = redisCompatibleService.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
    });

    it('should provide enhanced async stats', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);

      const detailedStats = await redisCompatibleService.getDetailedStats();
      
      expect(detailedStats).toHaveProperty('hits');
      expect(detailedStats).toHaveProperty('misses');
      expect(detailedStats).toHaveProperty('size');
    });

    it('should support distributed cache invalidation', async () => {
      mockRedis.publish.mockResolvedValue(1);

      await redisCompatibleService.invalidateDistributed('test_key');

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'cache_invalidation',
        expect.stringContaining('test_key')
      );
    });
  });

  describe('CacheFactory', () => {
    it('should create Redis cache service', async () => {
      const cacheService = await CacheFactory.create({
        type: 'redis',
        redis: {
          host: 'localhost',
          port: 6379,
          keyPrefix: 'factory_test:'
        }
      });

      expect(cacheService).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.set).toBe('function');
    });

    it('should create memory cache service', async () => {
      const cacheService = await CacheFactory.create({
        type: 'memory',
        memory: {
          persistenceOptions: {
            filePath: './test_cache'
          }
        }
      });

      expect(cacheService).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.set).toBe('function');
    });

    it('should create hybrid cache service', async () => {
      const cacheService = await CacheFactory.create({
        type: 'hybrid',
        hybrid: {
          redis: {
            host: 'localhost',
            port: 6379
          },
          memory: {
            persistenceOptions: {
              filePath: './test_cache'
            }
          },
          fallbackTimeout: 500
        }
      });

      expect(cacheService).toBeDefined();
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.set).toBe('function');
      expect(typeof cacheService.healthCheck).toBe('function');
    });
  });
});

describe('Enhanced Data Service Integration', () => {
  let enhancedDataService: EnhancedDataService;
  let mockRedis: any;

  beforeEach(async () => {
    // Mock Redis
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      pipeline: vi.fn(() => ({
        setex: vi.fn(),
        exec: vi.fn()
      })),
      ping: vi.fn(),
      info: vi.fn(),
      on: vi.fn(),
      quit: vi.fn(),
      disconnect: vi.fn()
    };

    vi.mocked(Redis).mockImplementation(() => mockRedis);

    // Initialize enhanced data service with Redis cache
    enhancedDataService = new EnhancedDataService({
      cache: {
        type: 'redis',
        redis: {
          host: 'localhost',
          port: 6379,
          keyPrefix: 'tam_cache:',
          enableFallback: true
        }
      },
      apiKeys: {
        alphaVantage: 'test_api_key'
      },
      enableDistributedInvalidation: true
    });
  });

  afterEach(async () => {
    await enhancedDataService.disconnect();
    vi.clearAllMocks();
  });

  it('should cache Alpha Vantage API responses', async () => {
    const mockCompanyData = {
      Symbol: 'AAPL',
      Name: 'Apple Inc.',
      MarketCapitalization: '2500000000000',
      Sector: 'Technology'
    };

    // Mock Redis cache miss then hit
    mockRedis.get
      .mockResolvedValueOnce(null) // Cache miss
      .mockResolvedValueOnce(JSON.stringify(mockCompanyData)); // Cache hit

    // Mock Alpha Vantage service response
    vi.spyOn(enhancedDataService as any, 'alphaVantageService').mockImplementation({
      getCompanyOverview: vi.fn().mockResolvedValue(mockCompanyData),
      isAvailable: vi.fn().mockResolvedValue(true)
    });

    // First call should fetch from API and cache
    const result1 = await enhancedDataService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });
    expect(result1).toEqual(mockCompanyData);
    expect(mockRedis.setex).toHaveBeenCalled(); // Should cache the result

    // Second call should use cache
    const result2 = await enhancedDataService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });
    expect(result2).toEqual(mockCompanyData);
  });

  it('should provide comprehensive health checks', async () => {
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.info.mockResolvedValue('used_memory:1024');

    const health = await enhancedDataService.healthCheck();

    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('services');
    expect(health).toHaveProperty('cache');
    expect(health.cache).toHaveProperty('status');
  });

  it('should support cache invalidation patterns', async () => {
    mockRedis.keys.mockResolvedValue(['tam_cache:alphavantage_OVERVIEW_AAPL', 'tam_cache:alphavantage_OVERVIEW_MSFT']);
    mockRedis.del.mockResolvedValue(2);

    const deletedCount = await enhancedDataService.invalidateCache('alphavantage_OVERVIEW_*');

    expect(deletedCount).toBe(2);
    expect(mockRedis.keys).toHaveBeenCalledWith('tam_cache:alphavantage_OVERVIEW_*');
    expect(mockRedis.del).toHaveBeenCalled();
  });

  it('should provide detailed metrics', async () => {
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);

    const metrics = await enhancedDataService.getMetrics();

    expect(metrics).toHaveProperty('cache');
    expect(metrics).toHaveProperty('health');
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('config');
    expect(metrics.config.cacheType).toBe('redis');
  });
});
