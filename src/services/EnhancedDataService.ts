import { AlphaVantageService } from './datasources/AlphaVantageService.js';
import { FredService } from './datasources/FredService.js';
import { ImfService } from './datasources/ImfService.js';
import { NasdaqService } from './datasources/NasdaqService.js';
import { OecdService } from './datasources/OecdService.js';
import { WorldBankService } from './datasources/WorldBankService.js';
import { BlsService } from './datasources/BlsService.js';
import { CensusService } from './datasources/CensusService.js';
import { CacheFactory, CacheFactoryConfig, UnifiedCacheService } from '../cache/CacheFactory.js';
import { logger } from '../../utils/index.js';

export interface EnhancedDataServiceConfig {
  cache: CacheFactoryConfig;
  apiKeys?: {
    alphaVantage?: string;
    fred?: string;
    nasdaq?: string;
    census?: string;
    bls?: string;
  };
  enableDistributedInvalidation?: boolean;
  enableMetrics?: boolean;
}

export class EnhancedDataService {
  private alphaVantageService!: AlphaVantageService;
  private fredService!: FredService;
  private imfService!: ImfService;
  private nasdaqService!: NasdaqService;
  private oecdService!: OecdService;
  private worldBankService!: WorldBankService;
  private blsService!: BlsService;
  private censusService!: CensusService;
  private cacheService!: UnifiedCacheService;
  private config: EnhancedDataServiceConfig;

