# Market Sizing MCP: Software Requirements

## Project Overview

The Market Sizing Model Context Protocol (MCP) service provides AI models with access to market data for calculating Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and retrieving industry size estimates. This service follows the Model Context Protocol specifications to enable seamless integration with language models.

**Version**: 1.0  
**Last Updated**: 2024  
**Target Audience**: AI Models, Business Analysts, Market Researchers

## Goals and Objectives

- Provide accurate and up-to-date market sizing data across industries
- Enable TAM/SAM calculations with configurable parameters
- Support industry research and market segmentation analysis
- Deliver data through a standardized MCP interface
- Ensure data quality, reliability, and proper sourcing

## Functional Requirements

### Industry Data
- Search for industries by name, NAICS, or SIC codes
- Retrieve industry profiles with descriptions and related industries
- List key players in specific industries
- Support fuzzy matching for industry names and descriptions
- Provide industry hierarchies and parent-child relationships
- Include industry trends and growth indicators
- **ENHANCED**: Support multi-language industry names and descriptions
- **ENHANCED**: Provide real-time industry news and regulatory updates
- **ENHANCED**: Include ESG (Environmental, Social, Governance) scoring

### Market Size Estimation
- Retrieve current and historical market size data for industries
- Support filtering by region, year, and industry segment
- Include growth rates and forecast data when available
- Provide confidence scores for market estimates
- Support multiple currency conversions with real-time exchange rates
- Provide compound annual growth rate (CAGR) calculations
- Include market volatility indicators and risk assessments
- **ENHANCED**: Support purchasing power parity (PPP) adjustments
- **ENHANCED**: Provide seasonal adjustment factors
- **ENHANCED**: Include inflation-adjusted historical data

### TAM Calculation
- Calculate total addressable market based on industry, segments, and region
- Support multiple calculation methodologies (top-down, bottom-up)
- Include data sources and confidence scores with results
- Support scenario analysis with optimistic/pessimistic projections
- Provide methodology transparency with calculation breakdowns
- Include addressable population and penetration rate analysis
- **ENHANCED**: Monte Carlo simulation for uncertainty quantification
- **ENHANCED**: Sensitivity analysis for key variables
- **ENHANCED**: Cross-validation with multiple methodologies

### SAM Calculation
- Calculate serviceable addressable market by applying constraints to TAM
- Filter by target segments, regions, and custom constraints
- Provide detailed breakdown of included market segments
- Support competitive landscape filtering
- Include regulatory and barrier-to-entry considerations
- Provide SOM (Serviceable Obtainable Market) estimates
- **ENHANCED**: Dynamic constraint modeling with business rules engine
- **ENHANCED**: Competitive moat analysis and market share projections
- **ENHANCED**: Time-to-market impact assessment

### Data Sources
- Integrate with multiple data sources (public reports, government data, industry associations)
- Track data provenance and last-updated timestamps
- Support source credibility ranking
- Implement data quality scoring based on source reliability
- Support data triangulation from multiple sources
- Include citation formatting for academic and business use
- **ENHANCED**: Automated source validation and cross-referencing
- **ENHANCED**: Real-time data freshness monitoring
- **ENHANCED**: Source bias detection and adjustment algorithms

## Technical Requirements

### API Design
- Implement MCP tools interface for all market sizing functions
- Use JSON for data interchange
- Support proper error handling and status codes
- Follow OpenAPI 3.0 specification for documentation
- Implement request/response logging for debugging
- Support batch processing for multiple industry queries
- **ENHANCED**: GraphQL interface for flexible data querying
- **ENHANCED**: WebSocket support for real-time updates
- **ENHANCED**: API versioning strategy with backward compatibility

### Performance
- Response time under 2 seconds for most queries
- Support for concurrent requests
- Implement caching for frequently accessed data
- 99.9% uptime SLA requirement
- Support for 100 concurrent users
- Implement cache invalidation strategies with TTL
- Database query optimization with indexing
- **ENHANCED**: Auto-scaling based on demand patterns
- **ENHANCED**: CDN integration for global performance
- **ENHANCED**: Database sharding for large datasets

### Data Quality
- Validate all input and output data using Zod schemas
- Implement data freshness indicators
- Support data versioning and change tracking
- Automated data validation pipelines
- Data anomaly detection and alerting
- A/B testing framework for data source reliability
- **ENHANCED**: Machine learning models for data quality scoring
- **ENHANCED**: Automated outlier detection and flagging
- **ENHANCED**: Data lineage tracking and impact analysis

### Security
- API authentication for access control
- Rate limiting to prevent abuse
- Input sanitization and validation
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Audit logging for all data access
- HTTPS/TLS 1.3 encryption for all communications
- **ENHANCED**: OAuth 2.0/OIDC integration
- **ENHANCED**: API key management with rotation
- **ENHANCED**: Zero-trust security architecture

## MCP Tools

The service will expose the following MCP tools:

1. `industry_search`: Search for industries matching a query
   - **Parameters**: `{ query: string, limit?: number, filters?: { naics?: string[], sic?: string[] }, fuzzy_match?: boolean, language?: string }`
   - **Returns**: `IndustrySearchResult[]` with relevance scores and metadata
   - **Acceptance Criteria**: Returns results within 500ms, supports typo tolerance

2. `get_industry_data`: Get detailed information about a specific industry
   - **Parameters**: `{ industry_id: string, include_trends?: boolean, include_players?: boolean, include_esg?: boolean }`
   - **Returns**: `IndustryData` with comprehensive profile and optional enrichments
   - **Acceptance Criteria**: Complete data coverage for Fortune 500 industries

3. `get_market_size`: Retrieve market size data for an industry
   - **Parameters**: `{ industry: string, year_range?: [number, number], regions?: string[], currency?: string, segments?: string[], adjust_inflation?: boolean }`
   - **Returns**: `MarketSizeResult` with historical trends and growth rates
   - **Acceptance Criteria**: Data available for at least 5 years of history

