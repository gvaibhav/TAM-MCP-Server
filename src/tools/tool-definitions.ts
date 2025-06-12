import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

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
    symbol: z.string().describe("The stock symbol of the company (e.g., \"AAPL\").")
});
export const AlphaVantageSearchSymbolsSchema = z.object({
    keywords: z.string().describe("A keyword or keywords to search for (e.g., \"Microsoft\").")
});
// Note: Financial statement tools are consolidated into company_financials_retriever

// 2.1.2 Bureau of Labor Statistics (BLS)
export const BlsGetSeriesDataSchema = z.object({
    seriesIds: z.array(z.string()).describe("Array of BLS series IDs."),
    startYear: z.string().optional().describe("Start year for data (YYYY)."),
    endYear: z.string().optional().describe("End year for data (YYYY)."),
    catalog: z.boolean().optional().describe("Include catalog metadata."),
    calculations: z.boolean().optional().describe("Include calculations metadata."),
    annualaverage: z.boolean().optional().describe("Include annual averages."),
    aspects: z.array(z.string()).optional().describe("Additional aspects to include.")
});

// 2.1.3 U.S. Census Bureau
export const CensusFetchIndustryDataSchema = z.object({
    variables: z.union([z.array(z.string()), z.string()]).describe("Variable names (e.g., ['EMP', 'PAYANN'] or 'EMP,PAYANN')."),
    forGeography: z.string().describe("Geography parameter (e.g., 'us:1', 'state:01')."),
    filterParams: z.record(z.string()).optional().describe("Additional filters like NAICS2017, SIC."),
    year: z.string().optional().describe("Data year."),
    datasetPath: z.string().optional().describe("Dataset path (e.g., 'cbp' for County Business Patterns).")
});

export const CensusFetchMarketSizeSchema = z.object({
    naicsCode: z.string().describe("Industry NAICS code (e.g., '23' for Construction)."),
    geography: z.string().describe("Geography parameter (e.g., 'us:1')."),
    measure: z.enum(["EMP", "PAYANN", "ESTAB"]).optional().default("EMP").describe("Measure to fetch."),
    year: z.string().optional().describe("Data year.")
});

// 2.1.4 Federal Reserve Economic Data (FRED)
export const FredGetSeriesObservationsSchema = z.object({
    seriesId: z.string().describe("The FRED series ID (e.g., \"GNPCA\").")
    // Add other params like realtime_start, realtime_end, limit, offset, sort_order, etc. if needed
});

// 2.1.5 International Monetary Fund (IMF)
export const ImfGetDatasetSchema = z.object({
    dataflowId: z.string().describe("Identifier of the IMF dataflow (e.g., \"CPI\")."),
    key: z.string().describe("Structured key for data selection (e.g., \"M.US.CPI_IX\")."),
    startPeriod: z.string().optional().describe("Start date for data (YYYY-MM or YYYY)."),
    endPeriod: z.string().optional().describe("End date for data (YYYY-MM or YYYY).")
});
export const ImfGetLatestObservationSchema = z.object({
    dataflowId: z.string().describe("Identifier of the IMF dataflow."),
    key: z.string().describe("Structured key for data selection."),
    valueAttribute: z.string().optional().describe("Specific attribute to extract if multiple values exist."),
    // startPeriod, endPeriod might be relevant if "latest" needs context
});


// 2.1.6 Nasdaq Data Link
export const NasdaqGetDatasetTimeSeriesSchema = z.object({
    databaseCode: z.string().describe("Code for the Nasdaq database (e.g., \"WIKI\")."),
    datasetCode: z.string().describe("Code for the dataset within the database (e.g., \"FB\")."),
    params: z.record(z.any()).optional().describe("Additional parameters like limit, column_index, start_date, end_date, order, collapse, transform.")
});
export const NasdaqGetLatestDatasetValueSchema = z.object({
    databaseCode: z.string().describe("Code for the Nasdaq database."),
    datasetCode: z.string().describe("Code for the dataset."),
    valueColumn: z.string().optional().describe("Name or index of the column to extract the value from."),
    date: z.string().optional().describe("Specific date for the value (YYYY-MM-DD). If not provided, latest is assumed.")
});

