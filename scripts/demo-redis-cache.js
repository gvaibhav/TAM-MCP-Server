#!/usr/bin/env node

/**
 * Redis Cache Wrapper Demonstration
 * 
 * This script demonstrates how the Redis cache wrapper integrates with
 * the existing Alpha Vantage implementation, showing real-world data
 * fetching, caching, and performance improvements.
 */

import dotenv from 'dotenv';
import { createBasicRedisDataService } from '../config/redis-examples/basic-redis-config.js';
import { DataService } from '../src/services/DataService.js';

// Load environment variables
dotenv.config();

interface PerformanceMetrics {
  service: string;
  firstCallTime: number;
  secondCallTime: number;
  cacheHitTime: number;
  dataFreshness: Date | null;
  cacheStats: any;
}

async function demonstrateRedisIntegration() {
  console.log('🚀 Redis Cache Wrapper Demonstration\n');
  console.log('This demo shows how Redis caching enhances Alpha Vantage API integration\n');

  // Check for required API key
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    console.error('❌ ALPHA_VANTAGE_API_KEY is required for this demonstration');
    console.log('Please set your Alpha Vantage API key in the environment variables');
    process.exit(1);
  }

  const originalService = new DataService();
  let redisService: any;
  
  try {
    // Initialize Redis service
    console.log('🔧 Initializing Redis cache service...');
    redisService = createBasicRedisDataService();
    console.log('✅ Redis service initialized\n');

    // Test Redis connectivity
    console.log('🔗 Testing Redis connectivity...');
    const health = await redisService.healthCheck();
    console.log(`📊 Redis Status: ${health.status}`);
    console.log(`🔌 Connected: ${health.details?.connected || false}`);
    
    if (health.status === 'unhealthy') {
      console.log('⚠️  Redis is not available, falling back to memory cache');
    }
    console.log('');

    // Performance comparison
    await performanceComparison(originalService, redisService);

    // Real Alpha Vantage data demonstration
    await realDataDemonstration(redisService);

    // Cache management demonstration
    await cacheManagementDemo(redisService);

    // Distributed features demonstration
    await distributedFeaturesDemo(redisService);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  } finally {
    if (redisService) {
      await redisService.disconnect();
    }
    console.log('\n👋 Demo completed successfully!');
  }
}

async function performanceComparison(originalService: DataService, redisService: any) {
  console.log('⚡ Performance Comparison: Original vs Redis Cache\n');

  const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
  const results: PerformanceMetrics[] = [];

  for (const [serviceName, service] of [
    ['Original Memory Cache', originalService],
    ['Redis Cache', redisService]
  ] as const) {
    console.log(`📊 Testing ${serviceName}:`);

    const symbol = testSymbols[0]; // Use AAPL for comparison
    
    // First call - API fetch
    console.log(`   Fetching ${symbol} data (API call)...`);
    const start1 = Date.now();
    const data1 = await (service as any).getAlphaVantageData('OVERVIEW', { symbol });
    const firstCallTime = Date.now() - start1;
    
    if (!data1) {
      console.log(`   ❌ Failed to fetch data for ${symbol}`);
      continue;
    }

    console.log(`   ✅ First call: ${firstCallTime}ms`);
    console.log(`   📈 Company: ${data1.Name || data1.name || 'Unknown'}`);
    console.log(`   💰 Market Cap: ${data1.MarketCapitalization || data1.marketCapitalization || 'N/A'}`);

    // Second call - should hit cache
    console.log(`   Fetching ${symbol} data again (cache hit)...`);
    const start2 = Date.now();
    const data2 = await (service as any).getAlphaVantageData('OVERVIEW', { symbol });
    const secondCallTime = Date.now() - start2;
    
    console.log(`   ⚡ Cached call: ${secondCallTime}ms`);
    console.log(`   🚀 Speedup: ${(firstCallTime / secondCallTime).toFixed(2)}x faster\n`);

    // Get data freshness (Redis service only)
    let dataFreshness = null;
    if (serviceName.includes('Redis')) {
      try {
        dataFreshness = await service.alphaVantageService?.getDataFreshness(symbol, 'overview') || null;
      } catch (e) {
        // Ignore errors for freshness check
      }
    }

    results.push({
      service: serviceName,
      firstCallTime,
      secondCallTime,
      cacheHitTime: secondCallTime,
      dataFreshness,
      cacheStats: serviceName.includes('Redis') ? await service.getMetrics() : null
    });
  }

  // Summary
  console.log('📊 Performance Summary:');
  for (const result of results) {
    console.log(`   ${result.service}:`);
    console.log(`     API Call: ${result.firstCallTime}ms`);
    console.log(`     Cache Hit: ${result.cacheHitTime}ms`);
    console.log(`     Improvement: ${(result.firstCallTime / result.cacheHitTime).toFixed(2)}x`);
    if (result.dataFreshness) {
      console.log(`     Data Age: ${Math.round((Date.now() - result.dataFreshness.getTime()) / 1000)}s`);
    }
  }
  console.log('');
}

