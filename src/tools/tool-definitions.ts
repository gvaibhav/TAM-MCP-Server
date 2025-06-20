import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { MarketAnalysisTools } from "./market-tools.js";
import {
  IndustryDataSchema,
  MarketSizeSchema,
  TAMCalculatorSchema,
  SAMCalculatorSchema,
  MarketSegmentsSchema,
  MarketForecastingSchema,
  MarketComparisonSchema,
  DataValidationSchema,
  MarketOpportunitiesSchema,
} from "../types/index.js";

// MCP Tool Definition type that expects JSON Schema instead of Zod schemas
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object; // JSON Schema format
  outputSchema?: object; // JSON Schema format (optional for MCP tools)
}

// Common Schemas
const ErrorSourceSchema = z.object({
  sourceName: z.string(),
  errorCode: z.string(),
  message: z.string(),
});

// 2.1 Direct Data Source Access Tools

// 2.1.1 Alpha Vantage
export const AlphaVantageGetCompanyOverviewSchema = z.object({
  symbol: z
    .string()
    .default("AAPL")
    .describe('The stock symbol of the company (e.g., "AAPL"). Default: AAPL'),
});

export const AlphaVantageSearchSymbolsSchema = z.object({
  keywords: z
    .string()
    .default("Apple")
    .describe(
      'A keyword or keywords to search for (e.g., "Microsoft"). Default: Apple',
    ),
});
// Note: Financial statement tools are consolidated into company_financials_retriever

// 2.1.2 Bureau of Labor Statistics (BLS)
export const BlsGetSeriesDataSchema = z.object({
  seriesIds: z
    .array(z.string())
    .default(["LAUCN040010000000005"])
    .describe("Array of BLS series IDs. Default: Unemployment rate for Alaska"),
  startYear: z
    .string()
    .optional()
    .default("2020")
    .describe("Start year for data (YYYY). Default: 2020"),
  endYear: z
    .string()
    .optional()
    .default("2024")
    .describe("End year for data (YYYY). Default: 2024"),
  catalog: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include catalog metadata. Default: false"),
  calculations: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include calculations metadata. Default: false"),
  annualaverage: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include annual averages. Default: false"),
  aspects: z
    .array(z.string())
    .optional()
    .describe("Additional aspects to include."),
});

// 2.1.3 U.S. Census Bureau
export const CensusFetchIndustryDataSchema = z.object({
  variables: z
    .union([z.array(z.string()), z.string()])
    .default(["EMP", "PAYANN"])
    .describe(
      "Variable names (e.g., ['EMP', 'PAYANN'] or 'EMP,PAYANN'). Default: Employment and Annual Payroll",
    ),
  forGeography: z
    .string()
    .default("us:1")
    .describe(
      "Geography parameter (e.g., 'us:1', 'state:01'). Default: United States",
    ),
  filterParams: z
    .record(z.string())
    .optional()
    .describe("Additional filters like NAICS2017, SIC."),
  year: z
    .string()
    .optional()
    .default("2021")
    .describe("Data year. Default: 2021"),
  datasetPath: z
    .string()
    .optional()
    .default("cbp")
    .describe(
      "Dataset path (e.g., 'cbp' for County Business Patterns). Default: cbp",
    ),
});

export const CensusFetchMarketSizeSchema = z.object({
  naicsCode: z
    .string()
    .default("54")
    .describe(
      "Industry NAICS code (e.g., '23' for Construction). Default: Professional Services (54)",
    ),
  geography: z
    .string()
    .default("us:1")
    .describe("Geography parameter (e.g., 'us:1'). Default: us:1"),
  measure: z
    .enum(["EMP", "PAYANN", "ESTAB"])
    .optional()
    .default("EMP")
    .describe("Measure to fetch."),
  year: z.string().optional().describe("Data year."),
});

// 2.1.4 Federal Reserve Economic Data (FRED)
export const FredGetSeriesObservationsSchema = z.object({
  seriesId: z
    .string()
    .default("GDPC1")
    .describe('The FRED series ID (e.g., "GNPCA"). Default: Real GDP (GDPC1)'),
  // Add other params like realtime_start, realtime_end, limit, offset, sort_order, etc. if needed
});

// 2.1.5 International Monetary Fund (IMF)
export const ImfGetDatasetSchema = z.object({
  dataflowId: z
    .string()
    .default("IFS")
    .describe(
      'Identifier of the IMF dataflow (e.g., "CPI"). Default: International Financial Statistics (IFS)',
    ),
  key: z
    .string()
    .default("M.US.PMP_IX")
    .describe(
      'Structured key for data selection (e.g., "M.US.CPI_IX"). Default: US Import Price Index',
    ),
  startPeriod: z
    .string()
    .optional()
    .default("2020")
    .describe("Start date for data (YYYY-MM or YYYY). Default: 2020"),
  endPeriod: z
    .string()
    .optional()
    .default("2024")
    .describe("End date for data (YYYY-MM or YYYY). Default: 2024"),
});

export const ImfGetLatestObservationSchema = z.object({
  dataflowId: z
    .string()
    .default("IFS")
    .describe(
      "Identifier of the IMF dataflow. Default: International Financial Statistics (IFS)",
    ),
  key: z
    .string()
    .default("M.US.PMP_IX")
    .describe(
      "Structured key for data selection. Default: US Import Price Index",
    ),
  valueAttribute: z
    .string()
    .optional()
    .describe("Specific attribute to extract if multiple values exist."),
  // startPeriod, endPeriod might be relevant if "latest" needs context
});

// 2.1.6 Nasdaq Data Link
export const NasdaqGetDatasetTimeSeriesSchema = z.object({
  databaseCode: z
    .string()
    .default("FRED")
    .describe('Code for the Nasdaq database (e.g., "WIKI"). Default: FRED'),
  datasetCode: z
    .string()
    .default("GDPC1")
    .describe(
      'Code for the dataset within the database (e.g., "FB"). Default: Real GDP (GDPC1)',
    ),
  params: z
    .record(z.any())
    .optional()
    .describe(
      "Additional parameters like limit, column_index, start_date, end_date, order, collapse, transform.",
    ),
});

