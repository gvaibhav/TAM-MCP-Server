import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock all individual data source services
vi.mock('../../../../src/services/dataSources/alphaVantageService');
vi.mock('../../../../src/services/dataSources/censusService');
vi.mock('../../../../src/services/dataSources/fredService');
vi.mock('../../../../src/services/dataSources/worldBankService');
vi.mock('../../../../src/services/dataSources/blsService');
vi.mock('../../../../src/services/dataSources/nasdaqDataService');
vi.mock('../../../../src/services/dataSources/oecdService');
vi.mock('../../../../src/services/dataSources/imfService');

import { DataService } from '../../../../src/services/dataService';
import { AlphaVantageService } from '../../../../src/services/dataSources/alphaVantageService';
import { CensusService } from '../../../../src/services/dataSources/censusService';
import { FredService } from '../../../../src/services/dataSources/fredService';
import { WorldBankService } from '../../../../src/services/dataSources/worldBankService';
import { BlsService } from '../../../../src/services/dataSources/blsService';
import { NasdaqDataService } from '../../../../src/services/dataSources/nasdaqDataService';
import { OecdService } from '../../../../src/services/dataSources/oecdService';
import { ImfService } from '../../../../src/services/dataSources/imfService';


// Get typed mocks
const MockedAlphaVantageService = AlphaVantageService as jest.MockedClass<typeof AlphaVantageService>;
const MockedCensusService = CensusService as jest.MockedClass<typeof CensusService>;
const MockedFredService = FredService as jest.MockedClass<typeof FredService>;
const MockedWorldBankService = WorldBankService as jest.MockedClass<typeof WorldBankService>;
const MockedBlsService = BlsService as jest.MockedClass<typeof BlsService>;
const MockedNasdaqDataService = NasdaqDataService as jest.MockedClass<typeof NasdaqDataService>;
const MockedOecdService = OecdService as jest.MockedClass<typeof OecdService>;
const MockedImfService = ImfService as jest.MockedClass<typeof ImfService>;


