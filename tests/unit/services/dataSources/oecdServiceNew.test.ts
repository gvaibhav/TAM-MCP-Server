import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { OecdService } from '../../../../src/services/datasources/OecdService';
import { envTestUtils } from '../../../utils/envTestHelper';

vi.mock('axios');

const mockedAxiosGet = vi.mocked(axios.get);

describe('OecdService', () => {
  let oecdService: OecdService;

  beforeEach(() => {
    vi.resetAllMocks();
    envTestUtils.setup();
    oecdService = new OecdService();
  });

  afterEach(() => {
    envTestUtils.cleanup();
  });

  describe('constructor and isAvailable', () => {
    it('isAvailable should always be true (no API key required)', async () => {
      expect(await oecdService.isAvailable()).toBe(true);
    });
  });

  describe('fetchOecdDataset', () => {
    it('should fetch OECD dataset from API', async () => {
      const datasetId = 'GDP';
      const filterExpression = 'USA.CQRSA';
      const mockApiResponse = {
        dataSets: [{
          series: {
            '0:0': {
              observations: {
                '2023-Q1': [25462700000000],
                '2023-Q2': [25854600000000]
              }
            }
          }
        }],
        structure: {
          dimensions: {
            series: [
              {
                id: 'LOCATION',
                keyPosition: 0,
                values: [{ id: 'USA', name: 'United States' }]
              },
              {
                id: 'FREQUENCY',
                keyPosition: 1,
                values: [{ id: 'Q', name: 'Quarterly' }]
              }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchOecdDataset(datasetId, filterExpression);
      
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/GDP/USA.CQRSA', {
        params: { format: 'jsondata' }
      });
    });

    it('should fetch dataset without filter expression', async () => {
      const datasetId = 'GDP';
      const mockApiResponse = {
        dataSets: [{
          observations: {
            '0:0:2023': [25462700000000]
          }
        }],
        structure: {
          dimensions: {
            observation: [
              { id: 'LOCATION', values: [{ id: 'USA', name: 'United States' }] },
              { id: 'FREQUENCY', values: [{ id: 'A', name: 'Annual' }] },
              { id: 'TIME_PERIOD', role: 'time' }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchOecdDataset(datasetId);
      
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/GDP', {
        params: { format: 'jsondata' }
      });
    });

    it('should handle API errors and return null', async () => {
      const datasetId = 'INVALID';
      
      mockedAxiosGet.mockRejectedValue(new Error('Dataset not found'));

      const result = await oecdService.fetchOecdDataset(datasetId);
      expect(result).toBeNull();
    });

    it('should return null if no dataSets in response', async () => {
      const datasetId = 'GDP';
      const mockApiResponse = { dataSets: [] };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchOecdDataset(datasetId);
      expect(result).toBeNull();
    });

    it('should pass additional parameters to API call', async () => {
      const datasetId = 'GDP';
      const params = { startPeriod: '2020', endPeriod: '2023' };
      const mockApiResponse = {
        dataSets: [{
          observations: { '0:0:2023': [25462700000000] }
        }],
        structure: {
          dimensions: {
            observation: [
              { id: 'LOCATION', values: [{ id: 'USA', name: 'United States' }] }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      await oecdService.fetchOecdDataset(datasetId, undefined, params);
      
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/GDP', {
        params: { format: 'jsondata', startPeriod: '2020', endPeriod: '2023' }
      });
    });
  });

  describe('fetchMarketSize', () => {
    it('should fetch market size data and return latest value', async () => {
      const datasetId = 'GDP';
      const filterExpression = 'USA';
      const mockApiResponse = {
        dataSets: [{
          series: {
            '0:0': {
              observations: {
                '2022': [25462700000000],
                '2023': [26854600000000]
              }
            }
          }
        }],
        structure: {
          dimensions: {
            series: [
              {
                id: 'LOCATION',
                keyPosition: 0,
                values: [{ id: 'USA', name: 'United States' }]
              },
              {
                id: 'FREQUENCY',
                keyPosition: 1,
                values: [{ id: 'A', name: 'Annual' }]
              }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchMarketSize(datasetId, filterExpression);
      
      expect(result).toEqual({
        value: 26854600000000,
        time_period: '2023',
        dataset: 'GDP',
        source: 'OECD',
        record: expect.objectContaining({
          LOCATION: 'United States',
          FREQUENCY: 'Annual',
          TIME_PERIOD: '2023',
          value: 26854600000000
        })
      });
    });

    it('should return null if no data available', async () => {
      const datasetId = 'GDP';
      
      mockedAxiosGet.mockResolvedValue({ data: { dataSets: [] } });

      const result = await oecdService.fetchMarketSize(datasetId);
      expect(result).toBeNull();
    });

    it('should return null on API errors', async () => {
      const datasetId = 'GDP';
      
      mockedAxiosGet.mockRejectedValue(new Error('API Error'));

      const result = await oecdService.fetchMarketSize(datasetId);
      expect(result).toBeNull();
    });

    it('should call with latest period parameters', async () => {
      const datasetId = 'GDP';
      const filterExpression = 'USA';
      const mockApiResponse = {
        dataSets: [{
          observations: { '0:0:2023': [26854600000000] }
        }],
        structure: {
          dimensions: {
            observation: [
              { id: 'LOCATION', values: [{ id: 'USA', name: 'United States' }] }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      await oecdService.fetchMarketSize(datasetId, filterExpression);
      
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/GDP/USA', {
        params: {
          format: 'jsondata',
          startPeriod: 'latest',
          dimensionAtObservation: 'AllDimensions'
        }
      });
    });
  });

  describe('fetchIndustryData', () => {
    it('should fetch industry data by delegating to fetchOecdDataset', async () => {
      const datasetId = 'STAN_ARCHIVE';
      const filterExpression = 'AUS.ISIC4_D';
      const params = { startPeriod: '2020' };
      const mockApiResponse = {
        dataSets: [{
          observations: { '0:0:2023': [1000000] }
        }],
        structure: {
          dimensions: {
            observation: [
              { id: 'LOCATION', values: [{ id: 'AUS', name: 'Australia' }] }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchIndustryData(datasetId, filterExpression, params);
      
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/STAN_ARCHIVE/AUS.ISIC4_D', {
        params: { format: 'jsondata', startPeriod: '2020' }
      });
    });

    it('should handle missing filter expression', async () => {
      const datasetId = 'STAN_ARCHIVE';
      const params = { endPeriod: '2023' };
      const mockApiResponse = {
        dataSets: [{
          observations: { '0:0:2023': [1000000] }
        }],
        structure: {
          dimensions: {
            observation: [
              { id: 'LOCATION', values: [{ id: 'USA', name: 'United States' }] }
            ]
          }
        }
      };

      mockedAxiosGet.mockResolvedValue({ data: mockApiResponse });

      const result = await oecdService.fetchIndustryData(datasetId, undefined, params);
      
      expect(result).toBeTruthy();
      expect(mockedAxiosGet).toHaveBeenCalledWith('https://sdmx.oecd.org/public/rest/data/STAN_ARCHIVE', {
        params: { format: 'jsondata', endPeriod: '2023' }
      });
    });
  });

  describe('getDataFreshness', () => {
    it('should return current date as data freshness indicator', async () => {
      const result = await oecdService.getDataFreshness();
      expect(result).toBeInstanceOf(Date);
      // Should be recent (within last few seconds)
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - (result as Date).getTime());
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });
  });
});
