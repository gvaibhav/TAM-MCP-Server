import { AlphaVantageService } from "./datasources/AlphaVantageService.js";
import { FredService } from "./datasources/FredService.js";
import { ImfService } from "./datasources/ImfService.js";
import { NasdaqService } from "./datasources/NasdaqService.js";
import { OecdService } from "./datasources/OecdService.js";
import { WorldBankService } from "./datasources/WorldBankService.js";
import { BlsService } from "./datasources/BlsService.js";
import { CensusService } from "./datasources/CensusService.js";
import {
  IndustryDataInput,
  IndustryData,
  AdvancedTrendAnalysis,
  EnhancedESGAnalysis,
} from "../types/index.js";
import { logger } from "../utils/index.js";

export class DataService {
  private alphaVantageService: AlphaVantageService;
  private fredService: FredService;
  private imfService: ImfService;
  private nasdaqService: NasdaqService;
  private oecdService: OecdService;
  private worldBankService: WorldBankService;
  private blsService: BlsService;
  private censusService: CensusService;

  constructor() {
    this.alphaVantageService = new AlphaVantageService();
    this.fredService = new FredService();
    this.imfService = new ImfService();
    this.nasdaqService = new NasdaqService();
    this.oecdService = new OecdService();
    this.worldBankService = new WorldBankService();
    this.blsService = new BlsService();
    this.censusService = new CensusService();
  }

