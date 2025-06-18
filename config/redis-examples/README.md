# Redis Cache Configuration Examples

This directory contains various configuration examples for using Redis caching with the TAM MCP Server.

## Basic Redis Configuration

### Environment Variables (.env.redis)
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0

# Cache TTL Settings (in milliseconds)
CACHE_TTL_ALPHA_VANTAGE_MS=3600000        # 1 hour for successful API responses
CACHE_TTL_ALPHA_VANTAGE_NODATA_MS=300000  # 5 minutes for no-data responses
CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS=60000 # 1 minute for rate-limited responses

CACHE_TTL_FRED_MS=1800000                 # 30 minutes for FRED data
CACHE_TTL_FRED_NODATA_MS=300000           # 5 minutes for FRED no-data

CACHE_TTL_WORLD_BANK_MS=7200000           # 2 hours for World Bank data
CACHE_TTL_CENSUS_MS=86400000              # 24 hours for Census data

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FRED_API_KEY=your_fred_key
CENSUS_API_KEY=your_census_key
BLS_API_KEY=your_bls_key
NASDAQ_API_KEY=your_nasdaq_key
```

### Basic Redis Setup (config/redis-basic.ts)
```typescript
import { EnhancedDataService } from '../src/services/EnhancedDataService.js';

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
```

## Production Redis Cluster Configuration

### Environment Variables (.env.production)
```bash
# Redis Cluster Configuration
REDIS_CLUSTER_NODES=redis-1.example.com:6379,redis-2.example.com:6379,redis-3.example.com:6379
REDIS_CLUSTER_PASSWORD=your_cluster_password
REDIS_CLUSTER_PREFIX=tam_prod:

# Monitoring
ENABLE_CACHE_METRICS=true
CACHE_METRICS_INTERVAL=60000  # 1 minute

# Performance Tuning
REDIS_CONNECT_TIMEOUT=15000
REDIS_COMMAND_TIMEOUT=10000
REDIS_MAX_RETRIES=5
REDIS_RETRY_DELAY=200
```

### Production Cluster Setup (config/redis-cluster.ts)
```typescript
import { EnhancedDataService } from '../src/services/EnhancedDataService.js';

export function createProductionRedisDataService() {
  const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(',').map(node => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port) };
  }) || [];

  return new EnhancedDataService({
    cache: {
      type: 'redis',
      redis: {
        cluster: {
          enableOfflineQueue: false,
          redisOptions: {
            password: process.env.REDIS_CLUSTER_PASSWORD,
            connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '15000'),
            commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '10000'),
            maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '5'),
            retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '200')
          }
        },
        keyPrefix: process.env.REDIS_CLUSTER_PREFIX || 'tam_prod:',
        enableFallback: true,
        defaultTtl: 3600
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
    enableMetrics: process.env.ENABLE_CACHE_METRICS === 'true'
  });
}
```

## High Availability with Redis Sentinel

### Environment Variables (.env.sentinel)
```bash
# Redis Sentinel Configuration
REDIS_SENTINEL_MASTER=tam-master
REDIS_SENTINEL_NODES=sentinel-1.example.com:26379,sentinel-2.example.com:26379,sentinel-3.example.com:26379
REDIS_SENTINEL_PASSWORD=your_sentinel_password
REDIS_MASTER_PASSWORD=your_master_password
```

### Sentinel Setup (config/redis-sentinel.ts)
```typescript
import { EnhancedDataService } from '../src/services/EnhancedDataService.js';

