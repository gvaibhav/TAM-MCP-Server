import { z } from "zod";

// Market and Industry Data Types
export interface Industry {
  id: string;
  name: string;
  description: string;
  naicsCode?: string;
  sicCode?: string;
  parentIndustry?: string;
  subIndustries: string[];
  keyMetrics: {
    marketSize?: number;
    growthRate?: number;
    cagr?: number;
    volatility?: number;
  };
  geography: string[];
  lastUpdated: string;
}

export interface MarketSize {
  value: number;
  currency: string;
  year: number;
  region: string;
  methodology: "top-down" | "bottom-up" | "hybrid";
  confidenceScore: number;
  sources: string[];
  segments?: MarketSegment[];
}

export interface MarketSegment {
  name: string;
  value: number;
  percentage: number;
  growthRate: number;
  description?: string;
}

export interface TAMCalculation {
  totalAddressableMarket: number;
  methodology: string;
  assumptions: string[];
  scenarios: {
    conservative: number;
    realistic: number;
    optimistic: number;
  };
  breakdown: {
    population?: number;
    penetrationRate?: number;
    averageSpending?: number;
  };
  confidenceScore: number;
  sources: string[];
}

export interface SAMCalculation {
  serviceableAddressableMarket: number;
  serviceableObtainableMarket?: number;
  targetSegments: string[];
  geographicConstraints: string[];
  competitiveFactors: string[];
  marketShare: {
    current?: number;
    target: number;
    timeframe: string;
  };
}

export interface MarketForecast {
  year: number;
  projectedSize: number;
  growthRate: number;
  factors: string[];
  confidence: number;
}