  constructor(config: EnhancedDataServiceConfig) {
    this.config = config;
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize cache service
      this.cacheService = await CacheFactory.create(this.config.cache);
      logger.info('EnhancedDataService: Cache service initialized', { 
        type: this.config.cache.type 
      });

      // Create a compatible cache interface for data source services
      const compatibleCache = this.createCompatibleCacheInterface();

      // Initialize data source services with enhanced cache
      this.alphaVantageService = new AlphaVantageService(
        compatibleCache, 
        this.config.apiKeys?.alphaVantage
      );
      
      this.fredService = new FredService(
        compatibleCache, 
        this.config.apiKeys?.fred
      );
      
      this.imfService = new ImfService(compatibleCache);
      this.nasdaqService = new NasdaqService(
        compatibleCache, 
        this.config.apiKeys?.nasdaq
      );
      
      this.oecdService = new OecdService(compatibleCache);
      this.worldBankService = new WorldBankService(compatibleCache);
      
      this.blsService = new BlsService(
        compatibleCache, 
        this.config.apiKeys?.bls
      );
      
      this.censusService = new CensusService(
        compatibleCache, 
        this.config.apiKeys?.census
      );

      // Setup distributed cache invalidation if enabled
      if (this.config.enableDistributedInvalidation && this.config.cache.type === 'redis') {
        this.setupDistributedInvalidation();
      }

      logger.info('EnhancedDataService: All services initialized successfully');
    } catch (error) {
      logger.error('EnhancedDataService: Failed to initialize services', { error });
      throw error;
    }
  }

  private createCompatibleCacheInterface(): any {
    // Create an interface that's compatible with the original CacheService
    return {
      get: <T>(key: string): Promise<T | null> => this.cacheService.get<T>(key),
      getEntry: <T>(key: string): Promise<any | null> => this.cacheService.getEntry<T>(key),
      set: <T>(key: string, value: T, ttl: number): Promise<void> => this.cacheService.set<T>(key, value, ttl),
      clear: (key: string): Promise<void> => this.cacheService.clear(key),
      clearAll: (): Promise<void> => this.cacheService.clearAll(),
      getStats: () => {
        // For synchronous compatibility, return a basic stats object
        // Real stats can be obtained via getDetailedStats()
        return { hits: 0, misses: 0, size: 0, lastRefreshed: new Date() };
      }
    };
  }

  private setupDistributedInvalidation(): void {
    if ('subscribeToInvalidations' in this.cacheService) {
      (this.cacheService as any).subscribeToInvalidations((key: string) => {
        logger.debug('EnhancedDataService: Received distributed cache invalidation', { key });
        // Could add custom logic here for handling invalidations
      });
    }
  }

  // Alpha Vantage methods with enhanced caching
  async getAlphaVantageData(apiFunction: string, params: any): Promise<any> {
    const cacheKey = `alphavantage_${apiFunction}_${JSON.stringify(params)}`;
    
    try {
      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        logger.debug('EnhancedDataService: Cache hit for Alpha Vantage data', { apiFunction });
        return cached;
      }

      // Fetch from service
      let result;
      switch (apiFunction) {
        case 'OVERVIEW':
          result = await this.alphaVantageService.getCompanyOverview(params.symbol);
          break;
        case 'SYMBOL_SEARCH':
          result = await this.alphaVantageService.searchSymbols(params.keywords);
          break;
        case 'INCOME_STATEMENT':
          result = await this.alphaVantageService.getIncomeStatement(params.symbol, params.period);
          break;
        case 'BALANCE_SHEET':
          result = await this.alphaVantageService.getBalanceSheet(params.symbol, params.period);
          break;
        case 'CASH_FLOW':
          result = await this.alphaVantageService.getCashFlow(params.symbol, params.period);
          break;
        default:
          throw new Error(`Function ${apiFunction} not implemented for AlphaVantageService`);
      }

      // Cache the result
      if (result) {
        await this.cacheService.set(cacheKey, result, 3600000); // 1 hour
      }

      return result;
    } catch (error) {
      logger.error('EnhancedDataService: Alpha Vantage operation failed', { apiFunction, error });
      throw error;
    }
  }

  // Company Financials with enhanced caching and error handling
  async getCompanyFinancials(params: any): Promise<any> {
    const { companySymbol, statementType, period, limit } = params;
    const cacheKey = `company_financials_${companySymbol}_${statementType}_${period}_${limit}`;
    
    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        logger.debug('EnhancedDataService: Cache hit for company financials', { 
          companySymbol, 
          statementType 
        });
        return cached;
      }

      // Fetch fresh data
      let result;
      switch (statementType) {
        case 'OVERVIEW':
          result = await this.alphaVantageService.getCompanyOverview(companySymbol);
          break;
        case 'INCOME_STATEMENT':
          const incomeData = await this.alphaVantageService.getIncomeStatement(companySymbol, period);
          result = limit > 1 ? incomeData.slice(0, limit) : incomeData[0] || incomeData;
          break;
        case 'BALANCE_SHEET':
          const balanceData = await this.alphaVantageService.getBalanceSheet(companySymbol, period);
          result = limit > 1 ? balanceData.slice(0, limit) : balanceData[0] || balanceData;
          break;
        case 'CASH_FLOW':
          const cashFlowData = await this.alphaVantageService.getCashFlow(companySymbol, period);
          result = limit > 1 ? cashFlowData.slice(0, limit) : cashFlowData[0] || cashFlowData;
          break;
        default:
          throw new Error(`Statement type ${statementType} not supported`);
      }

      // Cache the result with appropriate TTL
      if (result) {
        const ttl = statementType === 'OVERVIEW' ? 3600000 : 7200000; // Overview: 1h, Statements: 2h
        await this.cacheService.set(cacheKey, result, ttl);
      }

      return result;
    } catch (error) {
      logger.error('EnhancedDataService: Company financials operation failed', { 
        companySymbol, 
        statementType, 
        error 
      });
      throw error;
    }
  }

  // Market size with intelligent fallback strategy
  async getMarketSize(industryId: string, region?: string): Promise<any> {
    const cacheKey = `market_size_${industryId}_${region || 'global'}`;
    
    try {
      // Check cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        logger.debug('EnhancedDataService: Cache hit for market size', { industryId, region });
        return cached;
      }

      // Try multiple data sources with intelligent fallback
      const sources = [
        () => this.alphaVantageService.fetchMarketSize(industryId, region),
        () => this.censusService.fetchMarketSize(industryId, region, "EMP"),
        () => this.fredService.fetchMarketSize(industryId, region),
        () => this.worldBankService.fetchMarketSize(industryId, region)
      ];

      let result = null;
      let lastError = null;

      for (const source of sources) {
        try {
          result = await source();
          if (result) {
            break;
          }
        } catch (error) {
          lastError = error;
          logger.debug('EnhancedDataService: Market size source failed, trying next', { 
            industryId, 
            error 
          });
        }
      }

      if (result) {
        // Cache successful result
        await this.cacheService.set(cacheKey, result, 1800000); // 30 minutes
        logger.info('EnhancedDataService: Market size data retrieved successfully', { 
          industryId, 
          region,
          source: result.source || 'unknown'
        });
      } else {
        logger.warn('EnhancedDataService: No market size data found from any source', { 
          industryId, 
          region,
          lastError
        });
      }

      return result;
    } catch (error) {
      logger.error('EnhancedDataService: Market size operation failed', { 
        industryId, 
        region, 
        error 
      });
      throw error;
    }
  }

  // Cache management methods
  async invalidateCache(pattern: string): Promise<number> {
    try {
      if ('deleteByPattern' in this.cacheService) {
        const deletedCount = await (this.cacheService as any).deleteByPattern(pattern);
        logger.info('EnhancedDataService: Cache invalidated', { pattern, deletedCount });
        return deletedCount;
      }
      return 0;
    } catch (error) {
      logger.error('EnhancedDataService: Cache invalidation failed', { pattern, error });
      return 0;
    }
  }

  async invalidateDistributed(key: string): Promise<void> {
    try {
      if ('invalidateDistributed' in this.cacheService) {
        await (this.cacheService as any).invalidateDistributed(key);
        logger.debug('EnhancedDataService: Distributed invalidation sent', { key });
      }
    } catch (error) {
      logger.error('EnhancedDataService: Distributed invalidation failed', { key, error });
    }
  }

  // Health check and monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    cache: any;
  }> {
    try {
      const serviceChecks = await Promise.allSettled([
        this.alphaVantageService.isAvailable().then(available => ({ alphaVantage: { available } })),
        this.fredService.isAvailable().then(available => ({ fred: { available } })),
        this.censusService.isAvailable().then(available => ({ census: { available } })),
        this.blsService.isAvailable().then(available => ({ bls: { available } }))
      ]);

      const services = serviceChecks.reduce((acc, check) => {
        if (check.status === 'fulfilled') {
          Object.assign(acc, check.value);
        }
        return acc;
      }, {});

      const cacheHealth = this.cacheService.healthCheck 
        ? await this.cacheService.healthCheck()
        : { status: 'healthy' };

      const overallStatus = cacheHealth.status === 'healthy' ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        services,
        cache: cacheHealth
      };
    } catch (error) {
      logger.error('EnhancedDataService: Health check failed', { error });
      return {
        status: 'unhealthy',
        services: {},
        cache: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getMetrics(): Promise<any> {
    try {
      const cacheStats = await this.cacheService.getStats();
      const health = await this.healthCheck();
      
      return {
        cache: cacheStats,
        health,
        timestamp: new Date(),
        config: {
          cacheType: this.config.cache.type,
          distributedInvalidation: this.config.enableDistributedInvalidation,
          metricsEnabled: this.config.enableMetrics
        }
      };
    } catch (error) {
      logger.error('EnhancedDataService: Failed to get metrics', { error });
      return {
        error: 'Failed to retrieve metrics',
        timestamp: new Date()
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.cacheService.disconnect) {
        await this.cacheService.disconnect();
      }
      logger.info('EnhancedDataService: Disconnected successfully');
    } catch (error) {
      logger.error('EnhancedDataService: Disconnect failed', { error });
    }
  }
}
