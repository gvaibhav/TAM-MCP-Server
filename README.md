[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/gvaibhav-tam-mcp-server-badge.png)](https://mseep.ai/app/gvaibhav-tam-mcp-server)

# Market Sizing MCP Server

[![License](https://img.shields.io/github/license/gvaibhav/TAM-MCP-Server)](https://github.com/gvaibhav/TAM-MCP-Server/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MCP Version](https://img.shields.io/badge/MCP%20Spec-2025--03--26-brightgreen.svg)](https://modelcontextprotocol.org/)

A Model Context Protocol server providing market research and business analysis capabilities through 28 tools, 15 business prompts, and integration with 8 economic data sources.

## Overview

This MCP server provides comprehensive market research capabilities including:

- **28 Tools**: Market analysis, data access, and business intelligence tools
- **15 Prompts**: Professional business analysis templates for funding, strategy, and research
- **Data Integration**: Alpha Vantage, BLS, Census, FRED, IMF, Nasdaq Data Link, OECD, World Bank
- **Smart Defaults**: Pre-configured parameters for immediate use without setup
- **Multiple Transports**: STDIO, Streamable HTTP, and SSE support

### Capabilities

**Market Analysis Tools**
- Total Addressable Market (TAM) and Serviceable Addressable Market (SAM) calculations
- Market size estimation and forecasting
- Industry analysis and competitive intelligence
- Market segmentation and opportunity identification
- Data validation and cross-source verification

**Business Intelligence Prompts**
- Startup funding pitch preparation
- Private equity investment analysis
- Corporate strategy and market entry
- Crisis management and regulatory impact assessment
- ESG and sustainability analysis

**Data Access**
- Real-time financial and economic data retrieval
- Multi-source data aggregation and comparison
- Intelligent routing based on data type and availability
- Comprehensive caching for performance optimization

**MCP Protocol Features**
- **Real-time Notifications**: 6 types of business-specific notifications for market intelligence, data source health, calculation milestones, and performance monitoring
- **Multiple Transports**: Full support for STDIO, HTTP, and Server-Sent Events (SSE) protocols
- **Resource Access**: Documentation and status information available through MCP resources
- **Tool Discovery**: Complete tool catalog with smart defaults and validation

## Installation

### Prerequisites
- Node.js 20.x or later
- npm or yarn
- API keys for data sources (optional, see Configuration)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/your-username/TAM-MCP-Server.git
cd TAM-MCP-Server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Build and start (HTTP - recommended)
npm run build
npm run start:http
```

### Development Setup

```bash
# Use development script
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# Or manual setup
npm install
npm run build
npm run start  # HTTP server
npm run start:stdio  # STDIO transport
```

### Docker Deployment

```bash
# Build image
docker build -t tam-mcp-server .

# Run container with environment file
docker run -p 3000:3000 --env-file .env tam-mcp-server

# Or run with individual environment variables
docker run -p 3000:3000 \
  -e ALPHA_VANTAGE_API_KEY=your_key_here \
  -e FRED_API_KEY=your_key_here \
  -e NODE_ENV=production \
  tam-mcp-server
```

### MCP Integration

**HTTP Transport (Recommended)**
For Claude Desktop, add to your configuration:

```json
{
  "mcpServers": {
    "tam": {
      "command": "npm",
      "args": ["run", "start:http"],
      "cwd": "/path/to/TAM-MCP-Server"
    }
  }
}
```

**STDIO Transport (Alternative)**
```json
{
  "mcpServers": {
    "tam": {
      "command": "npm",
      "args": ["run", "start:stdio"],
      "cwd": "/path/to/TAM-MCP-Server"
    }
  }
}
```

For MCP Inspector:
```bash
# HTTP mode
npm run start:http

# STDIO mode  
npx @modelcontextprotocol/inspector npm run start:stdio
```

## Usage

### Smart Default Values - Zero-Friction Start

Get professional market insights instantly - no parameter research required!

All 28 tools include intelligent default values that let you start analyzing immediately:

```javascript
// Call any tool with empty parameters - defaults automatically applied
{
  "name": "alphaVantage_getCompanyOverview",
  "arguments": {} // Server provides: symbol="AAPL" (Apple Inc.)
}

{
  "name": "tam_analysis", 
  "arguments": {} // Server provides: $10B market, 15% growth, 5-year projection
}
```

**Professional Defaults Include:**
- Stock Analysis: AAPL, MSFT, GOOGL (Fortune 500 companies)
- Economic Data: US GDP, Global indicators, 2020-2024 timeframes  
- Industry Codes: Technology sector, Professional Services (NAICS 54)
- Market Calculations: $10B base market, 15% growth rates, 5-year projections

**Perfect for:**
- First-time users getting immediate results without parameter research
- Demo environments showcasing professional market analysis capabilities  
- Rapid prototyping with realistic business data and scenarios

### Basic Tool Usage

```javascript
// Market analysis with defaults
{
  "name": "tam_analysis",
  "arguments": {}
}

// Company overview with default symbol (AAPL)
{
  "name": "alphaVantage_getCompanyOverview", 
  "arguments": {}
}

// Custom parameters
{
  "name": "market_size",
  "arguments": {
    "industryId": "technology",
    "region": "north-america"
  }
}
```

### Business Analysis Prompts

Access professional templates through the prompts interface:

```javascript
// List available prompts
{
  "method": "prompts/list"
}

// Get startup funding prompt
{
  "method": "prompts/get",
  "params": {
    "name": "startup_funding_pitch",
    "arguments": {
      "company_name": "TechCorp",
      "industry": "SaaS"
    }
  }
}
```

### MCP Tools - Three-Tier Architecture System

The TAM MCP Server provides **28 total MCP tools** organized in three complementary tiers:

#### Tier 1: Direct Data Access Tools (13 tools)
**Purpose**: Raw access to external data sources  
**Target Users**: Developers, data engineers, custom analytics builders

- **`alphaVantage_getCompanyOverview`**: Get detailed company overview and financials
- **`alphaVantage_searchSymbols`**: Search for stock symbols and company names
- **`bls_getSeriesData`**: Retrieve Bureau of Labor Statistics employment data
- **`census_fetchIndustryData`**: Access U.S. Census Bureau industry statistics
- **`census_fetchMarketSize`**: Get market size data from Census surveys
- **`fred_getSeriesObservations`**: Fetch Federal Reserve economic data series
- **`imf_getDataset`**: Access International Monetary Fund datasets
- **`imf_getLatestObservation`**: Get latest IMF economic observations
- **`nasdaq_getDatasetTimeSeries`**: Retrieve Nasdaq Data Link time series
- **`nasdaq_getLatestDatasetValue`**: Get latest values from Nasdaq datasets
- **`oecd_getDataset`**: Access OECD statistical datasets
- **`oecd_getLatestObservation`**: Get latest OECD economic observations
- **`worldBank_getIndicatorData`**: Fetch World Bank development indicators

#### Tier 2: Basic Market Tools (4 tools)
**Purpose**: Foundational market analysis capabilities  
**Target Users**: Business analysts starting with basic market research

- **`industry_search`**: Basic industry data retrieval from multiple sources
- **`tam_calculator`**: Basic Total Addressable Market calculations
- **`market_size_calculator`**: Basic market size estimation with methodology explanations
- **`company_financials_retriever`**: Basic company financial data retrieval

#### Tier 3: Business Analysis Tools (11 tools)
**Purpose**: Advanced market intelligence and comprehensive business analysis  
**Target Users**: Senior analysts, market researchers, investment teams

1. **`industry_analysis`**: Enhanced multi-source industry analysis with intelligent ranking
2. **`industry_data`**: Detailed industry intelligence with trends, ESG, and key players
3. **`market_size`**: Advanced market size estimation and analysis with confidence scoring
4. **`tam_analysis`**: Advanced Total Addressable Market calculations with scenario projections
5. **`sam_calculator`**: Serviceable Addressable Market with constraint analysis
6. **`market_segments`**: Hierarchical market segmentation analysis
7. **`market_forecasting`**: Time series forecasting with scenario analysis
8. **`market_comparison`**: Multi-market comparative analysis and rankings
9. **`data_validation`**: Cross-source data quality validation and scoring
10. **`market_opportunities`**: Market gap and growth opportunity identification
11. **`generic_data_query`**: Direct access to any data source service and method

### Data Sources

The server integrates with 8 data sources:
- **Alpha Vantage**: Company financials, stock data
- **BLS**: Employment and labor statistics  
- **Census**: Industry and demographic data
- **FRED**: Federal Reserve economic data
- **IMF**: International economic data
- **Nasdaq Data Link**: Financial datasets
- **OECD**: International statistics
- **World Bank**: Development indicators

### Transport Methods

**HTTP Server (Recommended)**
```bash
npm run start:http
# Server available at http://localhost:3000
```

**STDIO Transport**
```bash
npm run start:stdio
```

**Server-Sent Events**
```bash
npm run start:sse
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# API Keys (Optional - tools work without keys but with limited data)
ALPHA_VANTAGE_API_KEY=your_key_here
CENSUS_API_KEY=your_key_here
FRED_API_KEY=your_key_here
NASDAQ_DATA_LINK_API_KEY=your_key_here
BLS_API_KEY=your_key_here

# Cache Configuration (Optional)
CACHE_TTL_DEFAULT_MS=86400000
CACHE_TTL_ALPHA_VANTAGE_MS=86400000
CACHE_TTL_FRED_MS=86400000
```

### Data Source Setup

**Required Keys:**
- **Alpha Vantage**: Free tier provides 25 requests/day
- **Census Bureau**: Free API access
- **FRED**: Free API access  
- **Nasdaq Data Link**: Free tier available

**No Key Required:**
- World Bank, OECD, IMF (public APIs)
- BLS (optional key for higher limits)

### Tool Defaults

All tools include professional defaults. See [Default Values Guide](doc/consumer/default-values-guide.md) for complete parameter lists.

**Example Defaults:**
- Stock symbols: AAPL, MSFT, GOOGL
- Industry codes: NAICS 54 (Professional Services)
- Market sizes: $10B base with 15% growth
- Time periods: 2020-2024

### Caching Strategy

**In-Memory Cache (Default)**
- NodeCache-based with configurable TTLs
- Automatic cleanup and statistics
- Per-source cache invalidation

**Redis Cache (Production)**
```typescript
const dataService = new EnhancedDataService({
  cache: { type: 'redis' },
  apiKeys: { /* your keys */ }
});
```

## Project Structure

```
TAM-MCP-Server/
├── config/                     # Configuration files
│   ├── jest.config.json       # Jest test configuration  
│   ├── vitest.config.ts       # Vitest test configuration
│   └── redis.conf             # Redis configuration
├── doc/                       # Documentation
│   ├── README.md              # Documentation hub
│   ├── consumer/              # Consumer documentation
│   │   ├── getting-started.md # Getting started guide
│   │   ├── default-values-guide.md # Default values guide
│   │   ├── mcp-prompts-guide.md # MCP prompts guide
│   │   ├── tools-guide.md     # Tools reference
│   │   └── api-reference.md   # API documentation
│   ├── contributor/           # Contributor documentation
│   │   ├── contributing.md    # Development guidelines
│   │   └── security.md        # Security policy
│   ├── reference/             # Reference documentation
│   │   ├── RELEASE-NOTES.md   # Version history
│   │   ├── CHANGELOG.md       # Technical changes
│   │   └── requirements.md    # Technical specifications
│   ├── reports/               # Technical reports and validation
│   │   ├── SEMANTIC-VALIDATION-COMPLETE.md # Validation results
│   │   └── DEFAULT-VALUES-SUMMARY.md # Default values analysis
│   └── archive/               # Historical documents
├── examples/                  # Examples and demos
│   ├── README.md              # Examples documentation
│   ├── demo-default-values.mjs # Default values demonstration
│   ├── demo-integration.mjs   # Integration examples
│   └── TAM-MCP-Server-Postman-Collection.json # API testing
├── scripts/                   # Build and development scripts
│   ├── build.sh               # Production build script
│   ├── dev-setup.sh          # Development environment setup
│   └── dev.sh                # Development helper script
├── src/                       # Source code
│   ├── index.ts               # Main entry point
│   ├── server.ts              # Core MCP server
│   ├── http.ts                # HTTP transport
│   ├── sse-new.ts            # SSE transport
│   ├── stdio-simple.ts       # STDIO transport
│   ├── config/               # Configuration modules
│   ├── services/             # Data source services
│   ├── tools/                # MCP tool implementations
│   ├── prompts/              # Business prompt templates
│   ├── notifications/        # Notification system
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── tests/                     # Test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── e2e/                  # End-to-end tests
│   ├── scripts/              # Test and validation scripts
│   │   ├── test-comprehensive.mjs # Comprehensive testing
│   │   ├── test-semantic-validation.mjs # Semantic validation
│   │   └── *.mjs             # Additional test utilities
│   ├── fixtures/             # Test data and mock objects
│   ├── utils/                # Test utilities and helpers
│   └── setup.ts              # Test configuration
├── logs/                      # Application logs
├── dist/                      # Compiled JavaScript (built)
├── .env.example              # Environment template
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Main documentation
```

## Tools Reference

### MCP Data Access Tools (17 tools)

#### Direct Data Source Access (13 tools)
| Source | Tools | Description |
|--------|-------|-------------|
| Alpha Vantage | `alphaVantage_getCompanyOverview`, `alphaVantage_searchSymbols` | Company financials and stock data |
| BLS | `bls_getSeriesData` | Bureau of Labor Statistics data |
| Census | `census_fetchIndustryData`, `census_fetchMarketSize` | Industry and demographic data |
| FRED | `fred_getSeriesObservations` | Federal Reserve economic data |
| IMF | `imf_getDataset`, `imf_getLatestObservation` | International economic data |
| Nasdaq | `nasdaq_getDatasetTimeSeries`, `nasdaq_getLatestDatasetValue` | Financial datasets |
| OECD | `oecd_getDataset`, `oecd_getLatestObservation` | International statistics |
| World Bank | `worldBank_getIndicatorData` | Development indicators |

#### Basic Market Tools (4 tools)
| Tool | Description |
|------|-------------|
| `industry_search` | Basic industry data search from sources |
| `tam_calculator` | Basic Total Addressable Market calculations |
| `market_size_calculator` | Market size estimation and calculations |
| `company_financials_retriever` | Enhanced company financial data retrieval |

### Business Analysis Tools (11 tools)
| Tool | Description |
|------|-------------|
| `industry_analysis` | Enhanced multi-source industry analysis |
| `industry_data` | Detailed industry intelligence with trends and key players |
| `market_size` | Advanced market size estimation with confidence scoring |
| `tam_analysis` | Advanced Total Addressable Market calculations |
| `sam_calculator` | Serviceable Addressable Market analysis |
| `market_segments` | Hierarchical market segmentation |
| `market_forecasting` | Time series forecasting with scenarios |
| `market_comparison` | Multi-market comparative analysis |
| `data_validation` | Cross-source data quality validation |
| `market_opportunities` | Market gap identification |
| `generic_data_query` | Direct data source service access |

### Business Prompts (15 templates)

**15 Professional Business Analysis Prompts** designed for real-world business scenarios:

#### Strategic Business Analysis
- **startup_funding_pitch** - Series A-C funding presentations with TAM/SAM analysis
- **private_equity_research** - Investment committee packages for PE deals
- **corporate_strategy_entry** - Fortune 500 market entry strategy analysis
- **venture_capital_thesis** - VC investment thesis development
- **asset_management_research** - Institutional asset management research

#### Crisis & Specialized Analysis
- **crisis_management_analysis** - Emergency market analysis for crisis response
- **regulatory_impact_assessment** - Regulatory change impact analysis
- **international_expansion** - Global market entry strategy analysis
- **technology_disruption_analysis** - Technology disruption impact assessment
- **esg_sustainability_analysis** - ESG and sustainability market analysis

#### Quick Analysis & Guidance
- **market_opportunity_scan** - Rapid market opportunity identification
- **competitive_intelligence** - Competitive landscape analysis
- **investment_screening** - Investment opportunity screening
- **tool_guidance** - Interactive guide to TAM MCP Server tools
- **best_practices_guide** - Best practices for market analysis

**Designed for AI applications serving business analysts, developers, and market researchers with deep market intelligence and data access tools.**

## Development

### Testing

The project uses a comprehensive test structure with Vitest as the primary testing framework:

```
tests/
├── unit/                    # Fast, isolated component tests
├── integration/            # Component interaction tests
├── e2e/                   # End-to-end workflow tests
├── scripts/               # Integration test scripts
│   ├── test-comprehensive.mjs # Comprehensive testing
│   ├── test-http-streaming.mjs # HTTP streaming transport
│   ├── test-simple-mcp.mjs # Basic MCP functionality
│   └── test-mcp-tool-calls.mjs # Individual tool validation
├── fixtures/              # Test data and mock objects
├── utils/                 # Test utilities and helpers
└── setup.ts              # Vitest global configuration
```

#### Running Tests

```bash
# Run all tests
npm test

# Run by category
npm run test:unit          # Fast unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests

# Advanced options
npm run test:coverage     # With coverage report
npm run test:watch       # Watch mode for development
npm run test:ui          # Vitest UI mode
npm run test:ci          # CI-optimized test run

# Run integration scripts
npm run test:scripts              # Comprehensive backend integration
npm run test:scripts:http         # HTTP streaming transport  
npm run test:scripts:simple       # Basic MCP functionality
npm run test:scripts:tools        # Individual tool validation
npm run test:scripts:inspector    # MCP Inspector compatibility

# Or run directly
node tests/scripts/test-comprehensive.mjs
node tests/scripts/test-http-streaming.mjs
```

#### API Testing with Postman

Import the comprehensive Postman collection for testing both MCP endpoints and backend API integrations:

**MCP Server Testing Collection**
1. **Import Collection**: `examples/TAM-MCP-Server-Postman-Collection.json`
2. **Set Environment Variables**:
   - `serverUrl`: http://localhost:3000
   - `sessionId`: (automatically set after initialization)
3. **Run Tests**:
   - Health check and server status
   - MCP session initialization
   - All 28 tools (11 market analysis + 17 data access)
   - Resource access endpoints
   - Session management and cleanup

**Newman CLI Testing**
Automate Postman tests from command line:
```bash
# Install Newman
npm install -g newman

# Run backend API tests
newman run examples/TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json \
  --reporters cli,json

# Or use npm script
npm run test:postman
```

#### Test Coverage
- **Unit Level**: Individual tool functionality and business logic
- **Integration Level**: MCP protocol compliance and server behavior
- **System Level**: Complete workflows through real transports
- **API Level**: REST endpoints and session management
- **Performance**: Response time and resource usage monitoring

Code coverage reports are generated in the `coverage/` directory.

### Project Structure

```
src/
├── index.ts              # Main entry point
├── server.ts             # MCP server implementation
├── http.ts               # HTTP transport
├── sse-new.ts           # SSE transport
├── stdio-simple.ts      # STDIO transport
├── config/              # Configuration modules
│   └── apiConfig.ts     # API endpoint configurations
├── services/            # Data source services
│   ├── dataService.ts   # Main data orchestrator
│   ├── cache/           # Caching services
│   │   ├── cacheService.ts # In-memory caching
│   │   └── persistenceService.ts # File persistence
│   └── dataSources/     # Individual data source clients
│       ├── alphaVantageService.ts
│       ├── blsService.ts
│       ├── censusService.ts
│       ├── fredService.ts
│       ├── imfService.ts
│       ├── nasdaqDataService.ts
│       ├── oecdService.ts
│       └── worldBankService.ts
├── tools/               # MCP tool implementations
│   └── market-tools.ts  # MarketAnalysisTools class
├── prompts/             # Business prompt templates
├── notifications/       # Notification system
├── types/               # TypeScript definitions
│   ├── index.ts         # Core schemas and types
│   ├── dataSources.ts   # Data source interfaces
│   └── cache.ts         # Cache-related types
└── utils/               # Utility functions
    ├── dataTransform.ts # Data transformation
    ├── envHelper.ts     # Environment parsing
    ├── rateLimit.ts     # Rate limiting
    └── logger.ts        # Winston logging

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
├── e2e/                 # End-to-end tests
└── scripts/             # Test automation scripts
```

### API Testing

Use the included Postman collection:

```bash
# Import collection
examples/TAM-MCP-Server-Postman-Collection.json

# Or run with Newman
npm run test:postman
```

### Technology Stack

- **Language**: TypeScript 5.x
- **Protocol**: MCP 2025-03-26
- **Framework**: Express.js 4.x
- **Validation**: Zod schemas
- **Testing**: Vitest + Postman
- **Cache**: NodeCache (Redis optional)
- **Logging**: Winston

## Troubleshooting

### Common Issues

**Services showing as disabled despite API keys**
- Ensure `.env` file is in project root
- Check API key variable names match exactly
- Restart server after adding keys
- Verify startup logs show service initialization

**MCP Inspector connection issues**
- Use: `npx @modelcontextprotocol/inspector node dist/stdio-simple.js`
- Ensure no console.log statements contaminate stdout
- Check Winston logger uses stderr for output

**Build errors**
- Run `npm install` to update dependencies
- Check Node.js version (20.x recommended)
- Clear build cache: `rm -rf dist && npm run build`

**No data returned from tools**
- Check service status in startup logs
- Verify API quotas not exceeded
- Test with `generic_data_query` tool
- Check network connectivity

### Getting Help

- Check [GitHub Issues](https://github.com/gvaibhav/TAM-MCP-Server/issues)
- Review [Release Notes](doc/reference/RELEASE-NOTES.md)
- Submit issues with error logs and environment details

## Documentation

### Complete Documentation

- **[Documentation Hub](doc/README.md)** - Complete guide to all project documentation
- **[Getting Started Guide](doc/consumer/getting-started.md)** - Quick setup and first-use instructions
- **[Configuration Guide](doc/consumer/configuration.md)** - Environment setup and API key management
- **[Tools Reference](doc/consumer/tools-guide.md)** - Complete tool documentation and usage examples
- **[Prompts Guide](doc/consumer/mcp-prompts-guide.md)** - Business analysis prompt templates and scenarios
- **[API Reference](doc/consumer/api-reference.md)** - Complete API documentation and integration guides
- **[Default Values Guide](doc/consumer/default-values-guide.md)** - Smart defaults documentation
- **[MCP Integration Guide](doc/consumer/mcp-integration.md)** - MCP resources and protocol usage

### Development Documentation

- **[Contributing Guide](doc/contributor/contributing.md)** - Guidelines for contributors and developers
- **[Security Policy](doc/contributor/security.md)** - Security guidelines and vulnerability reporting
- **[Release Notes](doc/reference/RELEASE-NOTES.md)** - Detailed change history and version information
- **[Changelog](doc/reference/CHANGELOG.md)** - Technical changes and updates

### Testing Documentation

- **[Integration Tests](tests/scripts/README.md)** - Integration test scripts documentation

### Examples & Scripts

- **[Examples Directory](examples/README.md)** - API examples and integration resources
- **[Postman Collection](examples/TAM-MCP-Server-Postman-Collection.json)** - Comprehensive API testing collection
- **[Development Scripts](scripts/)** - Build and setup automation scripts

### Implementation Guides

- **[Notifications Guide](doc/guides/NOTIFICATIONS-IMPLEMENTATION.md)** - Real-time notification system
- **[Architecture Overview](doc/DESIGN-ARCHITECTURE.md)** - System design and architecture decisions

### MCP Resources Access

All documentation is also accessible through the MCP protocol:

```javascript
// Discover all available documentation
{
  "method": "resources/list",
  "params": {}
}

// Read specific documentation
{
  "method": "resources/read", 
  "params": {
    "uri": "file:///README.md"
  }
}
```

**Available Documentation Resources:**
- README.md - Complete project overview and feature documentation
- Getting Started Guide - Quick setup and first-use instructions
- Configuration Guide - Environment setup and API key management
- Tools Reference - Complete tool documentation and usage examples
- Prompts Guide - Business analysis prompt templates and scenarios
- API Reference - Complete API documentation and integration guides
- Security Policy - Security guidelines and best practices
- Contributing Guide - Development and contribution instructions

## Contributing

Contributions welcome! See [Contributing Guidelines](CONTRIBUTING.md) for requirements.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Created by [Vaibhav Gupta](https://github.com/gvaibhav)**
