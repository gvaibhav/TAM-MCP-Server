jest.mock('../../../../src/services/dataService'); // Mock DataService at the top

import { MarketAnalysisTools } from '../../../../src/tools/market-tools';
import { DataService } from '../../../../src/services/dataService';
import { APIResponse } from '../../../../src/types'; // Assuming this type exists
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from "zod";


// Get the prototype to mock its methods, so MarketAnalysisTools.dataService (static instance) uses these mocks
const MockedDataServicePrototype = DataService.prototype as jest.Mocked<DataService>;

// Define schemas used by tools if not directly importable or for clarity in tests
const ExtendedIndustryDataSchema = z.object({ // Simplified for test reference
  industryId: z.string(),
  region: z.string().optional(),
  includeMetrics: z.boolean().optional(),
  specificDataSourceName: z.string().optional(),
  specificDataSourceMethod: z.string().optional(),
  specificDataSourceParams: z.array(z.any()).optional()
});
const GenericDataQuerySchema = z.object({
  dataSourceName: z.string(),
  dataSourceMethod: z.string(),
  dataSourceParams: z.array(z.any())
});


describe('MarketAnalysisTools - Integration Tests', () => {

  beforeEach(() => {
    // Reset all method mocks on the prototype before each test
    // This ensures that MarketAnalysisTools.dataService (which is a single static instance using the mocked DataService)
    // has fresh mocks for its methods for each test.
    jest.clearAllMocks(); // Clears all mocks, including constructor calls for DataService if needed

    // Default mocks for common DataService methods
    // These will apply to MarketAnalysisTools.dataService because its 'new DataService()' uses the mocked class
    MockedDataServicePrototype.getIndustryById = jest.fn().mockResolvedValue({
        id: 'mockIndustry', name: 'Mock Industry', defaultRegion: 'US',
        description: 'A mock industry for testing.',
        naicsCode: '511210', sicCode: '7372',
        keyMetrics: { marketSize: 1e9, growthRate: 0.05, cagr: 0.04, volatility: 0.1 },
        source: 'mock-details', lastUpdated: new Date().toISOString()
    });
    MockedDataServicePrototype.getMarketSize = jest.fn().mockResolvedValue({
        value: 1.2e9, source: 'mock-size', details: { year: 2023, region: 'US', methodology: 'Mocked size' }
    });
    MockedDataServicePrototype.getSpecificDataSourceData = jest.fn().mockResolvedValue({ some: 'specific_data' });
    MockedDataServicePrototype.searchIndustries = jest.fn().mockResolvedValue([]);
    MockedDataServicePrototype.generateMarketForecast = jest.fn().mockResolvedValue([]);
    MockedDataServicePrototype.getSupportedCurrencies = jest.fn().mockResolvedValue(['USD', 'EUR']);
    MockedDataServicePrototype.getMarketOpportunities = jest.fn().mockResolvedValue({ opportunities: [{id: 'opp_mock', title: 'Mock Opp'}], source: 'mock-opps'});

  });

  describe('industryData tool', () => {
    it('should call getIndustryById and getMarketSize for basic query', async () => {
      const params = { industryId: 'tech', region: 'US', includeMetrics: true };
      const response = await MarketAnalysisTools.industryData(params as any);

      expect(MockedDataServicePrototype.getIndustryById).toHaveBeenCalledWith('tech');
      expect(MockedDataServicePrototype.getMarketSize).toHaveBeenCalledWith('tech', 'US');
      expect(response.success).toBe(true);
      expect(response.content.id).toBe('mockIndustry');
      expect(response.content.metrics.regionalDataSource).toBe('mock-size');
    });

    it('should call getSpecificDataSourceData when specific params are provided', async () => {
      const params = {
        industryId: 'tech',
        region: 'US',
        specificDataSourceName: 'BlsService',
        specificDataSourceMethod: 'fetchIndustryData',
        specificDataSourceParams: [['CES001'], '2023']
      };
      const specificDataPayload = { blsField: 'blsValue' };
      MockedDataServicePrototype.getSpecificDataSourceData.mockResolvedValue(specificDataPayload);

      const response = await MarketAnalysisTools.industryData(params as any);
      expect(MockedDataServicePrototype.getSpecificDataSourceData).toHaveBeenCalledWith(
        'BlsService', 'fetchIndustryData', [['CES001'], '2023']
      );
      expect(response.success).toBe(true);
      expect(response.content.detailedSourceData).toEqual(specificDataPayload);
    });

    it('should handle errors from getSpecificDataSourceData gracefully', async () => {
      const params = {
        industryId: 'tech',
        region: 'US',
        specificDataSourceName: 'BlsService',
        specificDataSourceMethod: 'fetchIndustryData',
        specificDataSourceParams: [['CES001']]
      };
      MockedDataServicePrototype.getSpecificDataSourceData.mockRejectedValue(new Error("Specific source error"));

      const response = await MarketAnalysisTools.industryData(params as any);
      expect(response.success).toBe(true);
      expect(response.content.detailedSourceData).toEqual(
        { error: 'Failed to fetch from BlsService: Specific source error' }
      );
    });
  });

  describe('generic_data_query tool', () => {
    it('should call dataService.getSpecificDataSourceData and return its result', async () => {
      const queryParams = {
        dataSourceName: 'CensusService',
        dataSourceMethod: 'fetchIndustryData',
        dataSourceParams: ['EMP', 'state:01', { NAICS2017: "23" }]
      };
      const censusMockData = [{ EMP: 123, state: '01' }];
      MockedDataServicePrototype.getSpecificDataSourceData.mockResolvedValue(censusMockData);

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(MockedDataServicePrototype.getSpecificDataSourceData).toHaveBeenCalledWith(
        'CensusService', 'fetchIndustryData', ['EMP', 'state:01', { NAICS2017: "23" }]
      );
      expect(response.success).toBe(true);
      expect(response.content.data).toEqual(censusMockData);
      expect(response.metadata?.source).toBe('CensusService');
    });

    it('should return a structured error if getSpecificDataSourceData fails', async () => {
      const queryParams = {
        dataSourceName: 'OecdService',
        dataSourceMethod: 'fetchOecdDataset',
        dataSourceParams: ['QNA', 'AUS.GDP.Q']
      };
      MockedDataServicePrototype.getSpecificDataSourceData.mockRejectedValue(new Error("OECD API unavailable"));

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(false);
      // The error message is now prefixed by the tool's own error handling context
      expect(response.error?.message).toContain('Error from OecdService.fetchOecdDataset: OECD API unavailable');
      expect(response.error?.code).toBe('generic_data_query_error');
    });
     it('should handle null response from getSpecificDataSourceData as no data', async () => {
      const queryParams = {
        dataSourceName: 'ImfService',
        dataSourceMethod: 'fetchImfDataset',
        dataSourceParams: ['IFS', 'A.US.NODATA']
      };
      MockedDataServicePrototype.getSpecificDataSourceData.mockResolvedValue(null);

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(true);
      expect(response.content.data).toBeNull();
      expect(response.content.message).toContain('No data returned');
    });
  });

  describe('marketSize tool', () => {
    it('should correctly process data from dataService.getMarketSize', async () => {
        const marketDataPayload = { value: 2e12, source: 'AlphaVantageService', details: { symbol: 'MSFT', year: 2023, region: 'US' } };
        MockedDataServicePrototype.getMarketSize.mockResolvedValue(marketDataPayload);

        const params = { industryId: 'MSFT', region: 'US', currency: 'USD' };
        const response = await MarketAnalysisTools.marketSize(params);

        expect(MockedDataServicePrototype.getMarketSize).toHaveBeenCalledWith('MSFT', 'US');
        expect(response.success).toBe(true);
        expect(response.content.industry).toBe('MSFT');
        expect(response.content.marketSize.value).toBe(2e12);
        expect(response.content.dataSource).toBe('AlphaVantageService');
    });
  });

  describe('tamCalculator tool', () => {
    it('should use market value from getMarketSize', async () => {
        MockedDataServicePrototype.getIndustryById.mockResolvedValue({
            id: 'tech-software', name: 'Software Technology', keyMetrics: { growthRate: 0.1 }, source: 'mock'
        });
        const marketDataPayload = { value: 500e9, source: 'CensusService', details: { naics: '511210', year: '2021' }};
        MockedDataServicePrototype.getMarketSize.mockResolvedValue(marketDataPayload);

        const params = { industryId: 'tech-software', region: 'US' };
        const response = await MarketAnalysisTools.tamCalculator(params);

        expect(MockedDataServicePrototype.getMarketSize).toHaveBeenCalledWith('tech-software', 'US');
        expect(response.success).toBe(true);
        expect(response.content.totalAddressableMarket).toBe(500e9);
        expect(response.content.methodology).toContain('CensusService');
    });
  });
});
