import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ImfService } from '../../../../src/services/datasources/ImfService';
import { imfApi } from '../../../../src/config/apiConfig';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

// Mock IMF SDMX-JSON CompactData Structure
const mockImfDataResponse = [
  {
    TIME_PERIOD: "2023-01",
    value: 175,
    COMMODITY_ID: "PAUM",
    COMMODITY: "Aluminum",
    FREQ_ID: "M",
    FREQ: "Monthly",
    REF_AREA_ID: "W00",
    REF_AREA: "World",
    UNIT_MEASURE_ID: "USD",
    UNIT_MEASURE: "US Dollar",
    UNIT_MULT_ID: "0",
    UNIT_MULT: "Units",
    OBS_STATUS_ID: "A",
    OBS_STATUS: "Actual"
  },
  {
    TIME_PERIOD: "2023-02",
    value: 176.5,
    COMMODITY_ID: "PAUM",
    COMMODITY: "Aluminum",
    FREQ_ID: "M",
    FREQ: "Monthly",
    REF_AREA_ID: "W00",
    REF_AREA: "World",
    UNIT_MEASURE_ID: "USD",
    UNIT_MEASURE: "US Dollar",
    UNIT_MULT_ID: "0",
    UNIT_MULT: "Units",
    OBS_STATUS_ID: "A",
    OBS_STATUS: "Actual"
  }
];

describe('ImfService', () => {
  let imfService: ImfService;

  beforeEach(() => {
    vi.resetAllMocks();
    imfService = new ImfService();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should always be true (no API key required)', async () => {
      expect(await imfService.isAvailable()).toBe(true);
    });
  });

  describe('fetchImfDataset', () => {
    it('should fetch and return IMF dataset with proper parameters', async () => {
      const dataflowId = 'PCPS';
      const key = 'ALL_COUNTRIES';
      const expectedUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
      
      // Mock the parseSdmxCompactData method to return our mock data
      const mockParsedData = mockImfDataResponse;
      vi.spyOn(imfService as any, 'parseSdmxCompactData').mockReturnValue(mockParsedData);
      
      mockedAxiosGet.mockResolvedValue({ data: { mockStructure: true } });

      const result = await imfService.fetchImfDataset(dataflowId, key);
      expect(result).toEqual(mockParsedData);
      expect(mockedAxiosGet).toHaveBeenCalledWith(expectedUrl, { params: {} });
    });

    it('should include period parameters when provided', async () => {
      const dataflowId = 'PCPS';
      const key = 'ALL_COUNTRIES';
      const startPeriod = '2020';
      const endPeriod = '2023';
      const expectedUrl = `${imfApi.baseUrl}/CompactData/${dataflowId}/${key}`;
      
      vi.spyOn(imfService as any, 'parseSdmxCompactData').mockReturnValue(mockImfDataResponse);
      mockedAxiosGet.mockResolvedValue({ data: { mockStructure: true } });

      await imfService.fetchImfDataset(dataflowId, key, startPeriod, endPeriod);
      expect(mockedAxiosGet).toHaveBeenCalledWith(expectedUrl, { 
        params: { startPeriod: '2020', endPeriod: '2023' } 
      });
    });

    it('should throw error if dataflowId or key is missing', async () => {
      await expect(imfService.fetchImfDataset('', 'key')).rejects.toThrow('Dataflow ID and Key must be provided');
      await expect(imfService.fetchImfDataset('dataflow', '')).rejects.toThrow('Dataflow ID and Key must be provided');
    });

    it('should handle API errors and throw with proper format', async () => {
      const dataflowId = 'PCPS';
      const key = 'ALL_COUNTRIES';
      
      mockedAxiosGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: { error: 'Dataset not found' } }
      });

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow('IMF API Error: 404');
    });

    it('should handle network errors', async () => {
      const dataflowId = 'PCPS';
      const key = 'ALL_COUNTRIES';
      const networkError = new Error('Network Error');
      
      mockedAxiosGet.mockRejectedValue(networkError);

      await expect(imfService.fetchImfDataset(dataflowId, key)).rejects.toThrow('Network Error');
    });
  });

  describe('fetchMarketSize', () => {
    it('should fetch market size data and return latest observation', async () => {
      const industryId = 'PAUM';
      
      // Mock the fetchImfDataset method to return our test data
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      const result = await imfService.fetchMarketSize(industryId);
      
      expect(result).toEqual({
        value: 175, // First value from 2023-01 (parseInt logic gives same year for both)
        dimensions: mockImfDataResponse[0], // First record due to parseInt comparison
        source: 'IMF',
        dataset: industryId,
        key: 'ALL_COUNTRIES'
      });
    });

    it('should use custom region if provided', async () => {
      const industryId = 'PAUM';
      const region = 'USA';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      await imfService.fetchMarketSize(industryId, region);
      
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith(industryId, region);
    });

    it('should return null if no data available', async () => {
      const industryId = 'PAUM';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue([]);

      const result = await imfService.fetchMarketSize(industryId);
      expect(result).toBeNull();
    });

    it('should return null on fetchImfDataset error', async () => {
      const industryId = 'PAUM';
      
      vi.spyOn(imfService, 'fetchImfDataset').mockRejectedValue(new Error('API Error'));

      const result = await imfService.fetchMarketSize(industryId);
      expect(result).toBeNull();
    });
  });

  describe('searchDataset', () => {
    it('should return placeholder message for search functionality', async () => {
      const searchQuery = 'commodity';

      const result = await imfService.searchDataset(searchQuery);
      
      expect(result).toEqual({
        message: 'Search functionality not yet implemented for IMF service',
        query: searchQuery
      });
    });

    it('should handle search with parameters', async () => {
      const searchQuery = 'GDP';
      const params = { limit: 10 };

      const result = await imfService.searchDataset(searchQuery, params);
      
      expect(result).toEqual({
        message: 'Search functionality not yet implemented for IMF service',
        query: searchQuery
      });
    });
  });

  describe('getDataFreshness', () => {
    it('should return placeholder freshness data', async () => {
      const result = await imfService.getDataFreshness({});
      
      expect(result).toEqual({
        lastUpdated: "N/A",
        nextUpdate: "N/A"
      });
    });
  });

  describe('fetchIndustryData', () => {
    it('should return null for missing parameters', async () => {
      const result = await imfService.fetchIndustryData();
      expect(result).toBeNull();
    });

    it('should return null for incomplete parameters', async () => {
      const result = await imfService.fetchIndustryData('dataflow');
      expect(result).toBeNull();
    });

    it('should delegate to fetchImfDataset when parameters are provided', async () => {
      const dataflowId = 'PCPS';
      const key = 'ALL_COUNTRIES';
      const options = { startPeriod: '2020' };
      
      vi.spyOn(imfService, 'fetchImfDataset').mockResolvedValue(mockImfDataResponse);

      const result = await imfService.fetchIndustryData(dataflowId, key, options);
      
      expect(imfService.fetchImfDataset).toHaveBeenCalledWith(dataflowId, key, '2020', undefined);
      expect(result).toEqual(mockImfDataResponse);
    });
  });
});
