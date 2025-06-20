# MCP Notifications User Guide

This guide explains how to configure and receive MCP (Model Context Protocol) notifications from the TAM-MCP-Server's enhanced notification system.

## Overview

The TAM-MCP-Server implements the MCP notification specification to provide real-time updates during market analysis operations. The server sends 6 types of business-specific notifications that provide valuable insights into:

- **Market Intelligence**: Real-time alerts about market trends and opportunities
- **Data Source Health**: Performance monitoring of API endpoints and rate limits
- **Calculation Milestones**: TAM/SAM calculation completion events with results
- **Data Quality**: Confidence scoring and validation results
- **Cache Performance**: System performance optimization insights
- **API Rate Limits**: Proactive alerts for quota management

## Configuration

For MCP client setup and configuration, see the [MCP Integration Guide](./mcp-integration.md).

Once your MCP client is configured, notifications will be automatically delivered through the MCP protocol. No additional setup is required.

## Notification Types

### 1. Data Source Health Notifications

**Method**: `notifications/data_source_health`

Monitor the health and performance of data sources (Alpha Vantage, BLS, Census, FRED, IMF, Nasdaq, OECD, World Bank).

```javascript
// Example notification
{
  "method": "notifications/data_source_health",
  "params": {
    "source": "alpha_vantage",
    "status": "healthy",
    "latency_ms": 150,
    "last_successful_call": "2025-06-20T10:00:00Z",
    "rate_limit_remaining": 450,
    "message": "API responding normally with good performance",
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

**Status Values:**
- `healthy`: Normal operation
- `degraded`: Slower than usual
- `unavailable`: Service down
- `rate_limited`: Quota exceeded

### 2. Market Intelligence Notifications

**Method**: `notifications/market_intelligence`

Real-time alerts about market trends, anomalies, and opportunities discovered during analysis.

```javascript
// Example notification
{
  "method": "notifications/market_intelligence",
  "params": {
    "type": "trend_detected",
    "industry": "Artificial Intelligence",
    "insight": "AI market experiencing unprecedented 50% YoY growth",
    "severity": "critical",
    "data_confidence": 0.95,
    "affected_calculations": ["market_size", "tam_calculation"],
    "recommendation": "Consider updating TAM calculations for AI-adjacent industries",
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

**Severity Levels:**
- `critical`: Immediate attention required
- `high`: Important market development
- `medium`: Notable trend or change
- `low`: Minor market information

### 3. Calculation Milestone Notifications

**Method**: `notifications/calculation_milestone`

TAM/SAM calculation completion events with comprehensive results and insights.

```javascript
// Example notification
{
  "method": "notifications/calculation_milestone",
  "params": {
    "type": "tam_calculated",
    "industry": "Software as a Service",
    "market_size_usd": 650000000000,
    "confidence_level": 0.88,
    "methodology": "Bottom-up addressable population analysis",
    "data_sources": ["alpha_vantage", "bls", "census"],
    "key_assumptions": [
      "Enterprise digital transformation continues",
      "Cloud adoption reaches 85% by 2026"
    ],
    "risk_factors": [
      "Economic recession impact",
      "Market saturation in core segments"
    ],
    "execution_time_ms": 3250,
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

### 4. Data Quality Notifications

**Method**: `notifications/data_quality`

Quality assessment and confidence tracking for data validation and reliability.

```javascript
// Example notification
{
  "method": "notifications/data_quality",
  "params": {
    "type": "high_confidence",
    "affected_calculations": ["tam_analysis", "market_forecasting"],
    "quality_score": 0.88,
    "data_sources": ["alpha_vantage", "bls", "census"],
    "cross_source_variance": 5.2,
    "confidence_factors": ["Multiple sources agree", "Recent data available"],
    "quality_warnings": [],
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

### 5. Cache Performance Notifications

**Method**: `notifications/cache_performance`

Monitor cache hit rates and performance optimizations.

```javascript
// Example notification
{
  "method": "notifications/cache_performance",
  "params": {
    "type": "cache_hit",
    "cache_key": "tam_calculation:saas:2024",
    "hit_rate": 0.85,
    "performance_impact": "positive",
    "time_saved_ms": 2500,
    "memory_usage_mb": 12.5,
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

### 6. API Rate Limit Notifications

**Method**: `notifications/api_rate_limit`

Proactive monitoring of API quotas and usage patterns.

```javascript
// Example notification
{
  "method": "notifications/api_rate_limit",
  "params": {
    "provider": "Alpha Vantage",
    "endpoint": "/query?function=OVERVIEW",
    "rate_limit_type": "approaching",
    "current_usage": 420,
    "limit": 500,
    "reset_time": "2025-06-20T11:00:00Z",
    "suggested_action": "Consider throttling requests or caching results",
    "timestamp": "2025-06-20T10:00:00Z"
  }
}
```

## Implementation Examples

### Basic Notification Handling

```javascript
// Handle all TAM MCP Server notifications
client.setNotificationHandler((notification) => {
  const { method, params } = notification;
  
  switch (method) {
    case 'notifications/market_intelligence':
      handleMarketInsight(params);
      break;
    case 'notifications/calculation_milestone':
      handleCalculationComplete(params);
      break;
    case 'notifications/data_source_health':
      handleDataSourceHealth(params);
      break;
    case 'notifications/data_quality':
      handleDataQuality(params);
      break;
    case 'notifications/cache_performance':
      handleCacheUpdate(params);
      break;
    case 'notifications/api_rate_limit':
      handleRateLimit(params);
      break;
  }
});
```

### Business Intelligence Integration

```javascript
// Market intelligence processing
function handleMarketInsight(params) {
  if (params.severity === 'critical' || params.severity === 'high') {
    // Send to business dashboard
    updateMarketDashboard({
      industry: params.industry,
      insight: params.insight,
      confidence: params.data_confidence
    });
      // Alert stakeholders
    sendSlackAlert(`Market Alert: ${params.insight} (${Math.round(params.data_confidence * 100)}% confidence)`);
  }
}

// TAM calculation completion
function handleCalculationComplete(params) {
  if (params.type === 'tam_calculated') {
    // Update business metrics
    updateTAMDashboard({
      industry: params.industry,
      marketSize: params.market_size_usd,
      confidence: params.confidence_level
    });
    
    // Log milestone
    console.log(`TAM Calculated: ${params.industry} = $${(params.market_size_usd / 1e9).toFixed(1)}B`);
  }
}
```

### Monitoring and Alerting

```javascript
// System health monitoring
function handleDataSourceHealth(params) {
  // Update monitoring dashboard
  updateServiceStatus(params.source, params.status, params.latency_ms);
  
  if (params.status === 'degraded' || params.status === 'unavailable') {
    // Send alert to operations team
    sendPagerDutyAlert({
      title: `Data Source Issue: ${params.source}`,
      description: params.message,
      severity: params.status === 'unavailable' ? 'critical' : 'warning'
    });
  }
}

// Rate limit management
function handleRateLimit(params) {
  if (params.rate_limit_type === 'approaching') {
    // Automatically throttle requests
    rateLimiter.setProvider(params.provider, 'throttled');
    
    console.warn(`⚠️ Rate limit approaching for ${params.provider}: ${params.current_usage}/${params.limit}`);
  }
}
```

### Dashboard Integration

```javascript
// Real-time dashboard updates
function updateMarketDashboard(data) {
  // Update Tableau/PowerBI datasource
  tableau.refreshDataSource('market_intelligence');
  
  // Update custom dashboard
  websocket.broadcast('market_update', data);
  
  // Store in analytics database
  analytics.track('market_insight', data);
}

// Performance metrics
function updateServiceStatus(source, status, latency) {
  // Send to Prometheus/Grafana
  prometheus.gauge('data_source_latency')
    .labels({ source })
    .set(latency);
    
  // Update service map
  serviceMap.updateStatus(source, status);
}
```

## Use Cases

### 1. Business Analyst Workflow

**Scenario**: Daily market research with real-time insights

```javascript
// Monitor for high-confidence market opportunities
client.setNotificationHandler((notification) => {
  if (notification.method === 'notifications/market_intelligence' && 
      notification.params.severity === 'high' &&
      notification.params.data_confidence > 0.85) {
    
    // Automatically generate analysis report
    generateMarketReport(notification.params);
    
    // Schedule analyst review
    scheduleAnalystReview(notification.params.industry);
  }
});
```

### 2. Investment Team Dashboard

**Scenario**: Real-time market size tracking for investment decisions

```javascript
// Track TAM calculations for investment pipeline
client.setNotificationHandler((notification) => {
  if (notification.method === 'notifications/calculation_milestone' && 
      notification.params.market_size_usd > 1e9) { // $1B+ markets
    
    // Update investment pipeline
    updateInvestmentPipeline({
      industry: notification.params.industry,
      tam: notification.params.market_size_usd,
      confidence: notification.params.confidence_level
    });
    
    // Notify investment committee
    if (notification.params.market_size_usd > 10e9) { // $10B+ markets
      notifyInvestmentCommittee(notification.params);
    }
  }
});
```

### 3. Operations Team Monitoring

**Scenario**: Proactive system health management

```javascript
// Monitor data source health and performance
client.setNotificationHandler((notification) => {
  if (notification.method === 'notifications/data_source_health') {
    const { source, status, latency_ms } = notification.params;
    
    // Update service status page
    updateStatusPage(source, status);
    
    // Performance alerting
    if (latency_ms > 5000) { // 5+ second responses
      createIncident(`Slow response from ${source}: ${latency_ms}ms`);
    }
    
    // Capacity planning
    trackCapacityMetrics(source, notification.params);
  }
});
```

## Troubleshooting

### Common Issues

#### Not Receiving Notifications

- Verify your MCP client properly implements the notification handler
- Check that the server has `notifications: {}` capability enabled
- Ensure your client is using the correct transport

#### Missing Specific Notification Types

- Different tools trigger different notification types
- Execute market analysis tools to see calculation milestone notifications
- Use tools with API calls to see data source health notifications

#### High Notification Volume

- Filter notifications by severity level in your handler
- Implement notification batching for high-frequency updates
- Focus on `critical` and `high` severity market intelligence only

### Debug Mode

Enable debug logging to see all notifications:

```javascript
client.setNotificationHandler((notification) => {
  console.log('DEBUG: Received notification:', JSON.stringify(notification, null, 2));
  // Your notification handling logic
});
```

## Related Documentation

- [Notifications Implementation](../guides/NOTIFICATIONS-IMPLEMENTATION.md) - Technical implementation details
- [MCP Integration Guide](./mcp-integration.md) - General MCP setup
- [Tools Guide](./tools-guide.md) - Tool execution triggers notifications
- [Getting Started Guide](./getting-started.md) - Initial setup instructions

## Best Practices

1. **Filter by Severity**: Focus on `critical` and `high` severity notifications to avoid noise
2. **Batch Processing**: Group similar notifications to prevent overwhelming dashboards
3. **Automated Responses**: Set up automatic responses for rate limit and health notifications
4. **Historical Tracking**: Store notifications for trend analysis and performance monitoring
5. **Alert Routing**: Route different notification types to appropriate teams/systems

The MCP notification system transforms the TAM-MCP-Server from a simple data provider into an intelligent business intelligence platform that actively monitors, analyzes, and alerts you to critical market developments and system performance.