describe('DataService - Integration Tests', () => {
  let dataService: DataService;
  // Mock instances that will be created by DataService constructor
  let mockAlphaVantageInstance: jest.Mocked<AlphaVantageService>;
  let mockCensusInstance: jest.Mocked<CensusService>;
  let mockFredInstance: jest.Mocked<FredService>;
  let mockWorldBankInstance: jest.Mocked<WorldBankService>;
  let mockBlsInstance: jest.Mocked<BlsService>;
  let mockNasdaqInstance: jest.Mocked<NasdaqDataService>;
  let mockOecdInstance: jest.Mocked<OecdService>;
  let mockImfInstance: jest.Mocked<ImfService>;


  beforeEach(() => {
    // Reset mocks and their calls/instances before each test
    MockedAlphaVantageService.mockClear();
    MockedCensusService.mockClear();
    MockedFredService.mockClear();
    MockedWorldBankService.mockClear();
    MockedBlsService.mockClear();
    MockedNasdaqDataService.mockClear();
    MockedOecdService.mockClear();
    MockedImfService.mockClear();

    dataService = new DataService(); // This will use the mocked constructors

    // Retrieve the mock instances created by the DataService constructor
    mockAlphaVantageInstance = MockedAlphaVantageService.mock.instances[0] as jest.Mocked<AlphaVantageService>;
    mockCensusInstance = MockedCensusService.mock.instances[0] as jest.Mocked<CensusService>;
    mockFredInstance = MockedFredService.mock.instances[0] as jest.Mocked<FredService>;
    mockWorldBankInstance = MockedWorldBankService.mock.instances[0] as jest.Mocked<WorldBankService>;
    mockBlsInstance = MockedBlsService.mock.instances[0] as jest.Mocked<BlsService>;
    mockNasdaqInstance = MockedNasdaqDataService.mock.instances[0] as jest.Mocked<NasdaqDataService>;
    mockOecdInstance = MockedOecdService.mock.instances[0] as jest.Mocked<OecdService>;
    mockImfInstance = MockedImfService.mock.instances[0] as jest.Mocked<ImfService>;
  });

  describe('getMarketSize', () => {
    it('should prioritize AlphaVantage for stock symbols', async () => {
      mockAlphaVantageInstance.isAvailable.mockResolvedValue(true);
      const avData = { marketCapitalization: 1e12, symbol: 'AAPL', name: 'Apple Inc.' };
      mockAlphaVantageInstance.fetchMarketSize.mockResolvedValue(avData);

      // Mock other services to ensure AV is chosen
      mockCensusInstance.isAvailable.mockResolvedValue(false);
      mockFredInstance.isAvailable.mockResolvedValue(false);
      mockWorldBankInstance.isAvailable.mockResolvedValue(false);


      const result = await dataService.getMarketSize('AAPL', 'US');
      expect(result?.source).toBe('AlphaVantageService');
      expect(result?.value).toBe(1e12);
      expect(result?.details).toEqual(avData);
      expect(mockAlphaVantageInstance.fetchMarketSize).toHaveBeenCalledWith('AAPL', 'US');
    });

    it('should prioritize CensusService for NAICS codes', async () => {
      mockAlphaVantageInstance.isAvailable.mockResolvedValue(true); // Assume AV might be checked first
      mockAlphaVantageInstance.fetchMarketSize.mockResolvedValue(null); // but returns no data for "23"

      mockCensusInstance.isAvailable.mockResolvedValue(true);
      const censusData = { value: 50000, measure: 'EMP', naicsCode: '23', geography: 'state:01', year: '2021' };
      mockCensusInstance.fetchMarketSize.mockResolvedValue(censusData);

      mockFredInstance.isAvailable.mockResolvedValue(false);
      mockWorldBankInstance.isAvailable.mockResolvedValue(false);


      const result = await dataService.getMarketSize('23', 'state:01');
      expect(result?.source).toBe('CensusService');
      expect(result?.value).toBe(50000);
      expect(result?.details).toEqual(censusData);
      expect(mockCensusInstance.fetchMarketSize).toHaveBeenCalledWith('23', 'state:01', "EMP");
    });

    it('should fall back to FredService if symbol/NAICS checks dont apply or fail', async () => {
        // industryId "GDPSERIES" does not match stock symbol or NAICS pattern
        mockAlphaVantageInstance.isAvailable.mockResolvedValue(true);
        mockAlphaVantageInstance.fetchMarketSize.mockResolvedValue(null);
        mockCensusInstance.isAvailable.mockResolvedValue(true);
        mockCensusInstance.fetchMarketSize.mockResolvedValue(null);

        mockFredInstance.isAvailable.mockResolvedValue(true);
        const fredObs = { date: '2023-01-01', value: 25000 };
        mockFredInstance.fetchMarketSize.mockResolvedValue([fredObs]);

        const result = await dataService.getMarketSize('GDPSERIES', 'US');
        expect(result?.source).toBe('FredService');
        expect(result?.value).toBe(25000);
        expect(mockFredInstance.fetchMarketSize).toHaveBeenCalledWith('GDPSERIES', 'US');
    });

     it('should fall back to WorldBankService if Fred also fails or doesnt apply', async () => {
        mockAlphaVantageInstance.isAvailable.mockResolvedValue(true);
        mockAlphaVantageInstance.fetchMarketSize.mockResolvedValue(null);
        mockCensusInstance.isAvailable.mockResolvedValue(true);
        mockCensusInstance.fetchMarketSize.mockResolvedValue(null);
        mockFredInstance.isAvailable.mockResolvedValue(true);
        mockFredInstance.fetchMarketSize.mockResolvedValue(null);

        mockWorldBankInstance.isAvailable.mockResolvedValue(true);
        const wbData = { date: '2022', value: 20e12, country: 'USA' };
        mockWorldBankInstance.fetchMarketSize.mockResolvedValue([wbData]);


        const result = await dataService.getMarketSize('NY.GDP.MKTP.CD', 'US');
        expect(result?.source).toBe('WorldBankService');
        expect(result?.value).toBe(20e12);
        expect(mockWorldBankInstance.fetchMarketSize).toHaveBeenCalledWith('US', 'NY.GDP.MKTP.CD');
    });

    it('should fall back through multiple services and finally to mock if all fail', async () => {
        mockAlphaVantageInstance.isAvailable.mockResolvedValue(true);
        mockAlphaVantageInstance.fetchMarketSize.mockResolvedValue(null);

        mockCensusInstance.isAvailable.mockResolvedValue(true);
        mockCensusInstance.fetchMarketSize.mockResolvedValue(null);

        mockFredInstance.isAvailable.mockResolvedValue(true);
        mockFredInstance.fetchMarketSize.mockResolvedValue(null);

        mockWorldBankInstance.isAvailable.mockResolvedValue(true);
        mockWorldBankInstance.fetchMarketSize.mockResolvedValue(null);

        const result = await dataService.getMarketSize('tech-software', 'US'); // 'tech-software' is a mock key
        expect(result?.source).toBe('mock');
        expect(result?.value).toBe(659 * 1e9);
    });
  });

  describe('getSpecificDataSourceData', () => {
    it('should call the correct method on the specified service', async () => {
      mockBlsInstance.isAvailable.mockResolvedValue(true);
      const blsSeriesData = { series: [{ seriesID: 'CES001', data: [] }] };
      mockBlsInstance.fetchIndustryData.mockResolvedValue(blsSeriesData);
      const params = [['CES001'], '2022', '2023', false, false, false]; // Matched BlsService.fetchIndustryData signature

      const result = await dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', params);
      expect(result).toEqual(blsSeriesData);
      expect(mockBlsInstance.fetchIndustryData).toHaveBeenCalledWith(...params);
    });

    it('should throw error for invalid sourceName', async () => {
      await expect(dataService.getSpecificDataSourceData('NonExistentService', 'anyMethod', []))
        .rejects.toThrow('Data source "NonExistentService" not found.');
    });

    it('should throw error for invalid methodName', async () => {
      await expect(dataService.getSpecificDataSourceData('BlsService', 'nonExistentMethod', []))
        .rejects.toThrow('Method "nonExistentMethod" not found on source "BlsService".');
    });

    it('should return null if specified service is unavailable', async () => {
      mockBlsInstance.isAvailable.mockResolvedValue(false);
      const result = await dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', []);
      expect(result).toBeNull();
      expect(mockBlsInstance.fetchIndustryData).not.toHaveBeenCalled();
    });

    it('should re-throw error from the underlying service method call', async () => {
        mockBlsInstance.isAvailable.mockResolvedValue(true);
        mockBlsInstance.fetchIndustryData.mockRejectedValue(new Error("BLS Internal Error"));
        await expect(dataService.getSpecificDataSourceData('BlsService', 'fetchIndustryData', []))
            .rejects.toThrow("BLS Internal Error");
    });
  });
});
