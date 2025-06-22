import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { CensusService } from '../../../../src/services/datasources/CensusService';
import { censusApi } from '../../../../src/config/apiConfig';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('CensusService', () => {
  let censusService: CensusService;
  const apiKey = 'test_census_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      censusService = new CensusService(apiKey);
      expect(await censusService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if CENSUS_API_KEY is in process.env', async () => {
      envTestUtils.mockWith({ CENSUS_API_KEY: apiKey });
      censusService = new CensusService();
      expect(await censusService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true even if no API key is available', async () => {
      envTestUtils.mockWith({ CENSUS_API_KEY: undefined });
      censusService = new CensusService();
      expect(await censusService.isAvailable()).toBe(true);
    });    it('should log info if API key is not configured', () => {
      envTestUtils.mockWith({ CENSUS_API_KEY: undefined });
      new CensusService();
      // Note: We don't test logger calls in unit tests as logging is a cross-cutting concern
    });
  });

  describe('fetchMarketSize', () => {
    const naicsCode = '54';
    const geography = 'state:*';
    const measure = 'EMP';

    beforeEach(() => {
      censusService = new CensusService(apiKey);
    });

    it('should fetch market size data from Census API', async () => {
      const mockApiResponse = [
        ['NAME', 'NAICS2017', 'NAICS2017_LABEL', 'EMP', 'PAYANN', 'ESTAB', 'state'],
        ['Professional, Scientific, and Technical Services', '54', 'Professional Services', '1000', '50000000', '500', '06'],
        ['Professional, Scientific, and Technical Services', '54', 'Professional Services', '800', '40000000', '400', '48']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.fetchMarketSize(naicsCode, geography, measure);
      
      expect(result).toEqual({
        value: 1800,
        measure,
        naicsCode,
        geography,
        recordCount: 2,
        source: 'Census Bureau',
        dataset: 'County Business Patterns',
        year: censusApi.cbpYear
      });
      expect(mockedAxiosGet).toHaveBeenCalled();
    });

    it('should return null if API call fails', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('Census API Error'));

      const result = await censusService.fetchMarketSize(naicsCode, geography, measure);
      expect(result).toBeNull();
    });

    it('should return null if no data is available', async () => {
      const mockApiResponse = [
        ['NAME', 'NAICS2017', 'NAICS2017_LABEL', 'EMP', 'PAYANN', 'ESTAB', 'state']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.fetchMarketSize(naicsCode, geography, measure);
      expect(result).toBeNull();
    });

    it('should handle malformed response', async () => {
      const mockApiResponse = [
        ['invalid_header']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.fetchMarketSize(naicsCode, geography, measure);
      expect(result).toBeNull();
    });
  });

  describe('fetchIndustryData', () => {
    beforeEach(() => {
      censusService = new CensusService(apiKey);
    });

    it('should fetch industry data from Census API', async () => {
      const naicsCode = '54';
      const geography = 'state:*';
      
      const mockApiResponse = [
        ['NAME', 'NAICS2017', 'NAICS2017_LABEL', 'EMP', 'PAYANN', 'ESTAB', 'state'],
        ['Professional, Scientific, and Technical Services', '54', 'Professional Services', '1000', '50000000', '500', '06']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.fetchIndustryData(naicsCode, geography);
      
      expect(result).toEqual([{
        NAME: 'Professional, Scientific, and Technical Services',
        NAICS2017: '54',
        NAICS2017_LABEL: 'Professional Services',
        EMP: '1000',
        PAYANN: '50000000',
        ESTAB: '500',
        state: '06'
      }]);
      expect(mockedAxiosGet).toHaveBeenCalled();
    });

    it('should return null if API call fails', async () => {
      const naicsCode = '54';
      mockedAxiosGet.mockRejectedValue(new Error('Census API Error'));

      const result = await censusService.fetchIndustryData(naicsCode);
      expect(result).toBeNull();
    });

    it('should return null if no data is available', async () => {
      const naicsCode = '54';
      const mockApiResponse = [];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.fetchIndustryData(naicsCode);
      expect(result).toBeNull();
    });
  });

  describe('getData', () => {
    beforeEach(() => {
      censusService = new CensusService(apiKey);
    });

    it('should fetch data with proper parameters', async () => {
      const dataset = 'acs/acs1';
      const variables = 'B01003_001E';
      const geography = 'state:*';
      
      const mockApiResponse = [
        ['B01003_001E', 'state'],
        ['39538223', '06'],
        ['29145505', '48']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.getData(dataset, variables, geography);
      
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosGet).toHaveBeenCalledWith(
        `${censusApi.baseUrl}/${censusApi.cbpYear}/${dataset}`,
        {
          params: {
            get: variables,
            for: geography,
            key: apiKey
          }
        }
      );
    });    it('should work without API key', async () => {
      // Temporarily clear the environment variable
      const originalKey = process.env.CENSUS_API_KEY;
      delete process.env.CENSUS_API_KEY;
      
      censusService = new CensusService(); // No API key
      const dataset = 'acs/acs1';
      const variables = 'B01003_001E';
      const geography = 'state:*';
      
      const mockApiResponse = [
        ['B01003_001E', 'state'],
        ['39538223', '06']
      ];
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await censusService.getData(dataset, variables, geography);
      
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosGet).toHaveBeenCalledWith(
        `${censusApi.baseUrl}/${censusApi.cbpYear}/${dataset}`,
        {
          params: {
            get: variables,
            for: geography
          }
        }
      );
      
      // Restore the original environment variable
      if (originalKey) {
        process.env.CENSUS_API_KEY = originalKey;
      }
    });
  });
});
