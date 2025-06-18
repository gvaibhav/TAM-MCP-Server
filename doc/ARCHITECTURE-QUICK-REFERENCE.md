# TAM MCP Server: Architecture Quick Reference

---

## 🏗️ Dual Tool System Architecture

### System 1: MCP Data Access Tools
- **Location**: `src/tools/tool-definitions.ts`
- **Count**: 17 tools (13 direct + 4 basic market)
- **Purpose**: Direct data source access + basic market analysis
- **Users**: Developers, data engineers, custom analytics

### System 2: Business Analysis Tools
- **Location**: `src/tools/market-tools.ts`
- **Count**: 11 tools
- **Purpose**: Business intelligence and market analysis
- **Users**: Business analysts, researchers, investment teams

---

## 📊 Tool Inventory

### MCP Data Access Tools (17)

#### Direct Data Source Access (13)
1. `alphaVantage_getCompanyOverview`
2. `alphaVantage_searchSymbols`
3. `bls_getSeriesData`
4. `census_fetchIndustryData`
5. `census_fetchMarketSize`
6. `fred_getSeriesObservations`
7. `imf_getDataset`
8. `imf_getLatestObservation`
9. `nasdaq_getDatasetTimeSeries`
10. `nasdaq_getLatestDatasetValue`
11. `oecd_getDataset`
12. `oecd_getLatestObservation`
13. `worldBank_getIndicatorData`

#### Basic Market Analysis (4)
14. `industry_search`
15. `tam_calculator`
16. `market_size_calculator`
17. `company_financials_retriever`

### Business Analysis Tools (11)
1. `industry_analysis` (enhanced multi-source analysis)
2. `industry_data`
3. `market_size`
4. `tam_analysis` (advanced TAM with scenarios)
5. `sam_calculator`
6. `market_segments`
7. `market_forecasting`
8. `market_comparison`
9. `data_validation`
10. `market_opportunities`
11. `generic_data_query`

---

## 🔧 Data Sources (8 Integrated)

| Source | Status | API Key Required | Free Tier |
|--------|--------|------------------|-----------|
| Alpha Vantage | Active | Yes | Limited |
| BLS | Active | Optional | Yes |
| Census Bureau | Active | Optional | Yes |
| FRED | Active | Yes | Limited |
| IMF | Active | No | Yes |
| Nasdaq Data Link | Active | Yes | Limited |
| OECD | Active | No | Yes |
| World Bank | Active | No | Yes |

---

## 🚀 Quick Usage Examples

### Data Access Tool
```javascript
// Raw company data from Alpha Vantage
const companyData = await client.callTool("alphaVantage_getCompanyOverview", {
  symbol: "AAPL"
});
```

### Business Analysis Tool
```javascript
// Processed industry intelligence
const industryInsights = await client.callTool("industry_data", {
  industry_id: "tech-software",
  include_trends: true,
  include_esg: true
});
```

---

## 📚 Documentation Structure

### Key Documents
- **[Design Architecture](doc/DESIGN-ARCHITECTURE.md)**: Complete technical architecture
- **[Tool Selection Guide](doc/TOOL-SYSTEM-SELECTION-GUIDE.md)**: How to choose tools
- **[Implementation Review](doc/COMPREHENSIVE-IMPLEMENTATION-REVIEW.md)**: Current status analysis
- **[Main README](README.md)**: Project overview and quick start

### Navigation
- **Users**: Start with Tool Selection Guide
- **Developers**: Review Design Architecture
- **Integrators**: Check API Testing Guide
- **Contributors**: See Contributing Guide

---

## Implementation Features

### Infrastructure
- **Caching**: Multi-layer with configurable TTLs
- **Error Handling**: Comprehensive with graceful degradation
- **Logging**: Structured Winston logging
- **Security**: Input validation, rate limiting
- **Testing**: Comprehensive market tool test coverage

### MCP Compliance
- **STDIO Transport**: Claude Desktop compatible
- **HTTP Transport**: Full streaming support
- **Protocol**: MCP 2024-11-05 specification
- **Tools**: JSON Schema validation
- **Resources**: Documentation access

### Performance
- **Response Times**: Optimized for fast responses
- **Concurrency**: Multi-user support
- **Scalability**: Configurable resource limits
- **Reliability**: Health checks and monitoring

---

## 📡 Enhanced Notification System

### Notification Types (6)
1. **Data Source Health** 🏥 - API monitoring & rate limits
2. **Market Intelligence** 📈 - Business insights & opportunities  
3. **Data Quality** 🔍 - Quality scores & confidence tracking
4. **Cache Performance** 💾 - Performance optimization alerts
5. **Calculation Milestones** 🎯 - TAM/SAM completion events
6. **API Rate Limits** ⏰ - Proactive throttling alerts

### Integration Points
- **Server Integration**: Full MCP capabilities with notifications support
- **SSE Transport**: Real-time notification delivery
- **HTTP Transport**: Streamable notification responses
- **Tool Integration**: Automatic notifications across all 28 tools

### Business Value
- **Real-time Intelligence**: Immediate market insight alerts
- **Proactive Monitoring**: Data source health & performance tracking
- **Quality Assurance**: Transparent data confidence scoring
- **Operational Visibility**: Complete calculation audit trails

---
