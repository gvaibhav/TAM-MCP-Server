/**
 * Enhanced MCP Notifications Integration Example
 * This file shows how to integrate and use the enhanced notification system
 * in the TAM MCP Server for real-time market analysis insights.
 */

import { NotificationService } from "./notification-service.js";
import { TamNotificationIntegration } from "./tam-notification-integration.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Example integration of enhanced notifications in MCP server
 */
export class EnhancedMCPNotificationExamples {
  private notificationService: NotificationService;
  private tamNotifications: TamNotificationIntegration;

  constructor(server: Server) {
    this.notificationService = new NotificationService(server);
    this.tamNotifications = new TamNotificationIntegration(
      this.notificationService,
    );
  }
  /**
   * Show comprehensive notifications during TAM calculation
   */
  async showTamCalculationWithNotifications(): Promise<void> {
    console.log("🚀 Starting TAM calculation with enhanced notifications...");

    // 1. Notify about data source performance
    await this.tamNotifications.notifyDataSourcePerformance(
      "alpha_vantage",
      "fetchCompanyData",
      150, // 150ms latency
      true, // successful
      450, // rate limit remaining
    );

    // 2. Notify about cache performance
    await this.tamNotifications.notifyCachePerformance(
      "hit",
      "tam_calculation:saas:2024",
      0.85, // 85% hit rate
      2500, // 2.5 seconds saved
    );

    // 3. Notify about market insight discovered
    await this.tamNotifications.notifyMarketInsight(
      "Software as a Service",
      "SaaS market showing 35% YoY growth, significantly above 25% forecast",
      "high",
      0.92, // 92% confidence
      ["market_size", "growth_rate", "tam_calculation"],
    );

    // 4. Notify about data quality
    await this.tamNotifications.notifyDataQuality(
      "high_confidence",
      ["calculate_tam", "forecast_market"],
      0.88, // 88% quality score
      ["alpha_vantage", "bls", "census"],
      5.2, // 5.2% variance between sources
    );

    // 5. Comprehensive TAM calculation completion
    await this.tamNotifications.notifyTamAnalysisComplete(
      "Software as a Service",
      650000000000, // $650B TAM
      0.88, // 88% confidence
      "Bottom-up addressable population analysis",
      ["alpha_vantage", "bls", "census", "industry_reports"],
      [
        "Enterprise digital transformation continues",
        "Cloud adoption reaches 85% by 2026",
        "Average SaaS spend grows 20% annually",
      ],
      [
        "Economic recession impact",
        "Increased competition",
        "Market saturation in core segments",
      ],
      3250, // 3.25 seconds execution time
    );

    console.log("✅ TAM calculation notifications sent successfully!");
  }
  /**
   * Show real-time API monitoring notifications
   */
  async showAPIMonitoring(): Promise<void> {
    console.log("📊 Showing API monitoring notifications...");

    // Alpha Vantage rate limit approaching
    await this.tamNotifications.notifyRateLimit(
      "Alpha Vantage",
      "/query?function=OVERVIEW",
      420, // current usage
      500, // limit
      "2025-06-17T11:00:00Z", // reset time
    );

    // BLS API experiencing issues
    await this.tamNotifications.notifyDataSourcePerformance(
      "bls",
      "getSeriesData",
      5000, // 5 second latency - problematic
      false, // failed
      undefined, // no rate limit info
    );

    // Census API healthy
    await this.tamNotifications.notifyDataSourcePerformance(
      "census",
      "fetchIndustryData",
      120, // fast response
      true, // successful
      1000, // rate limit remaining
    );

    console.log("✅ API monitoring notifications sent!");
  }
  /**
   * Show market intelligence alerts
   */
  async showMarketIntelligence(): Promise<void> {
    console.log("🧠 Showing market intelligence notifications...");

    // Critical market alert
    await this.tamNotifications.notifyMarketInsight(
      "Artificial Intelligence",
      "AI market experiencing unprecedented 50% YoY growth - major opportunity identified",
      "critical",
      0.95,
      ["market_size", "growth_rate", "investment_flow", "tam_calculation"],
    );

    // Trend detection
    await this.tamNotifications.notifyMarketInsight(
      "Electric Vehicles",
      "EV adoption accelerating in European markets - 40% increase in Q2",
      "high",
      0.87,
      ["regional_growth", "market_penetration"],
    );

    // Market anomaly
    await this.tamNotifications.notifyMarketInsight(
      "Cryptocurrency",
      "Crypto market showing unusual volatility patterns - recommend analysis review",
      "medium",
      0.75,
      ["market_volatility", "risk_assessment"],
    );

    console.log("✅ Market intelligence notifications sent!");
  }
  /**
   * Show forecasting completion notifications
   */
  async showForecastingNotifications(): Promise<void> {
    console.log("📈 Showing forecasting notifications...");

    await this.tamNotifications.notifyForecastComplete(
      "Cloud Computing",
      5, // 5-year forecast
      0.28, // 28% CAGR - exceptional growth
      0.84, // 84% confidence
      "Compound growth with S-curve adoption modeling",
      [
        "Economic downturn could slow enterprise spending",
        "Regulatory changes in data privacy",
        "Competitive pressure from new entrants",
      ],
    );

    console.log("✅ Forecasting notifications sent!");
  }
  /**
   * Run comprehensive notification examples
   */
  async runFullExamples(): Promise<void> {
    console.log(
      "🎯 Starting comprehensive TAM MCP Server notification examples...\n",
    );

    try {
      await this.showTamCalculationWithNotifications();
      console.log("");

      await this.showAPIMonitoring();
      console.log("");

      await this.showMarketIntelligence();
      console.log("");

      await this.showForecastingNotifications();
      console.log("");

      console.log("🎉 All enhanced notifications shown successfully!");
      console.log("\n📋 Summary of Enhanced Notification Types:");
      console.log(
        "• Data Source Health - Monitor API performance and rate limits",
      );
      console.log(
        "• Market Intelligence - Alert on trends, anomalies, and opportunities",
      );
      console.log("• Data Quality - Track confidence and source reliability");
      console.log(
        "• Cache Performance - Optimize response times and resource usage",
      );
      console.log(
        "• Calculation Milestones - Celebrate TAM/SAM analysis achievements",
      );
      console.log("• API Rate Limits - Proactive quota management");
    } catch (error) {
      console.error("❌ Error during notification examples:", error);
    }
  }
}