4. `calculate_tam`: Calculate total addressable market 
   - **Parameters**: `TamCalculationInput` with methodology preferences and scenarios
   - **Returns**: `TamResult` with confidence intervals, methodology breakdown, and sensitivity analysis
   - **Acceptance Criteria**: Multiple validation methods with <15% variance

5. `calculate_sam`: Calculate serviceable addressable market
   - **Parameters**: `SamCalculationInput` with constraints, competitive filters, and business rules
   - **Returns**: `SamResult` with segment breakdown, assumptions, and competitive analysis
   - **Acceptance Criteria**: Incorporates real-time competitive intelligence

6. `get_market_segments`: Get segment breakdown for an industry
   - **Parameters**: `{ industry: string, segmentation_type: string, depth_level?: number, include_trends?: boolean }`
   - **Returns**: `MarketSegmentHierarchy` with size data and growth projections
   - **Acceptance Criteria**: Supports up to 4 levels of segmentation depth

7. `forecast_market`: Generate market forecasts using trend analysis
   - **Parameters**: `{ industry: string, forecast_years: number, scenario_type?: 'conservative' | 'optimistic' | 'pessimistic', confidence_level?: number }`
   - **Returns**: `MarketForecast` with confidence intervals and scenario analysis
   - **Acceptance Criteria**: Accuracy within ±20% for 3-year forecasts

8. `compare_markets`: Compare multiple industries or segments
   - **Parameters**: `{ industries: string[], comparison_metrics: string[], time_period: [number, number], normalize?: boolean }`
   - **Returns**: `MarketComparison` with rankings, correlations, and insights
   - **Acceptance Criteria**: Supports comparison of up to 10 markets simultaneously

9. **NEW**: `validate_market_data`: Validate and cross-check market size estimates
   - **Parameters**: `{ market_size: number, industry: string, year: number, sources?: string[] }`
   - **Returns**: `ValidationResult` with confidence score and alternative estimates

10. **NEW**: `get_market_opportunities`: Identify emerging market opportunities
    - **Parameters**: `{ industries?: string[], growth_threshold?: number, time_horizon?: number }`
    - **Returns**: `OpportunityAnalysis` with ranked opportunities and risk factors

## Data Models

### Core Entities
- **MarketSizeData**: Market size with metadata, confidence scores, and sourcing
- **IndustryData**: Industry profiles with classifications, trends, and ESG data
- **MarketSegment**: Segment definitions with hierarchies and cross-references
- **DataSource**: Source metadata with credibility scores and validation status
- **CalculationResult**: Results with methodology, assumptions, and sensitivity analysis
- **ValidationScore**: Data quality metrics with freshness and reliability indicators

### Enhanced Relationships
- Industries have multiple segments with weighted contributions
- Market data includes temporal relationships and trend patterns
- Sources provide quality-weighted data points with uncertainty bounds
- Calculations maintain audit trails with version control
- **NEW**: User preferences and calculation histories
- **NEW**: Real-time data subscriptions and alerts

## Data Sources

### Primary Sources (Tier 1)
- **Government**: Bureau of Labor Statistics, Census Bureau, Federal Reserve Economic Data
- **International**: World Bank, IMF, OECD databases
- **Regulatory**: SEC filings, FTC reports, industry-specific regulators

### Secondary Sources (Tier 2)
- **Research Firms**: McKinsey Global Institute, BCG, Bain reports
- **Market Research**: IBISWorld, Euromonitor, Frost & Sullivan
- **Financial Data**: Bloomberg, Reuters, S&P Capital IQ

### Tertiary Sources (Tier 3)
- **Industry Associations**: Trade publications and member surveys
- **Academic**: University research centers and peer-reviewed studies
- **Consulting**: Big Four consulting firm industry reports

### Data Quality Framework
- **Freshness**: Data age with automatic expiration
- **Accuracy**: Cross-validation scores and error bounds
- **Completeness**: Coverage metrics and data gaps identification
- **Consistency**: Inter-source agreement and conflict resolution

## Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
- Core MCP server setup with basic tools
- Data model implementation and validation
- Primary data source integrations

### Phase 2: Enhancement (Months 3-4)
- Advanced calculation algorithms
- Caching and performance optimization
- Secondary data source integrations

### Phase 3: Intelligence (Months 5-6)
- Machine learning for data quality
- Forecasting and scenario analysis
- Real-time monitoring and alerting

### Phase 4: Scale (Months 7-8)
- Production deployment and monitoring
- Advanced security and compliance
- Performance tuning and optimization

## Success Metrics

- **Accuracy**: Market size estimates within ±15% of validated benchmarks
- **Performance**: 95th percentile response time under 2 seconds
- **Reliability**: 99.9% uptime with automated failover
- **Coverage**: Data available for 90% of Fortune 1000 industry segments
- **User Satisfaction**: >4.5/5 rating from business analysts

## Risk Mitigation

- **Data Quality**: Multiple source validation and anomaly detection
- **Performance**: Auto-scaling and circuit breaker patterns
- **Security**: Regular penetration testing and compliance audits
- **Vendor Risk**: Diverse data source portfolio and fallback mechanisms
- **Regulatory**: Proactive compliance monitoring and legal review

## Compliance and Ethics

- Data privacy compliance (GDPR, CCPA where applicable)
- Transparent data sourcing and attribution
- Bias detection and mitigation in data sources
- Regular audits of data quality and methodology
- **ENHANCED**: AI ethics framework for algorithmic decisions
- **ENHANCED**: Open source components for transparency
- **ENHANCED**: Regular third-party security assessments

## MCP Server Requirements

