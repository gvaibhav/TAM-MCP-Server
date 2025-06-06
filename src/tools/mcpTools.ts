import { 
  IndustrySearchInput, 
  IndustrySearchResult,
  IndustryDataInput,
  IndustryData,
  MarketSizeInput,
  MarketSizeResult,
  TamCalculationInput,
  TamResult,
  SamCalculationInput,
  SamResult,
  MarketSegmentsInput,
  MarketSegmentHierarchy,
  MarketForecastInput,
  MarketForecast,
  MarketComparisonInput,
  MarketComparison,
  ValidationInput,
  ValidationResult,
  OpportunityAnalysisInput,
  OpportunityAnalysis
} from '../types/schemas.js';
import { Logger } from '../utils/logger.js';
import { DataService } from '../services/dataService.js';
import { CacheService } from '../services/cacheService.js';

export class MCPTools {
  private logger: Logger;
  private dataService: DataService;
  private cacheService: CacheService;

  constructor(dataService: DataService, cacheService: CacheService) {
    this.logger = Logger.getInstance('MCPTools');
    this.dataService = dataService;
    this.cacheService = cacheService;
  }

  /**
   * Search for industries by name, NAICS code, SIC code, or keywords
   */
  async industrySearch(input: IndustrySearchInput): Promise<IndustrySearchResult[]> {
    this.logger.info('Executing industry_search', { query: input.query, limit: input.limit });

    const cacheKey = `industry_search:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<IndustrySearchResult[]>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached industry search results');
      return cached;
    }

    try {
      // Mock implementation - replace with actual data service calls
      const results: IndustrySearchResult[] = await this.dataService.searchIndustries(input);
      
      // Cache results for 1 hour
      await this.cacheService.set(cacheKey, results, 3600);
      
      this.logger.info('Industry search completed', { resultsCount: results.length });
      return results;
    } catch (error) {
      this.logger.error('Industry search failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to search industries');
    }
  }

  /**
   * Get detailed information about a specific industry
   */
  async getIndustryData(input: IndustryDataInput): Promise<IndustryData> {
    this.logger.info('Executing get_industry_data', { industryId: input.industry_id });

    const cacheKey = `industry_data:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<IndustryData>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached industry data');
      return cached;
    }

