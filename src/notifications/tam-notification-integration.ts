import {
  NotificationService,
  DataSourceHealthNotification,
  DataQualityNotification,
  CachePerformanceNotification,
} from "./notification-service.js";
import { logger } from "../utils/index.js";

/**
 * Enhanced notification integration for TAM MCP Server tools
 * This service provides easy-to-use methods for sending business-relevant notifications
 */
export class TamNotificationIntegration {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Notify about data source performance and health
   */
  async notifyDataSourcePerformance(
    source: string,
    operation: string,
    latency: number,
    success: boolean,
    rateLimitRemaining?: number,
  ): Promise<void> {
    try {
      const sourceMap: Record<string, any> = {
        alpha_vantage: "alpha_vantage",
        bls: "bls",
        census: "census",
        fred: "fred",
        imf: "imf",
        nasdaq: "nasdaq",
        oecd: "oecd",
        worldbank: "worldbank",
      };

      const mappedSource = sourceMap[source.toLowerCase()] || "alpha_vantage";

      const notification: Partial<DataSourceHealthNotification> = {
        source: mappedSource,
        status: success ? "healthy" : "degraded",
        latency_ms: latency,
        last_successful_call: new Date().toISOString(),
        message: success
          ? `${operation} completed successfully in ${latency}ms`
          : `${operation} failed with high latency: ${latency}ms`,
        timestamp: new Date().toISOString(),
      };

      if (rateLimitRemaining !== undefined) {
        notification.rate_limit_remaining = rateLimitRemaining;
      }

      await this.notificationService.sendDataSourceHealth(
        notification as DataSourceHealthNotification,
      );
    } catch (error) {
      logger.error(
        "Failed to send data source performance notification",
        error,
      );
    }
  }

