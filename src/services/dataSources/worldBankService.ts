import axios from 'axios';
import { DataSourceService } from '../../types/dataSources';
import { CacheStatus, CacheEntry } from '../../types/cache'; // Import CacheEntry
import { CacheService } from '../cache/cacheService';

// Example: GDP (current US$) indicator
const GDP_INDICATOR = 'NY.GDP.MKTP.CD';
// Base URL for World Bank API v2, JSON format
const WORLD_BANK_API_BASE_URL = 'https://api.worldbank.org/v2';

export class WorldBankService implements DataSourceService {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  async fetchIndustryData(industryId: string): Promise<any> {
    console.log(`WorldBankService: Fetching industry data for ${industryId}`);
    // For World Bank, "industry data" might translate to specific economic indicators related to an industry.
    // This will require mapping industryId to specific World Bank indicators or series.
    // This is more complex than market size and will be implemented later.
    throw new Error('WorldBankService.fetchIndustryData not yet implemented');
  }

  async fetchMarketSize(countryCode: string, indicator: string = GDP_INDICATOR): Promise<any> {
    // World Bank API uses country codes (e.g., 'US', 'GB', 'CN') rather than regions directly for many indicators.
    // 'region' might need to be mapped to a specific country code or an aggregate region code if available.
    // For simplicity, this example uses 'countryCode' as the primary identifier.
    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const cachedData = await this.cacheService.get<any>(cacheKey);

    if (cachedData) {
      console.log(`WorldBankService: Returning cached market size for ${countryCode}, indicator ${indicator}`);
      return cachedData;
    }

    console.log(`WorldBankService: Fetching market size for ${countryCode}, indicator ${indicator} from API`);
    // API URL for fetching data for a specific indicator and country, json format, last 10 years.
    // Adjust 'date=2020:2023' or 'mrv=1' (most recent value) as needed.
    const apiUrl = `${WORLD_BANK_API_BASE_URL}/country/${countryCode}/indicator/${indicator}?format=json&mrv=1`;

    try {
      const response = await axios.get(apiUrl);
      // World Bank API response structure:
      // response.data is an array:
      // - response.data[0] contains pagination info (page, pages, per_page, total, sourceid, lastupdated)
      // - response.data[1] contains an array of data points for the indicator
      if (response.data && response.data.length > 1 && response.data[1] && response.data[1].length > 0) {
        const marketData = response.data[1].map((item: any) => ({
          country: item.country.value,
          countryISO3Code: item.countryiso3code,
          date: item.date,
          value: item.value,
          unit: item.unit,
          indicator: item.indicator.value,
        }));

        // Cache for 1 day (24 * 60 * 60 * 1000 ms)
        await this.cacheService.set(cacheKey, marketData, 24 * 60 * 60 * 1000);
        return marketData;
      } else if (response.data && response.data.length > 1 && response.data[1] && response.data[1].length === 0) {
        // No data available for the specific query
        console.warn(`WorldBankService: No market size data found for ${countryCode}, indicator ${indicator}`);
        // Cache the "no data" result for a shorter period to avoid repeated failed calls for non-existent data
        await this.cacheService.set(cacheKey, null, 1 * 60 * 60 * 1000); // Cache 'null' for 1 hour
        return null;
      } else {
        // Unexpected response structure
        throw new Error('Unexpected response structure from World Bank API');
      }
    } catch (error: any) {
      console.error(`WorldBankService: Error fetching market size for ${countryCode}, indicator ${indicator}:`, error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Details:', error.response.data);
      }
      // In case of error, don't cache, or cache an error state for a short period.
      // For now, just re-throwing.
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // World Bank API is generally available without a key
  }

  async getDataFreshness(countryCode?: string, indicator: string = GDP_INDICATOR): Promise<Date | null> {
    // If countryCode is not provided, we can't form a specific cache key.
    // This method might need to be adapted based on how freshness is generally determined.
    // For now, let's assume it requires a countryCode to check a specific entry.
    if (!countryCode) {
        // Or return the lastRefreshed time from global cache stats as a rough estimate.
        // This depends on the desired meaning of "data freshness" for the service as a whole.
        const stats = this.getCacheStatus();
        return stats.lastRefreshed;
    }

    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const entry = await this.cacheService.getEntry<any>(cacheKey);

    if (entry && entry.timestamp) {
      // The World Bank API provides 'lastupdated' in response.data[0].lastupdated
      // For more accuracy, this 'lastupdated' field from the source should be stored in the CacheEntry's data payload or metadata.
      // For example, when setting the cache:
      // const actualDataToCache = { sourceLastUpdated: response.data[0].lastupdated, payload: marketData };
      // await this.cacheService.set(cacheKey, actualDataToCache, ...);
      // Then, here you would access entry.data.sourceLastUpdated.
      // For now, using the cache entry's own timestamp.
      return new Date(entry.timestamp);
    }
    return null;
  }

  getCacheStatus(): CacheStatus {
    // This could be enhanced if CacheService supports getting stats for keys with a specific prefix,
    // e.g., this.cacheService.getStats({ prefix: 'worldbank_' });
    // For now, returning global stats or a simplified view.
    // If getStats is part of CacheService class and not on its instance, it needs to be called correctly.
    // Assuming getStats() is a method of the cacheService instance.
    if (typeof this.cacheService.getStats === 'function') {
        return this.cacheService.getStats();
    }
    // Fallback if getStats is not available or not as expected.
    return { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
