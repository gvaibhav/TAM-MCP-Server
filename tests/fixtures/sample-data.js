/**
 * Sample test data for TAM MCP Server tests
 */

export const sampleIndustries = [
  {
    id: 'saas-software',
    name: 'Software as a Service (SaaS)',
    description: 'Cloud-based software delivery model',
    category: 'Technology',
    tags: ['software', 'cloud', 'subscription']
  },
  {
    id: 'cloud-computing',
    name: 'Cloud Computing',
    description: 'Internet-based computing services',
    category: 'Technology',
    tags: ['cloud', 'infrastructure', 'services']
  },
  {
    id: 'fintech',
    name: 'Financial Technology',
    description: 'Technology-enabled financial services',
    category: 'Financial Services',
    tags: ['finance', 'technology', 'payments']
  }
];

export const sampleMarketData = {
  'saas-software': {
    globalMarketSize: 150000000000, // $150B
    regions: {
      'North America': { size: 75000000000, growth: 0.15 },
      'Europe': { size: 45000000000, growth: 0.12 },
      'Asia Pacific': { size: 25000000000, growth: 0.20 },
      'Rest of World': { size: 5000000000, growth: 0.18 }
    },
    segments: {
      'CRM': { percentage: 25, size: 37500000000 },
      'ERP': { percentage: 20, size: 30000000000 },
      'Collaboration': { percentage: 15, size: 22500000000 },
      'Other': { percentage: 40, size: 60000000000 }
    }
  },
  'cloud-computing': {
    globalMarketSize: 500000000000, // $500B
    regions: {
      'North America': { size: 200000000000, growth: 0.18 },
      'Europe': { size: 150000000000, growth: 0.16 },
      'Asia Pacific': { size: 120000000000, growth: 0.22 },
      'Rest of World': { size: 30000000000, growth: 0.25 }
    }
  }
};

export const sampleTAMCalculations = {
  topDown: {
    methodology: 'top-down',
    totalMarketValue: 150000000000,
    targetSegmentPercentage: 15,
    geographicPenetration: 85,
    expectedTAM: 19125000000
  },
  bottomUp: {
    methodology: 'bottom-up',
    targetCustomers: 50000,
    averageRevenuePerCustomer: 120000,
    marketPenetration: 0.25,
    expectedTAM: 1500000000
  }
};

export const sampleNotifications = {
  welcome: {
    method: 'notifications/message',
    params: {
      level: 'info',
      logger: 'tam-mcp-server',
      data: 'TAM MCP Server connected via SSE',
      timestamp: '2025-06-06T17:32:23.497Z'
    }
  },
  calculationStarted: {
    method: 'notifications/market_analysis',
    params: {
      type: 'calculation',
      message: 'Market Size calculation started',
      timestamp: '2025-06-06T17:32:24.123Z'
    }
  },
  progress: {
    method: 'notifications/progress',
    params: {
      progress: 50,
      total: 100,
      progressToken: 'token123',
      message: 'Processing market data...'
    }
  },
  error: {
    method: 'notifications/error',
    params: {
      error: 'API rate limit exceeded',
      tool: 'market_size',
      timestamp: '2025-06-06T17:32:25.456Z',
      details: {}
    }
  }
};

export const mcpRequests = {
  initialize: {
    jsonrpc: '2.0',
    id: 'init-1',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  },
  listTools: {
    jsonrpc: '2.0',
    id: 'list-1',
    method: 'tools/list'
  },
  marketSizeTool: {
    jsonrpc: '2.0',
    id: 'tool-1',
    method: 'tools/call',
    params: {
      name: 'market_size',
      arguments: {
        industry: 'Software as a Service (SaaS)',
        region: 'North America',
        year: '2024'
      }
    }
  },
  tamCalculatorTool: {
    jsonrpc: '2.0',
    id: 'tool-2',
    method: 'tools/call',
    params: {
      name: 'tam_calculator',
      arguments: {
        industry: 'Software as a Service (SaaS)',
        region: 'Global',
        methodology: 'top-down',
        dataPoints: {
          totalMarketValue: 150000000000,
          targetSegmentPercentage: 15,
          geographicPenetration: 85
        }
      }
    }
  }
};

export const expectedResponses = {
  toolsList: {
    expectedToolCount: 10,
    requiredTools: [
      'industry_search',
      'industry_data', 
      'market_size',
      'tam_calculator',
      'sam_calculator',
      'market_segments',
      'market_forecasting',
      'market_comparison',
      'data_validation',
      'market_opportunities'
    ]
  },
  serverCapabilities: {
    required: ['tools', 'logging', 'notifications'],
    optional: ['resources', 'prompts']
  }
};

export default {
  sampleIndustries,
  sampleMarketData,
  sampleTAMCalculations,
  sampleNotifications,
  mcpRequests,
  expectedResponses
};