/**
 * Example usage patterns for MCP clients
 */
export const mcpClientUsageExamples = {
  /**
   * How MCP clients can listen to these enhanced notifications
   */
  clientListenerExample: `
    // MCP Client listening to enhanced notifications
    mcpClient.onNotification('notifications/data_source_health', (params) => {
      console.log('Data source health update:', params);
      if (params.status === 'degraded') {
        // Switch to backup data source or cache
        handleDataSourceDegradation(params);
      }
    });

    mcpClient.onNotification('notifications/market_intelligence', (params) => {
      console.log('Market insight:', params);
      if (params.severity === 'critical') {
        // Alert analysts or trigger automated analysis
        triggerUrgentAnalysis(params);
      }
    });

    mcpClient.onNotification('notifications/calculation_milestone', (params) => {
      console.log('TAM calculation completed:', params);
      // Update dashboard with new market size data
      updateMarketSizeDashboard(params);
    });
  `,

  /**
   * Integration with business intelligence tools
   */
  businessIntelligenceIntegration: `
    // Integration with BI tools like Tableau, PowerBI
    mcpClient.onNotification('notifications/market_intelligence', async (params) => {
      if (params.type === 'trend_detected' && params.severity === 'high') {
        await tableau.refreshDataSource('market_trends');
        await slack.sendMessage('#market-analysis', 
          \`📈 Market trend detected: \${params.insight}\`);
      }
    });
  `,

  /**
   * Automated response to notifications
   */
  automatedResponseExample: `
    // Automated response system
    mcpClient.onNotification('notifications/api_rate_limit', async (params) => {
      if (params.rate_limit_type === 'approaching') {
        // Automatically switch to cached data or alternative source
        await switchToBackupDataSource(params.provider);
      }
    });

    mcpClient.onNotification('notifications/data_quality', async (params) => {
      if (params.quality_score < 0.7) {
        // Trigger additional validation or analyst review
        await requestAdditionalValidation(params.affected_calculations);
      }
    });
  `,
};

export default EnhancedMCPNotificationExamples;
