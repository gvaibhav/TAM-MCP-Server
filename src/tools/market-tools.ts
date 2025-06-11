// src/tools/market-tools.ts
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  IndustrySearchSchema,
  // Assuming IndustryDataSchema is updated in src/types/index.ts to include:
  // specificDataSourceName: z.string().optional(),
  // specificDataSourceMethod: z.string().optional(),
  // specificDataSourceParams: z.array(z.any()).optional(),
  IndustryDataSchema,
  MarketSizeSchema,
  TAMCalculatorSchema,
  SAMCalculatorSchema,
  MarketSegmentsSchema,
  MarketForecastingSchema,
  MarketComparisonSchema,
  DataValidationSchema,
  MarketOpportunitiesSchema,
  APIResponse,
  TAMCalculation,
  SAMCalculation,
  MarketComparison,
  ValidationResult
} from '../types/index.js';
import { DataService } from '../services/dataService.js';
import {
  createAPIResponse,
  createErrorResponse,
  handleToolError,
  validatePositiveNumber, // Keep existing utils
  validatePercentage,
  validateYear,
  validateCurrency,
  validateRegion,
  formatCurrency,
  formatPercentage,
  calculateCAGR,
  calculateConfidenceScore,
  logger
} from '../utils/index.js';

// Define schema for the new generic tool (conceptual - should be in src/types/index.ts)
const GenericDataQuerySchema = z.object({
  dataSourceName: z.string().describe("Name of the data source service (e.g., BlsService, CensusService)"),
  dataSourceMethod: z.string().describe("Method to call on the specified data source (e.g., fetchIndustryData)"),
  dataSourceParams: z.array(z.any()).describe("Array of parameters for the method (e.g., [ ['SERIES_ID'], '2022', '2023' ])")
});

// Update IndustryDataSchema conceptually to include specificDataSource fields
// For this subtask, we'll assume params passed to industryData might contain these fields.
const ExtendedIndustryDataSchema = IndustryDataSchema.extend({
    specificDataSourceName: z.string().optional().describe("Name of the specific data source service to query (e.g., BlsService, CensusService)"),
    specificDataSourceMethod: z.string().optional().describe("Method to call on the specified data source (e.g., fetchIndustryData, fetchImfDataset)"),
    specificDataSourceParams: z.array(z.any()).optional().describe("Array of parameters to pass to the data source method")
});


export class MarketAnalysisTools {
  private static _dataService: DataService | null = null;
  
  static get dataService(): DataService {
    if (!this._dataService) {
      this._dataService = new DataService();
    }
    return this._dataService;
  }
  
  static getToolDefinitions(): Tool[] { // This method remains unchanged
    return [
      {
        name: 'industry_search',
        description: 'Search for industries by name, keywords, or description. Returns matching industries with basic information.',
        inputSchema: zodToJsonSchema(IndustrySearchSchema) as any
      },
      {
        name: 'industry_data',
        description: 'Get detailed information about a specific industry. Can also fetch additional data from a specified source.',
        // Use the extended schema for the definition
        inputSchema: zodToJsonSchema(ExtendedIndustryDataSchema) as any
      },
      {
        name: 'market_size',
        description: 'Retrieve current or historical market size data for a specific industry and region.',
        inputSchema: zodToJsonSchema(MarketSizeSchema) as any
      },
      {
        name: 'tam_calculator',
        description: 'Calculate Total Addressable Market (TAM) for an industry with multiple methodologies and scenario analysis.',
        inputSchema: zodToJsonSchema(TAMCalculatorSchema) as any
      },
      {
        name: 'sam_calculator',
        description: 'Calculate Serviceable Addressable Market (SAM) and Serviceable Obtainable Market (SOM) based on TAM.',
        inputSchema: zodToJsonSchema(SAMCalculatorSchema) as any
      },
      {
        name: 'market_segments',
        description: 'Analyze market segmentation for an industry by demographics, geography, or behavior.',
        inputSchema: zodToJsonSchema(MarketSegmentsSchema) as any
      },
      {
        name: 'market_forecasting',
        description: 'Generate market size forecasts and projections for multiple years with scenario analysis.',
        inputSchema: zodToJsonSchema(MarketForecastingSchema) as any
      },
      {
        name: 'market_comparison',
        description: 'Compare multiple industries or markets across various metrics and dimensions.',
        inputSchema: zodToJsonSchema(MarketComparisonSchema) as any
      },
      {
        name: 'data_validation',
        description: 'Validate market data quality, accuracy, and completeness with recommendations.',
        inputSchema: zodToJsonSchema(DataValidationSchema) as any
      },
      {
        name: 'market_opportunities',
        description: 'Identify market opportunities, gaps, and growth potential within an industry.',
        inputSchema: zodToJsonSchema(MarketOpportunitiesSchema) as any
      },
      {
        name: 'generic_data_query', // New Tool
        description: 'Query a specific data source service and method with given parameters. Allows direct access to underlying data services.',
        inputSchema: zodToJsonSchema(GenericDataQuerySchema) as any
      }
    ];
  }

