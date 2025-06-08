import axios from 'axios';
import { CensusService } from '../../../../src/services/dataSources/censusService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { censusApi as realCensusApiConfig } from '../../../../src/config/apiConfig'; // Import real one to spy/mock
import * as process from 'process';

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');

// Mock the config specifically for cbpYear to ensure consistent NAICS key generation in tests
jest.mock('../../../../src/config/apiConfig', () => {
  const originalConfig = jest.requireActual('../../../../src/config/apiConfig');
  return {
    ...originalConfig,
    censusApi: {
      ...originalConfig.censusApi,
      cbpYear: '2021', // Fixed year for predictable NAICS2021 key in some tests
      cbpDataset: 'cbp', // Ensure this is also fixed if tests rely on it
    },
  };
});
// Re-import after mock
import { censusApi } from '../../../../src/config/apiConfig';
import * as envHelper from '../../../../src/utils/envHelper'; // Import to mock


const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as jest.Mock;


describe('CensusService', () => {
  let censusService: CensusService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;
  const OLD_ENV = { ...process.env };
  const apiKey = 'test_census_api_key';

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV };
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    // censusService instantiated in describe blocks or tests
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      censusService = new CensusService(mockCacheServiceInstance, apiKey);
      expect(await censusService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if CENSUS_API_KEY is in process.env', async () => {
      process.env.CENSUS_API_KEY = apiKey;
      censusService = new CensusService(mockCacheServiceInstance);
      expect(await censusService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      delete process.env.CENSUS_API_KEY; // Ensure it's not set
      censusService = new CensusService(mockCacheServiceInstance);
      expect(await censusService.isAvailable()).toBe(false);
    });

    it('should warn if API key is not configured', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      delete process.env.CENSUS_API_KEY;
      new CensusService(mockCacheServiceInstance);
      expect(consoleWarnSpy).toHaveBeenCalledWith("Census API key not configured. CensusService will not be available.");
      consoleWarnSpy.mockRestore();
    });
  });

  describe('fetchIndustryData', () => {
    const year = censusApi.cbpYear; // Should be '2021' due to mock
    const datasetPath = censusApi.cbpDataset; // 'cbp'
    const variables = 'EMP,PAYANN';
    const forGeography = 'us:1';
    const filterParams = { NAICS2017: "23" };
    const queryBase = { get: variables, for: forGeography, key: apiKey, ...filterParams };

    // Cache key construction in service excludes API key from queryBase copy
    const cacheKeyParamsForCacheKey = { get: variables, for: forGeography, ...filterParams };
    const cacheKey = `census_${year}_${datasetPath}_${JSON.stringify(cacheKeyParamsForCacheKey)}`;

    const mockApiUrl = `${realCensusApiConfig.baseUrl}/${year}/${datasetPath}`;


    beforeEach(() => {
        censusService = new CensusService(mockCacheServiceInstance, apiKey);
    });

    it('should correctly parse mixed numeric and string data types in rows', async () => {
      // censusService instantiated in beforeEach with apiKey
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const headers = ["GEO_ID", "NAME", "EMP_COUNT", "ESTAB_ID", "FLAG_COL"]; // Renamed FLAG to avoid keyword issues
      const row = ["01000US", "United States", "150000", "00789", "true"];
      const mockApiResponse = [ headers, row ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      // Construct a cache key specific to this test's parameters if they differ from default
      const currentTestCacheKeyParams = { get: headers.join(','), for: forGeography, ...filterParams };
      const currentTestCacheKey = `census_${year}_${datasetPath}_${JSON.stringify(currentTestCacheKeyParams)}`;


      const result = await censusService.fetchIndustryData(headers.join(','), forGeography, filterParams, year, datasetPath);
      // Current service logic: parseFloat, if NaN use original string. "00789" -> 789. "true" -> "true".
      // GEO_ID and NAME are explicitly kept as strings if they match the hardcoded list in the service.
      // FLAG_COL is not in the hardcoded list, parseFloat("true") is NaN, so it remains "true".
      // ESTAB_ID "00789" is not in hardcoded string list, parseFloat("00789") is 789.
      expect(result).toEqual([{ GEO_ID: "01000US", NAME: "United States", EMP_COUNT: 150000, ESTAB_ID: 789, FLAG_COL: "true" }]);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(currentTestCacheKey, expect.any(Array), expect.any(Number));
    });

    it('should correctly construct API URL with different year and datasetPath', async () => {
      // censusService instantiated in beforeEach with apiKey
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = [ ["HEADER"], ["data"] ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customYear = '2020';
      const customDatasetPath = 'acs/acs1';
      const acsVariables = "NAME,B01001_001E";
      const acsForGeo = "state:*";
      const expectedCustomApiUrl = `${realCensusApiConfig.baseUrl}/${customYear}/${customDatasetPath}`;
      const expectedCustomQueryBase = { get: acsVariables, for: acsForGeo, key: apiKey };
       // Construct cache key for this specific call if different from default
      const currentTestCacheKeyParams = { get: acsVariables, for: acsForGeo }; // No filterParams here
      const currentTestCacheKey = `census_${customYear}_${customDatasetPath}_${JSON.stringify(currentTestCacheKeyParams)}`;


      await censusService.fetchIndustryData(acsVariables, acsForGeo, undefined, customYear, customDatasetPath);

      expect(mockedAxios.get).toHaveBeenCalledWith(expectedCustomApiUrl, { params: expectedCustomQueryBase });
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(currentTestCacheKey, expect.any(Array), expect.any(Number));
    });

    it('should use TTL from env var for successful fetch when CACHE_TTL_CENSUS_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = [ ["EMP", "NAICS2017"], ["100", "23"] ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const customSuccessTTL = 789012;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_CENSUS_MS') return customSuccessTTL;
        return 1000;
      });
      censusService = new CensusService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customSuccessTTL);
    });

    it('should use TTL from env var for no data response when CACHE_TTL_CENSUS_NODATA_MS is set', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoData = [ ["EMP", "NAICS2017"] ]; // Only headers
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoData });

      const customNoDataTTL = 901234;
      mockedGetEnvAsNumber.mockImplementation((key) => {
        if (key === 'CACHE_TTL_CENSUS_NODATA_MS') return customNoDataTTL;
        return 1000;
      });
      censusService = new CensusService(mockCacheServiceInstance, apiKey); // Re-instantiate

      await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });

    it('should throw error if API key is not configured', async () => {
      censusService = new CensusService(mockCacheServiceInstance); // No API key
      delete process.env.CENSUS_API_KEY;
      await expect(censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath))
        .rejects.toThrow('Census API key is not configured or service is unavailable.');
    });

    it('should throw error if variables are missing', async () => {
        await expect(censusService.fetchIndustryData('', forGeography, filterParams, year, datasetPath))
            .rejects.toThrow("Variables must be provided for Census API query.");
    });

    it('should throw error if geography is missing', async () => {
        await expect(censusService.fetchIndustryData(variables, '', filterParams, year, datasetPath))
            .rejects.toThrow("Geography must be provided for Census API query.");
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ EMP: 1000, PAYANN: 50000000 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponse = [
        ["EMP", "PAYANN", "NAICS2017", "GEO_ID", "state"], // Headers
        ["12345", "67890000", "23", "0400000US01", "01"]   // Data row
      ];
      mockedAxios.get.mockResolvedValue({ data: mockApiResponse });

      const expectedData = [{ EMP: 12345, PAYANN: 67890000, NAICS2017: "23", GEO_ID: "0400000US01", state: "01" }];

      const result = await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
      expect(result).toEqual(expectedData);
      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl, { params: queryBase });
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expectedData, expect.any(Number));
    });

    it('should handle API response with no data rows and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const mockApiResponseNoDataRows = [ ["EMP", "PAYANN", "NAICS2017", "GEO_ID"] ]; // Only headers
      mockedAxios.get.mockResolvedValue({ data: mockApiResponseNoDataRows });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(()=>{});

      const result = await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("No data rows found for query."));
      consoleWarnSpy.mockRestore();
    });

    it('should handle unexpected API response structure (not array) and cache null', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        mockedAxios.get.mockResolvedValue({ data: { message: "some object" } }); // Not an array
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(()=>{});

        const result = await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
        expect(result).toBeNull();
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Unexpected response structure or no data."));
        consoleWarnSpy.mockRestore();
    });

     it('should handle null API response and cache null', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        mockedAxios.get.mockResolvedValue({ data: null });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(()=>{});

        const result = await censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath);
        expect(result).toBeNull();
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("No data returned (null or empty array) for query."));
        consoleWarnSpy.mockRestore();
    });


    it('should handle API error and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath))
        .rejects.toThrow('Network Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });
     it('should handle Census API error in response text', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const censusErrorText = "error: unknown variable 'INVALIDVAR'";
      mockedAxios.get.mockRejectedValue({ isAxiosError: true, response: { data: censusErrorText }, message: "Request failed" });

      await expect(censusService.fetchIndustryData(variables.split(','), forGeography, filterParams, year, datasetPath))
        .rejects.toThrow(`Census API Error: ${censusErrorText}`);
    });
  });

  describe('fetchMarketSize', () => {
    const naics = "23"; // Construction
    const geo = "us:1";
    const yearCBP = censusApi.cbpYear; // '2021' from mock
    // NAICS key determined dynamically in service based on year. For 2021, it should be NAICS2017.
    const expectedNaicsFilterKey = "NAICS2017";

    beforeEach(() => {
        censusService = new CensusService(mockCacheServiceInstance, apiKey);
    });

    it('should fetch EMP for a NAICS code and geography', async () => {
      const mockIndustryDataResponse = [{ EMP: 5000, PAYANN: 2000000, [expectedNaicsFilterKey]: naics, GEO_ID: geo, YEAR: yearCBP }];
      const fetchIndustryDataSpy = jest.spyOn(censusService, 'fetchIndustryData').mockResolvedValue(mockIndustryDataResponse);

      const result = await censusService.fetchMarketSize(naics, geo, "EMP", yearCBP);
      expect(result).toEqual({
        measure: "EMP",
        value: 5000,
        geography: geo,
        naicsCode: naics,
        year: yearCBP,
        source: `Census CBP (${censusApi.cbpDataset} ${yearCBP})`
      });
      expect(fetchIndustryDataSpy).toHaveBeenCalledWith(["EMP", expectedNaicsFilterKey], geo, { [expectedNaicsFilterKey]: naics }, yearCBP, censusApi.cbpDataset);
      fetchIndustryDataSpy.mockRestore();
    });

    it('should return null if fetchIndustryData returns no results for market size', async () => {
      const fetchIndustryDataSpy = jest.spyOn(censusService, 'fetchIndustryData').mockResolvedValue(null);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(()=>{});

      const result = await censusService.fetchMarketSize(naics, geo, "EMP", yearCBP);
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Could not derive market size"));
      fetchIndustryDataSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
     it('should throw error if naicsCode is missing for fetchMarketSize', async () => {
        await expect(censusService.fetchMarketSize('', geo, "EMP", yearCBP))
            .rejects.toThrow("NAICS code must be provided for fetchMarketSize.");
    });
  });

  describe('getDataFreshness', () => {
     beforeEach(() => {
        censusService = new CensusService(mockCacheServiceInstance, apiKey);
    });
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: [], timestamp: now, ttl: 1000 };
      const vars = "EMP";
      const geo = "us:1";
      const year = censusApi.cbpYear;
      const dataset = censusApi.cbpDataset;
      const queryBase = { get: vars, for: geo }; // API key not in cache key queryBase
      const cacheKey = `census_${year}_${dataset}_${JSON.stringify(queryBase)}`;
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

      const freshness = await censusService.getDataFreshness(vars, geo, undefined, year, dataset);
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('getCacheStatus', () => {
     beforeEach(() => {
        censusService = new CensusService(mockCacheServiceInstance, apiKey);
    });
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 0, size: 1, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(censusService.getCacheStatus()).toEqual(mockStats);
    });
  });
});
