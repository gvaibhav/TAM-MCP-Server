# Market Sizing MCP Server

[![GitHub stars](https://img.shields.io/github/stars/gvaibhav/TAM-MCP-Server?style=social)](https://github.com/gvaibhav/TAM-MCP-Server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/gvaibhav/TAM-MCP-Server?style=social)](https://github.com/gvaibhav/TAM-MCP-Server/network/members)
[![GitHub issues](https://img.shields.io/github/issues/gvaibhav/TAM-MCP-Server)](https://github.com/gvaibhav/TAM-MCP-Server/issues)
[![License](https://img.shields.io/github/license/gvaibhav/TAM-MCP-Server)](https://github.com/gvaibhav/TAM-MCP-Server/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-orange.svg)](https://expressjs.com/)
[![MCP Version](https://img.shields.io/badge/MCP%20Spec-2024--11--05-brightgreen.svg)](https://modelcontextprotocol.org/)
[![Docker Build](https://github.com/gvaibhav/TAM-MCP-Server/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/gvaibhav/TAM-MCP-Server/actions/workflows/docker-publish.yml)
[![CodeQL](https://github.com/gvaibhav/TAM-MCP-Server/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/gvaibhav/TAM-MCP-Server/actions/workflows/github-code-scanning/codeql)

A comprehensive **Model Context Protocol (MCP)** server for market intelligence, business analysis, and industry research. Features a sophisticated dual tool architecture with 28 MCP tools spanning raw data access to advanced analytics, powered by 8 integrated economic data sources.

**Designed for AI applications serving business analysts, developers, and market researchers with deep market intelligence and data access tools.**

**The server now integrates 8 free data sources (World Bank, FRED, Alpha Vantage, Nasdaq Data Link, BLS, Census, OECD, IMF) providing real-time market insights. It features an advanced DataService for orchestration, comprehensive tool definitions, and configurable caching.**

## 🎉 **Project Complete & Ready for Use**

✅ **Test Coverage Enhanced** - 95% improvement in test detection, critical infrastructure fixes  
✅ **Documentation Reorganized** - Role-based structure with consumer/contributor navigation  
✅ **Postman Scripts Enhanced** - Comprehensive automation with Newman CLI and CI/CD integration  
✅ **Core Development Complete** - Ready for deployment with comprehensive testing automation

> 📋 **See**: [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) for current project status

**🔄 Recent Update**: Documentation alignment completed to address dual tool system architecture

📋 **Quick Links**: [Getting Started](doc/consumer/getting-started.md) | [Tool Selection Guide](doc/TOOL-SYSTEM-SELECTION-GUIDE.md) | [API Reference](doc/consumer/api-reference.md) | [Implementation Review](doc/COMPREHENSIVE-IMPLEMENTATION-REVIEW.md) | [Contributing](doc/contributor/contributing.md) | [Project Status](PROJECT-STATUS.md)

## 🚀 Features

### Core Capabilities
- **Dual Tool Architecture**: 28 total MCP tools (17 data access + 11 business analysis) for comprehensive market intelligence
- **Full Integration with 8 Data Sources**: Alpha Vantage, BLS, Census, FRED, IMF, Nasdaq Data Link, OECD, World Bank
- **STDIO Transport Support**: Compatible with Claude Desktop, VS Code MCP extensions, and MCP Inspector
- **Advanced DataService Orchestration**: Intelligent routing and direct data access capabilities
- **MCP Resource Support** with documentation access through protocol
- **Enterprise Caching System**: NodeCache-based in-memory caching with Redis/hybrid options for production
- **Comprehensive Input Validation**: Zod-based schema validation for all tools
- **Professional Logging**: Structured Winston logging with business metrics
- **Enterprise Security**: Rate limiting, input validation, and error handling
- **Production Ready**: Complete testing suite with health monitoring

### Dual Tool System Architecture

The TAM MCP Server provides **28 total MCP tools** across two complementary systems:

#### System 1: MCP Data Access Tools (17 tools)
**Purpose**: Direct data source access and enhanced analytics  
**Target Users**: Developers, data engineers, custom analytics builders

**Raw Data API Tools (13 tools):**
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

**Multi-Source Aggregation Tool (1 tool):**
- **`industry_search`**: Search across multiple data sources with intelligent aggregation

**Enhanced Analytical Tools (3 tools):**
- **`tam_calculator`**: Calculate Total Addressable Market with comprehensive guidance
- **`market_size_calculator`**: Estimate current market size with methodology explanations
- **`company_financials_retriever`**: Retrieve company financial data with statement guidance

#### System 2: Business Analysis Tools (11 tools)
**Purpose**: Conversational market intelligence and advanced business analysis  
**Target Users**: Business analysts, market researchers, investment teams

1. **`industry_search`**: Multi-source industry search with intelligent ranking
2. **`industry_data`**: Detailed industry intelligence with trends, ESG, and key players
3. **`market_size`**: Market size estimation and analysis with confidence scoring
4. **`tam_calculator`**: Total Addressable Market calculations with projections
5. **`sam_calculator`**: Serviceable Addressable Market with constraint analysis
6. **`market_segments`**: Hierarchical market segmentation analysis
7. **`market_forecasting`**: Time series forecasting with scenario analysis
8. **`market_comparison`**: Multi-market comparative analysis and rankings
9. **`data_validation`**: Cross-source data quality validation and scoring
10. **`market_opportunities`**: Market gap and growth opportunity identification
11. **`generic_data_query`**: Direct access to any data source service and method

## 🛠 Installation

### Prerequisites
- Node.js (v20.x recommended)
- npm (v10.x recommended) or yarn
- Docker (optional, for containerized deployment)

### Quick Start
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gvaibhav/TAM-MCP-Server.git
    cd TAM-MCP-Server
    ```
2.  **Quick setup (recommended):**
    ```bash
    # Automated development setup
    chmod +x scripts/dev-setup.sh
    ./scripts/dev-setup.sh
    
    # Or use the development helper
    chmod +x scripts/dev.sh
    ./scripts/dev.sh setup
    ```
    
    Or manual setup:
    
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the variables in `.env` as needed (see Configuration section).
5.  **Build the project:**
    ```bash
    npm run build
    # or use the build script
    ./scripts/build.sh
    ```
6.  **Run the server:**
    ```bash
    npm start
    ```
    The server will typically be available at `http://localhost:3000`.

    It can be started with inspector as:
    ```bash
    npx @modelcontextprotocol/inspector node dist/stdio-simple.js
    ```

### Development Helper Script

For common development tasks, use the helper script:

```bash
# Make executable (first time only)
chmod +x scripts/dev.sh

# Show available commands
./scripts/dev.sh help

# Common commands
./scripts/dev.sh setup      # Setup development environment
./scripts/dev.sh build      # Build the project
./scripts/dev.sh test       # Run all tests
./scripts/dev.sh start      # Start STDIO server
./scripts/dev.sh start:http # Start HTTP server
```

### Docker Installation
1.  **Build the Docker image:**
    ```bash
    docker build -t tam-mcp-server .
    ```
2.  **Run the Docker container:**
    ```bash
    docker run -p 3000:3000 --env-file .env tam-mcp-server
    ```
    Ensure your `.env` file is correctly populated before running.

## 📁 Project Structure

```
TAM-MCP-Server/
├── config/                     # Configuration files
│   ├── jest.config.json       # Jest test configuration  
│   ├── vitest.config.ts       # Vitest test configuration
│   └── .eslintrc.json         # ESLint configuration
├── doc/                       # Documentation
│   ├── README.md              # Documentation hub
├── doc/                       # Documentation
│   ├── README.md              # Documentation hub
│   ├── guides/                # User and developer guides
│   │   ├── CONTRIBUTING.md    # Contribution guidelines
│   │   ├── SECURITY.md        # Security policy
│   │   └── *.md               # Implementation guides
│   ├── reference/             # Reference documentation
│   │   ├── RELEASE-NOTES.md   # Version history
│   │   ├── CHANGELOG.md       # Technical changes
│   │   └── requirements.md    # Technical specifications
│   ├── reports/               # Technical reports
│   │   └── *.md               # Testing and analysis reports
│   └── archive/               # Historical documents
├── examples/                  # Examples and API resources
│   ├── README.md              # Examples documentation
│   └── TAM-MCP-Server-Postman-Collection.json
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
│   ├── notifications/        # Notification system
│   └── utils/                # Utility functions
├── tests/                     # Test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── e2e/                  # End-to-end tests
│   ├── scripts/              # Integration test scripts
│   └── setup.ts              # Test configuration
├── logs/                      # Application logs
├── dist/                      # Compiled JavaScript (built)
├── .env.example              # Environment template
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Main documentation
```

## 📋 Configuration

### Environment Variables
Update your `.env` file. API keys are needed for some sources. Cache TTLs are in milliseconds.

| Variable                        | Description                                         | Default             | Required                 |
|---------------------------------|-----------------------------------------------------|---------------------|--------------------------|
| `PORT`                          | Server port                                         | `3000`              | No                       |
| `HOST`                          | Server host                                         | `0.0.0.0`           | No                       |
| `NODE_ENV`                      | Environment                                         | `development`       | No                       |
| `CORS_ORIGIN`                   | CORS origin                                         | `*`                 | No                       |
| `RATE_LIMIT_MAX`                | Rate limit per window                               | `100`               | No                       |
| `SESSION_SECRET`                | Session secret key                                  | -                   | **Yes**                  |
| `LOG_LEVEL`                     | Logging level                                       | `info`              | No                       |
|                                 |                                                     |                     |                          |
| **API Keys (Free Sources)**     |                                                     |                     |                          |
| `BLS_API_KEY`                   | Bureau of Labor Statistics (BLS)                    | -                   | Optional for BLS data    |
| `CENSUS_API_KEY`                | Census Bureau                                       | -                   | **Yes** for Census data  |
| `FRED_API_KEY`                  | Federal Reserve Economic Data (FRED)                | -                   | **Yes** for FRED data    |
| `ALPHA_VANTAGE_API_KEY`         | Alpha Vantage                                       | -                   | **Yes** for Alpha Vantage|
| `NASDAQ_DATA_LINK_API_KEY`      | Nasdaq Data Link (Quandl)                           | -                   | **Yes** for Nasdaq data  |
|                                 | *World Bank, OECD, IMF: No key needed*              |                     |                          |
|                                 |                                                     |                     |                          |
| **Cache TTLs (Milliseconds)**   |                                                     |                     |                          |
| `CACHE_TTL_DEFAULT_MS`          | Default general cache TTL (used by some services if specific not set) | `86400000` (1d)   | No                       |
| `CACHE_TTL_WORLD_BANK_MS`       | TTL for World Bank successful fetches               | `86400000` (1d)   | No                       |
| `CACHE_TTL_WORLD_BANK_NODATA_MS`| TTL for World Bank "no data" responses              | `3600000` (1h)    | No                       |
| `CACHE_TTL_FRED_MS`             | TTL for FRED successful fetches                     | `86400000` (1d)   | No                       |
| `CACHE_TTL_FRED_NODATA_MS`      | TTL for FRED "no data" responses                    | `3600000` (1h)    | No                       |
| `CACHE_TTL_ALPHA_VANTAGE_MS`    | TTL for AlphaVantage successful fetches             | `86400000` (1d)   | No                       |
| `CACHE_TTL_ALPHA_VANTAGE_NODATA_MS` | TTL for AlphaVantage "no data" responses          | `3600000` (1h)    | No                       |
| `CACHE_TTL_ALPHA_VANTAGE_RATELIMIT_MS` | TTL for AlphaVantage rate limit responses      | `300000` (5m)     | No                       |
| `CACHE_TTL_NASDAQ_MS`           | TTL for Nasdaq Data Link successful fetches         | `86400000` (1d)   | No                       |
| `CACHE_TTL_NASDAQ_NODATA_MS`    | TTL for Nasdaq Data Link "no data" responses        | `3600000` (1h)    | No                       |
| `CACHE_TTL_BLS_MS`              | TTL for BLS successful fetches                      | `86400000` (1d)   | No                       |
| `CACHE_TTL_BLS_NODATA_MS`       | TTL for BLS "no data" responses                     | `3600000` (1h)    | No                       |
| `CACHE_TTL_CENSUS_MS`           | TTL for Census successful fetches                   | `86400000` (1d)   | No                       |
| `CACHE_TTL_CENSUS_NODATA_MS`    | TTL for Census "no data" responses                  | `3600000` (1h)    | No                       |
| `CACHE_TTL_OECD_MS`             | TTL for OECD successful fetches                     | `86400000` (1d)   | No                       |
| `CACHE_TTL_OECD_NODATA_MS`      | TTL for OECD "no data" responses                    | `3600000` (1h)    | No                       |
| `CACHE_TTL_IMF_MS`              | TTL for IMF successful fetches                      | `86400000` (1d)   | No                       |
| `CACHE_TTL_IMF_NODATA_MS`       | TTL for IMF "no data" responses                     | `3600000` (1h)    | No                       |
|                                 |                                                     |                     |                          |
| **Premium API Keys (Planned)**  |                                                     |                     |                          |
| `MARKET_DATA_API_KEY`           | Generic key for a primary paid provider             | -                   | For future use           |
| `IBISWORLD_API_KEY`             | For IBISWorld                                       | -                   | For future premium sources |
| `STATISTA_API_KEY`              | For Statista                                        | -                   | For future premium sources |

### Data Sources and API Configuration
The server now integrates 8 free data sources. The `DataService` attempts to route `getMarketSize` requests intelligently (e.g., using AlphaVantage for stock symbols if `industryId` matches a symbol pattern, Census for NAICS codes) and provides a `getSpecificDataSourceData` method for direct access to any data source's capabilities. This method is exposed via the new `generic_data_query` tool.

#### Integrated Free Data Sources:
- **Alpha Vantage**: Company financials, stock data (market cap via `OVERVIEW`). (Requires `ALPHA_VANTAGE_API_KEY`)
- **BLS (Bureau of Labor Statistics)**: Employment, wages, economic indicators. (Optional `BLS_API_KEY`)
- **Census Bureau**: Demographic and economic data (e.g., County Business Patterns). (Requires `CENSUS_API_KEY`)
- **FRED (Federal Reserve Economic Data)**: Broad economic indicators. (Requires `FRED_API_KEY`)
- **IMF (International Monetary Fund)**: Global economic and financial data. (Public access)
- **Nasdaq Data Link (Quandl)**: Diverse financial and economic datasets. (Requires `NASDAQ_DATA_LINK_API_KEY`)
- **OECD**: International comparative statistics. (Public access)
- **World Bank**: Global development and economic data. (Public access)

#### Planned Premium Data Sources:
Integration with these premium sources is planned for future releases to provide even more in-depth analysis:
- **IBISWorld**
- **Statista**
- **Grand View Research**
- **Bloomberg**
- **PitchBook**

> **💡 Tip**: If you're experiencing issues with API keys not being recognized or services showing as disabled, see the [Troubleshooting](#-troubleshooting) section for common solutions.

## 🏗 Architecture

### Project Structure
The project structure includes dedicated services for each data source and a central configuration:
```
src/
├── config/
│   └── apiConfig.ts          # Centralized API endpoint configurations (New)
├── index.ts                  # Main entry point
├── server.ts                 # Express server setup
├── types/
│   ├── index.ts              # Zod schemas and core TypeScript types
│   ├── dataSources.ts        # Data source specific interfaces
│   └── cache.ts              # Cache-related types
├── tools/
│   └── market-tools.ts       # MCP tool implementations (MarketAnalysisTools class)
├── services/
│   ├── dataService.ts        # Main data orchestrator service
│   ├── cache/
│   │   ├── cacheService.ts     # In-memory caching logic
│   │   └── persistenceService.ts # File-based persistence for cache
│   └── dataSources/
│       ├── alphaVantageService.ts # Alpha Vantage client
│       ├── blsService.ts       # Bureau of Labor Statistics client
│       ├── censusService.ts    # Census Bureau client
│       ├── fredService.ts      # Federal Reserve client
│       ├── imfService.ts       # IMF client
│       ├── nasdaqDataService.ts # Nasdaq Data Link client
│       ├── oecdService.ts      # OECD client
│       └── worldBankService.ts # World Bank client
└── utils/
    ├── index.ts              # Main export for utility functions
    ├── dataTransform.ts      # Data transformation utilities
    ├── envHelper.ts          # Environment variable parsing (New)
    ├── rateLimit.ts          # Rate limiting utilities
    └── logger.ts             # Winston logging utility

tests/
├── integration/
│   ├── services/
│   │   ├── dataService.integration.test.ts # (New)
│   │   └── live/                             # (New directory)
│   │       ├── worldBankService.live.test.ts # (New)
│   │       ├── oecdService.live.test.ts      # (New)
│   │       └── imfService.live.test.ts       # (New)
│   └── tools/
│       └── marketAnalysisTools.integration.test.ts # (New)
# ... (rest of tests structure)
```

### Data Caching Strategy
The server employs a comprehensive caching system with per-source configurable TTLs via environment variables (see Configuration section).

#### Current Implementation
**In-Memory Cache (`CacheService`)**:
- Fast NodeCache-based in-memory store with comprehensive features
- Configurable Time-To-Live (TTL) for each cache entry
- Pattern-based cache invalidation and bulk operations
- Cache statistics tracking (hits, misses, size, hit rate)
- Automatic periodic cleanup and statistics logging
- Support for get/set/delete/flush operations with advanced features

#### Advanced Caching Options
For production deployments, the server supports **enhanced caching architectures**:

**Redis Cache Integration (`EnhancedDataService`)**:
- Drop-in Redis replacement for in-memory cache
- Distributed caching across multiple server instances
- Persistent cache that survives server restarts
- Advanced features: clustering, sentinel support, distributed invalidation
- Hybrid fallback: Redis + Memory for maximum reliability

**Configuration Examples**:
```typescript
// Basic memory cache (current default)
const dataService = new DataService();

// Redis cache (production recommended)
const dataService = new EnhancedDataService({
  cache: { type: 'redis' },
  apiKeys: { /* your API keys */ }
});

// Hybrid cache (maximum reliability)
const dataService = new EnhancedDataService({
  cache: { type: 'hybrid' },
  apiKeys: { /* your API keys */ }
});
```

This architecture ensures optimal performance with configurable caching strategies suitable for development through enterprise production environments.

### Technology Stack
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Protocol**: MCP 2024-11-05 Specification
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Testing**: Vitest for modern ES module testing
- **API Testing**: Postman collection for comprehensive endpoint testing
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 🧪 Testing

### Test Organization
The project uses a professional test structure with Vitest as the primary testing framework:

```
tests/
├── unit/                    # Fast, isolated component tests
├── integration/            # Component interaction tests
├── e2e/                   # End-to-end workflow tests
├── scripts/               # Integration test scripts
│   ├── test-comprehensive-integration.mjs
│   ├── test-http-streaming.mjs
│   ├── test-simple-mcp.mjs
│   └── test-mcp-tool-calls.mjs
├── fixtures/              # Test data and mock objects
├── utils/                 # Test utilities and helpers
└── setup.ts              # Vitest global configuration
```

### Running Tests

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
node tests/scripts/test-comprehensive-integration.mjs
node tests/scripts/test-http-streaming.mjs
```

### API Testing with Postman

Import the comprehensive Postman collection for testing both MCP endpoints and backend API integrations:

#### **MCP Server Testing Collection**
1. **Import Collection**: `examples/TAM-MCP-Server-Postman-Collection.json`
2. **Set Environment Variables**:
   - `serverUrl`: http://localhost:3000
   - `sessionId`: (automatically set after initialization)
3. **Run Tests**:
   - Health check and server status
   - MCP session initialization
   - All 11 market analysis tools
   - Resource access endpoints
   - Session management and cleanup

#### **Backend API Testing Collection**
For comprehensive testing of external API integrations:

1. **Import Collection**: `TAM-MCP-Server-Postman-Collection.json`
2. **Import Environment**: `tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json`
3. **Configure API Keys**: Add your API keys to the environment variables
4. **Run Tests**:
   - 🔑 **Premium APIs**: Alpha Vantage, Census, FRED, Nasdaq Data Link
   - 🌍 **Public APIs**: World Bank, OECD, IMF, BLS
   - 🔧 **Health Checks**: Service availability testing
   - 🧪 **Test Scenarios**: Complete market analysis workflows

#### **Newman CLI Testing**
Automate Postman tests from command line:
```bash
# Install Newman
npm install -g newman

# Run backend API tests
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json \
  --reporters cli,json

# Or use npm script
npm run test:postman
```

### Test Coverage
- **Unit Level**: Individual tool functionality and business logic
- **Integration Level**: MCP protocol compliance and server behavior
- **System Level**: Complete workflows through real transports
- **API Level**: REST endpoints and session management
- **Performance**: Response time and resource usage monitoring

Code coverage reports are generated in the `coverage/` directory. Live API tests are separate and should be run judiciously.

## 📊 Monitoring & Observability
- **Logging**: Structured logs output to console and/or `logs/` directory.
- **Metrics**: Prometheus-compatible metrics exposed at `/metrics`.

## 🔒 Security
- **Input Validation**: Zod schemas validate all incoming requests.
- **Rate Limiting**: Basic rate limiting is implemented.
- **CORS**: Configurable Cross-Origin Resource Sharing.
- **Session Management**: Secure session handling.

### API Key Management
- API keys for external data sources are configured via environment variables (see "Environment Variables" section).
- Ensure the `.env` file is secured and not committed to version control.
- The application is designed to function with missing optional API keys, though data availability from those sources will be impacted or disabled.

## 🚀 Deployment
The server can be deployed using Docker (recommended) or directly via Node.js. Refer to platform-specific deployment guides.

## 🔧 Troubleshooting

### Common Issues

#### 🚫 Data Sources Showing as Disabled Despite Having API Keys
**Symptom**: Status shows fewer enabled services than expected (e.g., "4/8 services enabled" instead of "8/8")

**Cause**: Environment variable loading order issue where services are initialized before `.env` file is loaded.

**Solution**: This issue was fixed in the June 11, 2025 release. Ensure you're using the latest version where `dotenv.config()` is called before any service imports.

**Verification**: Check the startup logs for service status:
```
📊 Status: 8/8 services enabled
✅ Enabled: Alpha Vantage, Census Bureau, FRED, Nasdaq Data Link, BLS, World Bank, OECD, IMF
```

#### 🔌 MCP Inspector Connection Issues
**Symptom**: JSON parsing errors or "Invalid JSON" messages in MCP Inspector

**Cause**: Console output contaminating stdout JSON-RPC communication

**Solution**: 
- Use the correct command: `npx @modelcontextprotocol/inspector node dist/stdio-simple.js`
- Ensure all console.log() statements use console.error() for stderr output
- Check that Winston logger is configured with `stderrLevels`

#### 🔑 API Key Configuration Issues
**Symptom**: Services showing as disabled despite adding API keys to `.env`

**Steps to resolve**:
1. Verify `.env` file is in the project root directory
2. Check API key variable names match exactly:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   CENSUS_API_KEY=your_key_here
   FRED_API_KEY=your_key_here
   NASDAQ_API_KEY=your_key_here
   BLS_API_KEY=your_key_here
   ```
3. Restart the server after adding new API keys
4. Check startup logs for service initialization messages

#### 🏗️ Build Errors
**Symptom**: TypeScript compilation failures

**Common solutions**:
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (v20.x recommended)
- Clear build cache: `rm -rf dist && npm run build`
- Verify all import statements include `.js` extensions for ES modules

#### 🐳 Docker Issues
**Symptom**: Container fails to start or can't access environment variables

**Solutions**:
- Ensure `.env` file exists and is properly formatted
- Use `--env-file .env` flag when running container
- Check container logs: `docker logs <container-id>`
- Verify port mapping: `-p 3000:3000`

#### 📊 No Data Returned from Tools
**Symptom**: Tools execute but return empty or error responses

**Debugging steps**:
1. Check service status in startup logs
2. Verify API quotas haven't been exceeded
3. Test individual data sources using `generic_data_query` tool
4. Check network connectivity and firewall settings
5. Review service-specific error logs

### Getting Help
If you encounter issues not covered here:
1. Check the [Release Notes](doc/RELEASE-NOTES.md) for recent fixes
2. Search existing [GitHub Issues](https://github.com/gvaibhav/TAM-MCP-Server/issues)
3. Create a new issue with:
   - Error messages and logs
   - Environment details (Node.js version, OS)
   - Steps to reproduce
   - Configuration (without sensitive API keys)

## 🤝 Contributing
Contributions are welcome! Please see [Contributing Guide](doc/guides/CONTRIBUTING.md) and adhere to the Code of Conduct.

## 📜 Documentation
- **API Documentation**: Available at the `/docs` endpoint when the server is running (if Swagger/OpenAPI is integrated).
- **MCP Specification**: [MCP 2024-11-05](https://modelcontextprotocol.org/)
- **Release Notes**: See [Release Notes](doc/reference/RELEASE-NOTES.md).

## 🔄 Changelog
See [Changelog](doc/reference/CHANGELOG.md) for a detailed history of changes.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Support
If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/gvaibhav/TAM-MCP-Server/issues).

## 📚 Documentation

### Complete Documentation
- **[Documentation Hub](doc/README.md)** - Complete guide to all project documentation
- **[Release Notes](doc/reference/RELEASE-NOTES.md)** - Detailed change history and version information
- **[Contributing Guide](doc/guides/CONTRIBUTING.md)** - Guidelines for contributors and developers
- **[API Testing](examples/TAM-MCP-Server-Postman-Collection.json)** - Postman collection for comprehensive API testing

### Testing Documentation
- **[Test Organization](doc/guides/TEST-ORGANIZATION.md)** - Professional test suite structure
- **[Integration Tests](tests/scripts/README.md)** - Integration test scripts documentation
- **[Test Reports](doc/reports/INTEGRATION-TEST-FINAL-REPORT.md)** - Comprehensive testing results

### Examples & Scripts
- **[Examples Directory](examples/README.md)** - API examples and integration resources
- **[Development Scripts](scripts/)** - Build and setup automation scripts

### Implementation Guides
- **[HTTP Streaming Report](doc/reports/HTTP-STREAMING-TEST-REPORT.md)** - HTTP transport implementation details
- **[Notifications Guide](doc/guides/NOTIFICATIONS-IMPLEMENTATION.md)** - Real-time notification system
- **[Security Policy](doc/guides/SECURITY.md)** - Security guidelines and vulnerability reporting

## ✨ Acknowledgments
- Thanks to the Model Context Protocol community.
- Gratitude to the providers of free data APIs.

---

**Created by [Vaibhav Gupta](https://github.com/gvaibhav) with ❤️ for the market research and business intelligence community**