  /**
   * Notify about significant market analysis results
   */
  async notifyMarketInsight(
    industry: string,
    insight: string,
    severity: "low" | "medium" | "high" | "critical",
    confidence: number,
    affectedMetrics: string[] = [],
  ): Promise<void> {
    try {
      await this.notificationService.sendMarketIntelligence({
        type: "market_alert",
        industry,
        severity,
        insight,
        data_confidence: confidence,
        source_count: 3,
        affected_metrics: affectedMetrics,
        recommendation: this.generateRecommendation(severity, insight),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to send market insight notification", error);
    }
  }
  /**
   * Notify about TAM/SAM calculation milestones
   */
  async notifyCalculationMilestone(
    type:
      | "tam_calculated"
      | "sam_calculated"
      | "sam_refined"
      | "forecast_generated"
      | "validation_completed",
    industry: string,
    marketSize: number,
    confidence: number,
    methodology: string,
    assumptions: string[] = [],
    riskFactors: string[] = [],
  ): Promise<void> {
    try {
      await this.notificationService.sendCalculationMilestone({
        type,
        calculation_id: `${type}_${Date.now()}`,
        industry,
        market_size_usd: marketSize,
        confidence_level: confidence,
        methodology,
        key_assumptions: assumptions,
        risk_factors: riskFactors,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Failed to send calculation milestone notification", error);
    }
  }
  /**
   * Notify about data quality issues
   */
  async notifyDataQuality(
    type:
      | "stale_data"
      | "missing_data"
      | "conflicting_sources"
      | "high_confidence"
      | "low_confidence",
    affectedCalculations: string[],
    qualityScore: number,
    sourcesChecked: string[] = [],
    variance?: number,
  ): Promise<void> {
    try {
      const notification: Partial<DataQualityNotification> = {
        type,
        affected_calculations: affectedCalculations,
        quality_score: qualityScore,
        recommendation: this.generateQualityRecommendation(type, qualityScore),
        sources_checked: sourcesChecked,
        timestamp: new Date().toISOString(),
      };

      if (variance !== undefined) {
        notification.variance_percentage = variance;
      }

      await this.notificationService.sendDataQuality(
        notification as DataQualityNotification,
      );
    } catch (error) {
      logger.error("Failed to send data quality notification", error);
    }
  }
  /**
   * Notify about cache performance
   */
  async notifyCachePerformance(
    operation: "hit" | "miss" | "invalidated" | "warming",
    cacheKey: string,
    hitRate: number,
    timeSaved?: number,
  ): Promise<void> {
    try {
      const typeMap = {
        hit: "cache_hit",
        miss: "cache_miss",
        invalidated: "cache_invalidated",
        warming: "cache_warming",
      } as const;

      const notification: Partial<CachePerformanceNotification> = {
        type: typeMap[operation],
        cache_key: cacheKey,
        hit_rate: hitRate,
        performance_impact:
          timeSaved && timeSaved > 100 ? "positive" : "neutral",
        timestamp: new Date().toISOString(),
      };

      if (timeSaved !== undefined) {
        notification.time_saved_ms = timeSaved;
      }

      await this.notificationService.sendCachePerformance(
        notification as CachePerformanceNotification,
      );
    } catch (error) {
      logger.error("Failed to send cache performance notification", error);
    }
  }

  /**
   * Notify about API rate limits
   */
  async notifyRateLimit(
    provider: string,
    endpoint: string,
    currentUsage: number,
    limit: number,
    resetTime: string,
  ): Promise<void> {
    try {
      await this.notificationService.notifyRateLimit(
        provider,
        endpoint,
        currentUsage,
        limit,
        resetTime,
      );
    } catch (error) {
      logger.error("Failed to send rate limit notification", error);
    }
  }
  /**
   * Comprehensive notification for TAM analysis completion
   */
  async notifyTamAnalysisComplete(
    industry: string,
    tamResult: number,
    confidence: number,
    methodology: string,
    dataSourcesUsed: string[],
    assumptions: string[],
    risks: string[],
    _executionTime: number, // Prefixed with underscore to indicate intentionally unused
  ): Promise<void> {
    // Send calculation milestone
    await this.notifyCalculationMilestone(
      "tam_calculated",
      industry,
      tamResult,
      confidence,
      methodology,
      assumptions,
      risks,
    );

    // Send market insight if significant
    if (tamResult > 10000000000) {
      // > $10B
      await this.notifyMarketInsight(
        industry,
        `Large TAM identified: ${this.formatCurrency(tamResult)} with ${(confidence * 100).toFixed(1)}% confidence`,
        tamResult > 100000000000 ? "high" : "medium", // > $100B = high
        confidence,
        ["market_size", "tam_calculation"],
      );
    }

    // Send data quality notification
    const qualityScore = this.calculateQualityScore(
      confidence,
      dataSourcesUsed.length,
    );
    if (qualityScore < 0.7) {
      await this.notifyDataQuality(
        "low_confidence",
        ["calculate_tam"],
        qualityScore,
        dataSourcesUsed,
      );
    }
  }

  /**
   * Comprehensive notification for market forecasting completion
   */
  async notifyForecastComplete(
    industry: string,
    forecastYears: number,
    cagr: number,
    confidence: number,
    methodology: string,
    riskFactors: string[],
  ): Promise<void> {
    // Send calculation milestone
    await this.notifyCalculationMilestone(
      "forecast_generated",
      industry,
      0, // No single market size for forecast
      confidence,
      methodology,
      [`${forecastYears}-year forecast`, `CAGR: ${(cagr * 100).toFixed(1)}%`],
      riskFactors,
    );

    // Send market insight for exceptional growth
    if (cagr > 0.2) {
      // > 20% CAGR
      await this.notifyMarketInsight(
        industry,
        `High growth forecast: ${(cagr * 100).toFixed(1)}% CAGR over ${forecastYears} years`,
        cagr > 0.3 ? "critical" : "high",
        confidence,
        ["growth_rate", "market_forecast"],
      );
    }
  }

  /**
   * Comprehensive notification for SAM (Serviceable Addressable Market) analysis completion
   */
  async notifySamAnalysisComplete(
    industry: string,
    samEstimate: number,
    confidence: number,
    methodology: string,
    dataSources: string[],
    keyAssumptions: string[],
    riskFactors: string[],
    calculationTimeMs: number,
  ): Promise<void> {
    // Send calculation milestone
    await this.notifyCalculationMilestone(
      "sam_calculated",
      industry,
      samEstimate,
      confidence,
      methodology,
      keyAssumptions,
      riskFactors,
    );

    // Send market insight for significant findings
    const samBillions = samEstimate / 1e9;
    if (samBillions > 1) {
      // > $1B SAM
      await this.notifyMarketInsight(
        industry,
        `Significant SAM identified: ${this.formatCurrency(samEstimate)} with ${(confidence * 100).toFixed(1)}% confidence`,
        samBillions > 10 ? "high" : "medium",
        confidence,
        ["sam_calculation", "market_opportunity"],
      );
    }

    // Performance notification for calculation time
    await this.notifyDataSourcePerformance(
      "internal_models",
      "SAM Calculation",
      calculationTimeMs,
      true,
    );

    logger.info("SAM analysis completion notifications sent", {
      industry,
      samEstimate,
      confidence,
      calculationTimeMs,
      dataSources: dataSources.length,
    });
  }

  // Helper methods
  private generateRecommendation(severity: string, _insight: string): string {
    switch (severity) {
      case "critical":
        return "Immediate attention required - consider priority analysis and strategy adjustment";
      case "high":
        return "High priority - review market strategy and update forecasts";
      case "medium":
        return "Monitor closely - consider updating assumptions in next analysis cycle";
      case "low":
        return "Informational - note for future reference";
      default:
        return "Review and assess impact on current market analysis";
    }
  }

  private generateQualityRecommendation(type: string, score: number): string {
    switch (type) {
      case "low_confidence":
        return score < 0.5
          ? "Seek additional data sources or use alternative methodologies"
          : "Consider supplementing with expert analysis or industry reports";
      case "conflicting_sources":
        return "Use weighted averages prioritizing government and academic sources";
      case "stale_data":
        return "Update with more recent data or adjust for temporal factors";
      case "missing_data":
        return "Use proxy metrics or comparable industry data with appropriate disclaimers";
      default:
        return "Review data sources and methodology for improvements";
    }
  }

  private calculateQualityScore(
    confidence: number,
    sourceCount: number,
  ): number {
    // Base quality on confidence and number of data sources
    const sourceScore = Math.min(sourceCount / 5, 1); // Optimal at 5+ sources
    return confidence * 0.7 + sourceScore * 0.3;
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1e12) {
      return `$${(amount / 1e12).toFixed(1)}T`;
    } else if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(1)}B`;
    } else if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(1)}M`;
    } else if (amount >= 1e3) {
      return `$${(amount / 1e3).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  }
}

export default TamNotificationIntegration;
