import axios from 'axios';
import { WorldBankService } from '../../../../src/services/dataSources/worldBankService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');
jest.mock('../../../../src/utils/envHelper'); // Mock the envHelper

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as jest.Mock;


describe('WorldBankService', () => {
  let worldBankService: WorldBankService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;

  beforeEach(() => {
    jest.resetAllMocks(); // Resets axios, CacheService, and envHelper mocks
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    // Default mock for getEnvAsNumber, can be overridden in specific tests
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    worldBankService = new WorldBankService(mockCacheServiceInstance);
  });

  describe('fetchMarketSize', () => {
    const countryCode = 'US';
    const indicator = 'NY.GDP.MKTP.CD';
    const cacheKey = `worldbank_marketsize_${indicator}_${countryCode}`;
    const mockApiUrl = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=1`;

    it('should use TTL from env var for successful fetch when CACHE_TTL_WORLD_BANK_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = [ {}, [ { indicator: { value: 'GDP' }, country: { value: 'US' }, countryiso3code: 'USA', date: '2022', value: 123 } ] ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customTTL = 500000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_WORLD_BANK_MS') return customTTL;
        return 1000; // Default for no_data TTL or others
      });
      // Re-instantiate service to pick up new mocked env var values from its constructor
      worldBankService = new WorldBankService(mockCacheServiceInstance);


      await worldBankService.fetchMarketSize(countryCode, indicator);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_WORLD_BANK_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = [{}, []];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 60000;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_WORLD_BANK_NODATA_MS') return customNoDataTTL;
        return 100000; // Default for successful fetch TTL
      });
      worldBankService = new WorldBankService(mockCacheServiceInstance);


      await worldBankService.fetchMarketSize(countryCode, indicator);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });
    // ... (other existing fetchMarketSize tests)
    it('should return data from cache if available', async () => {
      const cachedData = [{ country: 'USA', value: 20000 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await worldBankService.fetchMarketSize(countryCode, indicator);

      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch from API, transform, and cache if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
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
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

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

      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl);
      expect(result).toEqual(expectedTransformedData);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedTransformedData, 24 * 60 * 60 * 1000);
    });

    it('should handle API response with no data points and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoDataAlternative = [
        { page: 1, pages: 1, per_page: '50', total: 1 }, // Metadata present
        [], // Data array is empty
      ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoDataAlternative });


      const result = await worldBankService.fetchMarketSize(countryCode, 'NON_EXISTENT_INDICATOR');
      const noDataCacheKey = `worldbank_marketsize_NON_EXISTENT_INDICATOR_${countryCode}`;

      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(noDataCacheKey, null, 1 * 60 * 60 * 1000);
    });

    it('should throw error if API call fails', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(worldBankService.fetchMarketSize(countryCode, indicator)).rejects.toThrow('API Error');
      expect(mockCacheServiceInstance.set).not.toHaveBeenCalled();
    });
     it('should throw error for unexpected API response structure', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const unexpectedResponse = { some: "other_structure" }; // Not an array
      mockedAxios.get.mockResolvedValue({ data: unexpectedResponse });

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
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: {}, timestamp: now, ttl: 3600000 };
      // Ensure getEntry is part of the mock type if CacheService was auto-mocked more strictly
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

      const freshness = await worldBankService.getDataFreshness('US', 'NY.GDP.MKTP.CD');
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(`worldbank_marketsize_NY.GDP.MKTP.CD_US`);
    });

    it('should return null if no cache entry', async () => {
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(null);
      const freshness = await worldBankService.getDataFreshness('US', 'NY.GDP.MKTP.CD');
      expect(freshness).toBeNull();
    });
  });
   describe('getCacheStatus', () => {
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 1, size: 1, lastRefreshed: new Date() };
      // Ensure getStats is part of the mock type
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
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
  // ... (other existing tests for isAvailable, getDataFreshness, etc.)
});
