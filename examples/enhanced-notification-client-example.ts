#!/usr/bin/env node

/**
 * Enhanced MCP Notification Client Example
 * 
 * This script shows how MCP clients can consume and react to
 * the enhanced business-relevant notifications from the TAM MCP Server.
 * 
 * Features shown:
 * - Real-time notification consumption
 * - Business-specific notification filtering
 * - Automated responses to critical alerts
 * - Performance monitoring and alerting
 * - Notification batching and routing
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { EventEmitter } from "events";

interface NotificationEvent {
  method: string;
  params: any;
  timestamp: string;
  severity?: "low" | "medium" | "high" | "critical";
}

class EnhancedNotificationClient extends EventEmitter {
  private client: Client;
  private transport: StdioClientTransport;
  private notificationQueue: NotificationEvent[] = [];
  private criticalAlerts: NotificationEvent[] = [];
  private performanceMetrics: Map<string, any> = new Map();
  private isConnected: boolean = false;

  constructor() {
    super();
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["../src/index.ts"],
    });
    this.client = new Client({
      name: "enhanced-notification-client",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
        notifications: {},
      },
    });

    this.setupNotificationHandlers();
  }

  /**
   * Set up handlers for different types of notifications
   */
  private setupNotificationHandlers(): void {
    // Data Source Health Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/data_source_health",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "data_source_health",
          params,
          timestamp: new Date().toISOString(),
          severity: this.determineDataSourceSeverity(params),
        };

        await this.handleDataSourceHealth(notification);
        this.emit("notification", notification);
      },
    });

    // Market Intelligence Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/market_intelligence",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "market_intelligence",
          params,
          timestamp: new Date().toISOString(),
          severity: params.severity || "medium",
        };

        await this.handleMarketIntelligence(notification);
        this.emit("notification", notification);
      },
    });

    // Data Quality Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/data_quality",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "data_quality",
          params,
          timestamp: new Date().toISOString(),
          severity: this.determineDataQualitySeverity(params),
        };

        await this.handleDataQuality(notification);
        this.emit("notification", notification);
      },
    });

    // Cache Performance Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/cache_performance",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "cache_performance",
          params,
          timestamp: new Date().toISOString(),
          severity: this.determineCacheSeverity(params),
        };

        await this.handleCachePerformance(notification);
        this.emit("notification", notification);
      },
    });

    // Calculation Milestone Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/calculation_milestone",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "calculation_milestone",
          params,
          timestamp: new Date().toISOString(),
          severity: this.determineCalculationSeverity(params),
        };

        await this.handleCalculationMilestone(notification);
        this.emit("notification", notification);
      },
    });

    // API Rate Limit Notifications
    this.client.setNotificationHandler({
      method: "tam/notifications/api_rate_limit",
      handler: async (params: any) => {
        const notification: NotificationEvent = {
          method: "api_rate_limit",
          params,
          timestamp: new Date().toISOString(),
          severity: params.rate_limit_type === "exceeded" ? "critical" : "high",
        };

        await this.handleRateLimit(notification);
        this.emit("notification", notification);
      },
    });

    // Generic progress and error notifications
    this.client.setNotificationHandler({
      method: "notifications/progress",
      handler: async (params: any) => {
        console.log(`📊 Progress: ${params.message} (${params.progress}/${params.total})`);
      },
    });

    this.client.setNotificationHandler({
      method: "notifications/message",
      handler: async (params: any) => {
        console.log(`💬 Message: ${params.text}`);
      },
    });
  }

  /**
   * Handle data source health notifications
   */
  private async handleDataSourceHealth(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n🏥 DATA SOURCE HEALTH: ${params.source}`);
    console.log(`   Status: ${params.status}`);
    console.log(`   Latency: ${params.latency_ms}ms`);
    console.log(`   Last Success: ${params.last_successful_call}`);

    // Track performance metrics
    const sourceKey = `${params.source}_health`;
    this.performanceMetrics.set(sourceKey, {
      status: params.status,
      latency: params.latency_ms,
      lastUpdate: new Date().toISOString(),
    });

    // Auto-response for critical issues
    if (params.status === "failed" || params.latency_ms > 10000) {
      this.criticalAlerts.push(notification);
      console.log(`   🚨 CRITICAL: Escalating data source issue for ${params.source}`);
      
      // In a real implementation, this could:
      // - Send alerts to monitoring systems
      // - Switch to backup data sources
      // - Throttle requests to the problematic source
      await this.escalateCriticalAlert(notification);
    }
  }

  /**
   * Handle market intelligence notifications
   */
  private async handleMarketIntelligence(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n📈 MARKET INTELLIGENCE: ${params.market_segment}`);
    console.log(`   Insight: ${params.insight}`);
    console.log(`   Confidence: ${(params.confidence_level * 100).toFixed(1)}%`);
    console.log(`   Impact: ${params.severity}`);
    console.log(`   Categories: ${params.insight_categories?.join(", ") || "N/A"}`);

    // High-impact market insights trigger automated analysis
    if (params.severity === "critical" || params.confidence_level > 0.8) {
      console.log(`   🎯 HIGH IMPACT: Triggering follow-up analysis`);
      await this.triggerFollowUpAnalysis(params);
    }
  }

  /**
   * Handle data quality notifications
   */
  private async handleDataQuality(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n🔍 DATA QUALITY ALERT: ${params.type}`);
    console.log(`   Quality Score: ${(params.quality_score * 100).toFixed(1)}%`);
    console.log(`   Affected: ${params.affected_calculations?.join(", ") || "N/A"}`);
    console.log(`   Sources: ${params.sources_checked?.join(", ") || "N/A"}`);
    console.log(`   Recommendation: ${params.recommendation}`);

    // Low quality data triggers data improvement workflow
    if (params.quality_score < 0.5) {
      console.log(`   ⚠️  LOW QUALITY: Initiating data improvement workflow`);
      await this.initiateDataImprovement(params);
    }
  }

  /**
   * Handle cache performance notifications
   */
  private async handleCachePerformance(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n💾 CACHE PERFORMANCE: ${params.operation}`);
    console.log(`   Cache Key: ${params.cache_key}`);
    console.log(`   Hit Rate: ${(params.hit_rate * 100).toFixed(1)}%`);
    if (params.time_saved_ms) {
      console.log(`   Time Saved: ${params.time_saved_ms}ms`);
    }

    // Track cache performance metrics
    this.performanceMetrics.set("cache_performance", {
      hitRate: params.hit_rate,
      lastOperation: params.operation,
      lastUpdate: new Date().toISOString(),
    });

    // Low hit rate triggers cache optimization
    if (params.hit_rate < 0.3) {
      console.log(`   📊 LOW HIT RATE: Optimizing cache strategy`);
      await this.optimizeCacheStrategy(params);
    }
  }

  /**
   * Handle calculation milestone notifications
   */
  private async handleCalculationMilestone(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n🎯 CALCULATION MILESTONE: ${params.type}`);
    console.log(`   Industry: ${params.industry}`);
    console.log(`   Market Size: $${(params.market_size_usd / 1e6).toFixed(1)}M`);
    console.log(`   Confidence: ${(params.confidence_level * 100).toFixed(1)}%`);
    console.log(`   Methodology: ${params.methodology}`);

    // Significant market size triggers strategic analysis
    if (params.market_size_usd > 1e9) { // > $1B
      console.log(`   💰 SIGNIFICANT MARKET: Triggering strategic analysis`);
      await this.triggerStrategicAnalysis(params);
    }
  }

  /**
   * Handle API rate limit notifications
   */
  private async handleRateLimit(notification: NotificationEvent): Promise<void> {
    const params = notification.params;
    console.log(`\n⏰ RATE LIMIT: ${params.provider} - ${params.endpoint}`);
    console.log(`   Type: ${params.rate_limit_type}`);
    console.log(`   Usage: ${params.current_usage}/${params.limit}`);
    console.log(`   Reset: ${params.reset_time}`);
    console.log(`   Action: ${params.suggested_action}`);

    // Rate limit exceeded triggers automatic throttling
    if (params.rate_limit_type === "exceeded") {
      this.criticalAlerts.push(notification);
      console.log(`   🛑 RATE LIMITED: Activating throttling mechanism`);
      await this.activateThrottling(params);
    }
  }

  /**
   * Automated response methods
   */
  private async escalateCriticalAlert(notification: NotificationEvent): Promise<void> {
    // Simulate sending alert to monitoring system
    console.log(`   📢 Sending alert to monitoring system...`);
    
    // In real implementation:
    // - Send to PagerDuty, Slack, email
    // - Update dashboard status
    // - Log to incident management system
  }

  private async triggerFollowUpAnalysis(params: any): Promise<void> {
    console.log(`   🔄 Queuing follow-up analysis for ${params.market_segment}...`);
    
    // In real implementation:
    // - Queue additional TAM/SAM calculations
    // - Request competitive analysis
    // - Generate detailed market report
  }

  private async initiateDataImprovement(params: any): Promise<void> {
    console.log(`   🔧 Initiating data improvement workflow...`);
    
    // In real implementation:
    // - Flag data sources for review
    // - Request data validation
    // - Update data collection strategies
  }

  private async optimizeCacheStrategy(params: any): Promise<void> {
    console.log(`   ⚡ Optimizing cache strategy for ${params.cache_key}...`);
    
    // In real implementation:
    // - Adjust cache TTL
    // - Pre-warm frequently accessed data
    // - Review cache invalidation strategies
  }

  private async triggerStrategicAnalysis(params: any): Promise<void> {
    console.log(`   📊 Triggering strategic analysis for ${params.industry}...`);
    
    // In real implementation:
    // - Generate competitive landscape report
    // - Calculate market penetration opportunities
    // - Assess investment priorities
  }

  private async activateThrottling(params: any): Promise<void> {
    console.log(`   🚦 Activating throttling for ${params.provider}...`);
    
    // In real implementation:
    // - Implement exponential backoff
    // - Switch to cached data
    // - Queue requests for later execution
  }

  /**
   * Severity determination methods
   */
  private determineDataSourceSeverity(params: any): "low" | "medium" | "high" | "critical" {
    if (params.status === "failed") return "critical";
    if (params.latency_ms > 10000) return "high";
    if (params.latency_ms > 5000) return "medium";
    return "low";
  }

  private determineDataQualitySeverity(params: any): "low" | "medium" | "high" | "critical" {
    if (params.quality_score < 0.3) return "critical";
    if (params.quality_score < 0.5) return "high";
    if (params.quality_score < 0.7) return "medium";
    return "low";
  }

  private determineCacheSeverity(params: any): "low" | "medium" | "high" | "critical" {
    if (params.hit_rate < 0.2) return "high";
    if (params.hit_rate < 0.5) return "medium";
    return "low";
  }

  private determineCalculationSeverity(params: any): "low" | "medium" | "high" | "critical" {
    if (params.market_size_usd > 10e9) return "critical"; // > $10B
    if (params.market_size_usd > 1e9) return "high";     // > $1B
    if (params.market_size_usd > 100e6) return "medium"; // > $100M
    return "low";
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    await this.client.connect(this.transport);
    this.isConnected = true;
    console.log("🔗 Connected to TAM MCP Server");
    console.log("📡 Listening for enhanced notifications...\n");
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log("\n🔌 Disconnected from TAM MCP Server");
    }
  }

  /**
   * Execute a tool and monitor notifications
   */
  async executeToolWithMonitoring(toolName: string, args: any): Promise<any> {
    console.log(`\n🛠️  Executing tool: ${toolName}`);
    console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));
    
    const startTime = Date.now();
    
    try {
      const result = await this.client.request({
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      });
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Tool completed in ${executionTime}ms`);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.log(`❌ Tool failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): any {
    return {
      criticalAlerts: this.criticalAlerts.length,
      totalNotifications: this.notificationQueue.length,
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Example script execution
 */
async function runExample(): Promise<void> {
  const client = new EnhancedNotificationClient();
  
  try {
    // Connect to server
    await client.connect();
    
    // Set up monitoring
    client.on("notification", (notification) => {
      console.log(`📨 Received ${notification.method} notification [${notification.severity}]`);
    });
      // Example: Execute some tools to trigger notifications
    const exampleOperations = [
      {
        tool: "tam_calculator",
        args: {
          industry: "Cloud Computing",
          geography: "Global",
          targetYear: 2025,
        },
      },
      {
        tool: "sam_calculator", 
        args: {
          industry: "SaaS",
          geography: "North America",
          targetYear: 2024,
        },
      },
      {
        tool: "market_forecasting",
        args: {
          industry: "AI/ML",
          forecastYears: 5,
          baseYear: 2024,
        },
      },
      {
        tool: "data_validation",
        args: {
          dataType: "market_size",
          sources: ["government", "industry_reports"],
        },
      },
    ];    // Execute example operations
    for (const operation of exampleOperations) {
      try {
        await client.executeToolWithMonitoring(operation.tool, operation.args);
        
        // Wait a bit between operations to see notifications
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`⚠️  Operation ${operation.tool} encountered an error:`, error);
      }
    }
    
    // Wait for final notifications
    console.log("\n⏳ Waiting for final notifications...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Show performance summary
    console.log("\n📊 PERFORMANCE SUMMARY:");
    console.log(JSON.stringify(client.getPerformanceSummary(), null, 2));
    
  } catch (error) {
    console.error("❌ Example failed:", error);
  } finally {
    await client.disconnect();
  }
}

// Run the example if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample().catch(console.error);
}

export { EnhancedNotificationClient };
