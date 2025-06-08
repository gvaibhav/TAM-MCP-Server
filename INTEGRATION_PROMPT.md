# TAM MCP Server - Free Data Sources Integration Prompt

## Project Context
You are working on the TAM (Total Addressable Market) MCP Server, a comprehensive Model Context Protocol service for market sizing analysis. The project is built with TypeScript, Express.js, and follows MCP 2024-11-05 specification.

### Current Status
- ✅ Core architecture implemented with DataService class using mock data
- ✅ All tests passing (188/231 tests) after fixing DataProvider → DataService refactoring
- ✅ 10 market analysis tools implemented: industry_search, industry_data, market_size, tam_calculator, sam_calculator, market_segments, market_forecasting, market_comparison, data_validation, market_opportunities
- ✅ MarketAnalysisTools class with static dataService property for tool implementations
- ✅ Comprehensive test suite with proper mocking strategies

### Project Structure
```
TAM-MCP-Server/
├── src/
│   ├── services/
│   │   └── dataService.ts          # Current implementation with mock data
│   ├── tools/
│   │   └── market-tools.ts         # MarketAnalysisTools class with 10 tools
│   ├── types/
│   │   └── index.ts               # Zod schemas and TypeScript types
│   └── utils/
│       └── index.js               # Helper functions
├── tests/
│   └── unit/                      # Comprehensive test suite
├── README.md                      # Current documentation
└── requirements.md                # Detailed specifications
```

## Current Implementation Details

### DataService Class (src/services/dataService.ts)
- Currently uses static mock data for 'tech-software' and 'tech-ai' industries
- Implements methods: searchIndustries, getIndustryById, getMarketSize, generateMarketForecast, getSupportedCurrencies, getMarketOpportunities
- Additional methods: calculateTam, calculateSam, compareMarkets, validateMarketData, forecastMarket, getMarketSegments

### MarketAnalysisTools Class (src/tools/market-tools.ts)
- Static class with `static dataService = new DataService()`
- 10 tools implemented as static methods
- Uses Zod schemas for input validation
- Returns APIResponse<T> format with proper error handling

### Current Data Sources (README.md mentions)
Premium sources requiring paid API keys:
- IBISWorld - Industry reports and analysis
- Statista - Market statistics and data
- Grand View Research - Market research reports
- Bloomberg - Financial and market data
- PitchBook - Private market data

## TASK: Integrate Free Data Sources

### 1. Free Data Sources to Integrate
Replace mock data with real data from these FREE APIs:

#### Government & International (Primary Sources)
- **Bureau of Labor Statistics (BLS)** - Employment and economic data
  - API: https://www.bls.gov/developers/api_signature_v2.shtml
  - Use for: Industry employment, wage data, productivity metrics
- **Census Bureau** - Demographic and economic census data
  - API: https://www.census.gov/data/developers/data-sets.html
  - Use for: Population data, business statistics, geographic data
- **Federal Reserve Economic Data (FRED)** - Economic indicators
  - API: https://fred.stlouisfed.org/docs/api/fred/
  - Use for: GDP, inflation, economic indicators by industry
- **World Bank** - Global economic and development data
  - API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
  - Use for: Global market sizes, country economic data
- **OECD** - International economic statistics
  - API: https://data.oecd.org/api/
  - Use for: International industry comparisons, economic indicators
- **IMF** - International monetary data
  - API: https://datahelp.imf.org/knowledgebase/articles/667681
  - Use for: Global economic data, currency information

#### Financial Data (Free Tiers)
- **Alpha Vantage** - Financial and market data (500 calls/day free)
  - API: https://www.alphavantage.co/documentation/
  - Use for: Stock market data, company financials
- **Quandl (Nasdaq Data Link)** - Economic and financial datasets
  - API: https://docs.data.nasdaq.com/
  - Use for: Economic indicators, commodity prices

### 2. Implementation Requirements

#### A. Update DataService (src/services/dataService.ts)
- Create separate service classes for each data source
- Implement data fetching, transformation, and caching
- Add persistence layer (SQLite/JSON files) for caching
- Maintain existing method signatures for backward compatibility
- Add new methods for specific data source capabilities

#### B. Update README.md
- Document the free data sources integration
- Add API key setup instructions for free sources
- Explain data caching and persistence strategy
- Note future paid source integration plans
- Include rate limiting information

#### C. Create Data Persistence Layer
- Local SQLite database or JSON files for caching
- Data freshness tracking and automatic refresh
- Configurable cache TTL per data source
- Data validation and quality checks

