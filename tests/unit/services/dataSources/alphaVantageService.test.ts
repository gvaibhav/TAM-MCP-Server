import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import axios from 'axios';
import { AlphaVantageService } from '../../../../src/services/dataSources/alphaVantageService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { alphaVantageApi } from '../../../../src/config/apiConfig'; // For default function names
import * as process from 'process';
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock

vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper'); // Mock the envHelper

const mockedAxios = axios as any;
const MockedCacheService = CacheService as any;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as any;

describe('AlphaVantageService', () => {
  let alphaVantageService: AlphaVantageService;
  let mockCacheServiceInstance: any;
  const OLD_ENV = { ...process.env }; // Deep copy
  const apiKey = 'test_alpha_vantage_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    // Use vi.stubEnv to safely mock environment variables
    vi.unstubAllEnvs();
    mockCacheServiceInstance = new MockedCacheService() as any;
    // Default mock for getEnvAsNumber, can be overridden in specific tests
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // Service will be instantiated in context blocks or tests to control API key presence
  });

  afterAll(() => {
    vi.unstubAllEnvs(); // Clean up environment variable stubs
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if ALPHA_VANTAGE_API_KEY is in process.env', async () => {
      process.env.ALPHA_VANTAGE_API_KEY = apiKey;
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance);
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance);
      expect(await alphaVantageService.isAvailable()).toBe(false);
    });
     it('should warn if API key is not configured', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubEnv('ALPHA_VANTAGE_API_KEY', undefined);
      new AlphaVantageService(mockCacheServiceInstance); // Instantiation triggers the warning
      expect(consoleWarnSpy).toHaveBeenCalledWith("Alpha Vantage API key not configured. AlphaVantageService will not be available.");
      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchMarketSize (Company Overview)', () => {
    const symbol = 'IBM';
    const overviewFunction = alphaVantageApi.defaultOverviewFunction;
    const cacheKey = `alphavantage_${overviewFunction}_${symbol}`;
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${overviewFunction}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        // Default instantiation for most tests in this block
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_ALPHA_VANTAGE_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { Symbol: 'IBM', MarketCapitalization: '150B' };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 987654;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_MS') return customSuccessTTL;
        return 1000; // Default for other TTLs
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), customSuccessTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_ALPHA_VANTAGE_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { Symbol: 'IBM', MarketCapitalization: "None" };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 123456;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should use TTL from env var for rate limit response when CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxios.get.mockResolvedValue({ data: rateLimitResponse });

      const customRateLimitTTL = 456789;
       mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS') return customRateLimitTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customRateLimitTTL);
    });


    it('should return data from cache if available', async () => {
      const cachedOverview = { marketCapitalization: 50000000000 };
      mockCacheServiceInstance.get.mockResolvedValue(cachedOverview);

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toEqual(cachedOverview);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache overview data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = {
        Symbol: 'IBM',
        Name: 'International Business Machines Corp',
        Description: 'IBM is a global technology company.',
        MarketCapitalization: '150000000000',
        PERatio: '20',
        EPS: '5.00',
        Exchange: 'NYSE',
        Currency: 'USD',
        Country: 'USA',
        Sector: 'TECHNOLOGY',
        Industry: 'IT SERVICES',
      };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const expectedData = {
        symbol: 'IBM',
        name: 'International Business Machines Corp',
        description: 'IBM is a global technology company.',
        marketCapitalization: 150000000000,
        PERatio: '20',
        EPS: '5.00',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'USA',
        sector: 'TECHNOLOGY',
        industry: 'IT SERVICES',
      };

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toEqual(expectedData);
      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number)); // Default successful TTL
    });

    it('should handle API rate limit response and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! Our standard API call frequency is..." };
      mockedAxios.get.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // Rate limit TTL
    });

    it('should handle "MarketCapitalization": "None" and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noMarketCapResponse = { Symbol: 'TEST', MarketCapitalization: "None" };
      mockedAxios.get.mockResolvedValue({ data: noMarketCapResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // No data TTL
    });

    it('should handle empty object response (unknown symbol) and cache null', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const emptyResponse = {};
        mockedAxios.get.mockResolvedValue({ data: emptyResponse });

        const result = await alphaVantageService.fetchMarketSize(symbol);
        expect(result).toBeNull();
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // No data TTL
    });

    it('should throw error and cache null if API call fails', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(alphaVantageService.fetchMarketSize(symbol)).rejects.toThrow('API Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // No data TTL on error
    });
     it('should throw error if API key is not configured', async () => {
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance); // No API key
      delete process.env.ALPHA_VANTAGE_API_KEY;
      await expect(alphaVantageService.fetchMarketSize(symbol)).rejects.toThrow('Alpha Vantage API key is not configured or service is unavailable.');
    });
  });

  describe('fetchIndustryData (Time Series)', () => {
    const symbol = 'MSFT';
    const seriesType = alphaVantageApi.defaultTimeSeriesFunction;
    const cacheKey = `alphavantage_timeseries_${seriesType}_${symbol}`;
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${seriesType}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        // alphaVantageService is instantiated with apiKey here from parent describe or a local one
        // For this block, ensure it's the one with the API key
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful time series fetch', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { "Meta Data": {}, "Time Series (Daily)": {} };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 112233;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_MS') return customSuccessTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), customSuccessTTL);
    });

    it('should use TTL from env var for no data response in time series fetch', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { "Meta Data": {} }; // No time series key
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 445566;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should use TTL from env var for rate limit response in time series fetch', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxios.get.mockResolvedValue({ data: rateLimitResponse });

      const customRateLimitTTL = 778899;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS') return customRateLimitTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customRateLimitTTL);
    });

    it('should fetch and cache data correctly for a different seriesType (e.g., WEEKLY)', async () => {
      // apiKey is in scope from the describe block for AlphaVantageService
      // alphaVantageService instance from the beforeEach will be used.
      // We need to ensure its TTLs are what we expect or re-initialize if testing custom TTLs.

      const weeklySeriesType = 'TIME_SERIES_WEEKLY_ADJUSTED';
      const weeklyCacheKey = `alphavantage_timeseries_${weeklySeriesType}_${symbol}`;
      const weeklyMockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${weeklySeriesType}&symbol=${symbol}&apikey=${apiKey}`;

      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseWeekly = {
        "Meta Data": { "1. Information": "Weekly Adjusted Prices..." },
        "Weekly Adjusted Time Series": { "2023-01-06": { "1. open": "220" } },
      };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseWeekly });

      const expectedDataWeekly = {
        metaData: { "1. Information": "Weekly Adjusted Prices..." },
        timeSeries: { "2023-01-06": { "1. open": "220" } },
      };

      // Set up getEnvAsNumber for this specific test to ensure the default successful TTL is used
      // or a specific one if CACHE_TTL_ALPHA_VANTAGE_MS was being tested.
      // The service instance `alphaVantageService` was created in beforeEach using the default mock for getEnvAsNumber.
      // So, it will use the default successfulFetchTtl from its constructor.
      const expectedSuccessfulTTL = 24 * 60 * 60 * 1000; // This is the default from the service
      // If we wanted to test a *custom* TTL from env for *this* call, we'd do:
      // mockedGetEnvAsNumber.mockImplementationOnce((key, defVal) => key === 'CACHE_TTL_ALPHA_VANTAGE_MS' ? myCustomTTL : defVal);
      // alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey); // then re-init
      // For this test, we're confirming it works with another series type and uses *a* successful TTL.
      // The parent `beforeEach` for the service already ensures `mockedGetEnvAsNumber` returns default values,
      // so `alphaVantageService.successfulFetchTtl` will be the default.

      const result = await alphaVantageService.fetchIndustryData(symbol, weeklySeriesType);

      expect(result).toEqual(expectedDataWeekly);
      expect(mockedAxios.get).toHaveBeenCalledWith(weeklyMockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(weeklyCacheKey, expectedDataWeekly, expectedSuccessfulTTL);
    });

    it('should return data from cache if available', async () => {
      const cachedTimeSeries = { metaData: {}, timeSeries: {} };
      mockCacheServiceInstance.get.mockResolvedValue(cachedTimeSeries);

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(cachedTimeSeries);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache time series data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = {
        "Meta Data": { "1. Information": "Daily Prices..." },
        "Time Series (Daily)": { "2023-01-01": { "1. open": "100" } },
      };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const expectedData = {
        metaData: { "1. Information": "Daily Prices..." },
        timeSeries: { "2023-01-01": { "1. open": "100" } },
      };

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(expectedData);
      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number)); // Successful TTL
    });

    it('should handle API rate limit for time series and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxios.get.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // Rate limit TTL
    });

    it('should handle no time series data in response and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noDataResponse = { "Meta Data": { "1. Information": "..." } }; // Missing Time Series key
      mockedAxios.get.mockResolvedValue({ data: noDataResponse });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // No data TTL
    });

    it('should throw error and cache null if API call for time series fails', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network Failure'));

      await expect(alphaVantageService.fetchIndustryData(symbol, seriesType)).rejects.toThrow('Network Failure');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // No data TTL on error
    });
  });

  describe('getDataFreshness', () => {
    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should get freshness for overview data', async () => {
        const symbol = 'AAPL';
        const now = Date.now();
        const overviewCacheKey = `alphavantage_${alphaVantageApi.defaultOverviewFunction}_${symbol}`;
        const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 1000 };
        (mockCacheServiceInstance as any).getEntry = vi.fn().mockResolvedValue(cacheEntry);

        const freshness = await alphaVantageService.getDataFreshness(symbol, 'overview');
        expect(freshness).toEqual(new Date(now));
        expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(overviewCacheKey);
    });

    it('should get freshness for time series data', async () => {
        const symbol = 'GOOG';
        const seriesType = 'TIME_SERIES_WEEKLY';
        const now = Date.now();
        const timeSeriesCacheKey = `alphavantage_timeseries_${seriesType}_${symbol}`;
        const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 1000 };
        (mockCacheServiceInstance as any).getEntry = vi.fn().mockResolvedValue(cacheEntry);

        const freshness = await alphaVantageService.getDataFreshness(symbol, 'timeseries', seriesType);
        expect(freshness).toEqual(new Date(now));
        expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(timeSeriesCacheKey);
    });
     it('should return null if no cache entry for getDataFreshness', async () => {
      (mockCacheServiceInstance as any).getEntry = vi.fn().mockResolvedValue(null);
      const freshness = await alphaVantageService.getDataFreshness('NONE', 'overview');
      expect(freshness).toBeNull();
    });
  });
   describe('getCacheStatus', () => {
     beforeEach(() => {
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 5, misses: 2, size: 10, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = vi.fn().mockReturnValue(mockStats);
      expect(alphaVantageService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });
});
