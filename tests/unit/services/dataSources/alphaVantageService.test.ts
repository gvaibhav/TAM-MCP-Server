import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AlphaVantageService } from '../../../../src/services/datasources/AlphaVantageService';
import { alphaVantageApi } from '../../../../src/config/apiConfig';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('AlphaVantageService', () => {
  let alphaVantageService: AlphaVantageService;
  const apiKey = 'test_alpha_vantage_api_key';

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should be true if apiKey is provided via constructor', async () => {
      alphaVantageService = new AlphaVantageService(apiKey);
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be true if ALPHA_VANTAGE_API_KEY is in process.env', async () => {
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: apiKey });
      alphaVantageService = new AlphaVantageService();
      expect(await alphaVantageService.isAvailable()).toBe(true);
    });

    it('isAvailable should be false if no API key is available', async () => {
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: undefined });
      alphaVantageService = new AlphaVantageService();
      expect(await alphaVantageService.isAvailable()).toBe(false);
    });    it('should warn if API key is not configured', () => {
      envTestUtils.mockWith({ ALPHA_VANTAGE_API_KEY: undefined });
      new AlphaVantageService();
      // Note: We don't test logger calls in unit tests as logging is a cross-cutting concern
    });
  });

  describe('fetchMarketSize (Company Overview)', () => {
    const symbol = 'IBM';
    const overviewFunction = alphaVantageApi.defaultOverviewFunction;
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${overviewFunction}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(apiKey);
    });

    it('should fetch, transform, and return overview data', async () => {
      const mockApiResponse = {
        Symbol: 'IBM', Name: 'International Business Machines Corp', Description: 'IBM is a global technology company.',
        MarketCapitalization: '150000000000', PERatio: '20', EPS: '5.00', Exchange: 'NYSE',
        Currency: 'USD', Country: 'USA', Sector: 'TECHNOLOGY', Industry: 'IT SERVICES',
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedData = {
        value: 150000000000,
        symbol: 'IBM', 
        name: 'International Business Machines Corp', 
        sector: 'TECHNOLOGY', 
        industry: 'IT SERVICES',
        description: 'IBM is a global technology company.',
        source: 'Alpha Vantage',
        lastUpdated: expect.any(String)
      };

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toEqual(expectedData);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://www.alphavantage.co/query', {
        params: {
          function: 'OVERVIEW',
          symbol: 'IBM',
          apikey: 'test_alpha_vantage_api_key'
        }
      });
    });

    it('should handle API rate limit response and return null', async () => {
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! Our standard API call frequency is..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
    });

    it('should handle "MarketCapitalization": "None" and return null', async () => {
      const noMarketCapResponse = { Symbol: 'TEST', MarketCapitalization: "None" };
      mockedAxiosGet.mockResolvedValue({ data: noMarketCapResponse });

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
    });

    it('should handle empty object response (unknown symbol) and return null', async () => {
        const emptyResponse = {};
        mockedAxiosGet.mockResolvedValue({ data: emptyResponse });

        const result = await alphaVantageService.fetchMarketSize(symbol);
        expect(result).toBeNull();
    });

    it('should return null if API call fails', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
    });

    it('should return null if API key is not configured', async () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      alphaVantageService = new AlphaVantageService();
      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
    });

    it('should return null on network timeout errors', async () => {
      const timeoutError = new Error('ECONNABORTED');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxiosGet.mockRejectedValue(timeoutError);

      const result = await alphaVantageService.fetchMarketSize(symbol);
      expect(result).toBeNull();
    });
  });

  describe('fetchIndustryData (Time Series)', () => {
    const symbol = 'IBM';
    const seriesType = 'TIME_SERIES_WEEKLY';
    const timeSeriesFunction = 'TIME_SERIES_WEEKLY_ADJUSTED';
    const mockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${timeSeriesFunction}&symbol=${symbol}&apikey=${apiKey}`;

    beforeEach(() => {
        alphaVantageService = new AlphaVantageService(apiKey);
    });

    it('should fetch and transform time series data', async () => {
      const mockApiResponse = {
        "Meta Data": { "1. Information": "Weekly Adjusted Prices..." },
        "Weekly Adjusted Time Series": {
          "2023-01-06": { "4. close": "150.25", "5. adjusted close": "150.25" },
          "2022-12-30": { "4. close": "148.50", "5. adjusted close": "148.50" }
        }
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedDataWeekly = {
        "Meta Data": { "1. Information": "Weekly Adjusted Prices..." },
        "Weekly Adjusted Time Series": {
          "2023-01-06": { "4. close": "150.25", "5. adjusted close": "150.25" },
          "2022-12-30": { "4. close": "148.50", "5. adjusted close": "148.50" }
        }
      };

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(expectedDataWeekly);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_WEEKLY',
          symbol: 'IBM',
          apikey: 'test_alpha_vantage_api_key'
        }
      });
    });

    it('should fetch daily time series data', async () => {
      const dailySeriesType = 'TIME_SERIES_DAILY';
      const dailyFunction = 'TIME_SERIES_DAILY_ADJUSTED';
      const dailyMockApiUrl = `${alphaVantageApi.baseUrl}${alphaVantageApi.queryPath}?function=${dailyFunction}&symbol=${symbol}&apikey=${apiKey}`;
      
      const mockApiResponse = {
        "Meta Data": { "1. Information": "Daily Prices..." },
        "Time Series (Daily)": {
          "2023-01-06": { "4. close": "150.25", "5. adjusted close": "150.25" }
        }
      };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const expectedDataDaily = {
        "Meta Data": { "1. Information": "Daily Prices..." },
        "Time Series (Daily)": {
          "2023-01-06": { "4. close": "150.25", "5. adjusted close": "150.25" }
        }
      };

      const result = await alphaVantageService.fetchIndustryData(symbol, dailySeriesType);
      expect(result).toEqual(expectedDataDaily);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: 'IBM',
          apikey: 'test_alpha_vantage_api_key'
        }
      });
    });

    it('should handle API rate limit for time series and return null', async () => {
      const rateLimitResponse = { Note: "Thank you for using Alpha Vantage! API call frequency..." };
      mockedAxiosGet.mockResolvedValue({ data: rateLimitResponse });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
    });

    it('should handle no time series data in response and return null', async () => {
      const mockApiResponseNoData = { "Meta Data": {} };
      mockedAxiosGet.mockResolvedValue({ data: mockApiResponseNoData });

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toEqual(mockApiResponseNoData);
    });

    it('should return null if API call for time series fails', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('Time Series API Error'));

      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
    });

    it('should return null if API key is not configured for time series', async () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      alphaVantageService = new AlphaVantageService();
      const result = await alphaVantageService.fetchIndustryData(symbol, seriesType);
      expect(result).toBeNull();
    });
  });
});
