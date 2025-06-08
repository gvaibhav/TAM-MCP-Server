/**
 * Advanced tests for Market Analysis Tools
 * These tests focus on edge cases and coverage gaps
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.js';
import { logger } from '../setup.js';

// Mock utils functions
vi.mock('../../src/utils/index.js', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    },
    createAPIResponse: vi.fn((data, source) => ({
      success: true,
      data,
      metadata: {
        source,
        timestamp: '2025-06-06T12:00:00Z'
      }
    })),
    createErrorResponse: vi.fn((message) => ({
      success: false,
      error: message,
      metadata: {
        timestamp: '2025-06-06T12:00:00Z'
      }
    })),
    handleToolError: vi.fn((error, toolName) => ({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        timestamp: '2025-06-06T12:00:00Z'
      }
    })),
    validatePositiveNumber: vi.fn(),
    validatePercentage: vi.fn(),
    validateYear: vi.fn(),
    validateCurrency: vi.fn(),
    validateRegion: vi.fn(),
    formatCurrency: vi.fn((value) => `$${value.toLocaleString()}`),
    formatPercentage: vi.fn((value) => `${(value * 100).toFixed(1)}%`),
    calculateCAGR: vi.fn(),
    calculateConfidenceScore: vi.fn((params) => 0.85)
  };
});

describe('Market Analysis Tools Advanced Tests', () => {
  let marketTools;

  beforeEach(() => {
    vi.clearAllMocks();
    marketTools = new MarketAnalysisTools();
  });

  describe('Market Segmentation', () => {
    it('should handle missing segments gracefully', async () => {
      // Mock getMarketSegments to return null segments
      vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSegments').mockResolvedValue({
        segments: null,
        totalMarketSize: 1000000000
      });

      const result = await MarketAnalysisTools.marketSegments({
        industryId: 'tech-001',
        region: 'global',
        segmentationType: 'demographic'
      });

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Market segmentation data not available');
    });

    it('should format segment percentages correctly', async () => {
      // Mock getMarketSegments with valid segments
      vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSegments').mockResolvedValue({
        segments: [
          { name: 'Segment A', value: 300000000 },
          { name: 'Segment B', value: 500000000 },
          { name: 'Segment C', value: 200000000 },
        ],
        totalMarketSize: 1000000000
      });

      const result = await MarketAnalysisTools.marketSegments({
        industryId: 'tech-001',
        region: 'global',
        segmentationType: 'demographic',
        includePercentages: true
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.segments).toHaveLength(3);
      expect(result.data.segments[0].percentage).toBeDefined();
    });
  });

  describe('Industry Comparison', () => {
    it('should handle comparison with invalid industries', async () => {
      // Mock getIndustryComparison to return error for invalid industry
      vi.spyOn(MarketAnalysisTools.dataService, 'compareMarkets').mockRejectedValue(new Error('Industry not found'));

      const result = await MarketAnalysisTools.marketComparison({
        industryIds: ['invalid-id-123', 'tech-001'],
        metrics: ['marketSize', 'growthRate']
      });

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Insufficient data for market comparison');
    });

    it('should compare industries across requested metrics', async () => {
      // Mock getIndustryComparison with valid comparison data
      vi.spyOn(MarketAnalysisTools.dataService, 'compareMarkets').mockResolvedValue({
        industries: [
          { id: 'tech-001', name: 'Technology', marketSize: 5000000000, growthRate: 0.15, profitMargin: 0.25 },
          { id: 'health-001', name: 'Healthcare', marketSize: 3000000000, growthRate: 0.08, profitMargin: 0.18 }
        ]
      });

      const result = await MarketAnalysisTools.marketComparison({
        industryIds: ['tech-001', 'health-001'],
        metrics: ['marketSize', 'growthRate']
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.industries).toHaveLength(2);
      expect(result.data.industries[0].marketSize).toBeDefined();
      expect(result.data.industries[0].growthRate).toBeDefined();
    });
  });

  describe('Market Forecasts', () => {
    it('should generate market forecasts with compound growth', async () => {
      // Mock getMarketForecasts with forecast data
      vi.spyOn(MarketAnalysisTools.dataService, 'generateMarketForecast').mockResolvedValue({
        currentMarketSize: 1000000000,
        growthRate: 0.12,
        forecastYears: 5,
        forecasts: [
          { year: 2025, marketSize: 1000000000 },
          { year: 2026, marketSize: 1120000000 },
          { year: 2027, marketSize: 1254400000 },
          { year: 2028, marketSize: 1404928000 },
          { year: 2029, marketSize: 1573519000 },
        ]
      });

      const result = await MarketAnalysisTools.marketForecasting({
        industryId: 'tech-001',
        years: 5,
        includeScenarios: false
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.forecasts).toHaveLength(5);
      expect(result.data.cagr).toBeDefined();
    });

    it('should handle invalid forecast parameters', async () => {
      const result = await MarketAnalysisTools.marketForecasting({
        industryId: 'tech-001',
        years: -3, // Invalid parameter
        includeScenarios: false
      });

      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
    });
  });
  
  describe('TAM Calculator Advanced', () => {
    it('should handle TAM calculation with custom market share', async () => {
      // Mock required data provider methods
      vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue({
        id: 'tech-001',
        name: 'Technology',
        description: 'Technology industry',
        totalMarketSize: 5000000000
      });
      
      vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue({
        marketSize: 5000000000,
        currency: 'USD',
        year: 2025,
        region: 'global'
      });

      const result = await MarketAnalysisTools.tamCalculator({
        industryId: 'tech-001',
        region: 'global',
        year: 2025,
        marketShare: 0.05,  // Custom market share percentage
        approach: 'top-down',
        includeSubIndustries: false
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.tam).toBeDefined();
      expect(result.data.marketShare).toBe(0.05);
      expect(result.data.tamValue).toBe(250000000); // 5B * 0.05
    });
    
    it('should handle market data validation for TAM calculation', async () => {
      // Mock validation to fail
      vi.spyOn(MarketAnalysisTools.dataService, 'validateMarketData').mockResolvedValue({
        valid: false,
        issues: ['Data is too old', 'Source reliability is low']
      });
      
      vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue({
        id: 'tech-001',
        name: 'Technology',
        description: 'Technology industry',
        totalMarketSize: 5000000000
      });

      const result = await MarketAnalysisTools.tamCalculator({
        industryId: 'tech-001',
        region: 'global',
        year: 2025,
        approach: 'top-down',
        validateData: true,
        includeSubIndustries: false
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.validationIssues).toBeDefined();
      expect(result.data.validationIssues.length).toBeGreaterThan(0);
      expect(result.data.confidenceScore).toBeLessThan(0.9);
    });
  });
});
