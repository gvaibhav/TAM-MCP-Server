import axios from 'axios';
import { ImfService } from '../../../../src/services/dataSources/imfService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { imfApi } from '../../../../src/config/apiConfig';
import * as envHelper from '../../../../src/utils/envHelper';

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');
jest.mock('../../../../src/utils/envHelper');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockedGetEnvAsNumber = envHelper.getEnvAsNumber as jest.Mock;

// Mock IMF SDMX-JSON CompactData Structure
const mockImfSdmxCompactDataResponse = {
  structure: {
    name: "IMF Primary Commodity Price System (PCPS)",
    dimensions: {
      series: [
        { keyPosition: 0, id: "FREQ", name: "Frequency", values: [{ id: "A", name: "Annual" }, { id: "M", name: "Monthly" }] },
        { keyPosition: 1, id: "REF_AREA", name: "Counterpart Reference Area", values: [{ id: "W00", name: "World" }] },
        { keyPosition: 2, id: "COMMODITY", name: "Commodity", values: [{ id: "PAUM", name: "Aluminum" }, {id: "PCOAL", name: "Coal"}] },
        { keyPosition: 3, id: "UNIT_MEASURE", name: "Unit of  Measure", values: [{ id: "USD", name: "US Dollar" }] }
      ],
      observation: [ // Only TIME_PERIOD typically, others are on series
        { id: "TIME_PERIOD", name: "Time Period", role: "time" } // Values for TIME_PERIOD are actual time strings in obs keys
      ]
    },
    attributes: { // Attributes can be on series or observation
      observation: [
        { id: "OBS_STATUS", name: "Observation Status", values: [{id: "A", name: "Actual"}, {id: "E", name: "Estimated"}] }
      ],
      series: [
          {id: "UNIT_MULT", name: "Unit Multiplier", values: [{id: "0", name: "Units"}, {id: "3", name: "Thousands"}]}
      ]
    }
  },
  dataSets: [
    {
      series: {
        // Series Key: FREQ:REF_AREA:COMMODITY:UNIT_MEASURE (e.g., Monthly.World.Aluminum.USD)
        // Example: M.W00.PAUM.USD -> series key "1:0:0:0" (indices into values arrays of dimensions above)
        "1:0:0:0": { // Monthly, World, Aluminum, USD
          attributes: [0], // UNIT_MULT index 0 ('Units')
          observations: {
            "2023-01": [175.0, 0], // Value, OBS_STATUS index 0 ('Actual')
            "2023-02": [176.5, 0]
          }
        },
        "1:0:1:0": { // Monthly, World, Coal, USD
          attributes: [1], // UNIT_MULT index 1 ('Thousands')
          observations: {
            "2023-01": [300.0, 1], // Value, OBS_STATUS index 1 ('Estimated')
            "2023-02": [305.0, 0]
          }
        }
      }
    }
  ]
};


