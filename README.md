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

**The server now integrates several free data sources to provide real-time market insights, alongside its existing mock data capabilities and planned support for premium data providers.**

## 🚀 Features

### Core Capabilities
- **10 Specialized Market Analysis Tools** for comprehensive market research
- **Integration with Free Data Sources** (BLS, Census, FRED, World Bank, OECD, IMF, Alpha Vantage, Nasdaq Data Link)
- **HTTP Streamable Transport** with Server-Sent Events for real-time updates
- **MCP Resource Support** with documentation access through protocol
- **Advanced Caching System** with in-memory and persistent (JSON file) layers, configurable TTL, and performance optimization.
- **Comprehensive Logging** with structured Winston logging and business metrics
- **Prometheus Metrics** for monitoring and observability
- **Enterprise Security** with rate limiting, CORS, and input validation
- **Session Management** for stateful interactions

### Available Resources
- **`/`**: Root endpoint with server information and health check.
- **`/mcp`**: Main MCP endpoint for tool interactions.
- **`/docs`**: Serves API documentation (OpenAPI/Swagger).
- **`/metrics`**: Prometheus metrics endpoint.

### Market Analysis Tools
The server provides the following tools accessible via the `/mcp` endpoint:
1.  **`industry_search`**: Search for industries.
2.  **`industry_data`**: Get detailed industry information.
3.  **`market_size`**: Retrieve market size data.
4.  **`tam_calculator`**: Calculate Total Addressable Market.
5.  **`sam_calculator`**: Calculate Serviceable Addressable/Obtainable Market.
6.  **`market_segments`**: Analyze market segmentation.
7.  **`market_forecasting`**: Generate market size forecasts.
8.  **`market_comparison`**: Compare multiple markets.
9.  **`data_validation`**: Validate market data.
10. **`market_opportunities`**: Identify market opportunities.

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

Update your `.env` file with the following variables. API keys are required for some free data sources to function.

| Variable                  | Description                                      | Default         | Required                 |
|---------------------------|--------------------------------------------------|-----------------|--------------------------|
| `PORT`                    | Server port                                      | `3000`          | No                       |
| `HOST`                    | Server host                                      | `0.0.0.0`       | No                       |
| `NODE_ENV`                | Environment                                      | `development`   | No                       |
| `CORS_ORIGIN`             | CORS origin                                      | `*`             | No                       |
| `RATE_LIMIT_MAX`          | Rate limit per window                            | `100`           | No                       |
| `CACHE_TTL`               | Default Cache TTL for in-memory cache (seconds)  | `300`           | No                       |
| `SESSION_SECRET`          | Session secret key                               | -               | **Yes**                  |
| `LOG_LEVEL`               | Logging level                                    | `info`          | No                       |
|                           |                                                  |                 |                          |
| **Free Data Source API Keys** |                                                  |                 |                          |
| `BLS_API_KEY`             | API Key for Bureau of Labor Statistics (BLS)     | -               | Recommended for BLS data |
| `CENSUS_API_KEY`          | API Key for Census Bureau                        | -               | Recommended for Census data|
| `FRED_API_KEY`            | API Key for Federal Reserve Economic Data (FRED) | -               | **Yes** for FRED data    |
| `ALPHA_VANTAGE_API_KEY`   | API Key for Alpha Vantage                        | -               | Recommended for Alpha Vantage |
| `NASDAQ_DATA_LINK_API_KEY`| API Key for Nasdaq Data Link (Quandl)            | -               | Recommended for Nasdaq data|
|                           | *Note: World Bank, OECD, IMF generally do not require API keys for public data.* |                 |                          |
|                           |                                                  |                 |                          |
| **Premium Data Source API Keys (Planned)** |                                  |                 |                          |
| `MARKET_DATA_API_KEY`     | Generic key for a primary paid data provider     | -               | For future premium sources |
| `IBISWORLD_API_KEY`       | For IBISWorld                                    | -               | For future premium sources |
| `STATISTA_API_KEY`        | For Statista                                     | -               | For future premium sources |

### Data Sources and API Configuration

The server now integrates a variety of data sources, prioritizing free APIs for broad accessibility.

#### Integrated Free Data Sources:
These sources are used by the `DataService` to fetch real-time information. Ensure API keys are set up in your `.env` file for services that require them.
- **Bureau of Labor Statistics (BLS)**: Employment, wage data, productivity metrics. (Requires `BLS_API_KEY`)
  - API: `https://www.bls.gov/developers/api_signature_v2.shtml`
- **Census Bureau**: Demographic and economic census data. (Requires `CENSUS_API_KEY`)
  - API: `https://www.census.gov/data/developers/data-sets.html`
- **Federal Reserve Economic Data (FRED)**: Economic indicators. (Requires `FRED_API_KEY`)
  - API: `https://fred.stlouisfed.org/docs/api/fred/`
- **World Bank**: Global economic and development data. (No API key generally required)
  - API: `https://datahelpdesk.worldbank.org/knowledgebase/articles/889392`
- **OECD**: International economic statistics. (No API key generally required)
  - API: `https://data.oecd.org/api/`