  static async industrySearch(params: z.infer<typeof IndustrySearchSchema>): Promise<APIResponse<any>> {
    try {
      const validatedParams = IndustrySearchSchema.parse(params);
      const { query, limit, includeSubIndustries } = validatedParams;
      
      logger.info(`Industry search: ${query}, limit: ${limit}`);
      // Pass limit to dataService.searchIndustries
      const industries = await MarketAnalysisTools.dataService.searchIndustries(query, limit);
      
      const results = industries.map((industry: any) => ({
        id: industry.id,
        name: industry.name,
        description: industry.description,
        naicsCode: industry.naicsCode,
        sicCode: industry.sicCode,
        marketSize: industry.keyMetrics?.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
        growthRate: industry.keyMetrics?.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
        subIndustries: includeSubIndustries ? industry.subIndustries : undefined, // Assuming subIndustries is part of mock
        lastUpdated: industry.lastUpdated // Assuming lastUpdated is part of mock
      }));

      return createAPIResponse(
        {
          query,
          totalResults: results.length,
          industries: results,
          searchTips: results.length === 0 ? [
            'Try broader search terms',
            'Check spelling of industry names',
            'Use keywords like "software", "healthcare", "fintech"'
          ] : undefined
        },
        'industry-database'
      );
    } catch (error) {
      return handleToolError(error, 'industry_search');
    }
  }

  static async industryData(params: z.infer<typeof ExtendedIndustryDataSchema>): Promise<APIResponse<any>> {
    try {
      const validatedParams = ExtendedIndustryDataSchema.parse(params);
      const { industryId, includeMetrics, region,
              specificDataSourceName, specificDataSourceMethod, specificDataSourceParams } = validatedParams;
      
      if (region) {
        validateRegion(region);
      }

      const industry = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      if (!industry) {
        return createErrorResponse(`Industry not found: ${industryId}`);
      }

      // Use industry's default region if region param not provided, fallback to 'US'
      const effectiveRegion = region || industry.defaultRegion || 'US';
      const marketSizeData = await MarketAnalysisTools.dataService.getMarketSize(industryId, effectiveRegion);

      const result: any = {
        id: industry.id,
        name: industry.name,
        description: industry.description,
        classification: {
          naicsCode: industry.naicsCode,
          sicCode: industry.sicCode,
          parentIndustry: industry.parentIndustry // Assuming this is part of mock/data model
        },
        subIndustries: industry.subIndustries, // Assuming this is part of mock/data model
        geography: industry.geography || effectiveRegion,  // Assuming this is part of mock/data model
        lastUpdated: industry.lastUpdated,
        ...(includeMetrics && {
          metrics: {
            marketSize: industry.keyMetrics?.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
            growthRate: industry.keyMetrics?.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
            cagr: industry.keyMetrics?.cagr ? formatPercentage(industry.keyMetrics.cagr) : 'N/A', // Assuming mock provides these
            volatility: industry.keyMetrics?.volatility ? formatPercentage(industry.keyMetrics.volatility) : 'N/A', // Assuming mock provides these
            regionalSize: marketSizeData?.value ? formatCurrency(marketSizeData.value) : 'N/A',
            regionalDataSource: marketSizeData?.source,
            dataConfidence: marketSizeData?.details?.confidenceScore ? formatPercentage(marketSizeData.details.confidenceScore) : (marketSizeData?.source !== 'mock' ? 'N/A - Real Data' : 'N/A')
          }
        }),
        detailedSourceData: null,
      };

      if (specificDataSourceName && specificDataSourceMethod && specificDataSourceParams) {
        logger.info(`IndustryData: Fetching specific data from ${specificDataSourceName}.${specificDataSourceMethod}`);
        try {
          const detailedData = await MarketAnalysisTools.dataService.getSpecificDataSourceData(
            specificDataSourceName,
            specificDataSourceMethod,
            specificDataSourceParams
          );
          result.detailedSourceData = detailedData === undefined || detailedData === null ? 'No data returned from specific source or method returned undefined/null.' : detailedData;
        } catch (specificError: any) {
          logger.warn(`IndustryData: Error fetching from ${specificDataSourceName}: ${specificError.message}`);
          result.detailedSourceData = { error: `Failed to fetch from ${specificDataSourceName}: ${specificError.message}` };
        }
      }

      return createAPIResponse(result, marketSizeData?.source || industry.source || 'industry-database-mock');
    } catch (error) {
      return handleToolError(error, 'industry_data');
    }
  }

