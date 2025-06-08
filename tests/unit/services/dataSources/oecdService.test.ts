import axios from 'axios';
import { OecdService } from '../../../../src/services/dataSources/oecdService';
import { CacheService } from '../../../../src/services/cache/cacheService';
import { CacheEntry, CacheStatus } from '../../../../src/types/cache';
import { oecdApi } from '../../../../src/config/apiConfig';

jest.mock('axios');
jest.mock('../../../../src/services/cache/cacheService');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;

// Simplified Mock SDMX-JSON structure for testing
const mockSdmxJsonResponseAllDimensions = {
  header: { id: 'testResp', test: true, prepared: new Date().toISOString() },
  dataSets: [
    {
      action: 'Information',
      observations: {
        '0:0:0:0:0': [100, 0, 1], // Value, STATUS_attr_idx, CONF_attr_idx. TIME_PERIOD is '0' (index for '2022')
        '0:0:0:1:0': [150, 1, 0], // FREQ is '1' (index for 'Quarterly')
      },
    },
  ],
  structure: {
    name: 'Test Dataset',
    dimensions: {
      observation: [
        { id: 'COUNTRY', name: 'Country', keyPosition: 0, values: [{ id: 'AUS', name: 'Australia' }] },
        { id: 'SUBJECT', name: 'Subject', keyPosition: 1, values: [{ id: 'GDP', name: 'Gross Domestic Product' }] },
        { id: 'MEASURE', name: 'Measure', keyPosition: 2, values: [{ id: 'USD_CAP', name: 'USD per Capita' }] },
        { id: 'FREQ', name: 'Frequency', keyPosition: 3, values: [{ id: 'A', name: 'Annual' }, {id: 'Q', name: 'Quarterly'}] },
        { id: 'TIME_PERIOD', name: 'Time Period', values: [{ id: '2022', name: '2022' }] },
      ],
    },
    attributes: {
      observation: [
        { id: 'STATUS', name: 'Status', values: [{id: 'E', name: 'Estimated'}, {id: 'P', name: 'Provisional'}] },
        { id: 'CONF_STATUS', name: 'Confidentiality', values: [{id: 'F', name: 'Free'}, {id: 'C', name: 'Confidential'}] },
      ],
    },
  },
};

const mockSdmxJsonResponseSeries = {
  header: { id: 'seriesResp', prepared: new Date().toISOString() },
  dataSets: [
    {
      action: 'Information',
      series: {
        '0:0:0': { // Series key for LOCATION:INDICATOR:FREQ
          attributes: [], // No series attributes in this mock for simplicity
          observations: {
            '0': [200, 0], // TIME_PERIOD index 0 (e.g. 2022-Q1), value, obs_attr_idx for OBS_STATUS
            '1': [210, 1], // TIME_PERIOD index 1 (e.g. 2022-Q2), value, obs_attr_idx for OBS_STATUS
          },
        },
      },
    },
  ],
  structure: {
    name: 'Test Series Dataset',
    dimensions: {
      series: [
        { id: 'LOCATION', name: 'Location', keyPosition: 0, values: [{ id: 'DE', name: 'Germany' }] },
        { id: 'INDICATOR', name: 'Indicator', keyPosition: 1, values: [{ id: 'CPI', name: 'Consumer Price Index' }] },
        { id: 'FREQ', name: 'Frequency', keyPosition: 2, values: [{ id: 'M', name: 'Monthly' }] },
      ],
      observation: [ // TIME_PERIOD is typically the only observation dimension here
        { id: 'TIME_PERIOD', name: 'Time', values: [{id: '2022-Q1', name:'2022-Q1'}, {id:'2022-Q2', name:'2022-Q2'}] },
      ],
    },
    attributes: {
        series: [ /* ... series attributes if any ... */ ],
        observation: [
            { id: 'OBS_STATUS', name: 'Observation Status', values: [{id: 'A', name: 'Actual'}, {id: 'E', name: 'Estimated'}] },
        ],
    },
  },
};


