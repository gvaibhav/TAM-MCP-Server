// Unit tests for Market Analysis Tools
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarketAnalysisTools } from '../../src/tools/market-tools.js';

// Mock the DataService - we'll spy on the static instance later
vi.mock('../../src/services/dataService.js', () => {
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
        source,
        timestamp: '2025-06-06T12:00:00Z',
        cached: false
      }
    })),
    createErrorResponse: vi.fn((message) => ({
      success: false,
      error: message,
      metadata: {
        timestamp: '2025-06-06T12:00:00Z',
        source: 'internal',
        cached: false
      }
    })),
    handleToolError: vi.fn((error, toolName) => ({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        timestamp: '2025-06-06T12:00:00Z',
        source: 'internal',
        cached: false
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

describe('MarketAnalysisTools - Tool Definitions', () => {
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

describe('MarketAnalysisTools - Industry Search', () => {
  const mockIndustries = [
    {
      id: 'tech-software',
      name: 'Software & Technology',
      description: 'Software development and tech platforms',
      naicsCode: '541511',
      sicCode: '7372',
      keyMetrics: {
        marketSize: 659000000000,
        growthRate: 0.11
      },
      subIndustries: ['saas', 'enterprise-software'],
      lastUpdated: '2025-06-01'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results successfully', async () => {
    // Setup mock
    const mockSearchIndustries = vi.spyOn((MarketAnalysisTools as any).dataService, 'searchIndustries')
      .mockResolvedValue(mockIndustries);
    
    const result = await MarketAnalysisTools.industrySearch({
      query: 'software',
      limit: 10,
      includeSubIndustries: true
    });
    
    expect(mockSearchIndustries).toHaveBeenCalledWith('software', 10);
    expect(result?.data?.industries).toBeDefined();
    expect(result?.data?.industries.length).toBe(1);
    expect(result?.data?.industries[0].id).toBe('tech-software');
    expect(result?.data?.industries[0].subIndustries).toBeDefined();
  });
  
  it('should exclude subIndustries when not requested', async () => {
    // Setup mock
    vi.spyOn(MarketAnalysisTools.dataService, 'searchIndustries').mockResolvedValue(mockIndustries);
    
    const result = await MarketAnalysisTools.industrySearch({
      query: 'software',
      limit: 10,
      includeSubIndustries: false
    });
    
    expect(result?.data?.industries[0].subIndustries).toBeUndefined();
  });
  
  it('should provide search tips when no results found', async () => {
    // Setup mock to return empty array
    vi.spyOn(MarketAnalysisTools.dataService, 'searchIndustries').mockResolvedValue([]);
    
    const result = await MarketAnalysisTools.industrySearch({
      query: 'nonexistent industry',
      limit: 10,
      includeSubIndustries: false
    });
    
    expect(result?.data?.industries).toHaveLength(0);
    expect(result?.data?.searchTips).toBeDefined();
    expect(result?.data?.searchTips?.length).toBeGreaterThan(0);
  });
  
  it('should handle errors correctly', async () => {
    // Setup mock to throw an error
    vi.spyOn(MarketAnalysisTools.dataService, 'searchIndustries').mockRejectedValue(new Error('Database connection failed'));
    
    const result = await MarketAnalysisTools.industrySearch({
      query: 'software',
      limit: 10,
      includeSubIndustries: false
    });
    
    expect(result?.error).toBeDefined();
    expect(result?.error).toBe('Database connection failed');
  });
});

describe('MarketAnalysisTools - Industry Data', () => {
  const mockIndustry = {
    id: 'tech-software',
    name: 'Software & Technology',
    description: 'Software development and tech platforms',
    naicsCode: '541511',
    sicCode: '7372',
    parentIndustry: 'technology',
    subIndustries: ['saas', 'enterprise-software'],
    keyMetrics: {
      marketSize: 659000000000,
      growthRate: 0.11,
      cagr: 0.085,
      volatility: 0.25
    },
    geography: ['global'],
    lastUpdated: '2025-06-01'
  };
  
  const mockMarketSize = {
    value: 659000000000,
    year: 2025,
    region: 'global',
    confidenceScore: 0.9,
    methodology: 'bottom-up',
    sources: ['industry-report-1', 'industry-report-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(mockIndustry);
    vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue(mockMarketSize);
  });

  it('should return industry data successfully', async () => {
    const result = await MarketAnalysisTools.industryData({
      industryId: 'tech-software',
      includeMetrics: true
    });
    
    expect(MarketAnalysisTools.dataService.getIndustryById).toHaveBeenCalledWith('tech-software');
    expect(result?.data?.id).toBe('tech-software');
    expect(result?.data?.metrics).toBeDefined();
  });
  
  it('should not include metrics when not requested', async () => {
    const result = await MarketAnalysisTools.industryData({
      industryId: 'tech-software',
      includeMetrics: false
    });
    
    expect(result?.data?.metrics).toBeUndefined();
  });
  
  it('should handle region parameter correctly', async () => {
    const result = await MarketAnalysisTools.industryData({
      industryId: 'tech-software',
      includeMetrics: true,
      region: 'north-america'
    });
    
    expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('tech-software', 'north-america');
  });
  
  it('should handle industry not found', async () => {
    vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(null);
    
    const result = await MarketAnalysisTools.industryData({
      industryId: 'nonexistent',
      includeMetrics: true
    });
    
    expect(result?.error).toBeDefined();
    expect(result?.error).toContain('Industry not found');
  });
});

describe('MarketAnalysisTools - Market Size', () => {
  const mockMarketSize = {
    value: 659000000000,
    year: 2025,
    region: 'global',
    confidenceScore: 0.9,
    methodology: 'bottom-up',
    sources: ['industry-report-1', 'industry-report-2'],
    segments: [
      { name: 'Enterprise', value: 350000000000, percentage: 0.53, growthRate: 0.09, description: 'Enterprise software' },
      { name: 'Consumer', value: 309000000000, percentage: 0.47, growthRate: 0.13, description: 'Consumer software' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue(mockMarketSize);
  });

  it('should return market size data successfully', async () => {
    const result = await MarketAnalysisTools.marketSize({
      industryId: 'tech-software',
      region: 'global',
      currency: 'USD'
    });
    
    expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('tech-software', 'global', undefined);
    expect(result?.data?.marketSize?.value).toBe(659000000000);
    expect(result?.data?.segments?.length).toBe(2);
  });
  
  it('should handle year parameter correctly', async () => {
    const result = await MarketAnalysisTools.marketSize({
      industryId: 'tech-software',
      region: 'global',
      year: 2024,
      currency: 'USD'
    });
    
    expect(MarketAnalysisTools.dataService.getMarketSize).toHaveBeenCalledWith('tech-software', 'global', 2024);
  });
  
  it('should handle market data not available', async () => {
    vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue(null);
    
    const result = await MarketAnalysisTools.marketSize({
      industryId: 'tech-software',
      region: 'global',
      currency: 'USD'
    });
    
    expect(result?.error).toBeDefined();
    expect(result?.error).toContain('Market size data not available');
  });
});

describe('MarketAnalysisTools - TAM Calculator', () => {
  const mockIndustry = {
    id: 'tech-software',
    name: 'Software & Technology',
    keyMetrics: {
      marketSize: 659000000000,
      growthRate: 0.11
    }
  };
  
  const mockMarketSize = {
    value: 659000000000,
    year: 2025,
    region: 'global',
    confidenceScore: 0.9,
    methodology: 'bottom-up',
    sources: ['industry-report-1', 'industry-report-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(mockIndustry);
    vi.spyOn(MarketAnalysisTools.dataService, 'getMarketSize').mockResolvedValue(mockMarketSize);
  });

  it('should calculate TAM using bottom-up approach', async () => {
    const result = await MarketAnalysisTools.tamCalculator({
      industryId: 'tech-software',
      region: 'global',
      population: 1000000,
      penetrationRate: 0.2,
      averageSpending: 1500,
      includeScenarios: true
    });
    
    expect(result?.data?.totalAddressableMarket).toBe(300000000); // 1M * 0.2 * 1500
    expect(result?.data?.methodology).toContain('Bottom-up');
    expect(result?.data?.scenarios).toBeDefined();
    expect(result?.data?.scenarios?.optimistic).toBe(450000000); // 300M * 1.5
  });
  
  it('should calculate TAM using top-down approach when bottom-up params missing', async () => {
    const result = await MarketAnalysisTools.tamCalculator({
      industryId: 'tech-software',
      region: 'global',
      includeScenarios: false
    });
    
    expect(result?.data?.totalAddressableMarket).toBe(659000000000);
    expect(result?.data?.methodology).toContain('Top-down');
    expect(result?.data?.scenarios?.optimistic).toBe(659000000000); // Same as realistic when not including scenarios
  });
  
  it('should handle missing industry or market data', async () => {
    vi.spyOn(MarketAnalysisTools.dataService, 'getIndustryById').mockResolvedValue(null);
    
    const result = await MarketAnalysisTools.tamCalculator({
      industryId: 'nonexistent',
      region: 'global',
      includeScenarios: false
    });
    
    expect(result?.error).toBeDefined();
    expect(result?.error).toContain('Unable to calculate TAM');
  });
});

// Add more test cases for the remaining tools as needed
