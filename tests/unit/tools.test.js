import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.ts';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { NotificationService } from '../../src/notifications/notification-service.ts';

// Mock the DataService
vi.mock('../../src/services/DataService.ts', () => {
  return {
    DataService: vi.fn().mockImplementation(() => ({
      searchIndustries: vi.fn(),
      getIndustryById: vi.fn(),
      getMarketSize: vi.fn(),
      generateMarketForecast: vi.fn(),
      getSupportedCurrencies: vi.fn(),
      getMarketOpportunities: vi.fn(),
      calculateTam: vi.fn(),
      calculateSam: vi.fn(),
      compareMarkets: vi.fn(),
      validateMarketData: vi.fn(),
      forecastMarket: vi.fn(),
      getMarketSegments: vi.fn(),
      getSpecificDataSourceData: vi.fn()
    }))
  };
});

// Mock utils functions
vi.mock('../../src/utils/index.ts', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    },
    createAPIResponse: vi.fn((data, source) => ({
      success: true,
      content: data,
      metadata: {
        source,
        timestamp: '2025-06-06T12:00:00Z'
      }
    })),
    createErrorResponse: vi.fn((message, code) => {
      return {
        success: false,
        error: { message, code },
        metadata: {
          timestamp: '2025-06-06T12:00:00Z'
        }
      }
    }),
    handleToolError: vi.fn((error, toolName) => {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          toolName,
          details: error.issues ? error.issues.map(issue => ({ path: issue.path, message: issue.message })) : undefined,
          code: error.issues ? 'VALIDATION_ERROR' : 'TOOL_ERROR'
        },
        metadata: {
          timestamp: '2025-06-06T12:00:00Z'
        }
      }
    }),
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

describe('Market Analysis Tools Tests', () => {
  describe('Tool Definitions', () => {
    it('should return a list of tool definitions', () => {
      const tools = MarketAnalysisTools.getToolDefinitions();
      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(0);
      
      // Verify each tool has the required properties
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
      
      // Verify specific tools exist
      const toolNames = tools.map((tool) => tool.name);
      expect(toolNames).toContain('industry_search');
      expect(toolNames).toContain('market_size');
      expect(toolNames).toContain('tam_calculator');
    });
  });

  describe('Industry Search', () => {
    it('should search for industries', () => {
      const tools = MarketAnalysisTools.getToolDefinitions();
      const industrySearchTool = tools.find(tool => tool.name === 'industry_search');
      expect(industrySearchTool).toBeDefined();
      expect(industrySearchTool.description).toContain('Search');
    });
  });

  describe('Market Size Tool', () => {
    it('should provide market size functionality', () => {
      const tools = MarketAnalysisTools.getToolDefinitions();
      const marketSizeTool = tools.find(tool => tool.name === 'market_size');
      expect(marketSizeTool).toBeDefined();
      expect(marketSizeTool.description).toContain('market');
    });
  });

  describe('TAM Calculator', () => {
    it('should provide TAM calculation functionality', () => {
      const tools = MarketAnalysisTools.getToolDefinitions();
      const tamTool = tools.find(tool => tool.name === 'tam_calculator');
      expect(tamTool).toBeDefined();
      expect(tamTool.description).toContain('TAM');
    });
  });
});
