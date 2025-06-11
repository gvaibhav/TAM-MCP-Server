import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import axios from 'axios';
import { FredService } from '../../../../src/services/dataSources/fredService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
// ... other imports
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock
import * as process from 'process';

vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper');

const mockedAxios = axios as any;
const MockedCacheService = CacheService as any;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as any;
const OLD_ENV = { ...process.env }; // Store original process.env


describe('FredService', () => {
  let fredService: FredService;
  let mockCacheServiceInstance: any;
  const apiKey = 'test_fred_api_key';
  const seriesId = 'GDP';
  const cacheKey = `fred_marketsize_${seriesId}`;
  const mockApiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;


  beforeEach(() => {
    vi.resetAllMocks();
    // Reset env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('FRED_') || key.startsWith('CACHE_TTL_FRED_')) {
        delete (process.env as any)[key];
      }
    });
    Object.assign(process.env, OLD_ENV);
    mockCacheServiceInstance = new MockedCacheService() as any;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // fredService instantiated in describe blocks or tests to control API key
  });
   afterAll(() => {
    Object.keys(process.env).forEach(key => delete (process.env as any)[key]);
    Object.assign(process.env, OLD_ENV);
  });


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
        // Ensure service is constructed with an API key for these tests
        fredService = new FredService(mockCacheServiceInstance, apiKey);
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_FRED_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { observations: [{ date: '2023-01-01', value: '123.45' }] };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customTTL = 700000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_FRED_MS') return customTTL;
        return 1000;
      });
      fredService = new FredService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await fredService.fetchMarketSize(seriesId);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_FRED_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { observations: [] };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 80000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_FRED_NODATA_MS') return customNoDataTTL;
        return 100000;
      });
      fredService = new FredService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await fredService.fetchMarketSize(seriesId);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });
    // ... (other existing fetchMarketSize tests for FredService)
    it('should return data from cache if available', async () => {
      const cachedData = [{ date: '2023-01-01', value: 25000 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await fredService.fetchMarketSize(seriesId);

      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from API, transform, and cache if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = {
        observations: [
          { realtime_start: '2023-11-01', realtime_end: '2023-11-01', date: '2023-07-01', value: '25462.7' },
        ],
      };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const expectedTransformedData = [
        { realtime_start: '2023-11-01', realtime_end: '2023-11-01', date: '2023-07-01', value: 25462.7 },
      ];

      const result = await fredService.fetchMarketSize(seriesId);

      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl);
      expect(result).toEqual(expectedTransformedData);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedTransformedData, 24 * 60 * 60 * 1000);
    });

    it('should handle API response with no observations and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { observations: [] };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const result = await fredService.fetchMarketSize(seriesId);

      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, 1 * 60 * 60 * 1000);
    });

    it('should throw error if API key is not configured', async () => {
      fredService = new FredService(mockCacheServiceInstance); // No API key
      delete process.env.FRED_API_KEY; // Ensure not in env

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('FRED API key is not configured or service is unavailable.');
    });

    it('should throw error if API call fails with standard error', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('Network Error');
    });

    it('should throw specific error if FRED API returns an error_message', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const fredErrorResponse = { response: { data: { error_message: "Invalid API Key" } } };
        mockedAxios.get.mockRejectedValue({ ...new Error("Request failed"), isAxiosError: true, ...fredErrorResponse });

        await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('FRED API Error: Invalid API Key');
    });
     it('should throw for unexpected API response structure', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const unexpectedResponse = { series: [] }; // Missing 'observations'
      mockedAxios.get.mockResolvedValue({ data: unexpectedResponse });

      await expect(fredService.fetchMarketSize(seriesId)).rejects.toThrow('Unexpected response structure from FRED API');
    });
  });

  describe('getDataFreshness', () => {
     beforeEach(() => {
        fredService = new FredService(mockCacheServiceInstance, apiKey);
    });
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 3600000 };
      (mockCacheServiceInstance as any).getEntry = vi.fn().mockResolvedValue(cacheEntry);

      const freshness = await fredService.getDataFreshness(seriesId);
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });

    it('should return null if no cache entry', async () => {
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(null);
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
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(fredService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });

  describe('fetchIndustryData', () => {
    it('should throw "not yet implemented" error if API key is available', async () => {
        fredService = new FredService(mockCacheServiceInstance, apiKey); // API key available
        await expect(fredService.fetchIndustryData('anySeriesId'))
            .rejects.toThrow('FredService.fetchIndustryData not yet implemented');
    });

    it('should throw "API key not configured" error if API key is NOT available', async () => {
        delete process.env.FRED_API_KEY; // Ensure no key from env
        fredService = new FredService(mockCacheServiceInstance); // No API key passed directly
        await expect(fredService.fetchIndustryData('anySeriesId'))
            .rejects.toThrow('FRED API key is not configured or service is unavailable.');
    });
  });
  // ... (other existing tests for FredService)
});
