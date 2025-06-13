# Redis Cache Wrapper for TAM MCP Server

This implementation provides a Redis-based caching solution that enhances the existing data source architecture with better scalability, persistence, and distributed caching capabilities.

## Features

- **Drop-in Replacement**: Compatible with existing `CacheService` interface
- **Multiple Cache Types**: Memory, Redis, or Hybrid caching strategies
- **Fallback Support**: Graceful degradation when Redis is unavailable
- **Distributed Invalidation**: Pub/Sub based cache invalidation across instances
- **Health Monitoring**: Comprehensive health checks and metrics
- **Connection Resilience**: Automatic reconnection and error handling
- **Advanced Redis Features**: Pattern matching, TTL management, clustering support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Enhanced Data Service                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Cache Factory                               ││
│  │  ┌─────────────┬─────────────┬─────────────────────────┐││
│  │  │   Memory    │    Redis    │        Hybrid           │││
│  │  │   Cache     │    Cache    │       Cache             │││
│  │  └─────────────┴─────────────┴─────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│              Data Source Services                           │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Alpha Vantage│     FRED     │        Others...         │ │
│  │   Service    │   Service    │                          │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Real-World Alpha Vantage Integration

The current Alpha Vantage implementation already handles real API behavior effectively:

### API Response Handling
```typescript
// Handles rate limits
if (data['Note'] && data['Note'].includes('rate limit')) {
    return { _rateLimited: true, data };
}

// Handles API errors
if (data['Error Message']) {
    throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
}

// Handles missing data
if (data.MarketCapitalization === "None") {
    return null;
}
```

### Data Transformation
```typescript
// Company overview data transformation
const transformed = {
    symbol: data.Symbol,
    marketCapitalization: parseFloat(data.MarketCapitalization),
    name: data.Name,
    sector: data.Sector,
    industry: data.Industry,
    description: data.Description,
    currency: 'USD',
    country: data.Country,
    exchange: data.Exchange,
    EPS: data.EPS,
    PERatio: data.PERatio
};
```

### Intelligent Caching
```typescript
// Different TTLs for different scenarios
const successTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_MS', 3600000);
const noDataTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_NODATA_MS', 300000);
const rateLimitTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS', 60000);
```

## Configuration

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Cache TTL Configuration
CACHE_TTL_ALPHA_VANTAGE_MS=3600000
CACHE_TTL_ALPHA_VANTAGE_NODATA_MS=300000
CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS=60000

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FRED_API_KEY=your_fred_key
```

### Usage Examples

#### 1. Redis Cache Configuration
```typescript
import { EnhancedDataService } from './services/EnhancedDataService.js';

const dataService = new EnhancedDataService({
  cache: {
    type: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'tam_cache:',
      defaultTtl: 3600,
      enableFallback: true
    }
  },
  apiKeys: {
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY
  },
  enableDistributedInvalidation: true
});
```

#### 2. Hybrid Cache Configuration
```typescript
const dataService = new EnhancedDataService({
  cache: {
    type: 'hybrid',
    hybrid: {
      redis: {
        host: 'redis-cluster.example.com',
        port: 6379,
        keyPrefix: 'tam_cache:',
        enableFallback: true
      },
      memory: {
        persistenceOptions: {
          filePath: './.cache_data'
        }
      },
      fallbackTimeout: 1000
    }
  }
});
```

#### 3. Redis Cluster Configuration
```typescript
const dataService = new EnhancedDataService({
  cache: {
    type: 'redis',
    redis: {
      cluster: {
        enableOfflineQueue: false,
        redisOptions: {
          password: process.env.REDIS_PASSWORD
        }
      },
      keyPrefix: 'tam_cache:',
      enableFallback: true
    }
  }
});
```

#### 4. Memory Cache with Persistence (Original)
```typescript
const dataService = new EnhancedDataService({
  cache: {
    type: 'memory',
    memory: {
      persistenceOptions: {
        filePath: './.cache_data'
      }
    }
  }
});
```

## Usage Examples

### Basic Operations
```typescript
// Get company overview with enhanced caching
const overview = await dataService.getAlphaVantageData('OVERVIEW', { symbol: 'AAPL' });

