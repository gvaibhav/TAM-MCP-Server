import axios from 'axios';
import { NasdaqDataService } from '../../../../src/services/dataSources/nasdaqDataService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { nasdaqDataApi } from '../../../../src/config/apiConfig';
import * as process from 'process';

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;

describe('NasdaqDataService', () => {
  let nasdaqService: NasdaqDataService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;
  const OLD_ENV = { ...process.env };
  const apiKey = 'test_nasdaq_api_key';
  const databaseCode = 'ODA'; // Example: OPEC Crude Oil Price
  const datasetCode = 'PORCROILWTICO_USD';

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV };
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    // Service instantiated in contexts or tests
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey);
      expect(await nasdaqService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if NASDAQ_DATA_LINK_API_KEY is in process.env', async () => {
      process.env.NASDAQ_DATA_LINK_API_KEY = apiKey;
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance);
      expect(await nasdaqService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      delete process.env.NASDAQ_DATA_LINK_API_KEY;
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance);
      expect(await nasdaqService.isAvailable()).toBe(false);
    });
     it('should warn if API key is not configured', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      delete process.env.NASDAQ_DATA_LINK_API_KEY;
      new NasdaqDataService(mockCacheServiceInstance);
      expect(consoleWarnSpy).toHaveBeenCalledWith("Nasdaq Data Link API key not configured. NasdaqDataService will not be available.");
      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchIndustryData (via fetchDatasetTimeSeries)', () => {
    const params = { limit: 1 };
    const paramsString = JSON.stringify(params);
    const cacheKey = `nasdaq_${databaseCode}_${datasetCode}_${paramsString}`;
    const mockApiUrl = `${nasdaqDataApi.baseUrl}/${databaseCode}/${datasetCode}/data.json`;

    beforeEach(() => {
        nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey);
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ Date: '2023-01-01', Value: 100 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = {
        dataset_data: {
          column_names: ['Date', 'Value'],
          data: [['2023-01-01', 75.5]],
        },
      };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const expectedData = [{ Date: '2023-01-01', Value: 75.5 }];

      const result = await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(result).toEqual(expectedData);
      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl, { params: { ...params, api_key: apiKey } });
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number)); // Successful TTL
    });

    it('should handle API error (quandl_error in response body) and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const errorResponse = { quandl_error: { code: 'QECx02', message: 'Invalid API key' } };
      mockedAxios.get.mockResolvedValue({ data: errorResponse }); // API returns 200 but with error payload

      const result = await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
    });

    it('should handle API error (rejected promise with quandl_error)', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const errorObj = {
        response: { data: { quandl_error: { code: 'QESx03', message: 'Dataset not found' } } }
      };
      mockedAxios.get.mockRejectedValue({...new Error("API Error"), ...errorObj});

      await expect(nasdaqService.fetchIndustryData(databaseCode, datasetCode, params))
        .rejects.toThrow('Nasdaq API Error: Dataset not found (Code: QESx03)');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
    });


    it('should handle no data points in response and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noDataResponse = { dataset_data: { column_names: ['Date', 'Value'], data: [] } };
      mockedAxios.get.mockResolvedValue({ data: noDataResponse });

      const result = await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number)); // NoData TTL
    });

    it('should throw if API key is not configured', async () => {
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance); // No API key
      delete process.env.NASDAQ_DATA_LINK_API_KEY;
      await expect(nasdaqService.fetchIndustryData(databaseCode, datasetCode, params))
        .rejects.toThrow('Nasdaq Data Link API key is not configured.');
    });
  });

  describe('fetchMarketSize', () => {
    beforeEach(() => {
        nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey);
    });

    it('should fetch latest value and extract correctly', async () => {
        const mockApiResponse = {
            dataset_data: {
            column_names: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'],
            data: [['2023-01-02', 100, 102, 99, 101, 1000]], // desc order, limit 1 implied
            },
        };
        mockedAxios.get.mockResolvedValue({ data: mockApiResponse });
        mockCacheServiceInstance.get.mockResolvedValue(null); // Ensure API call

        const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'Close');
        expect(result).toEqual({
            date: '2023-01-02',
            value: 101,
            sourceDataset: `${databaseCode}/${datasetCode}`,
            valueColumn: 'Close',
            fullRecord: { Date: '2023-01-02', Open: 100, High: 102, Low: 99, Close: 101, Volume: 1000 }
        });
        const expectedCacheKey = `nasdaq_${databaseCode}_${datasetCode}_${JSON.stringify({ order: 'desc', limit: 1 })}`;
        const expectedCachedData = [{ Date: '2023-01-02', Open: 100, High: 102, Low: 99, Close: 101, Volume: 1000 }];
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expectedCacheKey, expectedCachedData, expect.any(Number));
    });

    it('should fetch value for a specific date', async () => {
        const specificDate = '2023-01-01';
        const mockApiResponse = {
            dataset_data: {
            column_names: ['Date', 'Value'],
            data: [[specificDate, 80]],
            },
        };
        mockedAxios.get.mockResolvedValue({ data: mockApiResponse });
        mockCacheServiceInstance.get.mockResolvedValue(null);

        const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'Value', specificDate);
        expect(result).toEqual({
            date: specificDate,
            value: 80,
            sourceDataset: `${databaseCode}/${datasetCode}`,
            valueColumn: 'Value',
            fullRecord: { Date: specificDate, Value: 80 }
        });
         const expectedCacheKey = `nasdaq_${databaseCode}_${datasetCode}_${JSON.stringify({ order: 'desc', start_date: specificDate, end_date: specificDate, limit: 1 })}`;
         const expectedCachedData = [{ Date: specificDate, Value: 80 }];
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expectedCacheKey, expectedCachedData, expect.any(Number));
    });

    it('should return null if time series is null for market size', async () => {
        // This mocks fetchDatasetTimeSeries to return null, as if API failed or returned no data
        const fetchSpy = jest.spyOn(nasdaqService as any, 'fetchDatasetTimeSeries').mockResolvedValue(null);

        const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'Value');
        expect(result).toBeNull();
        fetchSpy.mockRestore();
    });

    it('should return null if specified valueColumn is not found', async () => {
        const mockApiResponse = { dataset_data: { column_names: ['Date', 'Price'], data: [['2023-01-01', 90]] } };
        mockedAxios.get.mockResolvedValue({ data: mockApiResponse });
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'NonExistentColumn');
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Value column "NonExistentColumn" not found'));
        consoleWarnSpy.mockRestore();
    });
  });

  describe('getDataFreshness', () => {
    beforeEach(() => {
        nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey);
    });
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: [], timestamp: now, ttl: 1000 };
      const params = { limit: 1 };
      const paramsString = JSON.stringify(params);
      const cacheKey = `nasdaq_${databaseCode}_${datasetCode}_${paramsString}`;
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

      const freshness = await nasdaqService.getDataFreshness(databaseCode, datasetCode, params);
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });
  });

   describe('getCacheStatus', () => {
    beforeEach(() => {
        nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey);
    });
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 0, size: 1, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(nasdaqService.getCacheStatus()).toEqual(mockStats);
    });
  });
});