export const NasdaqGetLatestDatasetValueSchema = z.object({
  databaseCode: z
    .string()
    .default("FRED")
    .describe("Code for the Nasdaq database. Default: FRED"),
  datasetCode: z
    .string()
    .default("GDPC1")
    .describe("Code for the dataset. Default: Real GDP (GDPC1)"),
  valueColumn: z
    .string()
    .optional()
    .describe("Name or index of the column to extract the value from."),
  date: z
    .string()
    .optional()
    .describe(
      "Specific date for the value (YYYY-MM-DD). If not provided, latest is assumed.",
    ),
});

// 2.1.7 Organisation for Economic Co-operation and Development (OECD)
export const OecdGetDatasetSchema = z.object({
  datasetId: z
    .string()
    .default("QNA")
    .describe(
      'Identifier of the OECD dataset (e.g., "QNA"). Default: Quarterly National Accounts (QNA)',
    ),
  filterExpression: z
    .string()
    .optional()
    .default("USA.GDP.Q")
    .describe(
      'Filter expression for data selection (e.g., "USA.GDP.Q"). Default: USA GDP Quarterly',
    ),
  agencyId: z
    .string()
    .optional()
    .default("OECD")
    .describe('Agency ID, defaults to "OECD". Default: OECD'),
  startTime: z
    .string()
    .optional()
    .default("2020")
    .describe("Start time for data (YYYY or YYYY-MM). Default: 2020"),
  endTime: z
    .string()
    .optional()
    .default("2024")
    .describe("End time for data (YYYY or YYYY-MM). Default: 2024"),
  dimensionAtObservation: z
    .string()
    .optional()
    .default("AllDimensions")
    .describe(
      'How dimensions are reported (e.g., "AllDimensions", "TimeDimension"). Default: AllDimensions',
    ),
});

export const OecdGetLatestObservationSchema = z.object({
  datasetId: z
    .string()
    .default("QNA")
    .describe(
      "Identifier of the OECD dataset. Default: Quarterly National Accounts (QNA)",
    ),
  filterExpression: z
    .string()
    .optional()
    .default("USA.GDP.Q")
    .describe(
      "Filter expression for data selection. Default: USA GDP Quarterly",
    ),
  valueAttribute: z
    .string()
    .optional()
    .describe("Specific attribute to extract."),
  agencyId: z
    .string()
    .optional()
    .default("OECD")
    .describe("Agency ID. Default: OECD"),
  dimensionAtObservation: z
    .string()
    .optional()
    .default("AllDimensions")
    .describe("How dimensions are reported. Default: AllDimensions"),
});

// 2.1.8 World Bank
export const WorldBankGetIndicatorDataSchema = z.object({
  countryCode: z
    .string()
    .default("USA")
    .describe(
      'World Bank country code (e.g., "USA", "BRA", or "all" for all countries). Default: USA',
    ),
  indicator: z
    .string()
    .default("NY.GDP.MKTP.CD")
    .describe(
      'World Bank indicator code (e.g., "NY.GDP.MKTP.CD"). Default: GDP current US$ (NY.GDP.MKTP.CD)',
    ),
  // Add other params like date, per_page, page, format etc. if needed
});

// 2.2 Multi-Source Search and Aggregation Tools

// 2.2.1 Industry Search
export const IndustrySearchInputSchema = z.object({
  query: z
    .string()
    .default("technology")
    .describe(
      'Search query (e.g., "pharmaceutical manufacturing", "NAICS 3254"). Default: technology',
    ),
  sources: z
    .array(z.string())
    .optional()
    .default(["CENSUS", "BLS"])
    .describe(
      'Specific data source IDs to restrict search (e.g., ["CENSUS", "BLS"]). Default: Census and BLS',
    ),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of results. Default: 10"),
  minRelevanceScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .describe("Minimum relevance score (0.0-1.0). Default: 0.5"),
  geographyFilter: z
    .array(z.string())
    .optional()
    .default(["US"])
    .describe('Geographic identifiers (e.g., ["US", "CA"]). Default: US'),
});
const IndustryDTOSchema = z.object({
  industryId: z.string(),
  name: z.string().optional(), // Added for clarity, though not explicitly in doc, it's essential
  description: z.string().optional(), // Added
  codes: z
    .record(z.array(z.string()))
    .optional()
    .describe('e.g., { NAICS: ["3254"], ISIC: ["C21"] }'), // Added
  geography: z.object({ name: z.string(), code: z.string() }).optional(), // Added
  marketSize: z.number().optional(), // Added
  currency: z.string().optional(), // Added
  year: z.number().optional(), // Added
  sourceDetails: z
    .array(
      z.object({
        // Enhanced to provide more source context
        sourceName: z.string(),
        sourceIndustryId: z.string().optional(),
        retrievedDate: z.string().datetime(),
        relevance: z.number().optional(),
        data: z.record(z.any()).optional(), // Raw snippet or key data points from this source
      }),
    )
    .optional(),
  lastUpdated: z
    .string()
    .datetime()
    .optional()
    .describe("Most recent date an underlying data point was updated."),
  relevanceScore: z.number().optional(), // Added from logic description
});
export const IndustrySearchOutputSchema = z.object({
  query: z.string(),
  parameters: IndustrySearchInputSchema, // Echo back the input params
  results: z.array(IndustryDTOSchema),
  summary: z.string().optional(),
  errors: z.array(ErrorSourceSchema).optional(),
});

// 2.3 Analytical and Calculation Tools

// 2.3.1 TAM Calculator
// 2.3.1 TAM Calculator
export const TamCalculatorInputSchema = z.object({
  baseMarketSize: z
    .number()
    .default(10000000000)
    .describe(
      "Current or foundational market size value in USD (e.g., 1000000000 for $1 billion market). Default: $10B",
    ),
  annualGrowthRate: z
    .number()
    .default(0.15)
    .describe(
      "Anticipated annual growth rate as decimal (e.g., 0.05 for 5%, 0.15 for 15%, 0.25 for 25% growth). Default: 15%",
    ),
  projectionYears: z
    .number()
    .int()
    .positive()
    .default(5)
    .describe(
      "Number of years to project TAM (typically 3-10 years, e.g., 5 for 5-year projection). Default: 5 years",
    ),
  segmentationAdjustments: z
    .object({
      factor: z
        .number()
        .default(0.8)
        .describe(
          "Adjustment factor as decimal (e.g., 0.8 for 80% of market, 0.6 for 60% addressable portion). Default: 80%",
        ),
      rationale: z
        .string()
        .optional()
        .default("Addressable market segment")
        .describe(
          "Reason for adjustment (e.g., 'Enterprise segment focus', 'Regulatory constraints', 'Geographic limitations'). Default: Addressable market segment",
        ),
    })
    .optional()
    .describe(
      "Optional market segmentation to focus on specific addressable portion of total market.",
    ),
});

