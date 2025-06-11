import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DataService at the top
vi.mock('../../../../src/services/dataService');

import { MarketAnalysisTools } from '../../../../src/tools/market-tools';
import { DataService } from '../../../../src/services/dataService';
import { APIResponse } from '../../../../src/types';
import { z } from "zod";
// Utils are not mocked for tool integration tests, tools use them directly
import { formatCurrency, formatPercentage } from '../../../../src/utils';


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
const MarketSizeSchema = z.object({ // For marketSize tool param typing
    industryId: z.string(),
    region: z.string(),
    year: z.number().optional(),
    currency: z.string().optional().default('USD')
});
const TAMCalculatorSchema = z.object({ // For tamCalculator tool param typing
    industryId: z.string(),
    region: z.string(),
    population: z.number().optional(),
    penetrationRate: z.number().optional(),
    averageSpending: z.number().optional(),
    includeScenarios: z.boolean().optional(),
});


describe('MarketAnalysisTools - Integration Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations for methods on MarketAnalysisTools.dataService
    // This instance IS the mocked DataService instance because of vi.mock above.
    // Its methods are already vi.fn(), so we can use vi.mocked() to type them and set behavior.
    vi.mocked(MarketAnalysisTools.dataService.getIndustryById).mockResolvedValue({
        id: 'mockIndustry', name: 'Mock Industry', defaultRegion: 'US',
        description: 'A mock industry for testing.',
        naicsCode: '511210', sicCode: '7372',
        keyMetrics: { marketSize: 1e9, growthRate: 0.05, cagr: 0.04, volatility: 0.1 },
        source: 'mock-details', lastUpdated: new Date().toISOString()
    });
    vi.mocked(MarketAnalysisTools.dataService.getMarketSize).mockResolvedValue({
        value: 1.2e9, source: 'mock-size', details: { year: 2023, region: 'US', methodology: 'Mocked size' }
    });
    vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockResolvedValue({ some: 'specific_data_default' });
    vi.mocked(MarketAnalysisTools.dataService.searchIndustries).mockResolvedValue([]);
    vi.mocked(MarketAnalysisTools.dataService.generateMarketForecast).mockResolvedValue([]);
    vi.mocked(MarketAnalysisTools.dataService.getSupportedCurrencies).mockResolvedValue(['USD', 'EUR']);
    vi.mocked(MarketAnalysisTools.dataService.getMarketOpportunities).mockResolvedValue({
        opportunities: [{id: 'opp_mock', title: 'Mock Opp', marketSize: 100000, competitiveIntensity: 'low', barrierToEntry: 'low', growthPotential: 0.1, timeToMarket: '6m'}],
        source: 'mock-opps'
    });
  });

  describe('industryData tool', () => {
    it('should call getIndustryById and getMarketSize for basic query', async () => {
      const params = { industryId: 'tech', region: 'US', includeMetrics: true };
      // Use the locally defined ExtendedIndustryDataSchema for type inference if desired, or cast
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;

      const response = await MarketAnalysisTools.industryData(typedParams);

      expect(MarketAnalysisTools.dataService.getIndustryById).toHaveBeenCalledWith('tech');
      expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('tech', 'US');
      expect(response.success).toBe(true);
      expect(response.content.id).toBe('mockIndustry');
      expect(response.content.metrics.regionalDataSource).toBe('mock-size');
    });

    it('should call getSpecificDataSourceData when specific params are provided', async () => {
      const specificDataPayload = { blsField: 'blsValueFromToolTest' };
      vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockResolvedValue(specificDataPayload);

      const params = {
        industryId: 'tech',
        region: 'US',
        specificDataSourceName: 'BlsService',
        specificDataSourceMethod: 'fetchIndustryData',
        specificDataSourceParams: [['CES001'], '2023']
      };
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;
      const response = await MarketAnalysisTools.industryData(typedParams);

      expect(MarketAnalysisTools.dataService.getSpecificDataSourceData).toHaveBeenCalledWith(
        'BlsService', 'fetchIndustryData', [['CES001'], '2023']
      );
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
      vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockRejectedValue(new Error("Specific source error"));
      const typedParams = params as z.infer<typeof ExtendedIndustryDataSchema>;

      const response = await MarketAnalysisTools.industryData(typedParams);
      expect(response.success).toBe(true);
      expect(response.content.detailedSourceData).toEqual(
        { error: 'Failed to fetch from BlsService: Specific source error' }
      );
    });
  });

  describe('generic_data_query tool', () => {
    it('should call dataService.getSpecificDataSourceData and return its result', async () => {
      const censusMockData = [{ EMP: 123, state: '01' }];
      vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockResolvedValue(censusMockData);

      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'CensusService',
        dataSourceMethod: 'fetchIndustryData',
        dataSourceParams: ['EMP', 'state:01', { NAICS2017: "23" }]
      };
      const response = await MarketAnalysisTools.genericDataQuery(queryParams);

      expect(MarketAnalysisTools.dataService.getSpecificDataSourceData).toHaveBeenCalledWith(
        'CensusService', 'fetchIndustryData', ['EMP', 'state:01', { NAICS2017: "23" }]
      );
      expect(response.success).toBe(true);
      expect(response.content.data).toEqual(censusMockData);
      expect(response.metadata?.source).toBe('CensusService');
    });

    it('should return a structured error if getSpecificDataSourceData fails', async () => {
      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'OecdService',
        dataSourceMethod: 'fetchOecdDataset',
        dataSourceParams: ['QNA', 'AUS.GDP.Q']
      };
      vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockRejectedValue(new Error("OECD API unavailable"));

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(false);
      expect(response.error?.message).toContain('Error from OecdService.fetchOecdDataset: OECD API unavailable');
      expect(response.error?.code).toBe('generic_data_query_error');
    });

     it('should handle null response from getSpecificDataSourceData as no data', async () => {
      const queryParams: z.infer<typeof GenericDataQuerySchema> = {
        dataSourceName: 'ImfService',
        dataSourceMethod: 'fetchImfDataset',
        dataSourceParams: ['IFS', 'A.US.NODATA']
      };
      vi.mocked(MarketAnalysisTools.dataService.getSpecificDataSourceData).mockResolvedValue(null);

      const response = await MarketAnalysisTools.genericDataQuery(queryParams);
      expect(response.success).toBe(true);
      expect(response.content.data).toBeNull();
      expect(response.content.message).toContain('No data returned');
    });
  });

  describe('marketSize tool', () => {
    it('should correctly process data from dataService.getMarketSize', async () => {
        const marketDataPayload = { value: 2e12, source: 'AlphaVantageService', details: { symbol: 'MSFT', year: 2023, region: 'US' } };
        vi.mocked(MarketAnalysisTools.dataService.getMarketSize).mockResolvedValue(marketDataPayload);

        const params: z.infer<typeof MarketSizeSchema> = { industryId: 'MSFT', region: 'US', currency: 'USD' };
        const response = await MarketAnalysisTools.marketSize(params);

        expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('MSFT', 'US');
        expect(response.success).toBe(true);
        expect(response.content.industry).toBe('MSFT');
        expect(response.content.marketSize.value).toBe(2e12);
        expect(response.content.dataSource).toBe('AlphaVantageService');
    });
  });

  describe('tamCalculator tool', () => {
    it('should use market value from getMarketSize', async () => {
        vi.mocked(MarketAnalysisTools.dataService.getIndustryById).mockResolvedValue({
            id: 'tech-software', name: 'Software Technology', keyMetrics: { growthRate: 0.1 }, source: 'mock'
        });
        const marketDataPayload = { value: 500e9, source: 'CensusService', details: { naics: '511210', year: '2021' }};
        vi.mocked(MarketAnalysisTools.dataService.getMarketSize).mockResolvedValue(marketDataPayload);

        const params: z.infer<typeof TAMCalculatorSchema> = { industryId: 'tech-software', region: 'US' };
        const response = await MarketAnalysisTools.tamCalculator(params);

        expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('tech-software', 'US');
        expect(response.success).toBe(true);
        expect(response.content.totalAddressableMarket).toBe(500e9);
        expect(response.content.methodology).toContain('CensusService');
    });

    it('should return Zod validation error for invalid params in tamCalculator', async () => {
      // Missing industryId, which is required by TAMCalculatorSchema
      const invalidParams = { region: 'US', population: 100000 };
      const response = await MarketAnalysisTools.tamCalculator(invalidParams as any); // Cast as any to bypass TS error for test

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR'); // Assuming handleToolError produces this
      expect(response.error?.message).toContain("Validation error");
      // Zod errors typically have a more detailed structure, e.g., an array of issues.
      // The exact message/structure depends on how handleToolError formats ZodErrors.
      // For this test, checking for a validation-related error message is key.
      expect(response.error?.details).toBeInstanceOf(Array);
      expect(response.error?.details[0].path).toContain('industryId');
      expect(response.error?.details[0].message).toBe('Required');
    });
  });
});