async function realDataDemonstration(redisService: any) {
  console.log('📈 Real Alpha Vantage Data Integration Demo\n');

  const companies = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' }
  ];

  console.log('Fetching real company data to demonstrate caching behavior...\n');

  for (const company of companies) {
    try {
      console.log(`🏢 Processing ${company.name} (${company.symbol}):`);
      
      const start = Date.now();
      const overview = await redisService.getAlphaVantageData('OVERVIEW', { symbol: company.symbol });
      const elapsed = Date.now() - start;

      if (overview) {
        console.log(`   ✅ Fetched in ${elapsed}ms`);
        console.log(`   📊 Name: ${overview.Name || 'N/A'}`);
        console.log(`   💰 Market Cap: ${formatMarketCap(overview.MarketCapitalization)}`);
        console.log(`   🏭 Sector: ${overview.Sector || 'N/A'}`);
        console.log(`   📍 Exchange: ${overview.Exchange || 'N/A'}`);
        console.log(`   💹 P/E Ratio: ${overview.PERatio || 'N/A'}`);
      } else {
        console.log(`   ❌ No data available (API limit or invalid symbol)`);
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log('');
  }

  // Show cache effectiveness
  const metrics = await redisService.getMetrics();
  if (metrics.cache) {
    const hitRate = metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses) * 100;
    console.log(`📊 Cache Performance:`);
    console.log(`   Hit Rate: ${hitRate.toFixed(2)}%`);
    console.log(`   Total Operations: ${metrics.cache.hits + metrics.cache.misses}`);
    console.log(`   Cache Size: ${metrics.cache.size} items`);
  }
  console.log('');
}

async function cacheManagementDemo(redisService: any) {
  console.log('🧹 Cache Management Demonstration\n');

  try {
    // Show current cache state
    const beforeMetrics = await redisService.getMetrics();
    console.log(`📊 Current cache state:`);
    console.log(`   Items in cache: ${beforeMetrics.cache?.size || 0}`);
    console.log(`   Cache hits: ${beforeMetrics.cache?.hits || 0}`);
    console.log('');

    // Demonstrate pattern-based invalidation
    console.log('🎯 Demonstrating pattern-based cache invalidation...');
    const invalidatedCount = await redisService.invalidateCache('alphavantage_OVERVIEW_*');
    console.log(`✅ Invalidated ${invalidatedCount} Alpha Vantage overview cache entries`);
    
    // Show cache state after invalidation
    const afterMetrics = await redisService.getMetrics();
    console.log(`📊 Cache state after invalidation:`);
    console.log(`   Items in cache: ${afterMetrics.cache?.size || 0}`);
    console.log('');

    // Demonstrate cache warming
    console.log('🔥 Cache warming demonstration...');
    const warmupSymbols = ['TSLA', 'NVDA'];
    
    for (const symbol of warmupSymbols) {
      console.log(`   Warming cache for ${symbol}...`);
      await redisService.getAlphaVantageData('OVERVIEW', { symbol });
    }
    
    const warmedMetrics = await redisService.getMetrics();
    console.log(`✅ Cache warmed. Items in cache: ${warmedMetrics.cache?.size || 0}`);
    console.log('');

  } catch (error) {
    console.log(`❌ Cache management demo error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function distributedFeaturesDemo(redisService: any) {
  console.log('🌐 Distributed Cache Features Demo\n');

  try {
    // Demonstrate distributed invalidation
    console.log('📡 Testing distributed cache invalidation...');
    await redisService.invalidateDistributed('demo_key_' + Date.now());
    console.log('✅ Distributed invalidation signal sent');
    console.log('   (In a multi-instance setup, all instances would receive this signal)');
    console.log('');

    // Show Redis-specific features
    console.log('🔧 Redis-specific features:');
    
    // Pattern matching
    console.log('   🔍 Pattern matching support:');
    const keys = await redisService.cacheService?.getKeysByPattern?.('alphavantage_*') || [];
    console.log(`     Found ${keys.length} Alpha Vantage cache keys`);
    
    // TTL management
    console.log('   ⏰ TTL management:');
    console.log('     Different TTLs for different data types (success, no-data, rate-limit)');
    console.log('     Automatic expiration prevents stale data');
    
    console.log('   🚀 Performance benefits:');
    console.log('     - Shared cache across multiple application instances');
    console.log('     - Persistent cache survives application restarts');
    console.log('     - Memory-efficient with Redis memory management');
    console.log('     - Advanced features like pub/sub for cache invalidation');
    
    console.log('');

  } catch (error) {
    console.log(`❌ Distributed features demo error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatMarketCap(marketCap: string | number | undefined): string {
  if (!marketCap || marketCap === 'None') return 'N/A';
  
  const value = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
  if (isNaN(value)) return 'N/A';
  
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the demonstration
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  demonstrateRedisIntegration().catch(console.error);
}