export function createSentinelRedisDataService() {
  const sentinelNodes = process.env.REDIS_SENTINEL_NODES?.split(',').map(node => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port) };
  }) || [];

  return new EnhancedDataService({
    cache: {
      type: 'redis',
      redis: {
        sentinel: {
          sentinels: sentinelNodes,
          name: process.env.REDIS_SENTINEL_MASTER || 'tam-master'
        },
        password: process.env.REDIS_MASTER_PASSWORD,
        keyPrefix: 'tam_ha:',
        enableFallback: true,
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 5,
        connectTimeout: 20000,
        commandTimeout: 10000
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
```

## Hybrid Cache Configuration

### Development Hybrid Setup (config/redis-hybrid-dev.ts)
```typescript
import { EnhancedDataService } from '../src/services/EnhancedDataService.js';

export function createHybridDevDataService() {
  return new EnhancedDataService({
    cache: {
      type: 'hybrid',
      hybrid: {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          keyPrefix: 'tam_dev:',
          enableFallback: true,
          connectTimeout: 5000,
          commandTimeout: 3000
        },
        memory: {
          persistenceOptions: {
            filePath: './cache_data_dev'
          }
        },
        fallbackTimeout: 1000 // Fast fallback for development
      }
    },
    apiKeys: {
      alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
      fred: process.env.FRED_API_KEY
    },
    enableDistributedInvalidation: false, // Disabled for development
    enableMetrics: true
  });
}
```

## Usage Examples

### Basic Usage (examples/basic-usage.ts)
```typescript
import { createBasicRedisDataService } from '../config/redis-basic.js';

async function demonstrateBasicUsage() {
  const dataService = createBasicRedisDataService();
  
  try {
    // Test Alpha Vantage integration with Redis caching
    console.log('🔍 Fetching AAPL company overview...');
    const appleOverview = await dataService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });
    console.log('✅ Apple Overview:', {
      symbol: appleOverview.Symbol,
      name: appleOverview.Name,
      marketCap: appleOverview.MarketCapitalization,
      sector: appleOverview.Sector
    });

    // Second call should hit cache
    console.log('🚀 Fetching AAPL overview again (should be cached)...');
    const start = Date.now();
    const cachedOverview = await dataService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });
    const elapsed = Date.now() - start;
    console.log(`⚡ Cached response in ${elapsed}ms`);

    // Get cache metrics
    const metrics = await dataService.getMetrics();
    console.log('📊 Cache Metrics:', {
      hitRate: (metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses) * 100).toFixed(2) + '%',
      totalOperations: metrics.cache.hits + metrics.cache.misses,
      cacheSize: metrics.cache.size
    });

    // Health check
    const health = await dataService.healthCheck();
    console.log('🏥 Health Status:', health.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataService.disconnect();
  }
}

// Run the example
demonstrateBasicUsage().catch(console.error);
```

### Advanced Cache Management (examples/cache-management.ts)
```typescript
import { createBasicRedisDataService } from '../config/redis-basic.js';

async function demonstrateCacheManagement() {
  const dataService = createBasicRedisDataService();
  
  try {
    // Fetch multiple company overviews
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
    
    console.log('📈 Fetching company data for cache management demo...');
    for (const symbol of symbols) {
      await dataService.getAlphaVantageData('OVERVIEW', { symbol });
      console.log(`✅ Cached data for ${symbol}`);
    }

    // Show cache contents
    const metrics = await dataService.getMetrics();
    console.log(`💾 Cache contains ${metrics.cache.size} items`);

    // Invalidate specific pattern
    console.log('🧹 Invalidating Alpha Vantage OVERVIEW cache...');
    const invalidated = await dataService.invalidateCache('alphavantage_OVERVIEW_*');
    console.log(`🗑️  Invalidated ${invalidated} cache entries`);

    // Verify cache was cleared
    const metricsAfter = await dataService.getMetrics();
    console.log(`💾 Cache now contains ${metricsAfter.cache.size} items`);

    // Demonstrate distributed invalidation
    console.log('📡 Sending distributed cache invalidation...');
    await dataService.invalidateDistributed('test_key');
    console.log('✅ Distributed invalidation sent');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataService.disconnect();
  }
}

demonstrateCacheManagement().catch(console.error);
```

### Performance Comparison (examples/performance-comparison.ts)
```typescript
import { DataService } from '../src/services/DataService.js'; // Original
import { createBasicRedisDataService } from '../config/redis-basic.js'; // Redis
import { createHybridDevDataService } from '../config/redis-hybrid-dev.js'; // Hybrid

