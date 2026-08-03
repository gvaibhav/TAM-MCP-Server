# Change Request: Portfolio Rebalancing Data Sources Integration

**Date**: August 3, 2026  
**Branch**: `feature/portfolio-rebalancing-datasources`  
**Status**: 🔄 Proposed  
**Priority**: Medium  
**Target Release**: v1.1.0

---

## 📋 Overview

Extend TAM-MCP-Server with additional free/freemium data source integrations to support portfolio rebalancing applications. Current system provides 7/8 economic & market data sources; this CR proposes adding complementary data for real-time quotes, cryptocurrency, forex, and sentiment analysis.

---

## 🎯 Objectives

1. Add real-time stock & ETF price streaming via WebSocket
2. Integrate cryptocurrency market data (Bitcoin, Ethereum, altcoins)
3. Add forex & commodity price feeds
4. Incorporate sentiment analysis & ESG scoring
5. Maintain free/freemium tier focus for developer accessibility

---

## 📊 Proposed Data Sources

### Tier 1: High Impact (Recommended)

#### 1. **Finnhub** 
- **Type**: Real-time stock data + sentiment + ESG
- **Free Tier**: Generous limits + WebSocket streaming
- **Key Features**:
  - Real-time quotes for 50+ symbols (free)
  - Company fundamentals & financials
  - ESG scores
  - Market news & sentiment
  - Alternative data (congressional trades, insider transactions)
- **Rate Limits**: WebSocket streaming included
- **Integration Effort**: Low (REST + WebSocket)

#### 2. **CoinGecko**
- **Type**: Cryptocurrency market data
- **Free Tier**: 10,000 calls/month, no API key required
- **Key Features**:
  - Real-time prices for 3,000+ cryptocurrencies
  - 365+ days historical data
  - Market cap, volume, volatility metrics
  - No authentication required
- **Rate Limits**: 100 requests/min
- **Integration Effort**: Very Low (simple REST)

#### 3. **ExchangeRate.host**
- **Type**: Forex & precious metals
- **Free Tier**: Unlimited, no key needed
- **Key Features**:
  - Real-time forex rates (160+ currencies)
  - Precious metals (gold, silver, platinum)
  - Historical rates
  - Sub-second response times
- **Rate Limits**: Rate-limited but generous
- **Integration Effort**: Very Low

### Tier 2: Nice to Have (Phase 2)

#### 4. **Twelve Data**
- **Type**: Global ETF & mutual fund data
- **Coverage**: 12,000 instruments across 50 countries
- **Features**: Real-time streaming, holdings breakdown

#### 5. **Tiingo**
- **Type**: High-quality historical data
- **Coverage**: 30+ years of backtesting data
- **Features**: Adjusted close prices, corporate actions

#### 6. **ESG Analytics**
- **Type**: NLP-driven ESG sentiment
- **Features**: Proprietary "ESG Pulse" scores
- **Use Case**: Sustainable portfolio rebalancing

---

## 🏗️ Implementation Plan

### Phase 1: Foundation (Sprint 1-2)
```
1. Add Finnhub integration (REST + optional WebSocket)
2. Add CoinGecko integration (REST only)
3. Add ExchangeRate.host integration (REST only)
4. Create validation script for new sources
5. Update environment configuration (.env.example)
6. Extend health checks to include new sources
```

### Phase 2: Enhancement (Sprint 3-4)
```
1. Add Twelve Data ETF support
2. Implement Tiingo historical data
3. Add ESG Analytics sentiment scoring
4. Build composite portfolio metrics endpoint
```

### Phase 3: Integration (Sprint 5+)
```
1. Create portfolio rebalancing recommendation engine
2. Build real-time dashboard endpoints
3. Implement caching strategy for rate limiting
4. Add WebSocket streaming support
```

---

## 📝 Technical Considerations

### Architecture Changes
- Add new service modules in `src/services/`:
  - `finnhubService.ts`
  - `cryptoService.ts` (CoinGecko)
  - `forexService.ts` (ExchangeRate.host)
  - `sentimentService.ts` (ESG Analytics)
- Extend existing `httpGet` helpers for compression & retries
- Add portfolio rebalancing logic

### API Key Management
- Update `.env.example` with new optional keys
- Add configuration validation
- Document fallback behavior when keys missing

### Rate Limiting Strategy
- Implement request queuing per API
- Cache responses (configurable TTL)
- Graceful degradation if API unreachable

### Data Format Standardization
- Normalize price data across sources
- Convert timestamps to ISO 8601
- Handle missing/null values consistently

---

## 📊 Compatibility Matrix