// 2.1.7 Organisation for Economic Co-operation and Development (OECD)
export const OecdGetDatasetSchema = z.object({
    datasetId: z.string().describe("Identifier of the OECD dataset (e.g., \"QNA\")."),
    filterExpression: z.string().optional().describe("Filter expression for data selection (e.g., \"USA.GDP.Q\")."),
    agencyId: z.string().optional().describe("Agency ID, defaults to \"OECD\"."),
    startTime: z.string().optional().describe("Start time for data (YYYY or YYYY-MM)."),
    endTime: z.string().optional().describe("End time for data (YYYY or YYYY-MM)."),
    dimensionAtObservation: z.string().optional().describe("How dimensions are reported (e.g., \"AllDimensions\", \"TimeDimension\").")
});
export const OecdGetLatestObservationSchema = z.object({
    datasetId: z.string().describe("Identifier of the OECD dataset."),
    filterExpression: z.string().optional().describe("Filter expression for data selection."),
    valueAttribute: z.string().optional().describe("Specific attribute to extract."),
    agencyId: z.string().optional().describe("Agency ID."),
    dimensionAtObservation: z.string().optional().describe("How dimensions are reported.")
});

// 2.1.8 World Bank
export const WorldBankGetIndicatorDataSchema = z.object({
    countryCode: z.string().describe("World Bank country code (e.g., \"USA\", \"BRA\", or \"all\" for all countries)."),
    indicator: z.string().describe("World Bank indicator code (e.g., \"NY.GDP.MKTP.CD\").")
    // Add other params like date, per_page, page, format etc. if needed
});


// 2.2 Multi-Source Search and Aggregation Tools

// 2.2.1 Industry Search
export const IndustrySearchInputSchema = z.object({
    query: z.string().describe("Search query (e.g., \"pharmaceutical manufacturing\", \"NAICS 3254\")."),
    sources: z.array(z.string()).optional().describe("Specific data source IDs to restrict search (e.g., [\"CENSUS\", \"BLS\"])."),
    limit: z.number().optional().describe("Maximum number of results."),
    minRelevanceScore: z.number().min(0).max(1).optional().describe("Minimum relevance score (0.0-1.0)."),
    geographyFilter: z.array(z.string()).optional().describe("Geographic identifiers (e.g., [\"US\", \"CA\"]).")
});
const IndustryDTOSchema = z.object({
    industryId: z.string(),
    name: z.string().optional(), // Added for clarity, though not explicitly in doc, it's essential
    description: z.string().optional(), // Added
    codes: z.record(z.array(z.string())).optional().describe("e.g., { NAICS: [\"3254\"], ISIC: [\"C21\"] }"), // Added
    geography: z.object({ name: z.string(), code: z.string() }).optional(), // Added
    marketSize: z.number().optional(), // Added
    currency: z.string().optional(), // Added
    year: z.number().optional(), // Added
    sourceDetails: z.array(z.object({ // Enhanced to provide more source context
        sourceName: z.string(),
        sourceIndustryId: z.string().optional(),
        retrievedDate: z.string().datetime(),
        relevance: z.number().optional(),
        data: z.record(z.any()).optional() // Raw snippet or key data points from this source
    })).optional(),
    lastUpdated: z.string().datetime().optional().describe("Most recent date an underlying data point was updated."),
    relevanceScore: z.number().optional() // Added from logic description
});
export const IndustrySearchOutputSchema = z.object({
    query: z.string(),
    parameters: IndustrySearchInputSchema, // Echo back the input params
    results: z.array(IndustryDTOSchema),
    summary: z.string().optional(),
    errors: z.array(ErrorSourceSchema).optional()
});


// 2.3 Analytical and Calculation Tools

