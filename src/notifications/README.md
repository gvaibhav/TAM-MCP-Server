# Enhanced MCP Notifications for TAM Server

This directory contains the enhanced notification system for the TAM (Total Addressable Market) MCP Server, providing real-time insights and monitoring capabilities for market analysis operations.

## Overview

The enhanced notification system extends the basic MCP notification capabilities with business-specific notifications tailored for market analysis, data source monitoring, and performance optimization.

## Notification Types

### 1. 🔍 Data Source Health Notifications
**Method**: `notifications/data_source_health`

Monitor the health, performance, and rate limits of backend data sources.

```typescript
interface DataSourceHealthNotification {
  source: "alpha_vantage" | "bls" | "census" | "fred" | "imf" | "nasdaq" | "oecd" | "worldbank";
  status: "healthy" | "degraded" | "unavailable" | "rate_limited";
  latency_ms: number;
  last_successful_call: string;
  rate_limit_remaining?: number;
  message: string;
  timestamp: string;
}
```

**Example**:
```javascript
{
  "source": "alpha_vantage",
  "status": "healthy",
  "latency_ms": 150,
  "last_successful_call": "2025-06-17T10:00:00Z",
  "rate_limit_remaining": 450,
  "message": "API responding normally with good performance",
  "timestamp": "2025-06-17T10:00:00Z"
}
```

### 2. 🧠 Market Intelligence Notifications
**Method**: `notifications/market_intelligence`

Alert about market trends, anomalies, forecasts, and business insights.

```typescript
interface MarketIntelligenceNotification {
  type: "market_alert" | "trend_detected" | "anomaly_found" | "forecast_update";
  industry: string;
  severity: "low" | "medium" | "high" | "critical";
  insight: string;
  data_confidence: number;
  source_count: number;
  affected_metrics: string[];
  recommendation?: string;
  timestamp: string;
}
```

**Example**:
```javascript
{
  "type": "trend_detected",
  "industry": "Artificial Intelligence",
  "severity": "high",
  "insight": "AI market showing 35% YoY growth, significantly above 25% forecast",
  "data_confidence": 0.92,
  "source_count": 5,
  "affected_metrics": ["market_size", "growth_rate", "investment_flow"],
  "recommendation": "Consider updating TAM calculations for AI-adjacent industries",
  "timestamp": "2025-06-17T10:00:00Z"
}
```

### 3. ✅ Data Quality Notifications
**Method**: `notifications/data_quality`

Track data freshness, conflicts between sources, and confidence levels.

```typescript
interface DataQualityNotification {
  type: "stale_data" | "missing_data" | "conflicting_sources" | "high_confidence" | "low_confidence";
  affected_calculations: string[];
  quality_score: number; // 0-1 scale
  recommendation: string;
  sources_checked: string[];
  variance_percentage?: number;
  timestamp: string;
}
```

**Example**:
```javascript
{
  "type": "conflicting_sources",
  "affected_calculations": ["calculate_tam", "forecast_market"],
  "quality_score": 0.65,
  "recommendation": "Use weighted average with higher weight on government sources",
  "sources_checked": ["Census Bureau", "BLS", "Industry Association"],
  "variance_percentage": 15.2,
  "timestamp": "2025-06-17T10:00:00Z"
}
```

### 4. ⚡ Cache Performance Notifications
**Method**: `notifications/cache_performance`

Monitor cache hit rates, performance improvements, and memory usage.

```typescript
interface CachePerformanceNotification {
  type: "cache_hit" | "cache_miss" | "cache_invalidated" | "cache_warming";
  cache_key: string;
  hit_rate: number; // 0-1 scale
  performance_impact: "positive" | "negative" | "neutral";
  time_saved_ms?: number;
  memory_usage_mb?: number;
  timestamp: string;
}
```

**Example**:
```javascript
{
  "type": "cache_hit",
  "cache_key": "tam_calculation:saas:2024",
  "hit_rate": 0.85,
  "performance_impact": "positive",
  "time_saved_ms": 2500,
  "memory_usage_mb": 12.5,
  "timestamp": "2025-06-17T10:00:00Z"
}
```

### 5. 🎯 Calculation Milestone Notifications
**Method**: `notifications/calculation_milestone`

Celebrate major TAM/SAM calculations with detailed business context.

```typescript
interface CalculationMilestoneNotification {
  type: "tam_calculated" | "sam_refined" | "forecast_generated" | "validation_completed" | "opportunity_identified";
  calculation_id: string;
  industry: string;
  market_size_usd: number;
  confidence_level: number; // 0-1 scale
  methodology: string;
  key_assumptions: string[];
  risk_factors?: string[];
  competitive_analysis?: {
    direct_competitors: number;
    market_concentration: number;
  };
  timestamp: string;
}
```

**Example**:
```javascript
{
  "type": "tam_calculated",
  "calculation_id": "tam_saas_2024_001",
  "industry": "Software as a Service",
  "market_size_usd": 650000000000,
  "confidence_level": 0.88,
  "methodology": "Bottom-up addressable population analysis",
  "key_assumptions": [
    "Enterprise digital transformation continues",
    "Cloud adoption reaches 85% by 2026",
    "Average SaaS spend grows 20% annually"
  ],
  "risk_factors": [
    "Economic recession impact",
    "Increased competition",
    "Market saturation in core segments"
  ],
  "competitive_analysis": {
    "direct_competitors": 2500,
    "market_concentration": 0.35
  },
  "timestamp": "2025-06-17T10:00:00Z"
}
```