#### D. Expose as MCP Resources and Tools
- Add new MCP resources for data source metadata
- Extend existing tools with real data capabilities
- Add new tools specific to data source features
- Maintain MCP protocol compliance

#### E. Comprehensive Testing
- Unit tests for each data source integration
- Integration tests for API calls (with mocking)
- Test cache functionality and data persistence
- Test error handling and fallback mechanisms
- Performance tests for data fetching

### 3. Technical Specifications

#### Environment Variables (.env)
```bash
# Free Data Source API Keys
BLS_API_KEY=your_bls_api_key
CENSUS_API_KEY=your_census_api_key
FRED_API_KEY=your_fred_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
NASDAQ_DATA_LINK_API_KEY=your_quandl_key
# Note: World Bank, OECD, IMF don't require API keys
```

#### Data Source Service Pattern
Each data source should implement:
```typescript
interface DataSourceService {
  fetchIndustryData(industryId: string): Promise<any>;
  fetchMarketSize(industryId: string, region: string): Promise<any>;
  isAvailable(): Promise<boolean>;
  getDataFreshness(): Date;
  getCacheStatus(): CacheStatus;
}
```

#### Cache Strategy
- Primary cache: In-memory with configurable TTL
- Secondary cache: Local persistence (SQLite/JSON)
- Cache invalidation: Time-based and manual refresh
- Fallback: Mock data if all sources fail

### 4. File Structure Changes Needed
```
src/
├── services/
│   ├── dataService.ts              # Updated orchestrator
│   ├── cache/
│   │   ├── cacheService.ts         # Enhanced caching
│   │   └── persistenceService.ts   # Local data persistence
│   └── dataSources/
│       ├── blsService.ts           # Bureau of Labor Statistics
│       ├── censusService.ts        # Census Bureau
│       ├── fredService.ts          # Federal Reserve
│       ├── worldBankService.ts     # World Bank
│       ├── oecdService.ts          # OECD
│       ├── imfService.ts           # IMF
│       ├── alphaVantageService.ts  # Alpha Vantage
│       └── nasdaqDataService.ts    # Nasdaq Data Link (Quandl)
├── types/
│   ├── dataSources.ts              # Data source interfaces
│   └── cache.ts                    # Cache-related types
└── utils/
    ├── dataTransform.ts            # Data transformation utilities
    └── rateLimit.ts                # Rate limiting utilities
```

### 5. Key Constraints & Requirements

#### Maintain Backward Compatibility
- All existing method signatures must remain unchanged
- Existing tests should continue to pass
- MarketAnalysisTools.dataService property must work as before

#### Rate Limiting & API Usage
- Respect free tier limits for each service
- Implement exponential backoff for API failures
- Cache aggressively to minimize API calls
- Provide usage statistics and monitoring

#### Data Quality & Validation
- Cross-validate data from multiple sources when possible
- Implement data quality scoring
- Handle missing or incomplete data gracefully
- Provide confidence intervals and source attribution

#### Error Handling
- Graceful degradation when APIs are unavailable
- Fallback to cached data or mock data
- Proper error logging and monitoring
- User-friendly error messages

### 6. Testing Strategy
- **Unit Tests**: Each data source service, cache layer, data transformation
- **Integration Tests**: End-to-end data fetching and caching
- **Mock Tests**: Simulate API failures and rate limiting
- **Performance Tests**: Cache performance and API response times
- **Data Quality Tests**: Validate data consistency and accuracy

### 7. Success Criteria
- All 10 existing market analysis tools work with real data
- Data is cached efficiently with configurable refresh rates
- API rate limits are respected with proper monitoring
- Tests maintain >95% coverage
- README updated with clear setup instructions
- MCP resources expose data source metadata
- Performance remains under 2 seconds for cached data

## Current Working Code References

### MarketAnalysisTools Structure
```typescript
export class MarketAnalysisTools {
  static dataService = new DataService();
  static getToolDefinitions(): Tool[] { /* 10 tools */ }
  static async industrySearch(params): Promise<APIResponse<any>> { /* implementation */ }
  // ... 9 more tool methods
}
```

### Existing Test Pattern
Tests use `vi.spyOn(MarketAnalysisTools.dataService, 'methodName')` for mocking.

### Current Mock Data
- 'tech-software': $659B market (2023), $754B (2024)
- 'tech-ai': $328B market (2023), $422B (2024)
- Segments: Enterprise (45%), SMB (35%), Consumer (20%)

---

**EXECUTE THIS INTEGRATION with focus on maintaining backward compatibility while adding robust real data capabilities through free APIs.**
