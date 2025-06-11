// src/services/dataSources/blsService.ts
import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { blsApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

interface BlsApiParams {
  seriesid: string[];
  startyear?: string;
  endyear?: string;
  catalog?: boolean;
  calculations?: boolean; // for percentage changes, etc.
  annualaverage?: boolean;
  registrationkey?: string;
}

export class BlsService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.BLS_API_KEY;
    if (this.apiKey) {
        console.log("BLS Service: API key configured.");
    } else {
        console.log("BLS Service: API key not configured. Using anonymous access (lower limits).");
    }
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_BLS_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_BLS_NODATA_MS', DEFAULT_TTL_NODATA_MS);
  }

  /**
   * BLS API is available even without a key, but with stricter limits.
   * This service will attempt to use the key if provided.
   */
  async isAvailable(): Promise<boolean> {
    // For practical purposes, we can consider it available.
    // The actual success of a call will depend on BLS API limits.
    return true;
  }

  /**
   * Fetches data for one or more BLS series IDs.
   * @param seriesIds An array of BLS series IDs.
   * @param startYear Optional start year.
   * @param endYear Optional end year.
   * @param catalog Whether to include catalog data for series.
   * @param calculations Whether to include net/percentage calculations.
   * @param annualAverage Whether to include annual averages.
   */
  async fetchIndustryData(
    seriesIds: string[],
    startYear?: string,
    endYear?: string,
    catalog: boolean = false,
    calculations: boolean = false,
    annualAverage: boolean = false
  ): Promise<any | null> {
    if (!seriesIds || seriesIds.length === 0) {
      throw new Error("BLS series IDs must be provided.");
    }
    // Max 50 series IDs per request for registered users, 25 for anonymous (as of some docs)
    if (seriesIds.length > (this.apiKey ? 50 : 25)) {
        // This should ideally be handled by splitting into multiple requests if needed,
        // or the caller should be aware. For now, just a warning/error.
        console.warn(`BLS Service: Requested ${seriesIds.length} series. Max is ${this.apiKey ? 50 : 25}. Truncating or erroring might occur from API.`);
        // Potentially throw error or truncate: throw new Error(`Too many series IDs. Max: ${this.apiKey ? 50 : 25}`);
    }

    const requestPayload: BlsApiParams = {
      seriesid: seriesIds,
      catalog,
      calculations,
      annualaverage: annualAverage
    };
    if (startYear) requestPayload.startyear = startYear;
    if (endYear) requestPayload.endyear = endYear;
    if (this.apiKey) requestPayload.registrationkey = this.apiKey;

    const cacheKeyPayload = { ...requestPayload }; // Create a copy for cache key
    delete cacheKeyPayload.registrationkey; // Don't include API key in cache key
    const cacheKey = `bls_data_${JSON.stringify(cacheKeyPayload)}`;

    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log(`BLS Service: Returning cached data for series ${seriesIds.join(',')}`);
      return cachedData;
    }

    console.log(`BLS Service: Fetching data for series ${seriesIds.join(',')} from API.`);
    const apiUrl = blsApi.baseUrlV2; // This is POST, so URL is just base

    try {
      const response = await axios.post(apiUrl, requestPayload, {
          headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.status === "REQUEST_SUCCEEDED") {
        // The actual data is in response.data.Results.series
        // We can return the whole "Results" object or just the "series" array
        const results = response.data.Results;
        if (results && results.series && results.series.length > 0) {
            await this.cacheService.set(cacheKey, results, this.successfulFetchTtl);
            return results;
        } else {
            console.warn(`BLS Service: Request succeeded but no series data returned for ${seriesIds.join(',')}. Message: ${response.data.message?.join('; ')}`);
            await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
            return null;
        }
      } else {
        const messages = response.data.message ? response.data.message.join('; ') : 'Unknown BLS API error condition.';
        console.warn(`BLS Service: API request did not succeed for ${seriesIds.join(',')}. Status: ${response.data.status}. Messages: ${messages}`);
        // Cache null even if request "failed" by BLS status, to avoid hammering on bad requests
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        // Consider throwing a more specific error based on BLS messages
        throw new Error(`BLS API Error: ${messages} (Status: ${response.data.status})`);
      }
    } catch (error: any) {
      console.error(`BLS Service: Error fetching data for ${seriesIds.join(',')}:`, error.message);
      // Also cache null on axios errors
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        console.error('BLS API Error Details:', error.response.data);
         // BLS errors might be in error.response.data too for HTTP errors
        const errorData = error.response.data;
        if (errorData.status && errorData.message) {
             throw new Error(`BLS API Error: ${errorData.message.join('; ')} (Status: ${errorData.status})`);
        }
      }
      throw error;
    }
  }

  /**
   * fetchMarketSize is not directly applicable in a generic way for BLS
   * as "market size" isn't a standard BLS series concept.
   * Users should use fetchIndustryData with specific series IDs.
   */
  async fetchMarketSize(_industryId: string, _region?: string): Promise<any | null> { // Added region to match interface
    console.warn("BLS Service: fetchMarketSize is not directly applicable. Use fetchIndustryData with specific series IDs (industryId can be a series ID, region is ignored).");
    // Example: could map industryId to a known high-level employment series
    // if (industryId === 'TOTAL_NONFARM_EMPLOYMENT_US') { // This is a conceptual example
    //   const results = await this.fetchIndustryData(['CES0000000001'], undefined, undefined, false, false, true); // Get annual average
    //   if (results && results.series && results.series[0] && results.series[0].data && results.series[0].data.length > 0) {
    //     // Find the latest annual average data point
    //     const latestAnnualData = results.series[0].data.find((d: any) => d.period === 'M13'); // M13 is annual average
    //     if (latestAnnualData) {
    //         return {
    //             value: parseFloat(latestAnnualData.value), // Latest annual average value
    //             year: latestAnnualData.year,
    //             seriesId: results.series[0].seriesID,
    //             source: 'BLS'
    //         };
    //     }
    //   }
    // }
    return null;
  }

  async getDataFreshness(seriesIds: string[], startYear?: string, endYear?: string, catalog: boolean = false, calculations: boolean = false, annualAverage: boolean = false): Promise<Date | null> {
    const requestPayload: Partial<BlsApiParams> = { seriesid: seriesIds, catalog, calculations, annualaverage: annualAverage };
    if (startYear) requestPayload.startyear = startYear;
    if (endYear) requestPayload.endyear = endYear;
    // Note: registrationkey is not part of cacheKeyPayload, so it's fine
    const cacheKey = `bls_data_${JSON.stringify(requestPayload)}`;

    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
