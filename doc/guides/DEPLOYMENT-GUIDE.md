# TAM MCP Server - Deployment and Usage Guide

## Overview

The TAM MCP Server provides comprehensive market analysis tools covering 8 major economic data sources. This guide will help you deploy and use the server.

## Implementation Summary

### Features
- **Market Analysis Tools**: Tools covering multiple data sources
- **8 Data Source Integrations**: Alpha Vantage, BLS, Census, FRED, IMF, Nasdaq, OECD, World Bank
- **MCP Protocol Compliance**: Full MCP SDK integration with proper tool definitions
- **Input/Output Validation**: Comprehensive Zod schemas for all tools
- **Caching System**: Multi-layer caching with configurable TTLs
- **Error Handling**: Robust error management with user-friendly messages
- **Logging**: Structured logging with Winston
- **Testing**: Health checks and validation scripts

## 🚀 Quick Start

### 1. Build and Test
```bash
cd /path/to/TAM-MCP-Server
npm run build
npm run test:api-health
```

### 2. Start the Server
```bash
# For Claude Desktop or MCP Inspector
npm start

# The server will output:
# Starting TAM MCP Server (STDIO transport)...
# info: TAM MCP Server initialized
```

### 3. Configure MCP Client

#### Claude Desktop Configuration
Add to your Claude Desktop `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tam-analysis": {
      "command": "node",
      "args": ["/path/to/TAM-MCP-Server/dist/index.js"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your-key-here",
        "FRED_API_KEY": "your-key-here"
      }
    }
  }
}
```

#### VS Code MCP Extension
1. Install the MCP extension for VS Code
2. Add server configuration pointing to the built server
3. Set environment variables for API keys

## 🔑 API Key Configuration

### Required for Full Functionality
```bash
# Edit .env file
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FRED_API_KEY=your_fred_key
BLS_API_KEY=your_bls_key
```

### Free API Key Sources
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **FRED**: https://fred.stlouisfed.org/docs/api/api_key.html
- **BLS**: https://www.bls.gov/developers/api_signature_v2.htm

### Public APIs (No Key Required)
- World Bank, IMF, OECD, Census: Work without authentication
- Nasdaq Data Link: Some datasets require keys, others are public

## 📋 Available Tools

### Direct Data Access (17 tools)
| Tool | Description | Data Source |
|------|-------------|-------------|
| `alphaVantage_getCompanyOverview` | Company financials and overview | Alpha Vantage |
| `alphaVantage_searchSymbols` | Search stock symbols | Alpha Vantage |
| `bls_getSeriesData` | Employment statistics | Bureau of Labor Statistics |
| `census_fetchIndustryData` | Industry demographics | U.S. Census Bureau |
| `census_fetchMarketSize` | Market size from surveys | U.S. Census Bureau |
| `fred_getSeriesObservations` | Economic indicators | Federal Reserve |
| `imf_getDataset` | Global economic data | International Monetary Fund |
| `imf_getLatestObservation` | Latest IMF observations | International Monetary Fund |
| `nasdaq_getDatasetTimeSeries` | Financial time series | Nasdaq Data Link |
| `nasdaq_getLatestDatasetValue` | Latest financial values | Nasdaq Data Link |
| `oecd_getDataset` | OECD statistics | OECD |
| `oecd_getLatestObservation` | Latest OECD data | OECD |
| `worldBank_getIndicatorData` | Development indicators | World Bank |

### Analytical Tools (4 tools)
| Tool | Description | Purpose |
|------|-------------|---------|
| `tam_calculator` | Total Addressable Market calculation | Market sizing |
| `market_size_calculator` | Current market size estimation | Market analysis |
| `company_financials_retriever` | Company financial analysis | Due diligence |
| `industry_search` | Cross-source industry search | Research |

## 🧪 Testing and Validation

### Health Check
```bash
npm run test:api-health
```
Expected output: 6-8 APIs accessible (87.5%+ success rate)

### Tool Listing Test
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```
Expected: JSON response with 28 tools

### Integration Test
```bash
node scripts/tool-test.mjs  # If implemented
```

## 📖 Usage Examples

### Example 1: Get Company Overview
```json
{
  "tool": "alphaVantage_getCompanyOverview",
  "arguments": {
    "symbol": "AAPL"
  }
}
```

### Example 2: Calculate TAM
```json
{
  "tool": "tam_calculator",
  "arguments": {
    "industry": "cloud_computing",
    "market_segments": ["enterprise", "smb"],
    "geographic_scope": "US",
    "time_horizon": 5
  }
}
```

### Example 3: Search Industry Data
```json
{
  "tool": "industry_search",
  "arguments": {
    "query": "artificial intelligence",
    "data_sources": ["alpha_vantage", "fred", "census"],
    "filters": {
      "geographic_scope": "US",
      "time_period": {
        "start": "2023-01-01",
        "end": "2024-12-31"
      }
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Module Not Found Errors
```bash
npm run build  # Rebuild the project
```

#### 2. API Connectivity Issues
```bash
npm run test:api-health  # Check API status
```

#### 3. Rate Limiting
- Configure rate limits in `.env`
- Use caching to reduce API calls
- Implement exponential backoff

#### 4. Missing API Keys
- Some tools will return mock data
- Check `.env` configuration
- Verify API key validity

### Debug Mode
```bash
NODE_ENV=development npm start
```

## 🔄 Continuous Monitoring

### Health Monitoring
```bash
# Check server health
curl -X GET http://localhost:3000/health

# Monitor logs
tail -f logs/combined.log
```

### Performance Metrics
- Cache hit rates logged automatically
- API response times tracked
- Error rates monitored

## 🎯 Next Steps

1. **Production Deployment**: Configure production environment variables
2. **Scaling**: Implement Redis caching for multi-instance deployments
3. **Monitoring**: Add Prometheus metrics and Grafana dashboards
4. **Security**: Configure API rate limiting and authentication
5. **Documentation**: Create API documentation with OpenAPI/Swagger

## Support

- **Issues**: GitHub Issues tracker
- **Documentation**: `/doc` directory
- **API Reference**: Built-in tool schemas via MCP protocol
- **Health Check**: `npm run test:api-health`

---
