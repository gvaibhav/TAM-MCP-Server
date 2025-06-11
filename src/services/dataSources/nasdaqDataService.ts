// src/services/dataSources/nasdaqDataService.ts
import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { nasdaqDataApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour

interface NasdaqDatasetParams {
  limit?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  order?: 'asc' | 'desc';
  column_index?: number;
  // Add other potential params from Nasdaq API
}

export class NasdaqDataService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.NASDAQ_DATA_LINK_API_KEY;
    if (!this.apiKey) {
      console.warn("Nasdaq Data Link API key not configured. NasdaqDataService will not be available.");
    }
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_NASDAQ_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_NASDAQ_NODATA_MS', DEFAULT_TTL_NODATA_MS);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  private async fetchDatasetTimeSeries(
    databaseCode: string,
    datasetCode: string,
    apiParams?: NasdaqDatasetParams
  ): Promise<any[] | null> {
    if (!await this.isAvailable()) {
      throw new Error('Nasdaq Data Link API key is not configured.');
    }

    const paramsString = apiParams ? JSON.stringify(apiParams) : 'default';
    const cacheKey = `nasdaq_${databaseCode}_${datasetCode}_${paramsString}`;

    const cachedData = await this.cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`NasdaqDataService: Returning cached data for ${databaseCode}/${datasetCode} with params ${paramsString}`);
      return cachedData;
    }

    const queryParams = { ...apiParams, api_key: this.apiKey };
    const apiUrl = `${nasdaqDataApi.baseUrl}/${databaseCode}/${datasetCode}/data.json`;

    console.log(`NasdaqDataService: Fetching data for ${databaseCode}/${datasetCode} from API with params:`, apiParams);

    try {
      const response = await axios.get(apiUrl, { params: queryParams });

      if (response.data && response.data.dataset_data) {
        const { column_names, data } = response.data.dataset_data;
        if (data && data.length > 0) {
          const transformedData = data.map((row: any[]) => {
            const rowObject: any = {};
            column_names.forEach((colName: string, index: number) => {
              rowObject[colName] = row[index];
            });
            return rowObject;
          });
          await this.cacheService.set(cacheKey, transformedData, this.successfulFetchTtl);
          return transformedData;
        } else {
          console.warn(`NasdaqDataService: No data points found for ${databaseCode}/${datasetCode}.`);
          await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
          return null;
        }
      } else if (response.data.quandl_error) {
         console.warn(`NasdaqDataService: API error for ${databaseCode}/${datasetCode}: ${response.data.quandl_error.message}`);
         await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
         return null; // Or throw specific error
      } else {
        console.warn(`NasdaqDataService: Unexpected response structure for ${databaseCode}/${datasetCode}.`, response.data);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }
    } catch (error: any) {
      console.error(`NasdaqDataService: Error fetching data for ${databaseCode}/${datasetCode}:`, error.message);
      if (error.response && error.response.data && error.response.data.quandl_error) {
        console.error('API Error Details:', error.response.data.quandl_error);
        // Cache null to prevent rapid retries for known API errors (like not found, invalid key)
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        throw new Error(`Nasdaq API Error: ${error.response.data.quandl_error.message} (Code: ${error.response.data.quandl_error.code})`);
      }
      // For other errors (network etc.), also cache null to avoid hammering
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
      throw error;
    }
  }

  /**
   * Fetches a time series dataset. Can be used as a proxy for "industry data".
   * @param databaseCode Database code (e.g., "FRED").
   * @param datasetCode Dataset code (e.g., "GDP").
   * @param params Optional API parameters like start_date, end_date, limit.
   */
  async fetchIndustryData(databaseCode: string, datasetCode: string, params?: NasdaqDatasetParams): Promise<any[] | null> {
    return this.fetchDatasetTimeSeries(databaseCode, datasetCode, params);
  }

  /**
   * Fetches a dataset and attempts to extract a single "market size" value.
   * This is a simplified interpretation. It might fetch the latest value of a series.
   * @param databaseCode Database code.
   * @param datasetCode Dataset code.
   * @param valueColumn The name of the column containing the value. Defaults to 'Value' or uses the first non-'Date' column.
   * @param date Optional: specific date to find the value for (YYYY-MM-DD). If not provided, latest is used.
   */
  async fetchMarketSize(databaseCode: string, datasetCode: string, valueColumn?: string, date?: string): Promise<any | null> {
    const params: NasdaqDatasetParams = { order: 'desc' };
    if (date) {
        // For a specific date, it's often better to fetch a small range around it if the API doesn't support exact date match well,
        // or fetch a single point if the API guarantees it. Nasdaq API uses start_date and end_date.
        params.start_date = date;
        params.end_date = date;
        params.limit = 1; // We only want one record for the specific date
    } else {
        params.limit = 1; // Get the most recent single data point
    }


    const timeSeries = await this.fetchDatasetTimeSeries(databaseCode, datasetCode, params);

    if (timeSeries && timeSeries.length > 0) {
      const targetPoint = timeSeries[0]; // Due to limit=1 and order=desc (or specific date), this is our target.

      // If a specific date was requested, we already filtered by it in the API call.
      // Here, we just confirm we got data. If timeSeries[0] exists, it's for that date (or latest).

      let resolvedValueColumn = valueColumn;
      if (!resolvedValueColumn) {
        const keys = Object.keys(targetPoint);
        // Prioritize common names, then numeric non-Date columns, then fallback.
        resolvedValueColumn =
            keys.find(k => k.toLowerCase() === 'value') ||
            keys.find(k => k.toLowerCase() === 'close') || // Common in financial data
            keys.find(k => k.toLowerCase() !== 'date' && typeof targetPoint[k] === 'number') ||
            keys[1]; // Fallback to the second column (assuming first is 'Date')
      }

      if (targetPoint.hasOwnProperty(resolvedValueColumn as string)) {
        return {
          date: targetPoint.Date || date, // Date from data or requested date
          value: targetPoint[resolvedValueColumn as string],
          sourceDataset: `${databaseCode}/${datasetCode}`,
          valueColumn: resolvedValueColumn,
          fullRecord: targetPoint
        };
      } else {
        console.warn(`NasdaqDataService: Value column "${resolvedValueColumn}" not found in data for ${databaseCode}/${datasetCode}. Available columns: ${Object.keys(targetPoint).join(', ')}`);
        return null;
      }
    }
    return null;
  }

  async getDataFreshness(databaseCode: string, datasetCode: string, apiParams?: NasdaqDatasetParams): Promise<Date | null> {
    const paramsString = apiParams ? JSON.stringify(apiParams) : 'default';
    const cacheKey = `nasdaq_${databaseCode}_${datasetCode}_${paramsString}`;
    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