// 2.3.2 Market Size Calculator
export const MarketSizeCalculatorInputSchema = z.object({
  industryQuery: z
    .string()
    .default("Software as a Service")
    .describe(
      'Query describing the industry (e.g., "Cloud Computing in North America", "Electric vehicle manufacturing", "Mobile app development services"). Default: Software as a Service',
    ),
  geographyCodes: z
    .array(z.string())
    .optional()
    .default(["US"])
    .describe(
      'Specific geographic codes. Common options: ["US", "CA", "EU", "APAC", "Global"] or country codes like ["GB", "DE", "FR", "JP"]. Default: US',
    ),
  indicatorCodes: z
    .array(z.string())
    .optional()
    .default(["GDP", "Employment"])
    .describe(
      'Specific economic indicators to prioritize (e.g., ["GDP", "Employment", "Revenue"]). Default: GDP and Employment',
    ),
  year: z
    .string()
    .optional()
    .default("2024")
    .describe(
      'Target year for estimation (e.g., "2023", "2024"). Default: 2024',
    ),
  methodology: z
    .enum(["top_down", "bottom_up", "auto"])
    .optional()
    .default("auto")
    .describe(
      "Calculation methodology: 'top_down' (market-wide data), 'bottom_up' (aggregate from segments), 'auto' (system selects best approach).",
    ),
});
export const MarketSizeCalculatorOutputSchema = z.object({
  estimatedMarketSize: z.number(),
  currency: z.string(),
  year: z.string(),
  dataSourcesUsed: z.array(
    z.object({
      sourceName: z.string(),
      indicatorUsed: z.string().optional(),
      dataFetched: z.record(z.any()).optional(),
    }),
  ),
  confidenceScore: z.number().min(0).max(1).optional(),
  methodologyUsed: z.string().optional(),
});

// 2.3.3 Company Financials Retriever
// 2.3.3 Company Financials Retriever
export const CompanyFinancialsRetrieverInputSchema = z.object({
  companySymbol: z
    .string()
    .default("AAPL")
    .describe(
      'Stock symbol (e.g., "AAPL" for Apple, "MSFT" for Microsoft, "GOOGL" for Google, "AMZN" for Amazon, "TSLA" for Tesla). Default: AAPL',
    ),
  statementType: z
    .enum(["INCOME_STATEMENT", "BALANCE_SHEET", "CASH_FLOW", "OVERVIEW"])
    .default("OVERVIEW")
    .describe(
      "Type of financial statement: 'OVERVIEW' (company metrics & ratios), 'INCOME_STATEMENT' (revenue/profit), 'BALANCE_SHEET' (assets/liabilities), 'CASH_FLOW' (cash movements). Default: OVERVIEW",
    ),
  period: z
    .enum(["annual", "quarterly"])
    .optional()
    .default("annual")
    .describe(
      "Reporting period: 'annual' (full fiscal year, recommended for trends), 'quarterly' (3-month periods, for recent performance). Default: annual",
    ),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe(
      "Number of past periods to retrieve (e.g., 3 for last 3 years/quarters, max typically 20). Default: 1",
    ),
});
export const CompanyFinancialsRetrieverOutputSchema = z
  .record(z.any())
  .describe("Raw JSON financial data from the provider.");