    try {
      const data = await this.dataService.getIndustryData(input);
      
      // Cache for 24 hours as specified in requirements
      await this.cacheService.set(cacheKey, data, 86400);
      
      this.logger.info('Industry data retrieved successfully');
      return data;
    } catch (error) {
      this.logger.error('Get industry data failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to retrieve industry data');
    }
  }

  /**
   * Retrieve market size data for an industry
   */
  async getMarketSize(input: MarketSizeInput): Promise<MarketSizeResult> {
    this.logger.info('Executing get_market_size', { industry: input.industry });

    const cacheKey = `market_size:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<MarketSizeResult>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached market size data');
      return cached;
    }

    try {
      const result = await this.dataService.getMarketSize(input);
      
      // Cache for 12 hours
      await this.cacheService.set(cacheKey, result, 43200);
      
      this.logger.info('Market size data retrieved successfully');
      return result;
    } catch (error) {
      this.logger.error('Get market size failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to retrieve market size data');
    }
  }

  /**
   * Calculate total addressable market
   */
  async calculateTam(input: TamCalculationInput): Promise<TamResult> {
    this.logger.info('Executing calculate_tam', { 
      industry: input.industry, 
      methodology: input.methodology 
    });

    const cacheKey = `tam_calculation:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<TamResult>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached TAM calculation');
      return cached;
    }

    try {
      const result = await this.dataService.calculateTam(input);
      
      // Cache for 6 hours due to calculation complexity
      await this.cacheService.set(cacheKey, result, 21600);
      
      this.logger.info('TAM calculation completed successfully', { 
        tamEstimate: result.tam_estimate 
      });
      return result;
    } catch (error) {
      this.logger.error('TAM calculation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to calculate TAM');
    }
  }

  /**
   * Calculate serviceable addressable market
   */
  async calculateSam(input: SamCalculationInput): Promise<SamResult> {
    this.logger.info('Executing calculate_sam', { 
      tamEstimate: input.tam_result.tam_estimate 
    });

    const cacheKey = `sam_calculation:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<SamResult>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached SAM calculation');
      return cached;
    }

    try {
      const result = await this.dataService.calculateSam(input);
      
      // Cache for 6 hours
      await this.cacheService.set(cacheKey, result, 21600);
      
      this.logger.info('SAM calculation completed successfully', { 
        samEstimate: result.sam_estimate 
      });
      return result;
    } catch (error) {
      this.logger.error('SAM calculation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to calculate SAM');
    }
  }

  /**
   * Get segment breakdown for an industry
   */
  async getMarketSegments(input: MarketSegmentsInput): Promise<MarketSegmentHierarchy> {
    this.logger.info('Executing get_market_segments', { 
      industry: input.industry,
      segmentationType: input.segmentation_type 
    });

    const cacheKey = `market_segments:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<MarketSegmentHierarchy>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached market segments');
      return cached;
    }

    try {
      const result = await this.dataService.getMarketSegments(input);
      
      // Cache for 24 hours
      await this.cacheService.set(cacheKey, result, 86400);
      
      this.logger.info('Market segments retrieved successfully', { 
        segmentsCount: result.segments.length 
      });
      return result;
    } catch (error) {
      this.logger.error('Get market segments failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to retrieve market segments');
    }
  }

  /**
   * Generate market forecasts using trend analysis
   */
  async forecastMarket(input: MarketForecastInput): Promise<MarketForecast> {
    this.logger.info('Executing forecast_market', { 
      industry: input.industry,
      forecastYears: input.forecast_years,
      scenario: input.scenario_type 
    });

    const cacheKey = `market_forecast:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<MarketForecast>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached market forecast');
      return cached;
    }

    try {
      const result = await this.dataService.forecastMarket(input);
      
      // Cache for 12 hours
      await this.cacheService.set(cacheKey, result, 43200);
      
      this.logger.info('Market forecast completed successfully', { 
        forecastYears: result.forecast_data.length 
      });
      return result;
    } catch (error) {
      this.logger.error('Market forecast failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to generate market forecast');
    }
  }

  /**
   * Compare multiple industries or segments
   */
  async compareMarkets(input: MarketComparisonInput): Promise<MarketComparison> {
    this.logger.info('Executing compare_markets', { 
      industriesCount: input.industries.length,
      metrics: input.comparison_metrics 
    });

    const cacheKey = `market_comparison:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<MarketComparison>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached market comparison');
      return cached;
    }

    try {
      const result = await this.dataService.compareMarkets(input);
      
      // Cache for 6 hours
      await this.cacheService.set(cacheKey, result, 21600);
      
      this.logger.info('Market comparison completed successfully', { 
        industriesCompared: result.comparison_data.length 
      });
      return result;
    } catch (error) {
      this.logger.error('Market comparison failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to compare markets');
    }
  }

  /**
   * Validate and cross-check market size estimates
   */
  async validateMarketData(input: ValidationInput): Promise<ValidationResult> {
    this.logger.info('Executing validate_market_data', { 
      industry: input.industry,
      marketSize: input.market_size,
      year: input.year 
    });

    const cacheKey = `market_validation:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<ValidationResult>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached validation result');
      return cached;
    }

    try {
      const result = await this.dataService.validateMarketData(input);
      
      // Cache for 2 hours due to dynamic nature of validation
      await this.cacheService.set(cacheKey, result, 7200);
      
      this.logger.info('Market data validation completed', { 
        isValid: result.is_valid,
        confidenceScore: result.confidence_score 
      });
      return result;
    } catch (error) {
      this.logger.error('Market validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to validate market data');
    }
  }

  /**
   * Identify emerging market opportunities
   */
  async getMarketOpportunities(input: OpportunityAnalysisInput): Promise<OpportunityAnalysis> {
    this.logger.info('Executing get_market_opportunities', { 
      growthThreshold: input.growth_threshold,
      timeHorizon: input.time_horizon 
    });

    const cacheKey = `market_opportunities:${JSON.stringify(input)}`;
    const cached = await this.cacheService.get<OpportunityAnalysis>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached opportunity analysis');
      return cached;
    }

    try {
      const result = await this.dataService.getMarketOpportunities(input);
      
      // Cache for 4 hours
      await this.cacheService.set(cacheKey, result, 14400);
      
      this.logger.info('Market opportunities analysis completed', { 
        opportunitiesFound: result.opportunities.length 
      });
      return result;
    } catch (error) {
      this.logger.error('Market opportunities analysis failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to analyze market opportunities');
    }
  }

  /**
   * Get all available tools for MCP discovery
   */
  getToolDefinitions() {
    return [
      {
        name: 'industry_search',
        description: 'Search for industries by name, NAICS code, SIC code, or keywords with fuzzy matching support',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Search query for industry name or code'
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              default: 10,
              description: 'Maximum number of results to return'
            },
            filters: {
              type: 'object',
              properties: {
                naics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by NAICS codes'
                },
                sic: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by SIC codes'
                }
              },
              description: 'Optional filters for search results'
            },
            fuzzy_match: {
              type: 'boolean',
              default: true,
              description: 'Enable fuzzy matching for search queries'
            },
            language: {
              type: 'string',
              default: 'en',
              description: 'Language for search results'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_industry_data',
        description: 'Get detailed information about a specific industry including trends, key players, and ESG data',
        inputSchema: {
          type: 'object',
          properties: {
            industry_id: {
              type: 'string',
              minLength: 1,
              description: 'Unique identifier for the industry'
            },
            include_trends: {
              type: 'boolean',
              default: false,
              description: 'Include industry trends in the response'
            },
            include_players: {
              type: 'boolean',
              default: false,
              description: 'Include key market players in the response'
            },
            include_esg: {
              type: 'boolean',
              default: false,
              description: 'Include ESG scoring data in the response'
            }
          },
          required: ['industry_id']
        }
      },
      {
        name: 'get_market_size',
        description: 'Retrieve market size data for an industry with historical trends and growth rates',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              minLength: 1,
              description: 'Industry name or identifier'
            },
            year_range: {
              type: 'array',
              items: { type: 'integer' },
              minItems: 2,
              maxItems: 2,
              description: 'Year range for historical data [start_year, end_year]'
            },
            regions: {
              type: 'array',
              items: { type: 'string' },
              default: ['global'],
              description: 'Geographic regions to include'
            },
            currency: {
              type: 'string',
              default: 'USD',
              description: 'Currency for market size values'
            },
            segments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Industry segments to include'
            },
            adjust_inflation: {
              type: 'boolean',
              default: false,
              description: 'Adjust historical data for inflation'
            }
          },
          required: ['industry']
        }
      },
      {
        name: 'calculate_tam',
        description: 'Calculate total addressable market with multiple methodologies and scenario analysis',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              minLength: 1,
              description: 'Industry name or identifier'
            },
            regions: {
              type: 'array',
              items: { type: 'string' },
              default: ['global'],
              description: 'Geographic regions to include in TAM calculation'
            },
            base_year: {
              type: 'integer',
              description: 'Base year for TAM calculation'
            },
            methodology: {
              type: 'string',
              enum: ['top-down', 'bottom-up', 'hybrid'],
              default: 'hybrid',
              description: 'Calculation methodology to use'
            },
            scenarios: {
              type: 'object',
              properties: {
                conservative: { type: 'boolean', default: true },
                optimistic: { type: 'boolean', default: true },
                pessimistic: { type: 'boolean', default: true }
              },
              description: 'Scenarios to include in calculation'
            },
            addressable_population: {
              type: 'number',
              description: 'Total addressable population size'
            },
            penetration_rate: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Expected market penetration rate'
            }
          },
          required: ['industry']
        }
      },
      {
        name: 'calculate_sam',
        description: 'Calculate serviceable addressable market by applying constraints to TAM',
        inputSchema: {
          type: 'object',
          properties: {
            tam_result: {
              type: 'object',
              description: 'TAM calculation result to base SAM calculation on'
            },
            target_segments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target market segments to focus on'
            },
            geographic_constraints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Geographic limitations or focus areas'
            },
            regulatory_barriers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Regulatory constraints affecting market access'
            },
            competitive_filters: {
              type: 'object',
              properties: {
                exclude_segments: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Market segments to exclude due to competition'
                },
                market_share_threshold: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Minimum market share threshold'
                }
              },
              description: 'Competitive filtering criteria'
            },
            business_model_constraints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Business model limitations affecting addressability'
            }
          },
          required: ['tam_result', 'target_segments']
        }
      },
      {
        name: 'get_market_segments',
        description: 'Get segment breakdown for an industry with hierarchical data and growth projections',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              minLength: 1,
              description: 'Industry name or identifier'
            },
            segmentation_type: {
              type: 'string',
              enum: ['geographic', 'demographic', 'psychographic', 'behavioral', 'product'],
              description: 'Type of market segmentation to retrieve'
            },
            depth_level: {
              type: 'integer',
              minimum: 1,
              maximum: 4,
              default: 2,
              description: 'Depth of segmentation hierarchy (1-4 levels)'
            },
            include_trends: {
              type: 'boolean',
              default: false,
              description: 'Include trend data for each segment'
            }
          },
          required: ['industry', 'segmentation_type']
        }
      },
      {
        name: 'forecast_market',
        description: 'Generate market forecasts using trend analysis with confidence intervals',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              minLength: 1,
              description: 'Industry name or identifier'
            },
            forecast_years: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Number of years to forecast'
            },
            scenario_type: {
              type: 'string',
              enum: ['conservative', 'optimistic', 'pessimistic'],
              default: 'conservative',
              description: 'Forecast scenario type'
            },
            confidence_level: {
              type: 'number',
              minimum: 0.5,
              maximum: 0.99,
              default: 0.95,
              description: 'Statistical confidence level for forecast intervals'
            }
          },
          required: ['industry', 'forecast_years']
        }
      },
      {
        name: 'compare_markets',
        description: 'Compare multiple industries or segments across various metrics',
        inputSchema: {
          type: 'object',
          properties: {
            industries: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 10,
              description: 'List of industries to compare'
            },
            comparison_metrics: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['size', 'growth', 'profitability', 'competition', 'innovation']
              },
              description: 'Metrics to use for comparison'
            },
            time_period: {
              type: 'array',
              items: { type: 'integer' },
              minItems: 2,
              maxItems: 2,
              description: 'Time period for comparison [start_year, end_year]'
            },
            normalize: {
              type: 'boolean',
              default: false,
              description: 'Normalize metrics for fair comparison'
            }
          },
          required: ['industries', 'comparison_metrics', 'time_period']
        }
      },
      {
        name: 'validate_market_data',
        description: 'Validate and cross-check market size estimates against multiple sources',
        inputSchema: {
          type: 'object',
          properties: {
            market_size: {
              type: 'number',
              minimum: 0,
              description: 'Market size estimate to validate'
            },
            industry: {
              type: 'string',
              minLength: 1,
              description: 'Industry name or identifier'
            },
            year: {
              type: 'integer',
              description: 'Year of the market size estimate'
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of sources to cross-check against'
            }
          },
          required: ['market_size', 'industry', 'year']
        }
      },
      {
        name: 'get_market_opportunities',
        description: 'Identify emerging market opportunities based on growth criteria and risk assessment',
        inputSchema: {
          type: 'object',
          properties: {
            industries: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of industries to focus on'
            },
            growth_threshold: {
              type: 'number',
              default: 0.05,
              description: 'Minimum growth rate threshold for opportunities (5% default)'
            },
            time_horizon: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 5,
              description: 'Time horizon for opportunity analysis in years'
            }
          }
        }
      }
    ];
  }
}
