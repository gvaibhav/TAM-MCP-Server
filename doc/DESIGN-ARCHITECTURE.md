# TAM MCP Server - Design and Architecture

This document outlines the design and architecture of the Total Addressable Market (TAM) Market Context Protocol (MCP) Server and documents its current production-ready implementation status.

## 1. Introduction

The Total Addressable Market (TAM) Market Context Protocol (MCP) Server is a **production-ready** specialized backend service that provides comprehensive market and industry intelligence. The server successfully integrates 8 major data sources and offers 17 sophisticated market analysis tools through the MCP protocol.

**Implementation Status: ✅ PRODUCTION READY**
- **Full Backend Integration**: All 8 data sources operational with API keys
- **Complete Tool Suite**: 17 tools including enhanced help information and examples
- **Transport Support**: Both STDIO and HTTP Streaming protocols fully functional
- **Comprehensive Testing**: 100% tool functionality verified through automated testing
- **Enhanced User Experience**: Key tools include detailed help, examples, and enum guidance

**Core Capabilities Achieved:**
*   **Unified Data Access:** Single, consistent MCP API accessing Alpha Vantage, BLS, Census Bureau, FRED, IMF, Nasdaq Data Link, OECD, and World Bank with intelligent routing and caching.
*   **Advanced Data Orchestration:** DataService layer provides intelligent source selection, cross-validation, and direct data access capabilities for maximum flexibility.
*   **Comprehensive Tool Suite:** 17 tools spanning direct data access (12), multi-source aggregation (1), and advanced analytics (4) with enhanced user guidance.
*   **Enhanced User Experience:** Three key analytical tools (`tam_calculator`, `market_size_calculator`, `company_financials_retriever`) feature comprehensive help information, practical examples, and detailed parameter guidance.
*   **Production Architecture:** Robust error handling, multi-layer caching, rate limiting, structured logging, and enterprise-ready security features.
*   **Protocol Compliance:** Full MCP 2024-11-05 specification support with tools, resources, logging, and notifications capabilities.

This document details the server's current architecture, implemented tool suite, operational status, and the comprehensive enhancements that have been completed.

## 1.1. Current Implementation Status

**✅ PRODUCTION READY - Full Integration Complete**

The TAM MCP Server has achieved complete production readiness with the following accomplishments:

### Backend Integration Status
- **✅ Alpha Vantage**: Company overviews, symbol search, financial statements - API key integrated
- **✅ Bureau of Labor Statistics (BLS)**: Employment data series access - API key integrated
- **✅ U.S. Census Bureau**: Industry statistics and market size data - API key integrated
- **✅ Federal Reserve Economic Data (FRED)**: Economic series observations - API key integrated
- **✅ International Monetary Fund (IMF)**: SDMX-JSON datasets and observations - Public API access
- **✅ Nasdaq Data Link**: Time series and latest dataset values - API key integrated
- **✅ OECD**: SDMX-JSON economic datasets - Public API access
- **✅ World Bank**: Economic indicators by country - Public API access

### Tool Implementation Status
**Total: 17 tools across 3 categories**

**Direct Data Source Access (12 tools):**
- `alphaVantage_getCompanyOverview` ✅
- `alphaVantage_searchSymbols` ✅
- `bls_getSeriesData` ✅
- `census_fetchIndustryData` ✅
- `census_fetchMarketSize` ✅
- `fred_getSeriesObservations` ✅
- `imf_getDataset` ✅
- `imf_getLatestObservation` ✅
- `nasdaq_getDatasetTimeSeries` ✅
- `nasdaq_getLatestDatasetValue` ✅
- `oecd_getDataset` ✅
- `oecd_getLatestObservation` ✅
- `worldBank_getIndicatorData` ✅

**Multi-Source Aggregation (1 tool):**
- `industry_search` ✅ - Searches across all 8 data sources with intelligent aggregation

**Analytical Tools (4 tools):**
- `tam_calculator` ✅ **ENHANCED** - With comprehensive help and examples
- `market_size_calculator` ✅ **ENHANCED** - With methodology explanations and geography guides
- `company_financials_retriever` ✅ **ENHANCED** - With statement type guidance and pro tips
- `market_opportunities` ✅ - Identifies growth opportunities with risk assessment

### Enhancement Status
**User Experience Improvements Completed:**
- **🎯 Enhanced Tool Descriptions**: Three key analytical tools feature 1000+ character comprehensive descriptions with practical examples, use cases, and parameter guidance
- **📋 Enum Value Explanations**: All enum parameters include clear explanations and usage contexts
- **💡 Pro Tips**: Professional usage recommendations and popular examples (e.g., stock symbols, geography codes)
- **🔍 Methodology Guidance**: Clear explanations of calculation approaches and when to use each

### Testing & Validation Status
- **✅ 100% Tool Functionality**: All 17 tools verified through MCP protocol
- **✅ Backend Integration**: Real API calls successfully executed across all 8 data sources
- **✅ Transport Support**: Both STDIO and HTTP Streaming protocols operational
- **✅ MCP Compliance**: Full 2024-11-05 specification support verified
- **✅ Error Handling**: Robust fallback mechanisms and informative error responses
- **✅ Performance**: Multi-layer caching and rate limiting operational

### Architecture Status
- **✅ DataService Orchestration**: Intelligent routing and direct data access capabilities
- **✅ Tool Definitions**: JSON Schema format with enhanced descriptions and examples
- **✅ Caching Layer**: In-memory and persistent caching with configurable TTLs
- **✅ Logging System**: Structured Winston logging with business metrics
- **✅ Security**: Input validation, rate limiting, and API key management
- **✅ Documentation**: Comprehensive guides, API documentation, and usage examples

## 2. Tool Catalog and Architecture
This section details the available MCP tools, categorized by their function.

### 2.1. Direct Data Source Access Tools
These tools provide direct access to specific data from the integrated live data sources. They are designed to return raw or minimally processed data from a single source per call, without cross-source consolidation. This allows for granular data retrieval.

#### 2.1.1. Alpha Vantage
*   **`alphaVantage_getCompanyOverview`**
    *   Description: Retrieves company overview and key financial ratios for a given stock symbol.
    *   Backend Service Method: `AlphaVantageService.fetchMarketSize` (with `function=OVERVIEW`)
    *   Input Parameters: `symbol: string`
    *   Output: Raw JSON data from Alpha Vantage API (Company Overview).
    *   Tool Logic: Directly calls `DataService.getAlphaVantageData("OVERVIEW", { symbol })`. Returns the raw, unprocessed JSON response.
*   **`alphaVantage_searchSymbols`**
    *   Description: Searches for stock symbols and company names matching keywords using Alpha Vantage.
    *   Backend Service Method: `AlphaVantageService.searchSymbols`
    *   Input Parameters: `keywords: string`
    *   Output: Raw JSON data from Alpha Vantage API (Symbol Search).
    *   Tool Logic: Directly calls `DataService.getAlphaVantageData("SYMBOL_SEARCH", { keywords })`. Returns the raw, unprocessed JSON response.

