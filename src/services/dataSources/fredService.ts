import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources';
import { CacheStatus, CacheEntry } from '../../types/cache'; // Import CacheEntry
import { CacheService } from '../cache/cacheService';

const FRED_API_BASE_URL = 'https://api.stlouisfed.org/fred';

export class FredService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.FRED_API_KEY;
    if (!this.apiKey) {
      console.warn("FRED API key not configured. FredService will not be available.");
    }
  }

  async fetchIndustryData(industryId: string): Promise<any> {
    if (!await this.isAvailable()) throw new Error('FRED API key is not configured or service is unavailable.');
    console.log(`FredService: Fetching industry data for ${industryId}`);
    // This will require mapping industryId to specific FRED series IDs.
    throw new Error('FredService.fetchIndustryData not yet implemented');
  }

  async fetchMarketSize(regionOrSeriesId: string, seriesIdParam?: string): Promise<any> {
    // Allow more flexible use:
    // fetchMarketSize("GDP") -> uses "GDP" as series_id, assumes general (e.g., US)
    // fetchMarketSize("US", "GDPCA") -> region "US", series_id "GDPCA" (Real GDP for California)
    // For simplicity, the first param is treated as the primary series_id if second is undefined.
    // A more robust implementation might involve complex logic for region mapping.
    const seriesId = seriesIdParam || regionOrSeriesId;
    const cacheKey = `fred_marketsize_${seriesId}`; // Region might be part of seriesId or handled by specific series

    if (!await this.isAvailable()) {
      throw new Error('FRED API key is not configured or service is unavailable.');
    }

    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log(`FredService: Returning cached market size for series ${seriesId}`);
      return cachedData;
    }

    console.log(`FredService: Fetching market size for series ${seriesId} from API`);
    // Request most recent observation
    const apiUrl = `${FRED_API_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=1`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data && response.data.observations && response.data.observations.length > 0) {
        const marketData = response.data.observations.map((obs: any) => ({
          realtime_start: obs.realtime_start,
          realtime_end: obs.realtime_end,
          date: obs.date,
          value: parseFloat(obs.value) || null, // FRED values can be "." for missing
        }));

        // Cache for 1 day
        await this.cacheService.set(cacheKey, marketData, 24 * 60 * 60 * 1000);
        return marketData;
      } else if (response.data && response.data.observations && response.data.observations.length === 0) {
        console.warn(`FredService: No market size data (observations) found for series ${seriesId}`);
        await this.cacheService.set(cacheKey, null, 1 * 60 * 60 * 1000); // Cache 'null' for 1 hour
        return null;
      } else {
        console.error('FredService: Unexpected response structure or error message from FRED API:', response.data.error_message || response.data);
        // Check for specific error messages from FRED
        if (response.data && response.data.error_message) {
            throw new Error(`FRED API Error: ${response.data.error_message}`);
        }
        throw new Error('Unexpected response structure from FRED API');
      }
    } catch (error: any) {
      console.error(`FredService: Error fetching market size for series ${seriesId}:`, error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Details:', error.response.data);
         // FRED API often returns errors with a 400 status and an error_message in the body
        if (error.response.data && error.response.data.error_message) {
            throw new Error(`FRED API Error: ${error.response.data.error_message}`);
        }
      }
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getDataFreshness(seriesId: string): Promise<Date | null> {
    const cacheKey = `fred_marketsize_${seriesId}`;
    // Type assertion to CacheService to access getEntry, assuming it's part of the class
    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    if (entry?.timestamp) {
      // FRED data also has a 'date' in observations, which is the measurement date.
      // The 'last_updated' for the series itself might be available via a different FRED endpoint (series details).
      // For now, cache timestamp is a good proxy for when we got it.
      return new Date(entry.timestamp);
    }
    return null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
