// src/services/dataSources/alphaVantageService.ts
import axios from 'axios';
import * as process from 'process';
import { DataSourceService } from '../../types/dataSources.js';
import { CacheEntry, CacheStatus } from '../../types/cache.js';
import { CacheService } from '../cache/cacheService.js';
import { alphaVantageApi } from '../../config/apiConfig.js';
import { getEnvAsNumber } from '../../utils/envHelper.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const DEFAULT_TTL_NODATA_MS = 1 * 60 * 60 * 1000; // 1 hour
const DEFAULT_TTL_RATELIMIT_MS = 5 * 60 * 1000; // 5 minutes for rate limit errors

export class AlphaVantageService implements DataSourceService {
  private apiKey: string | undefined;
  private cacheService: CacheService;
  private successfulFetchTtl: number;
  private noDataFetchTtl: number;
  private rateLimitErrorTtl: number;

  constructor(cacheService: CacheService, apiKey?: string) {
    this.cacheService = cacheService;
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY;
    if (!this.apiKey) {
      console.warn("Alpha Vantage API key not configured. AlphaVantageService will not be available.");
    }
    this.successfulFetchTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_MS', DEFAULT_TTL_MS);
    this.noDataFetchTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_NODATA_MS', DEFAULT_TTL_NODATA_MS);
    this.rateLimitErrorTtl = getEnvAsNumber('CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS', DEFAULT_TTL_RATELIMIT_MS);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  /**
   * Fetches company overview, using MarketCapitalization as a proxy for "market size" of a company.
   * @param symbol The company stock symbol (e.g., "IBM", "AAPL").
   * @param region Optional region parameter (unused by Alpha Vantage for company overview).
   */
  async fetchMarketSize(symbol: string, _region?: string): Promise<any | null> {
    if (!await this.isAvailable()) {
      throw new Error('Alpha Vantage API key is not configured or service is unavailable.');
    }
    const functionType = alphaVantageApi.defaultOverviewFunction; // OVERVIEW
    const cacheKey = `alphavantage_${functionType}_${symbol}`;

    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log(`AlphaVantageService: Returning cached overview for symbol ${symbol}`);
      return cachedData; // This will be the market cap value or null if cached as no data
    }

    // Alpha Vantage rate limit: 25 requests per day for free tier as of 2024.
    // Previous info mentioned 500/day or 5/min, API docs should be checked.
    // Aggressive caching is key.
    console.log(`AlphaVantageService: Fetching overview for symbol ${symbol} from API`);
    const apiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${functionType}&symbol=${symbol}&apikey=${this.apiKey}`;

    try {
      const response = await axios.get(apiUrl);
      // Check for rate limit response from Alpha Vantage
      // "Note":"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency."
      if (response.data && response.data.Note && response.data.Note.includes("API call frequency")) {
        console.warn(`AlphaVantageService: API rate limit likely reached for ${symbol}. Note: ${response.data.Note}`);
        await this.cacheService.set(cacheKey, null, this.rateLimitErrorTtl); // Cache null for a short period
        return null;
      }

      if (response.data && response.data.Symbol && response.data.MarketCapitalization && response.data.MarketCapitalization !== "None" && parseFloat(response.data.MarketCapitalization) > 0) {
        const marketCap = parseFloat(response.data.MarketCapitalization);
        const overviewData = { // Store the whole overview, but marketSize will focus on MarketCap
            symbol: response.data.Symbol,
            name: response.data.Name,
            description: response.data.Description,
            marketCapitalization: marketCap,
            PERatio: response.data.PERatio,
            EPS: response.data.EPS,
            exchange: response.data.Exchange,
            currency: response.data.Currency,
            country: response.data.Country,
            sector: response.data.Sector,
            industry: response.data.Industry,
            // ... other relevant fields from OVERVIEW
        };
        await this.cacheService.set(cacheKey, overviewData, this.successfulFetchTtl);
        return overviewData; // Return the full overview object
      } else if (response.data && response.data.Symbol && (response.data.MarketCapitalization === "None" || response.data.MarketCapitalization === "0" || !response.data.MarketCapitalization)) {
         console.warn(`AlphaVantageService: No market capitalization data found for symbol ${symbol}. API Response:`, response.data.MarketCapitalization === "None" ? "MarketCap is 'None'" : response.data);
         await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
         return null;
      }
      else {
        console.warn(`AlphaVantageService: Unexpected response or no data for overview ${symbol}:`, response.data);
        // It's possible an empty object {} is returned for unknown symbols
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }
    } catch (error: any) {
      console.error(`AlphaVantageService: Error fetching overview for ${symbol}:`, error.message);
      // Consider specific error handling for network issues vs API issues
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl); // Cache null on error to prevent rapid retries
      throw error; // Re-throw to allow DataService to try other sources or handle
    }
  }

  /**
   * Fetches time series data (e.g., daily stock prices) for a given symbol.
   * @param symbol The company stock symbol (e.g., "IBM", "AAPL").
   * @param seriesType Alpha Vantage time series function (e.g., TIME_SERIES_DAILY_ADJUSTED).
   */
  async fetchIndustryData(symbol: string, seriesType: string = alphaVantageApi.defaultTimeSeriesFunction): Promise<any | null> {
    if (!await this.isAvailable()) {
      throw new Error('Alpha Vantage API key is not configured or service is unavailable.');
    }
    const cacheKey = `alphavantage_timeseries_${seriesType}_${symbol}`;

    const cachedData = await this.cacheService.get<any>(cacheKey);
    if (cachedData) {
      console.log(`AlphaVantageService: Returning cached time series for ${seriesType} ${symbol}`);
      return cachedData;
    }

    console.log(`AlphaVantageService: Fetching time series ${seriesType} for ${symbol} from API`);
    // Example for TIME_SERIES_DAILY_ADJUSTED. Other series might need different params (e.g. interval for intraday)
    const apiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${seriesType}&symbol=${symbol}&apikey=${this.apiKey}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data && response.data.Note && response.data.Note.includes("API call frequency")) {
        console.warn(`AlphaVantageService: API rate limit likely reached for ${seriesType} ${symbol}. Note: ${response.data.Note}`);
        await this.cacheService.set(cacheKey, null, this.rateLimitErrorTtl);
        return null;
      }

      const timeSeriesKey = Object.keys(response.data).find(k => k.includes("Time Series"));
      if (timeSeriesKey && response.data[timeSeriesKey]) {
        const transformedData = {
            metaData: response.data["Meta Data"],
            timeSeries: response.data[timeSeriesKey] // Keep original structure from AV for now
        };
        await this.cacheService.set(cacheKey, transformedData, this.successfulFetchTtl);
        return transformedData;
      } else {
        console.warn(`AlphaVantageService: No time series data found or unexpected structure for ${seriesType} ${symbol}:`, response.data);
        await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
        return null;
      }
    } catch (error: any) {
      console.error(`AlphaVantageService: Error fetching time series ${seriesType} for ${symbol}:`, error.message);
      await this.cacheService.set(cacheKey, null, this.noDataFetchTtl);
      throw error;
    }
  }

  async getDataFreshness(symbol: string, dataType: 'overview' | 'timeseries' = 'overview', seriesType?: string): Promise<Date | null> {
    let cacheKey: string;
    if (dataType === 'overview') {
      cacheKey = `alphavantage_${alphaVantageApi.defaultOverviewFunction}_${symbol}`;
    } else {
      cacheKey = `alphavantage_timeseries_${seriesType || alphaVantageApi.defaultTimeSeriesFunction}_${symbol}`;
    }
    const entry = await (this.cacheService as any).getEntry?.(cacheKey) as CacheEntry<any> | null;
    return entry?.timestamp ? new Date(entry.timestamp) : null;
  }

  getCacheStatus(): CacheStatus {
    return (this.cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, lastRefreshed: null };
  }
}
