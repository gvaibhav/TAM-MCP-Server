import { vi, describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import axios from 'axios';
import { FredService } from '../../../../src/services/dataSources/fredService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import * as envHelper from '../../../../src/utils/envHelper';
import * as process from 'process';


vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper');

const mockedAxiosGet = vi.mocked(axios.get);
const MockedCacheService = CacheService as unknown as ReturnType<typeof vi.fn>; // Mocked Constructor
const mockedGetEnvAsNumber = vi.mocked(envHelper.getEnvAsNumber);
const OLD_ENV = { ...process.env };


describe('FredService', () => {
  let fredService: FredService;
  let mockCacheServiceInstance: InstanceType<typeof CacheService>;
  const apiKey = 'test_fred_api_key';
  const seriesId = 'GDP';
  const cacheKey = `fred_marketsize_${seriesId}`;
  const mockApiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;


  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...OLD_ENV };
    mockCacheServiceInstance = new MockedCacheService() as InstanceType<typeof CacheService>;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // fredService instantiated in describe blocks or tests to control API key
  });

   afterAll(() => {
    process.env = OLD_ENV;
  });

  // afterEach is not strictly needed here as vi.resetAllMocks() handles mock states
  // and process.env is reset in beforeEach. vi.restoreAllMocks() is for spies.

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      fredService = new FredService(mockCacheServiceInstance, apiKey);
      expect(await fredService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if FRED_API_KEY is in process.env', async () => {
      process.env.FRED_API_KEY = apiKey;
      fredService = new FredService(mockCacheServiceInstance);
      expect(await fredService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      delete process.env.FRED_API_KEY;
      fredService = new FredService(mockCacheServiceInstance);
      expect(await fredService.isAvailable()).toBe(false);
    });

    it('should warn if API key is not configured', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      delete process.env.FRED_API_KEY;
      new FredService(mockCacheServiceInstance);
      expect(consoleWarnSpy).toHaveBeenCalledWith("FRED API key not configured. FredService will not be available.");
      consoleWarnSpy.mockRestore();
    });
  });


  describe('fetchMarketSize', () => {
    beforeEach(() => {
        fredService = new FredService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_FRED_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = { observations: [{ date: '2023-01-01', value: '123.45' }] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const customTTL = 700000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_FRED_MS') return customTTL;
        return 1000;
      });
      fredService = new FredService(mockCacheServiceInstance, apiKey);

      await fredService.fetchMarketSize(seriesId);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_FRED_NODATA_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoData = { observations: [] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 80000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_FRED_NODATA_MS') return customNoDataTTL;
        return 100000;
      });
      fredService = new FredService(mockCacheServiceInstance, apiKey);

      await fredService.fetchMarketSize(seriesId);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ date: '2023-01-01', value: 25000 }];
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(cachedData);

      const result = await fredService.fetchMarketSize(seriesId);

      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('should fetch from API, transform, and cache if not in cache', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = {
        observations: [
          { realtime_start: '2023-11-01', realtime_end: '2023-11-01', date: '2023-07-01', value: '25462.7' },
        ],
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedTransformedData = [
        { realtime_start: '2023-11-01', realtime_end: '2023-11-01', date: '2023-07-01', value: 25462.7 },
      ];

      const result = await fredService.fetchMarketSize(seriesId);

      expect(mockedAxiosGet).toHaveBeenCalledWith(mockApiUrl);
      expect(result).toEqual(expectedTransformedData);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedTransformedData, expect.any(Number));
    });

    it('should handle API response with no observations and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoData = { observations: [] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

      const result = await fredService.fetchMarketSize(seriesId);

      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should throw error if API key is not configured', async () => {
      delete process.env.FRED_API_KEY;
      fredService = new FredService(mockCacheServiceInstance); // No API key

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('FRED API key is not configured or service is unavailable.');
    });

    it('should throw error if API call fails with standard error', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      mockedAxiosGet.mockRejectedValue(new Error('Network Error'));

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('Network Error');
    });

    it('should throw specific error if FRED API returns an error_message', async () => {
        vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
        const fredErrorResponse = { response: { data: { error_message: "Invalid API Key" } } };
        // Simulate Axios error object structure
        const axiosError = { ...new Error("Request failed"), isAxiosError: true, ...fredErrorResponse };
        mockedAxiosGet.mockRejectedValue(axiosError);

        await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('FRED API Error: Invalid API Key');
    });
     it('should throw for unexpected API response structure', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const unexpectedResponse = { series: [] }; // Missing 'observations'
      mockedAxiosGet.mockResolvedValue({ data: unexpectedResponse });

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('Unexpected response structure from FRED API');
    });
  });

  describe('getDataFreshness', () => {
     beforeEach(() => {
        fredService = new FredService(mockCacheServiceInstance, apiKey);
    });
    it('should return timestamp from cache entry', async () => {
      const now = Date.now(); // Vitest fake timers might affect this if not reset/advanced properly
      const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 3600000 };
      vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(cacheEntry);

      const freshness = await fredService.getDataFreshness(seriesId);
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });

    it('should return null if no cache entry', async () => {
      vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(null);
      const freshness = await fredService.getDataFreshness(seriesId);
      expect(freshness).toBeNull();
    });
  });

   describe('getCacheStatus', () => {
     beforeEach(() => {
        fredService = new FredService(mockCacheServiceInstance, apiKey);
    });
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 1, size: 1, lastRefreshed: new Date() };
      vi.mocked(mockCacheServiceInstance.getStats).mockReturnValue(mockStats);
      expect(fredService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });

  describe('fetchIndustryData', () => {
    it('should throw "not yet implemented" error if API key is available', async () => {
        fredService = new FredService(mockCacheServiceInstance, apiKey);
        await expect(fredService.fetchIndustryData('anySeriesId'))
            .rejects.toThrow('FredService.fetchIndustryData not yet implemented');
    });

    it('should throw "API key not configured" error if API key is NOT available', async () => {
        delete process.env.FRED_API_KEY;
        fredService = new FredService(mockCacheServiceInstance);
        await expect(fredService.fetchIndustryData('anySeriesId'))
            .rejects.toThrow('FRED API key is not configured or service is unavailable.');
    });
  });
});