This section defines the Model Context Protocol (MCP) server implementation requirements following the MCP specification (https://modelcontextprotocol.io/).

### MCP Protocol Version
- **Target MCP Version**: 2024-11-05
- **Protocol Transport**: HTTP Streamable (Server-Sent Events)
- **Message Format**: JSON-RPC 2.0
- **Encoding**: UTF-8
- **Base URL**: `http://localhost:3000` (configurable)

### HTTP Streamable Protocol Requirements

The Market Sizing MCP server must implement HTTP Streamable transport using Server-Sent Events (SSE):

#### HTTP Endpoints
- **POST /mcp/session**: Initialize new MCP session
- **GET /mcp/discovery**: Expose server capabilities and tool definitions
- **POST /mcp/tools/{tool_name}**: Execute specific MCP tools
- **GET /mcp/health**: Health check endpoint
- **GET /mcp/metrics**: Prometheus-compatible metrics endpoint

#### Server-Sent Events Stream
- **Endpoint**: `GET /mcp/events`
- **Content-Type**: `text/event-stream`
- **Connection**: Keep-alive with heartbeat every 30 seconds
- **Events**: Tool execution updates, data refresh notifications, error alerts

#### HTTP Headers
- **Required Request Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json, text/event-stream`
  - `X-MCP-Version: 2024-11-05`
- **Required Response Headers**:
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
  - `Access-Control-Allow-Origin: *` (configurable)

### MCP Discovery Endpoint

#### /mcp/discovery Endpoint Specification

**Method**: GET  
**Path**: `/mcp/discovery`  
**Description**: Expose server capabilities, available tools, and metadata for client discovery

**Response Format**:
```json
{
  "serverInfo": {
    "name": "market-sizing-mcp",
    "version": "1.0.0",
    "description": "Market Sizing MCP Server for TAM/SAM calculations and industry analysis",
    "author": "TAM-MCP-Server Team",
    "license": "MIT",
    "repository": "https://github.com/tam-mcp-server/market-sizing-mcp",
    "documentation": "https://github.com/tam-mcp-server/market-sizing-mcp/blob/main/README.md"
  },
  "capabilities": {
    "tools": {
      "listChanged": false,
      "count": 10
    },
    "resources": {
      "listChanged": false,
      "count": 0
    },
    "logging": {
      "level": "info"
    },
    "prompts": {
      "listChanged": false,
      "count": 0
    }
  },
  "tools": [
    {
      "name": "industry_search",
      "description": "Search for industries by name, NAICS code, SIC code, or keywords with fuzzy matching support",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200,
            "description": "Search query for industry name or code"
          },
          "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 50,
            "default": 10,
            "description": "Maximum number of results to return"
          }
        },
        "required": ["query"]
      }
    }
  ],
  "transport": {
    "type": "http-streamable",
    "baseUrl": "http://localhost:3000",
    "endpoints": {
      "session": "/mcp/session",
      "tools": "/mcp/tools/{tool_name}",
      "events": "/mcp/events",
      "health": "/mcp/health",
      "metrics": "/mcp/metrics"
    }
  },
  "rateLimits": {
    "requestsPerMinute": 100,
    "concurrentRequests": 50,
    "maxPayloadSize": "1MB"
  },
  "dataCompliance": {
    "gdprCompliant": true,
    "ccpaCompliant": true,
    "dataRetention": "No persistent storage",
    "privacyPolicy": "https://github.com/tam-mcp-server/market-sizing-mcp/blob/main/PRIVACY.md"
  }
}
```

#### Discovery Endpoint Requirements
- **Response Time**: <100ms for discovery requests
- **Caching**: Cache-Control header with 5-minute TTL
- **Compression**: Support gzip compression for large tool schemas
- **CORS**: Configurable CORS headers for cross-origin requests
- **Versioning**: Include API version in response headers

### Server Capabilities

The Market Sizing MCP server must implement the following MCP capabilities:

#### Required Capabilities
- **tools**: Support for tool discovery and execution via HTTP endpoints
- **resources**: Support for resource discovery and reading (optional for this implementation)
- **logging**: Server-side logging with structured data and SSE event streaming

#### Optional Capabilities (Future Enhancement)
- **prompts**: Template prompts for common market sizing scenarios
- **notifications**: Real-time updates for market data changes via SSE

### Performance Requirements

#### Response Time SLAs
- **Simple queries** (industry_search, get_market_segments): <500ms
- **Data retrieval** (get_industry_data, get_market_size): <1000ms  
- **Calculations** (calculate_tam, calculate_sam): <2000ms
- **Complex analysis** (forecast_market, compare_markets): <3000ms

#### Concurrent Request Handling
- Support for **50 concurrent tool executions**
- Request queuing with priority-based scheduling
- Circuit breaker pattern for external data sources
- Graceful degradation under high load

### Security and Authentication

#### MCP Transport Security
- No authentication required at MCP protocol level (handled by client)
- Input validation and sanitization for all tool parameters
- Rate limiting: 100 requests per minute per client session
- Request size limits: 1MB maximum payload

#### HTTP Transport Security

#### TLS/SSL Requirements
- **Development**: HTTP allowed for localhost only
- **Production**: HTTPS/TLS 1.3 required
- **Certificate**: Valid SSL certificate with proper domain validation
- **HSTS**: HTTP Strict Transport Security headers

#### API Security
- **API Keys**: Optional API key authentication via `X-API-Key` header
- **Rate Limiting**: Token bucket algorithm with burst capacity
- **Request Validation**: JSON schema validation for all payloads
- **CORS Policy**: Configurable allowed origins and methods

### Session Management

#### HTTP Session Handling
- **Session ID**: UUID-based session identification
- **Session Storage**: In-memory session store with configurable TTL
- **Session Events**: SSE notifications for session state changes
- **Cleanup**: Automatic session cleanup after 1 hour of inactivity

### Monitoring and Observability

#### Health Checks
- **Endpoint**: `GET /mcp/health`
- **Response**: JSON with service status, dependencies, and version
- **Monitoring**: Integration with monitoring tools (Prometheus, Grafana)

#### Metrics Collection
- **Endpoint**: `GET /mcp/metrics`
- **Format**: Prometheus exposition format
- **Metrics**: Request count, response time, error rates, cache hit ratios

## Project Metadata and Documentation Requirements

### Required Metadata Files

The project must include comprehensive metadata files for proper documentation and project management:

#### Core Documentation Files

1. **README.md** - Primary project documentation
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/README.md`
   - **Content Requirements**:
     - Project overview and value proposition
     - Installation and setup instructions
     - Quick start guide with examples
     - API documentation links
     - Configuration options
     - Troubleshooting guide
     - Contributing guidelines link
     - License information
   - **Format**: Markdown with badges, code examples, and diagrams
   - **Maintenance**: Update with each release