  // Alpha Vantage methods
  async getAlphaVantageData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "OVERVIEW":
        return this.alphaVantageService.getCompanyOverview(params.symbol);
      case "SYMBOL_SEARCH":
        return this.alphaVantageService.searchSymbols(params.keywords);
      case "INCOME_STATEMENT":
        return this.alphaVantageService.getIncomeStatement(
          params.symbol,
          params.period,
        );
      case "BALANCE_SHEET":
        return this.alphaVantageService.getBalanceSheet(
          params.symbol,
          params.period,
        );
      case "CASH_FLOW":
        return this.alphaVantageService.getCashFlow(
          params.symbol,
          params.period,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for AlphaVantageService`,
        );
    }
  }

  // FRED methods
  async getFredData(params: any): Promise<any> {
    return this.fredService.getSeriesObservations(params.seriesId, params);
  }

  // IMF methods
  async getImfData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "fetchImfDataset":
        return this.imfService.fetchImfDataset(
          params.dataflowId,
          params.key,
          params.startPeriod,
          params.endPeriod,
        );
      case "fetchMarketSize":
        return this.imfService.fetchMarketSize(
          params.industryId,
          params.region,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for ImfService`,
        );
    }
  }

  // Nasdaq methods
  async getNasdaqData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "fetchIndustryData":
        return this.nasdaqService.fetchIndustryData(
          params.databaseCode || "ZILLOW",
          params.datasetCode || "Z77006_A",
          params,
        );
      case "fetchMarketSize":
        return this.nasdaqService.fetchMarketSize(
          params.databaseCode,
          params.datasetCode,
          params.valueColumn,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for NasdaqService`,
        );
    }
  }

  // OECD methods
  async getOecdData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "fetchOecdDataset":
        return this.oecdService.fetchOecdDataset(params);
      case "fetchMarketSize":
        return this.oecdService.fetchMarketSize(
          params.datasetId,
          params.filterExpression,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for OecdService`,
        );
    }
  }

  // World Bank methods
  async getWorldBankData(params: any): Promise<any> {
    return this.worldBankService.fetchMarketSize(
      params.industryId || params.countryCode,
    );
  }

  // BLS methods
  async getBlsData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "fetchSeriesData":
        return this.blsService.fetchSeriesData(params);
      case "fetchIndustryData":
        return this.blsService.fetchIndustryData(params);
      case "fetchMarketSize":
        return this.blsService.fetchMarketSize(
          params.industryId,
          params.region,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for BlsService`,
        );
    }
  }

  // Census methods
  async getCensusData(apiFunction: string, params: any): Promise<any> {
    switch (apiFunction) {
      case "fetchIndustryData":
        return this.censusService.fetchIndustryData(params);
      case "fetchMarketSize":
        return this.censusService.fetchMarketSize(params);
      case "getData":
        return this.censusService.getData(
          params.dataset || "pep",
          params.variables || "POP",
          params.geography || "us",
          params,
        );
      default:
        throw new Error(
          `Function ${apiFunction} not implemented for CensusService`,
        );
    }
  }

  // Company Financials method (consolidates Alpha Vantage financial statements)
  async getCompanyFinancials(params: any): Promise<any> {
    const { companySymbol, statementType, period, limit } = params;

    switch (statementType) {
      case "OVERVIEW":
        return this.alphaVantageService.getCompanyOverview(companySymbol);
      case "INCOME_STATEMENT": {
        const incomeData = await this.alphaVantageService.getIncomeStatement(
          companySymbol,
          period,
        );
        return limit > 1
          ? incomeData.slice(0, limit)
          : incomeData[0] || incomeData;
      }
      case "BALANCE_SHEET": {
        const balanceData = await this.alphaVantageService.getBalanceSheet(
          companySymbol,
          period,
        );
        return limit > 1
          ? balanceData.slice(0, limit)
          : balanceData[0] || balanceData;
      }
      case "CASH_FLOW": {
        const cashFlowData = await this.alphaVantageService.getCashFlow(
          companySymbol,
          period,
        );
        return limit > 1
          ? cashFlowData.slice(0, limit)
          : cashFlowData[0] || cashFlowData;
      }
      default:
        throw new Error(`Statement type ${statementType} not supported`);
    }
  }

  /**
   * Search industries - supports both legacy and new call patterns
   */
  async searchIndustries(
    queryOrParams: string | any,
    limit?: number,
  ): Promise<any> {
    let query: string;
    let actualLimit: number;

    if (typeof queryOrParams === "string") {
      // Legacy call pattern: searchIndustries(query, limit)
      query = queryOrParams;
      actualLimit = limit ?? 10;
    } else {
      // New call pattern: searchIndustries({ query, limit })
      query = queryOrParams.query;
      actualLimit = queryOrParams.limit || 10;
    }

    logger.debug("SearchIndustries called", { query, limit: actualLimit });

    // Mock data for compatibility
    return [
      {
        id: "tech-software",
        name: "Software & Technology",
        description:
          "The software and technology industry encompasses companies that develop, maintain, and publish software applications, systems, and platforms.",
        naicsCode: "541511",
        sicCode: "7372",
        parentIndustry: "technology",
        subIndustries: ["saas", "enterprise-software", "mobile-apps"],
        keyMetrics: {
          marketSize: 650000000000,
          growthRate: 0.12,
          cagr: 0.085,
          volatility: 0.25,
        },
        geography: ["global", "US", "EU"],
        lastUpdated: new Date().toISOString(),
        defaultRegion: "US",
        source: "enhanced-industry-database",
      },
    ];
  }

  // Method for tam_calculator tool
  async calculateTam(params: any): Promise<any> {
    logger.info("DataService.calculateTam called with:", params);
    const {
      baseMarketSize,
      annualGrowthRate,
      projectionYears,
      segmentationAdjustments,
    } = params;
    let calculatedTam = baseMarketSize;
    const projectionDetails: { year: number; tam: number }[] = [];
    const assumptions = [
      `Constant annual growth rate of ${annualGrowthRate * 100}%`,
    ];

    for (let i = 1; i <= projectionYears; i++) {
      calculatedTam *= 1 + annualGrowthRate;
      projectionDetails.push({ year: i, tam: calculatedTam });
    }

    if (segmentationAdjustments?.factor) {
      calculatedTam *= segmentationAdjustments.factor;
      assumptions.push(
        `Applied segmentation adjustment factor of ${segmentationAdjustments.factor}. Rationale: ${segmentationAdjustments.rationale || "Not specified"}`,
      );
    }

    return {
      calculatedTam,
      projectionDetails,
      assumptions,
    };
  }

  // Method for market_size_calculator tool
  async calculateMarketSize(params: any): Promise<any> {
    logger.info("DataService.calculateMarketSize called with:", params);
    // This method will involve:
    // 1. Parsing industryQuery and geographyCodes
    // 2. Calling other DataService methods or specific data source services
    //    (e.g., searchIndustries, or direct calls to get data from Census, BLS, World Bank)
    // 3. Applying a methodology (top_down, bottom_up, auto)
    // 4. Synthesizing data and calculating market size
    return {
      estimatedMarketSize: 0, // Placeholder
      currency: "USD",
      year: params.year || new Date().getFullYear().toString(),
      dataSourcesUsed: [],
      confidenceScore: 0.5, // Placeholder
    };
  }

  // Add other methods for analytical/calculation tools as needed

  /**
   * Get detailed data for a specific industry with enhanced Phase 3 analytics
   */
  async getIndustryData(input: IndustryDataInput): Promise<IndustryData> {
    logger.debug("Getting industry data", { industryId: input.industry_id });

    // Enhanced ESG analysis for Phase 3 refinement
    const enhancedESGData: EnhancedESGAnalysis | undefined = input.include_esg
      ? {
          environmental_trends: [
            {
              category: "environmental" as const,
              trend_name: "Carbon Neutrality Commitments",
              direction: "accelerating" as const,
              impact_score: 85,
              time_horizon: "2025-2030",
              regulatory_driver: true,
            },
            {
              category: "environmental" as const,
              trend_name: "Renewable Energy Adoption",
              direction: "accelerating" as const,
              impact_score: 75,
              time_horizon: "2024-2027",
              regulatory_driver: false,
            },
          ],
          social_impact_factors: [
            {
              factor: "Remote Work Policies",
              impact_level: "high" as const,
              stakeholder_groups: ["employees", "communities", "customers"],
              mitigation_strategies: [
                "hybrid work models",
                "digital inclusion programs",
              ],
            },
            {
              factor: "Data Privacy & Security",
              impact_level: "high" as const,
              stakeholder_groups: ["customers", "regulators", "shareholders"],
              mitigation_strategies: [
                "zero-trust security",
                "privacy-by-design",
              ],
            },
          ],
          governance_risk_assessment: [
            {
              risk_type: "AI Ethics & Algorithmic Bias",
              severity: "high" as const,
              likelihood: 0.7,
              industry_exposure: 0.9,
            },
            {
              risk_type: "Supply Chain Transparency",
              severity: "medium" as const,
              likelihood: 0.5,
              industry_exposure: 0.6,
            },
          ],
          esg_benchmark_comparison: [
            {
              peer_industry: "Financial Services",
              environmental_score_diff: +5,
              social_score_diff: -2,
              governance_score_diff: +8,
              competitive_advantage: [
                "Digital transformation leadership",
                "Talent attraction",
              ],
            },
          ],
          regulatory_compliance_score: 87,
          overall_esg_momentum: "improving" as const,
          material_esg_issues: [
            "Data governance and privacy",
            "AI ethics and responsible innovation",
            "Digital inclusion and accessibility",
          ],
        }
      : undefined;

    // Enhanced trend analysis for Phase 3 refinement
    const enhancedTrendData: AdvancedTrendAnalysis | undefined =
      input.include_trends
        ? {
            trend_strength: 92,
            trend_direction: "accelerating" as const,
            correlation_factors: [
              {
                factor: "Cloud Infrastructure Adoption",
                correlation_coefficient: 0.85,
                significance_level: 0.01,
                time_lag_months: 6,
              },
              {
                factor: "Data Volumes Growth",
                correlation_coefficient: 0.78,
                significance_level: 0.02,
                time_lag_months: 3,
              },
            ],
            predictive_indicators: [
              {
                indicator: "Cloud Adoption Rate",
                current_value: 75,
                predicted_value_6m: 85,
                predicted_value_12m: 92,
                confidence_interval: [80, 95],
              },
            ],
            sentiment_analysis: {
              overall_sentiment: 0.85,
              news_sentiment: 0.78,
              analyst_sentiment: 0.92,
              regulatory_sentiment: 0.75,
              trend_consistency: 0.88,
            },
            market_disruption_probability: 0.25,
          }
        : undefined;

    // Mock data with enhanced analytics - replace with actual data source integration
    const mockData: IndustryData = {
      industry: {
        id: input.industry_id,
        name: "Software & Technology",
        description:
          "The software and technology industry encompasses companies that develop, maintain, and publish software applications, systems, and platforms.",
        naics_code: "541511",
        sic_code: "7372",
      },
      market_size_usd: 650000000000, // $650B
      key_metrics: {
        growth_rate: 0.12, // 12%
        cagr_5y: 0.085, // 8.5%
        volatility_index: 0.25,
        competitive_intensity: "high" as const,
        market_maturity: "growth" as const,
        regulatory_complexity: "medium" as const,
      },
      last_updated: new Date().toISOString(),
      data_sources: [
        "census-bureau",
        "bls-data",
        "alpha-vantage",
        "industry-reports",
      ],
      confidence_score: 0.87,
      ...(enhancedTrendData && { trends: enhancedTrendData }),
      ...(input.include_players && {
        key_players: [
          {
            name: "Microsoft Corporation",
            market_share: 0.18,
            revenue: 211000000000,
            headquarters: "Redmond, WA",
            public_company: true,
          },
          {
            name: "Amazon Web Services",
            market_share: 0.15,
            revenue: 80000000000,
            headquarters: "Seattle, WA",
            public_company: true,
          },
          {
            name: "Google LLC",
            market_share: 0.12,
            revenue: 282000000000,
            headquarters: "Mountain View, CA",
            public_company: true,
          },
        ],
      }),
      ...(enhancedESGData && { esg_data: enhancedESGData }),
    };

    return mockData;
  }

  /**
   * Get industry by ID - legacy support method for market-tools.ts
   */
  async getIndustryById(industryId: string): Promise<any> {
    logger.debug("Getting industry by ID", { industryId });

    // Mock industry data for compatibility
    return {
      id: industryId,
      name: "Software & Technology",
      description:
        "The software and technology industry encompasses companies that develop, maintain, and publish software applications, systems, and platforms.",
      naicsCode: "541511",
      sicCode: "7372",
      parentIndustry: "technology",
      subIndustries: ["saas", "enterprise-software", "mobile-apps"],
      keyMetrics: {
        marketSize: 650000000000,
        growthRate: 0.12,
        cagr: 0.085,
        volatility: 0.25,
      },
      geography: ["global", "US", "EU"],
      lastUpdated: new Date().toISOString(),
      defaultRegion: "US",
      source: "enhanced-industry-database",
    };
  }

  /**
   * Get market size - legacy support method for market-tools.ts
   */
  async getMarketSize(industryId: string, region: string): Promise<any> {
    logger.debug("Getting market size", { industryId, region });

    // Mock market size data for compatibility
    return {
      value: 650000000000,
      details: {
        year: new Date().getFullYear(),
        region,
        methodology: "bottom-up",
        confidenceScore: 0.85,
        segments: [
          {
            name: "Enterprise Software",
            value: 325000000000,
            percentage: 0.5,
            growthRate: 0.15,
          },
          {
            name: "Consumer Applications",
            value: 195000000000,
            percentage: 0.3,
            growthRate: 0.1,
          },
        ],
        sources: ["industry-reports", "market-analytics"],
      },
      source: "enhanced-market-database",
    };
  }

  /**
   * Get market segments - legacy support method for market-tools.ts
   */
  async getMarketSegments(industryId: string, region: string): Promise<any> {
    logger.debug("Getting market segments", { industryId, region });

    // Mock segments for compatibility
    return [
      {
        segmentName: "Enterprise Software",
        value: 325000000000,
        percentage: 0.5,
        growthRate: 0.15,
      },
      {
        segmentName: "Consumer Applications",
        value: 195000000000,
        percentage: 0.3,
        growthRate: 0.1,
      },
      {
        segmentName: "Developer Tools",
        value: 130000000000,
        percentage: 0.2,
        growthRate: 0.18,
      },
    ];
  }

  /**
   * Get specific data source data - legacy support method for market-tools.ts
   */
  async getSpecificDataSourceData(
    sourceName: string,
    methodName: string,
    params: any[],
  ): Promise<any> {
    logger.debug("Getting specific data source data", {
      sourceName,
      methodName,
      params,
    });

    try {
      // Route to appropriate data source service based on sourceName
      switch (sourceName.toLowerCase()) {
        case "blsservice":
          if (methodName === "fetchIndustryData") {
            return this.blsService.fetchIndustryData(params[0]);
          } else if (methodName === "fetchSeriesData") {
            return this.blsService.fetchSeriesData(params[0]);
          }
          break;
        case "censusservice":
          if (methodName === "fetchIndustryData") {
            return this.censusService.fetchIndustryData(params[0]);
          } else if (methodName === "fetchMarketSize") {
            return this.censusService.fetchMarketSize(params[0]);
          }
          break;
        case "fredservice":
          if (methodName === "getSeriesObservations") {
            return this.fredService.getSeriesObservations(params[0], params[1]);
          }
          break;
        case "alphavantageservice":
          if (methodName === "getCompanyOverview") {
            return this.alphaVantageService.getCompanyOverview(params[0]);
          } else if (methodName === "searchSymbols") {
            return this.alphaVantageService.searchSymbols(params[0]);
          }
          break;
        case "worldbankservice":
          if (methodName === "fetchMarketSize") {
            return this.worldBankService.fetchMarketSize(params[0]);
          }
          break;
        case "imfservice":
          if (methodName === "fetchImfDataset") {
            return this.imfService.fetchImfDataset(
              params[0],
              params[1],
              params[2],
              params[3],
            );
          }
          break;
        case "nasdaqservice":
          if (methodName === "fetchDatasetTimeSeries") {
            return this.nasdaqService.fetchDatasetTimeSeries(
              params[0],
              params[1],
              params[2],
            );
          }
          break;
        case "oecdservice":
          if (methodName === "fetchOecdDataset") {
            return this.oecdService.fetchOecdDataset(params[0]);
          }
          break;
        default:
          throw new Error(`Unknown data source: ${sourceName}`);
      }

      throw new Error(`Method ${methodName} not found on ${sourceName}`);
    } catch (error) {
      logger.error("Failed to get specific data source data", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Generate market forecast - legacy support method for market-tools.ts
   */
  async generateMarketForecast(
    industryId: string,
    years: number,
    region: string,
  ): Promise<any> {
    logger.debug("Generating market forecast", { industryId, years, region });

    // Mock forecast data for compatibility
    const currentYear = new Date().getFullYear();
    const forecasts = [];
    let baseSize = 650000000000; // $650B starting point

    for (let i = 1; i <= years; i++) {
      const year = currentYear + i;
      const growthRate = 0.12; // 12% annual growth
      baseSize *= 1 + growthRate;

      forecasts.push({
        year,
        projectedSize: baseSize,
        growthRate,
        confidence: 0.85 - i * 0.05, // Decreasing confidence over time
      });
    }

    return {
      industryId,
      region,
      projectionYears: years,
      forecasts,
      assumptions: [
        "Continued digital transformation",
        "Stable economic conditions",
      ],
      methodology: "trend-extrapolation",
      confidenceScore: 0.82,
    };
  }

  /**
   * Get supported currencies - legacy support method for market-tools.ts
   */
  async getSupportedCurrencies(): Promise<string[]> {
    logger.debug("Getting supported currencies");

    return [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
      "BRL",
    ];
  }

  /**
   * Get market opportunities - legacy support method for market-tools.ts
   */
  async getMarketOpportunities(
    industryId: string,
    region: string,
    minMarketSize: number,
  ): Promise<any> {
    logger.debug("Getting market opportunities", {
      industryId,
      region,
      minMarketSize,
    });

    // Mock opportunities data for compatibility
    return {
      industryId,
      region,
      opportunities: [
        {
          id: "ai-automation",
          title: "AI-Powered Automation Tools",
          description: "Growing demand for intelligent automation solutions",
          marketSize: 85000000000, // $85B
          growthPotential: 0.25, // 25% annual growth
          competitiveIntensity: "medium",
          barrierToEntry: "high",
          timeToMarket: "18-24 months",
          riskFactors: ["Regulatory uncertainty", "Technology adoption rates"],
          requirements: [
            "AI expertise",
            "Large datasets",
            "Significant R&D investment",
          ],
        },
        {
          id: "edge-computing",
          title: "Edge Computing Infrastructure",
          description:
            "Distributed computing solutions for low-latency applications",
          marketSize: 45000000000, // $45B
          growthPotential: 0.18,
          competitiveIntensity: "high",
          barrierToEntry: "medium",
          timeToMarket: "12-18 months",
          riskFactors: ["Infrastructure costs", "Standardization challenges"],
          requirements: ["Network partnerships", "Hardware expertise"],
        },
      ].filter((opp) => opp.marketSize >= minMarketSize),
      totalOpportunityValue: 130000000000,
      riskProfile: "medium-high",
      recommendedStrategy:
        "Focus on AI automation given higher growth potential",
    };
  }
}