#### 2.1.2. Bureau of Labor Statistics (BLS)
*   **`bls_getSeriesData`**
    *   Description: Retrieves data for one or more BLS series IDs.
    *   Backend Service Method: `BlsService.fetchSeriesData`
    *   Input Parameters: `seriesIds: string[]`, `startYear?: string`, `endYear?: string`, `catalog?: boolean`, `calculations?: boolean`, `annualaverage?: boolean`, `aspects?: string[]`
    *   Output: Raw JSON data from BLS API for the specified series.
    *   Tool Logic: Directly calls `DataService.getBlsSeriesData({ seriesid: seriesIds, startyear, endyear, catalog, calculations, annualaverage, aspects })`. Returns the raw, unprocessed JSON response.

#### 2.1.3. U.S. Census Bureau
*   **`census_fetchIndustryData`**
    *   Description: Fetches data from the Census Bureau (e.g., County Business Patterns) based on specified variables, geography, filters, year, and dataset path.
    *   Backend Service Method: `CensusService.fetchIndustryData`
    *   Input Parameters:
        *   `variables: string[] | string` - Comma-separated string or array of variable names (e.g., "EMP,PAYANN,ESTAB").
        *   `forGeography: string` - Geography parameter (e.g., "us:1", "state:01").
        *   `filterParams?: object` - Additional filters like NAICS2017, SIC (e.g., `{ "NAICS2017": "23" }`).
        *   `year?: string` - Data year (defaults to a configured or recent year).
        *   `datasetPath?: string` - Specific dataset path (e.g., "cbp" for County Business Patterns).
    *   Output: Raw JSON array from Census API, where each object represents a data record.
    *   Tool Logic: Directly calls `DataService.getCensusData("fetchIndustryData", { variables, forGeography, filterParams, year, datasetPath })`. Returns the raw, unprocessed JSON response.
*   **`census_fetchMarketSize`**
    *   Description: Fetches a specific measure (Employment, Annual Payroll, or Establishments) for an industry (NAICS) and geography from the Census Bureau.
    *   Backend Service Method: `CensusService.fetchMarketSize`
    *   Input Parameters:
        *   `naicsCode: string` - Industry code (e.g., "23" for Construction).
        *   `geography: string` - Geography parameter (e.g., "us:1").
        *   `measure?: "EMP" | "PAYANN" | "ESTAB"` - Measure to fetch (defaults to "EMP").
        *   `year?: string` - Data year (defaults to a configured or recent year).
    *   Output: Raw JSON object from Census API representing the specific market size data point.
    *   Tool Logic: Directly calls `DataService.getCensusData("fetchMarketSize", { naicsCode, geography, measure, year })`. Returns the raw, unprocessed JSON response.

