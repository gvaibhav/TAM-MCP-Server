import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { WorldBankService } from '../../../../src/services/dataSources/worldBankService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import * as envHelper from '../../../../src/utils/envHelper';

vi.mock('axios');
vi.mock('../../../../src/services/cache/cacheService');
vi.mock('../../../../src/utils/envHelper');

const mockedAxiosGet = vi.mocked(axios.get); // Typed mock for axios.get
const MockedCacheService = CacheService as unknown as ReturnType<typeof vi.fn>; // Mocked Constructor
const mockedGetEnvAsNumber = vi.mocked(envHelper.getEnvAsNumber);


describe('WorldBankService', () => {
  let worldBankService: WorldBankService;
  let mockCacheServiceInstance: InstanceType<typeof CacheService>; // Typed instance

  beforeEach(() => {
    vi.resetAllMocks();
    mockCacheServiceInstance = new MockedCacheService() as InstanceType<typeof CacheService>;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    worldBankService = new WorldBankService(mockCacheServiceInstance);
  });

  afterEach(() => {
      vi.restoreAllMocks(); // Ensure spies are restored if created with spyOn(object, methodName)
  });

  describe('fetchMarketSize', () => {
    const countryCode = 'US';
    const indicator = 'NY.GDP.MKTP.CD';
    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const mockApiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=1`;

    it('should use TTL from env var for successful fetch when CACHE_TTL_WORLD_BANK_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = [ {}, [ { indicator: { value: 'GDP' }, country: { value: 'US' }, countryiso3code: 'USA', date: '2022', value: 123 } ] ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const customTTL = 500000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_WORLD_BANK_MS') return customTTL;
        return 1000;
      });
      worldBankService = new WorldBankService(mockCacheServiceInstance);


      await worldBankService.fetchMarketSize(countryCode, indicator);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_WORLD_BANK_NODATA_MS is set', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoData = [{}, []];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 60000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_WORLD_BANK_NODATA_MS') return customNoDataTTL;
        return 100000;
      });
      worldBankService = new WorldBankService(mockCacheServiceInstance);


      await worldBankService.fetchMarketSize(countryCode, indicator);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ country: 'USA', value: 20000 }];
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(cachedData);

      const result = await worldBankService.fetchMarketSize(countryCode, indicator);

      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

     it('should fetch from API, transform, and cache if not in cache', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponse = [
        { page: 1, pages: 1, per_page: '50', total: 1, sourceid: '2', lastupdated: '2023-11-01' },
        [
          {
            indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
            country: { id: 'US', value: 'United States' },
            countryiso3code: 'USA',
            date: '2022',
            value: 25462700000000,
            unit: '',
            obs_status: '',
            decimal: 0,
          },
        ],
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedTransformedData = [
        {
          country: 'United States',
          countryISO3Code: 'USA',
          date: '2022',
          value: 25462700000000,
          unit: '',
          indicator: 'GDP (current US$)',
        },
      ];

      const result = await worldBankService.fetchMarketSize(countryCode, indicator);

      expect(mockedAxiosGet).toHaveBeenCalledWith(mockApiUrl);
      expect(result).toEqual(expectedTransformedData);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedTransformedData, expect.any(Number)); // Default TTL from initial mock
    });

    it('should handle API response with no data points and cache null', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const mockApiResponseNoDataAlternative = [
        { page: 1, pages: 1, per_page: '50', total: 1 },
        [],
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoDataAlternative });


      const result = await worldBankService.fetchMarketSize(countryCode, 'NON_EXISTENT_INDICATOR');
      const noDataCacheKey = `worldbank_marketsize_NON_EXISTENT_INDICATOR_${countryCode}`;

      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(noDataCacheKey, null, expect.any(Number)); // Default NoData TTL
    });

    it('should throw error if API call fails', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      await expect(worldBankService.fetchMarketSize(countryCode, indicator)).rejects.toThrow('API Error');
      expect(mockCacheServiceInstance.set).not.toHaveBeenCalled();
    });
     it('should throw error for unexpected API response structure', async () => {
      vi.mocked(mockCacheServiceInstance.get).mockResolvedValue(null);
      const unexpectedResponse = { some: "other_structure" };
      mockedAxiosGet.mockResolvedValue({ data: unexpectedResponse });

      await expect(worldBankService.fetchMarketSize(countryCode, indicator)).rejects.toThrow('Unexpected response structure from World Bank API');
    });
  });

  describe('isAvailable', () => {
    it('should always return true', async () => {
      expect(await worldBankService.isAvailable()).toBe(true);
    });
  });

  describe('getDataFreshness', () => {
    it('should return timestamp from cache entry', async () => {
      const now = Date.now(); // Uses Vitest's faked time if set at suite/describe level
      const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 3600000 };
      vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(cacheEntry);

      const freshness = await worldBankService.getDataFreshness('US', 'NY.GDP.MKTP.CD');
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(`worldbank_marketsize_NY.GDP.MKTP.CD_US`);
    });

    it('should return null if no cache entry', async () => {
      vi.mocked(mockCacheServiceInstance.getEntry).mockResolvedValue(null);
      const freshness = await worldBankService.getDataFreshness('US', 'NY.GDP.MKTP.CD');
      expect(freshness).toBeNull();
    });
  });

   describe('getCacheStatus', () => {
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 1, size: 1, lastRefreshed: new Date() };
      vi.mocked(mockCacheServiceInstance.getStats).mockReturnValue(mockStats);
      expect(worldBankService.getCacheStatus()).toEqual(mockStats);
      expect(mockCacheServiceInstance.getStats).toHaveBeenCalled();
    });
  });

  describe('fetchIndustryData', () => {
    it('should throw "not yet implemented" error', async () => {
        await expect(worldBankService.fetchIndustryData('anyIndustryId'))
            .rejects.toThrow('WorldBankService.fetchIndustryData not yet implemented');
    });
  });
});
