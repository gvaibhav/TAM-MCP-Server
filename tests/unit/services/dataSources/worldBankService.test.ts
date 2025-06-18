import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { WorldBankService } from '../../../../src/services/datasources/WorldBankService.js';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('WorldBankService', () => {
  let worldBankService: WorldBankService;

  beforeEach(() => {
    vi.resetAllMocks();
    worldBankService = new WorldBankService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchMarketSize', () => {
    const industryId = 'technology';
    const region = 'us';

    it('should fetch market size data successfully', async () => {
      const mockApiResponse = [
        {},
        [
          {
            indicator: { value: 'Business Ease Index' },
            country: { value: 'United States' },
            date: '2023',
            value: 85.5
          }
        ]
      ];

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await worldBankService.fetchMarketSize(industryId, region);

      expect(result).toEqual({
        value: 85.5,
        year: '2023',
        country: 'United States',
        indicator: 'Business Ease Index',
        source: 'World Bank',
        dataset: 'IC.BUS.EASE.XQ'
      });

      expect(mockedAxiosGet).toHaveBeenCalledWith(
        'https://api.worldbank.org/v2/country/US/indicator/IC.BUS.EASE.XQ',
        {
          params: {
            format: 'json',
            date: 'MRV:5',
            per_page: 5
          }
        }
      );
    });

    it('should return null when no data is available', async () => {
      const mockApiResponse = [
        {},
        []
      ];

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await worldBankService.fetchMarketSize(industryId, region);

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      const result = await worldBankService.fetchMarketSize(industryId, region);

      expect(result).toBeNull();
    });

    it('should use world data when region is not specified', async () => {
      const mockApiResponse = [
        {},
        [
          {
            indicator: { value: 'Business Ease Index' },
            country: { value: 'World' },
            date: '2023',
            value: 75.2
          }
        ]
      ];

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await worldBankService.fetchMarketSize(industryId);

      expect(result).toEqual({
        value: 75.2,
        year: '2023',
        country: 'World',
        indicator: 'Business Ease Index',
        source: 'World Bank',
        dataset: 'IC.BUS.EASE.XQ'
      });

      expect(mockedAxiosGet).toHaveBeenCalledWith(
        'https://api.worldbank.org/v2/country/WLD/indicator/IC.BUS.EASE.XQ',
        expect.any(Object)
      );
    });
  });

  describe('getIndicatorData', () => {
    it('should fetch indicator data successfully', async () => {
      const countryCode = 'US';
      const indicatorCode = 'NY.GDP.MKTP.CD';
      const mockApiResponse = [
        {},
        [
          {
            indicator: { value: 'GDP (current US$)' },
            country: { value: 'United States' },
            date: '2023',
            value: 25000000000000
          }
        ]
      ];

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await worldBankService.getIndicatorData(countryCode, indicatorCode);

      expect(result).toEqual(mockApiResponse[1]);
      expect(mockedAxiosGet).toHaveBeenCalledWith(
        `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}`,
        {
          params: {
            format: 'json'
          }
        }
      );
    });
  });

  describe('searchIndicators', () => {
    it('should search and filter indicators', async () => {
      const searchQuery = 'GDP';
      const mockApiResponse = [
        {},
        [
          {
            id: 'NY.GDP.MKTP.CD',
            name: 'GDP (current US$)',
            topics: [{ value: 'Economy & Growth' }]
          },
          {
            id: 'NY.GDP.PCAP.CD', 
            name: 'GDP per capita (current US$)',
            topics: [{ value: 'Economy & Growth' }]
          },
          {
            id: 'SP.POP.TOTL',
            name: 'Population, total',
            topics: [{ value: 'Health' }]
          }
        ]
      ];

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await worldBankService.searchIndicators(searchQuery);

      expect(result).toHaveLength(2);
      expect(result[0].name).toContain('GDP');
      expect(result[1].name).toContain('GDP');
    });

    it('should return empty array on API error', async () => {
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      const result = await worldBankService.searchIndicators('test');

      expect(result).toEqual([]);
    });
  });

  describe('isAvailable', () => {
    it('should always return true (no API key required)', async () => {
      const result = await worldBankService.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('getDataFreshness', () => {
    it('should return current date when both parameters provided', async () => {
      const countryCode = 'US';
      const indicatorCode = 'NY.GDP.MKTP.CD';
      
      const result = await worldBankService.getDataFreshness(countryCode, indicatorCode);
      
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null when parameters missing', async () => {
      const result = await worldBankService.getDataFreshness();
      
      expect(result).toBeNull();
    });
  });

  describe('fetchIndustryData', () => {
    it('should throw not implemented error', async () => {
      await expect(worldBankService.fetchIndustryData('test')).rejects.toThrow(
        'WorldBankService.fetchIndustryData not yet implemented'
      );
    });
  });
});
