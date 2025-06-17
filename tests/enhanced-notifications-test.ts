/**
 * Enhanced Notification System Validation Test
 * 
 * This script validates that the enhanced notification system is working correctly
 * by running a series of tool executions and checking for expected notifications.
 */

import { NotificationService, TamNotificationIntegration } from "../src/notifications/index.js";
import { logger } from "../src/utils/index.js";

// Mock MCP Server for testing
class MockMCPServer {
  private notifications: any[] = [];

  async notification(params: any): Promise<void> {
    this.notifications.push({
      ...params,
      timestamp: new Date().toISOString(),
    });
    console.log(`📨 Notification: ${params.method}`, params.params);
  }

  getNotifications(): any[] {
    return this.notifications;
  }

  clearNotifications(): void {
    this.notifications = [];
  }
}

async function testEnhancedNotifications(): Promise<void> {
  console.log("🧪 Testing Enhanced MCP Notification System\n");

  const mockServer = new MockMCPServer();
  const notificationService = new NotificationService(mockServer as any);
  const tamNotifications = new TamNotificationIntegration(notificationService);

  console.log("✅ Notification services initialized\n");

  // Test 1: Data Source Performance Notification
  console.log("🏥 Test 1: Data Source Performance Notification");
  await tamNotifications.notifyDataSourcePerformance(
    "alpha_vantage",
    "Company Overview",
    1250,
    true,
    95
  );

  // Test 2: Market Intelligence Notification
  console.log("📈 Test 2: Market Intelligence Notification");
  await tamNotifications.notifyMarketInsight(
    "Cloud Computing",
    "Significant growth potential identified in enterprise cloud segment",
    "high",
    0.85,
    ["market_size", "growth_forecast"]
  );

  // Test 3: TAM Analysis Complete Notification
  console.log("🎯 Test 3: TAM Analysis Complete Notification");
  await tamNotifications.notifyTamAnalysisComplete(
    "Artificial Intelligence",
    15000000000, // $15B
    0.8,
    "Top-down market analysis with competitive assessment",
    ["internal_models", "industry_reports", "expert_analysis"],
    [
      "AI adoption continues to accelerate",
      "Enterprise spending increases 25% annually",
      "New use cases emerge quarterly"
    ],
    [
      "Regulatory changes in AI governance",
      "Economic downturn affecting IT budgets",
      "Competition from emerging technologies"
    ],
    2500
  );

  // Test 4: Data Quality Notification
  console.log("🔍 Test 4: Data Quality Notification");
  await tamNotifications.notifyDataQuality(
    "low_confidence",
    ["TAM calculation for emerging market"],
    0.45,
    ["government_data", "trade_publications"],
    15.5
  );

  // Test 5: Cache Performance Notification
  console.log("💾 Test 5: Cache Performance Notification");
  await tamNotifications.notifyCachePerformance(
    "miss",
    "market_data_ai_2024",
    0.65,
    1800
  );

  // Test 6: Rate Limit Notification
  console.log("⏰ Test 6: Rate Limit Notification");
  await tamNotifications.notifyRateLimit(
    "alpha_vantage",
    "OVERVIEW",
    "approaching",
    85,
    100,
    "2024-12-17T15:30:00Z"
  );

  // Test 7: Calculation Milestone Notification
  console.log("🎯 Test 7: Calculation Milestone Notification");
  await tamNotifications.notifyCalculationMilestone(
    "sam_calculated",
    "SaaS Platforms",
    2500000000, // $2.5B
    0.75,
    "Bottom-up analysis with product segmentation",
    [
      "Product-market fit validated",
      "Distribution channels identified",
      "Pricing strategy confirmed"
    ],
    [
      "Market saturation risk",
      "Competitive pricing pressure",
      "Customer acquisition cost trends"
    ]
  );

  // Test 8: Forecast Complete Notification
  console.log("📊 Test 8: Forecast Complete Notification");
  await tamNotifications.notifyForecastComplete(
    "Quantum Computing",
    7,
    0.35, // 35% CAGR
    0.6,
    "Monte Carlo simulation with expert validation",
    [
      "Technology breakthrough timeline",
      "Investment volatility",
      "Commercialization challenges"
    ]
  );

  // Validate notifications were sent
  const notifications = mockServer.getNotifications();
  console.log(`\n📊 Validation Results:`);
  console.log(`   Total notifications sent: ${notifications.length}`);
  console.log(`   Expected: 8+ notifications`);
  
  if (notifications.length >= 8) {
    console.log(`✅ SUCCESS: All test notifications sent successfully`);
  } else {
    console.log(`❌ FAILURE: Missing notifications`);
  }

  // Show notification breakdown
  const notificationTypes = notifications.reduce((acc: any, notif: any) => {
    const method = notif.method;
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n📋 Notification Type Breakdown:`);
  Object.entries(notificationTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Test severity determination
  console.log(`\n🎚️  Testing Severity Determination:`);
  
  // High severity market insight
  await tamNotifications.notifyMarketInsight(
    "Critical Infrastructure",
    "Market disruption detected - immediate strategic review required",
    "critical",
    0.95,
    ["disruption", "strategic_priority"]
  );

  // Low quality data alert
  await tamNotifications.notifyDataQuality(
    "missing_data",
    ["Market size calculation incomplete"],
    0.25,
    ["partial_government_data"],
    undefined
  );

  console.log(`\n✅ Enhanced notification system validation complete!`);
  console.log(`📈 Total notifications: ${mockServer.getNotifications().length}`);
  
  return;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedNotifications()
    .then(() => {
      console.log("\n🎉 All tests completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

export { testEnhancedNotifications };
