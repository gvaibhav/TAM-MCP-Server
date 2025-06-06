import { z } from 'zod';

// Base MCP Types
export const MCPVersionSchema = z.literal('2024-11-05');

export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.any()).optional(),
});

export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});

// Industry Search Types
export const IndustrySearchInputSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(10),
  filters: z.object({
    naics: z.array(z.string()).optional(),
    sic: z.array(z.string()).optional(),
  }).optional(),
  fuzzy_match: z.boolean().default(true),
  language: z.string().default('en').optional(),
});

export const IndustrySearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  naics_code: z.string().optional(),
  sic_code: z.string().optional(),
  relevance_score: z.number().min(0).max(1),
  parent_industry: z.string().optional(),
  sub_industries: z.array(z.string()).default([]),
});

// Industry Data Types  
export const IndustryDataInputSchema = z.object({
  industry_id: z.string().min(1),
  include_trends: z.boolean().default(false),
  include_players: z.boolean().default(false),
  include_esg: z.boolean().default(false),
});

export const IndustryDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  naics_code: z.string().optional(),
  sic_code: z.string().optional(),
  classification: z.object({
    sector: z.string(),
    subsector: z.string(),
    industry_group: z.string(),
  }),
  key_metrics: z.object({
    market_size_usd: z.number().optional(),
    growth_rate: z.number().optional(),
    employment: z.number().optional(),
  }),
  trends: z.array(z.object({
    trend: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
  })).optional(),
  key_players: z.array(z.object({
    company: z.string(),
    market_share: z.number().optional(),
    revenue_usd: z.number().optional(),
  })).optional(),
  esg_data: z.object({
    environmental_score: z.number().min(0).max(100).optional(),
    social_score: z.number().min(0).max(100).optional(),
    governance_score: z.number().min(0).max(100).optional(),
  }).optional(),
});

// Market Size Types
export const MarketSizeInputSchema = z.object({
  industry: z.string().min(1),
  year_range: z.tuple([z.number(), z.number()]).optional(),
  regions: z.array(z.string()).default(['global']),
  currency: z.string().default('USD'),
  segments: z.array(z.string()).optional(),
  adjust_inflation: z.boolean().default(false),
});

export const MarketSizeResultSchema = z.object({
  industry: z.string(),
  market_size_data: z.array(z.object({
    year: z.number(),
    market_size: z.number(),
    currency: z.string(),
    region: z.string(),
    segment: z.string().optional(),
    growth_rate: z.number().optional(),
    confidence_score: z.number().min(0).max(1),
  })),
  data_sources: z.array(z.object({
    source: z.string(),
    credibility_score: z.number().min(0).max(1),
    last_updated: z.string(),
  })),
  cagr: z.number().optional(),
});

// TAM Calculation Types
export const TamCalculationInputSchema = z.object({
  industry: z.string().min(1),
  regions: z.array(z.string()).default(['global']),
  base_year: z.number().default(new Date().getFullYear()),
  methodology: z.enum(['top-down', 'bottom-up', 'hybrid']).default('hybrid'),
  scenarios: z.object({
    conservative: z.boolean().default(true),
    optimistic: z.boolean().default(true),
    pessimistic: z.boolean().default(true),
  }).default({}),
  addressable_population: z.number().optional(),
  penetration_rate: z.number().min(0).max(1).optional(),
});

export const TamResultSchema = z.object({
  tam_estimate: z.number(),
  currency: z.string().default('USD'),
  base_year: z.number(),
  methodology: z.string(),
  scenarios: z.object({
    conservative: z.number().optional(),
    optimistic: z.number().optional(),
    pessimistic: z.number().optional(),
  }),
  confidence_interval: z.object({
    lower_bound: z.number(),
    upper_bound: z.number(),
    confidence_level: z.number().min(0).max(1),
  }),
  breakdown: z.object({
    addressable_population: z.number(),
    penetration_rate: z.number(),
    average_revenue_per_user: z.number().optional(),
  }),
  data_sources: z.array(z.object({
    source: z.string(),
    contribution: z.number().min(0).max(1),
    credibility: z.number().min(0).max(1),
  })),
  sensitivity_analysis: z.array(z.object({
    variable: z.string(),
    impact: z.number(),
    variance: z.number(),
  })).optional(),
});