// 2.3.1 TAM Calculator
export const TamCalculatorInputSchema = z.object({
    baseMarketSize: z.number().describe("Current or foundational market size value in USD (e.g., 1000000000 for $1 billion market)."),
    annualGrowthRate: z.number().describe("Anticipated annual growth rate as decimal (e.g., 0.05 for 5%, 0.15 for 15%, 0.25 for 25% growth)."),
    projectionYears: z.number().int().positive().describe("Number of years to project TAM (typically 3-10 years, e.g., 5 for 5-year projection)."),
    segmentationAdjustments: z.object({
        factor: z.number().describe("Adjustment factor as decimal (e.g., 0.8 for 80% of market, 0.6 for 60% addressable portion)."),
        rationale: z.string().optional().describe("Reason for adjustment (e.g., 'Enterprise segment focus', 'Regulatory constraints', 'Geographic limitations').")
    }).optional().describe("Optional market segmentation to focus on specific addressable portion of total market.")
});
export const TamCalculatorOutputSchema = z.object({
    calculatedTam: z.number(),
    projectionDetails: z.array(z.object({ year: z.number(), tam: z.number() })),
    assumptions: z.array(z.string())
});

// 2.3.2 Market Size Calculator
export const MarketSizeCalculatorInputSchema = z.object({
    industryQuery: z.string().describe("Query describing the industry (e.g., \"Cloud Computing in North America\", \"Electric vehicle manufacturing\", \"Mobile app development services\")."),
    geographyCodes: z.array(z.string()).optional().describe("Specific geographic codes. Common options: [\"US\", \"CA\", \"EU\", \"APAC\", \"Global\"] or country codes like [\"GB\", \"DE\", \"FR\", \"JP\"]."),
    indicatorCodes: z.array(z.string()).optional().describe("Specific economic indicators to prioritize (e.g., [\"GDP\", \"Employment\", \"Revenue\"])."),
    year: z.string().optional().describe("Target year for estimation (e.g., \"2023\", \"2024\"). Defaults to current year."),
    methodology: z.enum(["top_down", "bottom_up", "auto"]).optional().default("auto")
        .describe("Calculation methodology: 'top_down' (market-wide data), 'bottom_up' (aggregate from segments), 'auto' (system selects best approach).")
});
export const MarketSizeCalculatorOutputSchema = z.object({
    estimatedMarketSize: z.number(),
    currency: z.string(),
    year: z.string(),
    dataSourcesUsed: z.array(z.object({
        sourceName: z.string(),
        indicatorUsed: z.string().optional(),
        dataFetched: z.record(z.any()).optional()
    })),
    confidenceScore: z.number().min(0).max(1).optional(),
    methodologyUsed: z.string().optional()
});

// 2.3.3 Company Financials Retriever
export const CompanyFinancialsRetrieverInputSchema = z.object({
    companySymbol: z.string().describe("Stock symbol (e.g., \"AAPL\" for Apple, \"MSFT\" for Microsoft, \"GOOGL\" for Google, \"AMZN\" for Amazon, \"TSLA\" for Tesla)."),
    statementType: z.enum(["INCOME_STATEMENT", "BALANCE_SHEET", "CASH_FLOW", "OVERVIEW"])
        .describe("Type of financial statement: 'OVERVIEW' (company metrics & ratios), 'INCOME_STATEMENT' (revenue/profit), 'BALANCE_SHEET' (assets/liabilities), 'CASH_FLOW' (cash movements)."),
    period: z.enum(["annual", "quarterly"]).optional().default("annual")
        .describe("Reporting period: 'annual' (full fiscal year, recommended for trends), 'quarterly' (3-month periods, for recent performance)."),
    limit: z.number().int().positive().optional().default(1)
        .describe("Number of past periods to retrieve (e.g., 3 for last 3 years/quarters, max typically 20).")
});
export const CompanyFinancialsRetrieverOutputSchema = z.record(z.any()).describe("Raw JSON financial data from the provider.");