// Get company financials with intelligent fallback
const financials = await dataService.getCompanyFinancials({
  companySymbol: 'MSFT',
  statementType: 'INCOME_STATEMENT',
  period: 'annual',
  limit: 3
});

// Get market size with multi-source fallback
const marketSize = await dataService.getMarketSize('AAPL', 'US');
```

### Cache Management
```typescript
// Invalidate specific cache patterns
await dataService.invalidateCache('alphavantage_OVERVIEW_*');

// Distributed cache invalidation
await dataService.invalidateDistributed('specific_key');

// Health check
const health = await dataService.healthCheck();
console.log('Service health:', health);

// Get detailed metrics
const metrics = await dataService.getMetrics();
console.log('Cache metrics:', metrics);
```

### Drop-in Replacement for Existing Code
```typescript
// Replace your existing DataService initialization
// OLD:
// const dataService = new DataService();

// NEW:
const dataService = new EnhancedDataService({
  cache: { type: 'redis' }, // or 'memory' for original behavior
  apiKeys: {
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY
  }
});
```

## Benefits

### Scalability
- **Shared Cache**: Multiple application instances share the same cache
- **Memory Efficiency**: Redis handles memory management and eviction
- **Horizontal Scaling**: Works with Redis clusters and sentinel

### Reliability
- **Persistence**: Cache survives application restarts
- **Fallback**: Graceful degradation when Redis is unavailable
- **Health Monitoring**: Real-time health checks and metrics

### Performance
- **Faster Lookups**: Redis optimized for fast key-value operations
- **Intelligent TTL**: Different cache durations for different data types
- **Pattern Operations**: Bulk operations and pattern matching

### Observability
- **Detailed Metrics**: Hit rates, latency, memory usage
- **Health Checks**: Service and cache health monitoring
- **Logging**: Comprehensive error and operation logging

## Deployment Considerations

### Docker Compose Example
```yaml
version: '3.8'
services:
  tam-mcp-server:
    build: .
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ALPHA_VANTAGE_API_KEY=${ALPHA_VANTAGE_API_KEY}
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### Production Redis Configuration
```bash
# Redis configuration for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
```

## Migration Guide

To migrate from the existing implementation:

1. **Install Redis dependencies**:
```bash
npm install ioredis
```

2. **Update your service initialization**:
```typescript
// Replace DataService with EnhancedDataService
import { EnhancedDataService } from './services/EnhancedDataService.js';

const dataService = new EnhancedDataService({
  cache: { type: 'redis' }, // Start with Redis
  // Add your existing API keys
});
```

3. **Optional: Enable gradual migration**:
```typescript
// Use hybrid cache for gradual migration
const dataService = new EnhancedDataService({
  cache: { type: 'hybrid' }, // Uses both Redis and memory
});
```

4. **Monitor and optimize**:
```typescript
// Monitor cache performance
setInterval(async () => {
  const metrics = await dataService.getMetrics();
  console.log('Cache hit rate:', metrics.cache.hitRate);
}, 60000);
```

## Testing

The Redis wrapper includes comprehensive fallback mechanisms, so your existing tests should continue to work. For Redis-specific testing:

```typescript
// Test Redis connectivity
const health = await dataService.healthCheck();
expect(health.cache.status).toBe('healthy');

// Test fallback behavior
// (Simulate Redis unavailability)
const data = await dataService.getAlphaVantageData('OVERVIEW', { symbol: 'TEST' });
expect(data).toBeDefined(); // Should work via fallback
```

This implementation provides a robust, scalable caching solution that maintains compatibility with your existing architecture while adding powerful Redis-based features for future growth.