| Source | REST | WebSocket | Historical | Real-Time | Free Tier | No Key Required |
|--------|------|-----------|-----------|-----------|-----------|-----------------|
| Finnhub | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (free key) |
| CoinGecko | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| ExchangeRate.host | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Twelve Data | ✅ | ✅ | ✅ | ✅ | ✅ (limited) | ❌ |
| Tiingo | ✅ | ❌ | ✅ | ⚠️ | ✅ (limited) | ❌ |
| ESG Analytics | ✅ | ❌ | ❌ | ✅ | ✅ (limited) | ❌ |

---

## 🔌 API Endpoint Examples

### New Endpoints (Proposed)

```bash
# Real-time stock prices
GET /api/v1/stocks/price?symbols=AAPL,MSFT

# Cryptocurrency prices
GET /api/v1/crypto/prices?symbols=BTC,ETH

# Forex rates
GET /api/v1/forex/rates?from=USD&to=EUR,GBP,JPY

# Sentiment analysis
GET /api/v1/sentiment?symbols=AAPL&source=news

# Portfolio metrics
POST /api/v1/portfolio/rebalance
{
  "holdings": [
    { "symbol": "AAPL", "qty": 100, "allocation": 0.30 },
    { "symbol": "BTC", "qty": 0.5, "allocation": 0.20 }
  ],
  "target_allocation": { "stocks": 0.60, "crypto": 0.20, "forex": 0.10, "commodities": 0.10 }
}
```

---

## 📈 Expected Benefits

### For Developers
- Single MCP server for comprehensive portfolio rebalancing
- Real-time, streaming data capabilities
- Unified API for 13+ market data sources
- No need to juggle multiple API keys

### For Users
- Better asset diversification insights
- Sentiment-driven rebalancing recommendations
- Global currency & commodity integration
- Automated rebalancing workflows

### For Business
- Competitive advantage over single-asset solutions
- Attracts fintech/robo-advisor integrations
- Positions TAM-MCP as portfolio intelligence hub

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **API rate limits** | High | Implement caching layer + request queuing |
| **Third-party API downtime** | Medium | Circuit breaker + fallback sources |
| **Data inconsistency** | Medium | Normalization layer + validation |
| **Key management complexity** | Low | Extend existing .env pattern |
| **Scope creep** | High | Phase in strictly - v1.1 = 3 sources only |

---

## 📋 Testing Strategy

### Unit Tests
```
✓ Finnhub adapter (mock API responses)
✓ CoinGecko adapter (mock prices)
✓ ExchangeRate.host adapter (mock rates)
✓ Data normalization functions
```

### Integration Tests
```
✓ Live API calls (with rate limit awareness)
✓ Caching behavior
✓ Error handling & retries
✓ Portfolio rebalancing calculations
```

### E2E Tests
```
✓ Full portfolio endpoint with real data
✓ WebSocket streaming (Finnhub)
✓ Cross-source price aggregation
```

---

## 📅 Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1 | 2 weeks | 3 source integrations + validation |
| Phase 2 | 2 weeks | 3 additional sources |
| Phase 3 | 3 weeks | Portfolio rebalancing engine |
| **Total** | **~7 weeks** | **v1.1.0 release** |

---

## 🔄 Rollback Plan

If any source integration causes issues:
1. Feature flag to disable problematic source
2. Revert to previous commit (git revert)
3. Update health check to mark source as "unavailable"
4. Document issue in GitHub issues

All new sources are optional - system remains functional at 7/8 core sources.

---

## 👥 Stakeholders

- **Development**: Implement adapters, testing
- **QA**: Integration & load testing
- **Documentation**: API docs, setup guides
- **Product**: Timeline & feature prioritization

---

## 📎 References

- Research: [Free Financial Data APIs 2026](https://blog.apilayer.com/12-best-financial-market-apis-for-real-time-data-in-2026/)
- Finnhub Docs: https://finnhub.io/
- CoinGecko Docs: https://www.coingecko.com/en/api/documentation
- ExchangeRate.host: https://exchangerate.host/

---

## ✅ Approval Checklist

- [ ] Technical Lead Review
- [ ] Product Manager Approval
- [ ] Estimated effort validated
- [ ] No critical blockers identified
- [ ] Stakeholder alignment

---

## 📝 Notes

- **Start Date**: Pending approval
- **Owner**: Portfolio Rebalancing Squad
- **Related Issues**: #future-enhancement
- **Depends On**: Existing TAM-MCP-Server v1.0.1 stable

---

## 🎯 Success Criteria

✅ All 3 Phase 1 sources integrated and tested  
✅ Health check passes for all sources  
✅ Documentation complete  
✅ No performance regression  
✅ At least 1 external integration validates success  

---

**Document Version**: 1.0  
**Last Updated**: August 3, 2026  
**Status**: 🟡 Ready for Review
