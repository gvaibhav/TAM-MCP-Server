#!/usr/bin/env node

/**
 * API Health Check Script
 * Quickly test if all external APIs are accessible and responding
 */

import { FredService } from '../src/services/dataSources/fredService.js';
import { BlsService } from '../src/services/dataSources/blsService.js';
import { AlphaVantageService } from '../src/services/dataSources/alphaVantageService.js';
import { CensusService } from '../src/services/dataSources/censusService.js';
import { ImfService } from '../src/services/dataSources/imfService.js';
import { OecdService } from '../src/services/dataSources/oecdService.js';
import { NasdaqDataService } from '../src/services/dataSources/nasdaqDataService.js';
import { CacheService } from '../src/services/cache/cacheService.js';
import { PersistenceService } from '../src/services/cache/persistenceService.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ApiHealthChecker {
  constructor() {
    const persistenceService = new PersistenceService({ filePath: './.health_check_cache' });
    this.cacheService = new CacheService(persistenceService);
  }

  async checkService(serviceName, serviceClass, testCall) {
    try {
      console.log(`🔍 Checking ${serviceName}...`);
      
      const service = new serviceClass(this.cacheService);
      const isAvailable = await service.isAvailable();
      
      if (!isAvailable) {
        console.log(`⚠️  ${serviceName}: Service not available (likely missing API key)`);
        return { status: 'unavailable', reason: 'API key not configured' };
      }

      // Try a test call
      const result = await testCall(service);
      console.log(`✅ ${serviceName}: HEALTHY`);
      return { status: 'healthy', data: result };

    } catch (error) {
      console.log(`❌ ${serviceName}: ERROR - ${error.message}`);
      return { status: 'error', error: error.message };
    }
  }

  async runHealthChecks() {
    console.log('🏥 API Health Check Starting...\n');

    const checks = [
      {
        name: 'FRED (Federal Reserve)',
        service: FredService,
        test: async (service) => {
          // Try to fetch GDP data (should return a number or throw)
          return await service.fetchMarketSize('GDPC1');
        }
      },
      {
        name: 'BLS (Bureau of Labor Statistics)',
        service: BlsService,
        test: async (service) => {
          // Try to fetch employment data
          return await service.fetchIndustryData(['CES0000000001'], '2023', '2023');
        }
      },
      {
        name: 'Alpha Vantage (Stock Data)',
        service: AlphaVantageService,
        test: async (service) => {
          // Try to fetch Apple stock data
          return await service.fetchMarketSize('AAPL');
        }
      },
      {
        name: 'Census Bureau',
        service: CensusService,
        test: async (service) => {
          // Try to fetch industry data
          return await service.fetchIndustryData('2022', 'acs', 'acs1', ['NAME'], { for: 'state:01' });
        }
      },
      {
        name: 'IMF (International Monetary Fund)',
        service: ImfService,
        test: async (service) => {
          // Try to fetch GDP data
          return await service.fetchImfDataset('IFS', 'A.US.NGDP_RPCH', '2022', '2023');
        }
      },
      {
        name: 'OECD',
        service: OecdService,
        test: async (service) => {
          // Try to fetch GDP data
          return await service.fetchOecdDataset('QNA', 'USA.GDP.GPSA.Q');
        }
      },
      {
        name: 'NASDAQ Data Link',
        service: NasdaqDataService,
        test: async (service) => {
          // Try to fetch treasury data
          return await service.fetchDatasetTimeSeries('FRED', 'GS10', { limit: 1 });
        }
      }
    ];

    const results = {};
    
    for (const check of checks) {
      results[check.name] = await this.checkService(check.name, check.service, check.test);
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('📊 Health Check Summary:');
    console.log('========================');
    
    const healthy = Object.values(results).filter(r => r.status === 'healthy').length;
    const unavailable = Object.values(results).filter(r => r.status === 'unavailable').length;
    const errors = Object.values(results).filter(r => r.status === 'error').length;
    
    console.log(`✅ Healthy: ${healthy}`);
    console.log(`⚠️  Unavailable: ${unavailable}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (errors > 0) {
      console.log('\n🔧 Error Details:');
      Object.entries(results)
        .filter(([_, result]) => result.status === 'error')
        .forEach(([name, result]) => {
          console.log(`  ${name}: ${result.error}`);
        });
    }

    if (unavailable > 0) {
      console.log('\n💡 To enable unavailable services, configure these environment variables:');
      console.log('  FRED_API_KEY, BLS_API_KEY, ALPHA_VANTAGE_API_KEY, CENSUS_API_KEY, NASDAQ_DATA_LINK_API_KEY');
    }

    return results;
  }
}

// Run the health check
const checker = new ApiHealthChecker();
checker.runHealthChecks()
  .then(() => {
    console.log('\n🏁 Health check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Health check failed:', error);
    process.exit(1);
  });