async function comparePerformance() {
  console.log('🏁 Starting performance comparison...\n');

  const originalService = new DataService();
  const redisService = createBasicRedisDataService();
  const hybridService = createHybridDevDataService();

  const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
  
  try {
    // Test each service
    for (const [name, service] of [
      ['Original Memory Cache', originalService],
      ['Redis Cache', redisService],
      ['Hybrid Cache', hybridService]
    ]) {
      console.log(`📊 Testing ${name}:`);
      
      const times: number[] = [];
      
      // First run - populate cache
      for (const symbol of testSymbols) {
        const start = Date.now();
        await (service as any).getAlphaVantageData('OVERVIEW', { symbol });
        times.push(Date.now() - start);
      }
      
      const avgFirstRun = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`  First run average: ${avgFirstRun.toFixed(2)}ms`);
      
      // Second run - should hit cache
      const cachedTimes: number[] = [];
      for (const symbol of testSymbols) {
        const start = Date.now();
        await (service as any).getAlphaVantageData('OVERVIEW', { symbol });
        cachedTimes.push(Date.now() - start);
      }
      
      const avgCachedRun = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;
      console.log(`  Cached run average: ${avgCachedRun.toFixed(2)}ms`);
      console.log(`  Speedup: ${(avgFirstRun / avgCachedRun).toFixed(2)}x\n`);
    }
    
  } catch (error) {
    console.error('❌ Error during performance test:', error);
  } finally {
    // Cleanup
    await redisService.disconnect();
    await hybridService.disconnect();
  }
}

comparePerformance().catch(console.error);
```

## Migration Script

### Gradual Migration (scripts/migrate-to-redis.ts)
```typescript
import { DataService } from '../src/services/DataService.js';
import { createHybridDevDataService } from '../config/redis-hybrid-dev.js';

async function migrateToRedis() {
  console.log('🔄 Starting migration to Redis cache...\n');
  
  const originalService = new DataService();
  const hybridService = createHybridDevDataService();
  
  try {
    // Step 1: Validate Redis connectivity
    console.log('1️⃣ Validating Redis connectivity...');
    const health = await hybridService.healthCheck();
    
    if (health.cache.status !== 'healthy' && health.cache.status !== 'degraded') {
      throw new Error('Redis is not available. Migration aborted.');
    }
    console.log('✅ Redis is available\n');
    
    // Step 2: Test data operations
    console.log('2️⃣ Testing data operations...');
    const testData = await hybridService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });
    
    if (!testData) {
      throw new Error('Failed to fetch test data. Migration aborted.');
    }
    console.log('✅ Data operations working\n');
    
    // Step 3: Compare performance
    console.log('3️⃣ Comparing performance...');
    
    const start1 = Date.now();
    await originalService.getAlphaVantageData('OVERVIEW', { symbol: 'MSFT' });
    const originalTime = Date.now() - start1;
    
    const start2 = Date.now();
    await hybridService.getAlphaVantageData('OVERVIEW', { symbol: 'MSFT' });
    const hybridTime = Date.now() - start2;
    
    console.log(`   Original service: ${originalTime}ms`);
    console.log(`   Hybrid service: ${hybridTime}ms`);
    console.log('✅ Performance comparison complete\n');
    
    // Step 4: Validate cache behavior
    console.log('4️⃣ Validating cache behavior...');
    
    const cacheStart = Date.now();
    await hybridService.getAlphaVantageData('OVERVIEW', { symbol: 'MSFT' }); // Should hit cache
    const cacheTime = Date.now() - cacheStart;
    
    console.log(`   Cached response time: ${cacheTime}ms`);
    
    if (cacheTime > 100) {
      console.warn('⚠️  Cache response time seems high. Check Redis performance.');
    } else {
      console.log('✅ Cache performance looks good');
    }
    
    console.log('\n🎉 Migration validation complete!');
    console.log('You can now switch to Redis cache in production.');
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    process.exit(1);
  } finally {
    await hybridService.disconnect();
  }
}

migrateToRedis().catch(console.error);
```

These configuration examples provide comprehensive setups for different deployment scenarios, from development to production-ready Redis clusters with high availability.
