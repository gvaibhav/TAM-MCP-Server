import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { BlsService } from '../../../../src/services/datasources/BlsService';
import { blsApi } from '../../../../src/config/apiConfig';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosPost = vi.mocked(axios.post);

describe('BlsService', () => {
  let blsService: BlsService;
  const apiKey = 'test_bls_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true even without API key (public access)', async () => {
      blsService = new BlsService();
      expect(await blsService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      blsService = new BlsService(apiKey);
      expect(await blsService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if BLS_API_KEY is in process.env', async () => {
      envTestUtils.mockWith({ BLS_API_KEY: apiKey });
      blsService = new BlsService();
      expect(await blsService.isAvailable()).toBe(true);
    });

    it('should log info if API key is not configured', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      envTestUtils.mockWith({ BLS_API_KEY: undefined });
      new BlsService();
      expect(consoleLogSpy).toHaveBeenCalledWith("ℹ️  BLS: API key not configured - using public access with limited rate limits (set BLS_API_KEY to enable full access)");
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchMarketSize', () => {
    const industryId = 'LAUCN04001000000';
    const region = 'CA';

    beforeEach(() => {
      blsService = new BlsService(apiKey);
    });

    it('should fetch market size data using POST API with API key', async () => {
      const mockApiResponse = {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 100,
        message: [],
        Results: {
          series: [{
            seriesID: 'CESLAUCN04001000001',
            data: [{
              year: '2023',
              period: 'M12',
              value: '4.2',
              footnotes: [{}]
            }, {
              year: '2023',
              period: 'M11',
              value: '4.1',
              footnotes: [{}]
            }]
          }]
        }
      };
      mockedAxiosPost.mockResolvedValue({ data: mockApiResponse });

      const result = await blsService.fetchMarketSize(industryId, region);
      
      expect(result).toEqual({
        value: 4.2,
        period: 'M12',
        year: '2023',
        seriesId: 'CESLAUCN040010000000001',
        region: 'CA',
        source: 'BLS',
        title: undefined
      });
      expect(mockedAxiosPost).toHaveBeenCalledWith(
        'https://api.bls.gov/publicAPI/v2/timeseries/data',
        expect.objectContaining({
          seriesid: ['CESLAUCN040010000000001'],
          registrationkey: apiKey
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    it('should return null if no data is available', async () => {
      const mockApiResponse = {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 100,
        message: [],
        Results: {
          series: [{
            seriesID: 'CESLAUCN04001000001',
            data: []
          }]
        }
      };
      mockedAxiosPost.mockResolvedValue({ data: mockApiResponse });

      const result = await blsService.fetchMarketSize(industryId, region);
      expect(result).toBeNull();
    });

    it('should return null if API call fails', async () => {
      mockedAxiosPost.mockRejectedValue(new Error('BLS API Error'));

      const result = await blsService.fetchMarketSize(industryId, region);
      expect(result).toBeNull();
    });

    it('should return null for malformed response', async () => {
      const mockApiResponse = {
        status: 'REQUEST_FAILED',
        message: ['Series does not exist'],
        Results: {}
      };
      mockedAxiosPost.mockResolvedValue({ data: mockApiResponse });

      const result = await blsService.fetchMarketSize(industryId, region);
      expect(result).toBeNull();
    });
  });

  describe('fetchSeriesData', () => {
    beforeEach(() => {
      blsService = new BlsService(apiKey);
    });

    it('should fetch series data with proper parameters', async () => {
      const seriesIds = ['LAUCN040010000000005'];
      const startYear = '2020';
      const endYear = '2023';
      const options = { catalog: true };
      
      const mockApiResponse = {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 100,
        message: [],
        Results: {
          series: [{
            seriesID: 'LAUCN040010000000005',
            data: [{
              year: '2023',
              period: 'M12',
              value: '4.2',
              footnotes: [{}]
            }]
          }]
        }
      };
      mockedAxiosPost.mockResolvedValue({ data: mockApiResponse });

      const result = await blsService.fetchSeriesData(seriesIds, startYear, endYear, options);
      
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosPost).toHaveBeenCalledWith(
        'https://api.bls.gov/publicAPI/v2/timeseries/data',
        {
          seriesid: seriesIds,
          registrationkey: apiKey,
          startyear: startYear,
          endyear: endYear,
          catalog: true
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    it('should throw error for empty series IDs', async () => {
      await expect(blsService.fetchSeriesData([])).rejects.toThrow('SeriesIds must be a non-empty array');
    });
  });

  describe('fetchIndustryData', () => {
    beforeEach(() => {
      blsService = new BlsService(apiKey);
    });

    it('should fetch industry data by calling fetchSeriesData', async () => {
      const seriesIds = ['CES0000000001'];
      const startYear = '2020';
      const endYear = '2023';
      const options = { calculations: true };
      
      const mockApiResponse = {
        status: 'REQUEST_SUCCEEDED',
        responseTime: 100,
        message: [],
        Results: {
          series: [{
            seriesID: 'CES0000000001',
            data: [{
              year: '2023',
              period: 'M12',
              value: '156800.0',
              footnotes: [{}]
            }]
          }]
        }
      };
      mockedAxiosPost.mockResolvedValue({ data: mockApiResponse });

      const result = await blsService.fetchIndustryData(seriesIds, startYear, endYear, options);
      
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosPost).toHaveBeenCalledWith(
        'https://api.bls.gov/publicAPI/v2/timeseries/data',
        {
          seriesid: seriesIds,
          registrationkey: apiKey,
          startyear: startYear,
          endyear: endYear,
          calculations: true
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    });
  });
});