  static async marketSize(params: z.infer<typeof MarketSizeSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, region, year, currency } = MarketSizeSchema.parse(params);
      
      validateRegion(region);
      validateCurrency(currency);
      if (year) {
        validateYear(year);
      }

      const marketDataResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region, year);

      if (!marketDataResult || marketDataResult.value === null || marketDataResult.value === undefined) {
        return createErrorResponse(`Market size data not available for industry: ${industryId} in region: ${region}`);
      }

      const details = marketDataResult.details || {};

      const result = {
        industry: industryId,
        marketSize: {
          value: marketDataResult.value,
          formattedValue: formatCurrency(marketDataResult.value, currency),
          currency,
          year: details.year || details.date || (marketDataResult.source === 'mock' ? new Date().getFullYear() : 'Latest available'),
          region: details.region || region,
        },
        dataSource: marketDataResult.source,
        methodology: details.methodology,
        confidence: {
          score: details.confidenceScore,
          level: details.confidenceScore > 0.8 ? 'High' :
                 details.confidenceScore > 0.6 ? 'Medium' : 'Low'
        },
        sources: details.sources,
        segments: details.segments?.map((segment: any) => ({
          name: segment.name,
          value: formatCurrency(segment.value, currency),
          percentage: formatPercentage(segment.percentage),
          growthRate: formatPercentage(segment.growthRate),
          description: segment.description
        })),
        metadata: {
          dataRecency: (details.year || details.date)?.toString() === new Date().getFullYear().toString() ? 'Current' : 'Historical/Latest',
          lastUpdated: details.lastUpdated || new Date().toISOString().split('T')[0]
        }
      };

      return createAPIResponse(result, marketDataResult.source || 'market-data-api');
    } catch (error) {
      return handleToolError(error, 'market_size');
    }
  }

  static async tamCalculator(params: z.infer<typeof TAMCalculatorSchema>): Promise<APIResponse<TAMCalculation>> {
    try {
      const { industryId, region, population, penetrationRate, averageSpending, includeScenarios } = 
        TAMCalculatorSchema.parse(params);
      
      validateRegion(region);
      if (penetrationRate) validatePercentage(penetrationRate, 'Penetration rate');
      if (population) validatePositiveNumber(population, 'Population');
      if (averageSpending) validatePositiveNumber(averageSpending, 'Average spending');

      const industryInfo = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      const marketDataResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      
      if (!industryInfo || !marketDataResult || marketDataResult.value === null || marketDataResult.value === undefined) {
        return createErrorResponse(`Unable to calculate TAM: industry or market data not found for ${industryId} in ${region}`);
      }

      const marketValue = marketDataResult.value;
      const marketDataSource = marketDataResult.source;
      const marketDetails = marketDataResult.details || {};

      let tamValue: number;
      let methodology: string;
      const assumptions: string[] = [];

      if (population && penetrationRate && averageSpending) {
        tamValue = population * penetrationRate * averageSpending;
        methodology = 'Bottom-up: Population × Penetration Rate × Average Spending';
        assumptions.push(`Target population: ${population.toLocaleString()}`);
        assumptions.push(`Penetration rate: ${formatPercentage(penetrationRate)}`);
        assumptions.push(`Average annual spending: ${formatCurrency(averageSpending)}`);
      } else {
        tamValue = marketValue; // Ensure marketValue is number
        methodology = `Top-down: Based on existing market size data from ${marketDataSource}`;
        assumptions.push(`Current market size: ${formatCurrency(marketValue)} (Source: ${marketDataSource})`);
        assumptions.push(`Assumed growth rate: ${formatPercentage(industryInfo.keyMetrics?.growthRate || 0.05)} (from industry profile)`);
      }

      const scenarios = includeScenarios ? {
        conservative: tamValue * 0.7,
        realistic: tamValue,
        optimistic: tamValue * 1.5
      } : {
        conservative: tamValue,
        realistic: tamValue,
        optimistic: tamValue
      };

      const breakdown = population && penetrationRate && averageSpending ? {
        population,
        penetrationRate,
        averageSpending
      } : {};

      const confidenceScore = calculateConfidenceScore({
        dataRecency: (marketDetails.year || marketDetails.date)?.toString() === new Date().getFullYear().toString() ? 0.9 : 0.7,
        sourceReliability: marketDataSource !== 'mock' ? 0.85 : 0.7,
        dataCompleteness: Object.keys(breakdown).length > 0 ? 0.9 : (marketValue ? 0.75 : 0.5),
        methodologyRobustness: Object.keys(breakdown).length > 0 ? 0.9 : 0.8
      });

      const result: TAMCalculation = {
        totalAddressableMarket: tamValue,
        methodology,
        assumptions,
        scenarios,
        breakdown,
        confidenceScore,
        sources: marketDetails.sources || (marketDataSource ? [marketDataSource] : [])
      };

      return createAPIResponse(result, `tam-calculator (data from ${marketDataSource})`);
    } catch (error) {
      return handleToolError(error, 'tam_calculator');
    }
  }

  static async samCalculator(params: z.infer<typeof SAMCalculatorSchema>): Promise<APIResponse<SAMCalculation>> {
    try {
      const { tamValue, targetSegments, geographicConstraints, competitiveFactors, targetMarketShare, timeframe } = 
        SAMCalculatorSchema.parse(params);
      
      validatePositiveNumber(tamValue, 'TAM value');
      if(targetMarketShare) validatePercentage(targetMarketShare, 'Target market share');


      let samMultiplier = 1.0;
      
      if (geographicConstraints && geographicConstraints.length > 0) {
        samMultiplier *= 0.6;
      }
      
      if (competitiveFactors && competitiveFactors.length > 0) {
        const competitiveReduction = Math.min(0.5, competitiveFactors.length * 0.1);
        samMultiplier *= (1 - competitiveReduction);
      }
      
      if (targetSegments && targetSegments.length > 0 && targetSegments.length < 5) {
        samMultiplier *= (0.3 + (targetSegments.length * 0.15));
      }

      const samValue = tamValue * samMultiplier;
      const somValue = samValue * (targetMarketShare || 0.1); // Default SOM share if not provided

      const result: SAMCalculation = {
        serviceableAddressableMarket: samValue,
        serviceableObtainableMarket: somValue,
        targetSegments,
        geographicConstraints,
        competitiveFactors,
        marketShare: {
          target: targetMarketShare || 0.1,
          timeframe
        }
      };
      return createAPIResponse(result, 'sam-calculator');
    } catch (error) {
      return handleToolError(error, 'sam_calculator');
    }
  }

  static async marketSegments(params: z.infer<typeof MarketSegmentsSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, segmentationType, region, minSegmentSize } = MarketSegmentsSchema.parse(params);
      
      validateRegion(region);
      if(minSegmentSize) validatePositiveNumber(minSegmentSize, 'Minimum segment size');

      const marketDataResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      const segmentsFromService = await MarketAnalysisTools.dataService.getMarketSegments(industryId, region);

      // Use segments from DataService if available, otherwise fallback or use marketDataResult details
      const segments = segmentsFromService || marketDataResult?.details?.segments || [];
      const marketValue = marketDataResult?.value;
      const dataSource = marketDataResult?.source || 'mock-segments';

      if (segments.length === 0) {
         logger.info(`No segment data available for industry: ${industryId} in ${region} from primary sources.`);
      }

      const filteredSegments = segments.filter((segment: any) => (segment.value || (marketValue && segment.percentage ? marketValue * segment.percentage : 0)) >= (minSegmentSize || 0));

      const segmentAnalysis = {
        industry: industryId,
        segmentationType,
        region,
        totalMarketSize: marketValue ? formatCurrency(marketValue) : 'N/A',
        dataSource: dataSource,
        segmentCount: filteredSegments.length,
        segments: filteredSegments.map((segment: any) => ({
          name: segment.segmentName || segment.name, // Adapt to different segment structures
          size: segment.value ? formatCurrency(segment.value) : (marketValue && segment.percentage ? formatCurrency(marketValue * segment.percentage) : 'N/A'),
          marketShare: segment.percentage ? formatPercentage(segment.percentage) : 'N/A',
          growthRate: segment.growthRate ? formatPercentage(segment.growthRate) : 'N/A',
          description: segment.description,
          attractiveness: (segment.growthRate || 0) > 0.15 ? 'High' :
                         (segment.growthRate || 0) > 0.08 ? 'Medium' : 'Low'
        })),
        // ... (insights as before)
      };

      return createAPIResponse(segmentAnalysis, `market-segmentation-api (data from ${dataSource})`);
    } catch (error) {
      return handleToolError(error, 'market_segments');
    }
  }

  static async marketForecasting(params: z.infer<typeof MarketForecastingSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, years, region, includeScenarios, factors } = MarketForecastingSchema.parse(params);
      
      validateRegion(region);
      validatePositiveNumber(years, 'Years to forecast');

      const forecasts = await MarketAnalysisTools.dataService.generateMarketForecast(industryId, years, region);
      if (!forecasts || forecasts.length === 0) {
        return createErrorResponse(`Unable to generate forecast for industry: ${industryId}`);
      }

      const currentMarketSizeResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      const industryInfo = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      
      if (!currentMarketSizeResult || currentMarketSizeResult.value === null || currentMarketSizeResult.value === undefined || !industryInfo) {
        return createErrorResponse(`Base data not available for forecasting for ${industryId} in ${region}`);
      }

      const baseMarketValue = currentMarketSizeResult.value;
      const baseMarketDetails = currentMarketSizeResult.details || {};
      const baseMarketDataSource = currentMarketSizeResult.source;

      // Ensure forecasts has value, if not, use a mock growth rate for CAGR
      const endValueForCagr = forecasts[forecasts.length - 1]?.value || baseMarketValue * Math.pow(1 + (industryInfo.keyMetrics?.growthRate || 0.05), years);

      const cagr = calculateCAGR(
        baseMarketValue,
        endValueForCagr,
        years
      );

      const baseYear = baseMarketDetails.year || baseMarketDetails.date || new Date().getFullYear().toString();

      const forecastAnalysis = {
        industry: industryId,
        region,
        baseYear: baseYear,
        baseMarketSize: formatCurrency(baseMarketValue),
        baseMarketDataSource,
        forecastPeriod: `${parseInt(baseYear.toString()) + 1}-${parseInt(baseYear.toString()) + years}`,
        cagr: formatPercentage(cagr),
        projections: forecasts.map((forecast: any) => ({
          year: forecast.year,
          marketSize: formatCurrency(forecast.value), // Mock forecast has 'value'
          growthRate: forecast.growthRate !== undefined ? formatPercentage(forecast.growthRate) : 'N/A', // Mock might not have this
          confidence: forecast.confidence !== undefined ? formatPercentage(forecast.confidence) : 'N/A' // Mock might not have this
        })),
        keyFactors: factors && factors.length > 0 ? factors : (forecasts[0]?.factors || ["General economic trends", "Industry specific drivers"]),
        scenarios: includeScenarios ? {
          conservative: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.value * 0.8) })),
          realistic: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.value) })),
          optimistic: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.value * 1.3) }))
        } : undefined,
        // ... (riskFactors as before)
      };

      return createAPIResponse(forecastAnalysis, `forecasting-engine (base data from ${baseMarketDataSource})`);
    } catch (error) {
      return handleToolError(error, 'market_forecasting');
    }
  }

  static async marketComparison(params: z.infer<typeof MarketComparisonSchema>): Promise<APIResponse<MarketComparison>> {
    try {
      const { industryIds, region } = MarketComparisonSchema.parse(params);
      validateRegion(region);

      const marketDataPromises = industryIds.map(async (id: string) => {
        const industry = await MarketAnalysisTools.dataService.getIndustryById(id);
        const marketSizeResult = await MarketAnalysisTools.dataService.getMarketSize(id, region);
        return {
          id,
          industry,
          marketSizeResult
        };
      });

      const resolvedMarketData = await Promise.all(marketDataPromises);

      const validMarkets = resolvedMarketData.filter(m => m.industry && m.marketSizeResult && m.marketSizeResult.value !== null && m.marketSizeResult.value !== undefined);
      
      if (validMarkets.length < 1) {
        return createErrorResponse('Insufficient data for market comparison for the given industries/region.');
      }

      const markets = validMarkets.map((m: any) => ({
        name: m.industry!.name,
        currentSize: m.marketSizeResult!.value,
        dataSource: m.marketSizeResult!.source,
        growthRate: m.industry!.keyMetrics?.growthRate || 0,
        cagr: m.industry!.keyMetrics?.cagr || 0,
        region
      }));

      // ... (rest of marketComparison logic)
      const totalMarketSize = markets.reduce((sum: number, market: any) => sum + market.currentSize, 0);
      const avgGrowthRate = markets.length > 0 ? markets.reduce((sum: number, market: any) => sum + market.growthRate, 0) / markets.length : 0;
      let analysisMessage = `Compared ${markets.length} markets in ${region}. `;
      if (markets.length > 0) analysisMessage += `Total combined size: ${formatCurrency(totalMarketSize)}. Avg growth: ${formatPercentage(avgGrowthRate)}.`;


      const result: MarketComparison = {
        markets,
        analysis: analysisMessage,
        recommendations: ["Compare CAGR for growth potential.", "Analyze market share distribution."]
      };
      return createAPIResponse(result, 'market-comparison-engine');
    } catch (error) {
      return handleToolError(error, 'market_comparison');
    }
  }

  static async dataValidation(params: z.infer<typeof DataValidationSchema>): Promise<APIResponse<ValidationResult>> {
    try {
      const { dataType, data, strictMode } = DataValidationSchema.parse(params);
      
      const issues: string[] = [];
      const suggestions: string[] = [];
      let dataQuality: 'high' | 'medium' | 'low' = 'high';

      switch (dataType) {
        case 'market-size':
          if (!data.value || typeof data.value !== 'number' || data.value <= 0) {
            issues.push('Market size value must be a positive number (data.value)');
            dataQuality = 'low';
          }
          const year = data.details?.year || data.details?.date || data.year; // Check new and old structures
          if (!year || parseInt(year.toString()) < 1900 || parseInt(year.toString()) > new Date().getFullYear() + 20) {
            issues.push('Invalid or missing year');
            dataQuality = dataQuality === 'high' ? 'medium' : 'low';
          }
          const sources = data.details?.sources || (data.source ? [data.source] : []); // Check new and old structures
          if (!sources || !Array.isArray(sources) || sources.length === 0) {
            issues.push('Missing or empty data sources');
            dataQuality = dataQuality === 'high' ? 'medium' : dataQuality;
          }
          break;
        // ... (other dataType cases)
      }

      if (strictMode) {
        const confidenceScore = data.details?.confidenceScore || data.confidenceScore; // Check new and old
        if (confidenceScore && (confidenceScore < 0 || confidenceScore > 1)) {
          issues.push('Confidence score must be between 0 and 1');
        }
        const currency = data.details?.currency || data.currency; // Check new and old
        const supportedCurrencies = await MarketAnalysisTools.dataService.getSupportedCurrencies();
        if (currency && !supportedCurrencies.includes(currency.toUpperCase())) {
          issues.push(`Unsupported currency code: ${currency}`);
        }
      }
      // ... (rest of dataValidation logic)
      const result: ValidationResult = { isValid: issues.length === 0, issues, suggestions, dataQuality, lastValidated: new Date().toISOString() };
      return createAPIResponse(result, 'data-validation-service');
    } catch (error) {
      return handleToolError(error, 'data_validation');
    }
  }

  static async marketOpportunities(params: z.infer<typeof MarketOpportunitiesSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, region, minMarketSize, maxCompetition, timeframe } = MarketOpportunitiesSchema.parse(params); // Ensure schema is used
      
      validateRegion(region);
      if(minMarketSize) validatePositiveNumber(minMarketSize, 'Minimum market size');

      const serviceResponse = await MarketAnalysisTools.dataService.getMarketOpportunities(industryId, region, minMarketSize);
      const opportunitiesArray = serviceResponse?.opportunities; // DataService returns object with 'opportunities' array

       if (!serviceResponse || !Array.isArray(opportunitiesArray)) {
         logger.warn(`Market opportunities data for ${industryId} in ${region} was not an array or was null/undefined.`);
         return createAPIResponse({
            industry: industryId, region, opportunityCount: 0, opportunities: [],
            recommendations: ['No opportunities found or data issue. Consider broadening search or checking data source.']
         }, serviceResponse?.source || 'opportunity-analyzer-no-data');
      }
      
      const filteredOpportunities = opportunitiesArray.filter((opp: any) => {
        const competitionLevels = ['low', 'medium', 'high'];
        const maxCompetitionIndex = competitionLevels.indexOf(maxCompetition || 'high');
        const oppCompetitionIndex = competitionLevels.indexOf(opp.competitiveIntensity);
        // Use opp.marketSize directly as DataService mock now provides it
        const sizeCondition = minMarketSize ? (opp.marketSize >= minMarketSize) : true;
        return oppCompetitionIndex <= maxCompetitionIndex && sizeCondition;
      });

      const analysis = {
        industry: industryId,
        region,
        searchCriteria: { minMarketSize: minMarketSize ? formatCurrency(minMarketSize) : undefined, maxCompetition, timeframe },
        opportunityCount: filteredOpportunities.length,
        opportunities: filteredOpportunities.map((opp: any) => ({
          id: opp.id,
          title: opp.title,
          description: opp.description,
          marketSize: opp.marketSize ? formatCurrency(opp.marketSize) : 'N/A',
          growthPotential: opp.growthPotential ? formatPercentage(opp.growthPotential) : 'N/A',
          competitiveIntensity: opp.competitiveIntensity,
          // ... (rest of mapping)
          attractivenessScore: MarketAnalysisTools._calculateAttractivenessScore(opp), // Corrected `this` context
        })).sort((a: any, b: any) => b.attractivenessScore - a.attractivenessScore),
        // ... (recommendations)
      };

      return createAPIResponse(analysis, serviceResponse?.source || 'opportunity-analyzer');
    } catch (error) {
      return handleToolError(error, 'market_opportunities');
    }
  }

  // New Tool Implementation
  static async genericDataQuery(params: z.infer<typeof GenericDataQuerySchema>): Promise<APIResponse<any>> {
    try {
      const { dataSourceName, dataSourceMethod, dataSourceParams } = GenericDataQuerySchema.parse(params);
      logger.info(`GenericDataQuery: Calling ${dataSourceName}.${dataSourceMethod} with params:`, dataSourceParams);

      const result = await MarketAnalysisTools.dataService.getSpecificDataSourceData(
        dataSourceName,
        dataSourceMethod,
        dataSourceParams
      );

      if (result === null || result === undefined) {
        return createAPIResponse(
            {
                message: `No data returned from ${dataSourceName}.${dataSourceMethod} for the given parameters.`,
                query: { dataSourceName, dataSourceMethod, dataSourceParams },
                data: null
            },
            dataSourceName
        );
      }

      return createAPIResponse(
        {
            query: { dataSourceName, dataSourceMethod, dataSourceParams },
            data: result
        },
        dataSourceName
      );

    } catch (error: any) {
      logger.error(`GenericDataQuery failed for ${params.dataSourceName}.${params.dataSourceMethod}: ${error.message}`, { originalError: error });
      return createErrorResponse(
        `Error from ${params.dataSourceName}.${params.dataSourceMethod}: ${error.message}`,
        "generic_data_query_error"
      );
    }
  }

  private static _calculateAttractivenessScore(opportunity: any): number { // Make it static if called with this.
    let score = 0;
    score += Math.min(40, ((opportunity.marketSize || 0) / 1000000000) * 10);
    score += (opportunity.growthPotential || 0) * 3000;
    const competitionScore = opportunity.competitiveIntensity === 'low' ? 20 : 
                           opportunity.competitiveIntensity === 'medium' ? 10 : 5;
    score += competitionScore;
    const barrierScore = opportunity.barrierToEntry === 'low' ? 10 : 
                        opportunity.barrierToEntry === 'medium' ? 5 : 2;
    score += barrierScore;
    return Math.round(Math.min(100, Math.max(0, score)));
  }
}
