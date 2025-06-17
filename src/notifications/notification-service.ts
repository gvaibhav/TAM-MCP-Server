import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { logger } from "../utils/index.js";

export interface ProgressNotification {
  progressToken?: string | number;
  progress: number;
  total: number;
  message?: string;
}

export interface MarketAnalysisNotification {
  type:
    | "market_analysis"
    | "calculation"
    | "data_fetch"
    | "validation"
    | "error";
  message: string;
  data?: any;
  timestamp: string;
}

export interface ErrorNotification {
  error: string;
  tool: string;
  timestamp: string;
  details?: any;
}

// Enhanced notification interfaces for TAM MCP Server
export interface DataSourceHealthNotification {
  source:
    | "alpha_vantage"
    | "bls"
    | "census"
    | "fred"
    | "imf"
    | "nasdaq"
    | "oecd"
    | "worldbank";
  status: "healthy" | "degraded" | "unavailable" | "rate_limited";
  latency_ms: number;
  last_successful_call: string;
  rate_limit_remaining?: number;
  message: string;
  timestamp: string;
}

export interface MarketIntelligenceNotification {
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

export interface DataQualityNotification {
  type:
    | "stale_data"
    | "missing_data"
    | "conflicting_sources"
    | "high_confidence"
    | "low_confidence";
  affected_calculations: string[];
  quality_score: number; // 0-1 scale
  recommendation: string;
  sources_checked: string[];
  variance_percentage?: number;
  timestamp: string;
}

export interface CachePerformanceNotification {
  type: "cache_hit" | "cache_miss" | "cache_invalidated" | "cache_warming";
  cache_key: string;
  hit_rate: number; // 0-1 scale
  performance_impact: "positive" | "negative" | "neutral";
  time_saved_ms?: number;
  memory_usage_mb?: number;
  timestamp: string;
}

export interface CalculationMilestoneNotification {
  type:
    | "tam_calculated"
    | "sam_calculated"
    | "sam_refined"
    | "forecast_generated"
    | "validation_completed"
    | "opportunity_identified";
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

export interface APIRateLimitNotification {
  provider: string;
  endpoint: string;
  rate_limit_type: "approaching" | "exceeded" | "reset";
  current_usage: number;
  limit: number;
  reset_time: string;
  suggested_action: string;
  timestamp: string;
}

export class NotificationService {
  private server: Server;
  private isEnabled: boolean = true;

  constructor(server: Server) {
    this.server = server;
  }

  /**
   * Enable or disable notifications
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    logger.info(`Notifications ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Send a progress notification
   */
  async sendProgress(notification: ProgressNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/progress",
        params: {
          progress: notification.progress,
          total: notification.total,
          progressToken: notification.progressToken,
          message: notification.message,
        },
      });