export interface MarketComparison {
  markets: {
    name: string;
    currentSize: number;
    growthRate: number;
    cagr: number;
    region: string;
  }[];
  analysis: string;
  recommendations: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  marketSize: number;
  growthPotential: number;
  competitiveIntensity: "low" | "medium" | "high";
  barrierToEntry: "low" | "medium" | "high";
  timeToMarket: string;
  riskFactors: string[];
  requirements: string[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    timestamp: string;
    source: string;
    cached: boolean;
    ttl?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  dataQuality: "high" | "medium" | "low";
  lastValidated: string;
}

// Tool Input Schemas
export const IndustrySearchSchema = z.object({
  query: z
    .string()
    .default("technology")
    .describe(
      "Industry name, description, or keywords to search for (default: 'technology')",
    ),
  limit: z.number().default(10).describe("Maximum number of results to return"),
  includeSubIndustries: z
    .boolean()
    .default(true)
    .describe("Include sub-industries in results"),
});

export const IndustryDataSchema = z.object({
  industry_id: z
    .string()
    .default("54")
    .describe(
      "Industry identifier or NAICS/SIC code (default: '54' - Professional Services)",
    ),
  include_trends: z
    .boolean()
    .default(false)
    .describe("Include industry trends in the response"),
  include_players: z
    .boolean()
    .default(false)
    .describe("Include key market players in the response"),
  include_esg: z
    .boolean()
    .default(false)
    .describe("Include ESG scoring data in the response"),
});

export const MarketSizeSchema = z.object({
  industryId: z
    .string()
    .default("54")
    .describe("Industry identifier (default: '54' - Professional Services)"),
  region: z
    .string()
    .default("global")
    .describe("Geographic region (global, US, EU, etc.)"),
  year: z
    .number()
    .optional()
    .describe("Specific year for market size (current year if not specified)"),
  currency: z
    .string()
    .default("USD")
    .describe("Currency for market size values"),
  methodology: z
    .enum(["top-down", "bottom-up", "hybrid"])
    .optional()
    .describe("Preferred calculation methodology"),
});

export const TAMCalculatorSchema = z.object({
  industryId: z
    .string()
    .default("54")
    .describe("Industry identifier (default: '54' - Professional Services)"),
  region: z.string().default("global").describe("Geographic region"),
  population: z.number().optional().describe("Target population size"),
  penetrationRate: z
    .number()
    .optional()
    .describe("Expected market penetration rate (0-1)"),
  averageSpending: z
    .number()
    .optional()
    .describe("Average spending per customer"),
  includeScenarios: z
    .boolean()
    .default(true)
    .describe("Include optimistic/pessimistic scenarios"),
});

export const SAMCalculatorSchema = z.object({
  tamValue: z
    .number()
    .default(1000000000)
    .describe("Total Addressable Market value (default: $1B)"),
  targetSegments: z
    .array(z.string())
    .default(["enterprise"])
    .describe("Target market segments (default: ['enterprise'])"),
  geographicConstraints: z
    .array(z.string())
    .default([])
    .describe("Geographic limitations"),
  competitiveFactors: z
    .array(z.string())
    .default([])
    .describe("Competitive considerations"),
  targetMarketShare: z
    .number()
    .min(0)
    .max(1)
    .default(0.05)
    .describe("Target market share (0-1, default: 5%)"),
  timeframe: z
    .string()
    .default("3-5 years")
    .describe("Timeframe for market capture"),
});

export const MarketSegmentsSchema = z.object({
  industryId: z
    .string()
    .default("54")
    .describe("Industry identifier (default: '54' - Professional Services)"),
  segmentationType: z
    .enum(["demographic", "geographic", "psychographic", "behavioral"])
    .default("demographic")
    .describe("Type of segmentation (default: 'demographic')"),
  region: z.string().default("global").describe("Geographic region"),
  minSegmentSize: z
    .number()
    .default(0)
    .describe("Minimum segment size to include"),
});

export const MarketForecastingSchema = z.object({
  industryId: z
    .string()
    .default("technology")
    .describe("Industry identifier (default: technology)"),
  years: z.number().default(5).describe("Number of years to forecast"),
  region: z.string().default("global").describe("Geographic region"),
  includeScenarios: z
    .boolean()
    .default(true)
    .describe("Include multiple forecast scenarios"),
  factors: z
    .array(z.string())
    .default([])
    .describe("Specific factors to consider in forecast"),
});

export const MarketComparisonSchema = z.object({
  industryIds: z
    .array(z.string())
    .min(2)
    .default(["technology", "healthcare"])
    .describe(
      "List of industry identifiers to compare (default: technology, healthcare)",
    ),
  metrics: z
    .array(z.string())
    .default(["size", "growth", "cagr"])
    .describe("Metrics to compare"),
  region: z
    .string()
    .default("global")
    .describe("Geographic region for comparison"),
  timeframe: z
    .string()
    .default("current")
    .describe("Time period for comparison"),
});

export const DataValidationSchema = z.object({
  dataType: z
    .enum(["market-size", "industry-data", "forecast", "tam-calculation"])
    .default("market-size")
    .describe("Type of data to validate (default: market-size)"),
  data: z
    .record(z.any())
    .default({})
    .describe("Data object to validate (default: empty object)"),
  strictMode: z
    .boolean()
    .default(false)
    .describe("Apply strict validation rules"),
});

export const MarketOpportunitiesSchema = z.object({
  industryId: z
    .string()
    .default("technology")
    .describe("Industry identifier (default: technology)"),
  region: z.string().default("global").describe("Geographic region"),
  minMarketSize: z
    .number()
    .default(0)
    .describe("Minimum market size to consider"),
  maxCompetition: z
    .enum(["low", "medium", "high"])
    .default("high")
    .describe("Maximum acceptable competition level"),
  timeframe: z
    .string()
    .default("1-3 years")
    .describe("Time horizon for opportunities"),
});

// Enhanced ESG Analysis Interface for Phase 3 Refinement
export interface EnhancedESGAnalysis {
  environmental_trends: ESGTrend[];
  social_impact_factors: SocialImpactFactor[];
  governance_risk_assessment: GovernanceRisk[];
  esg_benchmark_comparison: ESGBenchmark[];
  regulatory_compliance_score: number;
  overall_esg_momentum: "improving" | "stable" | "declining";
  material_esg_issues: string[];
}

export interface ESGTrend {
  category: "environmental" | "social" | "governance";
  trend_name: string;
  direction: "accelerating" | "decelerating" | "stable";
  impact_score: number; // 0-100
  time_horizon: string;
  regulatory_driver: boolean;
}

export interface SocialImpactFactor {
  factor: string;
  impact_level: "high" | "medium" | "low";
  stakeholder_groups: string[];
  mitigation_strategies: string[];
}

export interface GovernanceRisk {
  risk_type: string;
  severity: "critical" | "high" | "medium" | "low";
  likelihood: number; // 0-1
  industry_exposure: number; // 0-1
}

export interface ESGBenchmark {
  peer_industry: string;
  environmental_score_diff: number;
  social_score_diff: number;
  governance_score_diff: number;
  competitive_advantage: string[];
}

// Enhanced Trend Analysis for Business Analysts
export interface AdvancedTrendAnalysis {
  trend_strength: number; // 0-100
  trend_direction: "accelerating" | "decelerating" | "stable";
  correlation_factors: CorrelationFactor[];
  predictive_indicators: PredictiveIndicator[];
  sentiment_analysis: SentimentScore;
  market_disruption_probability: number; // 0-1
}

export interface CorrelationFactor {
  factor: string;
  correlation_coefficient: number; // -1 to 1
  significance_level: number;
  time_lag_months: number;
}

export interface PredictiveIndicator {
  indicator: string;
  current_value: number;
  predicted_value_6m: number;
  predicted_value_12m: number;
  confidence_interval: [number, number];
}

export interface SentimentScore {
  overall_sentiment: number; // -1 to 1
  news_sentiment: number;
  analyst_sentiment: number;
  regulatory_sentiment: number;
  trend_consistency: number; // 0-1
}

// Enhanced Industry Data Response Interface for Phase 3
export interface IndustryData {
  industry: {
    id: string;
    name: string;
    description: string;
    naics_code?: string;
    sic_code?: string;
  };
  market_size_usd: number;
  key_metrics: {
    growth_rate: number;
    cagr_5y: number;
    volatility_index: number;
    competitive_intensity: "low" | "medium" | "high";
    market_maturity: "emerging" | "growth" | "mature" | "declining";
    regulatory_complexity: "low" | "medium" | "high";
  };
  trends?: AdvancedTrendAnalysis;
  key_players?: Array<{
    name: string;
    market_share: number;
    revenue: number;
    headquarters: string;
    public_company: boolean;
  }>;
  esg_data?: EnhancedESGAnalysis;
  last_updated: string;
  data_sources: string[];
  confidence_score: number;
}

// ...existing code...

export type IndustrySearchInput = z.infer<typeof IndustrySearchSchema>;
export type IndustryDataInput = z.infer<typeof IndustryDataSchema>;
export type MarketSizeInput = z.infer<typeof MarketSizeSchema>;
export type TAMCalculatorInput = z.infer<typeof TAMCalculatorSchema>;
export type SAMCalculatorInput = z.infer<typeof SAMCalculatorSchema>;
export type MarketSegmentsInput = z.infer<typeof MarketSegmentsSchema>;
export type MarketForecastingInput = z.infer<typeof MarketForecastingSchema>;
export type MarketComparisonInput = z.infer<typeof MarketComparisonSchema>;
export type DataValidationInput = z.infer<typeof DataValidationSchema>;
export type MarketOpportunitiesInput = z.infer<
  typeof MarketOpportunitiesSchema
>;
