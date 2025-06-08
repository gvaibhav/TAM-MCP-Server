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
  ValidationResult
} from '../types/index.js';
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
  static getToolDefinitions(): Tool[] {
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
      const industries = await MarketAnalysisTools.dataService.searchIndustries(query, limit);
      
      const results = industries.map((industry: any) => ({
        id: industry.id,
        name: industry.name,
        description: industry.description,
        naicsCode: industry.naicsCode,
        sicCode: industry.sicCode,
        marketSize: industry.keyMetrics.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
        growthRate: industry.keyMetrics.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
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
        'industry-database'
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

      const industry = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      if (!industry) {
        return createErrorResponse(`Industry not found: ${industryId}`);
      }

      const marketSize = region ? 
        await MarketAnalysisTools.dataService.getMarketSize(industryId, region) :
        await MarketAnalysisTools.dataService.getMarketSize(industryId);

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
            marketSize: industry.keyMetrics.marketSize ? formatCurrency(industry.keyMetrics.marketSize) : 'N/A',
            growthRate: industry.keyMetrics.growthRate ? formatPercentage(industry.keyMetrics.growthRate) : 'N/A',
            cagr: industry.keyMetrics.cagr ? formatPercentage(industry.keyMetrics.cagr) : 'N/A',
            volatility: industry.keyMetrics.volatility ? formatPercentage(industry.keyMetrics.volatility) : 'N/A',
            regionalSize: marketSize ? formatCurrency(marketSize.value) : undefined,
            dataConfidence: marketSize ? formatPercentage(marketSize.confidenceScore) : undefined
          }
        })
      };

      return createAPIResponse(result, 'industry-database');
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

      const marketData = await MarketAnalysisTools.dataService.getMarketSize(industryId, region, year);
      if (!marketData) {
        return createErrorResponse(`Market size data not available for industry: ${industryId}`);
      }

      // Currency conversion would happen here in a real implementation
      const result = {
        industry: industryId,
        marketSize: {
          value: marketData.value,
          formattedValue: formatCurrency(marketData.value, currency),
          currency,
          year: marketData.year,
          region: marketData.region
        },
        methodology: marketData.methodology,
        confidence: {
          score: marketData.confidenceScore,
          level: marketData.confidenceScore > 0.8 ? 'High' : 
                 marketData.confidenceScore > 0.6 ? 'Medium' : 'Low'
        },
        sources: marketData.sources,
        segments: marketData.segments?.map((segment: any) => ({
          name: segment.name,
          value: formatCurrency(segment.value, currency),
          percentage: formatPercentage(segment.percentage),
          growthRate: formatPercentage(segment.growthRate),
          description: segment.description
        })),
        metadata: {
          dataRecency: marketData.year === new Date().getFullYear() ? 'Current' : 'Historical',
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      };

      return createAPIResponse(result, 'market-data-api');
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

      const industry = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      const marketData = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      
      if (!industry || !marketData) {
        return createErrorResponse(`Unable to calculate TAM: industry or market data not found`);
      }

      let tamValue: number;
      let methodology: string;
      const assumptions: string[] = [];

      if (population && penetrationRate && averageSpending) {
        // Bottom-up calculation
        tamValue = population * penetrationRate * averageSpending;
        methodology = 'Bottom-up: Population × Penetration Rate × Average Spending';
        assumptions.push(`Target population: ${population.toLocaleString()}`);
        assumptions.push(`Penetration rate: ${formatPercentage(penetrationRate)}`);
        assumptions.push(`Average annual spending: ${formatCurrency(averageSpending)}`);
      } else {
        // Top-down calculation using market data
        tamValue = marketData.value;
        methodology = 'Top-down: Based on existing market size data';
        assumptions.push(`Current market size: ${formatCurrency(marketData.value)}`);
        assumptions.push(`Growth rate: ${formatPercentage(industry.keyMetrics.growthRate || 0.05)}`);
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
        dataRecency: marketData.year === new Date().getFullYear() ? 0.9 : 0.7,
        sourceReliability: 0.8,
        dataCompleteness: Object.keys(breakdown).length > 0 ? 0.9 : 0.7,
        methodologyRobustness: Object.keys(breakdown).length > 0 ? 0.9 : 0.8
      });

      const result: TAMCalculation = {
        totalAddressableMarket: tamValue,
        methodology,
        assumptions,
        scenarios,
        breakdown,
        confidenceScore,
        sources: marketData.sources
      };

      return createAPIResponse(result, 'tam-calculator');
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

      // Calculate SAM based on constraints
      let samMultiplier = 1.0;
      
      // Reduce by geographic constraints
      if (geographicConstraints.length > 0) {
        samMultiplier *= 0.6; // Assume geographic constraints reduce addressable market by 40%
      }
      
      // Reduce by competitive factors
      if (competitiveFactors.length > 0) {
        const competitiveReduction = Math.min(0.5, competitiveFactors.length * 0.1);
        samMultiplier *= (1 - competitiveReduction);
      }
      
      // Further reduce by target segments specificity
      if (targetSegments.length > 0 && targetSegments.length < 5) {
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
      validatePositiveNumber(minSegmentSize, 'Minimum segment size');

      const marketData = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      if (!marketData || !marketData.segments) {
        return createErrorResponse(`Market segmentation data not available for industry: ${industryId}`);
      }

      const filteredSegments = marketData.segments.filter((segment: any) => segment.value >= minSegmentSize);
      
      const segmentAnalysis = {
        industry: industryId,
        segmentationType,
        region,
        totalMarketSize: formatCurrency(marketData.value),
        segmentCount: filteredSegments.length,
        segments: filteredSegments.map((segment: any) => ({
          name: segment.name,
          size: formatCurrency(segment.value),
          marketShare: formatPercentage(segment.percentage),
          growthRate: formatPercentage(segment.growthRate),
          description: segment.description,
          attractiveness: segment.growthRate > 0.15 ? 'High' : 
                         segment.growthRate > 0.08 ? 'Medium' : 'Low'
        })),
        insights: {
          largestSegment: filteredSegments.reduce((prev: any, current: any) => 
            prev.value > current.value ? prev : current
          ).name,
          fastestGrowing: filteredSegments.reduce((prev: any, current: any) => 
            prev.growthRate > current.growthRate ? prev : current
          ).name,
          recommendations: [
            'Focus on high-growth segments for maximum opportunity',
            'Consider market entry barriers for each segment',
            'Analyze competitive landscape within target segments'
          ]
        }
      };

      return createAPIResponse(segmentAnalysis, 'market-segmentation-api');
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
      if (forecasts.length === 0) {
        return createErrorResponse(`Unable to generate forecast for industry: ${industryId}`);
      }

      const currentMarketSize = await MarketAnalysisTools.dataService.getMarketSize(industryId, region);
      const industry = await MarketAnalysisTools.dataService.getIndustryById(industryId);
      
      if (!currentMarketSize || !industry) {
        return createErrorResponse(`Base data not available for forecasting`);
      }

      const cagr = calculateCAGR(
        currentMarketSize.value,
        forecasts[forecasts.length - 1].projectedSize,
        years
      );

      const forecastAnalysis = {
        industry: industryId,
        region,
        baseYear: currentMarketSize.year,
        baseMarketSize: formatCurrency(currentMarketSize.value),
        forecastPeriod: `${currentMarketSize.year + 1}-${currentMarketSize.year + years}`,
        cagr: formatPercentage(cagr),
        projections: forecasts.map((forecast: any) => ({
          year: forecast.year,
          marketSize: formatCurrency(forecast.projectedSize),
          growthRate: formatPercentage(forecast.growthRate),
          confidence: formatPercentage(forecast.confidence)
        })),
        keyFactors: factors.length > 0 ? factors : forecasts[0].factors,
        scenarios: includeScenarios ? {
          conservative: forecasts.map((f: any) => ({
            year: f.year,
            size: formatCurrency(f.projectedSize * 0.8)
          })),
          realistic: forecasts.map((f: any) => ({
            year: f.year,
            size: formatCurrency(f.projectedSize)
          })),
          optimistic: forecasts.map((f: any) => ({
            year: f.year,
            size: formatCurrency(f.projectedSize * 1.3)
          }))
        } : undefined,
        riskFactors: [
          'Economic recession or downturn',
          'Regulatory changes',
          'Technological disruption',
          'Market saturation',
          'Competitive pressure'
        ]
      };

      return createAPIResponse(forecastAnalysis, 'forecasting-engine');
    } catch (error) {
      return handleToolError(error, 'market_forecasting');
    }
  }

  static async marketComparison(params: z.infer<typeof MarketComparisonSchema>): Promise<APIResponse<MarketComparison>> {
    try {
      const { industryIds, region } = MarketComparisonSchema.parse(params);
      
      validateRegion(region);

      const marketData = await Promise.all(
        industryIds.map(async (id: string) => {
          const industry = await MarketAnalysisTools.dataService.getIndustryById(id);
          const marketSize = await MarketAnalysisTools.dataService.getMarketSize(id, region);
          
          return {
            id,
            industry,
            marketSize
          };
        })
      );

      const validMarkets = marketData.filter((m: any) => m.industry && m.marketSize);
      
      if (validMarkets.length < 2) {
        return createErrorResponse('Insufficient data for market comparison');
      }

      const markets = validMarkets.map((m: any) => ({
        name: m.industry!.name,
        currentSize: m.marketSize!.value,
        growthRate: m.industry!.keyMetrics.growthRate || 0,
        cagr: m.industry!.keyMetrics.cagr || 0,
        region
      }));

      const totalMarketSize = markets.reduce((sum: number, market: any) => sum + market.currentSize, 0);
      const avgGrowthRate = markets.reduce((sum: number, market: any) => sum + market.growthRate, 0) / markets.length;

      const analysis = `Market comparison shows ${markets[0].name} leading with ${formatCurrency(markets[0].currentSize)} market size. ` +
        `Average growth rate across markets is ${formatPercentage(avgGrowthRate)}. ` +
        `Total combined market size is ${formatCurrency(totalMarketSize)}.`;

      const recommendations = [
        'Focus on highest growth markets for long-term value',
        'Consider market size vs. competition balance',
        'Evaluate barriers to entry for each market',
        'Assess synergies between different markets'
      ];

      const result: MarketComparison = {
        markets,
        analysis,
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

      // Validate based on data type
      switch (dataType) {
        case 'market-size':
          if (!data.value || typeof data.value !== 'number' || data.value <= 0) {
            issues.push('Market size value must be a positive number');
            dataQuality = 'low';
          }
          if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 10) {
            issues.push('Invalid or missing year');
            dataQuality = dataQuality === 'high' ? 'medium' : 'low';
          }
          if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
            issues.push('Missing or empty data sources');
            suggestions.push('Add credible data sources for verification');
            dataQuality = dataQuality === 'high' ? 'medium' : dataQuality;
          }
          break;

        case 'industry-data':
          if (!data.name || typeof data.name !== 'string') {
            issues.push('Industry name is required');
            dataQuality = 'low';
          }
          if (!data.description) {
            suggestions.push('Add industry description for better context');
          }
          break;

        case 'forecast':
          if (!data.projections || !Array.isArray(data.projections)) {
            issues.push('Forecast projections are required');
            dataQuality = 'low';
          }
          break;

        case 'tam-calculation':
          if (!data.totalAddressableMarket || data.totalAddressableMarket <= 0) {
            issues.push('TAM value must be positive');
            dataQuality = 'low';
          }
          if (!data.methodology) {
            issues.push('Calculation methodology must be specified');
            dataQuality = dataQuality === 'high' ? 'medium' : 'low';
          }
          break;
      }

      // Additional strict mode validations
      if (strictMode) {
        if (data.confidenceScore && (data.confidenceScore < 0 || data.confidenceScore > 1)) {
          issues.push('Confidence score must be between 0 and 1');
        }
        if (data.currency && !MarketAnalysisTools.dataService.getSupportedCurrencies().includes(data.currency)) {
          issues.push('Unsupported currency code');
        }
      }

      // General quality checks
      if (dataQuality === 'high' && issues.length === 0) {
        suggestions.push('Data quality is good - consider regular updates');
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
      validatePositiveNumber(minMarketSize, 'Minimum market size');

      const opportunities = await MarketAnalysisTools.dataService.getMarketOpportunities(industryId, region, minMarketSize);
      
      // Handle empty result (industry not found or no opportunities)
      if (!opportunities || opportunities.length === 0) {
        return createErrorResponse(`Industry not found: ${industryId}`);
      }
      
      // Filter by competition level
      const filteredOpportunities = opportunities.filter((opp: any) => {
        const competitionLevels = ['low', 'medium', 'high'];
        const maxCompetitionIndex = competitionLevels.indexOf(maxCompetition);
        const oppCompetitionIndex = competitionLevels.indexOf(opp.competitiveIntensity);
        return oppCompetitionIndex <= maxCompetitionIndex;
      });

      const analysis = {
        industry: industryId,
        region,
        searchCriteria: {
          minMarketSize: formatCurrency(minMarketSize),
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
        recommendations: filteredOpportunities.length > 0 ? [
          'Prioritize opportunities with highest attractiveness scores',
          'Conduct detailed market research for top opportunities',
          'Assess internal capabilities against requirements',
          'Develop go-to-market strategies for selected opportunities'
        ] : [
          'Consider broadening search criteria',
          'Look into adjacent industries',
          'Explore emerging market segments'
        ]
      };

      return createAPIResponse(analysis, 'opportunity-analyzer');
    } catch (error) {
      return handleToolError(error, 'market_opportunities');
    }
  }

  private static calculateAttractivenessScore(opportunity: any): number {
    let score = 0;
    
    // Market size contribution (40%)
    score += Math.min(40, (opportunity.marketSize / 1000000000) * 10); // $1B = 10 points
    
    // Growth potential contribution (30%)
    score += opportunity.growthPotential * 30;
    
    // Competition factor (20% - lower competition = higher score)
    const competitionScore = opportunity.competitiveIntensity === 'low' ? 20 : 
                           opportunity.competitiveIntensity === 'medium' ? 10 : 5;
    score += competitionScore;
    
    // Barrier to entry factor (10% - lower barriers = higher score)
    const barrierScore = opportunity.barrierToEntry === 'low' ? 10 : 
                        opportunity.barrierToEntry === 'medium' ? 5 : 2;
    score += barrierScore;
    
    return Math.round(score);
  }
}