      logger.debug("Progress notification sent", notification);
    } catch (error) {
      logger.error("Failed to send progress notification", error);
    }
  }

  /**
   * Send a market analysis update notification
   */
  async sendMarketAnalysisUpdate(
    notification: MarketAnalysisNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/market_analysis",
        params: {
          type: notification.type,
          message: notification.message,
          data: notification.data,
          timestamp: notification.timestamp,
        },
      });

      logger.debug("Market analysis notification sent", notification);
    } catch (error) {
      logger.error("Failed to send market analysis notification", error);
    }
  }

  /**
   * Send an error notification
   */
  async sendError(notification: ErrorNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/error",
        params: {
          error: notification.error,
          tool: notification.tool,
          timestamp: notification.timestamp,
          details: notification.details,
        },
      });

      logger.debug("Error notification sent", notification);
    } catch (error) {
      logger.error("Failed to send error notification", error);
    }
  }

  /**
   * Send a general message notification
   */
  async sendMessage(
    level: "info" | "warning" | "error",
    message: string,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/message",
        params: {
          level,
          logger: "tam-mcp-server",
          data: message,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug("Message notification sent", { level, message });
    } catch (error) {
      logger.error("Failed to send message notification", error);
    }
  }

  /**
   * Send a calculation status notification
   */
  async sendCalculationStatus(
    calculationType: string,
    status: "started" | "completed" | "failed",
    details?: any,
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: "calculation",
      message: `${calculationType} calculation ${status}`,
      data: details,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }

  /**
   * Send a data fetch status notification
   */
  async sendDataFetchStatus(
    source: string,
    status: "started" | "completed" | "failed",
    details?: any,
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: "data_fetch",
      message: `Data fetch from ${source} ${status}`,
      data: details,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }

  /**
   * Send a validation status notification
   */
  async sendValidationStatus(
    validationType: string,
    status: "started" | "completed" | "failed",
    results?: any,
  ): Promise<void> {
    if (!this.isEnabled) return;

    const notification: MarketAnalysisNotification = {
      type: "validation",
      message: `${validationType} validation ${status}`,
      data: results,
      timestamp: new Date().toISOString(),
    };

    await this.sendMarketAnalysisUpdate(notification);
  }

  // Enhanced notification methods for TAM MCP Server
  /**
   * Send data source health notification
   */
  async sendDataSourceHealth(
    notification: DataSourceHealthNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/data_source_health",
        params: {
          ...notification,
          _meta: {
            notificationType: "data_source_health",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("Data source health notification sent", notification);
    } catch (error) {
      logger.error("Failed to send data source health notification", error);
    }
  }

  /**
   * Send market intelligence notification
   */
  async sendMarketIntelligence(
    notification: MarketIntelligenceNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/market_intelligence",
        params: {
          ...notification,
          _meta: {
            notificationType: "market_intelligence",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("Market intelligence notification sent", notification);
    } catch (error) {
      logger.error("Failed to send market intelligence notification", error);
    }
  }

  /**
   * Send data quality notification
   */
  async sendDataQuality(notification: DataQualityNotification): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/data_quality",
        params: {
          ...notification,
          _meta: {
            notificationType: "data_quality",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("Data quality notification sent", notification);
    } catch (error) {
      logger.error("Failed to send data quality notification", error);
    }
  }

  /**
   * Send cache performance notification
   */
  async sendCachePerformance(
    notification: CachePerformanceNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/cache_performance",
        params: {
          ...notification,
          _meta: {
            notificationType: "cache_performance",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("Cache performance notification sent", notification);
    } catch (error) {
      logger.error("Failed to send cache performance notification", error);
    }
  }

  /**
   * Send calculation milestone notification
   */
  async sendCalculationMilestone(
    notification: CalculationMilestoneNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/calculation_milestone",
        params: {
          ...notification,
          _meta: {
            notificationType: "calculation_milestone",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("Calculation milestone notification sent", notification);
    } catch (error) {
      logger.error("Failed to send calculation milestone notification", error);
    }
  }

  /**
   * Send API rate limit notification
   */
  async sendAPIRateLimit(
    notification: APIRateLimitNotification,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.server.notification({
        method: "notifications/api_rate_limit",
        params: {
          ...notification,
          _meta: {
            notificationType: "api_rate_limit",
            serverName: "tam-mcp-server",
          },
        },
      });

      logger.debug("API rate limit notification sent", notification);
    } catch (error) {
      logger.error("Failed to send API rate limit notification", error);
    }
  }

  // Convenience methods for common scenarios

  /**
   * Notify when a major market analysis calculation is completed
   */
  async notifyMarketAnalysisComplete(
    industry: string,
    tamResult: number,
    confidence: number,
    methodology: string,
  ): Promise<void> {
    await this.sendCalculationMilestone({
      type: "tam_calculated",
      calculation_id: `tam_${Date.now()}`,
      industry,
      market_size_usd: tamResult,
      confidence_level: confidence,
      methodology,
      key_assumptions: [
        "Current market trends maintained",
        "No major regulatory changes",
        "Technology adoption continues",
      ],
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about data source issues
   */
  async notifyDataSourceIssue(
    source: DataSourceHealthNotification["source"],
    issue: string,
    latency: number,
  ): Promise<void> {
    await this.sendDataSourceHealth({
      source,
      status: "degraded",
      latency_ms: latency,
      last_successful_call: new Date().toISOString(),
      message: issue,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about market trends detected
   */
  async notifyMarketTrend(
    industry: string,
    insight: string,
    severity: MarketIntelligenceNotification["severity"],
    confidence: number,
  ): Promise<void> {
    await this.sendMarketIntelligence({
      type: "trend_detected",
      industry,
      severity,
      insight,
      data_confidence: confidence,
      source_count: 3,
      affected_metrics: ["market_size", "growth_rate"],
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about data quality issues
   */
  async notifyDataQualityIssue(
    type: DataQualityNotification["type"],
    affectedCalculations: string[],
    qualityScore: number,
    recommendation: string,
  ): Promise<void> {
    await this.sendDataQuality({
      type,
      affected_calculations: affectedCalculations,
      quality_score: qualityScore,
      recommendation,
      sources_checked: ["alpha_vantage", "bls", "census"],
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * Notify about cache performance
   */
  async notifyCacheEvent(
    type: CachePerformanceNotification["type"],
    cacheKey: string,
    hitRate: number,
    timeSaved?: number,
  ): Promise<void> {
    const notification: CachePerformanceNotification = {
      type,
      cache_key: cacheKey,
      hit_rate: hitRate,
      performance_impact: timeSaved && timeSaved > 0 ? "positive" : "neutral",
      timestamp: new Date().toISOString(),
    };

    if (timeSaved !== undefined) {
      notification.time_saved_ms = timeSaved;
    }

    await this.sendCachePerformance(notification);
  }

  /**
   * Notify about API rate limit status
   */
  async notifyRateLimit(
    provider: string,
    endpoint: string,
    currentUsage: number,
    limit: number,
    resetTime: string,
  ): Promise<void> {
    const rateLimitType =
      currentUsage >= limit
        ? "exceeded"
        : currentUsage > limit * 0.8
          ? "approaching"
          : "reset";

    await this.sendAPIRateLimit({
      provider,
      endpoint,
      rate_limit_type: rateLimitType,
      current_usage: currentUsage,
      limit,
      reset_time: resetTime,
      suggested_action:
        rateLimitType === "exceeded"
          ? "Wait for rate limit reset or use alternative data source"
          : rateLimitType === "approaching"
            ? "Consider throttling requests or caching results"
            : "Rate limit reset, normal operations resumed",
      timestamp: new Date().toISOString(),
    });
  }
}