2. **CONTRIBUTING.md** - Contribution guidelines
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/CONTRIBUTING.md`
   - **Content Requirements**:
     - Code of conduct
     - Development setup instructions
     - Coding standards and style guide
     - Testing requirements
     - Pull request process
     - Issue reporting guidelines
     - Security vulnerability reporting
   - **Format**: Markdown with step-by-step instructions
   - **Maintenance**: Review quarterly

3. **CHANGELOG.md** - Version history and release notes
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/CHANGELOG.md`
   - **Content Requirements**:
     - Semantic versioning (MAJOR.MINOR.PATCH)
     - Release dates and version numbers
     - Added, changed, deprecated, removed, fixed, security sections
     - Breaking changes highlighted
     - Migration guides for major versions
   - **Format**: Keep a Changelog format
   - **Maintenance**: Update with each release

4. **LICENSE** - Software license
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/LICENSE`
   - **Content Requirements**:
     - Full license text (MIT recommended)
     - Copyright notice
     - Year and copyright holder
   - **Format**: Plain text
   - **Maintenance**: Update copyright year annually

#### Additional Documentation Files

5. **SECURITY.md** - Security policy and reporting
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/SECURITY.md`
   - **Content Requirements**:
     - Supported versions for security updates
     - Vulnerability reporting process
     - Security contact information
     - Response timeline expectations
   - **Format**: Markdown
   - **Maintenance**: Review annually

6. **CODE_OF_CONDUCT.md** - Community guidelines
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/CODE_OF_CONDUCT.md`
   - **Content Requirements**:
     - Expected behavior standards
     - Unacceptable behavior examples
     - Enforcement procedures
     - Contact information for reports
   - **Format**: Contributor Covenant standard
   - **Maintenance**: Review annually

7. **API.md** - Comprehensive API documentation
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/docs/API.md`
   - **Content Requirements**:
     - All MCP tools with examples
     - Request/response schemas
     - Error codes and handling
     - Rate limiting information
     - Authentication details
   - **Format**: Markdown with OpenAPI references
   - **Maintenance**: Update with API changes

8. **DEPLOYMENT.md** - Production deployment guide
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/docs/DEPLOYMENT.md`
   - **Content Requirements**:
     - System requirements
     - Environment configuration
     - Docker deployment instructions
     - Monitoring setup
     - Backup and recovery procedures
   - **Format**: Markdown with configuration examples
   - **Maintenance**: Update with infrastructure changes

#### Project Configuration Files

9. **package.json** - Node.js project configuration
   - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/package.json`
   - **Content Requirements**:
     - Project metadata (name, version, description)
     - Dependencies and devDependencies
     - Scripts for development and production
     - Repository and author information
     - Keywords for discoverability

10. **.gitignore** - Git ignore patterns
    - **Location**: `/home/gvaibhav/Documents/TAM-MCP-Server/.gitignore`
    - **Content Requirements**:
      - Node.js specific patterns
      - Environment files
      - Build artifacts
      - IDE configuration files
      - Log files and temporary data

### Documentation Standards

#### Content Quality Requirements
- **Clarity**: Clear, concise language accessible to technical and non-technical audiences
- **Completeness**: Comprehensive coverage of all features and use cases
- **Accuracy**: Regular validation against current implementation
- **Examples**: Practical code examples and usage scenarios
- **Formatting**: Consistent markdown formatting with proper headers and links

#### Maintenance Schedule
- **Major Updates**: With each version release
- **Minor Updates**: Monthly review for accuracy
- **Link Validation**: Quarterly automated link checking
- **User Feedback**: Continuous improvement based on user reports

#### Automation Requirements
- **Auto-generation**: API documentation from code comments
- **Link Checking**: Automated dead link detection
- **Spell Check**: Automated spell checking in CI/CD
- **Format Validation**: Markdown linting in pre-commit hooks

### Tools Implementation

The server must expose exactly **10 tools** as defined below:

#### Core Market Tools (6 tools)

1. **industry_search**
   - **Name**: `industry_search`
   - **Description**: "Search for industries by name, NAICS code, SIC code, or keywords with fuzzy matching support"
   
   **Input Schema**:
   ```typescript
   const IndustrySearchInputSchema = z.object({
     query: z.string().min(1).max(200),
     limit: z.number().int().min(1).max(50).default(10),
     filters: z.object({
       naics: z.array(z.string().regex(/^\d{2,6}$/)).optional(),
       sic: z.array(z.string().regex(/^\d{2,4}$/)).optional(),
       region: z.array(z.string()).optional()
     }).optional(),
     fuzzy_match: z.boolean().default(true),
     language: z.enum(['en', 'es', 'fr', 'de']).default('en')
   });
   ```
   
   **Output Schema**:
   ```typescript
   const IndustrySearchResultSchema = z.object({
     results: z.array(z.object({
       id: z.string(),
       name: z.string(),
       description: z.string(),
       naics_code: z.string().optional(),
       sic_code: z.string().optional(),
       relevance_score: z.number().min(0).max(1),
       market_size_usd_millions: z.number().optional(),
       growth_rate_percent: z.number().optional()
     })),
     total_count: z.number(),
     query_time_ms: z.number()
   });
   ```
   
   **Implementation Logic**:
   - **Data Sources**: NAICS database, SIC database, industry classification APIs
   - **Search Algorithm**: Elasticsearch with fuzzy matching, stemming, and synonym expansion
   - **Ranking**: TF-IDF scoring combined with market size weighting
   - **Caching**: 4-hour TTL for search results, 24-hour for industry metadata
   - **Transformation**: Normalize industry names, merge duplicate entries, calculate relevance scores