// Consolidating all tool definitions
// The keys here (e.g., "alphaVantage_getCompanyOverview") must match tool names in DESIGN-ARCHITECTURE.md
export const AllToolDefinitions: Record<string, ToolDefinition> = {
  // Alpha Vantage
  alphaVantage_getCompanyOverview: {
    name: "alphaVantage_getCompanyOverview",
    description: `Fetches comprehensive company overview and key financial ratios from Alpha Vantage.

🔍 **What it does:**
- Retrieves fundamental company data including financials, ratios, and business metrics
- Provides market cap, P/E ratio, dividend yield, and sector classification
- Returns both quarterly and annual key performance indicators

💼 **Use cases:**
- Investment research and stock analysis
- Company due diligence and competitive benchmarking
- Portfolio construction and financial modeling
- Market research and sector analysis

📋 **Parameters:**
- **symbol**: Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL", "TSLA")

🎯 **Example usage:**
For Apple Inc. company overview:
- symbol: "AAPL"

Returns: Market cap ($3.5T), P/E ratio (28.5), sector (Technology), industry (Consumer Electronics), dividend yield (0.4%), 52-week high/low, EPS, revenue, and 50+ financial metrics.

💡 **Pro tips:**
- Use for quick company snapshots before detailed financial statement analysis
- Great starting point for investment research workflows
- Combine with financial statement tools for comprehensive analysis
- Popular tech stocks: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA
- Check market cap and sector for initial screening`,
    inputSchema: zodToJsonSchema(AlphaVantageGetCompanyOverviewSchema),
  },
  alphaVantage_searchSymbols: {
    name: "alphaVantage_searchSymbols",
    description: `Searches for stock symbols and company names matching keywords using Alpha Vantage.

🔍 **What it does:**
- Finds stock ticker symbols based on company names or keywords
- Returns matching companies with symbol, name, type, region, and currency
- Provides market type classification (equity, ETF, etc.)

💼 **Use cases:**
- Finding ticker symbols for companies you want to analyze
- Discovering related companies in specific sectors or themes
- Building watchlists and screening for investment research
- Validating company names and symbols before further analysis

📋 **Parameters:**
- **keywords**: Company name, business description, or sector keywords (e.g., "Microsoft", "cloud computing", "electric vehicle")

🎯 **Example usage:**
For finding electric vehicle companies:
- keywords: "electric vehicle"

Returns: TSLA (Tesla Inc.), F (Ford), GM (General Motors), NIO (Nio Inc.), RIVN (Rivian), and other EV-related companies.

💡 **Pro tips:**
- Use broad keywords to discover companies in emerging sectors
- Try variations like "AI", "artificial intelligence", "machine learning" for tech themes  
- Great for building sector-specific analysis lists
- Follow up with company overview calls for detailed analysis
- Use specific company names when you know what you're looking for`,
    inputSchema: zodToJsonSchema(AlphaVantageSearchSymbolsSchema),
  },

  // BLS
  bls_getSeriesData: {
    name: "bls_getSeriesData",
    description: `Retrieves comprehensive labor and economic data from the Bureau of Labor Statistics.

📊 **What it does:**
- Fetches official U.S. employment, wage, and economic statistics
- Provides historical time series data with multiple data points per series
- Returns detailed metadata including seasonal adjustments and calculation methods

💼 **Use cases:**
- Economic research and labor market analysis
- Industry employment trend analysis
- Wage and salary benchmarking studies
- Policy research and economic forecasting

📋 **Parameters:**
- **seriesIds**: Array of BLS series IDs (e.g., ["LNS14000000"] for unemployment rate, ["CES0000000001"] for total employment)
- **startYear**: Start year for data range (e.g., "2020")
- **endYear**: End year for data range (e.g., "2024")
- **catalog**: Include series metadata (true/false)
- **calculations**: Include calculated values like changes (true/false)
- **annualaverage**: Include annual averages (true/false)

🎯 **Common Series IDs:**
- **LNS14000000**: Unemployment rate
- **CES0000000001**: Total nonfarm employment
- **CES0500000003**: Average hourly earnings
- **CES1021000001**: Mining employment
- **CES2000000001**: Construction employment
- **CES3000000001**: Manufacturing employment

💡 **Pro tips:**
- Use the BLS Data Finder website to identify specific series IDs
- Set catalog=true to understand what each series measures
- Annual data is more stable, monthly data shows recent trends
- Combine multiple related series for comprehensive industry analysis`,
    inputSchema: zodToJsonSchema(BlsGetSeriesDataSchema),
  },

  // Census
  census_fetchIndustryData: {
    name: "census_fetchIndustryData",
    description: `Fetches comprehensive industry data from U.S. Census Bureau business surveys and statistics.

📊 **What it does:**
- Retrieves employment, payroll, establishment counts, and business statistics
- Accesses County Business Patterns, Economic Census, and Annual Survey of Manufactures
- Provides detailed geographic and industry breakdowns with NAICS classifications

💼 **Use cases:**
- Industry employment and wage analysis by region
- Business density and establishment counts for market research
- Economic impact studies and regional development planning
- Competitive intelligence and market size validation

📋 **Parameters:**
- **variables**: Data variables to retrieve (e.g., "EMP" for employment, "PAYANN" for annual payroll)
- **forGeography**: Geographic scope (e.g., "us:1" for national, "state:06" for California)
- **filterParams**: Industry filters like NAICS codes (e.g., {"NAICS2017": "541511"})
- **year**: Data year (optional, defaults to latest available)
- **datasetPath**: Dataset type (e.g., "cbp" for County Business Patterns)

🎯 **Common variables:**
- **EMP**: Total employment
- **PAYANN**: Annual payroll ($1,000s)
- **ESTAB**: Number of establishments
- **AP**: Total annual payroll
- **RCPTOT**: Total receipts/revenue

🌍 **Geography examples:**
- National: "us:1"
- States: "state:06" (CA), "state:36" (NY), "state:48" (TX)
- Metro areas: "metropolitan statistical area/micropolitan statistical area:41860"

💡 **Pro tips:**
- Use NAICS2017 filter to focus on specific industries
- Combine EMP and PAYANN for wage per employee calculations
- State-level data is most reliable; county data may have disclosure limitations
- County Business Patterns (CBP) is updated annually and most comprehensive`,
    inputSchema: zodToJsonSchema(CensusFetchIndustryDataSchema),
  },
  census_fetchMarketSize: {
    name: "census_fetchMarketSize",
    description: `Fetches market size and industry metrics from U.S. Census Bureau surveys.

📈 **What it does:**
- Retrieves revenue, shipments, and production value data by industry
- Provides establishment counts and employment-based market estimates
- Accesses Economic Census data for comprehensive industry measurement

💼 **Use cases:**
- Total Addressable Market (TAM) estimation for U.S. markets
- Industry size validation and benchmarking studies
- Market share analysis and competitive positioning
- Business planning and investment due diligence

📋 **Parameters:**
- **naicsCode**: Industry NAICS code (e.g., "23" for Construction, "541511" for Custom Computer Programming)
- **geography**: Geographic scope (e.g., "us:1" for national, "state:06" for California)
- **year**: Data year (optional, uses latest Economic Census)
- **measure**: Specific measure to retrieve (e.g., "RCPTOT" for total receipts)

🏗️ **Common NAICS codes:**
- **23**: Construction
- **31-33**: Manufacturing
- **541511**: Custom Computer Programming Services
- **541512**: Computer Systems Design Services
- **541519**: Other Computer Related Services
- **541611**: Administrative Management Consulting
- **621111**: Offices of Physicians (except Mental Health)

💰 **Available measures:**
- **RCPTOT**: Total receipts/revenue (primary market size indicator)
- **PAYANN**: Annual payroll
- **EMP**: Employment
- **ESTAB**: Number of establishments

💡 **Pro tips:**
- Use broad 2-digit NAICS for large market estimates, specific 6-digit for niche markets
- Economic Census data (every 5 years) is most comprehensive
- RCPTOT provides best proxy for total market size
- Combine with employment data for market density analysis`,
    inputSchema: zodToJsonSchema(CensusFetchMarketSizeSchema),
  },

  // FRED
  fred_getSeriesObservations: {
    name: "fred_getSeriesObservations",
    description: `Fetches economic time series data from the Federal Reserve Economic Data (FRED) database.

📊 **What it does:**
- Retrieves official Federal Reserve economic indicators and statistics
- Provides historical time series data with precise dating and values
- Accesses 500,000+ economic data series from 100+ sources

💼 **Use cases:**
- Economic research and policy analysis
- Market forecasting and trend analysis
- Interest rate and monetary policy research
- Macroeconomic model inputs and validation

📋 **Parameters:**
- **seriesId**: FRED series identifier (e.g., "GDP" for Gross Domestic Product)
- **startDate**: Start date for data range (YYYY-MM-DD format)
- **endDate**: End date for data range (YYYY-MM-DD format)
- **frequency**: Data frequency transformation (optional)
- **aggregationMethod**: How to aggregate data (optional)

📈 **Popular series IDs:**
- **GDP**: Gross Domestic Product
- **UNRATE**: Unemployment Rate
- **FEDFUNDS**: Federal Funds Rate
- **CPIAUCSL**: Consumer Price Index
- **DEXUSEU**: US/Euro Foreign Exchange Rate
- **DGS10**: 10-Year Treasury Constant Maturity Rate
- **PAYEMS**: All Employees, Total Nonfarm
- **HOUST**: Housing Starts
- **INDPRO**: Industrial Production Index

🎯 **Example usage:**
For U.S. unemployment rate over the last 5 years:
- seriesId: "UNRATE"
- startDate: "2019-01-01"
- endDate: "2024-12-31"

Returns: Monthly unemployment rate data with precise values and dates.

💡 **Pro tips:**
- Use FRED website to explore and identify series IDs
- Many series are updated monthly/quarterly with official government data
- Combine multiple series for comprehensive economic analysis
- Date ranges can span decades for long-term trend analysis`,
    inputSchema: zodToJsonSchema(FredGetSeriesObservationsSchema),
  },

  // IMF
  imf_getDataset: {
    name: "imf_getDataset",
    description: `Retrieves comprehensive economic and financial datasets from the International Monetary Fund.

🌍 **What it does:**
- Accesses IMF's extensive database of global economic indicators
- Provides country-level and regional economic statistics
- Returns standardized SDMX-JSON formatted data for consistent analysis

💼 **Use cases:**
- Global economic research and cross-country analysis
- International market sizing and opportunity assessment
- Currency and financial stability research
- Development economics and emerging market studies

📋 **Parameters:**
- **datasetId**: IMF dataset identifier (e.g., "IFS" for International Financial Statistics)
- **countries**: Country codes (e.g., ["US", "CN", "DE"] or "all")
- **indicators**: Economic indicators to retrieve (e.g., ["NGDP_R", "PCPIPCH"])
- **startPeriod**: Start period (e.g., "2020")
- **endPeriod**: End period (e.g., "2024")

📊 **Major datasets:**
- **IFS**: International Financial Statistics (exchange rates, reserves, monetary data)
- **WEO**: World Economic Outlook (GDP, inflation, fiscal data)
- **GFS**: Government Finance Statistics (fiscal accounts, debt)
- **DOTS**: Direction of Trade Statistics (bilateral trade flows)
- **FSI**: Financial Soundness Indicators (banking system health)

🎯 **Popular indicators:**
- **NGDP_R**: Real GDP
- **PCPIPCH**: Inflation rate (average consumer prices)
- **GGXWDN_NGDP**: General government net debt (% of GDP)
- **BCA_BP6_USD**: Current account balance (USD)

🌐 **Example usage:**
For real GDP growth data for major economies:
- datasetId: "WEO"
- countries: ["US", "CN", "JP", "DE", "GB"]
- indicators: ["NGDP_RPCH"]
- startPeriod: "2020", endPeriod: "2024"

💡 **Pro tips:**
- Use country code "all" for global coverage, specific codes for targeted analysis
- WEO dataset is updated twice yearly with official IMF forecasts
- Combine with World Bank data for comprehensive development indicators`,
    inputSchema: zodToJsonSchema(ImfGetDatasetSchema),
  },
  imf_getLatestObservation: {
    name: "imf_getLatestObservation",
    description: `Fetches the most recent data point from IMF economic datasets for quick current snapshots.

📊 **What it does:**
- Retrieves the latest available observation for specified economic indicators
- Provides current-year or most recent period data for rapid analysis
- Returns metadata including observation date and data quality indicators

💼 **Use cases:**
- Current economic conditions assessment
- Real-time market intelligence and dashboards
- Quick fact-checking for economic indicators
- Latest data validation for research and reports

📋 **Parameters:**
- **datasetId**: IMF dataset identifier (e.g., "WEO", "IFS")
- **countryCode**: Single country code (e.g., "US", "CN", "DE")
- **indicatorCode**: Specific economic indicator (e.g., "NGDP_RPCH" for GDP growth)
- **frequency**: Data frequency if applicable (annual, quarterly, monthly)

⚡ **Quick indicators:**
- **NGDP_RPCH**: Latest GDP growth rate
- **PCPIPCH**: Current inflation rate
- **LUR**: Latest unemployment rate
- **GGXWDN_NGDP**: Current government debt-to-GDP ratio

🎯 **Example usage:**
For current U.S. GDP growth rate:
- datasetId: "WEO"
- countryCode: "US"
- indicatorCode: "NGDP_RPCH"

Returns: Most recent GDP growth percentage with observation period.

💡 **Pro tips:**
- Perfect for current conditions in investment research
- Use before detailed historical analysis to understand latest trends
- Combine with historical data tools for context and trend analysis`,
    inputSchema: zodToJsonSchema(ImfGetLatestObservationSchema),
  },

  // Nasdaq Data Link
  nasdaq_getDatasetTimeSeries: {
    name: "nasdaq_getDatasetTimeSeries",
    description: `Retrieves time series datasets from Nasdaq Data Link (formerly Quandl) for financial and economic analysis.

📈 **What it does:**
- Accesses premium financial datasets from global exchanges and data providers
- Provides historical price data, economic indicators, and alternative datasets
- Returns structured time series data with timestamps and multiple data columns

💼 **Use cases:**
- Financial market analysis and backtesting strategies
- Economic indicator tracking and research
- Alternative data analysis (sentiment, satellite, etc.)
- Quantitative finance and risk modeling

📋 **Parameters:**
- **databaseCode**: Dataset database identifier (e.g., "WIKI" for stock prices, "FRED" for economic data)
- **datasetCode**: Specific dataset within database (e.g., "AAPL" for Apple stock, "GDP" for GDP data)
- **startDate**: Start date for time series (YYYY-MM-DD)
- **endDate**: End date for time series (YYYY-MM-DD)
- **collapse**: Data frequency (e.g., "daily", "weekly", "monthly", "quarterly", "annual")

📊 **Popular databases:**
- **EOD**: End-of-day stock prices for global markets
- **FRED**: Federal Reserve Economic Data mirror
- **CURRFX**: Foreign exchange rates
- **RATEINF**: Central bank interest rates
- **MULTPL**: Market valuation multiples and ratios

🎯 **Example usage:**
For Apple stock price history:
- databaseCode: "EOD"
- datasetCode: "AAPL"
- startDate: "2023-01-01"
- endDate: "2024-12-31"
- collapse: "daily"

Returns: Daily OHLC prices, volume, and adjusted close for AAPL.

💡 **Pro tips:**
- Many datasets require Nasdaq Data Link premium subscription
- Use collapse parameter to reduce data volume for analysis
- Combine multiple datasets for comprehensive market analysis
- Check dataset metadata for update frequency and coverage`,
    inputSchema: zodToJsonSchema(NasdaqGetDatasetTimeSeriesSchema),
  },
  nasdaq_getLatestDatasetValue: {
    name: "nasdaq_getLatestDatasetValue",
    description: `Fetches the most recent data point from Nasdaq Data Link datasets for current market snapshots.

⚡ **What it does:**
- Retrieves the latest available value from financial and economic datasets
- Provides real-time or end-of-day current market data
- Returns single data point with timestamp for rapid analysis

💼 **Use cases:**
- Current market price checks and portfolio valuation
- Real-time economic indicator monitoring
- Dashboard data feeds and alerts
- Quick market condition assessments

📋 **Parameters:**
- **databaseCode**: Dataset database identifier (e.g., "EOD", "CURRFX", "RATEINF")
- **datasetCode**: Specific dataset code (e.g., "AAPL", "USDEUR", "FED")
- **column**: Specific data column if dataset has multiple (optional)

⚡ **Quick data examples:**
- Stock prices: EOD/AAPL (Apple current price)
- Forex rates: CURRFX/USDEUR (USD to Euro rate)
- Economic: FRED/GDP (Latest GDP figure)
- Interest rates: RATEINF/USA (Current US rates)

🎯 **Example usage:**
For current Apple stock price:
- databaseCode: "EOD"
- datasetCode: "AAPL"
- column: "Close"

Returns: Most recent closing price with trading date.

💡 **Pro tips:**
- Perfect for real-time portfolio tracking and analysis
- Use before historical analysis to understand current context
- Combine with time series data for trend analysis
- Great for automated monitoring and alert systems`,
    inputSchema: zodToJsonSchema(NasdaqGetLatestDatasetValueSchema),
  },

  // OECD
  oecd_getDataset: {
    name: "oecd_getDataset",
    description: `Retrieves comprehensive datasets from the Organisation for Economic Co-operation and Development (OECD).

🌍 **What it does:**
- Accesses OECD's extensive database of economic, social, and environmental statistics
- Provides standardized data across 38 OECD member countries plus key partners
- Returns SDMX-formatted data for consistent international comparisons

💼 **Use cases:**
- International economic research and policy analysis
- Cross-country benchmarking and competitiveness studies
- Development indicators and quality of life research
- Global market opportunity assessment

📋 **Parameters:**
- **datasetId**: OECD dataset identifier (e.g., "QNA" for Quarterly National Accounts)
- **filterExpression**: Filter criteria for data selection (country, indicator, time)
- **valueAttribute**: Specific attribute to extract (optional)
- **agencyId**: Data agency identifier (optional)
- **dimensionAtObservation**: How dimensions are reported (optional)

📊 **Major datasets:**
- **QNA**: Quarterly National Accounts (GDP, expenditure components)
- **MEI**: Main Economic Indicators (production, employment, prices)
- **PATS_IPC**: Patents by technology field
- **HEALTH_STAT**: Health statistics and expenditure
- **EDUCATION**: Education indicators and outcomes
- **GREEN_GROWTH**: Environmental and green growth indicators

🎯 **Common filters:**
- Countries: "USA+GBR+DEU+FRA+JPN" (major economies)
- Time: "2020..2024" (period range)
- Indicators: Specific measure codes

🌐 **Example usage:**
For GDP data from major OECD countries:
- datasetId: "QNA"
- filterExpression: "USA+GBR+DEU+FRA+JPN.B1_GE.CPC.A"
- (B1_GE = GDP, CPC = Current Price, A = Annual)

💡 **Pro tips:**
- Use OECD Stat website to explore datasets and build filter expressions
- Data is standardized for international comparisons
- Quarterly data often has longer delays than monthly indicators
- Combine with country-specific sources for more detailed analysis`,
    inputSchema: zodToJsonSchema(OecdGetDatasetSchema),
  },
  oecd_getLatestObservation: {
    name: "oecd_getLatestObservation",
    description: `Fetches the most recent data point from OECD datasets for current international comparisons.

📊 **What it does:**
- Retrieves the latest available observation from OECD statistical databases
- Provides current-period data for rapid international benchmarking
- Returns standardized data with observation metadata and quality indicators

💼 **Use cases:**
- Current economic conditions across OECD countries
- Real-time international competitiveness monitoring
- Latest policy indicators and social statistics
- Quick fact-checking for international research

📋 **Parameters:**
- **datasetId**: OECD dataset identifier (e.g., "MEI", "QNA", "HEALTH_STAT")
- **countryCode**: ISO country code (e.g., "USA", "GBR", "DEU")
- **indicatorCode**: Specific indicator within dataset
- **frequency**: Data frequency (annual, quarterly, monthly)

⚡ **Quick indicators:**
- **GDP_Growth**: Latest GDP growth rate
- **Unemployment**: Current unemployment rate
- **CPI**: Latest inflation/price index
- **Interest_Rate**: Current policy rates
- **R&D_Intensity**: Research and development spending

🎯 **Example usage:**
For latest German unemployment rate:
- datasetId: "MEI"
- countryCode: "DEU"
- indicatorCode: "LRUNTTTT"

Returns: Most recent unemployment rate with observation period and data quality notes.

💡 **Pro tips:**
- Perfect for international benchmarking in business reports
- Use before detailed historical analysis for current context
- OECD data is highly reliable but may have reporting delays
- Great for policy research and international investment analysis`,
    inputSchema: zodToJsonSchema(OecdGetLatestObservationSchema),
  },

  // World Bank
  worldBank_getIndicatorData: {
    name: "worldBank_getIndicatorData",
    description: `Retrieves development indicators and economic data from the World Bank's comprehensive global database.

🌍 **What it does:**
- Accesses World Bank's repository of global development data covering 200+ countries
- Provides standardized economic, social, and environmental indicators
- Returns time series data for development research and analysis

💼 **Use cases:**
- Global market sizing and economic opportunity assessment
- Development economics research and policy analysis
- Cross-country economic comparisons and benchmarking
- Emerging market analysis and investment research

📋 **Parameters:**
- **countryCode**: World Bank country code (e.g., "USA", "CHN", "BRA", or "all" for global data)
- **indicator**: World Bank indicator code (e.g., "NY.GDP.MKTP.CD" for GDP)
- **date**: Date range (e.g., "2020:2024" or specific year)
- **format**: Data format (json, xml, default: json)

📊 **Popular indicators:**
- **NY.GDP.MKTP.CD**: GDP (current US$)
- **NY.GDP.PCAP.CD**: GDP per capita (current US$)
- **SP.POP.TOTL**: Total population
- **SL.UEM.TOTL.ZS**: Unemployment rate (% of total labor force)
- **FP.CPI.TOTL.ZG**: Inflation, consumer prices (annual %)
- **NE.TRD.GNFS.ZS**: Trade (% of GDP)
- **IT.NET.USER.ZS**: Internet users (% of population)
- **EN.ATM.CO2E.PC**: CO2 emissions (metric tons per capita)

🌐 **Country groupings:**
- **WLD**: World total
- **HIC**: High income countries
- **UMC**: Upper middle income countries
- **LMC**: Lower middle income countries
- **EAS**: East Asia & Pacific
- **ECS**: Europe & Central Asia

🎯 **Example usage:**
For GDP data from BRICS countries:
- countryCode: "BRA;RUS;IND;CHN;ZAF"
- indicator: "NY.GDP.MKTP.CD"
- date: "2015:2024"

Returns: Annual GDP in current US$ for Brazil, Russia, India, China, South Africa.

💡 **Pro tips:**
- Use "all" for comprehensive global datasets
- World Bank data is authoritative for development indicators
- Many indicators are updated annually with 1-2 year lag
- Excellent for emerging market research and global opportunity analysis`,
    inputSchema: zodToJsonSchema(WorldBankGetIndicatorDataSchema),
  },

  // Multi-Source & Analytical Tools
  industry_search: {
    name: "industry_search",
    description: `Searches industry information across multiple sources with intelligent ranking and consolidation.

🔍 **What it does:**
- Searches across 8 major data sources (Census, BLS, World Bank, etc.) simultaneously
- Provides intelligent ranking based on relevance and data quality
- Returns consolidated industry information with source attribution

💼 **Use cases:**
- Initial industry research and discovery
- Finding industry codes (NAICS, SIC) for specific sectors
- Validating industry classifications across multiple sources
- Building comprehensive industry databases

📋 **Parameters:**
- **query**: Industry name, keywords, or description (e.g., "software development", "renewable energy", "fintech")
- **limit**: Maximum number of results to return (default: 10)
- **sources**: Specific data sources to search (optional)

🎯 **Example usage:**
For renewable energy industry search:
- query: "renewable energy"
- limit: 5

Returns: Solar energy manufacturing (NAICS 334413), Wind power generation (NAICS 221115), with data from multiple sources ranked by relevance.

💡 **Pro tips:**
- Start with broad keywords to discover related industries
- Use specific terms like "NAICS 541511" to find exact classifications
- Great starting point before using industry_data for detailed analysis
- Results include source credibility scores for data quality assessment`,
    inputSchema: zodToJsonSchema(IndustrySearchInputSchema),
  },
  tam_calculator: {
    name: "tam_calculator",
    description: `Calculates Total Addressable Market (TAM) based on inputs.

📊 **What it does:**
- Projects market value over multiple years using compound growth
- Applies segmentation adjustments for focused market analysis
- Provides year-by-year breakdown and key assumptions

💡 **Use cases:**
- Startup funding presentations and business plans
- Market entry strategy and investment decisions
- Product roadmap planning and resource allocation

📋 **Parameters:**
- **baseMarketSize**: Current market value in USD (e.g., 1000000000 for $1B)
- **annualGrowthRate**: Growth rate as decimal (e.g., 0.15 = 15% annual growth)
- **projectionYears**: Years to project (typically 3-10 years)
- **segmentationAdjustments**: Optional market focus factor (e.g., 0.8 = 80% of total market)

🎯 **Example usage:**
For a $500M SaaS market growing 20% annually over 5 years with 60% addressable:
- baseMarketSize: 500000000
- annualGrowthRate: 0.20  
- projectionYears: 5
- segmentationAdjustments: {"factor": 0.60, "rationale": "Enterprise segment focus"}`,
    inputSchema: zodToJsonSchema(TamCalculatorInputSchema),
  },
  market_size_calculator: {
    name: "market_size_calculator",
    description: `Estimates current market size for an industry or product.

🔍 **What it does:**
- Searches across multiple data sources for market size data
- Applies methodology selection for accurate estimates
- Provides confidence scoring and data source transparency

💼 **Use cases:**
- Market research and competitive analysis
- Investment thesis validation
- Business case development and market opportunity assessment

📋 **Parameters:**
- **industryQuery**: Descriptive industry name or specific focus area
- **geographyCodes**: Geographic scope (e.g., ["US", "CA", "EU", "APAC", "Global"])
- **indicatorCodes**: Economic indicators to prioritize (optional)
- **year**: Target year for estimates (defaults to current)
- **methodology**: Calculation approach

🎯 **Methodology options:**
- **"top_down"**: Market-wide data broken down to segments
- **"bottom_up"**: Aggregate from customer/product data  
- **"auto"**: System selects best approach based on available data

🌍 **Common geography codes:**
- Regional: "US", "EU", "APAC", "LATAM", "MEA"
- Country: "CA", "GB", "DE", "FR", "JP", "AU", "IN", "BR"
- Global: "Global", "Worldwide"

📊 **Example queries:**
- "Cloud infrastructure services in North America"
- "Electric vehicle manufacturing NAICS 336111"
- "Mobile app development services"
- "Renewable energy storage systems"`,
    inputSchema: zodToJsonSchema(MarketSizeCalculatorInputSchema),
  },
  company_financials_retriever: {
    name: "company_financials_retriever",
    description: `Retrieves detailed financial statements for a public company.

📈 **What it does:**
- Fetches comprehensive financial data from Alpha Vantage
- Supports multiple statement types and reporting periods
- Provides historical data for trend analysis

🏢 **Use cases:**
- Investment research and due diligence
- Competitive financial benchmarking
- Market valuation and financial modeling
- Credit analysis and risk assessment

📋 **Parameters:**
- **companySymbol**: Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL")
- **statementType**: Type of financial statement to retrieve
- **period**: Reporting frequency (annual vs quarterly)
- **limit**: Number of past periods to include

💰 **Statement types:**
- **"OVERVIEW"**: Company overview with key ratios and metrics
- **"INCOME_STATEMENT"**: Revenue, expenses, profit/loss over time
- **"BALANCE_SHEET"**: Assets, liabilities, equity snapshot
- **"CASH_FLOW"**: Operating, investing, financing cash flows

📅 **Period options:**
- **"annual"**: Full fiscal year statements (recommended for long-term analysis)
- **"quarterly"**: 3-month reporting periods (for recent performance tracking)

🎯 **Example usage:**
For Apple's last 3 annual income statements:
- companySymbol: "AAPL"
- statementType: "INCOME_STATEMENT"
- period: "annual"
- limit: 3

💡 **Pro tips:**
- Use OVERVIEW for quick company snapshot and key metrics
- Combine multiple statement types for comprehensive analysis
- Set limit > 1 for trend analysis and year-over-year comparisons
- Popular symbols: AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, NFLX`,
    inputSchema: zodToJsonSchema(CompanyFinancialsRetrieverInputSchema),
  },
};

