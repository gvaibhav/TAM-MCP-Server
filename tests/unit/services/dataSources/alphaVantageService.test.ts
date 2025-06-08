import axios from 'axios';
import { AlphaVantageService } from '../../../../src/services/dataSources/alphaVantageService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { alphaVantageApi } from '../../../../src/config/apiConfig'; // For default function names
import * as process from 'process';

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;

describe('AlphaVantageService', () => {
  let alphaVantageService: AlphaVantageService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;
  const OLD_ENV = { ...process.env }; // Deep copy
  const apiKey = 'test_alpha_vantage_api_key';

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV }; // Reset env for each test
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    // Service will be instantiated in context blocks or tests to control API key presence
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore original env
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
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      delete process.env.ALPHA_VANTAGE_API_KEY;
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
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
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
        alphaVantageService = new AlphaVantageService(mockCacheServiceInstance, apiKey);
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
        (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

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
        (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

        const freshness = await alphaVantageService.getDataFreshness(symbol, 'timeseries', seriesType);
        expect(freshness).toEqual(new Date(now));
        expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(timeSeriesCacheKey);
    });
     it('should return null if no cache entry for getDataFreshness', async () => {
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(null);
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
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(alphaVantageService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });
});