2. **get_industry_data**
   - **Name**: `get_industry_data`
   - **Description**: "Retrieve comprehensive industry profile including trends, key players, and ESG data"
   
   **Input Schema**:
   ```typescript
   const GetIndustryDataInputSchema = z.object({
     industry_id: z.string().min(1),
     include_trends: z.boolean().default(false),
     include_players: z.boolean().default(false),
     include_esg: z.boolean().default(false),
     year: z.number().int().min(2000).max(2030).optional()
   });
   ```
   
   **Output Schema**:
   ```typescript
   const IndustryDataSchema = z.object({
     id: z.string(),
     name: z.string(),
     description: z.string(),
     naics_code: z.string().optional(),
     sic_code: z.string().optional(),
     parent_industry: z.string().optional(),
     sub_industries: z.array(z.string()),
     key_metrics: z.object({
       market_size_usd: z.number(),
       employment: z.number().optional(),
       establishments: z.number().optional(),
       avg_wage: z.number().optional()
     }),
     trends: z.object({
       growth_rate_5yr: z.number(),
       volatility_index: z.number().min(0).max(1),
       seasonal_patterns: z.array(z.number())
     }).optional(),
     key_players: z.array(z.object({
       name: z.string(),
       market_share_percent: z.number(),
       revenue_usd: z.number().optional()
     })).optional(),
     esg_score: z.object({
       environmental: z.number().min(0).max(100),
       social: z.number().min(0).max(100),
       governance: z.number().min(0).max(100),
       overall: z.number().min(0).max(100)
     }).optional(),
     last_updated: z.date(),
     confidence_score: z.number().min(0).max(1)
   });
   ```
   
   **Implementation Logic**:
   - **Data Sources**: Bureau of Labor Statistics, IBISWorld API, company financial reports
   - **Aggregation**: Combine multiple data sources with weighted averaging
   - **Trend Calculation**: Time series analysis using ARIMA models
   - **ESG Integration**: Pull from ESG rating agencies (MSCI, Sustainalytics)
   - **Validation**: Cross-validate metrics against government statistics
   - **Caching**: 24-hour TTL with dependency-based invalidation

3. **get_market_size**
   - **Name**: `get_market_size`
   - **Description**: "Get historical and current market size data with growth rates and regional breakdowns"
   
   **Input Schema**:
   ```typescript
   const GetMarketSizeInputSchema = z.object({
     industry: z.string().min(1),
     year_range: z.tuple([z.number().int(), z.number().int()]).optional(),
     regions: z.array(z.enum(['US', 'EU', 'APAC', 'Global'])).default(['Global']),
     currency: z.enum(['USD', 'EUR', 'GBP', 'JPY']).default('USD'),
     segments: z.array(z.string()).optional(),
     adjust_inflation: z.boolean().default(true),
     confidence_level: z.number().min(0.5).max(0.99).default(0.95)
   });
   ```
   
   **Output Schema**:
   ```typescript
   const MarketSizeResultSchema = z.object({
     industry: z.string(),
     data_points: z.array(z.object({
       year: z.number(),
       market_size: z.number(),
       currency: z.string(),
       region: z.string(),
       growth_rate_yoy: z.number().optional(),
       confidence_interval: z.object({
         lower: z.number(),
         upper: z.number()
       }),
       segments: z.array(z.object({
         name: z.string(),
         size: z.number(),
         percentage: z.number()
       })).optional()
     })),
     cagr_5yr: z.number().optional(),
     volatility_metrics: z.object({
       standard_deviation: z.number(),
       coefficient_of_variation: z.number()
     }),
     data_sources: z.array(z.string()),
     methodology: z.string(),
     last_updated: z.date()
   });
   ```
   
   **Implementation Logic**:
   - **Data Sources**: Government statistics, market research reports, financial filings
   - **Currency Conversion**: Real-time exchange rates from financial APIs
   - **Inflation Adjustment**: Consumer Price Index data for historical normalization
   - **Regional Aggregation**: GDP-weighted market size calculations
   - **Confidence Intervals**: Bootstrap sampling and Monte Carlo simulation
   - **Validation**: Cross-check against multiple independent sources