// SAM Calculation Types
export const SamCalculationInputSchema = z.object({
  tam_result: TamResultSchema,
  target_segments: z.array(z.string()),
  geographic_constraints: z.array(z.string()).optional(),
  regulatory_barriers: z.array(z.string()).optional(),
  competitive_filters: z.object({
    exclude_segments: z.array(z.string()).optional(),
    market_share_threshold: z.number().min(0).max(1).optional(),
  }).optional(),
  business_model_constraints: z.array(z.string()).optional(),
});

export const SamResultSchema = z.object({
  sam_estimate: z.number(),
  currency: z.string(),
  som_estimate: z.number().optional(),
  constraints_applied: z.array(z.object({
    constraint_type: z.string(),
    impact_factor: z.number().min(0).max(1),
    description: z.string(),
  })),
  segment_breakdown: z.array(z.object({
    segment: z.string(),
    size: z.number(),
    addressability: z.number().min(0).max(1),
  })),
  competitive_analysis: z.object({
    direct_competitors: z.number(),
    market_concentration: z.number().min(0).max(1),
    barriers_to_entry: z.enum(['low', 'medium', 'high']),
  }).optional(),
  time_to_market_impact: z.object({
    immediate: z.number(),
    year_1: z.number(),
    year_3: z.number(),
    year_5: z.number(),
  }).optional(),
});

// Market Segments Types
export const MarketSegmentsInputSchema = z.object({
  industry: z.string().min(1),
  segmentation_type: z.enum(['geographic', 'demographic', 'psychographic', 'behavioral', 'product']),
  depth_level: z.number().int().min(1).max(4).default(2),
  include_trends: z.boolean().default(false),
});

export const MarketSegmentHierarchySchema = z.object({
  industry: z.string(),
  segmentation_type: z.string(),
  segments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    parent_id: z.string().optional(),
    level: z.number(),
    market_size: z.number(),
    growth_rate: z.number().optional(),
    characteristics: z.array(z.string()),
    sub_segments: z.array(z.string()).default([]),
  })),
  total_market_size: z.number(),
});

// Market Forecast Types
export const MarketForecastInputSchema = z.object({
  industry: z.string().min(1),
  forecast_years: z.number().int().min(1).max(10),
  scenario_type: z.enum(['conservative', 'optimistic', 'pessimistic']).default('conservative'),
  confidence_level: z.number().min(0.5).max(0.99).default(0.95),
});

export const MarketForecastSchema = z.object({
  industry: z.string(),
  base_year: z.number(),
  forecast_data: z.array(z.object({
    year: z.number(),
    market_size: z.number(),
    growth_rate: z.number(),
    confidence_interval: z.object({
      lower: z.number(),
      upper: z.number(),
    }),
  })),
  scenario_type: z.string(),
  methodology: z.string(),
  key_assumptions: z.array(z.string()),
  risk_factors: z.array(z.object({
    factor: z.string(),
    probability: z.number().min(0).max(1),
    impact: z.enum(['low', 'medium', 'high']),
  })),
});

// Market Comparison Types
export const MarketComparisonInputSchema = z.object({
  industries: z.array(z.string()).min(2).max(10),
  comparison_metrics: z.array(z.enum(['size', 'growth', 'profitability', 'competition', 'innovation'])),
  time_period: z.tuple([z.number(), z.number()]),
  normalize: z.boolean().default(false),
});

export const MarketComparisonSchema = z.object({
  comparison_data: z.array(z.object({
    industry: z.string(),
    metrics: z.record(z.number()),
    rank: z.number(),
    score: z.number().min(0).max(100),
  })),
  correlations: z.array(z.object({
    metric1: z.string(),
    metric2: z.string(),
    correlation: z.number().min(-1).max(1),
  })),
  insights: z.array(z.string()),
  methodology: z.string(),
});

// Validation Types
export const ValidationInputSchema = z.object({
  market_size: z.number().positive(),
  industry: z.string().min(1),
  year: z.number(),
  sources: z.array(z.string()).optional(),
});

