// src/services/dataSources/fredService.ts
import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { fredApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_FRED_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_FRED_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

export class FredService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.FRED_API_KEY;
    if (!this.apiKey) {
      console.error("ℹ️  FRED: API key not configured - service disabled (set FRED_API_KEY to enable)");
    } else {
      console.error("✅ FRED: Service enabled");
    }
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_FRED_MS', DEFAULT_TTL_FRED_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_FRED_NODATA_MS', DEFAULT_TTL_FRED_NODATA_MS);
  }

  async fetchIndustryData(industryId: string): Promise<any> {
    // ... (implementation remains unchanged)
     if (!await this.isAvailable()) throw new Error('FRED API key is not configured or service is unavailable.');
    console.log(`FredService: Fetching industry data for ${industryId}`);
    throw new Error('FredService.fetchIndustryData not yet implemented');
  }

  async fetchMarketSize(regionOrSeriesId: string, seriesIdParam?: string): Promise<any> {
    const seriesId = seriesIdParam || regionOrSeriesId;
    const cacheKey = `fred_marketsize_${seriesId}`;

    if (!await this.isAvailable()) {
      throw new Error('FRED API key is not configured or service is unavailable.');
    }

    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log(`FredService: Returning cached market size for series ${seriesId}`);
      return cachedData;
    }

    console.log(`FredService: Fetching market size for series ${seriesId} from API`);
    const apiUrl = `${fredApi.baseUrl}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=1`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data && response.data.observations && response.data.observations.length > 0) {
        const marketData = response.data.observations.map((obs: any) => ({
          realtime_start: obs.realtime_start,
          realtime_end: obs.realtime_end,
          date: obs.date,
          value: parseFloat(obs.value) || null,
        }));
        await this.cacheService.set(cacheKey, marketData, this.successfulFetchTtl);
        return marketData;
      } else if (response.data && response.data.observations && response.data.observations.length === 0) {
        console.warn(`FredService: No market size data (observations) found for series ${seriesId}`);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      } else {
        // ... (error handling for unexpected structure remains unchanged)
        if (response.data && response.data.error_message) {
            throw new Error(`FRED API Error: ${response.data.error_message}`);
        }
        throw new Error('Unexpected response structure from FRED API');
      }
    } catch (error: any) {
      // ... (error handling for API call failure remains unchanged)
      console.error(`FredService: Error fetching market size for series ${seriesId}:`, error.message);
      if (axios.isAxiosError(error) && error.response?.data?.error_message) {
        throw new Error(`FRED API Error: ${error.response.data.error_message}`);
      }
      throw error;
    }
  }

  // ... (isAvailable, getDataFreshness, getCacheStatus remain unchanged)
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getDataFreshness(seriesId: string): Promise<Date | null> {
    const cacheKey = `fred_marketsize_${seriesId}`;
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
