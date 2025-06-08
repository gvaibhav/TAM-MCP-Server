import axios from 'axios';
import { NasdaqDataService } from '../../../../src/services/dataSources/nasdaqDataService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { nasdaqDataApi } from '../../../../src/config/apiConfig';
import * as process from 'process';
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');
jest.mock('../../../../src/utils/envHelper'); // Mock the envHelper

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as jest.Mock;

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
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
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

    it('should construct correct API URL and cache key with various apiParams', async () => {
      // nasdaqService is already instantiated with apiKey in beforeEach
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { dataset_data: { column_names: ['Date', 'Value'], data: [['2023-01-01', 75.5]] } };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const testParams = { start_date: '2022-01-01', end_date: '2022-12-31', limit: 10, order: 'asc' as 'asc' | 'desc' };
      const expectedApiUrl = `${nasdaqDataApi.baseUrl}/${databaseCode}/${datasetCode}/data.json`;
      const expectedAxiosParams = { params: { ...testParams, api_key: apiKey } };
      const expectedCacheKey = `nasdaq_${databaseCode}_${datasetCode}_${JSON.stringify(testParams)}`;

      await nasdaqService.fetchIndustryData(databaseCode, datasetCode, testParams);

      expect(mockedAxios.get).toHaveBeenCalledWith(expectedApiUrl, expectedAxiosParams);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expectedCacheKey, expect.any(Array), expect.any(Number));
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_NASDAQ_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = { dataset_data: { column_names: ['Date', 'Value'], data: [['2023-01-01', 75.5]] } };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 333333;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_NASDAQ_MS') return customSuccessTTL;
        return 1000;
      });
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customSuccessTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_NASDAQ_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = { dataset_data: { column_names: ['Date', 'Value'], data: [] } };
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 666666;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_NASDAQ_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should use NoData TTL when API returns quandl_error in response body', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const errorResponse = { quandl_error: { code: 'QECx02', message: 'Invalid API key' } };
      mockedAxios.get.mockResolvedValue({ data: errorResponse }); // API returns 200 but with error payload

      const customNoDataTTL = 222111;
       mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_NASDAQ_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      nasdaqService = new NasdaqDataService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
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

    // ... existing tests for fetchMarketSize ...

    it('should correctly resolve valueColumn when not provided (finds "Value")', async () => {
      // nasdaqService instantiated in beforeEach
      const mockDataPoint = { Date: '2023-01-01', Open: 99, Value: 101, Close: 100 };
      // Mock fetchDatasetTimeSeries directly as it's simpler here
      const fetchDatasetTimeSeriesSpy = jest.spyOn(nasdaqService as any, 'fetchDatasetTimeSeries').mockResolvedValue([mockDataPoint]);

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode /* no valueColumn */);
      expect(result?.value).toBe(101);
      expect(result?.valueColumn).toBe('Value');
      fetchDatasetTimeSeriesSpy.mockRestore();
    });

    it('should correctly resolve valueColumn when not provided (finds first numeric non-Date if "Value" absent)', async () => {
      // nasdaqService instantiated in beforeEach
      const mockDataPoint = { Date: '2023-01-01', StringCol: 'abc', NumericCol1: 100, NumericCol2: 200 };
      const fetchDatasetTimeSeriesSpy = jest.spyOn(nasdaqService as any, 'fetchDatasetTimeSeries').mockResolvedValue([mockDataPoint]);

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode);
      expect(result?.value).toBe(100); // NumericCol1
      expect(result?.valueColumn).toBe('NumericCol1');
      fetchDatasetTimeSeriesSpy.mockRestore();
    });

    it('should use fallback (second column after Date) if no "Value" or other numeric found', async () => {
      // nasdaqService instantiated in beforeEach
      // Date is typically first. If 'SecondCol' is next, it should be picked if no numbers.
      const mockDataPoint = { Date: '2023-01-01', SecondCol: 'data_val', ThirdCol: 'more_data' };
      const fetchDatasetTimeSeriesSpy = jest.spyOn(nasdaqService as any, 'fetchDatasetTimeSeries').mockResolvedValue([mockDataPoint]);

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode);
      expect(result?.value).toBe('data_val');
      expect(result?.valueColumn).toBe('SecondCol'); // Assuming 'Date' is first, 'SecondCol' is keys[1]
      fetchDatasetTimeSeriesSpy.mockRestore();
    });

    it('should return null if specific date requested is not the date of the returned single record', async () => {
      // nasdaqService instantiated in beforeEach
      const requestedDate = '2023-01-02';
      const actualRecordDate = '2023-01-01';
      const mockDataPoint = { Date: actualRecordDate, Value: 100 };

      const fetchDatasetTimeSeriesSpy = jest.spyOn(nasdaqService as any, 'fetchDatasetTimeSeries')
          .mockImplementation(async (db, ds, params) => {
              // Simulate API call where specific date filter (start_date=X, end_date=X) still might return latest if exact not found, or just one record.
              // For this test, we ensure the spy returns a record with a date different from requested.
              if(params && params.start_date === requestedDate && params.end_date === requestedDate) {
                  return [mockDataPoint]; // API returns a record, but it's for actualRecordDate
              }
              return [mockDataPoint]; // Default mock return if params don't match specific date query
          });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'Value', requestedDate);

      expect(result).toBeNull();
      // Check params passed to fetchDatasetTimeSeries by fetchMarketSize
      expect(fetchDatasetTimeSeriesSpy).toHaveBeenCalledWith(
        databaseCode,
        datasetCode,
        expect.objectContaining({ start_date: requestedDate, end_date: requestedDate, limit: 1, order: 'desc' })
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(`Data for specific date ${requestedDate} not found`));
      fetchDatasetTimeSeriesSpy.mockRestore();
      consoleWarnSpy.mockRestore();
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