// Consolidating all tool definitions
// The keys here (e.g., "alphaVantage_getCompanyOverview") must match tool names in DESIGN-ARCHITECTURE.md
export const AllToolDefinitions: Record<string, ToolDefinition> = {
    // Alpha Vantage
    alphaVantage_getCompanyOverview: {
        name: "alphaVantage_getCompanyOverview",
        description: "Fetches company overview and key financial ratios from Alpha Vantage.",
        inputSchema: zodToJsonSchema(AlphaVantageGetCompanyOverviewSchema),
    },
    alphaVantage_searchSymbols: { // As per DESIGN-ARCHITECTURE.md section 2.1.1
        name: "alphaVantage_searchSymbols",
        description: "Searches for stock symbols and company names matching keywords using Alpha Vantage.",
        inputSchema: zodToJsonSchema(AlphaVantageSearchSymbolsSchema),
    },

    // BLS
    bls_getSeriesData: {
        name: "bls_getSeriesData",
        description: "Retrieves data for one or more BLS series IDs.",
        inputSchema: zodToJsonSchema(BlsGetSeriesDataSchema),
    },

    // Census
    census_fetchIndustryData: {
        name: "census_fetchIndustryData", 
        description: "Fetches data from Census Bureau based on specified variables, geography, and filters.",
        inputSchema: zodToJsonSchema(CensusFetchIndustryDataSchema),
    },
    census_fetchMarketSize: {
        name: "census_fetchMarketSize",
        description: "Fetches specific measure for an industry and geography from Census Bureau.",
        inputSchema: zodToJsonSchema(CensusFetchMarketSizeSchema),
    },

    // FRED
    fred_getSeriesObservations: {
        name: "fred_getSeriesObservations",
        description: "Fetches observations for a given FRED series ID.",
        inputSchema: zodToJsonSchema(FredGetSeriesObservationsSchema),
    },

    // IMF
    imf_getDataset: {
        name: "imf_getDataset",
        description: "Fetches a dataset from IMF SDMX-JSON API.",
        inputSchema: zodToJsonSchema(ImfGetDatasetSchema),
    },
    imf_getLatestObservation: {
        name: "imf_getLatestObservation",
        description: "Fetches the latest observation from an IMF dataset.",
        inputSchema: zodToJsonSchema(ImfGetLatestObservationSchema),
    },

    // Nasdaq Data Link
    nasdaq_getDatasetTimeSeries: {
        name: "nasdaq_getDatasetTimeSeries",
        description: "Fetches a time series dataset from Nasdaq Data Link.",
        inputSchema: zodToJsonSchema(NasdaqGetDatasetTimeSeriesSchema),
    },
    nasdaq_getLatestDatasetValue: {
        name: "nasdaq_getLatestDatasetValue",
        description: "Fetches the latest value from a Nasdaq Data Link dataset.",
        inputSchema: zodToJsonSchema(NasdaqGetLatestDatasetValueSchema),
    },

    // OECD
    oecd_getDataset: {
        name: "oecd_getDataset",
        description: "Fetches a dataset from OECD SDMX-JSON API.",
        inputSchema: zodToJsonSchema(OecdGetDatasetSchema),
    },
    oecd_getLatestObservation: {
        name: "oecd_getLatestObservation",
        description: "Fetches the latest observation from an OECD dataset.",
        inputSchema: zodToJsonSchema(OecdGetLatestObservationSchema),
    },

    // World Bank
    worldBank_getIndicatorData: {
        name: "worldBank_getIndicatorData",
        description: "Fetches data for a specific indicator and country from the World Bank.",
        inputSchema: zodToJsonSchema(WorldBankGetIndicatorDataSchema),
    },

    // Multi-Source & Analytical Tools
    industry_search: {
        name: "industry_search",
        description: "Searches industry information across multiple sources, returning consolidated and ranked results.",
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
    return AllToolDefinitions[name];
}

export function getAllToolDefinitions(): ToolDefinition[] {
    return Object.values(AllToolDefinitions);
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
};

// Helper function to get Zod schema for validation
export function getToolValidationSchema(toolName: string): z.ZodType<any> | undefined {
    return toolSchemaMapping[toolName];
}