export function getToolDefinition(name: string): ToolDefinition | undefined {
  // First check AllToolDefinitions (data source tools)
  if (AllToolDefinitions[name]) {
    return AllToolDefinitions[name];
  }

  // Then check MarketAnalysisTools
  const marketAnalysisTools = MarketAnalysisTools.getToolDefinitions();
  const marketTool = marketAnalysisTools.find((tool) => tool.name === name);

  if (marketTool) {
    return {
      name: marketTool.name,
      description: marketTool.description ?? "",
      inputSchema: marketTool.inputSchema,
      ...(marketTool.outputSchema && { outputSchema: marketTool.outputSchema }),
    };
  }

  return undefined;
}

export function getAllToolDefinitions(): ToolDefinition[] {
  // Combine data source tools from AllToolDefinitions with market analysis tools
  const dataSourceTools = Object.values(AllToolDefinitions);
  const marketAnalysisTools = MarketAnalysisTools.getToolDefinitions();

  // Convert MarketAnalysisTools Tool[] format to ToolDefinition[] format
  const convertedMarketTools: ToolDefinition[] = marketAnalysisTools.map(
    (tool) => ({
      name: tool.name,
      description: tool.description ?? "",
      inputSchema: tool.inputSchema,
      ...(tool.outputSchema && { outputSchema: tool.outputSchema }),
    }),
  );

  // Return all tools - both systems should be exposed independently (28 total)
  // Note: Some tools may have the same name but different implementations in each system
  return [...dataSourceTools, ...convertedMarketTools];
}

