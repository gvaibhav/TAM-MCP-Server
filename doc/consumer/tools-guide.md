# Tool Usage Guide

## Overview

The TAM MCP Server provides a comprehensive set of market analysis capabilities organized into three main categories:

## 🚀 Capabilities Overview

### 📝 MCP Prompts (15 prompts) ⭐ **NEW**
Professional business analysis templates for investment-grade analysis:
- **Strategic Business Analysis**: Startup funding, PE research, corporate strategy
- **Crisis & Specialized Analysis**: Crisis management, regulatory impact, ESG analysis  
- **Quick Analysis & Guidance**: Market opportunity scan, competitive intelligence

### 🔧 MCP Tools (28 tools)

#### 1. Direct Data Access Tools (13 tools)

Direct access to external data sources:

- **Alpha Vantage Tools**: Stock data, company financials (`alphaVantage_getCompanyOverview`, `alphaVantage_searchSymbols`)
- **FRED Tools**: Economic indicators, interest rates (`fred_getSeriesObservations`)
- **World Bank Tools**: Development indicators, country data (`worldBank_getIndicatorData`)
- **Census Tools**: Demographics, business statistics (`census_fetchIndustryData`, `census_fetchMarketSize`)
- **BLS Tools**: Employment, labor statistics (`bls_getSeriesData`)
- **OECD Tools**: Economic data, policy indicators (`oecd_getDataset`, `oecd_getLatestObservation`)
- **IMF Tools**: International financial data (`imf_getDataset`, `imf_getLatestObservation`)
- **Nasdaq Tools**: Market data feeds (`nasdaq_getDatasetTimeSeries`, `nasdaq_getLatestDatasetValue`)

#### 2. Basic Market Tools (4 tools)

Foundational market analysis capabilities:

- **Industry Search**: Basic industry data retrieval (`industry_search`)
- **TAM Calculator**: Basic Total Addressable Market calculations (`tam_calculator`)
- **Market Size Calculator**: Market size estimation (`market_size_calculator`)
- **Company Financials**: Financial statement retrieval (`company_financials_retriever`)

#### 3. Business Analysis Tools (11 tools)

Advanced market intelligence and comprehensive analysis:

- **Enhanced Industry Analysis**: Multi-source industry insights (`industry_analysis`)
- **Industry Data**: Detailed industry intelligence with trends, ESG, players (`industry_data`)
- **Market Size Analysis**: Advanced market size estimation (`market_size`)
- **Advanced TAM Analysis**: Sophisticated TAM calculations with scenarios (`tam_analysis`)
- **SAM Calculator**: Serviceable Addressable Market analysis (`sam_calculator`)
- **Market Segments**: Hierarchical market segmentation (`market_segments`)
- **Market Forecasting**: Time series forecasting with scenarios (`market_forecasting`)
- **Market Comparison**: Multi-market comparative analysis (`market_comparison`)
- **Data Validation**: Cross-source data quality validation (`data_validation`)
- **Market Opportunities**: Market gap and opportunity identification (`market_opportunities`)
- **Generic Data Query**: Direct data source service access (`generic_data_query`)

### 📊 MCP Resources (3 resources)

System monitoring and configuration status:

- **Server Health**: Real-time server status monitoring
- **Configuration Status**: API connectivity and setup validation  
- **API Status**: External service availability tracking

## 🚀 Getting Started

### For MCP Prompts

1. **Browse Available Prompts**: See the [MCP Prompts Guide](mcp-prompts-guide.md)
2. **Choose Analysis Type**: Select from Strategic, Crisis, or Quick Analysis categories
3. **Use in MCP Client**: Access via `@tam-server` in Claude Desktop or MCP client

### For MCP Tools

1. **Choose Your Approach**: Review the [Tool System Selection Guide](../TOOL-SYSTEM-SELECTION-GUIDE.md)
2. **Set Up Testing**: Follow the [Postman Guide](postman-guide.md)
3. **Configure APIs**: Get your [API Keys](getting-api-keys.md)

## 📖 Detailed Documentation

For complete documentation and examples, see:

- **[MCP Prompts Guide](mcp-prompts-guide.md)** - Professional business analysis templates
- **[MCP Integration Guide](mcp-integration.md)** - Protocol setup and configuration
- [Design Architecture](../DESIGN-ARCHITECTURE.md) - Technical details
- [Backend API Testing](../BACKEND-API-TESTING.md) - Integration testing
- [Examples](../../examples/) - Practical usage examples