describe('OecdService', () => {
  let oecdService: OecdService;
  let mockCacheServiceInstance: jest.Mocked<CacheService>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockCacheServiceInstance = new MockedCacheService() as jest.Mocked<CacheService>;
    oecdService = new OecdService(mockCacheServiceInstance);
  });

  describe('isAvailable', () => {
    it('should return true', async () => {
      expect(await oecdService.isAvailable()).toBe(true);
    });
  });

  describe('fetchOecdDataset', () => {
    const datasetId = 'QNA';
    const filterExpression = 'AUS.TOTAL.AGR.Q';
    const agencyId = oecdApi.defaultAgencyId;
    const dimAtObs = oecdApi.defaultDimensionObservation; // 'AllDimensions'
    const cacheKeyObj = { datasetId, filterExpression, agencyId, dimensionAtObservation: dimAtObs };
    const cacheKey = `oecd_${JSON.stringify(cacheKeyObj)}`;
    const mockApiUrl = `${oecdApi.baseUrl}/${datasetId}/${filterExpression}/${agencyId}`;

    it('should throw error if datasetId or filterExpression is missing', async () => {
        await expect(oecdService.fetchOecdDataset('', filterExpression)).rejects.toThrow("Dataset ID and filter expression must be provided");
        await expect(oecdService.fetchOecdDataset(datasetId, '')).rejects.toThrow("Dataset ID and filter expression must be provided");
    });

    it('should return data from cache if available', async () => {
      const cachedData = [{ COUNTRY: 'Australia', value: 100 }];
      mockCacheServiceInstance.get.mockResolvedValue(cachedData);

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression);
      expect(result).toEqual(cachedData);
      expect(mockCacheServiceInstance.get).toHaveBeenCalledWith(cacheKey);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch, parse (AllDimensions), and cache data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockSdmxJsonResponseAllDimensions });

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression, agencyId, undefined, undefined, 'AllDimensions');

      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl, { params: { dimensionAtObservation: 'AllDimensions' } });
      expect(result).toBeInstanceOf(Array);
      expect(result?.length).toBe(2);

      // Check first observation details
      expect(result?.[0]).toEqual(expect.objectContaining({
        COUNTRY: 'Australia',
        COUNTRY_ID: 'AUS',
        SUBJECT: 'Gross Domestic Product',
        SUBJECT_ID: 'GDP',
        MEASURE: 'USD per Capita',
        MEASURE_ID: 'USD_CAP',
        FREQ: 'Annual', // From key '0' in FREQ.values
        FREQ_ID: 'A',
        TIME_PERIOD: '2022', // From key '0' in TIME_PERIOD.values
        TIME_PERIOD_ID: '2022',
        value: 100,
        STATUS: 'Estimated',
        STATUS_ID: 'E',
        CONF_STATUS: 'Free',
        CONF_STATUS_ID: 'F'
      }));

      // Check second observation specific changes
       expect(result?.[1].FREQ).toEqual('Quarterly');
       expect(result?.[1].FREQ_ID).toEqual('Q');
       expect(result?.[1].STATUS).toEqual('Provisional');
       expect(result?.[1].STATUS_ID).toEqual('P');
       expect(result?.[1].CONF_STATUS).toEqual('Confidential');
       expect(result?.[1].CONF_STATUS_ID).toEqual('C');


      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, result, expect.any(Number));
    });

    it('should fetch, parse (Series-based), and cache data if not in cache', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const seriesDimAtObs = 'someSeriesDim'; // Example to trigger series parsing path
      const seriesCacheKeyObj = { datasetId, filterExpression, agencyId, dimensionAtObservation: seriesDimAtObs };
      const seriesCacheKey = `oecd_${JSON.stringify(seriesCacheKeyObj)}`;

      mockedAxios.get.mockResolvedValue({ data: mockSdmxJsonResponseSeries });

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression, agencyId, undefined, undefined, seriesDimAtObs);

      expect(mockedAxios.get).toHaveBeenCalledWith(mockApiUrl, { params: { dimensionAtObservation: seriesDimAtObs } });
      expect(result).toBeInstanceOf(Array);
      expect(result?.length).toBe(2);

      expect(result?.[0]).toEqual(expect.objectContaining({
        LOCATION: 'Germany',
        LOCATION_ID: 'DE',
        INDICATOR: 'Consumer Price Index',
        INDICATOR_ID: 'CPI',
        FREQ: 'Monthly',
        FREQ_ID: 'M',
        TIME_PERIOD: '2022-Q1',
        TIME_PERIOD_ID: '2022-Q1',
        value: 200,
        OBS_STATUS: 'Actual',
        OBS_STATUS_ID: 'A'
      }));
       expect(result?.[1].TIME_PERIOD).toEqual('2022-Q2');
       expect(result?.[1].value).toEqual(210);
       expect(result?.[1].OBS_STATUS).toEqual('Estimated');


      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(seriesCacheKey, result, expect.any(Number));
    });


    it('should handle API response with no dataSets and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noDataResponse = { ...mockSdmxJsonResponseAllDimensions, dataSets: [] };
      mockedAxios.get.mockResolvedValue({ data: noDataResponse });

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle API response with no observations and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      const noObsResponse = JSON.parse(JSON.stringify(mockSdmxJsonResponseAllDimensions));
      noObsResponse.dataSets[0].observations = {};
      mockedAxios.get.mockResolvedValue({ data: noObsResponse });

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression);
      expect(result).toBeNull();
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle API error and cache null', async () => {
      mockCacheServiceInstance.get.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(oecdService.fetchOecdDataset(datasetId, filterExpression))
        .rejects.toThrow('Network Error');
      expect(mockCacheServiceInstance.set).toHaveBeenCalledWith(cacheKey, null, expect.any(Number));
    });

    it('should handle OECD API error response (e.g. 404 as error object)', async () => {
        mockCacheServiceInstance.get.mockResolvedValue(null);
        const apiError = {
            isAxiosError: true,
            response: {
                status: 404,
                data: { code: 404, title: "Not Found", detail: "No matching data found."}
            },
            message: "Request failed with status code 404"
        };
        mockedAxios.get.mockRejectedValue(apiError);

        await expect(oecdService.fetchOecdDataset(datasetId, filterExpression))
            .rejects.toThrow('OECD API Error: 404 - {"code":404,"title":"Not Found","detail":"No matching data found."}');
    });
  });

  describe('fetchIndustryData', () => {
    it('should call fetchOecdDataset with correct parameters', async () => {
      const spy = jest.spyOn(oecdService as any, 'fetchOecdDataset').mockResolvedValue([]);
      const options = { agencyId: 'OECD', startTime: '2020', endTime: '2021', dimensionAtObservation: 'TIME_PERIOD' };
      await oecdService.fetchIndustryData('DSD', 'FILTER', options);
      expect(spy).toHaveBeenCalledWith('DSD', 'FILTER', options.agencyId, options.startTime, options.endTime, options.dimensionAtObservation);
      spy.mockRestore();
    });
  });

  describe('fetchMarketSize', () => {
    it('should call fetchOecdDataset and return latest observation value', async () => {
        const mockObservations = [ // Sorted ascending by time for test
            { LOCATION: 'AUS', TIME_PERIOD: '2022', TIME_PERIOD_ID: '2022', value: 100, MY_MEASURE: 150 },
            { LOCATION: 'AUS', TIME_PERIOD: '2023', TIME_PERIOD_ID: '2023', value: 110, MY_MEASURE: 160 }
        ];
        const spy = jest.spyOn(oecdService as any, 'fetchOecdDataset').mockResolvedValue(mockObservations);
        const options = { agencyId: 'OECD' };

        let result = await oecdService.fetchMarketSize('DSD', 'FILTER', 'MY_MEASURE', options);
        expect(result).toEqual({
            value: 160, // From MY_MEASURE of latest (2023)
            dimensions: mockObservations[1], // Latest observation after sort
            source: 'OECD',
            dataset: 'DSD',
            filter: 'FILTER'
        });

        result = await oecdService.fetchMarketSize('DSD', 'FILTER', undefined, options); // Default 'value' attribute
         expect(result?.value).toBe(110); // From 'value' of latest (2023)

        spy.mockRestore();
    });

    it('should return null if fetchOecdDataset returns null or empty for market size', async () => {
        const spy = jest.spyOn(oecdService as any, 'fetchOecdDataset').mockResolvedValue(null);
        let result = await oecdService.fetchMarketSize('DSD', 'FILTER');
        expect(result).toBeNull();

        spy.mockResolvedValue([]); // Empty array
        result = await oecdService.fetchMarketSize('DSD', 'FILTER');
        expect(result).toBeNull();
        spy.mockRestore();
    });
  });

  describe('getDataFreshness', () => {
    it('should return timestamp from cache entry', async () => {
      const now = Date.now();
      const cacheEntry: CacheEntry<any> = { data: [], timestamp: now, ttl: 1000 };
      const cacheKeyObj = { datasetId:'ID', filterExpression:'FLT', agencyId: oecdApi.defaultAgencyId, dimensionAtObservation: oecdApi.defaultDimensionObservation };
      const cacheKey = `oecd_${JSON.stringify(cacheKeyObj)}`;
      (mockCacheServiceInstance as any).getEntry = jest.fn().mockResolvedValue(cacheEntry);

      const freshness = await oecdService.getDataFreshness('ID', 'FLT');
      expect(freshness).toEqual(new Date(now));
      expect(mockCacheServiceInstance.getEntry).toHaveBeenCalledWith(cacheKey);
    });
  });

   describe('getCacheStatus', () => {
    it('should call cacheService.getStats', () => {
      const mockStats: CacheStatus = { hits: 1, misses: 0, size: 1, lastRefreshed: new Date() };
      (mockCacheServiceInstance as any).getStats = jest.fn().mockReturnValue(mockStats);
      expect(oecdService.getCacheStatus()).toEqual(mockStats);
    });
  });
});
