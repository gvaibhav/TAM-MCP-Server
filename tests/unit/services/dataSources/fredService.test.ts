import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { FredService } from '../../../../src/services/datasources/FredService';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('FredService', () => {
  let fredService: FredService;
  const apiKey = 'test_fred_api_key';
  const seriesId = 'GDP';
  const mockApiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      fredService = new FredService(apiKey);
      expect(await fredService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if FRED_API_KEY is in process.env', async () => {
      vi.stubEnv('FRED_API_KEY', apiKey);
      fredService = new FredService();
      expect(await fredService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      vi.stubEnv('FRED_API_KEY', '');
      fredService = new FredService();
      expect(await fredService.isAvailable()).toBe(false);
    });    it('should warn if API key is not configured', () => {
      vi.stubEnv('FRED_API_KEY', '');
      new FredService();
      // Note: We don't test logger calls in unit tests as logging is a cross-cutting concern
    });
  });

  describe('getSeriesObservations', () => {
    beforeEach(() => {
      fredService = new FredService(apiKey);
    });

    it('should fetch and return series observations data', async () => {
      const mockApiResponse = {
        observations: [
          { date: '2023-01-01', value: '25000.0', realtime_start: '2023-01-01', realtime_end: '2023-01-01' }
        ]
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await fredService.getSeriesObservations(seriesId);
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          api_key: 'test_fred_api_key',
          file_type: 'json',
          series_id: 'GDP'
        }
      });
    });

    it('should handle API errors and throw', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('FRED API Error'));

      await expect(fredService.getSeriesObservations(seriesId)).rejects.toThrow('FRED API Error');
    });

    it('should throw error if API key is not configured', async () => {
      delete process.env.FRED_API_KEY;
      fredService = new FredService();
      await expect(fredService.getSeriesObservations(seriesId)).rejects.toThrow('FRED API key not configured');
    });

    it('should handle empty response data', async () => {
      const mockApiResponse = { observations: [] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await fredService.getSeriesObservations(seriesId);
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle malformed response', async () => {
      const mockApiResponse = { error_message: 'Series does not exist' };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await fredService.getSeriesObservations(seriesId);
      expect(result).toEqual(mockApiResponse);
    });

    it('should construct URL with custom parameters', async () => {
      const customParams = {
        start_date: '2020-01-01',
        end_date: '2023-01-01',
        limit: 100
      };
      const expectedUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=100&start_date=2020-01-01&end_date=2023-01-01`;
      
      const mockApiResponse = { observations: [] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      await fredService.getSeriesObservations(seriesId, customParams);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://api.stlouisfed.org/fred/series/observations', {
        params: {
          api_key: 'test_fred_api_key',
          file_type: 'json',
          series_id: 'GDP',
          limit: '100'
        }
      });
    });
  });

  describe('fetchMarketSize', () => {
    beforeEach(() => {
      fredService = new FredService(apiKey);
    });

    it('should fetch market size data and return latest observation', async () => {
      const mockApiResponse = {
        observations: [
          { date: '2023-01-01', value: '25000.0', realtime_start: '2023-01-01', realtime_end: '2023-01-01' }
        ]
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await fredService.fetchMarketSize(seriesId);
      expect(result).toEqual({
        value: 25000,
        date: '2023-01-01',
        seriesId: 'GDP',
        region: 'US',
        source: 'FRED',
        realtime_start: '2023-01-01',
        realtime_end: '2023-01-01'
      });
    });

    it('should handle empty observations and return null for latest values', async () => {
      const mockApiResponse = { observations: [] };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await fredService.fetchMarketSize(seriesId);
      expect(result).toBeNull();
    });

    it('should return null if API key is not configured', async () => {
      delete process.env.FRED_API_KEY;
      fredService = new FredService();
      const result = await fredService.fetchMarketSize(seriesId);
      expect(result).toBeNull();
    });
  });

  describe('searchSeries', () => {
    beforeEach(() => {
      fredService = new FredService(apiKey);
    });

    it('should return placeholder message for search functionality', async () => {
      const searchText = 'GDP';
      
      const result = await fredService.searchSeries(searchText);
      expect(result).toEqual({
        message: 'Search functionality not yet implemented for FRED service',
        query: searchText
      });
    });

    it('should handle search with no results', async () => {
      const searchText = 'nonexistent';
      
      const result = await fredService.searchSeries(searchText);
      expect(result).toEqual({
        message: 'Search functionality not yet implemented for FRED service',
        query: searchText
      });
    });

    it('should return placeholder message if API key is not configured', async () => {
      delete process.env.FRED_API_KEY;
      fredService = new FredService();
      const result = await fredService.searchSeries('GDP');
      expect(result).toEqual({
        message: 'Search functionality not yet implemented for FRED service',
        query: 'GDP'
      });
    });
  });
});
