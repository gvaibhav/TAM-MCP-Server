import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DataService at the top
vi.mock('../../../src/services/DataService');

import { MarketAnalysisTools } from '../../../src/tools/market-tools';
import { DataService } from '../../../src/services/DataService';
import { APIResponse, TAMCalculatorSchema, MarketSizeSchema } from '../../../src/types';
import { z } from "zod";
// Utils are not mocked for tool integration tests, tools use them directly
import { formatCurrency, formatPercentage } from '../../../src/utils';


// Define helper schemas locally as they were in the Jest version for test clarity
// These would ideally be imported if they were formalized in src/types/index.ts
const ExtendedIndustryDataSchema = z.object({
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

  let mockDataService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a proper mock DataService instance
    mockDataService = {
      getIndustryById: vi.fn().mockResolvedValue({
        id: 'mockIndustry', name: 'Mock Industry', defaultRegion: 'US',
        description: 'A mock industry for testing.',
        naicsCode: '511210', sicCode: '7372',
        keyMetrics: { marketSize: 1e9, growthRate: 0.05, cagr: 0.04, volatility: 0.1 },
        source: 'mock-details', lastUpdated: new Date().toISOString()
      }),
      getMarketSize: vi.fn().mockResolvedValue({
        value: 1.2e9, source: 'mock-size', details: { year: 2023, region: 'US', methodology: 'Mocked size' }
      }),
      getSpecificDataSourceData: vi.fn().mockResolvedValue({ some: 'specific_data_default' }),
      searchIndustries: vi.fn().mockResolvedValue([]),
      generateMarketForecast: vi.fn().mockResolvedValue([]),
      getSupportedCurrencies: vi.fn().mockResolvedValue(['USD', 'EUR']),
      getMarketOpportunities: vi.fn().mockResolvedValue({
        opportunities: [{id: 'opp_mock', title: 'Mock Opp', marketSize: 100000, competitiveIntensity: 'low', barrierToEntry: 'low', growthPotential: 0.1, timeToMarket: '6m'}],
        source: 'mock-opps'
      })
    };

    // Mock the static getter to return our mock instance
    vi.spyOn(MarketAnalysisTools, 'dataService', 'get').mockReturnValue(mockDataService);
  });

  describe('industryData tool', () => {
    it('should call getIndustryById and getMarketSize for basic query', async () => {
      const params = { industryId: 'tech', region: 'US', includeMetrics: true };
      // Use the locally defined ExtendedIndustryDataSchema for type inference if desired, or cast
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;

      const response = await MarketAnalysisTools.industryData(typedParams);

      expect(mockDataService.getIndustryById).toHaveBeenCalledWith('tech');
      expect(mockDataService.getMarketSize).toHaveBeenCalledWith('tech', 'US');
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe('mockIndustry');
      expect(response.data?.metrics).toBeDefined();
    });

    it('should call getSpecificDataSourceData when specific params are provided', async () => {
      const specificDataPayload = { blsField: 'blsValueFromToolTest' };
      mockDataService.getSpecificDataSourceData.mockResolvedValue(specificDataPayload);

      const params = {
        industryId: 'tech',
        region: 'US',
        specificDataSourceName: 'BlsService',
        specificDataSourceMethod: 'fetchIndustryData',
        specificDataSourceParams: [['CES001'], '2023']
      };
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;
      const response = await MarketAnalysisTools.industryData(typedParams);

      expect(mockDataService.getSpecificDataSourceData).toHaveBeenCalledWith(
        'BlsService', 'fetchIndustryData', [['CES001'], '2023']
      );
      expect(response.data?.detailedSourceData).toEqual(specificDataPayload);
    });

    it('should handle errors from getSpecificDataSourceData gracefully', async () => {
      const params = {
        industryId: 'tech',
        region: 'US',
        specificDataSourceName: 'BlsService',
        specificDataSourceMethod: 'fetchIndustryData',
        specificDataSourceParams: [['CES001']]
      };
      mockDataService.getSpecificDataSourceData.mockRejectedValue(new Error("Specific source error"));
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;

      const response = await MarketAnalysisTools.industryData(typedParams);
      expect(response.success).toBe(true);
      expect(response.data?.detailedSourceData).toEqual(
        { error: 'Failed to fetch from BlsService: Specific source error' }
      );
    });
  });

  describe('generic_data_query tool', () => {
    it('should call dataService.getSpecificDataSourceData and return its result', async () => {
      const censusMockData = [{ EMP: 123, state: '01' }];
      mockDataService.getSpecificDataSourceData.mockResolvedValue(censusMockData);

      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'CensusService',
        dataSourceMethod: 'fetchIndustryData',
        dataSourceParams: ['EMP', 'state:01', { NAICS2017: "23" }]
      };
      const response = await MarketAnalysisTools.genericDataQuery(queryParams);

      expect(mockDataService.getSpecificDataSourceData).toHaveBeenCalledWith(
        'CensusService', 'fetchIndustryData', ['EMP', 'state:01', { NAICS2017: "23" }]
      );
      expect(response.success).toBe(true);
      expect(response.data?.data).toEqual(censusMockData);
      expect(response.metadata?.source).toBe('CensusService');
    });

    it('should return a structured error if getSpecificDataSourceData fails', async () => {
      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'OecdService',
        dataSourceMethod: 'fetchOecdDataset',
        dataSourceParams: ['QNA', 'AUS.GDP.Q']
      };
      mockDataService.getSpecificDataSourceData.mockRejectedValue(new Error("OECD API unavailable"));

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Error from OecdService.fetchOecdDataset: OECD API unavailable');
    });

     it('should handle null response from getSpecificDataSourceData as no data', async () => {
      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'ImfService',
        dataSourceMethod: 'fetchImfDataset',
        dataSourceParams: ['IFS', 'A.US.NODATA']
      };
      mockDataService.getSpecificDataSourceData.mockResolvedValue(null);

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(true);
      expect(response.data?.data).toBeNull();
      expect(response.data?.message).toContain('No data returned');
    });
  });

  describe('marketSize tool', () => {
    it('should correctly process data from dataService.getMarketSize', async () => {
        const marketDataPayload = { value: 2e12, source: 'AlphaVantageService', details: { symbol: 'MSFT', year: 2023, region: 'US' } };
        mockDataService.getMarketSize.mockResolvedValue(marketDataPayload);

        const params: z.infer<typeof MarketSizeSchema> = { industryId: 'MSFT', region: 'US', currency: 'USD' };
        const response = await MarketAnalysisTools.marketSize(params);

        expect(mockDataService.getMarketSize).toHaveBeenCalledWith('MSFT', 'US');
        expect(response.success).toBe(true);
        expect(response.data?.industry).toBe('MSFT');
        expect(response.data?.marketSize.value).toBe(2e12);
        expect(response.data?.dataSource).toBe('AlphaVantageService');
    });
  });

  describe('tamCalculator tool', () => {
    it('should use market value from getMarketSize', async () => {
        mockDataService.getIndustryById.mockResolvedValue({
            id: 'tech-software', name: 'Software Technology', keyMetrics: { growthRate: 0.1 }, source: 'mock'
        });
        const marketDataPayload = { value: 500e9, source: 'CensusService', details: { naics: '511210', year: '2021' }};
        mockDataService.getMarketSize.mockResolvedValue(marketDataPayload);

        const params: z.infer<typeof TAMCalculatorSchema> = { industryId: 'tech-software', region: 'US', includeScenarios: true };
        const response = await MarketAnalysisTools.tamCalculator(params);

        expect(mockDataService.getMarketSize).toHaveBeenCalledWith('tech-software', 'US');
        expect(response.success).toBe(true);
        expect(response.data?.totalAddressableMarket).toBe(500e9);
        expect(response.data?.methodology).toContain('CensusService');
    });

    it('should return Zod validation error for invalid params in tamCalculator', async () => {
      // Missing industryId, which is required by TAMCalculatorSchema
      const invalidParams = { region: 'US', population: 100000 };
      const response = await MarketAnalysisTools.tamCalculator(invalidParams as any); // Cast as any to bypass TS error for test

      expect(response.success).toBe(false);
      // Check either error.message (object) or error (string) formats
      const errorMessage = (response.error as any)?.message || response.error;
      expect(errorMessage).toContain('Required'); // Check for Zod validation message
    });
  });
});
