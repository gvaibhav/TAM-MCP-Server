// tests/unit/market-tools-extra.test.ts - Additional tests for market tools
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.js';

// Mock the DataService
vi.mock('../../src/services/dataService.js', () => {
  return {
    DataService: vi.fn().mockImplementation(() => ({
      searchIndustries: vi.fn(),
      getIndustryById: vi.fn(),
      getMarketSize: vi.fn(),
      generateMarketForecast: vi.fn(),
      getMarketOpportunities: vi.fn(),
      getSupportedCurrencies: vi.fn().mockReturnValue(['USD', 'EUR', 'GBP']),
      calculateTam: vi.fn(),
      calculateSam: vi.fn(),
      compareMarkets: vi.fn(),
      validateMarketData: vi.fn(),
      forecastMarket: vi.fn(),
      getMarketSegments: vi.fn()
    }))
  };
});

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
        source: source || 'api',
        timestamp: new Date().toISOString()
      }
    })),
    handleToolError: vi.fn((error, toolName) => ({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        timestamp: new Date().toISOString()
      }
    }))
  };
});

// Sample mock data
const mockIndustry = {
  id: 'tech-software',
  name: 'Software & Technology',
  description: 'Software development',
  keyMetrics: {
    marketSize: 659000000000,
    growthRate: 0.11,
    cagr: 0.085,
    volatility: 0.25
  }
};

const mockMarketSize = {
  value: 659000000000,
  currency: 'USD',
  year: 2025,
  region: 'global',
  segments: [
    { name: 'Enterprise Software', value: 280000000000, percentage: 0.42 },
    { name: 'SaaS Platforms', value: 220000000000, percentage: 0.33 }
  ]
};

describe('Market Analysis Tools - Extra Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Industry Search Tests', () => {
    it('should search industries with partial matching', async () => {
      vi.spyOn(MarketAnalysisTools.dataService, 'searchIndustries').mockResolvedValue([mockIndustry]);

      const result = await MarketAnalysisTools.industrySearch({
        query: 'tech',
        limit: 10,
        includeSubIndustries: false
      });

      expect(result.success).toBe(true);
      expect(result.data.industries).toHaveLength(1);
      expect(result.data.industries[0].name).toBe('Software & Technology');
    });

    it('should handle empty search results', async () => {
      vi.spyOn(MarketAnalysisTools.dataService, 'searchIndustries').mockResolvedValue([]);

      const result = await MarketAnalysisTools.industrySearch({
        query: 'nonexistent',
        limit: 10,
        includeSubIndustries: false
      });

      expect(result.success).toBe(true);
      expect(result.data.industries).toHaveLength(0);
    });
  });

  describe('Market Size Analysis', () => {
    it('should calculate market size with segments', async () => {
      vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue(mockMarketSize);
      vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(mockIndustry);

      const result = await MarketAnalysisTools.marketSize({
        industryId: 'tech-software',
        region: 'global',
        currency: 'USD'
      });

      expect(result.success).toBe(true);
      expect(result.data.marketSize.value).toBe(659000000000);
      expect(result.data.marketSize.segments).toHaveLength(2);
    });

    it('should handle missing industry data', async () => {
      vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(null);

      const result = await MarketAnalysisTools.marketSize({
        industryId: 'invalid-id',
        region: 'global',
        currency: 'USD'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Static Method Validation', () => {
    it('should expose static TAM calculator method', () => {
      expect(typeof MarketAnalysisTools.tamCalculator).toBe('function');
    });

    it('should expose static SAM calculator method', () => {
      expect(typeof MarketAnalysisTools.samCalculator).toBe('function');
    });

    it('should expose static market segments method', () => {
      expect(typeof MarketAnalysisTools.marketSegments).toBe('function');
    });

    it('should expose static market comparison method', () => {
      expect(typeof MarketAnalysisTools.marketComparison).toBe('function');
    });

    it('should expose static market forecasting method', () => {
      expect(typeof MarketAnalysisTools.marketForecasting).toBe('function');
    });
  });
});