4. **calculate_tam**
   - **Name**: `calculate_tam`
   - **Description**: "Calculate Total Addressable Market using multiple methodologies with scenario analysis"
   
   **Input Schema**:
   ```typescript
   const TamCalculationInputSchema = z.object({
     industry: z.string().min(1),
     year: z.number().int().min(2020).max(2030).default(new Date().getFullYear()),
     segments: z.array(MarketSegmentSchema).optional(),
     region: z.enum(['US', 'EU', 'APAC', 'Global']).default('Global'),
     methodology: z.enum(['top_down', 'bottom_up', 'hybrid']).default('hybrid'),
     scenarios: z.object({
       optimistic: z.boolean().default(true),
       conservative: z.boolean().default(true),
       pessimistic: z.boolean().default(false)
     }),
     assumptions: z.record(z.string(), z.unknown()).optional()
   });
   ```
   
   **Output Schema**:
   ```typescript
   const TamResultSchema = z.object({
     base_case: z.object({
       tam_usd: z.number(),
       methodology: z.string(),
       confidence_score: z.number().min(0).max(1)
     }),
     scenarios: z.object({
       optimistic: z.object({
         tam_usd: z.number(),
         upside_factors: z.array(z.string())
       }).optional(),
       conservative: z.object({
         tam_usd: z.number(),
         risk_factors: z.array(z.string())
       }).optional(),
       pessimistic: z.object({
         tam_usd: z.number(),
         downside_factors: z.array(z.string())
       }).optional()
     }),
     calculation_breakdown: z.object({
       addressable_population: z.number().optional(),
       penetration_rate: z.number().optional(),
       average_revenue_per_user: z.number().optional(),
       market_segments: z.array(z.object({
         name: z.string(),
         size_usd: z.number(),
         weight: z.number()
       }))
     }),
     sensitivity_analysis: z.array(z.object({
       variable: z.string(),
       impact_percent: z.number(),
       elasticity: z.number()
     })),
     data_sources: z.array(z.string()),
     assumptions: z.record(z.string(), z.unknown()),
     validation_checks: z.array(z.object({
       method: z.string(),
       result_usd: z.number(),
       variance_percent: z.number()
     }))
   });
   ```
   
   **Implementation Logic**:
   - **Top-Down**: Start with total market, apply segmentation filters
   - **Bottom-Up**: Aggregate from customer segments and usage patterns
   - **Hybrid**: Combine both methods with weighted averaging
   - **Scenario Modeling**: Monte Carlo simulation with parameter distributions
   - **Sensitivity Analysis**: Partial derivative calculations for key variables
   - **Validation**: Cross-validation with industry benchmarks and peer analysis

5. **calculate_sam**
   - **Name**: `calculate_sam`
   - **Description**: "Calculate Serviceable Addressable Market by applying business constraints to TAM"
   
   **Input Schema**:
   ```typescript
   const SamCalculationInputSchema = z.object({
     tam_input: TamCalculationInputSchema,
     target_segments: z.array(z.string()).min(1),
     target_regions: z.array(z.string()).optional(),
     constraints: z.object({
       regulatory: z.array(z.string()).optional(),
       competitive: z.object({
         market_share_ceiling: z.number().min(0).max(1).optional(),
         entry_barriers: z.array(z.string()).optional()
       }).optional(),
       operational: z.object({
         distribution_reach: z.number().min(0).max(1).optional(),
         capacity_limits: z.number().optional()
       }).optional(),
       financial: z.object({
         customer_acquisition_cost: z.number().optional(),
         payback_period_months: z.number().optional()
       }).optional()
     }).optional(),
     time_horizon_years: z.number().int().min(1).max(10).default(5)
   });
   ```
   
   **Output Schema**:
   ```typescript
   const SamResultSchema = z.object({
     sam_usd: z.number(),
     sam_percentage_of_tam: z.number().min(0).max(1),
     som_estimate: z.object({
       realistic_usd: z.number(),
       percentage_of_sam: z.number().min(0).max(1),
       time_to_achieve_years: z.number()
     }),
     constraint_analysis: z.object({
       regulatory_impact: z.number().min(0).max(1),
       competitive_impact: z.number().min(0).max(1),
       operational_impact: z.number().min(0).max(1),
       financial_viability: z.number().min(0).max(1)
     }),
     addressable_segments: z.array(z.object({
       name: z.string(),
       size_usd: z.number(),
       accessibility_score: z.number().min(0).max(1),
       priority_rank: z.number()
     })),
     market_entry_strategy: z.object({
       recommended_segments: z.array(z.string()),
       barriers_to_address: z.array(z.string()),
       success_factors: z.array(z.string())
     }),
     competitive_landscape: z.object({
       direct_competitors: z.array(z.string()),
       market_concentration: z.number().min(0).max(1),
       competitive_moats: z.array(z.string())
     })
   });
   ```
   
   **Implementation Logic**:
   - **Constraint Engine**: Rule-based filtering system with weighted impacts
   - **Accessibility Scoring**: Multi-factor analysis of market entry barriers
   - **Competitive Analysis**: Porter's Five Forces framework implementation
   - **Market Penetration Modeling**: S-curve adoption models with industry benchmarks
   - **Risk Assessment**: Monte Carlo simulation with constraint probability distributions

6. **get_market_segments**
   - **Name**: `get_market_segments`
   - **Description**: "Retrieve hierarchical market segment breakdown with size and growth data"
   
   **Input Schema**:
   ```typescript
   const GetMarketSegmentsInputSchema = z.object({
     industry: z.string().min(1),
     segmentation_type: z.enum(['demographic', 'geographic', 'psychographic', 'behavioral', 'product']),
     depth_level: z.number().int().min(1).max(4).default(2),
     include_trends: z.boolean().default(false),
     year: z.number().int().min(2020).max(2030).default(new Date().getFullYear())
   });
   ```
   
   **Output Schema**:
   ```typescript
   const MarketSegmentHierarchySchema = z.object({
     industry: z.string(),
     segmentation_type: z.string(),
     total_market_size_usd: z.number(),
     segments: z.array(z.object({
       id: z.string(),
       name: z.string(),
       description: z.string(),
       level: z.number(),
       parent_id: z.string().optional(),
       size_usd: z.number(),
       percentage_of_parent: z.number(),
       growth_rate_5yr: z.number(),
       trends: z.object({
         growth_trajectory: z.enum(['accelerating', 'stable', 'declining']),
         key_drivers: z.array(z.string()),
         risks: z.array(z.string())
       }).optional(),
       sub_segments: z.array(z.string()),
       key_characteristics: z.record(z.string(), z.unknown())
     })),
     cross_segment_analysis: z.object({
       overlap_matrix: z.array(z.array(z.number())),
       correlation_scores: z.array(z.object({
         segment_pair: z.tuple([z.string(), z.string()]),
         correlation: z.number().min(-1).max(1)
       }))
     })
   });
   ```
   
   **Implementation Logic**:
   - **Hierarchical Segmentation**: Tree-based data structure with parent-child relationships
   - **Size Allocation**: Proportional distribution based on demographic and economic data
   - **Growth Modeling**: Segment-specific growth rate calculations using historical trends
   - **Cross-Segment Analysis**: Correlation analysis and overlap detection
   - **Dynamic Updates**: Real-time recalculation based on changing market conditions

