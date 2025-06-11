import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.js';
import { DataService } from '../../src/services/dataService.js';
import { CacheService } from '../../src/services/cacheService.js';

// Mock the DataService module
vi.mock('../../src/services/dataService.js', () => {
  return {
    DataService: vi.fn(() => ({
      searchIndustries: vi.fn(),
      getIndustryData: vi.fn(),
      getMarketSize: vi.fn(),
      calculateTam: vi.fn(),
      calculateSam: vi.fn(),
      getMarketSegments: vi.fn(),
      forecastMarket: vi.fn(),
      compareMarkets: vi.fn(),
      validateMarketData: vi.fn(),
      getMarketOpportunities: vi.fn()
    }))
  };
});

// Mock the CacheService module
vi.mock('../../src/services/cacheService.js', () => {
  return {
    CacheService: vi.fn(() => ({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true),
      clear: vi.fn().mockResolvedValue(true)
    }))
  };
});

describe('MCPTools - Advanced Coverage Tests', () => {
  let mcpTools;
  let mockDataService;
  let mockCacheService;

  const mockIndustry = {
    id: 'tech-software',
    name: 'Software & Technology',
    description: 'Software development, SaaS',
    naics_code: '541511',
    sic_code: '7372',
    parent_industry: 'technology',
    sub_industries: ['saas', 'enterprise-software'],
    key_metrics: {
      market_size_usd: 659000000000,
      employment: 2800000,
      establishments: 285000,
      avg_wage: 95000
    },
    trends: {
      growth_rate_5yr: 0.085,
      volatility_index: 0.25,
      seasonal_patterns: [1.0, 1.1, 0.9, 1.0]
    },
    confidence_score: 0.85
  };

  const mockMarketSize = {
    industry: 'tech-software',
    data_points: [
      {
        year: 2025,
        market_size: 659000000000,
        currency: 'USD',
        region: 'global',
        growth_rate_yoy: 0.11,
        confidence_interval: { lower: 600000000000, upper: 720000000000 }
      }
    ],
    cagr_5yr: 0.085,
    volatility_metrics: {
      standard_deviation: 45000000000,
      coefficient_of_variation: 0.068
    },
    data_sources: ['IBISWorld', 'Statista', 'Government Statistics'],
    methodology: 'hybrid',
    last_updated: new Date()
  };

  const mockTamResult = {
    base_case: {
      tam_usd: 659000000000,
      methodology: 'top-down',
      confidence_score: 0.85
    },
    scenarios: {
      optimistic: {
        tam_usd: 730000000000,
        upside_factors: ['AI Integration', 'Cloud Migration']
      },
      conservative: {
        tam_usd: 590000000000,
        risk_factors: ['Economic Downturn', 'Market Saturation']
      }
    },
    calculation_breakdown: {
      addressable_population: 5000000,
      penetration_rate: 0.7,
      average_revenue_per_user: 1800
    }
  };

  const mockSamResult = {
    sam_usd: 150000000000,
    sam_percentage_of_tam: 0.15,
    som_estimate: {
      realistic_usd: 50000000000,
      percentage_of_sam: 0.25,
      time_to_achieve_years: 3
    },
    constraint_analysis: {
      regulatory_impact: 0.9,
      competitive_impact: 0.7,
      operational_impact: 0.85,
      financial_viability: 0.8
    }
  };

  const mockOpportunities = {
    opportunities: [
      {
        industry: 'AI/ML',
        opportunity_score: 95,
        market_size: 150000000000,
        growth_potential: 0.25,
        competitive_intensity: 'medium',
        barriers_to_entry: 'high',
        risk_factors: ['Regulatory uncertainty', 'Talent shortage'],
        time_to_opportunity: 2
      }
    ],
    methodology: 'Multi-factor opportunity scoring',
    filters_applied: {
      growth_threshold: 0.15,
      time_horizon: 5,
      industries: ['tech-software']
    }
  };

  const mockMarketForecast = {
    forecast_data: [
      { year: 2026, projected_size: 730000000000, growth_rate: 0.11, confidence: 0.85 },
      { year: 2027, projected_size: 810000000000, growth_rate: 0.11, confidence: 0.82 },
      { year: 2028, projected_size: 900000000000, growth_rate: 0.11, confidence: 0.78 }
    ],
    cagr: 0.11,
    scenario_type: 'conservative',
    confidence_level: 0.95,
    accuracy_metrics: {
      mae: 15000000000,
      mape: 0.02,
      rmse: 20000000000,
      r_squared: 0.95
    }
  };

  const mockMarketSegments = {
    industry: 'tech-software',
    segmentation_type: 'product',
    total_market_size_usd: 659000000000,
    segments: [
      {
        id: 'enterprise-software',
        name: 'Enterprise Software',
        size_usd: 280000000000,
        percentage_of_parent: 0.42,
        growth_rate_5yr: 0.09,
        level: 1,
        sub_segments: ['crm', 'erp', 'hrm']
      },
      {
        id: 'saas-platforms',
        name: 'SaaS Platforms',
        size_usd: 220000000000,
        percentage_of_parent: 0.33,
        growth_rate_5yr: 0.15,
        level: 1,
        sub_segments: ['productivity', 'collaboration', 'analytics']
      }
    ]
  };

  const mockMarketComparison = {
    comparison_data: [
      {
        industry: 'tech-software',
        metrics: { size: 659000000000, growth: 0.11, profitability: 0.20 },
        rankings: { size: 1, growth: 2, profitability: 1 }
      },
      {
        industry: 'ecommerce',
        metrics: { size: 570000000000, growth: 0.14, profitability: 0.15 },
        rankings: { size: 2, growth: 1, profitability: 2 }
      }
    ],
    correlations: [
      { metric1: 'size', metric2: 'growth', correlation: -0.3 }
    ],
    insights: ['Larger markets tend to have lower growth rates'],
    methodology: 'Multi-criteria analysis with weighted scoring'
  };

  const mockValidationResult = {
    is_valid: true,
    confidence_score: 0.85,
    validation_results: [
      { source: 'IBISWorld', estimate: 650000000000, variance: 0.02 },
      { source: 'Statista', estimate: 670000000000, variance: 0.03 }
    ],
    recommendations: ['Data appears consistent across multiple sources'],
    last_validated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock services
    mockDataService = new DataService();
    mockCacheService = new CacheService();
    
    // Mock the static dataService property
    MarketAnalysisTools.dataService = mockDataService;
  });

  describe('getMarketOpportunities', () => {
    it('should handle and report provider errors', async () => {
      // Mock DataService method to throw error
      mockDataService.getMarketOpportunities.mockRejectedValue(
        new Error('Failed to fetch market opportunities')
      );
      
      // Call the method with valid parameters
      await expect(MarketAnalysisTools.marketOpportunities({
        industryId: 'tech-software',
        region: 'global',
        minMarketSize: 1000000000,
        maxCompetition: 0.7,
        timeframe: 5
      })).rejects.toThrow('Failed to analyze market opportunities');
    });
    
    it('should handle missing industry data', async () => {
      // Mock empty opportunities array
      mockDataService.getMarketOpportunities.mockResolvedValue({
        opportunities: [],
        methodology: 'Multi-factor opportunity scoring',
        filters_applied: { growth_threshold: 0.15, time_horizon: 5, industries: ['nonexistent-industry'] }
      });
      
      // Call the method
      const result = await MarketAnalysisTools.marketOpportunities({
        industries: ['nonexistent-industry'],
        growth_threshold: 0.15,
        time_horizon: 5
      });
      
      // Verify empty results
      expect(result.opportunities).toEqual([]);
      expect(result.opportunities.length).toBe(0);
    });
    
    it('should correctly filter opportunities by growth threshold', async () => {
      // Mock market opportunities with different growth rates
      mockDataService.getMarketOpportunities.mockResolvedValue({
        opportunities: [
          {
            industry: 'AI/ML',
            opportunity_score: 95,
            market_size: 150000000000,
            growth_potential: 0.25,
            competitive_intensity: 'medium',
            barriers_to_entry: 'high',
            risk_factors: ['Regulatory uncertainty'],
            time_to_opportunity: 2
          }
        ],
        methodology: 'Multi-factor opportunity scoring',
        filters_applied: { growth_threshold: 0.2, time_horizon: 5, industries: ['tech-software'] }
      });
      
      // Call with high minimum growth threshold
      const result = await MarketAnalysisTools.marketOpportunities({
        industries: ['tech-software'],
        growth_threshold: 0.2,
        time_horizon: 5
      });
      
      // Verify filtering works
      expect(result.opportunities.length).toBe(1);
      expect(result.opportunities[0].growth_potential).toBeGreaterThanOrEqual(0.2);
    });
  });
  
  describe('forecastMarket', () => {
    it('should calculate and include growth percentages', async () => {
      // Mock forecast data
      mockDataService.forecastMarket.mockResolvedValue(mockMarketForecast);
      
      // Call the method
      const result = await MarketAnalysisTools.marketForecasting({
        industry: 'tech-software',
        forecast_years: 3,
        scenario_type: 'conservative',
        confidence_level: 0.95
      });
      
      // Verify growth percentages are calculated
      expect(result.forecast_data).toBeDefined();
      expect(result.cagr).toBeDefined();
      expect(result.forecast_data.length).toBe(3);
      
      // Verify forecasts include required fields
      result.forecast_data.forEach(forecast => {
        expect(forecast.projected_size).toBeDefined();
        expect(forecast.growth_rate).toBeDefined();
        expect(forecast.confidence).toBeDefined();
      });
    });
    
    it('should include scenario analysis when requested', async () => {
      // Mock forecast data with scenarios
      const mockForecastWithScenarios = {
        ...mockMarketForecast,
        scenarios: {
          optimistic: [
            { year: 2026, projected_size: 800000000000, growth_rate: 0.15 },
            { year: 2027, projected_size: 920000000000, growth_rate: 0.15 },
            { year: 2028, projected_size: 1058000000000, growth_rate: 0.15 }
          ],
          pessimistic: [
            { year: 2026, projected_size: 680000000000, growth_rate: 0.07 },
            { year: 2027, projected_size: 728000000000, growth_rate: 0.07 },
            { year: 2028, projected_size: 779000000000, growth_rate: 0.07 }
          ]
        }
      };
      
      mockDataService.forecastMarket.mockResolvedValue(mockForecastWithScenarios);
      
      // Call method with scenarios option
      const result = await MarketAnalysisTools.marketForecasting({
        industry: 'tech-software',
        forecast_years: 3,
        scenario_type: 'all',
        confidence_level: 0.95
      });
      
      // Verify scenarios are included
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.optimistic).toBeDefined();
      expect(result.scenarios.pessimistic).toBeDefined();
      expect(result.scenarios.optimistic.length).toBe(3);
      expect(result.scenarios.pessimistic.length).toBe(3);
    });
    
    it('should validate year parameter range', async () => {
      // Call with invalid (too high) years parameter - this should be caught by schema validation
      await expect(MarketAnalysisTools.marketForecasting({
        industry: 'tech-software',
        forecast_years: 15, // Too many years (max is 10)
        scenario_type: 'conservative'
      })).rejects.toThrow();
    });
  });
  
  describe('calculateTam', () => {
    it('should calculate TAM with top-down approach', async () => {
      // Mock necessary data
      mockDataService.calculateTam.mockResolvedValue(mockTamResult);
      
      // Call with top-down methodology
      const result = await MarketAnalysisTools.tamCalculator({
        industry: 'tech-software',
        regions: ['global'],
        methodology: 'top-down',
        scenarios: {
          optimistic: true,
          conservative: true,
          pessimistic: false
        }
      });
      
      // Verify TAM calculation
      expect(result.base_case.tam_usd).toBeDefined();
      expect(result.base_case.methodology).toBe('top-down');
      expect(result.scenarios.optimistic).toBeDefined();
      expect(result.scenarios.conservative).toBeDefined();
      expect(result.base_case.confidence_score).toBeDefined();
    });
    
    it('should calculate TAM with bottom-up approach', async () => {
      // Mock TAM result for bottom-up
      const mockBottomUpTam = {
        ...mockTamResult,
        base_case: {
          ...mockTamResult.base_case,
          methodology: 'bottom-up',
          tam_usd: 2000000000
        },
        calculation_breakdown: {
          segments: [
            { name: 'Enterprise', customers: 10000, avg_revenue: 100000, total: 1000000000 },
            { name: 'SMB', customers: 100000, avg_revenue: 10000, total: 1000000000 }
          ]
        }
      };
      
      mockDataService.calculateTam.mockResolvedValue(mockBottomUpTam);
      
      // Call with bottom-up methodology
      const result = await MarketAnalysisTools.tamCalculator({
        industry: 'tech-software',
        methodology: 'bottom-up',
        addressable_population: 110000,
        penetration_rate: 1.0
      });
      
      // Verify TAM calculation
      expect(result.base_case.tam_usd).toBe(2000000000);
      expect(result.base_case.methodology).toBe('bottom-up');
      expect(result.calculation_breakdown.segments).toBeDefined();
      expect(result.calculation_breakdown.segments.length).toBe(2);
    });
    
    it('should validate required parameters', async () => {
      // Call with missing required parameters
      await expect(MarketAnalysisTools.tamCalculator({})).rejects.toThrow();
    });
    
    it('should calculate TAM with hybrid approach', async () => {
      // Mock hybrid TAM result
      const mockHybridTam = {
        ...mockTamResult,
        base_case: {
          ...mockTamResult.base_case,
          methodology: 'hybrid'
        },
        calculation_breakdown: {
          top_down_estimate: 600000000000,
          bottom_up_estimate: 700000000000,
          weighted_average: 650000000000,
          confidence_weights: { top_down: 0.6, bottom_up: 0.4 }
        }
      };
      
      mockDataService.calculateTam.mockResolvedValue(mockHybridTam);
      
      // Call with hybrid methodology
      const result = await MarketAnalysisTools.tamCalculator({
        industry: 'tech-software',
        regions: ['global'],
        methodology: 'hybrid',
        addressable_population: 5000000,
        penetration_rate: 0.7
      });
      
      // Verify hybrid TAM calculation
      expect(result.base_case.tam_usd).toBeDefined();
      expect(result.base_case.methodology).toBe('hybrid');
      expect(result.calculation_breakdown.top_down_estimate).toBeDefined();
      expect(result.calculation_breakdown.bottom_up_estimate).toBeDefined();
    });
    
    it('should handle missing industry data', async () => {
      // Mock error for missing industry
      mockDataService.calculateTam.mockRejectedValue(
        new Error('Industry not found')
      );
      
      // Call method
      await expect(MarketAnalysisTools.tamCalculator({
        industry: 'nonexistent-industry',
        regions: ['global'],
        methodology: 'top-down'
      })).rejects.toThrow('Failed to calculate TAM');
    });
  });
  
  describe('calculateSam', () => {
    it('should calculate SAM based on TAM with percentage approach', async () => {
      // Mock SAM result
      const mockPercentageSam = {
        ...mockSamResult,
        sam_usd: 150000000,
        constraint_analysis: {
          ...mockSamResult.constraint_analysis,
          methodology: 'percentage',
          market_share_percentage: 15
        }
      };
      
      mockDataService.calculateSam.mockResolvedValue(mockPercentageSam);
      
      // Call SAM calculator
      const result = await MarketAnalysisTools.samCalculator({
        tam_result: mockTamResult,
        target_segments: ['enterprise', 'smb'],
        geographic_constraints: ['north-america', 'europe']
      });
      
      // Verify SAM calculation
      expect(result.sam_usd).toBe(150000000);
      expect(result.sam_percentage_of_tam).toBeDefined();
      expect(result.constraint_analysis.methodology).toBe('percentage');
    });
    
    it('should calculate SAM with segment approach', async () => {
      // Mock segment-based SAM
      const mockSegmentSam = {
        ...mockSamResult,
        sam_usd: 600000000,
        addressable_segments: [
          { name: 'North America', size_usd: 300000000, accessibility_score: 0.9 },
          { name: 'Europe', size_usd: 300000000, accessibility_score: 0.8 }
        ]
      };
      
      mockDataService.calculateSam.mockResolvedValue(mockSegmentSam);
      
      // Call with segment approach
      const result = await MarketAnalysisTools.samCalculator({
        tam_result: mockTamResult,
        target_segments: ['north-america', 'europe'],
        geographic_constraints: ['developed-markets']
      });
      
      // Verify SAM calculation focuses on selected segments
      expect(result.sam_usd).toBe(600000000);
      expect(result.addressable_segments).toBeDefined();
      expect(result.addressable_segments.length).toBe(2);
    });
    
    it('should calculate SOM when som parameters are provided', async () => {
      // Mock SAM result with SOM
      const mockSamWithSom = {
        ...mockSamResult,
        sam_usd: 200000000,
        som_estimate: {
          realistic_usd: 50000000,
          percentage_of_sam: 0.25,
          time_to_achieve_years: 3
        }
      };
      
      mockDataService.calculateSam.mockResolvedValue(mockSamWithSom);
      
      // Call with SOM parameters
      const result = await MarketAnalysisTools.samCalculator({
        tam_result: mockTamResult,
        target_segments: ['enterprise'],
        geographic_constraints: ['global']
      });
      
      // Verify both SAM and SOM calculation
      expect(result.sam_usd).toBe(200000000);
      expect(result.som_estimate.realistic_usd).toBe(50000000);
      expect(result.som_estimate.percentage_of_sam).toBe(0.25);
    });
    
    it('should validate required parameters', async () => {
      // Call with missing required parameters
      await expect(MarketAnalysisTools.samCalculator({})).rejects.toThrow();
    });
  });
  
  describe('compareMarkets', () => {
    it('should compare multiple industries', async () => {
      // Mock comparison data
      mockDataService.compareMarkets.mockResolvedValue(mockMarketComparison);
      
      // Call comparison with multiple industries
      const result = await MarketAnalysisTools.marketComparison({
        industries: ['tech-software', 'ecommerce'],
        comparison_metrics: ['size', 'growth'],
        time_period: [2020, 2025]
      });
      
      // Verify comparison results
      expect(result.comparison_data.length).toBe(2);
      expect(result.correlations).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.methodology).toBeDefined();
    });
    
    it('should handle missing industries', async () => {
      // Mock partial comparison with one invalid industry
      const mockPartialComparison = {
        comparison_data: [
          {
            industry: 'tech-software',
            metrics: { size: 659000000000, growth: 0.11 },
            rankings: { size: 1, growth: 1 }
          }
        ],
        invalid_industries: ['nonexistent'],
        correlations: [],
        insights: ['Only one valid industry found'],
        methodology: 'Partial comparison'
      };
      
      mockDataService.compareMarkets.mockResolvedValue(mockPartialComparison);
      
      // Call with one valid and one invalid industry
      const result = await MarketAnalysisTools.marketComparison({
        industries: ['tech-software', 'nonexistent'],
        comparison_metrics: ['size', 'growth'],
        time_period: [2020, 2025]
      });
      
      // Verify partial comparison results
      expect(result.comparison_data.length).toBe(1);
      expect(result.invalid_industries).toBeDefined();
      expect(result.invalid_industries.length).toBe(1);
    });
    
    it('should handle invalid parameters', async () => {
      // Call with insufficient industries (less than 2)
      await expect(MarketAnalysisTools.marketComparison({
        industries: ['tech-software'], // Only one industry
        comparison_metrics: ['size'],
        time_period: [2020, 2025]
      })).rejects.toThrow();
    });
  });
  
  describe('validateMarketData', () => {
    it('should validate market data quality', async () => {
      // Mock validation result
      mockDataService.validateMarketData.mockResolvedValue(mockValidationResult);
      
      // Call validation
      const result = await MarketAnalysisTools.dataValidation({
        market_size: 659000000000,
        industry: 'tech-software',
        year: 2025,
        sources: ['IBISWorld', 'Statista']
      });
      
      // Verify validation results
      expect(result.is_valid).toBe(true);
      expect(result.confidence_score).toBeDefined();
      expect(result.validation_results).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
    
    it('should validate custom data', async () => {
      // Mock validation for custom data
      const mockCustomValidation = {
        is_valid: true,
        confidence_score: 0.7,
        validation_results: [
          { check: 'range_validation', status: 'pass', message: 'Value within expected range' },
          { check: 'source_credibility', status: 'pass', message: 'Sources are credible' }
        ],
        recommendations: ['Consider additional validation sources'],
        last_validated: new Date()
      };
      
      mockDataService.validateMarketData.mockResolvedValue(mockCustomValidation);
      
      // Call with custom data to validate
      const result = await MarketAnalysisTools.dataValidation({
        market_size: 2000000000,
        industry: 'custom-industry',
        year: 2025,
        sources: ['Custom Research']
      });
      
      // Verify validation of custom data
      expect(result.is_valid).toBe(true);
      expect(result.confidence_score).toBeDefined();
      expect(result.validation_results).toBeDefined();
      expect(result.validation_results.find(v => v.check === 'source_credibility')).toBeDefined();
    });
    
    it('should handle validation errors', async () => {
      // Mock validation with issues
      const mockFailedValidation = {
        is_valid: false,
        confidence_score: 0.3,
        validation_results: [
          { check: 'range_validation', status: 'fail', message: 'Value outside expected range' },
          { check: 'growth_rate_validation', status: 'fail', message: 'Growth rate unrealistic' }
        ],
        recommendations: ['Verify data sources', 'Check calculation methodology'],
        last_validated: new Date()
      };
      
      mockDataService.validateMarketData.mockResolvedValue(mockFailedValidation);
      
      // Call with invalid custom data
      const result = await MarketAnalysisTools.dataValidation({
        market_size: -1000, // Negative market size
        industry: 'test-industry',
        year: 2025
      });
      
      // Verify validation detects issues
      expect(result.is_valid).toBe(false);
      expect(result.confidence_score).toBeLessThan(0.5);
      expect(result.validation_results.find(v => v.status === 'fail')).toBeDefined();
    });
  });
  
  describe('getMarketSegments', () => {
    it('should analyze market segments', async () => {
      // Mock market segments data
      mockDataService.getMarketSegments.mockResolvedValue(mockMarketSegments);
      
      // Call segments analysis
      const result = await MarketAnalysisTools.marketSegments({
        industry: 'tech-software',
        segmentation_type: 'product'
      });
      
      // Verify segment analysis
      expect(result.segments).toBeDefined();
      expect(result.segments.length).toBe(2);
      expect(result.segmentation_type).toBe('product');
    });
    
    it('should handle and fill missing segment percentages', async () => {
      // Mock market data with segments missing percentages
      const mockSegmentsWithCalculatedPercentages = {
        ...mockMarketSegments,
        segments: [
          {
            id: 'segment-1',
            name: 'Segment 1',
            size_usd: 300000000000,
            percentage_of_parent: 0.45, // Calculated
            level: 1,
            sub_segments: []
          },
          {
            id: 'segment-2',
            name: 'Segment 2',
            size_usd: 200000000000,
            percentage_of_parent: 0.30, // Calculated
            level: 1,
            sub_segments: []
          }
        ]
      };
      
      mockDataService.getMarketSegments.mockResolvedValue(mockSegmentsWithCalculatedPercentages);
      
      // Call segments analysis
      const result = await MarketAnalysisTools.marketSegments({
        industry: 'tech-software',
        segmentation_type: 'geographic'
      });
      
      // Verify percentages were calculated
      expect(result.segments[0].percentage_of_parent).toBeDefined();
      expect(result.segments[1].percentage_of_parent).toBeDefined();
      expect(result.segments[0].percentage_of_parent).toBeGreaterThan(0);
      expect(result.segments[1].percentage_of_parent).toBeGreaterThan(0);
    });
    
    it('should generate custom segmentation when requested', async () => {
      // Mock custom segmentation
      const mockCustomSegmentation = {
        industry: 'custom',
        segmentation_type: 'demographic',
        total_market_size_usd: 1000000000,
        segments: [
          { id: 'youth', name: 'Youth', size_usd: 300000000, percentage_of_parent: 0.30, level: 1, sub_segments: [] },
          { id: 'adult', name: 'Adult', size_usd: 500000000, percentage_of_parent: 0.50, level: 1, sub_segments: [] },
          { id: 'senior', name: 'Senior', size_usd: 200000000, percentage_of_parent: 0.20, level: 1, sub_segments: [] }
        ]
      };
      
      mockDataService.getMarketSegments.mockResolvedValue(mockCustomSegmentation);
      
      // Call with custom segmentation request
      const result = await MarketAnalysisTools.marketSegments({
        industry: 'custom',
        segmentation_type: 'demographic'
      });
      
      // Verify custom segmentation
      expect(result.segmentation_type).toBe('demographic');
      expect(result.segments.length).toBe(3);
      expect(result.segments.find(s => s.name === 'Adult').size_usd).toBe(500000000);
    });
  });
});
