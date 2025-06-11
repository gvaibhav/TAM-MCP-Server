import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import axios from 'axios';
import { BlsService } from '../../../../src/services/dataSources/blsService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { blsApi } from '../../../../src/config/apiConfig';
import * as process from 'process';
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock

vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper'); // Mock the envHelper

const mockedAxios = axios as any;
const MockedCacheService = CacheService as any;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as any;

describe('BlsService', () => {
  let blsService: BlsService;
  let mockCacheServiceInstance: any;
  const OLD_ENV = { ...process.env };
  const apiKey = 'test_bls_api_key';
  const seriesId1 = 'CES0000000001';
  const seriesId2 = 'LNS14000000'; // Unemployment rate

  beforeEach(() => {
    vi.resetAllMocks();
    Object.keys(process.env).forEach(key => delete process.env[key]);
    Object.assign(process.env, OLD_ENV);
    mockCacheServiceInstance = new MockedCacheService() as any;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // Service instantiated in tests to control API key presence
  });

  afterAll(() => {
    Object.keys(process.env).forEach(key => delete (process.env as any)[key]);
    Object.assign(process.env, OLD_ENV);
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should return true', async () => {
      blsService = new BlsService(mockCacheServiceInstance);
      expect(await blsService.isAvailable()).toBe(true);
    });
    it('constructor should log if API key is present', () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        new BlsService(mockCacheServiceInstance, apiKey);
        expect(consoleLogSpy).toHaveBeenCalledWith("BLS Service: API key configured.");
        consoleLogSpy.mockRestore();
    });
    it('constructor should log if API key is NOT present', () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        new BlsService(mockCacheServiceInstance); // No key
        expect(consoleLogSpy).toHaveBeenCalledWith("BLS Service: API key not configured. Using anonymous access (lower limits).");
        consoleLogSpy.mockRestore();
    });
  });

  describe('fetchIndustryData', () => {
    const startYear = '2022';
    const endYear = '2023';
    const catalog = false;
    const defaultPayloadNoKey = { seriesid: [seriesId1], startyear: startYear, endyear: endYear, catalog, calculations: false, annualaverage: false };
    const cacheKey = `bls_data_${JSON.stringify(defaultPayloadNoKey)}`; // This key is based on defaultPayloadNoKey, which is correct as API key is not in cache key
    const mockApiUrl = blsApi.baseUrlV2;

    beforeEach(() => { // Default service without API key for most tests in this block
        blsService = new BlsService(mockCacheServiceInstance);
    });

    it('should include optional boolean parameters in POST body when true', async () => {
      const blsServiceWithKey = new BlsService(mockCacheServiceInstance, apiKey);
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { status: "REQUEST_SUCCEEDED", Results: { series: [] } }; // Empty series for simplicity
      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      const seriesIds = ['CES0000000001'];
      // startYear, endYear are from outer scope

      const expectedPayload = {
        seriesid: seriesIds,
        startyear: startYear,
        endyear: endYear,
        catalog: true,
        calculations: true,
        annualaverage: true,
        registrationkey: apiKey,
      };
      // Cache key won't have registrationkey
      const cacheKeyPayload = { ...expectedPayload };
      delete cacheKeyPayload.registrationkey; // remove key before stringify for cache key
      const expectedCacheKeyForTest = `bls_data_${JSON.stringify(cacheKeyPayload)}`;


      await blsServiceWithKey.fetchIndustryData(seriesIds, startYear, endYear, true, true, true);

      expect(mockedAxios.post).toHaveBeenCalledWith(blsApi.baseUrlV2, expectedPayload, { headers: { 'Content-Type': 'application/json' } });
      // The service caches `Results` which is `{ series: [] }` in this mock
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expectedCacheKeyForTest, { series: [] }, expect.any(Number));
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_BLS_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { status: "REQUEST_SUCCEEDED", Results: { series: [{ seriesID: seriesId1, data: [] }] } };
      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 121212;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_BLS_MS') return customSuccessTTL;
        return 1000;
      });
      blsService = new BlsService(mockCacheServiceInstance); // Re-instantiate

      await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, mockApiResponse.Results, customSuccessTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_BLS_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { status: "REQUEST_SUCCEEDED", Results: { series: [] }, message: ["No data"] };
      mockedAxios.post.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 343434;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_BLS_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      blsService = new BlsService(mockCacheServiceInstance); // Re-instantiate

      await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should use NoData TTL when API request status is not REQUEST_SUCCEEDED', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const errorStatusResponse = { status: "REQUEST_NOT_PROCESSED", message: ["Invalid SeriesID"], Results: {} };
      mockedAxios.post.mockResolvedValue({ data: errorStatusResponse });

      const customNoDataTTL = 565656;
       mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_BLS_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      blsService = new BlsService(mockCacheServiceInstance); // Re-instantiate

      await expect(blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog))
        .rejects.toThrow('BLS API Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should throw error if no seriesIds are provided', async () => {
        await expect(blsService.fetchIndustryData([], startYear, endYear))
            .rejects.toThrow("BLS series IDs must be provided.");
    });

    it('should return data from cache if available', async () => {
      const cachedResults = { series: [{ seriesID: seriesId1, data: [{ year: '2022', value: '1000' }] }] };
      mockCacheServiceInstance.get.mockResolvedValue(cachedResults);

      const result = await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(result).toEqual(cachedResults);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache data if not in cache (no API key)', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = {
        status: "REQUEST_SUCCEEDED",
        Results: { series: [{ seriesID: seriesId1, data: [{ year: '2022', value: '1000' }] }] },
      };
      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      const expectedResults = mockApiResponse.Results;

      const result = await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(result).toEqual(expectedResults);
      expect(mockedAxios.post).toHaveBeenCalledWith(mockApiUrl, defaultPayloadNoKey, { headers: { 'Content-Type': 'application/json' } });
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedResults, expect.any(Number)); // Successful TTL
    });

    it('should include API key in request if provided', async () => {
      blsService = new BlsService(mockCacheServiceInstance, apiKey); // Service with API key
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { status: "REQUEST_SUCCEEDED", Results: { series: [] } };
      mockedAxios.post.mockResolvedValue({ data: mockApiResponse });

      const payloadWithKey = { ...defaultPayloadNoKey, registrationkey: apiKey };

      await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(mockedAxios.post).toHaveBeenCalledWith(mockApiUrl, payloadWithKey, { headers: { 'Content-Type': 'application/json' } });
    });

    it('should handle API response with status REQUEST_SUCCEEDED but no series data', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noDataResponse = { status: "REQUEST_SUCCEEDED", Results: { series: [] }, message: ["No data"] };
      mockedAxios.post.mockResolvedValue({ data: noDataResponse });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Request succeeded but no series data returned"));
      consoleWarnSpy.mockRestore();
    });

    it('should handle API response with non-success status and messages', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const errorStatusResponse = { status: "REQUEST_NOT_PROCESSED", message: ["Invalid SeriesID"], Results: {} };
      mockedAxios.post.mockResolvedValue({ data: errorStatusResponse }); // API returns 200 but with error status
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog))
        .rejects.toThrow('BLS API Error: Invalid SeriesID (Status: REQUEST_NOT_PROCESSED)');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("API request did not succeed"));
      consoleWarnSpy.mockRestore();
    });

    it('should handle axios POST error and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(blsService.fetchIndustryData([seriesId1], startYear, endYear, catalog))
        .rejects.toThrow('Network Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
    });

    it('should handle axios POST error with BLS error structure in response', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const blsErrorPayload = { status: "ERROR_VALIDATION", message: ["StartYear cannot be after EndYear"] };
        const axiosError = { isAxiosError: true, response: { data: blsErrorPayload }, message: "Request failed" };
        mockedAxios.post.mockRejectedValue(axiosError);

        await expect(blsService.fetchIndustryData([seriesId1], '2023', '2022'))
            .rejects.toThrow('BLS API Error: StartYear cannot be after EndYear (Status: ERROR_VALIDATION)');

        const errorCacheKey = `bls_data_${JSON.stringify({...defaultPayloadNoKey, seriesid: [seriesId1], startyear: '2023', endyear: '2022'})}`;
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(errorCacheKey, null, expect.any(Number));
    });

    it('should warn if too many series IDs are requested (anonymous)', async () => {
        const manySeries = Array.from({ length: 30 }, (_, i) => `CES${i.toString().padStart(10, '0')}`);
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockCacheServiceInstance.get.mockResolvedValue(null);
        mockedAxios.post.mockResolvedValue({ data: { status: "REQUEST_SUCCEEDED", Results: { series: [] } } });

        await blsService.fetchIndustryData(manySeries);
        expect(consoleWarnSpy).toHaveBeenCalledWith("BLS Service: Requested 30 series. Max is 25. Truncating or erroring might occur from API.");
        consoleWarnSpy.mockRestore();
    });

    it('should warn if too many series IDs are requested (with API key)', async () => {
        blsService = new BlsService(mockCacheServiceInstance, apiKey);
        const manySeries = Array.from({ length: 55 }, (_, i) => `CES${i.toString().padStart(10, '0')}`);
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockCacheServiceInstance.get.mockResolvedValue(null);
        mockedAxios.post.mockResolvedValue({ data: { status: "REQUEST_SUCCEEDED", Results: { series: [] } } });

        await blsService.fetchIndustryData(manySeries);
        expect(consoleWarnSpy).toHaveBeenCalledWith("BLS Service: Requested 55 series. Max is 50. Truncating or erroring might occur from API.");
        consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchMarketSize', () => {
     beforeEach(() => {
        blsService = new BlsService(mockCacheServiceInstance);
    });
    it('should log a warning and return null', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await blsService.fetchMarketSize('anyIndustry', 'anyRegion');
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("BLS Service: fetchMarketSize is not directly applicable. Use fetchIndustryData with specific series IDs"));
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getDataFreshness', () => {
     beforeEach(() => {
        blsService = new BlsService(mockCacheServiceInstance);
    });
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 1000 };
      const payload = { seriesid: [seriesId1], catalog: false, calculations: false, annualaverage: false }; // Default params from fetchIndustryData used in getDataFreshness
      const cacheKey = `bls_data_${JSON.stringify(payload)}`;
      (mockCacheServiceInstance as any).getEntry = vi.fn().mockResolvedValue(cacheEntry);

      // Call with matching default parameters for other boolean flags
      const freshness = await blsService.getDataFreshness([seriesId1], undefined, undefined, false, false, false);
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('getCacheStatus', () => {
     beforeEach(() => {
        blsService = new BlsService(mockCacheServiceInstance);
    });
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 1, size: 1, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = vi.fn().mockReturnValue(mockStats);
      expect(blsService.getCacheStatus()).toEqual(mockStats);
    });
  });
});
