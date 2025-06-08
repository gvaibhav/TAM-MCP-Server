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
  methodology: 'top-down' | 'bottom-up' | 'hybrid';
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
  competitiveIntensity: 'low' | 'medium' | 'high';
  barrierToEntry: 'low' | 'medium' | 'high';
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
  dataQuality: 'high' | 'medium' | 'low';
  lastValidated: string;
}

// Tool Input Schemas
export const IndustrySearchSchema = z.object({
  query: z.string().describe("Industry name, description, or keywords to search for"),
  limit: z.number().default(10).describe("Maximum number of results to return"),
  includeSubIndustries: z.boolean().default(true).describe("Include sub-industries in results"),
});

export const IndustryDataSchema = z.object({
  industryId: z.string().describe("Industry identifier or NAICS/SIC code"),
  includeMetrics: z.boolean().default(true).describe("Include market metrics and KPIs"),
  region: z.string().optional().describe("Geographic region to focus on"),
});

export const MarketSizeSchema = z.object({
  industryId: z.string().describe("Industry identifier"),
  region: z.string().default("global").describe("Geographic region (global, US, EU, etc.)"),
  year: z.number().optional().describe("Specific year for market size (current year if not specified)"),
  currency: z.string().default("USD").describe("Currency for market size values"),
  methodology: z.enum(['top-down', 'bottom-up', 'hybrid']).optional().describe("Preferred calculation methodology"),
});

export const TAMCalculatorSchema = z.object({
  industryId: z.string().describe("Industry identifier"),
  region: z.string().default("global").describe("Geographic region"),
  population: z.number().optional().describe("Target population size"),
  penetrationRate: z.number().optional().describe("Expected market penetration rate (0-1)"),
  averageSpending: z.number().optional().describe("Average spending per customer"),
  includeScenarios: z.boolean().default(true).describe("Include optimistic/pessimistic scenarios"),
});

export const SAMCalculatorSchema = z.object({
  tamValue: z.number().describe("Total Addressable Market value"),
  targetSegments: z.array(z.string()).describe("Target market segments"),
  geographicConstraints: z.array(z.string()).default([]).describe("Geographic limitations"),
  competitiveFactors: z.array(z.string()).default([]).describe("Competitive considerations"),
  targetMarketShare: z.number().min(0).max(1).describe("Target market share (0-1)"),
  timeframe: z.string().default("3-5 years").describe("Timeframe for market capture"),
});

export const MarketSegmentsSchema = z.object({
  industryId: z.string().describe("Industry identifier"),
  segmentationType: z.enum(['demographic', 'geographic', 'psychographic', 'behavioral']).describe("Type of segmentation"),
  region: z.string().default("global").describe("Geographic region"),
  minSegmentSize: z.number().default(0).describe("Minimum segment size to include"),
});

export const MarketForecastingSchema = z.object({
  industryId: z.string().describe("Industry identifier"),
  years: z.number().default(5).describe("Number of years to forecast"),
  region: z.string().default("global").describe("Geographic region"),
  includeScenarios: z.boolean().default(true).describe("Include multiple forecast scenarios"),
  factors: z.array(z.string()).default([]).describe("Specific factors to consider in forecast"),
});

export const MarketComparisonSchema = z.object({
  industryIds: z.array(z.string()).min(2).describe("List of industry identifiers to compare"),
  metrics: z.array(z.string()).default(['size', 'growth', 'cagr']).describe("Metrics to compare"),
  region: z.string().default("global").describe("Geographic region for comparison"),
  timeframe: z.string().default("current").describe("Time period for comparison"),
});

export const DataValidationSchema = z.object({
  dataType: z.enum(['market-size', 'industry-data', 'forecast', 'tam-calculation']).describe("Type of data to validate"),
  data: z.record(z.any()).describe("Data object to validate"),
  strictMode: z.boolean().default(false).describe("Apply strict validation rules"),
});

export const MarketOpportunitiesSchema = z.object({
  industryId: z.string().describe("Industry identifier"),
  region: z.string().default("global").describe("Geographic region"),
  minMarketSize: z.number().default(0).describe("Minimum market size to consider"),
  maxCompetition: z.enum(['low', 'medium', 'high']).default('high').describe("Maximum acceptable competition level"),
  timeframe: z.string().default("1-3 years").describe("Time horizon for opportunities"),
});

export type IndustrySearchInput = z.infer<typeof IndustrySearchSchema>;
export type IndustryDataInput = z.infer<typeof IndustryDataSchema>;
export type MarketSizeInput = z.infer<typeof MarketSizeSchema>;
export type TAMCalculatorInput = z.infer<typeof TAMCalculatorSchema>;
export type SAMCalculatorInput = z.infer<typeof SAMCalculatorSchema>;
export type MarketSegmentsInput = z.infer<typeof MarketSegmentsSchema>;
export type MarketForecastingInput = z.infer<typeof MarketForecastingSchema>;
export type MarketComparisonInput = z.infer<typeof MarketComparisonSchema>;
export type DataValidationInput = z.infer<typeof DataValidationSchema>;
export type MarketOpportunitiesInput = z.infer<typeof MarketOpportunitiesSchema>;
