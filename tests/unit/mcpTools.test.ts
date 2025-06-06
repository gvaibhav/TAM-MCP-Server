import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPTools } from '../../src/tools/mcpTools.js';
import { DataService } from '../../src/services/dataService.js';
import { CacheService } from '../../src/services/cacheService.js';

describe('MCPTools', () => {
  let mcpTools: MCPTools;
  let dataService: DataService;
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({ ttl: 300 });
    dataService = new DataService({ 
      cacheService,
      apiKeys: {}
    });
    mcpTools = new MCPTools(dataService, cacheService);
  });

  afterEach(() => {
    cacheService.close();
  });

  describe('industrySearch', () => {
    it('should return industry search results for valid query', async () => {
      const result = await mcpTools.industrySearch({
        query: 'artificial intelligence',
        filters: { region: 'global' }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data.industries)).toBe(true);
      expect(result.data.industries.length).toBeGreaterThan(0);
    });

    it('should handle empty search query', async () => {
      await expect(mcpTools.industrySearch({ query: '' }))
        .rejects.toThrow();
    });

    it('should cache search results', async () => {
      const query = { query: 'fintech', filters: { region: 'US' } };
      
      // First call
      const result1 = await mcpTools.industrySearch(query);
      expect(result1.metadata.cache_used).toBe(false);
      
      // Second call should use cache
      const result2 = await mcpTools.industrySearch(query);
      expect(result2.metadata.cache_used).toBe(true);
    });
  });

  describe('getIndustryData', () => {
    it('should return industry data for valid industry', async () => {
      const result = await mcpTools.getIndustryData({
        industry_id: 'tech-001',
        include_segments: true
      });

      expect(result.success).toBe(true);
      expect(result.data.industry_id).toBe('tech-001');
      expect(result.data.market_size).toBeGreaterThan(0);
      expect(Array.isArray(result.data.segments)).toBe(true);
    });

    it('should handle invalid industry ID', async () => {
      await expect(mcpTools.getIndustryData({ industry_id: 'invalid' }))
        .rejects.toThrow();
    });
  });

  describe('getMarketSize', () => {
    it('should calculate market size for valid parameters', async () => {
      const result = await mcpTools.getMarketSize({
        industry: 'SaaS',
        geography: 'North America',
        year: 2024
      });

      expect(result.success).toBe(true);
      expect(result.data.market_size_usd).toBeGreaterThan(0);
      expect(result.data.methodology).toBeDefined();
      expect(result.data.data_sources).toBeDefined();
    });

    it('should validate year parameter', async () => {
      await expect(mcpTools.getMarketSize({
        industry: 'SaaS',
        geography: 'Global',
        year: 1990 // Too old
      })).rejects.toThrow();
    });
  });

  describe('calculateTAM', () => {
    it('should calculate TAM for valid industry', async () => {
      const result = await mcpTools.calculateTAM({
        industry: 'Cloud Computing',
        geography: 'Global',
        timeframe: '2024'
      });

      expect(result.success).toBe(true);
      expect(result.data.tam_usd).toBeGreaterThan(0);
      expect(result.data.methodology).toBeDefined();
      expect(result.data.assumptions).toBeDefined();
    });

    it('should include calculation breakdown', async () => {
      const result = await mcpTools.calculateTAM({
        industry: 'E-commerce',
        geography: 'Europe'
      });

      expect(result.data.calculation_breakdown).toBeDefined();
      expect(result.data.calculation_breakdown.components).toBeDefined();
    });
  });

  describe('calculateSAM', () => {
    it('should calculate SAM with target segments', async () => {
      const result = await mcpTools.calculateSAM({
        tam_data: {
          tam_usd: 1000000000,
          industry: 'SaaS',
          geography: 'Global'
        },
        target_segments: ['SMB', 'Enterprise'],
        filters: {
          company_size: ['small', 'medium', 'large']
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.sam_usd).toBeGreaterThan(0);
      expect(result.data.sam_usd).toBeLessThanOrEqual(1000000000);
      expect(Array.isArray(result.data.segments)).toBe(true);
    });
  });

  describe('getMarketSegments', () => {
    it('should return market segments for industry', async () => {
      const result = await mcpTools.getMarketSegments({
        industry: 'Healthcare',
        segmentation_type: 'demographic'
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.segments)).toBe(true);
      expect(result.data.segments.length).toBeGreaterThan(0);
      expect(result.data.total_segments).toBe(result.data.segments.length);
    });
  });

  describe('forecastMarket', () => {
    it('should generate market forecast', async () => {
      const result = await mcpTools.forecastMarket({
        industry: 'AI/ML',
        base_year: 2024,
        forecast_years: 3,
        methodology: 'compound_growth'
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.forecast)).toBe(true);
      expect(result.data.forecast.length).toBe(3);
      expect(result.data.cagr).toBeGreaterThan(0);
    });

    it('should validate forecast parameters', async () => {
      await expect(mcpTools.forecastMarket({
        industry: 'Test',
        base_year: 2025,
        forecast_years: 0 // Invalid
      })).rejects.toThrow();
    });
  });

  describe('compareMarkets', () => {
    it('should compare multiple markets', async () => {
      const result = await mcpTools.compareMarkets({
        markets: [
          { industry: 'SaaS', geography: 'US' },
          { industry: 'SaaS', geography: 'Europe' }
        ],
        metrics: ['market_size', 'growth_rate']
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.comparisons)).toBe(true);
      expect(result.data.comparisons.length).toBe(2);
    });
  });

  describe('validateMarketData', () => {
    it('should validate market data quality', async () => {
      const result = await mcpTools.validateMarketData({
        data: {
          market_size_usd: 1000000000,
          growth_rate: 0.15,
          data_source: 'test_source',
          year: 2024
        },
        validation_rules: ['range_check', 'source_credibility']
      });

      expect(result.success).toBe(true);
      expect(result.data.is_valid).toBeDefined();
      expect(Array.isArray(result.data.validation_results)).toBe(true);
    });
  });

  describe('getMarketOpportunities', () => {
    it('should identify market opportunities', async () => {
      const result = await mcpTools.getMarketOpportunities({
        industry: 'FinTech',
        criteria: {
          min_market_size: 1000000,
          max_competition_level: 'medium',
          growth_rate_threshold: 0.1
        }
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.opportunities)).toBe(true);
      expect(result.data.total_opportunities).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const mockDataService = {
        ...dataService,
        searchIndustries: async () => {
          throw new Error('Network error');
        }
      };

      const mockMCPTools = new MCPTools(mockDataService as any, cacheService);

      await expect(mockMCPTools.industrySearch({ query: 'test' }))
        .rejects.toThrow();
    });

    it('should validate input schemas', async () => {
      await expect(mcpTools.industrySearch({} as any))
        .rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await mcpTools.getMarketSize({
        industry: 'Software',
        geography: 'Global',
        year: 2024
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        mcpTools.industrySearch({ query: `industry_${i}` })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});
