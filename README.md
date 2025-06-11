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

A comprehensive **Model Context Protocol (MCP)** server for market sizing analysis, TAM/SAM calculations, and industry research. Built with TypeScript, Express.js, and following the MCP 2024-11-05 specification.

**The server now integrates 8 free data sources (World Bank, FRED, Alpha Vantage, Nasdaq Data Link, BLS, Census, OECD, IMF) providing real-time market insights. It features an advanced DataService for orchestration, a flexible generic_data_query tool, and configurable caching.**

## 🚀 Features

### Core Capabilities
- **11 Specialized Market Analysis Tools** (including new `generic_data_query`) for comprehensive market research.
- **Full Integration with 8 Free Data Sources**: BLS, Census, FRED, World Bank, OECD, IMF, Alpha Vantage, Nasdaq Data Link.
- **Advanced `DataService` Orchestration**: Intelligent routing for `getMarketSize` (symbol/NAICS detection) and direct data access via `getSpecificDataSourceData`.
- **HTTP Streamable Transport** with Server-Sent Events for real-time updates.
- **MCP Resource Support** with documentation access through protocol.
- **Advanced Caching System**: In-memory and persistent (JSON file) layers, with per-source configurable TTLs via environment variables.
- **Comprehensive Logging** with structured Winston logging and business metrics.
- **Prometheus Metrics** for monitoring and observability.
- **Enterprise Security** with rate limiting, CORS, and input validation.
- **Session Management** for stateful interactions.

### Available Resources
- **`/`**: Root endpoint with server information and health check.
- **`/mcp`**: Main MCP endpoint for tool interactions.
- **`/docs`**: Serves API documentation (OpenAPI/Swagger).
- **`/metrics`**: Prometheus metrics endpoint.

### Market Analysis Tools
The server provides the following tools accessible via the `/mcp` endpoint:
1.  `industry_search`: Search for industries.
2.  `industry_data`: Get detailed industry information (now supports fetching additional data from specific sources).
3.  `market_size`: Retrieve market size data (now attempts multiple sources).
4.  `tam_calculator`: Calculate Total Addressable Market.
5.  `sam_calculator`: Calculate Serviceable Addressable/Obtainable Market.
6.  `market_segments`: Analyze market segmentation.
7.  `market_forecasting`: Generate market size forecasts.
8.  `market_comparison`: Compare multiple markets.
9.  `data_validation`: Validate market data.
10. `market_opportunities`: Identify market opportunities.
11. **`generic_data_query` (New)**: Directly query any integrated data source service and method.

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
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Update the variables in `.env` as needed (see Configuration section).
4.  **Build the project:**
    ```bash
    npm run build
    ```
5.  **Run the server:**
    ```bash
    npm start
    ```
    The server will typically be available at `http://localhost:3000`.

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
The server employs a two-tier caching strategy with per-source configurable TTLs via environment variables (see Configuration section).
1.  **In-Memory Cache (`CacheService`)**:
    *   Primary cache using a fast in-memory store.
    *   Configurable Time-To-Live (TTL) for each cache entry.
    *   Tracks cache hits, misses, and size.
2.  **Persistent Cache (`PersistenceService`)**:
    *   Secondary cache layer that persists data to the local filesystem (`.cache_data/` directory).
    *   Helps retain cached data across server restarts.
    *   Data freshness is managed by the TTL set when data is initially cached.

This strategy ensures that frequently accessed data is served quickly, while less frequent data can still be retrieved from persistence or fetched anew from external APIs if expired.

### Technology Stack
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Protocol**: MCP 2024-11-05 Specification
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Testing**: Jest for unit, integration, and live API tests
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 🧪 Testing
Run tests with:
```bash
npm test # Runs all tests (unit, integration)
npm run test:unit
npm run test:integration
npm run test:live # For live API tests (use with caution)
npm run test:coverage
```
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
- **📋 For detailed registration instructions, see [API Registration Guide](doc/API-REGISTRATION-GUIDE.md)**
- Ensure the `.env` file is secured and not committed to version control.
- The application is designed to function with missing optional API keys, though data availability from those sources will be impacted or disabled.

## 🚀 Deployment
The server can be deployed using Docker (recommended) or directly via Node.js. Refer to platform-specific deployment guides.

## 🤝 Contributing
Contributions are welcome! Please see `CONTRIBUTING.md` and adhere to the Code of Conduct.

## 📜 Documentation
- **API Documentation**: Available at the `/docs` endpoint when the server is running (if Swagger/OpenAPI is integrated).
- **MCP Specification**: [MCP 2024-11-05](https://modelcontextprotocol.org/)
- **Release Notes**: See `doc/RELEASE-NOTES.md`.

## 🔄 Changelog
See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Support
If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/gvaibhav/TAM-MCP-Server/issues).

## ✨ Acknowledgments
- Thanks to the Model Context Protocol community.
- Gratitude to the providers of free data APIs.

---

**Created by [Vaibhav Gupta](https://github.com/gvaibhav) with ❤️ for the market research and business intelligence community**
