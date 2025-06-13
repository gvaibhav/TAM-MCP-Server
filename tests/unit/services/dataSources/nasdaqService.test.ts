import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { NasdaqService } from '../../../../src/services/datasources/NasdaqService';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('NasdaqService', () => {
  let nasdaqService: NasdaqService;
  const apiKey = 'test_nasdaq_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      nasdaqService = new NasdaqService(apiKey);
      expect(await nasdaqService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if NASDAQ_DATA_LINK_API_KEY is in process.env', async () => {
      vi.stubEnv('NASDAQ_DATA_LINK_API_KEY', apiKey);
      nasdaqService = new NasdaqService();
      expect(await nasdaqService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true even if no API key is available (public access)', async () => {
      vi.stubEnv('NASDAQ_DATA_LINK_API_KEY', '');
      nasdaqService = new NasdaqService();
      expect(await nasdaqService.isAvailable()).toBe(true);
    });

    it('should log info if API key is not configured', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.stubEnv('NASDAQ_DATA_LINK_API_KEY', '');
      new NasdaqService();
      expect(consoleLogSpy).toHaveBeenCalledWith('ℹ️  Nasdaq: API key not configured - using public access with limited rate limits (set NASDAQ_DATA_LINK_API_KEY to enable full access)');
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchDatasetTimeSeries', () => {
    beforeEach(() => {
      nasdaqService = new NasdaqService(apiKey);
    });

    it('should fetch time series data from NASDAQ API', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'AAPL';
      const mockApiResponse = {
        dataset_data: {
          data: [
            ['2023-01-01', 150.25, 151.00, 149.00, 150.75, 1000000],
            ['2023-01-02', 150.75, 152.00, 150.00, 151.50, 1100000]
          ],
          column_names: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.fetchDatasetTimeSeries(databaseCode, datasetCode);
      
      expect(result).toEqual(mockApiResponse.dataset_data);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL/data.json', {
        params: { api_key: apiKey }
      });
    });

    it('should handle API errors and return null', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'INVALID';
      
      mockedAxiosGet.mockRejectedValue(new Error('Dataset not found'));

      const result = await nasdaqService.fetchDatasetTimeSeries(databaseCode, datasetCode);
      expect(result).toBeNull();
    });

    it('should work without API key (public access)', async () => {
      nasdaqService = new NasdaqService();
      const databaseCode = 'WIKI';
      const datasetCode = 'AAPL';
      const mockApiResponse = { dataset_data: { data: [] } };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.fetchDatasetTimeSeries(databaseCode, datasetCode);
      
      expect(result).toEqual(mockApiResponse.dataset_data);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL/data.json', {
        params: {}
      });
    });
  });

  describe('fetchMarketSize', () => {
    beforeEach(() => {
      nasdaqService = new NasdaqService(apiKey);
    });

    it('should fetch market size data and extract latest value', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'AAPL';
      const mockApiResponse = {
        dataset_data: {
          data: [
            ['2023-01-02', 150.75, 152.00, 150.00, 151.50, 1100000]
          ],
          column_names: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode, 'Close');
      
      expect(result).toEqual({
        value: 151.50,
        date: '2023-01-02',
        dataset: 'WIKI/AAPL',
        source: 'Nasdaq Data Link',
        column_names: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
      });
    });

    it('should return null if no data available', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'AAPL';
      const mockApiResponse = {
        dataset_data: {
          data: [],
          column_names: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode);
      expect(result).toBeNull();
    });

    it('should return null on API errors', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'INVALID';
      
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      const result = await nasdaqService.fetchMarketSize(databaseCode, datasetCode);
      expect(result).toBeNull();
    });
  });

  describe('fetchIndustryData', () => {
    beforeEach(() => {
      nasdaqService = new NasdaqService(apiKey);
    });

    it('should fetch industry data by delegating to fetchDatasetTimeSeries', async () => {
      const databaseCode = 'WIKI';
      const datasetCode = 'INDUSTRY_DATA';
      const params = { start_date: '2020-01-01' };
      const mockApiResponse = { dataset_data: { data: [] } };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.fetchIndustryData(databaseCode, datasetCode, params);
      
      expect(result).toEqual(mockApiResponse.dataset_data);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://data.nasdaq.com/api/v3/datasets/WIKI/INDUSTRY_DATA/data.json', {
        params: { api_key: apiKey, start_date: '2020-01-01' }
      });
    });
  });

  describe('searchDatasets', () => {
    beforeEach(() => {
      nasdaqService = new NasdaqService(apiKey);
    });

    it('should search for datasets by query', async () => {
      const query = 'AAPL';
      const mockApiResponse = {
        datasets: [
          {
            database_code: 'WIKI',
            dataset_code: 'AAPL',
            name: 'Apple Inc. (AAPL) Prices, Dividends, Splits and Trading Volume',
            description: 'End of day open, high, low, close and volume...'
          }
        ]
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.searchDatasets(query);
      
      expect(result).toEqual(mockApiResponse);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://data.nasdaq.com/api/v3/datasets.json', {
        params: { api_key: apiKey, query: 'AAPL' }
      });
    });

    it('should handle search with no results', async () => {
      const query = 'NONEXISTENT';
      const mockApiResponse = { datasets: [] };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await nasdaqService.searchDatasets(query);
      expect(result).toEqual(mockApiResponse);
    });

    it('should return null on search API errors', async () => {
      const query = 'ERROR';
      
      mockedAxiosGet.mockRejectedValue(new Error('Search API Error'));

      const result = await nasdaqService.searchDatasets(query);
      expect(result).toBeNull();
    });
  });

  describe('getDataFreshness', () => {
    beforeEach(() => {
      nasdaqService = new NasdaqService(apiKey);
    });

    it('should return current date for data freshness', async () => {
      const result = await nasdaqService.getDataFreshness();
      expect(result).toBeInstanceOf(Date);
    });
  });
});