describe('ImfService', () => {
  let imfService: ImfService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    mockedGetEnvAsNumber.mockImplementation((key, defaultValue) => defaultValue);
    imfService = new ImfService(mockCacheServiceInstance);
  });

  describe('isAvailable', () => {
    it('should return true', async () => {
      expect(await imfService.isAvailable()).toBe(true);
    });
  });

  describe('fetchImfDataset', () => {
    const dataflowId = 'IFS';
    const key = 'A.US.NGDP_RPCH'; // Example key
    const startPeriod = '2020';
    const endPeriod = '2022';
    const queryParams = { startPeriod, endPeriod };
    const cacheKeyObj = { dataflowId, key, ...queryParams };
    const cacheKey = `imf_${JSON.stringify(cacheKeyObj)}`;
    const mockApiUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;

    it('should throw error if dataflowId or key is missing', async () => {
        await expect(imfService.fetchImfDataset('', key)).rejects.toThrow("Dataflow ID and Key must be provided");
        await expect(imfService.fetchImfDataset(dataflowId, '')).rejects.toThrow("Dataflow ID and Key must be provided");
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ FREQ: 'Annual', value: 100 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, parse (CompactData series), and cache data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockImfSdmxCompactDataResponse });

      const result = await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);

      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl, { params: queryParams });
      expect(result).toBeInstanceOf(Array);
      expect(result?.length).toBe(4); // 2 series, 2 obs each

      // Check first observation of first series (Aluminum)
      expect(result?.[0]).toEqual({
        FREQ: 'Monthly', FREQ_ID: 'M',
        REF_AREA: 'World', REF_AREA_ID: 'W00',
        COMMODITY: 'Aluminum', COMMODITY_ID: 'PAUM',
        UNIT_MEASURE: 'US Dollar', UNIT_MEASURE_ID: 'USD',
        UNIT_MULT: 'Units', UNIT_MULT_ID: '0', // Series attribute
        TIME_PERIOD: '2023-01',
        value: 175.0,
        OBS_STATUS: 'Actual', OBS_STATUS_ID: 'A' // Observation attribute
      });
      // Check second observation of second series (Coal)
      expect(result?.[3]).toEqual({
        FREQ: 'Monthly', FREQ_ID: 'M',
        REF_AREA: 'World', REF_AREA_ID: 'W00',
        COMMODITY: 'Coal', COMMODITY_ID: 'PCOAL',
        UNIT_MEASURE: 'US Dollar', UNIT_MEASURE_ID: 'USD',
        UNIT_MULT: 'Thousands', UNIT_MULT_ID: '3', // Series attribute
        TIME_PERIOD: '2023-02',
        value: 305.0,
        OBS_STATUS: 'Actual', OBS_STATUS_ID: 'A'
      });
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, result, expect.any(Number));
    });

    it('should handle missing series structure and return null', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const noStructureResponse = JSON.parse(JSON.stringify(mockImfSdmxCompactDataResponse));
        delete noStructureResponse.structure?.dimensions?.series; // Remove critical part of structure
        mockedAxios.get.mockResolvedValue({ data: noStructureResponse });
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await imfService.fetchImfDataset(dataflowId, key);
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Series structure definition not found"));
        expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expect.stringContaining(dataflowId), null, expect.any(Number));
        consoleWarnSpy.mockRestore();
    });

    it('should handle no series data in response and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noSeriesResponse = { ...mockImfSdmxCompactDataResponse, dataSets: [{ series: {} }] };
      mockedAxios.get.mockResolvedValue({ data: noSeriesResponse });

      const result = await imfService.fetchImfDataset(dataflowId, key);
      expect(result).toBeNull(); // because observations array will be empty
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expect.stringContaining(dataflowId), null, expect.any(Number));
    });

    it('should handle API error and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow('Network Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(expect.stringContaining(dataflowId), null, expect.any(Number));
    });
     it('should handle IMF API error response (e.g. 400 with JSON error)', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const apiError = {
            isAxiosError: true,
            response: {
                status: 400,
                data: { Message: "Invalid request parameters." } // Example error structure
            },
            message: "Request failed with status code 400"
        };
        mockedAxios.get.mockRejectedValue(apiError);

        await expect(imfService.fetchImfDataset(dataflowId, key))
            .rejects.toThrow('IMF API Error: 400 - {"Message":"Invalid request parameters."}');
    });

    // Add TTL tests similar to other services
    it('should use TTL from env var for successful fetch', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockImfSdmxCompactDataResponse });
      const customTTL = 555000;
      mockedGetEnvAsNumber.mockImplementation((envKey, defVal) => envKey === 'CACHE_TTL_IMF_MS' ? customTTL : defVal);
      imfService = new ImfService(mockCacheServiceInstance); // Re-instantiate

      await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, expect.any(Array), customTTL);
    });

     it('should use NoData TTL from env var when no series data found', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noSeriesResponse = { ...mockImfSdmxCompactDataResponse, dataSets: [{ series: {} }] };
      mockedAxios.get.mockResolvedValue({ data: noSeriesResponse });
      const customNoDataTTL = 666000;
      mockedGetEnvAsNumber.mockImplementation((envKey, defVal) => envKey === 'CACHE_TTL_IMF_NODATA_MS' ? customNoDataTTL : defVal);
      imfService = new ImfService(mockCacheServiceInstance); // Re-instantiate

      await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, customNoDataTTL);
    });
  });

  describe('fetchIndustryData', () => {
    it('should call fetchImfDataset with correct parameters', async () => {
      const spy = jest.spyOn(imfService as any, 'fetchImfDataset').mockResolvedValue([]);
      const options = { startPeriod: '2021', endPeriod: '2022' };
      await imfService.fetchIndustryData('FLOW', 'KEY.A', options);
      expect(spy).toHaveBeenCalledWith('FLOW', 'KEY.A', options.startPeriod, options.endPeriod);
      spy.mockRestore();
    });
  });

  describe('fetchMarketSize', () => {
    it('should call fetchImfDataset and return latest observation value', async () => {
        const mockObservations = [ // Note: Service sorts these desc by TIME_PERIOD to get latest
            { FREQ: 'A', TIME_PERIOD: '2022', value: 100 },
            { FREQ: 'A', TIME_PERIOD: '2023', value: 110 }
        ];
        const spy = jest.spyOn(imfService as any, 'fetchImfDataset').mockResolvedValue(mockObservations);

        const result = await imfService.fetchMarketSize('FLOW', 'KEY.A');
        expect(result).toEqual({
            value: 110, // Latest after sort
            dimensions: mockObservations[1], // Latest observation
            source: 'IMF',
            dataset: 'FLOW',
            key: 'KEY.A'
        });
        spy.mockRestore();
    });
  });

  describe('getDataFreshness', () => {
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: [], timestamp: now, ttl: 1000 };
      const cacheKeyObj = { dataflowId:'ID', key:'K', startPeriod: '2020' };
      const cacheKey = `imf_${JSON.stringify(cacheKeyObj)}`;
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

      const freshness = await imfService.getDataFreshness('ID', 'K', '2020');
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });
  });

   describe('getCacheStatus', () => {
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 0, size: 1, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(imfService.getCacheStatus()).toEqual(mockStats);
    });
  });
});
