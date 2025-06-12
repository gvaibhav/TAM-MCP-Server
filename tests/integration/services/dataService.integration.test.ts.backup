import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all individual data source services
vi.mock('../../../src/services/dataSources/alphaVantageService');
vi.mock('../../../src/services/dataSources/censusService');
vi.mock('../../../src/services/dataSources/fredService');
vi.mock('../../../src/services/dataSources/worldBankService');
vi.mock('../../../src/services/dataSources/blsService');
vi.mock('../../../src/services/dataSources/nasdaqDataService');
vi.mock('../../../src/services/dataSources/oecdService');
vi.mock('../../../src/services/dataSources/imfService');

import { DataService } from '../../../src/services/dataService';
import { AlphaVantageService } from '../../../src/services/dataSources/alphaVantageService';
import { CensusService } from '../../../src/services/dataSources/censusService';
import { FredService } from '../../../src/services/dataSources/fredService';
import { WorldBankService } from '../../../src/services/dataSources/worldBankService';
import { BlsService } from '../../../src/services/dataSources/blsService';
import { NasdaqDataService } from '../../../src/services/dataSources/nasdaqDataService';
import { OecdService } from '../../../src/services/dataSources/oecdService';
import { ImfService } from '../../../src/services/dataSources/imfService';

describe('DataService - Integration Tests', () => {
  let dataService: DataService;

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks for all service prototype methods that DataService might call
    const services = [
      AlphaVantageService, CensusService, FredService, WorldBankService,
      BlsService, NasdaqDataService, OecdService, ImfService
    ];

    services.forEach(service => {
      if (service.prototype.isAvailable) { // Check if method exists before mocking
        vi.mocked(service.prototype.isAvailable).mockResolvedValue(false);
      }
      if (service.prototype.fetchMarketSize) {
        vi.mocked(service.prototype.fetchMarketSize).mockResolvedValue(null);
      }
      if (service.prototype.fetchIndustryData) {
        vi.mocked(service.prototype.fetchIndustryData).mockResolvedValue(null);
      }
      // Add other common methods if DataService calls them directly in other untested logic
    });

    dataService = new DataService();
  });

  describe('getMarketSize', () => {
    it('should prioritize AlphaVantage for stock symbols', async () => {
      vi.mocked(AlphaVantageService.prototype.isAvailable).mockResolvedValue(true);
      const avData = { marketCapitalization: 1e12, symbol: 'AAPL', name: 'Apple Inc.' };
      vi.mocked(AlphaVantageService.prototype.fetchMarketSize).mockResolvedValue(avData);

      const result = await dataService.getMarketSize('AAPL', 'US');
      expect(result?.source).toBe('AlphaVantageService');
      expect(result?.value).toBe(1e12);
      expect(result?.details).toEqual(avData);
      expect(AlphaVantageService.prototype.fetchMarketSize).toHaveBeenCalledWith('AAPL', 'US');
    });

    it('should prioritize CensusService for NAICS codes if AlphaVantage fails/misses', async () => {
      // AlphaVantage might be tried first if "23" loosely matches symbol pattern, make it return null
      vi.mocked(AlphaVantageService.prototype.isAvailable).mockResolvedValue(true);
      vi.mocked(AlphaVantageService.prototype.fetchMarketSize).mockResolvedValue(null);

      vi.mocked(CensusService.prototype.isAvailable).mockResolvedValue(true);
      const censusData = { value: 50000, measure: 'EMP', naicsCode: '23', geography: 'state:01', year: '2021' };
      vi.mocked(CensusService.prototype.fetchMarketSize).mockResolvedValue(censusData);

      const result = await dataService.getMarketSize('23', 'state:01');
      expect(result?.source).toBe('CensusService');
      expect(result?.value).toBe(50000);
      expect(result?.details).toEqual(censusData);
      expect(CensusService.prototype.fetchMarketSize).toHaveBeenCalledWith('23', 'state:01', "EMP");
    });

    it('should fall back to FredService if symbol/NAICS checks dont apply or fail', async () => {
        // Ensure AV and Census mocks lead to fallback
        vi.mocked(AlphaVantageService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(AlphaVantageService.prototype.fetchMarketSize).mockResolvedValue(null);
        vi.mocked(CensusService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(CensusService.prototype.fetchMarketSize).mockResolvedValue(null);

        vi.mocked(FredService.prototype.isAvailable).mockResolvedValue(true);
        const fredObs = { date: '2023-01-01', value: 25000 };
        vi.mocked(FredService.prototype.fetchMarketSize).mockResolvedValue([fredObs]);

        const result = await dataService.getMarketSize('GDPSERIES', 'US'); // "GDPSERIES" doesn't match stock/NAICS
        expect(result?.source).toBe('FredService');
        expect(result?.value).toBe(25000);
        expect(FredService.prototype.fetchMarketSize).toHaveBeenCalledWith('GDPSERIES', 'US');
    });

     it('should fall back to WorldBankService if Fred also fails or doesnt apply', async () => {
        vi.mocked(AlphaVantageService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(AlphaVantageService.prototype.fetchMarketSize).mockResolvedValue(null);
        vi.mocked(CensusService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(CensusService.prototype.fetchMarketSize).mockResolvedValue(null);
        vi.mocked(FredService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(FredService.prototype.fetchMarketSize).mockResolvedValue(null);

        vi.mocked(WorldBankService.prototype.isAvailable).mockResolvedValue(true);
        const wbData = { date: '2022', value: 20e12, country: 'USA' };
        vi.mocked(WorldBankService.prototype.fetchMarketSize).mockResolvedValue([wbData]);

        const result = await dataService.getMarketSize('NY.GDP.MKTP.CD', 'US');
        expect(result?.source).toBe('WorldBankService');
        expect(result?.value).toBe(20e12);
        expect(WorldBankService.prototype.fetchMarketSize).toHaveBeenCalledWith('US', 'NY.GDP.MKTP.CD');
    });

    it('should fall back through multiple services and finally to mock if all fail', async () => {
        // All real services already default to unavailable / return null in beforeEach setup
        // So, just call with a mock key known to be in DataService's internal mockData
        const result = await dataService.getMarketSize('tech-ai', 'US');
        expect(result?.source).toBe('mock');
        expect(result?.value).toBe(328 * 1e9); // Value for tech-ai from mockIndustryData
    });

    it('should correctly fallback: AV returns null, Census returns data for NAICS', async () => {
      const industryIdNAICS = "31-33"; // A NAICS code pattern
      const region = "US";

      // AlphaVantage is tried first for generic IDs if pattern matches, make it return null
      vi.mocked(AlphaVantageService.prototype.isAvailable).mockResolvedValue(true);
      vi.mocked(AlphaVantageService.prototype.fetchMarketSize).mockResolvedValue(null);
      // console.log('AV MOCK:', AlphaVantageService.prototype.fetchMarketSize.getMockName(), vi.mocked(AlphaVantageService.prototype.fetchMarketSize).getMockImplementation() );


      // Census should be tried next for NAICS
      vi.mocked(CensusService.prototype.isAvailable).mockResolvedValue(true);
      const censusData = { value: 12345, measure: 'EMP', naicsCode: industryIdNAICS, geography: region, year: '2021' };
      vi.mocked(CensusService.prototype.fetchMarketSize).mockResolvedValue(censusData);

      const result = await dataService.getMarketSize(industryIdNAICS, region);

      expect(AlphaVantageService.prototype.fetchMarketSize).toHaveBeenCalledWith(industryIdNAICS, region);
      expect(CensusService.prototype.fetchMarketSize).toHaveBeenCalledWith(industryIdNAICS, region, "EMP");
      expect(result?.source).toBe('CensusService');
      expect(result?.value).toBe(12345);
      expect(result?.details).toEqual(censusData);
    });
  });

  describe('getSpecificDataSourceData', () => {
    it('should call the correct method on the specified service', async () => {
      vi.mocked(BlsService.prototype.isAvailable).mockResolvedValue(true);
      const blsSeriesData = { series: [{ seriesID: 'CES001', data: [] }] };
      vi.mocked(BlsService.prototype.fetchIndustryData).mockResolvedValue(blsSeriesData);
      const params = [['CES001'], '2022', '2023', false, false, false];

      const result = await dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', params);
      expect(result).toEqual(blsSeriesData);
      expect(BlsService.prototype.fetchIndustryData).toHaveBeenCalledWith(...params);
    });

    it('should throw error for invalid sourceName', async () => {
      await expect(dataService.getSpecificDataSourceData('NonExistentService', 'anyMethod', []))
        .rejects.toThrow('Data source "NonExistentService" not found.');
    });

    it('should throw error for invalid methodName', async () => {
      // Ensure BlsService itself is available for this check
      vi.mocked(BlsService.prototype.isAvailable).mockResolvedValue(true);
      await expect(dataService.getSpecificDataSourceData('BlsService', 'nonExistentMethod', []))
        .rejects.toThrow('Method "nonExistentMethod" not found on source "BlsService".');
    });

    it('should return null if specified service is unavailable', async () => {
      vi.mocked(BlsService.prototype.isAvailable).mockResolvedValue(false); // Specifically make it unavailable
      const result = await dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', []);
      expect(result).toBeNull();
      expect(BlsService.prototype.fetchIndustryData).not.toHaveBeenCalled();
    });

    it('should re-throw error from the underlying service method call', async () => {
        vi.mocked(BlsService.prototype.isAvailable).mockResolvedValue(true);
        vi.mocked(BlsService.prototype.fetchIndustryData).mockRejectedValue(new Error("BLS Internal Error"));
        await expect(dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', []))
            .rejects.toThrow("BLS Internal Error");
    });
  });
});