#### Advanced Analysis Tools (4 tools)

7. **forecast_market**
   - **Name**: `forecast_market`
   - **Description**: "Generate market forecasts using statistical models and scenario analysis"
   
   **Input Schema**:
   ```typescript
   const ForecastMarketInputSchema = z.object({
     industry: z.string().min(1),
     forecast_years: z.number().int().min(1).max(10),
     scenario_type: z.enum(['conservative', 'optimistic', 'pessimistic', 'all']).default('all'),
     confidence_level: z.number().min(0.8).max(0.99).default(0.95),
     external_factors: z.object({
       economic_indicators: z.array(z.string()).optional(),
       regulatory_changes: z.array(z.string()).optional(),
       technology_disruptions: z.array(z.string()).optional()
     }).optional()
   });
   ```
   
   **Output Schema**:
   ```typescript
   const MarketForecastSchema = z.object({
     industry: z.string(),
     base_year: z.number(),
     forecasts: z.array(z.object({
       year: z.number(),
       scenarios: z.object({
         conservative: z.object({
           market_size_usd: z.number(),
           growth_rate: z.number(),
           probability: z.number()
         }).optional(),
         optimistic: z.object({
           market_size_usd: z.number(),
           growth_rate: z.number(),
           probability: z.number()
         }).optional(),
         pessimistic: z.object({
           market_size_usd: z.number(),
           growth_rate: z.number(),
           probability: z.number()
         }).optional()
       }),
       confidence_interval: z.object({
         lower: z.number(),
         upper: z.number()
       }),
       key_assumptions: z.array(z.string())
     })),
     methodology: z.object({
       models_used: z.array(z.string()),
       data_sources: z.array(z.string()),
       validation_metrics: z.object({
         mape: z.number(),
         rmse: z.number(),
         r_squared: z.number()
       })
     }),
     risk_factors: z.array(z.object({
       factor: z.string(),
       impact_level: z.enum(['low', 'medium', 'high']),
       probability: z.number()
     }))
   });
   ```
   
   **Implementation Logic**:
   - **Time Series Models**: ARIMA, Prophet, and exponential smoothing
   - **Machine Learning**: Random Forest and XGBoost for complex pattern recognition
   - **Scenario Generation**: Monte Carlo simulation with correlated variables
   - **External Factor Integration**: Regression analysis with economic indicators
   - **Model Validation**: Walk-forward analysis and cross-validation
   - **Ensemble Methods**: Weighted combination of multiple forecasting models

8. **compare_markets**
   - **Name**: `compare_markets`
   - **Description**: "Compare multiple markets across various metrics with statistical analysis"
   
   **Input Schema**:
   ```typescript
   const CompareMarketsInputSchema = z.object({
     industries: z.array(z.string()).min(2).max(10),
     comparison_metrics: z.array(z.enum([
       'market_size', 'growth_rate', 'volatility', 'competitiveness', 
       'entry_barriers', 'profitability', 'innovation_index'
     ])).min(1),
     time_period: z.tuple([z.number().int(), z.number().int()]),
     normalize: z.boolean().default(true),
     statistical_tests: z.boolean().default(true)
   });
   ```
   
   **Output Schema**:
   ```typescript
   const MarketComparisonSchema = z.object({
     comparison_matrix: z.array(z.object({
       industry: z.string(),
       metrics: z.record(z.string(), z.number()),
       rankings: z.record(z.string(), z.number()),
       percentile_scores: z.record(z.string(), z.number())
     })),
     statistical_analysis: z.object({
       correlation_matrix: z.array(z.array(z.number())),
       anova_results: z.object({
         f_statistic: z.number(),
         p_value: z.number(),
         significant_differences: z.boolean()
       }),
       cluster_analysis: z.array(z.object({
         cluster_id: z.number(),
         industries: z.array(z.string()),
         characteristics: z.array(z.string())
       }))
     }),
     insights: z.object({
       top_performers: z.array(z.object({
         industry: z.string(),
         metric: z.string(),
         score: z.number()
       })),
       market_gaps: z.array(z.object({
         description: z.string(),
         opportunity_score: z.number()
       })),
       investment_recommendations: z.array(z.object({
         industry: z.string(),
         rationale: z.string(),
         risk_level: z.enum(['low', 'medium', 'high'])
       }))
     })
   });
   ```
   
   **Implementation Logic**:
   - **Data Normalization**: Z-score normalization for cross-industry comparison
   - **Statistical Testing**: ANOVA, t-tests, and chi-square tests for significance
   - **Clustering**: K-means clustering to identify market groups
   - **Correlation Analysis**: Pearson and Spearman correlation matrices
   - **Ranking Algorithms**: Multi-criteria decision analysis (MCDA)
   - **Insight Generation**: Rule-based system for automated recommendations

