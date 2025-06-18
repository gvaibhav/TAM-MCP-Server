import { EnhancedDataService } from '../../src/services/EnhancedDataService.js';

export function createBasicRedisDataService() {
  return new EnhancedDataService({
    cache: {
      type: 'redis',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: 'tam_cache:',
        defaultTtl: 3600, // 1 hour default
        enableFallback: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000
      }
    },
    apiKeys: {
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
      fred: process.env.FRED_API_KEY,
      census: process.env.CENSUS_API_KEY,
      bls: process.env.BLS_API_KEY,
      nasdaq: process.env.NASDAQ_API_KEY
    },
    enableDistributedInvalidation: true,
    enableMetrics: true
  });
}
