// src/tools/market-tools.ts
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  IndustrySearchSchema,
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
  ValidationResult,
  // MarketData // Assuming MarketData type might need an update or be flexible
} from '../types/index.js'; // Ensure MarketData type is compatible or updated
import { DataService } from '../services/dataService.js';
import {
  createAPIResponse,
  createErrorResponse,
  handleToolError,
  validatePositiveNumber,
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


export class MarketAnalysisTools {
  static dataService = new DataService();
  static getToolDefinitions(): Tool[] { // This method remains unchanged
    return [
      {
        name: 'industry_search',
        description: 'Search for industries by name, keywords, or description. Returns matching industries with basic information.',
        inputSchema: zodToJsonSchema(IndustrySearchSchema) as any
      },
      {
        name: 'industry_data',
        description: 'Get detailed information about a specific industry including metrics, sub-industries, and market data.',
        inputSchema: zodToJsonSchema(IndustryDataSchema) as any
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
      }
    ];
  }

  static async industrySearch(params: z.infer<typeof IndustrySearchSchema>): Promise<APIResponse<any>> {
    try {
      const { query, limit, includeSubIndustries } = IndustrySearchSchema.parse(params);
      
      logger.info(`Industry search: ${query}`);
      // Assuming searchIndustries still returns mock data with the old structure for now
      const industries = await MarketAnalysisTools.dataService.searchIndustries(query);
      
      const results = industries.slice(0, limit).map((industry: any) => ({
        id: industry.id,
        name: industry.name,
        description: industry.description,
        naicsCode: industry.naicsCode,
        sicCode: industry.sicCode,
        // These metrics come from the mock data structure of getIndustryById / searchIndustries
        marketSize: industry.keyMetrics?.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
        growthRate: industry.keyMetrics?.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
        subIndustries: includeSubIndustries ? industry.subIndustries : undefined,
        lastUpdated: industry.lastUpdated
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
        'industry-database' // This is a mock source name
      );
    } catch (error) {
      return handleToolError(error, 'industry_search');
    }
  }

  static async industryData(params: z.infer<typeof IndustryDataSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, includeMetrics, region } = IndustryDataSchema.parse(params);
      
      if (region) {
        validateRegion(region);
      }

      // getIndustryById still uses mock data
      const industry = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      if (!industry) {
        return createErrorResponse(`Industry not found: ${industryId}`);
      }

      const marketSizeData = region ?
        await MarketAnalysisTools.dataService.getMarketSize(industryId, region) :
        await MarketAnalysisTools.dataService.getMarketSize(industryId, industry.defaultRegion || 'US');

      const result = {
        id: industry.id,
        name: industry.name,
        description: industry.description,
        classification: {
          naicsCode: industry.naicsCode,
          sicCode: industry.sicCode,
          parentIndustry: industry.parentIndustry
        },
        subIndustries: industry.subIndustries,
        geography: industry.geography,
        lastUpdated: industry.lastUpdated,
        ...(includeMetrics && {
          metrics: {
            marketSize: industry.keyMetrics?.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
            growthRate: industry.keyMetrics?.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
            cagr: industry.keyMetrics?.cagr ? formatPercentage(industry.keyMetrics.cagr) : 'N/A',
            volatility: industry.keyMetrics?.volatility ? formatPercentage(industry.keyMetrics.volatility) : 'N/A',
            regionalSize: marketSizeData?.value ? formatCurrency(marketSizeData.value) : 'N/A',
            regionalDataSource: marketSizeData?.source,
            dataConfidence: marketSizeData?.details?.confidenceScore ? formatPercentage(marketSizeData.details.confidenceScore) : (marketSizeData?.source !== 'mock' ? 'N/A - Real Data' : 'N/A')
          }
        })
      };
      return createAPIResponse(result, industry.source || 'industry-database-mock');
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

      const marketDataResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);

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
      
      if (!industryInfo || !marketDataResult || marketDataResult.value === null) {
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
        tamValue = marketValue;
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
        sources: marketDetails.sources || [marketDataSource]
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
      validatePercentage(targetMarketShare, 'Target market share');

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
      const somValue = samValue * targetMarketShare;

      const result: SAMCalculation = {
        serviceableAddressableMarket: samValue,
        serviceableObtainableMarket: somValue,
        targetSegments,
        geographicConstraints,
        competitiveFactors,
        marketShare: {
          target: targetMarketShare,
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

      if (!marketDataResult || !marketDataResult.details?.segments) {
        return createErrorResponse(`Market segmentation data not available for industry: ${industryId} in ${region} (Source: ${marketDataResult?.source})`);
      }

      const marketValue = marketDataResult.value;
      const segments = marketDataResult.details.segments;
      const dataSource = marketDataResult.source;

      const filteredSegments = segments.filter((segment: any) => segment.value >= (minSegmentSize || 0));
      
      if (filteredSegments.length === 0 && segments.length > 0 && (minSegmentSize || 0) > 0) {
         logger.info(`No segments matched minSegmentSize ${minSegmentSize}. Original segments available: ${segments.length}`);
      }

      const segmentAnalysis = {
        industry: industryId,
        segmentationType,
        region,
        totalMarketSize: marketValue ? formatCurrency(marketValue) : 'N/A',
        dataSource: dataSource,
        segmentCount: filteredSegments.length,
        segments: filteredSegments.map((segment: any) => ({
          name: segment.name,
          size: formatCurrency(segment.value),
          marketShare: formatPercentage(segment.percentage),
          growthRate: formatPercentage(segment.growthRate),
          description: segment.description,
          attractiveness: (segment.growthRate || 0) > 0.15 ? 'High' :
                         (segment.growthRate || 0) > 0.08 ? 'Medium' : 'Low'
        })),
        insights: filteredSegments.length > 0 ? {
          largestSegment: filteredSegments.reduce((prev: any, current: any) => 
            (prev.value || 0) > (current.value || 0) ? prev : current
          ).name,
          fastestGrowing: filteredSegments.reduce((prev: any, current: any) => 
            (prev.growthRate || 0) > (current.growthRate || 0) ? prev : current
          ).name,
          recommendations: [
            'Focus on high-growth segments for maximum opportunity',
            'Consider market entry barriers for each segment',
            'Analyze competitive landscape within target segments'
          ]
        } : { recommendations: ['No segments match criteria or no segments available from source.'] }
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

      // generateMarketForecast in DataService expects (industryId, years, region)
      // but the provided DataService implementation has (industryId) and it returns mock data.
      // We'll adapt to the mock implementation for now.
      // const forecasts = await MarketAnalysisTools.dataService.generateMarketForecast(industryId, years, region);
      const mockForecasts = await MarketAnalysisTools.dataService.generateMarketForecast(industryId);


      if (!mockForecasts || mockForecasts.length === 0) {
        return createErrorResponse(`Unable to generate forecast for industry: ${industryId}`);
      }

      // Adapt mockForecasts to fit the structure expected by the rest of this function
      // This is a temporary adaptation due to mismatch with DataService.generateMarketForecast signature and mock nature
      const forecasts = mockForecasts.slice(0, years).map((item: any) => ({
          year: item.year,
          projectedSize: item.value, // Mock data has 'value'
          growthRate: (item.value - (mockForecasts.find((f:any) => f.year === item.year -1)?.value || item.value)) / (mockForecasts.find((f:any) => f.year === item.year-1)?.value || item.value) || 0.05, // Approximate growth
          confidence: 0.7, // Mock confidence
          factors: factors || ["General economic conditions", "Industry specific trends"]
      }));


      const currentMarketSizeResult = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      const industryInfo = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      
      if (!currentMarketSizeResult || currentMarketSizeResult.value === null || !industryInfo) {
        return createErrorResponse(`Base data not available for forecasting for ${industryId} in ${region}`);
      }

      const baseMarketValue = currentMarketSizeResult.value;
      const baseMarketDetails = currentMarketSizeResult.details || {};
      const baseMarketDataSource = currentMarketSizeResult.source;

      const cagr = calculateCAGR(
        baseMarketValue,
        forecasts[forecasts.length - 1].projectedSize,
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
          marketSize: formatCurrency(forecast.projectedSize),
          growthRate: formatPercentage(forecast.growthRate),
          confidence: formatPercentage(forecast.confidence)
        })),
        keyFactors: factors && factors.length > 0 ? factors : forecasts[0].factors,
        scenarios: includeScenarios ? {
          conservative: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.projectedSize * 0.8) })),
          realistic: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.projectedSize) })),
          optimistic: forecasts.map((f: any) => ({ year: f.year, size: formatCurrency(f.projectedSize * 1.3) }))
        } : undefined,
        riskFactors: [
          'Economic recession or downturn',
          'Regulatory changes',
          'Technological disruption',
          'Market saturation',
          'Competitive pressure'
         ]
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

      const validMarkets = resolvedMarketData.filter(m => m.industry && m.marketSizeResult && m.marketSizeResult.value !== null);
      
      if (validMarkets.length < 1) {
        return createErrorResponse('Insufficient data for market comparison for the given industries/region.');
      }
      if (validMarkets.length < 2) {
        logger.warn("MarketComparison: Only one valid market found. Comparison will be limited.");
      }

      const markets = validMarkets.map((m: any) => ({
        name: m.industry!.name,
        currentSize: m.marketSizeResult!.value,
        dataSource: m.marketSizeResult!.source,
        growthRate: m.industry!.keyMetrics?.growthRate || 0,
        cagr: m.industry!.keyMetrics?.cagr || 0,
        region
      }));

      markets.sort((a,b) => b.currentSize - a.currentSize);

      const totalMarketSize = markets.reduce((sum: number, market: any) => sum + market.currentSize, 0);
      const avgGrowthRate = markets.length > 0 ? markets.reduce((sum: number, market: any) => sum + market.growthRate, 0) / markets.length : 0;

      let analysisMessage = "Market data overview: ";
      if (markets.length > 0) {
         analysisMessage = markets.length > 1 ? `Market comparison shows ${markets[0].name} leading with ${formatCurrency(markets[0].currentSize)} market size (Source: ${markets[0].dataSource}). ` :
                           `${markets[0].name} has a market size of ${formatCurrency(markets[0].currentSize)} (Source: ${markets[0].dataSource}). `;
      }
      analysisMessage += `Average growth rate across evaluated markets is ${formatPercentage(avgGrowthRate)}. ` +
                         `Total combined market size is ${formatCurrency(totalMarketSize)}.`;

      const recommendations = [
        'Focus on highest growth markets for long-term value',
        'Consider market size vs. competition balance',
        'Evaluate barriers to entry for each market',
        'Assess synergies between different markets'
      ];

      const result: MarketComparison = {
        markets,
        analysis: analysisMessage,
        recommendations
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
          // Accessing year from data.details (new structure) or data (old structure for fallback)
          const year = data.details?.year || data.details?.date || data.year;
          if (!year || parseInt(year.toString()) < 1900 || parseInt(year.toString()) > new Date().getFullYear() + 10) {
            issues.push('Invalid or missing year (expected in data.details.year, data.details.date, or data.year)');
            dataQuality = dataQuality === 'high' ? 'medium' : 'low';
          }
          // Accessing sources from data.details (new structure) or data.source (new structure)
          const sources = data.details?.sources || (data.source ? [data.source] : []);
          if (!sources || !Array.isArray(sources) || sources.length === 0) {
            issues.push('Missing or empty data sources (expected in data.details.sources or data.source)');
            suggestions.push('Add credible data sources for verification');
            dataQuality = dataQuality === 'high' ? 'medium' : dataQuality;
          }
          break;
        case 'industry-data':
          if (!data.name || typeof data.name !== 'string') {
            issues.push('Industry name is required'); dataQuality = 'low';
          }
          if (!data.description) suggestions.push('Add industry description for better context');
          break;
        case 'forecast':
          if (!data.projections || !Array.isArray(data.projections)) {
            issues.push('Forecast projections are required'); dataQuality = 'low';
          }
          break;
        case 'tam-calculation':
          if (!data.totalAddressableMarket || data.totalAddressableMarket <= 0) {
            issues.push('TAM value must be positive'); dataQuality = 'low';
          }
          if (!data.methodology) {
            issues.push('Calculation methodology must be specified');
            dataQuality = dataQuality === 'high' ? 'medium' : 'low';
          }
          break;
      }

      if (strictMode) {
        // Accessing confidenceScore from data.details (new structure) or data (old structure for fallback)
        const confidenceScore = data.details?.confidenceScore || data.confidenceScore;
        if (confidenceScore && (confidenceScore < 0 || confidenceScore > 1)) {
          issues.push('Confidence score must be between 0 and 1 (expected in data.details.confidenceScore or data.confidenceScore)');
        }
        // Accessing currency from data.details (new structure) or data (old structure for fallback)
        const currency = data.details?.currency || data.currency;
        const supportedCurrencies = await MarketAnalysisTools.dataService.getSupportedCurrencies();
        if (currency && !supportedCurrencies.includes(currency)) {
          issues.push(`Unsupported currency code: ${currency} (expected in data.details.currency or data.currency)`);
        }
      }

      if (dataQuality === 'high' && issues.length === 0) {
        suggestions.push('Data quality appears good - consider regular updates and deeper validation against benchmarks.');
      } else if (issues.length > 0) {
         suggestions.push("Review highlighted issues to improve data quality.");
      }

      const result: ValidationResult = {
        isValid: issues.length === 0,
        issues,
        suggestions,
        dataQuality,
        lastValidated: new Date().toISOString()
      };

      return createAPIResponse(result, 'data-validation-service');
    } catch (error) {
      return handleToolError(error, 'data_validation');
    }
  }

  static async marketOpportunities(params: z.infer<typeof MarketOpportunitiesSchema>): Promise<APIResponse<any>> {
    try {
      const { industryId, region, minMarketSize, maxCompetition, timeframe } = MarketOpportunitiesSchema.parse(params);
      
      validateRegion(region);
      if(minMarketSize) validatePositiveNumber(minMarketSize, 'Minimum market size');

      // DataService.getMarketOpportunities returns a mock object, not an array.
      // We need to adapt the response or the processing logic.
      // For now, let's assume it returns an object with an 'opportunities' array field.
      const serviceResponse = await MarketAnalysisTools.dataService.getMarketOpportunities(industryId, region);
      
      const opportunitiesArray = serviceResponse?.opportunities;

      if (!serviceResponse || !Array.isArray(opportunitiesArray)) {
         logger.warn(`Market opportunities data for ${industryId} in ${region} was not an array or was null/undefined.`);
         return createAPIResponse({
            industry: industryId, region, opportunityCount: 0, opportunities: [],
            recommendations: ['No opportunities found or data issue. Consider broadening search or checking data source.']
         }, serviceResponse?.source || 'opportunity-analyzer-no-data');
      }

       if (opportunitiesArray.length === 0) {
         logger.info(`No market opportunities found for ${industryId} in ${region} with given criteria.`);
      }
      
      const filteredOpportunities = opportunitiesArray.filter((opp: any) => {
        const competitionLevels = ['low', 'medium', 'high'];
        const maxCompetitionIndex = competitionLevels.indexOf(maxCompetition || 'high');
        const oppCompetitionIndex = competitionLevels.indexOf(opp.competitiveIntensity);
        const sizeCondition = minMarketSize ? (opp.marketSize >= minMarketSize) : true;
        return oppCompetitionIndex <= maxCompetitionIndex && sizeCondition;
      });

      const analysis = {
        industry: industryId,
        region,
        searchCriteria: {
          minMarketSize: minMarketSize ? formatCurrency(minMarketSize) : undefined,
          maxCompetition,
          timeframe
        },
        opportunityCount: filteredOpportunities.length,
        opportunities: filteredOpportunities.map((opp: any) => ({
          id: opp.id,
          title: opp.title,
          description: opp.description,
          marketSize: formatCurrency(opp.marketSize),
          growthPotential: formatPercentage(opp.growthPotential),
          competitiveIntensity: opp.competitiveIntensity,
          barrierToEntry: opp.barrierToEntry,
          timeToMarket: opp.timeToMarket,
          attractivenessScore: this.calculateAttractivenessScore(opp),
          riskFactors: opp.riskFactors,
          requirements: opp.requirements
        })).sort((a: any, b: any) => b.attractivenessScore - a.attractivenessScore),
        recommendations: filteredOpportunities.length > 0 ?
        [
          'Prioritize opportunities with highest attractiveness scores',
          'Conduct detailed market research for top opportunities',
          'Assess internal capabilities against requirements',
          'Develop go-to-market strategies for selected opportunities'
        ] :
        [
          'Consider broadening search criteria',
          'Look into adjacent industries',
          'Explore emerging market segments if no opportunities match current criteria'
        ]
      };

      return createAPIResponse(analysis, serviceResponse?.source || 'opportunity-analyzer');
    } catch (error) {
      return handleToolError(error, 'market_opportunities');
    }
  }

  private static calculateAttractivenessScore(opportunity: any): number {
    let score = 0;
    score += Math.min(40, ((opportunity.marketSize || 0) / 1000000000) * 10); // Score based on market size in Billions
    score += (opportunity.growthPotential || 0) * 3000; // Growth potential (e.g., 0.10 for 10%)
    const competitionScore = opportunity.competitiveIntensity === 'low' ? 20 : 
                           opportunity.competitiveIntensity === 'medium' ? 10 : 5;
    score += competitionScore;
    const barrierScore = opportunity.barrierToEntry === 'low' ? 10 : 
                        opportunity.barrierToEntry === 'medium' ? 5 : 2;
    score += barrierScore;
    return Math.round(Math.min(100, Math.max(0, score))); // Ensure score is between 0 and 100
  }
}
