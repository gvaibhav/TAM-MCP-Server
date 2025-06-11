// src/services/dataSources/worldBankService.ts
import axios from 'axios';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { worldBankApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_WORLD_BANK_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_WORLD_BANK_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

export class WorldBankService implements DataSourceService {
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_WORLD_BANK_MS', DEFAULT_TTL_WORLD_BANK_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_WORLD_BANK_NODATA_MS', DEFAULT_TTL_WORLD_BANK_NODATA_MS);
    // Use stderr for initialization logs to avoid contaminating stdout in STDIO transport
    console.error("✅ World Bank: Service enabled (public access)");
  }

  async fetchIndustryData(industryId: string): Promise<any> {
    // ... (implementation remains unchanged)
    console.log(`WorldBankService: Fetching industry data for ${industryId}`);
    throw new Error('WorldBankService.fetchIndustryData not yet implemented');
  }

  async fetchMarketSize(countryCode: string, indicator: string = worldBankApi.defaultGdpIndicator): Promise<any> {
    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const cachedData = await this.cacheService.get<any>(cacheKey);

    if (cachedData) {
      console.log(`WorldBankService: Returning cached market size for ${countryCode}, indicator ${indicator}`);
      return cachedData;
    }

    console.log(`WorldBankService: Fetching market size for ${countryCode}, indicator ${indicator} from API`);
    const apiUrl = `${worldBankApi.baseUrl}/country/${countryCode}/indicator/${indicator}?format=json&mrv=1`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data && response.data.length > 1 && response.data[1] && response.data[1].length > 0) {
        const marketData = response.data[1].map((item: any) => ({
          country: item.country.value,
          countryISO3Code: item.countryiso3code,
          date: item.date,
          value: item.value,
          unit: item.unit,
          indicator: item.indicator.value,
        }));
        await this.cacheService.set(cacheKey, marketData, this.successfulFetchTtl);
        return marketData;
      } else if (response.data && response.data.length > 1 && response.data[1] && response.data[1].length === 0) {
        console.warn(`WorldBankService: No market size data found for ${countryCode}, indicator ${indicator}`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      } else {
        throw new Error('Unexpected response structure from World Bank API');
      }
    } catch (error: any) {
      // ... (error handling remains unchanged)
      console.error(`WorldBankService: Error fetching market size for ${countryCode}, indicator ${indicator}:`, error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Details:', error.response.data);
      }
      throw error;
    }
  }

  // ... (isAvailable, getDataFreshness, getCacheStatus remain unchanged)
  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getDataFreshness(countryCode: string, indicator: string = worldBankApi.defaultGdpIndicator): Promise<Date | null> {
    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    if (entry?.timestamp) {
      return new Date(entry.timestamp);
    }
    return null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