9. **validate_market_data**
   - **Name**: `validate_market_data`
   - **Description**: "Validate market size estimates against multiple data sources and benchmarks"
   
   **Input Schema**:
   ```typescript
   const ValidateMarketDataInputSchema = z.object({
     market_size: z.number().min(0),
     industry: z.string().min(1),
     year: z.number().int().min(2000).max(2030),
     currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
     region: z.enum(['US', 'EU', 'APAC', 'Global']).default('Global'),
     sources: z.array(z.string()).optional(),
     validation_level: z.enum(['basic', 'comprehensive']).default('comprehensive')
   });
   ```
   
   **Output Schema**:
   ```typescript
   const ValidationResultSchema = z.object({
     input_estimate: z.number(),
     validation_score: z.number().min(0).max(1),
     confidence_level: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
     benchmark_comparisons: z.array(z.object({
       source: z.string(),
       estimate: z.number(),
       variance_percent: z.number(),
       credibility_score: z.number().min(0).max(1)
     })),
     statistical_analysis: z.object({
       mean_estimate: z.number(),
       median_estimate: z.number(),
       standard_deviation: z.number(),
       outlier_detection: z.object({
         is_outlier: z.boolean(),
         z_score: z.number(),
         explanation: z.string()
       })
     }),
     alternative_estimates: z.array(z.object({
       methodology: z.string(),
       estimate: z.number(),
       confidence_interval: z.object({
         lower: z.number(),
         upper: z.number()
       })
     })),
     validation_flags: z.array(z.object({
       type: z.enum(['warning', 'error', 'info']),
       message: z.string(),
       recommendation: z.string()
     }))
   });
   ```
   
   **Implementation Logic**:
   - **Multi-Source Validation**: Cross-reference with 5+ independent data sources
   - **Statistical Outlier Detection**: Z-score and IQR-based outlier identification
   - **Credibility Weighting**: Source reliability scoring based on historical accuracy
   - **Methodology Cross-Check**: Validate using different calculation approaches
   - **Anomaly Detection**: Machine learning models for unusual pattern identification
   - **Confidence Scoring**: Bayesian updating with source credibility factors

10. **get_market_opportunities**
    - **Name**: `get_market_opportunities`
    - **Description**: "Identify emerging market opportunities based on growth patterns and market gaps"
    
    **Input Schema**:
    ```typescript
    const GetMarketOpportunitiesInputSchema = z.object({
      industries: z.array(z.string()).optional(),
      growth_threshold: z.number().min(0).default(0.15),
      time_horizon: z.number().int().min(1).max(10).default(5),
      investment_range: z.object({
        min_usd: z.number().min(0).optional(),
        max_usd: z.number().min(0).optional()
      }).optional(),
      risk_tolerance: z.enum(['low', 'medium', 'high']).default('medium'),
      opportunity_types: z.array(z.enum([
        'emerging_segments', 'geographic_expansion', 'technology_disruption',
        'demographic_shifts', 'regulatory_changes'
      ])).optional()
    });
    ```
    
    **Output Schema**:
    ```typescript
    const OpportunityAnalysisSchema = z.object({
      opportunities: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        industry: z.string(),
        opportunity_type: z.string(),
        market_size_potential_usd: z.number(),
        growth_rate_projected: z.number(),
        time_to_maturity_years: z.number(),
        scores: z.object({
          attractiveness: z.number().min(0).max(100),
          feasibility: z.number().min(0).max(100),
          urgency: z.number().min(0).max(100),
          overall: z.number().min(0).max(100)
        }),
        risk_factors: z.array(z.object({
          factor: z.string(),
          impact: z.enum(['low', 'medium', 'high']),
          probability: z.number().min(0).max(1)
        })),
        success_factors: z.array(z.string()),
        competitive_landscape: z.object({
          competition_level: z.enum(['low', 'medium', 'high']),
          key_players: z.array(z.string()),
          barriers_to_entry: z.array(z.string())
        }),
        investment_requirements: z.object({
          initial_investment_usd: z.number().optional(),
          payback_period_years: z.number().optional(),
          roi_projection: z.number().optional()
        })
      })),
      market_trends: z.array(z.object({
        trend: z.string(),
        impact_industries: z.array(z.string()),
        timeline: z.string(),
        confidence_level: z.number().min(0).max(1)
      })),
      methodology: z.object({
        data_sources: z.array(z.string()),
        analysis_framework: z.string(),
        last_updated: z.date()
      })
    });
    ```
    
    **Implementation Logic**:
    - **Trend Analysis**: Time series analysis to identify accelerating growth patterns
    - **Gap Analysis**: Market mapping to identify underserved segments
    - **Signal Detection**: News sentiment analysis and patent filing trends
    - **Scoring Algorithm**: Multi-criteria decision analysis with weighted factors
    - **Risk Assessment**: Monte Carlo simulation for risk-adjusted returns
    - **Competitive Intelligence**: Automated analysis of competitor moves and market positioning
    - **Machine Learning**: Ensemble models for opportunity prediction and ranking

### Resources Implementation

The server should implement **0 resources** initially, with future consideration for:
- Market sizing methodology documentation
- Industry classification mappings
- Data source reliability guides

### Error Handling Protocol

All tools must implement standardized MCP error responses:

#### Error Types
- **InvalidParams**: Malformed or invalid input parameters
- **InternalError**: Server-side processing failures
- **MethodNotFound**: Unsupported tool requests
- **RequestTimeout**: Query processing timeouts
- **DataUnavailable**: Missing or stale data sources

#### Error Response Format
```json
{
  "jsonrpc": "2.0",
  "id": "<request_id>",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "industry",
      "reason": "Industry not found in database",
      "suggestions": ["technology", "healthcare", "finance"]
    }
  }
}
```

### Logging Requirements

#### Log Levels
- **DEBUG**: Detailed calculation steps and data source queries
- **INFO**: Tool execution summaries and cache hits/misses  
- **WARN**: Data quality issues and fallback source usage
- **ERROR**: Failed calculations and data source errors

#### Structured Logging Format
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "tool": "calculate_tam",
  "industry": "cloud-computing",
  "execution_time_ms": 1247,
  "cache_hit": false,
  "data_sources": ["government", "research_firm"],
  "confidence_score": 0.85
}
```

### Testing and Validation

#### MCP Protocol Compliance
- Automated testing against MCP specification test suite
- JSON-RPC 2.0 message format validation
- Tool schema validation with Zod
- Error response format compliance

#### Integration Testing
- End-to-end tool execution workflows
- Error condition handling and recovery
- Performance benchmarking under load
- Client compatibility testing