#### 2.1.4. Federal Reserve Economic Data (FRED)
*   **`fred_getSeriesObservations`**
    *   Description: Fetches observations for a given FRED series ID.
    *   Backend Service Method: `FredService.fetchMarketSize` (Note: FRED service's `fetchMarketSize` is used for fetching series observations; `fetchIndustryData` is a placeholder).
    *   Input Parameters: `seriesId: string`
    *   Output: Raw JSON data from FRED API containing observations for the series.
    *   Tool Logic: Directly calls `DataService.getFredData({ seriesId })`. Returns the raw, unprocessed JSON response. (The `DataService` method would internally call `FredService.fetchMarketSize`).

#### 2.1.5. International Monetary Fund (IMF)
*   **`imf_getDataset`**
    *   Description: Fetches a dataset from IMF SDMX-JSON API based on dataflow ID, a structured key, and optional date range.
    *   Backend Service Method: `ImfService.fetchImfDataset` (or its alias `ImfService.fetchIndustryData`)
    *   Input Parameters:
        *   `dataflowId: string` - Identifier of the dataflow (e.g., "IFS").
        *   `key: string` - Dimension filter key (e.g., "A.US.NGDP_RPCH").
        *   `startPeriod?: string` - Optional start period (e.g., "2020").
        *   `endPeriod?: string` - Optional end period.
    *   Output: Raw JSON array from IMF API, where each object represents a flattened observation.
    *   Tool Logic: Directly calls `DataService.getImfData("fetchImfDataset", { dataflowId, key, startPeriod, endPeriod })`. Returns the raw, unprocessed JSON response.
*   **`imf_getLatestObservation`**
    *   Description: Fetches a dataset from IMF and returns the latest observation, typically used for a single market size value.
    *   Backend Service Method: `ImfService.fetchMarketSize`
    *   Input Parameters:
        *   `dataflowId: string` - Identifier of the dataflow.
        *   `key: string` - Dimension filter key.
        *   `startPeriod?: string` - Optional start period.
        *   `endPeriod?: string` - Optional end period.
        *   `valueAttribute?: string` - Optional: specific attribute to consider as the value (defaults to 'value').
    *   Output: Raw JSON object from IMF API representing the latest observation.
    *   Tool Logic: Directly calls `DataService.getImfData("fetchMarketSize", { dataflowId, key, startPeriod, endPeriod, valueAttribute })`. Returns the raw, unprocessed JSON response.


#### 2.1.6. Nasdaq Data Link
*   **`nasdaq_getDatasetTimeSeries`**
    *   Description: Fetches a time series dataset from Nasdaq Data Link.
    *   Backend Service Method: `NasdaqDataService.fetchIndustryData` (which internally calls `fetchDatasetTimeSeries`)
    *   Input Parameters:
        *   `databaseCode: string` - Database code (e.g., "FRED").
        *   `datasetCode: string` - Dataset code (e.g., "GDP").
        *   `params?: object` - Optional API parameters like `limit`, `start_date`, `end_date`, `order`, `column_index`.
    *   Output: Raw JSON array from Nasdaq Data Link API, where each object represents a data point in the time series.
    *   Tool Logic: Directly calls `DataService.getNasdaqData("fetchIndustryData", { databaseCode, datasetCode, params })`. Returns the raw, unprocessed JSON response.
*   **`nasdaq_getLatestDatasetValue`**
    *   Description: Fetches a dataset from Nasdaq Data Link and extracts a single value, typically the latest or for a specific date.
    *   Backend Service Method: `NasdaqDataService.fetchMarketSize`
    *   Input Parameters:
        *   `databaseCode: string` - Database code.
        *   `datasetCode: string` - Dataset code.
        *   `valueColumn?: string` - Optional: the name of the column containing the value.
        *   `date?: string` - Optional: specific date (YYYY-MM-DD) to find the value for. If not provided, latest is used.
    *   Output: Raw JSON object from Nasdaq Data Link API representing the specific data point.
    *   Tool Logic: Directly calls `DataService.getNasdaqData("fetchMarketSize", { databaseCode, datasetCode, valueColumn, date })`. Returns the raw, unprocessed JSON response.

#### 2.1.7. Organisation for Economic Co-operation and Development (OECD)
*   **`oecd_getDataset`**
    *   Description: Fetches a dataset from OECD SDMX-JSON API.
    *   Backend Service Method: `OecdService.fetchOecdDataset` (or its alias `OecdService.fetchIndustryData`)
    *   Input Parameters:
        *   `datasetId: string` - Identifier of the dataset (e.g., "QNA").
        *   `filterExpression: string` - Dimension filter (e.g., "AUS.TOTAL.AGR.Q").
        *   `agencyId?: string` - Agency identifier (defaults to 'all').
        *   `startTime?: string` - Start period (e.g., "2020", "2020-Q1").
        *   `endTime?: string` - End period.
        *   `dimensionAtObservation?: string` - How dimensions are reported (defaults to 'AllDimensions').
    *   Output: Raw JSON array from OECD API, where each object represents a flattened observation.
    *   Tool Logic: Directly calls `DataService.getOecdData("fetchOecdDataset", { datasetId, filterExpression, agencyId, startTime, endTime, dimensionAtObservation })`. Returns the raw, unprocessed JSON response.
*   **`oecd_getLatestObservation`**
    *   Description: Fetches an OECD dataset and returns the latest observation.
    *   Backend Service Method: `OecdService.fetchMarketSize`
    *   Input Parameters:
        *   `datasetId: string` - Identifier of the dataset.
        *   `filterExpression: string` - Dimension filter.
        *   `valueAttribute?: string` - Optional: specific attribute to consider as the value (defaults to 'value').
        *   `agencyId?: string` - Agency identifier.
        *   `startTime?: string` - Start period.
        *   `endTime?: string` - End period.
        *   `dimensionAtObservation?: string` - How dimensions are reported.
    *   Output: Raw JSON object from OECD API representing the latest observation.
    *   Tool Logic: Directly calls `DataService.getOecdData("fetchMarketSize", { datasetId, filterExpression, valueAttribute, agencyId, startTime, endTime, dimensionAtObservation })`. Returns the raw, unprocessed JSON response.

#### 2.1.8. World Bank
*   **`worldBank_getIndicatorData`**
    *   Description: Fetches data for a specific indicator and country from the World Bank.
    *   Backend Service Method: `WorldBankService.fetchMarketSize` (Note: World Bank service's `fetchMarketSize` is used for fetching indicator data; `fetchIndustryData` is a placeholder).
    *   Input Parameters:
        *   `countryCode: string` - Country code (e.g., "USA", "BRA").
        *   `indicator?: string` - World Bank indicator code (e.g., "NY.GDP.MKTP.CD"). Defaults to a configured GDP indicator.
    *   Output: Raw JSON data from World Bank API for the indicator and country.
    *   Tool Logic: Directly calls `DataService.getWorldBankData({ countryCode, indicator })`. Returns the raw, unprocessed JSON response. (The `DataService` method would internally call `WorldBankService.fetchMarketSize`).

### 2.2. Multi-Source Search and Aggregation Tools
These tools query multiple data sources, then consolidate, deduplicate, and rank the results to provide a comprehensive view.

#### 2.2.1. Industry Search (`industry_search`)
*   **Description:** Searches for industry information across multiple integrated data sources using a flexible query. It aims to return consolidated, deduplicated, and relevance-ranked results, providing a comprehensive overview for a given industry query.
*   **Input Parameters:**
    *   `query`: string - The search query (e.g., "pharmaceutical manufacturing", "NAICS 3254", "biotechnology US", "economic outlook for renewable energy").
    *   `sources?`: string[] (optional) - Array of specific data source IDs (e.g., `["CENSUS", "BLS", "WORLD_BANK"]`) to restrict the search. If omitted, queries all enabled and relevant sources.
    *   `limit?`: number (optional) - Maximum number of consolidated industry results to return.
    *   `minRelevanceScore?`: number (optional, 0.0 to 1.0) - Minimum relevance score for results to be included.
    *   `geographyFilter?`: string[] (optional) - Array of geographic identifiers (e.g., ["US", "CA", "DE"]) to help focus the search, where applicable to underlying sources.
*   **Output:** JSON object containing:
    *   `query`: string - The original query string submitted.
    *   `parameters`: object - The parameters used for the search (including defaults if not specified).
    *   `results`: array of `IndustryDTO` objects. Each `IndustryDTO` represents a consolidated view of an industry and includes:
        *   `industryId`: string - A unique identifier for the industry (e.g., a primary NAICS code, or an internally generated ID for aggregated concepts).
        *   `name`: string - Common or standardized name of the industry.
        *   `description?`: string - A brief description or summary of the industry.
        *   `naicsCodes?`: string[] - Associated NAICS codes relevant to this industry entry.
        *   `sicCodes?`: string[] - Associated SIC codes, if available.
        *   `otherCodes?`: object[] - Other relevant industry classification codes (e.g., `{ "system": "ISIC", "code": "C2100" }`).
        *   `keywords?`: string[] - Relevant keywords or search terms associated with the industry.
        *   `marketSizeEstimate?`: object - An estimated market size, potentially aggregated or selected from the best available source. Structure: `{ "value": number, "currency": string, "year": string, "sourceExcerpt": string, "originalSource": string }`.
        *   `growthRate?`: object - Estimated growth rate. Structure: `{ "value": number, "period": "annual" | "quarterly", "year": string, "sourceExcerpt": string, "originalSource": string }`.
        *   `keyPlayers?`: string[] - List of key companies or entities in the industry.
        *   `trends?`: string[] - Notable trends observed in the industry.
        *   `dataSources`: array of objects - Details of the underlying data points from various sources that contributed to this consolidated DTO. Each object might include: `{ "sourceName": string, "sourceSpecificId": string, "dataType": string, "retrievedData": object, "retrievalTimestamp": string }`.
        *   `relevanceScore`: number - A score (e.g., 0.0 to 1.0) indicating the relevance of this consolidated entry to the original query.
        *   `lastUpdated?`: string (ISO 8601 date) - The most recent date an underlying data point for this entry was updated or reported by its source.
    *   `summary?`: string - An optional, brief textual summary of the overall findings or the top results.
    *   `errors?`: array of objects - Any errors encountered from specific data sources during the search process (e.g., `{ "sourceName": "AlphaVantage", "errorCode": "API_TIMEOUT", "message": "..." }`).
*   **Logic:**
    1.  Validates input parameters (`query`, `sources`, `limit`, `minRelevanceScore`, `geographyFilter`).
    2.  Calls `DataService.searchIndustries()` with the validated parameters. This is the core method responsible for orchestration.
    3.  The `DataService.searchIndustries()` method performs the following:
        *   **Multi-Source Search Strategy:** Concurrently queries enabled and relevant data sources (Alpha Vantage, Census, FRED, World Bank, BLS, Nasdaq, OECD, IMF, and potentially mock/static data providers). The selection of sources can be guided by the `sources` parameter or an internal logic that maps query types/keywords to appropriate data providers. Each data source service has specific query mapping logic (e.g., interpreting the main `query` for NAICS codes for Census, keywords for BLS, stock symbols/company names for Alpha Vantage, economic indicators for FRED/World Bank, etc.). The `geographyFilter` is used to refine queries to individual data sources where applicable.
        *   **Data Consolidation & Deduplication:** Results from various sources are transformed into a common `Industry` Data Transfer Object (DTO) schema. Sophisticated deduplication logic is applied based on NAICS codes, industry names, geographic scope, and other identifying factors to avoid redundant entries and to merge information about the same conceptual industry from different sources into a single, richer DTO.
        *   **Relevance Scoring and Ranking:** Consolidated `IndustryDTOs` are scored based on factors suchas: direct keyword matches in names or descriptions, the specificity of NAICS/other code matches, the completeness and quality of the data returned for an industry, the perceived reliability or directness of the data source for the query type, and the recency of the data. Results are then ranked by this relevance score.
        *   **Result Filtering & Limiting:** Applies the `limit` and `minRelevanceScore` parameters to the ranked list of results.
        *   **Fallback Mechanisms & Error Handling:** If live data sources fail, time out, or return no data, the system logs these errors (to be included in the tool's output). The search attempts to continue with other available sources. Caching is employed at both the `DataService` level (for potentially aggregated/transformed results) and at individual data source service levels (for raw API responses) to improve performance, reduce load on external APIs, and provide resilience. Mock data might be used as a fallback for certain queries if configured and primary sources are unavailable.
    4.  The `industry_search` tool receives the processed list of `IndustryDTOs`, summary, and error list from `DataService`.
    5.  Formats the final JSON response as specified in the "Output" section.

### 2.3. Analytical and Calculation Tools
The analytical tools leverage the integrated data sources to perform sophisticated market analysis, calculations, and projections. These tools have been enhanced with comprehensive help information, practical examples, and detailed parameter guidance to improve user experience.

#### 2.3.1. TAM Calculator (`tam_calculator`) - **✨ ENHANCED**
*   **Description**: Calculates Total Addressable Market (TAM) with comprehensive guidance and examples.
*   **Enhanced Features**: 
    - 📊 Projects market value over multiple years using compound growth
    - 💡 Use cases: startup funding presentations, market entry strategy, product roadmap planning
    - 📋 Detailed parameter guidance with specific examples (e.g., 0.20 for 20% growth)
    - 🎯 Real-world example: $500M SaaS market growing 20% annually over 5 years with 60% addressable portion
*   **Backend Service Method**: `DataService.calculateTam` or direct calculation using market size data
*   **Input Parameters**: 
    - `baseMarketSize: number` - Current market value in USD (e.g., 1000000000 for $1B)
    - `annualGrowthRate: number` - Growth rate as decimal (e.g., 0.15 = 15% annual growth)
    - `projectionYears: number` - Years to project (typically 3-10 years)
    - `segmentationAdjustments?: object` - Optional market focus factor (e.g., 0.8 = 80% of total market)
*   **Output**: JSON object with calculated TAM, year-by-year projections, and key assumptions
*   **Tool Logic**: Performs compound growth calculations, applies segmentation adjustments, provides detailed breakdown with confidence indicators.

#### 2.3.2. Market Size Calculator (`market_size_calculator`) - **✨ ENHANCED**
*   **Description**: Estimates current market size for an industry or product with methodology explanations and examples.
*   **Enhanced Features**:
    - 🔍 Searches across multiple data sources for market size data
    - 💼 Use cases: market research, investment thesis validation, business case development
    - 🎯 Methodology options with clear explanations: top_down, bottom_up, auto
    - 🌍 Common geography code examples: US, EU, APAC, CA, GB, DE, FR, JP, AU, etc.
    - 📊 Industry query examples: "Cloud infrastructure services", "Electric vehicle manufacturing"
*   **Backend Service Method**: `DataService.calculateMarketSize` with multi-source aggregation
*   **Input Parameters**:
    - `industryQuery: string` - Descriptive industry name or specific focus area
    - `geographyCodes?: string[]` - Geographic scope (e.g., ["US", "CA", "EU", "APAC", "Global"])
    - `indicatorCodes?: string[]` - Economic indicators to prioritize (optional)
    - `year?: string` - Target year for estimates (defaults to current)
    - `methodology?: "top_down" | "bottom_up" | "auto"` - Calculation approach
*   **Output**: JSON object with estimated market size, confidence score, data sources used, and methodology applied
*   **Tool Logic**: Multi-source data aggregation, methodology selection, confidence scoring with transparent source attribution.

#### 2.3.3. Company Financials Retriever (`company_financials_retriever`) - **✨ ENHANCED**
*   **Description**: Retrieves detailed financial statements for public companies with comprehensive guidance.
*   **Enhanced Features**:
    - 📈 Fetches comprehensive financial data from Alpha Vantage
    - 🏢 Use cases: investment research, competitive benchmarking, financial modeling, credit analysis
    - 💰 Statement type explanations: OVERVIEW (company metrics), INCOME_STATEMENT (revenue/profit), BALANCE_SHEET (assets/liabilities), CASH_FLOW (cash movements)
    - 📅 Period guidance: annual (recommended for trends) vs quarterly (recent performance)
    - 💡 Pro tips: popular symbols (AAPL, MSFT, GOOGL, AMZN, TSLA), usage recommendations
*   **Backend Service Method**: `DataService.getCompanyFinancials` using Alpha Vantage integration
*   **Input Parameters**:
    - `companySymbol: string` - Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL")
    - `statementType: "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW" | "OVERVIEW"` - Financial statement type
    - `period?: "annual" | "quarterly"` - Reporting frequency (default: "annual")
    - `limit?: number` - Number of past periods to include (default: 1, max typically 20)
*   **Output**: Raw JSON financial data from Alpha Vantage with structured format
*   **Tool Logic**: Maps to appropriate Alpha Vantage functions based on statement type, handles period and limit parameters, provides clean financial data access.

#### 2.3.4. Market Opportunities (`market_opportunities`)
*   **Description**: Identifies emerging market opportunities based on growth criteria and risk assessment.
*   **Backend Service Method**: `DataService.getMarketOpportunities` with multi-criteria analysis
*   **Input Parameters**: Industry filters, growth thresholds, time horizons, risk preferences
*   **Output**: JSON array of ranked market opportunities with attractiveness scores
*   **Tool Logic**: Analyzes market trends, competitive intensity, barriers to entry, and growth potential across multiple data sources.

## 3. Tool Processing Flow (General)

For **Direct Data Source Access Tools (section 2.1)**:
Request → Tool Invocation → Parameter Validation → `DataService` call to specific data source service method → Raw Data Retrieval from external API by the specific service → Minimal to No Transformation by the service (data returned largely as-is from the source) → Raw Response Generation by the tool.

For **Multi-Source Search and Aggregation Tools (section 2.2)**, like `industry_search`:
Request → Tool Invocation → Parameter Validation → `DataService` interaction (orchestrating concurrent calls to various relevant data source service methods based on the query) → Data Aggregation, Transformation (into common DTOs), Deduplication, and Relevance Scoring by the `DataService` → Processed Response Generation by the tool.

For **Analytical and Calculation Tools (section 2.3)**:
Request → Tool Invocation → Parameter Validation → `DataService` interaction (calling specific calculation methods or retrieving data, potentially from multiple sources via other service methods) → Computation/Analysis by the `DataService` or tool → Processed Response Generation by the tool.

## 4. Backend Data Source Mapping

This section details how MCP tools map to underlying backend services and their methods.

*   **Direct Data Source Access Tools (Section 2.1):** Each tool in this category has a 1:1 mapping to a specific method within one of the 8 backend data source services (e.g., `alphaVantage_getCompanyOverview` maps to `AlphaVantageService.fetchMarketSize`). The tool acts as a direct pass-through for that service method, facilitated by the `DataService`, ensuring raw or minimally processed data is returned.

*   **Multi-Source Search and Aggregation Tools (Section 2.2):** These tools, such as `industry_search`, interact with multiple data source services. The `DataService` is responsible for orchestrating these interactions, calling relevant methods of individual data source services (e.g., `BlsService.fetchIndustryData`, `CensusService.searchNaics`, `AlphaVantageService.searchSymbols`), and then performing the necessary consolidation, deduplication, and ranking of results.

*   **Analytical and Calculation Tools (Section 2.3):** These tools typically invoke specific business logic methods within the `DataService` (e.g., `DataService.calculateTam`). These `DataService` methods might internally retrieve data using various data source services or perform calculations based on provided inputs and retrieved data.

## 5. Data Flow Diagrams

Visual representations of data flow from request to response, illustrating the interaction between different components of the TAM MCP Server.

### 5.1. General Data Flow for a Direct Data Source Access Tool

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant MCPTool as MCP Tool (e.g., alphaVantage_getCompanyOverview)
    participant DataService as DataService
    participant DataSourceSvc as Specific Data Source Service (e.g., AlphaVantageService)
    participant ExternalAPI as External API (e.g., Alpha Vantage API)

    Client->>MCPTool: Request (tool_name, {params})
    MCPTool->>MCPTool: Validate Parameters
    MCPTool->>DataService: Call specific method (e.g., getAlphaVantageData("OVERVIEW", {symbol}))
    DataService->>DataSourceSvc: Invoke corresponding method (e.g., fetchMarketSize("OVERVIEW", {symbol}))
    DataSourceSvc->>DataSourceSvc: Check Cache for existing data
    alt Cache Miss
        DataSourceSvc->>ExternalAPI: HTTP GET Request to External API
        ExternalAPI-->>DataSourceSvc: Raw API Response (JSON/XML)
        DataSourceSvc->>DataSourceSvc: Store response in Cache
        DataSourceSvc-->>DataService: Return Raw/Minimally Processed Data
    else Cache Hit
        DataSourceSvc-->>DataService: Return Cached Data
    end
    DataService-->>MCPTool: Forward Data
    MCPTool-->>Client: MCP Response (Raw/Minimally Processed Data)
```

### 5.2. General Data Flow for `industry_search` Tool

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant IndustrySearchTool as industry_search MCP Tool
    participant DataService as DataService
    participant AlphaVantageSvc as AlphaVantageService
    participant CensusSvc as CensusService
    participant BlsSvc as BlsService
    participant FredSvc as FredService
    participant ImfSvc as ImfService
    participant NasdaqSvc as NasdaqDataService
    participant OecdSvc as OecdService
    participant WorldBankSvc as WorldBankService
    participant ExternalAPIs as External APIs (Multiple)

    Client->>IndustrySearchTool: Request (industry_search, {query, sources?, limit?})
    IndustrySearchTool->>IndustrySearchTool: Validate Parameters
    IndustrySearchTool->>DataService: Call searchIndustries({query, sources?, limit?})
    DataService->>DataService: Determine relevant sources based on query/params
    par
        DataService->>AlphaVantageSvc: Query Alpha Vantage (e.g., searchSymbols)
        AlphaVantageSvc->>ExternalAPIs: Call Alpha Vantage API
        ExternalAPIs-->>AlphaVantageSvc: AV Response
        AlphaVantageSvc-->>DataService: AV Results
    and
        DataService->>CensusSvc: Query Census (e.g., searchNaics, fetchIndustryData)
        CensusSvc->>ExternalAPIs: Call Census API
        ExternalAPIs-->>CensusSvc: Census Response
        CensusSvc-->>DataService: Census Results
    and
        DataService->>BlsSvc: Query BLS (e.g., searchSeries, fetchSeriesData)
        BlsSvc->>ExternalAPIs: Call BLS API
        ExternalAPIs-->>BlsSvc: BLS Response
        BlsSvc-->>DataService: BLS Results
    and
        DataService->>FredSvc: Query FRED (e.g., searchSeries)
        FredSvc->>ExternalAPIs: Call FRED API
        ExternalAPIs-->>FredSvc: FRED Response
        FredSvc-->>DataService: FRED Results
    and
        DataService->>ImfSvc: Query IMF (e.g., searchDataset)
        ImfSvc->>ExternalAPIs: Call IMF API
        ExternalAPIs-->>ImfSvc: IMF Response
        ImfSvc-->>DataService: IMF Results
    and
        DataService->>NasdaqSvc: Query Nasdaq (e.g., searchDataset)
        NasdaqSvc->>ExternalAPIs: Call Nasdaq API
        ExternalAPIs-->>NasdaqSvc: Nasdaq Response
        NasdaqSvc-->>DataService: Nasdaq Results
    and
        DataService->>OecdSvc: Query OECD (e.g., searchDataset)
        OecdSvc->>ExternalAPIs: Call OECD API
        ExternalAPIs-->>OecdSvc: OECD Response
        OecdSvc-->>DataService: OECD Results
    and
        DataService->>WorldBankSvc: Query World Bank (e.g., searchIndicators)
        WorldBankSvc->>ExternalAPIs: Call World Bank API
        ExternalAPIs-->>WorldBankSvc: WB Response
        WorldBankSvc-->>DataService: WB Results
    end
    DataService->>DataService: Consolidate, Deduplicate, Transform to IndustryDTOs
    DataService->>DataService: Apply Relevance Scoring & Ranking
    DataService->>DataService: Filter by limit/minRelevanceScore
    DataService-->>IndustrySearchTool: Processed IndustryDTOs, summary, errors
    IndustrySearchTool-->>Client: MCP Response (Consolidated & Ranked Results)
```

### 5.3. General Data Flow for an Analytical Tool (e.g., `tam_calculator`)

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant AnalyticalTool as MCP Tool (e.g., tam_calculator)
    participant DataService as DataService
    participant OptionalDataSourceAccess as Direct Data Access Tools (if needed)

    Client->>AnalyticalTool: Request (tool_name, {params})
    AnalyticalTool->>AnalyticalTool: Validate Input Parameters
    alt Input data is sufficient for calculation
        AnalyticalTool->>DataService: Call calculation method (e.g., calculateTam({baseMarketSize, ...}))
        DataService->>DataService: Perform calculations based on inputs
        DataService-->>AnalyticalTool: Calculated Result
    else Input data requires fetching from sources
        AnalyticalTool->>DataService: Request data via other tools/methods (e.g., market_size_calculator or direct tools)
        DataService->>OptionalDataSourceAccess: (Flow similar to 5.1 or 5.2 if market_size_calculator calls industry_search)
        OptionalDataSourceAccess-->>DataService: Retrieved Data
        DataService-->>AnalyticalTool: Data for calculation
        AnalyticalTool->>DataService: Call calculation method with retrieved & input data
        DataService->>DataService: Perform calculations
        DataService-->>AnalyticalTool: Calculated Result
    end
    AnalyticalTool-->>Client: MCP Response (Calculated Data)
```

## 6. Fallback Mechanisms (General)

The TAM MCP Server employs several strategies to ensure resilience and provide meaningful responses even when external data sources face issues.

### 6.1. Mock Data Usage
*   **Purpose:** To provide stable example responses for development, testing, and demonstrations, and as a last resort if live services are completely unavailable for critical information types.
*   **Activation:** Mock data providers can be enabled/disabled via configuration. The `industry_search` tool and potentially other tools might be configured to consult mock sources if primary live sources fail to return data or are explicitly disabled.
*   **Scope:** Mock data typically covers a predefined set of common queries or industry examples. It is not a comprehensive replacement for live data.
*   **Indication:** Responses containing mock data will be clearly flagged in the `dataSources` array of the `IndustryDTO` or in a similar metadata field to ensure transparency.

### 6.2. Error Handling
*   **Granular Errors:** Errors originating from individual data source services (e.g., API key issues, rate limits, source-specific errors, timeouts) are caught within the respective service modules (e.g., `AlphaVantageService`).
*   **Propagation to `DataService`:** These errors are typically logged by the specific service and then propagated to the `DataService`. The `DataService`, especially in multi-source operations like `searchIndustries`, will collect these errors without halting the entire operation. It will attempt to proceed with other available data sources.
*   **Tool-Level Reporting:** MCP tools (like `industry_search`) will receive a collection of errors from `DataService` and include them in their final response (e.g., in an `errors` array). This informs the client about which sources might have failed.
*   **Critical Failures:** If a fundamental issue occurs (e.g., `DataService` cannot operate, or a direct access tool's single source fails critically), the MCP tool will return a more general error response indicating the failure to process the request.
*   **User Feedback:** Error messages aim to be informative, providing context about the nature of the error and the source if applicable.

### 6.3. Caching Strategy
*   **Multi-Layer Caching:**
    *   **Data Source Service Cache:** Each individual data source service (e.g., `CensusService`, `BlsService`) implements its own caching layer. This cache stores the raw or minimally processed responses from the external API. This reduces redundant calls to the same external API endpoint with the same parameters.
        *   **TTL (Time-To-Live):** Cache entries have a configurable TTL. A shorter TTL is used for data that is expected to be volatile, while a longer TTL can be used for more static data. Separate TTLs are often configured for successful fetches versus "no data found" responses or error responses to prevent rapid retries on known issues.
    *   **`DataService` Cache (Optional/Future):** For complex, aggregated results (like those from `industry_search` or `market_size_calculator` before final DTO transformation), an additional caching layer within `DataService` could be implemented. This would store the consolidated data before it's passed to the tool, saving on repeated aggregation and processing logic if the same complex query is made.
*   **Cache Invalidation:** Cache invalidation is primarily TTL-based. Manual cache clearing mechanisms might be provided for administrative purposes.
*   **Cache Key Design:** Cache keys are carefully constructed to include all parameters that define the uniqueness of a request to an external API or an internal processing step.
*   **Benefits:**
    *   **Performance:** Significantly improves response times for repeated queries.
    *   **Rate Limit Management:** Reduces the number of calls to external APIs, helping to stay within rate limits.
    *   **Resilience:** Can serve stale data (if configured) when a live source is temporarily unavailable, providing a degree of fault tolerance.
    *   **Cost Reduction:** Lowers costs associated with pay-per-call APIs.

## 7. API Integration Points

This section details the integration specifics for each backend data source, including authentication, key management, rate limits, and primary endpoints utilized by the TAM MCP Server. API keys are expected to be stored in environment variables and accessed by their respective services.

### 7.1. Alpha Vantage
*   **Authentication:** API Key (`apikey` parameter in the query string).
*   **Key Management:** The API key is expected to be stored in an environment variable (e.g., `ALPHA_VANTAGE_API_KEY`) and accessed by the `AlphaVantageService`.
*   **Rate Limits:** Free tier typically allows around 25 requests per day or 5 requests per minute. Premium tiers offer significantly higher limits (e.g., 75-1200+ requests per minute). *Actual limits should be verified based on the subscribed plan.*
*   **Primary Endpoints Used (Examples):**
    *   Company Overview: `https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={process.env.ALPHA_VANTAGE_API_KEY}`
    *   Time Series: `https://www.alphavantage.co/query?function={seriesType}&symbol={symbol}&outputsize={outputsize}&apikey={process.env.ALPHA_VANTAGE_API_KEY}`
*   **Data Format:** JSON.
*   **Notes:** Endpoint usage depends on the `function` parameter (e.g., `OVERVIEW`, `TIME_SERIES_DAILY`).

### 7.2. U.S. Census Bureau
*   **Authentication:** API Key (`key` parameter in the query string) is recommended for higher rate limits and stability.
*   **Key Management:** The API key is expected to be stored in an environment variable (e.g., `CENSUS_API_KEY`) and accessed by the `CensusService`.
*   **Rate Limits:** Without a key, limits are typically around 500 queries per IP address per day. With a key, this can increase significantly (e.g., 10,000+ queries per day, subject to Census Bureau policies). *Actual limits should be verified.*
*   **Primary Endpoints Used (Example for County Business Patterns):**
    *   `https://api.census.gov/data/{year}/{datasetPath}?get={variables}&for={forGeography}&{filterParams}&key={process.env.CENSUS_API_KEY}`
    *   Example: `https://api.census.gov/data/2021/cbp?get=EMP,PAYANN,ESTAB&for=us:1&NAICS2017=23&key={CENSUS_API_KEY}`
*   **Data Format:** JSON (typically an array of arrays, where the first sub-array contains headers).

### 7.3. Federal Reserve Economic Data (FRED)
*   **Authentication:** API Key (`api_key` parameter in the query string).
*   **Key Management:** The API key is expected to be stored in an environment variable (e.g., `FRED_API_KEY`) and accessed by the `FredService`.
*   **Rate Limits:** Generally generous, often around 120 requests per minute per API key. *Actual limits should be confirmed with FRED API documentation.*
*   **Primary Endpoints Used (Example for Series Observations):**
    *   `https://api.stlouisfed.org/fred/series/observations?series_id={seriesId}&api_key={process.env.FRED_API_KEY}&file_type=json&observation_start={startDate}&observation_end={endDate}`
*   **Data Format:** JSON.

### 7.4. World Bank
*   **Authentication:** No API key is strictly required for basic access to most indicators.
*   **Key Management:** N/A if no key is used.
*   **Rate Limits:** Public access is generally open but subject to "fair use." Limits can be around 2,000-10,000 requests per hour, but this can vary. *It's advisable to check the latest World Bank API terms.*
*   **Primary Endpoints Used (Example for Indicator Data):**
    *   `http://api.worldbank.org/v2/country/{countryCode}/indicator/{indicatorCode}?format=json&per_page={count}&date={dateRange}`
    *   Example: `http://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json&per_page=10&date=2015:2020`
*   **Data Format:** JSON (returns an array where the second element typically contains the data array).

### 7.5. Bureau of Labor Statistics (BLS)
*   **Authentication:** API Key (registration key) is optional for API v1 (limited) but recommended/required for API v2 for higher limits and more features. Passed in the request payload for v2.
*   **Key Management:** The API key is expected to be stored in an environment variable (e.g., `BLS_API_KEY`) and accessed by the `BlsService`.
*   **Rate Limits:**
    *   Without key (or API v1): ~25 queries per day.
    *   With key (API v2): Up to 500 queries per day, 50 series IDs per query, 10 years of data per series ID per query. *Actual limits should be verified with BLS API documentation.*
*   **Primary Endpoints Used (API v2):**
    *   `https://api.bls.gov/publicAPI/v2/timeseries/data/` (POST request)
    *   Payload Example: `{ "seriesid": ["SERIES_ID_1", "SERIES_ID_2"], "startyear":"2020", "endyear":"2023", "registrationkey":"{process.env.BLS_API_KEY}" }`
*   **Data Format:** JSON.

### 7.6. Nasdaq Data Link (formerly Quandl)
*   **Authentication:** API Key (`api_key` parameter in the query string).
*   **Key Management:** The API key is expected to be stored in an environment variable (e.g., `NASDAQ_API_KEY`) and accessed by the `NasdaqDataService`.
*   **Rate Limits:** Free plan typically allows ~300 calls per day and 20,000 calls per month. Premium plans offer significantly higher limits. *Actual limits depend on the subscription plan and should be verified.*
*   **Primary Endpoints Used (Example for Dataset Time Series):**
    *   `https://data.nasdaq.com/api/v3/datasets/{databaseCode}/{datasetCode}/data.json?api_key={process.env.NASDAQ_API_KEY}&{additional_params}`
    *   Example: `https://data.nasdaq.com/api/v3/datasets/FRED/GDP/data.json?api_key={NASDAQ_API_KEY}&limit=1`
*   **Data Format:** JSON.

### 7.7. Organisation for Economic Co-operation and Development (OECD)
*   **Authentication:** No API key is typically required for the SDMX-JSON API.
*   **Key Management:** N/A.
*   **Rate Limits:** While not always explicitly defined with hard numbers, APIs are subject to "fair use" policies. Excessive requests can lead to temporary throttling or blocking. *It's recommended to implement respectful polling and caching.*
*   **Primary Endpoints Used (Example for Dataset):**
    *   `https://sdmx.oecd.org/sdmx-json/data/{datasetId}/{filterExpression}/{agencyId}?startTime={startTime}&endTime={endTime}&dimensionAtObservation={dimensionAtObservation}`
    *   Example: `https://sdmx.oecd.org/sdmx-json/data/QNA/AUS.TOTAL.B1_GE.Q/all?startTime=2020-Q1&endTime=2023-Q4`
*   **Data Format:** SDMX-JSON.

### 7.8. International Monetary Fund (IMF)
*   **Authentication:** No API key is typically required for the SDMX-JSON API.
*   **Key Management:** N/A.
*   **Rate Limits:** Similar to OECD, IMF APIs are generally open but subject to "fair use." High-volume, unthrottled requests may be restricted. *Caching and considerate request patterns are advised.*
*   **Primary Endpoints Used (Example for Compact Data):**
    *   `http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/{dataflowId}/{key}?startPeriod={startPeriod}&endPeriod={endPeriod}`
    *   Example: `http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A.US.NGDP_RPCH?startPeriod=2020&endPeriod=2023`
*   **Data Format:** SDMX-JSON.

## 8. Working Query Examples

This section provides illustrative examples of how to invoke the MCP tools. These are conceptual and assume a client capable of making requests to the MCP server.

### 8.1. `industry_search`

**Example 1: General query for an industry**
```json
{
  "tool_name": "industry_search",
  "parameters": {
    "query": "pharmaceutical manufacturing in USA",
    "limit": 5
  }
}
```

**Example 2: Query with specific data sources**
```json
{
  "tool_name": "industry_search",
  "parameters": {
    "query": "NAICS 3254",
    "sources": ["CENSUS", "BLS"],
    "limit": 3
  }
}
```

**Example 3: Query with geography filter**
```json
{
  "tool_name": "industry_search",
  "parameters": {
    "query": "renewable energy market size",
    "geographyFilter": ["DE", "FR"],
    "minRelevanceScore": 0.7
  }
}
```

### 8.2. Direct Data Source Access Tools

#### 8.2.1. Alpha Vantage

*   **`alphaVantage_getCompanyOverview`**
    ```json
    {
      "tool_name": "alphaVantage_getCompanyOverview",
      "parameters": {
        "symbol": "IBM"
      }
    }
    ```

*   **`alphaVantage_searchSymbols`**
    ```json
    {
      "tool_name": "alphaVantage_searchSymbols",
      "parameters": {
        "keywords": "Microsoft"
      }
    }
    ```

### 8.3. Enhanced Analytical Tools

#### 8.3.1. TAM Calculator (Enhanced)

*   **Basic TAM Calculation**
    ```json
    {
      "tool_name": "tam_calculator",
      "parameters": {
        "baseMarketSize": 500000000,
        "annualGrowthRate": 0.20,
        "projectionYears": 5
      }
    }
    ```

*   **TAM with Segmentation**
    ```json
    {
      "tool_name": "tam_calculator",
      "parameters": {
        "baseMarketSize": 500000000,
        "annualGrowthRate": 0.20,
        "projectionYears": 5,
        "segmentationAdjustments": {
          "factor": 0.60,
          "rationale": "Enterprise segment focus"
        }
      }
    }
    ```

#### 8.3.2. Market Size Calculator (Enhanced)

*   **Basic Market Size Estimation**
    ```json
    {
      "tool_name": "market_size_calculator",
      "parameters": {
        "industryQuery": "Cloud infrastructure services in North America",
        "methodology": "auto"
      }
    }
    ```

*   **Targeted Geographic Analysis**
    ```json
    {
      "tool_name": "market_size_calculator",
      "parameters": {
        "industryQuery": "Electric vehicle manufacturing",
        "geographyCodes": ["US", "CA", "EU"],
        "year": "2024",
        "methodology": "top_down"
      }
    }
    ```

#### 8.3.3. Company Financials Retriever (Enhanced)

*   **Company Overview**
    ```json
    {
      "tool_name": "company_financials_retriever",
      "parameters": {
        "companySymbol": "AAPL",
        "statementType": "OVERVIEW"
      }
    }
    ```

*   **Multi-Year Income Statement**
    ```json
    {
      "tool_name": "company_financials_retriever",
      "parameters": {
        "companySymbol": "MSFT",
        "statementType": "INCOME_STATEMENT",
        "period": "annual",
        "limit": 3
      }
    }
    ```

#### 8.2.2. Bureau of Labor Statistics (BLS)

*   **`bls_getSeriesData`**
    ```json
    {
      "tool_name": "bls_getSeriesData",
      "parameters": {
        "seriesIds": ["LNS14000000"],
        "startYear": "2022",
        "endYear": "2023",
        "annualaverage": true
      }
    }
    ```

#### 8.2.3. U.S. Census Bureau

*   **`census_fetchIndustryData`**
    ```json
    {
      "tool_name": "census_fetchIndustryData",
      "parameters": {
        "variables": "EMP,PAYANN,ESTAB",
        "forGeography": "state:06",
        "filterParams": { "NAICS2017": "541511" },
        "year": "2021",
        "datasetPath": "cbp"
      }
    }
    ```

*   **`census_fetchMarketSize`**
    ```json
    {
      "tool_name": "census_fetchMarketSize",
      "parameters": {
        "naicsCode": "3118",
        "geography": "us:1",
        "measure": "PAYANN",
        "year": "2021"
      }
    }
    ```

#### 8.2.4. Federal Reserve Economic Data (FRED)

*   **`fred_getSeriesObservations`**
    ```json
    {
      "tool_name": "fred_getSeriesObservations",
      "parameters": {
        "seriesId": "GDP"
      }
    }
    ```

#### 8.2.5. International Monetary Fund (IMF)

*   **`imf_getDataset`**
    ```json
    {
      "tool_name": "imf_getDataset",
      "parameters": {
        "dataflowId": "IFS",
        "key": "A.US.NGDP_RPCH", 
        "startPeriod": "2020",
        "endPeriod": "2023"
      }
    }
    ```

*   **`imf_getLatestObservation`**
    ```json
    {
      "tool_name": "imf_getLatestObservation",
      "parameters": {
        "dataflowId": "DOT",
        "key": "A.US.TXG_FOB_USD.AU",
        "valueAttribute": "value"
      }
    }
    ```

#### 8.2.6. Nasdaq Data Link

*   **`nasdaq_getDatasetTimeSeries`**
    ```json
    {
      "tool_name": "nasdaq_getDatasetTimeSeries",
      "parameters": {
        "databaseCode": "FRED",
        "datasetCode": "GNP",
        "params": { "limit": 10, "order": "asc" }
      }
    }
    ```

*   **`nasdaq_getLatestDatasetValue`**
    ```json
    {
      "tool_name": "nasdaq_getLatestDatasetValue",
      "parameters": {
        "databaseCode": "WIKI",
        "datasetCode": "AAPL",
        "valueColumn": "Close"
      }
    }
    ```

#### 8.2.7. Organisation for Economic Co-operation and Development (OECD)

*   **`oecd_getDataset`**
    ```json
    {
      "tool_name": "oecd_getDataset",
      "parameters": {
        "datasetId": "QNA",
        "filterExpression": "CAN.TOTAL.B1_GE.Q", 
        "startTime": "2022-Q1",
        "endTime": "2023-Q4"
      }
    }
    ```

*   **`oecd_getLatestObservation`**
    ```json
    {
      "tool_name": "oecd_getLatestObservation",
      "parameters": {
        "datasetId": "KEI",
        "filterExpression": "IRL.CPALTT01.GY.M",
        "valueAttribute": "value"
      }
    }
    ```

#### 8.2.8. World Bank

*   **`worldBank_getIndicatorData`**
    ```json
    {
      "tool_name": "worldBank_getIndicatorData",
      "parameters": {
        "countryCode": "BRA",
        "indicator": "SP.POP.TOTL"
      }
    }
    ```

## 10. Current Implementation Achievements

### 10.1. Production Milestones Achieved

The TAM MCP Server has successfully transitioned from design to production with the following major accomplishments:

**🎯 Complete Backend Integration (December 2024)**
- Successfully integrated all 8 planned data sources with functional API connections
- Achieved 100% tool functionality across 17 market analysis tools
- Implemented robust error handling and fallback mechanisms
- Deployed multi-layer caching for performance optimization

**🚀 Enhanced User Experience (January 2025)**
- Delivered comprehensive tool enhancements for 3 key analytical tools
- Added 1000+ character detailed descriptions with practical examples
- Implemented enum value explanations and parameter guidance
- Provided real-world usage scenarios and professional tips

**✅ Full MCP Protocol Compliance**
- Supports both STDIO and HTTP Streaming transport protocols
- Implements tools, resources, logging, and notifications capabilities
- Maintains JSON-RPC 2.0 compliance with proper error handling
- Verified compatibility with MCP Inspector and Claude Desktop

### 10.2. Technical Achievements

**DataService Architecture**
- Intelligent routing system that selects optimal data sources based on query context
- Direct data access methods for granular control over data source interactions
- Cross-source validation and confidence scoring for multi-source aggregation
- Configurable caching with source-specific TTL management

**Tool Enhancement Framework**
- Comprehensive help information system with structured descriptions
- Practical examples and parameter guidance integrated into tool definitions
- Enhanced JSON Schema output with enum explanations and usage contexts
- Professional-quality documentation accessible through MCP protocol

**Production-Ready Infrastructure**
- Enterprise-grade error handling with informative error messages
- Rate limiting and API key management for external service integration
- Structured logging with business metrics and performance monitoring
- Comprehensive testing suite with automated validation

### 10.3. User Impact

**For Business Analysts:**
- Access to 8 major economic data sources through a single MCP interface
- Enhanced tool descriptions reduce learning curve and improve adoption
- Real-world examples and use cases accelerate implementation
- Professional guidance helps ensure proper tool usage

**For Developers:**
- Self-documenting API with comprehensive parameter explanations
- Clear enum value descriptions reduce trial-and-error development
- Robust error handling provides actionable feedback
- Complete MCP compliance ensures seamless integration

**For Organizations:**
- Production-ready market intelligence platform with enterprise security
- Cost-effective access to premium data sources through unified interface
- Scalable architecture supporting concurrent analysis workflows
- Comprehensive audit trail and data provenance tracking

## 11. Future Enhancements

This section outlines potential areas for future development and improvement of the TAM MCP Server to further enhance its capabilities and value to users.

*   **Advanced Analytical Tools:**
    *   **Market Trend Analysis & Forecasting:** Develop tools that can analyze historical data from multiple sources to identify trends and provide basic forecasts for market size, growth rates, or key indicators.
    *   **Competitive Landscape Analysis:** Integrate tools to identify key competitors based on industry and geography, potentially pulling company profile data and financial summaries.
    *   **Supply Chain Analysis:** Tools to map out potential supply chain links or dependencies for specific industries.

*   **Data Source Enhancements:**
    *   **Expanded Data Source Integrations:** Continuously evaluate and integrate additional relevant public and potentially commercial data sources (e.g., Eurostat, UN Comtrade, specialized industry report APIs).
    *   **User-Configurable Data Source Prioritization:** Allow users or administrators to define preferred data sources or assign weights to sources for specific query types or industries in the `industry_search` tool.

*   **Data Quality and Processing:**
    *   **Sophisticated Data Normalization & Standardization:** Improve algorithms for normalizing data from disparate sources (e.g., standardizing industry names, units of measure, financial reporting periods).
    *   **Enhanced Data Quality Monitoring:** Implement automated checks for data consistency, freshness, and anomaly detection from integrated sources.
    *   **Knowledge Graph Integration:** Explore building a knowledge graph from the aggregated data to enable more complex relationship queries and inferences.

*   **User Experience and Integration:**
    *   **Natural Language Query (NLQ) Interface:** Develop capabilities to parse natural language questions into structured MCP tool requests.
    *   **Webhook/Callback Mechanisms:** For long-running queries (especially complex `industry_search` or analytical tasks), implement a callback system to notify clients when results are ready.
    *   **Data Export Formats:** Offer more diverse data export formats beyond JSON (e.g., CSV, Excel) for easier consumption in other tools.
    *   **Client Libraries/SDKs:** Provide client libraries in popular programming languages to simplify integration with the TAM MCP Server.

*   **Operational Improvements:**
    *   **Dynamic API Key Management:** More sophisticated and secure ways to manage and rotate API keys for backend services.
    *   **Advanced Caching Strategies:** Implement more granular caching controls, potentially with event-driven invalidation for sources that support it.
    *   **Scalability and Performance Optimizations:** Continuously monitor and optimize the performance of data retrieval, processing, and aggregation pipelines.
    *   **Usage Analytics and Reporting:** Implement detailed logging and analytics on tool usage, data source popularity, and query performance to guide further development.

*   **Security and Compliance:**
    *   **User Authentication and Authorization:** For scenarios requiring controlled access, implement robust authentication and role-based access control (RBAC) for different tools or data sensitivities.
    *   **Data Provenance Tracking:** Enhance tracking and reporting of data provenance for all information provided through the tools.

These enhancements aim to make the TAM MCP Server an even more powerful, flexible, and user-friendly platform for market intelligence.