- **IMF**: International monetary data. (No API key generally required)
  - API: `https://datahelp.imf.org/knowledgebase/articles/667681`
- **Alpha Vantage**: Financial and market data (free tier has limits, e.g., 500 calls/day). (Requires `ALPHA_VANTAGE_API_KEY`)
  - API: `https://www.alphavantage.co/documentation/`
- **Nasdaq Data Link (formerly Quandl)**: Economic and financial datasets. (Requires `NASDAQ_DATA_LINK_API_KEY`)
  - API: `https://docs.data.nasdaq.com/`

The system respects free tier limits and employs caching to optimize API usage.

#### Planned Premium Data Sources:
Integration with these premium sources is planned for future releases to provide even more in-depth analysis:
- **IBISWorld**
- **Statista**
- **Grand View Research**
- **Bloomberg**
- **PitchBook**

## 🏗 Architecture

### Project Structure
The project structure has been updated to support multiple data sources and enhanced caching:
```
src/
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
│       ├── blsService.ts       # Bureau of Labor Statistics client
│       ├── censusService.ts    # Census Bureau client
│       ├── fredService.ts      # Federal Reserve client
│       ├── worldBankService.ts # World Bank client
│       ├── oecdService.ts      # OECD client
│       ├── imfService.ts       # IMF client
│       ├── alphaVantageService.ts # Alpha Vantage client
│       └── nasdaqDataService.ts # Nasdaq Data Link client
└── utils/
    ├── index.ts              # Main export for utility functions
    ├── dataTransform.ts      # Data transformation utilities (New)
    ├── rateLimit.ts          # Rate limiting utilities (New)
    └── logger.ts             # Winston logging utility
```

### Data Caching Strategy
The server employs a two-tier caching strategy to optimize performance and minimize API calls:
1.  **In-Memory Cache (`CacheService`)**:
    *   Primary cache using a fast in-memory store (currently a `Map`-based implementation).
    *   Configurable Time-To-Live (TTL) for each cache entry. Default TTL can be set via `CACHE_TTL` environment variable.
    *   Tracks cache hits, misses, and size.
2.  **Persistent Cache (`PersistenceService`)**:
    *   Secondary cache layer that persists data to the local filesystem.
    *   Currently uses JSON files stored in the `.cache_data` directory (this directory should be added to `.gitignore`).
    *   Helps retain cached data across server restarts.
    *   Data freshness is managed by the TTL set when data is initially cached. Expired data in persistence is not served and is removed.

This strategy ensures that frequently accessed data is served quickly, while less frequent data can still be retrieved from persistence or fetched anew from external APIs if expired.

### Technology Stack
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Protocol**: MCP 2024-11-05 Specification
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Testing**: Jest for unit and integration tests
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 🧪 Testing
Run tests with:
```bash
npm test
```
This will execute unit tests and integration tests. Code coverage reports are generated in the `coverage/` directory.

## 📊 Monitoring & Observability
- **Logging**: Structured logs are output to the console and/or configured log files.
- **Metrics**: Prometheus-compatible metrics are exposed at the `/metrics` endpoint.
  Key metrics include:
  - `mcp_requests_total`: Total number of MCP requests.
  - `mcp_request_duration_seconds`: Duration of MCP requests.
  - `cache_hits_total`, `cache_misses_total`: Cache performance.
  - `api_calls_total`: Calls to external data source APIs.

## 🔒 Security
- **Input Validation**: All incoming requests are validated using Zod schemas.
- **Rate Limiting**: Basic rate limiting is implemented to prevent abuse.
- **CORS**: Configurable Cross-Origin Resource Sharing.
- **Error Handling**: Standardized error responses.
- **Session Management**: Secure session handling with HTTP-only cookies.

### API Key Management
- API keys for external data sources are configured via environment variables (see "Environment Variables" section).
- Ensure `.env` file is secured and not committed to version control.
- The application is designed to function with missing optional API keys, though data availability from those sources will be impacted.

## 🚀 Deployment
The server can be deployed using various methods:
- **Docker**: Recommended for containerized environments.
- **Node.js process**: Directly run the built application.
- **Serverless platforms**: Adaptable for serverless functions (may require modifications).

Refer to platform-specific deployment guides for detailed instructions.

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test`).
6.  Commit your changes (`git commit -m 'Add some feature'`).
7.  Push to the branch (`git push origin feature/your-feature`).
8.  Open a pull request.

Please adhere to the existing code style and ensure your commits are descriptive.

## 📜 Documentation
- **API Documentation**: Available at the `/docs` endpoint when the server is running.
- **MCP Specification**: [MCP 2024-11-05](https://modelcontextprotocol.org/)

## 🔄 Changelog
See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Support
If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/gvaibhav/TAM-MCP-Server/issues).

## ✨ Acknowledgments
- Thanks to the Model Context Protocol community.
- Inspired by various market analysis tools and platforms.

---

**Created by [Vaibhav Gupta](https://github.com/gvaibhav) with ❤️ for the market research and business intelligence community**