### 6. 🚨 API Rate Limit Notifications
**Method**: `notifications/api_rate_limit`

Proactive monitoring of API quotas and usage patterns.

```typescript
interface APIRateLimitNotification {
  provider: string;
  endpoint: string;
  rate_limit_type: "approaching" | "exceeded" | "reset";
  current_usage: number;
  limit: number;
  reset_time: string;
  suggested_action: string;
  timestamp: string;
}
```

**Example**:
```javascript
{
  "provider": "Alpha Vantage",
  "endpoint": "/query?function=OVERVIEW",
  "rate_limit_type": "approaching",
  "current_usage": 420,
  "limit": 500,
  "reset_time": "2025-06-17T11:00:00Z",
  "suggested_action": "Consider throttling requests or caching results",
  "timestamp": "2025-06-17T10:00:00Z"
}
```

## Usage

### Basic Integration

```typescript
import { NotificationService, TamNotificationIntegration } from './notifications/index.js';

// Initialize the notification system
const notificationService = new NotificationService(server);
const tamNotifications = new TamNotificationIntegration(notificationService);

// Use in your tools
await tamNotifications.notifyMarketInsight(
  "Cloud Computing",
  "Exceptional growth detected: 45% YoY increase",
  "critical",
  0.94
);
```

### Comprehensive TAM Analysis Notification

```typescript
// Notify about completed TAM analysis with all context
await tamNotifications.notifyTamAnalysisComplete(
  "Software as a Service",
  650000000000, // $650B
  0.88, // 88% confidence
  "Bottom-up analysis",
  ["alpha_vantage", "bls", "census"],
  ["Cloud adoption continues", "Enterprise spending grows"],
  ["Economic downturn", "Competition"],
  3250 // execution time ms
);
```

### MCP Client Listening

```javascript
// Listen to enhanced notifications in MCP clients
mcpClient.onNotification('notifications/market_intelligence', (params) => {
  if (params.severity === 'critical') {
    // Trigger urgent analysis or alert analysts
    handleCriticalMarketInsight(params);
  }
});

mcpClient.onNotification('notifications/data_source_health', (params) => {
  if (params.status === 'degraded') {
    // Switch to backup data source
    handleDataSourceFailure(params);
  }
});
```

## Benefits

### For Analysts
- **Real-time Market Insights**: Get notified about significant market trends and opportunities
- **Data Quality Monitoring**: Understand confidence levels and data source reliability
- **Calculation Milestones**: Celebrate successful TAM/SAM analyses with rich context

### For Developers
- **API Health Monitoring**: Track performance and rate limits across all data sources
- **Cache Optimization**: Monitor hit rates and performance improvements
- **Proactive Error Handling**: Get early warnings about data source issues

### For Business Intelligence
- **Automated Dashboards**: Real-time updates for market size calculations
- **Trend Detection**: Automated alerts for significant market changes
- **Data Governance**: Quality scores and source reliability tracking

## Implementation Files

- `notification-service.ts` - Core notification service with enhanced types
- `tam-notification-integration.ts` - Business-specific notification methods
- `enhanced-mcp-examples.ts` - Comprehensive examples and usage patterns
- `index.ts` - Exports for easy integration

## Integration Examples

### Slack Integration
```javascript
mcpClient.onNotification('notifications/market_intelligence', async (params) => {
  if (params.severity === 'high' || params.severity === 'critical') {
    await slack.sendMessage('#market-analysis', 
      `📈 Market Alert: ${params.insight} (${(params.data_confidence * 100).toFixed(1)}% confidence)`
    );
  }
});
```

### Tableau/PowerBI Integration
```javascript
mcpClient.onNotification('notifications/calculation_milestone', async (params) => {
  if (params.type === 'tam_calculated') {
    await tableau.refreshDataSource('market_sizing_dashboard');
    await powerbi.refreshDataset('tam_calculations');
  }
});
```

### Monitoring Systems
```javascript
mcpClient.onNotification('notifications/data_source_health', async (params) => {
  await prometheus.gauge('data_source_latency')
    .labels({ source: params.source })
    .set(params.latency_ms);
    
  await newrelic.recordMetric('DataSource/Health', {
    source: params.source,
    status: params.status,
    latency: params.latency_ms
  });
});
```

## Best Practices

1. **Filter by Severity**: Only surface high/critical market intelligence to avoid notification fatigue
2. **Aggregate Cache Metrics**: Batch cache performance notifications to avoid spam
3. **Set Quality Thresholds**: Only notify on data quality issues below certain thresholds
4. **Rate Limit Alerts**: Throttle similar notifications to prevent overwhelming users
5. **Rich Context**: Always include actionable recommendations with notifications

## Future Enhancements

- Notification batching and aggregation
- Custom notification rules and filtering
- Integration with external alerting systems
- Historical notification analytics
- Machine learning-powered insight generation

This enhanced notification system transforms the TAM MCP Server from a simple calculation tool into a comprehensive market intelligence platform with real-time insights and monitoring capabilities.