export const ValidationResultSchema = z.object({
  is_valid: z.boolean(),
  confidence_score: z.number().min(0).max(1),
  alternative_estimates: z.array(z.object({
    source: z.string(),
    estimate: z.number(),
    credibility: z.number().min(0).max(1),
  })),
  variance: z.number(),
  validation_notes: z.array(z.string()),
});

// Opportunity Analysis Types
export const OpportunityAnalysisInputSchema = z.object({
  industries: z.array(z.string()).optional(),
  growth_threshold: z.number().default(0.05),
  time_horizon: z.number().int().min(1).max(10).default(5),
});

export const OpportunityAnalysisSchema = z.object({
  opportunities: z.array(z.object({
    industry: z.string(),
    opportunity_score: z.number().min(0).max(100),
    market_size: z.number(),
    growth_potential: z.number(),
    competitive_intensity: z.enum(['low', 'medium', 'high']),
    barriers_to_entry: z.enum(['low', 'medium', 'high']),
    risk_factors: z.array(z.string()),
    time_to_opportunity: z.number(),
  })),
  methodology: z.string(),
  filters_applied: z.record(z.any()),
});

// Server Info Types
export const ServerInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  license: z.string(),
  repository: z.string(),
  documentation: z.string(),
});

export const DiscoveryResponseSchema = z.object({
  serverInfo: ServerInfoSchema,
  capabilities: z.object({
    tools: z.object({
      listChanged: z.boolean(),
      count: z.number(),
    }),
    resources: z.object({
      listChanged: z.boolean(),
      count: z.number(),
    }),
    logging: z.object({
      level: z.enum(['debug', 'info', 'warn', 'error']),
    }),
    prompts: z.object({
      listChanged: z.boolean(),
      count: z.number(),
    }),
  }),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.record(z.any()),
  })),
  transport: z.object({
    type: z.literal('http-streamable'),
    baseUrl: z.string(),
    endpoints: z.record(z.string()),
  }),
  rateLimits: z.object({
    requestsPerMinute: z.number(),
    concurrentRequests: z.number(),
    maxPayloadSize: z.string(),
  }),
  dataCompliance: z.object({
    gdprCompliant: z.boolean(),
    ccpaCompliant: z.boolean(),
    dataRetention: z.string(),
    privacyPolicy: z.string(),
  }),
});

// Export type aliases
export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
export type IndustrySearchInput = z.infer<typeof IndustrySearchInputSchema>;
export type IndustrySearchResult = z.infer<typeof IndustrySearchResultSchema>;
export type IndustryDataInput = z.infer<typeof IndustryDataInputSchema>;
export type IndustryData = z.infer<typeof IndustryDataSchema>;
export type MarketSizeInput = z.infer<typeof MarketSizeInputSchema>;
export type MarketSizeResult = z.infer<typeof MarketSizeResultSchema>;
export type TamCalculationInput = z.infer<typeof TamCalculationInputSchema>;
export type TamResult = z.infer<typeof TamResultSchema>;
export type SamCalculationInput = z.infer<typeof SamCalculationInputSchema>;
export type SamResult = z.infer<typeof SamResultSchema>;
export type MarketSegmentsInput = z.infer<typeof MarketSegmentsInputSchema>;
export type MarketSegmentHierarchy = z.infer<typeof MarketSegmentHierarchySchema>;
export type MarketForecastInput = z.infer<typeof MarketForecastInputSchema>;
export type MarketForecast = z.infer<typeof MarketForecastSchema>;
export type MarketComparisonInput = z.infer<typeof MarketComparisonInputSchema>;
export type MarketComparison = z.infer<typeof MarketComparisonSchema>;
export type ValidationInput = z.infer<typeof ValidationInputSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type OpportunityAnalysisInput = z.infer<typeof OpportunityAnalysisInputSchema>;
export type OpportunityAnalysis = z.infer<typeof OpportunityAnalysisSchema>;
export type ServerInfo = z.infer<typeof ServerInfoSchema>;
export type DiscoveryResponse = z.infer<typeof DiscoveryResponseSchema>;
