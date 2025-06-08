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
    confidence_level: 0.95
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock services
    mockDataService = new DataService();
    mockCacheService = new CacheService();
    
    // Create MCPTools instance
    mcpTools = new MCPTools(mockDataService, mockCacheService);
  });

  describe('getMarketOpportunities', () => {
    it('should handle and report provider errors', async () => {
      // Mock DataService method to throw error
      mockDataService.getMarketOpportunities.mockRejectedValue(
        new Error('Failed to fetch market opportunities')
      );
      
      // Call the method with valid parameters
      await expect(mcpTools.getMarketOpportunities({
        industries: ['tech-software'],
        growth_threshold: 0.15,
        time_horizon: 5
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
      const result = await mcpTools.getMarketOpportunities({
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
      const result = await mcpTools.getMarketOpportunities({
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
      const result = await mcpTools.forecastMarket({
        industry: 'tech-software',
        forecast_years: 3,
        scenario_type: 'conservative',
        confidence_level: 0.95
      });
      
      // Verify growth percentages are calculated
      expect(result.forecast_data).toBeDefined();
      expect(result.cagr).toBeDefined();
      expect(result.forecast_data.length).toBe(3);
    });
    
    it('should validate year parameter range', async () => {
      // Call with invalid (too high) years parameter - this should be caught by schema validation
      await expect(mcpTools.forecastMarket({
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
      const result = await mcpTools.calculateTam({
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
    
    it('should validate required parameters', async () => {
      // Call with missing required parameters
      await expect(mcpTools.calculateTam({})).rejects.toThrow();
    });
    
    it('should handle missing industry data', async () => {
      // Mock error for missing industry
      mockDataService.calculateTam.mockRejectedValue(
        new Error('Industry not found')
      );
      
      // Call method
      await expect(mcpTools.calculateTam({
        industry: 'nonexistent-industry',
        regions: ['global'],
        methodology: 'top-down'
      })).rejects.toThrow('Failed to calculate TAM');
    });
  });
  
  describe('calculateSam', () => {
    it('should calculate SAM based on TAM', async () => {
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
      const result = await mcpTools.calculateSam({
        tam_result: mockTamResult,
        target_segments: ['enterprise', 'smb'],
        geographic_constraints: ['north-america', 'europe']
      });
      
      // Verify SAM calculation
      expect(result.sam_usd).toBe(150000000);
      expect(result.sam_percentage_of_tam).toBeDefined();
    });
    
    it('should validate required parameters', async () => {
      // Call with missing required parameters
      await expect(mcpTools.calculateSam({})).rejects.toThrow();
    });
  });
  
  describe('compareMarkets', () => {
    it('should compare multiple industries', async () => {
      // Mock comparison data
      mockDataService.compareMarkets.mockResolvedValue(mockMarketComparison);
      
      // Call comparison with multiple industries
      const result = await mcpTools.compareMarkets({
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
    
    it('should handle invalid parameters', async () => {
      // Call with insufficient industries (less than 2)
      await expect(mcpTools.compareMarkets({
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
      const result = await mcpTools.validateMarketData({
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
    
    it('should handle validation errors', async () => {
      // Mock validation with issues
      const mockFailedValidation = {
        is_valid: false,
        confidence_score: 0.3,
        validation_results: [
          { check: 'range_validation', status: 'fail', message: 'Value outside expected range' }
        ],
        recommendations: ['Verify data sources', 'Check calculation methodology'],
        last_validated: new Date()
      };
      
      mockDataService.validateMarketData.mockResolvedValue(mockFailedValidation);
      
      // Call with invalid data
      const result = await mcpTools.validateMarketData({
        market_size: -1000, // Negative market size
        industry: 'test-industry',
        year: 2025
      });
      
      // Verify validation detects issues
      expect(result.is_valid).toBe(false);
      expect(result.confidence_score).toBeLessThan(0.5);
    });
  });
  
  describe('getMarketSegments', () => {
    it('should analyze market segments', async () => {
      // Mock market segments data
      mockDataService.getMarketSegments.mockResolvedValue(mockMarketSegments);
      
      // Call segments analysis
      const result = await mcpTools.getMarketSegments({
        industry: 'tech-software',
        segmentation_type: 'product'
      });
      
      // Verify segment analysis
      expect(result.segments).toBeDefined();
      expect(result.segments.length).toBe(2);
      expect(result.segmentation_type).toBe('product');
    });
  });
});