// Schema mapping for validation - keeps the original Zod schemas for validation
export const toolSchemaMapping: Record<string, z.ZodType<any>> = {
  alphaVantage_getCompanyOverview: AlphaVantageGetCompanyOverviewSchema,
  alphaVantage_searchSymbols: AlphaVantageSearchSymbolsSchema,
  bls_getSeriesData: BlsGetSeriesDataSchema,
  census_fetchIndustryData: CensusFetchIndustryDataSchema,
  census_fetchMarketSize: CensusFetchMarketSizeSchema,
  fred_getSeriesObservations: FredGetSeriesObservationsSchema,
  imf_getDataset: ImfGetDatasetSchema,
  imf_getLatestObservation: ImfGetLatestObservationSchema,
  nasdaq_getDatasetTimeSeries: NasdaqGetDatasetTimeSeriesSchema,
  nasdaq_getLatestDatasetValue: NasdaqGetLatestDatasetValueSchema,
  oecd_getDataset: OecdGetDatasetSchema,
  oecd_getLatestObservation: OecdGetLatestObservationSchema,
  worldBank_getIndicatorData: WorldBankGetIndicatorDataSchema,
  industry_search: IndustrySearchInputSchema,
  tam_calculator: TamCalculatorInputSchema,
  market_size_calculator: MarketSizeCalculatorInputSchema,
  company_financials_retriever: CompanyFinancialsRetrieverInputSchema,
  // Market Analysis Tools from MarketAnalysisTools class
  industry_data: IndustryDataSchema,
  market_size: MarketSizeSchema,
  tam_analysis: TAMCalculatorSchema,
  sam_calculator: SAMCalculatorSchema,
  market_segments: MarketSegmentsSchema,
  market_forecasting: MarketForecastingSchema,
  market_comparison: MarketComparisonSchema,
  data_validation: DataValidationSchema,
  market_opportunities: MarketOpportunitiesSchema,
  // Note: generic_data_query uses a schema defined in market-tools.ts
};

// Helper function to get Zod schema for validation
export function getToolValidationSchema(
  toolName: string,
): z.ZodType<any> | undefined {
  return toolSchemaMapping[toolName];
}
