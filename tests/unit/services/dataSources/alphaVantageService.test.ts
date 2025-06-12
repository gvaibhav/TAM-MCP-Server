import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AlphaVantageService } from '../../../../src/services/datasources/AlphaVantageService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { alphaVantageApi } from '../../../../src/config/apiConfig';
import * as envHelper from '../../../../src/utils/envHelper';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper');

const mockedAxiosGet = vi.mocked(axios.get);
const MockedCacheService = CacheService as unknown as ReturnType<typeof vi.fn>; // Mocked Constructor
const mockedGetEnvAsNumber = vi.mocked(envHelper.getEnvAsNumber);

describe('AlphaVantageService', () => {
  let alphaVantageService: AlphaVantageService;
  let mockCacheServiceInstance: InstanceType<typeof CacheService>;
  const apiKey = 'test_alpha_vantage_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
    mockCacheServiceInstance = new MockedCacheService() as InstanceType<typeof CacheService>;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // alphaVantageService instantiated in describe blocks or tests
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if ALPHA_VANTAGE_API_KEY is in process.env', async () => {
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: apiKey });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance);
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: undefined });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance);
      expect(await alphaVantageService.isAvailable()).toBe(false);
    });
     it('should warn if API key is not configured', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: undefined });
      new AlphaVantageService(mockCacheServiceInstance);
      expect(consoleErrorSpy).toHaveBeenCalledWith("ℹ️  Alpha Vantage: API key not configured - service disabled (set ALPHA_VANTAGE_API_KEY to enable)");
      consoleErrorSpy.mockRestore();
    });
  });

  describe('fetchMarketSize (Company Overview)', () => {
    const symbol = 'IBM';
    const overviewFunction = alphaVantageApi.defaultOverviewFunction;
    const cacheKey = `alphavantage_${overviewFunction}_${symbol}`;
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${overviewFunction}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_ALPHA_VANTAGE_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = { Symbol: 'IBM', MarketCapitalization: '150B' }; // Simplified for this test focus
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 987654;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_MS') return customSuccessTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), customSuccessTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_ALPHA_VANTAGE_NODATA_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoData = { Symbol: 'IBM', MarketCapitalization: "None" };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 123456;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should use TTL from env var for rate limit response when CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

      const customRateLimitTTL = 456789;
       mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS') return customRateLimitTTL;
        return 1000;
      });
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);

      await alphaVantageService.fetchMarketSize(symbol);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customRateLimitTTL);
    });


    it('should return data from cache if available', async () => {
      const cachedOverview = { marketCapitalization: 50000000000 };
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(cachedOverview);

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toEqual(cachedOverview);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache overview data if not in cache', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = {
        Symbol: 'IBM', Name: 'International Business Machines Corp', Description: 'IBM is a global technology company.',
        MarketCapitalization: '150000000000', PERatio: '20', EPS: '5.00', Exchange: 'NYSE',
        Currency: 'USD', Country: 'USA', Sector: 'TECHNOLOGY', Industry: 'IT SERVICES',
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedData = {
        symbol: 'IBM', name: 'International Business Machines Corp', description: 'IBM is a global technology company.',
        marketCapitalization: 150000000000, PERatio: '20', EPS: '5.00', exchange: 'NYSE',
        currency: 'USD', country: 'USA', sector: 'TECHNOLOGY', industry: 'IT SERVICES',
      };

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toEqual(expectedData);
      expect(mockedAxiosGet).toHaveBeenCalledWith(mockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number));
    });

    it('should handle API rate limit response and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! Our standard API call frequency is..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle "MarketCapitalization": "None" and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const noMarketCapResponse = { Symbol: 'TEST', MarketCapitalization: "None" };
      mockedAxiosGet.mockResolvedValue({ data: noMarketCapResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle empty object response (unknown symbol) and cache null', async () => {
        vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
        const emptyResponse = {};
        mockedAxiosGet.mockResolvedValue({ data: emptyResponse });

        const result = await alphaVantageService.fetchMarketSize(symbol);
        expect(result).toBeNull();
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should throw error and cache null if API call fails', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      await expect(alphaVantageService.fetchMarketSize(symbol)).rejects.toThrow('API Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });
     it('should throw error if API key is not configured', async () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance);
      await expect(alphaVantageService.fetchMarketSize(symbol)).rejects.toThrow('Alpha Vantage API key is not configured or service is unavailable.');
    });

    it('should handle specific network errors like timeout and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const timeoutError = new Error('ECONNABORTED'); // Simulate a timeout error
      (timeoutError as any).code = 'ECONNABORTED'; // Axios often adds a code property
      mockedAxiosGet.mockRejectedValue(timeoutError);

      // Assuming default noDataFetchTtl will be used from constructor via getEnvAsNumber default mock
      const expectedNoDataTTL = 1 * 60 * 60 * 1000;

      await expect(alphaVantageService.fetchMarketSize(symbol)).rejects.toThrow('ECONNABORTED');
      // Verify it caches null with the noData TTL (or a specific error TTL if implemented)
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expectedNoDataTTL);
    });
  });

  describe('fetchIndustryData (Time Series)', () => {
    const symbol = 'MSFT';
    const seriesType = alphaVantageApi.defaultTimeSeriesFunction;
    const cacheKey = `alphavantage_timeseries_${seriesType}_${symbol}`;
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${seriesType}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful time series fetch', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = { "Meta Data": {}, "Time Series (Daily)": {} };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

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
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoData = { "Meta Data": {} };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

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
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

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
      const weeklySeriesType = 'TIME_SERIES_WEEKLY_ADJUSTED';
      const weeklyCacheKey = `alphavantage_timeseries_${weeklySeriesType}_${symbol}`;
      const weeklyMockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${weeklySeriesType}&symbol=${symbol}&apikey=${apiKey}`;

      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseWeekly = {
        "Meta Data": { "1. Information": "Weekly Adjusted Prices..." },
        "Weekly Adjusted Time Series": { "2023-01-06": { "1. open": "220" } },
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseWeekly });

      const expectedDataWeekly = {
        metaData: { "1. Information": "Weekly Adjusted Prices..." },
        timeSeries: { "2023-01-06": { "1. open": "220" } },
      };

      const expectedSuccessfulTTL = 24 * 60 * 60 * 1000;
      mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => {
           if (key === 'CACHE_TTL_ALPHA_VANTAGE_MS') return expectedSuccessfulTTL; // Ensure this specific key returns it
           return defaultValue; // Fallback for other keys if any are used by constructor
       });
       // Re-instantiate to ensure constructor picks up the above mock for CACHE_TTL_ALPHA_VANTAGE_MS
      alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);


      const result = await alphaVantageService.fetchIndustryData(symbol, weeklySeriesType);

      expect(result).toEqual(expectedDataWeekly);
      expect(mockedAxiosGet).toHaveBeenCalledWith(weeklyMockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(weeklyCacheKey, expectedDataWeekly, expectedSuccessfulTTL);
    });

    it('should return data from cache if available', async () => {
      const cachedTimeSeries = { metaData: {}, timeSeries: {} };
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(cachedTimeSeries);

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(cachedTimeSeries);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache time series data if not in cache', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = {
        "Meta Data": { "1. Information": "Daily Prices..." },
        "Time Series (Daily)": { "2023-01-01": { "1. open": "100" } },
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedData = {
        metaData: { "1. Information": "Daily Prices..." },
        timeSeries: { "2023-01-01": { "1. open": "100" } },
      };

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(expectedData);
      expect(mockedAxiosGet).toHaveBeenCalledWith(mockApiUrl);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number));
    });

    it('should handle API rate limit for time series and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle no time series data in response and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const noDataResponse = { "Meta Data": { "1. Information": "..." } };
      mockedAxiosGet.mockResolvedValue({ data: noDataResponse });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should throw error and cache null if API call for time series fails', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      mockedAxiosGet.mockRejectedValue(new Error('Network Failure'));

      await expect(alphaVantageService.fetchIndustryData(symbol, seriesType)).rejects.toThrow('Network Failure');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });
  });

  describe('getDataFreshness', () => {
    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
    });

    it('should get freshness for overview data', async () => {
        const symbol = 'AAPL';
        const now = Date.now(); // Will use faked time
        const overviewCacheKey = `alphavantage_${alphaVantageApi.defaultOverviewFunction}_${symbol}`;
        const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 1000 };
        vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(cacheEntry);

        const freshness = await alphaVantageService.getDataFreshness(symbol, 'overview');
        expect(freshness).toEqual(new Date(now));
        expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(overviewCacheKey);
    });

    it('should get freshness for time series data', async () => {
        const symbol = 'GOOG';
        const seriesType = 'TIME_SERIES_WEEKLY';
        const now = Date.now(); // Will use faked time
        const timeSeriesCacheKey = `alphavantage_timeseries_${seriesType}_${symbol}`;
        const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 1000 };
        vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(cacheEntry);

        const freshness = await alphaVantageService.getDataFreshness(symbol, 'timeseries', seriesType);
        expect(freshness).toEqual(new Date(now));
        expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(timeSeriesCacheKey);
    });
     it('should return null if no cache entry for getDataFreshness', async () => {
      vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(null);
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
      vi.mocked(mockCacheServiceInstance.getStats).mockReturnValue(mockStats);
      expect(alphaVantageService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });
});
