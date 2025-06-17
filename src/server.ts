#!/usr/bin/env node

// Load environment variables FIRST, before any other imports
import * as dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  // ToolDefinition, // Removed, will use local definition
  // z, // Removed, z is imported in tool-definitions now
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; // Added: Import z directly for validationError typing
import {
  getAllToolDefinitions,
  getToolDefinition,
  getToolValidationSchema,
} from "./tools/tool-definitions.js"; // Changed: Import local ToolDefinition
import {
  getAllPromptDefinitions,
  getPromptDefinition,
  generatePromptContent,
} from "./prompts/prompt-definitions.js"; // Added: Import prompt definitions
import { DataService } from "./services/DataService.js"; // Added
import { logger, checkRateLimit, logApiAvailabilityStatus, getToolAvailabilityStatus } from "./utils/index.js";
import {
  NotificationService,
  TamNotificationIntegration,
} from "./notifications/index.js";

export async function createServer() {
  const server = new Server(
    {
      name: "tam-mcp-server",
      version: "1.0.0",
      toolDefinitionPath: "./tools/tool-definitions.js", // Added: Inform SDK where to potentially load definitions if it supports it
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}, // Added: Prompts capability
        logging: {},
        notifications: {},
      },
    },
  );
  // Initialize notification service
  const notificationService = new NotificationService(server);
  const tamNotifications = new TamNotificationIntegration(notificationService);
  const dataService = new DataService(); // Added: Initialize DataService

  // Rate limiting configuration
  const RATE_LIMIT_REQUESTS = parseInt(
    process.env.RATE_LIMIT_REQUESTS ?? "100",
  );
  const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW ?? "60000"); // 1 minute

  // Create logs directory if it doesn't exist
  const fs = await import("fs");
  const path = await import("path");
  const logsDir = path.join(process.cwd(), "logs");

  try {
    await fs.promises.access(logsDir);
  } catch {
    await fs.promises.mkdir(logsDir, { recursive: true });
  }

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = getAllToolDefinitions(); // Changed: Use new function
    
    // Add availability status to tool descriptions
    const toolsWithAvailability = tools.map(tool => {
      const status = getToolAvailabilityStatus(tool.name);
      
      let description = tool.description;
      
      if (!status.available) {
        description += ` ❌ [UNAVAILABLE: Missing required API keys: ${status.missingKeys.join(', ')}]`;
      } else if (status.warnings.length > 0) {
        description += ` ⚠️ [${status.warnings.join('; ')}]`;
      }
      
      return {
        ...tool,
        description
      };
    });
    
    logger.info(`Listed ${tools.length} available tools (${toolsWithAvailability.filter(t => !t.description.includes('❌')).length} fully available)`);

    return {
      tools: toolsWithAvailability,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolDefinition = getToolDefinition(name); // Added: Get tool definition

    if (!toolDefinition) {
      logger.warn(`Attempted to call unknown tool: ${name}`);
      return {
        content: [{ type: "text", text: `Error: Unknown tool: ${name}` }],
        isError: true,
      };
    }

    // Validate arguments using the tool's input schema and apply defaults
    let processedArgs = args;
    try {
      const validationSchema = getToolValidationSchema(name);
      if (validationSchema) {
        // Apply defaults by parsing the arguments with the schema
        // This will fill in any missing values with their defaults
        processedArgs = validationSchema.parse(args ?? {});
      }
    } catch (validationError) {
      logger.warn(`Invalid arguments for tool ${name}:`, {
        args,
        error: validationError,
      });
      return {
        content: [
          {
            type: "text",
            text: `Error: Invalid arguments for tool ${name}. ${(validationError as z.ZodError).errors.map((e: any) => e.message).join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    // Rate limiting check
    const clientId = "default"; // In production, this would be based on authentication
    const rateLimitResult = checkRateLimit(
      clientId,
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW,
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for client: ${clientId}`);
      return {
        content: [
          {
            type: "text",
            text: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
          },
        ],
      };
    }

    logger.info(`Tool called: ${name}`, {
      args: processedArgs,
      remaining: rateLimitResult.remaining,
    });

    try {
      let result: any; // Using any for now, should be typed based on tool output schemas

      // Send notification that tool execution started
      await notificationService.sendMessage(
        "info",
        `Starting execution of ${name}`,
      );

      // Refactored tool dispatching to use DataService
      // This switch will now primarily call methods on dataService
      switch (name) {
        case "alphaVantage_getCompanyOverview": {
          const startTimeAV1 = Date.now();
          await notificationService.sendDataFetchStatus(
            "AlphaVantage Company Overview",
            "started",
          );

          result = await dataService.getAlphaVantageData(
            "OVERVIEW",
            processedArgs as any,
          );
          const executionTimeAV1 = Date.now() - startTimeAV1;

          // Enhanced notifications for data source health and performance
          await tamNotifications.notifyDataSourcePerformance(
            "alpha_vantage",
            "Company Overview",
            executionTimeAV1,
            !!result,
            undefined, // Rate limit info would come from the API response
          );

          // Cache performance notification (simulated - would be real in production)
          await tamNotifications.notifyCachePerformance(
            result ? "hit" : "miss",
            `alphavantage_overview_${(processedArgs as any)?.symbol || "unknown"}`,
            0.75, // Simulated hit rate
            executionTimeAV1 > 1000
              ? Math.max(0, 2000 - executionTimeAV1)
              : undefined,
          );

          await notificationService.sendDataFetchStatus(
            "AlphaVantage Company Overview",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "alphaVantage_searchSymbols":
          await notificationService.sendDataFetchStatus(
            "AlphaVantage Symbol Search",
            "started",
          );
          result = await dataService.getAlphaVantageData(
            "SYMBOL_SEARCH",
            processedArgs as any,
          ); // Assuming DataService handles this
          await notificationService.sendDataFetchStatus(
            "AlphaVantage Symbol Search",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "bls_getSeriesData":
          await notificationService.sendDataFetchStatus(
            "BLS Series Data",
            "started",
          );
          result = await dataService.getBlsData(
            "fetchSeriesData",
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "BLS Series Data",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "census_fetchIndustryData":
          await notificationService.sendDataFetchStatus(
            "Census Industry Data",
            "started",
          );
          result = await dataService.getCensusData(
            "fetchIndustryData",
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Census Industry Data",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "census_fetchMarketSize":
          await notificationService.sendDataFetchStatus(
            "Census Market Size",
            "started",
          );
          result = await dataService.getCensusData(
            "fetchMarketSize",
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Census Market Size",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "fred_getSeriesObservations":
          await notificationService.sendDataFetchStatus(
            "FRED Series Observations",
            "started",
          );
          result = await dataService.getFredData(processedArgs as any); // To be implemented in DataService
          await notificationService.sendDataFetchStatus(
            "FRED Series Observations",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "imf_getDataset":
          await notificationService.sendDataFetchStatus(
            "IMF Dataset",
            "started",
          );
          result = await dataService.getImfData(
            "fetchImfDataset",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "IMF Dataset",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "imf_getLatestObservation":
          await notificationService.sendDataFetchStatus(
            "IMF Latest Observation",
            "started",
          );
          result = await dataService.getImfData(
            "fetchMarketSize",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "IMF Latest Observation",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "nasdaq_getDatasetTimeSeries":
          await notificationService.sendDataFetchStatus(
            "Nasdaq Timeseries",
            "started",
          );
          result = await dataService.getNasdaqData(
            "fetchIndustryData",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "Nasdaq Timeseries",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "nasdaq_getLatestDatasetValue":
          await notificationService.sendDataFetchStatus(
            "Nasdaq Latest Value",
            "started",
          );
          result = await dataService.getNasdaqData(
            "fetchMarketSize",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "Nasdaq Latest Value",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "oecd_getDataset":
          await notificationService.sendDataFetchStatus(
            "OECD Dataset",
            "started",
          );
          result = await dataService.getOecdData(
            "fetchOecdDataset",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "OECD Dataset",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "oecd_getLatestObservation":
          await notificationService.sendDataFetchStatus(
            "OECD Latest Observation",
            "started",
          );
          result = await dataService.getOecdData(
            "fetchMarketSize",
            processedArgs as any,
          ); // To be implemented
          await notificationService.sendDataFetchStatus(
            "OECD Latest Observation",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "worldBank_getIndicatorData":
          await notificationService.sendDataFetchStatus(
            "World Bank Indicator Data",
            "started",
          );
          result = await dataService.getWorldBankData(processedArgs as any); // To be implemented
          await notificationService.sendDataFetchStatus(
            "World Bank Indicator Data",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "industry_search":
          await notificationService.sendDataFetchStatus(
            "Industry Search",
            "started",
          );
          result = await dataService.searchIndustries(processedArgs as any);
          await notificationService.sendDataFetchStatus(
            "Industry Search",
            result ? "completed" : "failed",
            result,
          );
          break;
        case "tam_calculator": {
          const startTime = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "alpha_vantage",
            "TAM Calculation",
            0,
            true,
          );

          await notificationService.sendCalculationStatus(
            "TAM Calculation",
            "started",
          );

          result = await dataService.calculateTam(processedArgs as any);
          const executionTime = Date.now() - startTime;

          if (result?.success) {
            // Enhanced notification for TAM calculation completion
            await tamNotifications.notifyTamAnalysisComplete(
              result.data.industry || "Unknown Industry",
              result.data.tam_estimate || 0,
              result.data.confidence_level || 0.5,
              result.data.methodology || "Standard TAM calculation",
              ["internal_models", "market_research"],
              result.data.key_assumptions || [
                "Market trends continue",
                "No major disruptions",
                "Standard adoption rates",
              ],
              result.data.risk_factors || [
                "Economic volatility",
                "Competition changes",
                "Regulatory shifts",
              ],
              executionTime,
            );

            // Check for significant market size and alert
            if (result.data.tam_estimate > 10000000000) {
              // > $10B
              await tamNotifications.notifyMarketInsight(
                result.data.industry || "Market",
                `Large TAM identified: $${(result.data.tam_estimate / 1000000000).toFixed(1)}B with ${((result.data.confidence_level || 0.5) * 100).toFixed(1)}% confidence`,
                result.data.tam_estimate > 100000000000 ? "high" : "medium",
                result.data.confidence_level || 0.5,
                ["tam_calculation", "market_size"],
              );
            }
          }

          await notificationService.sendCalculationStatus(
            "TAM Calculation",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "tam_analysis": {
          const startTime = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "internal_models",
            "TAM Analysis",
            0,
            true,
          );

          await notificationService.sendCalculationStatus(
            "TAM Analysis",
            "started",
          );

          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.tamCalculator(
            processedArgs as any,
          );
          const executionTime = Date.now() - startTime;

          if (result?.success) {
            // Enhanced notification for TAM analysis completion
            await tamNotifications.notifyTamAnalysisComplete(
              result.data.industry || "Unknown Industry",
              result.data.tam_estimate || 0,
              result.data.confidence_level || 0.5,
              result.data.methodology || "Advanced TAM analysis",
              ["internal_models", "market_research", "scenario_analysis"],
              result.data.key_assumptions || [
                "Market trends continue",
                "Scenario planning",
                "Addressable market validation",
              ],
              result.data.risk_factors || [
                "Economic volatility",
                "Technology disruption",
                "Competitive pressures",
              ],
              executionTime,
            );

            // Check for significant market size and alert
            if (result.data.tam_estimate > 10000000000) {
              // > $10B
              await tamNotifications.notifyMarketInsight(
                result.data.industry || "Market",
                `Large TAM identified via advanced analysis: $${(result.data.tam_estimate / 1000000000).toFixed(1)}B with ${((result.data.confidence_level || 0.5) * 100).toFixed(1)}% confidence`,
                result.data.tam_estimate > 100000000000 ? "high" : "medium",
                result.data.confidence_level || 0.5,
                ["tam_analysis", "scenario_planning", "market_size"],
              );
            }
          }

          await notificationService.sendCalculationStatus(
            "TAM Analysis",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_size_calculator": {
          const startTime2 = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "internal_models",
            "Market Size Calculation",
            0,
            true,
          );

          await notificationService.sendCalculationStatus(
            "Market Size Calculation",
            "started",
          );

          result = await dataService.calculateMarketSize(processedArgs as any);
          const executionTime2 = Date.now() - startTime2;

          if (result?.success) {
            // Enhanced notification for market size completion
            await tamNotifications.notifyCalculationMilestone(
              "validation_completed",
              result.data.industry || "Unknown Industry",
              result.data.market_size || 0,
              result.data.confidence_level || 0.5,
              result.data.methodology || "Market size analysis",
              result.data.key_factors || [
                "Market demand analysis",
                "Competitive landscape",
                "Growth projections",
              ],
              result.data.limitations || [
                "Data availability",
                "Market volatility",
                "Regulatory changes",
              ],
            );

            // Notify about data source performance
            await tamNotifications.notifyDataSourcePerformance(
              "internal_models",
              "Market Size Calculation",
              executionTime2,
              true,
            );
          }

          await notificationService.sendCalculationStatus(
            "Market Size Calculation",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "company_financials_retriever":
          await notificationService.sendDataFetchStatus(
            "Company Financials",
            "started",
          );
          // This tool maps to multiple AlphaVantage functions based on statementType
          result = await dataService.getCompanyFinancials(processedArgs as any); // New method in DataService
          await notificationService.sendDataFetchStatus(
            "Company Financials",
            result ? "completed" : "failed",
            result,
          );
          break;
        // MarketAnalysisTools cases (from market-tools.ts)
        case "industry_data": {
          await notificationService.sendDataFetchStatus(
            "Industry Data",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.industryData(processedArgs as any);
          await notificationService.sendDataFetchStatus(
            "Industry Data",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_size": {
          await notificationService.sendCalculationStatus(
            "Market Size Analysis",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.marketSize(processedArgs as any);
          await notificationService.sendCalculationStatus(
            "Market Size Analysis",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "sam_calculator": {
          const startTime = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "internal_models",
            "SAM Calculation",
            0,
            true,
          );

          await notificationService.sendCalculationStatus(
            "SAM Calculation",
            "started",
          );

          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.samCalculator(
            processedArgs as any,
          );
          const executionTime = Date.now() - startTime;

          if (result?.success) {
            // Enhanced notification for SAM calculation completion
            await tamNotifications.notifySamAnalysisComplete(
              result.data.industry || "Unknown Industry",
              result.data.sam_estimate || 0,
              result.data.confidence_level || 0.5,
              result.data.methodology || "Standard SAM calculation",
              ["internal_models", "market_research"],
              result.data.key_assumptions || [
                "Market penetration assumptions",
                "Geographic coverage",
                "Product-market fit",
              ],
              result.data.risk_factors || [
                "Market competition",
                "Technology changes",
                "Customer adoption rates",
              ],
              executionTime,
            ); // Check data quality and notify
            const confidence = result.data.confidence_level || 0.5;
            if (confidence < 0.7) {
              await tamNotifications.notifyDataQuality(
                "low_confidence",
                [`SAM estimate: ${(confidence * 100).toFixed(1)}%`],
                confidence,
                ["Limited market data", "High uncertainty in assumptions"],
                undefined,
              );
            }
          }

          await notificationService.sendCalculationStatus(
            "SAM Calculation",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_segments": {
          await notificationService.sendDataFetchStatus(
            "Market Segmentation",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.marketSegments(
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Market Segmentation",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_forecasting": {
          const startTime3 = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "internal_models",
            "Market Forecasting",
            0,
            true,
          );

          await notificationService.sendCalculationStatus(
            "Market Forecasting",
            "started",
          );

          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.marketForecasting(
            processedArgs as any,
          );
          const executionTime3 = Date.now() - startTime3;

          if (result?.success) {
            // Enhanced notification for forecasting completion
            const forecastData = result.data;
            const cagr = forecastData.cagr || 0;
            const forecastYears = forecastData.forecast_years || 5;

            await tamNotifications.notifyForecastComplete(
              forecastData.industry || "Unknown Industry",
              forecastYears,
              cagr,
              forecastData.confidence_level || 0.5,
              forecastData.methodology || "Time series analysis",
              forecastData.risk_factors || [
                "Economic cycles",
                "Technology disruption",
                "Market saturation",
              ],
            );

            // Notify about data source performance
            await tamNotifications.notifyDataSourcePerformance(
              "internal_models",
              "Market Forecasting",
              executionTime3,
              true,
            );

            // Check for high growth and notify
            if (cagr > 0.15) {
              // > 15% CAGR
              await tamNotifications.notifyMarketInsight(
                forecastData.industry || "Market",
                `High growth forecast: ${(cagr * 100).toFixed(1)}% CAGR over ${forecastYears} years`,
                cagr > 0.25 ? "critical" : "high",
                forecastData.confidence_level || 0.5,
                ["market_forecast", "high_growth"],
              );
            }
          }

          await notificationService.sendCalculationStatus(
            "Market Forecasting",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_comparison": {
          await notificationService.sendDataFetchStatus(
            "Market Comparison",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.marketComparison(
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Market Comparison",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "data_validation": {
          const startTime4 = Date.now();
          await tamNotifications.notifyDataSourcePerformance(
            "internal_models",
            "Data Validation",
            0,
            true,
          );

          await notificationService.sendDataFetchStatus(
            "Data Validation",
            "started",
          );

          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.dataValidation(
            processedArgs as any,
          );
          const executionTime4 = Date.now() - startTime4;

          if (result?.success) {
            // Enhanced notification for data validation completion
            const validationData = result.data;
            const qualityScore = validationData.quality_score || 0.5;

            await tamNotifications.notifyCalculationMilestone(
              "validation_completed",
              validationData.data_source || "Data Validation",
              0, // No market size for validation
              qualityScore,
              validationData.methodology || "Data quality assessment",
              validationData.checks_performed || [
                "Data completeness",
                "Data accuracy",
                "Data consistency",
              ],
              validationData.issues_found || [
                "Data quality concerns identified",
              ],
            );

            // Send data quality notification based on validation results
            if (qualityScore < 0.7) {
              await tamNotifications.notifyDataQuality(
                qualityScore < 0.5 ? "missing_data" : "low_confidence",
                [`Quality score: ${(qualityScore * 100).toFixed(1)}%`],
                qualityScore,
                validationData.sources_checked || [
                  "primary_data",
                  "secondary_data",
                ],
                validationData.variance || undefined,
              );
            } else {
              await tamNotifications.notifyDataQuality(
                "high_confidence",
                [
                  `Validation passed with ${(qualityScore * 100).toFixed(1)}% quality score`,
                ],
                qualityScore,
                validationData.sources_checked || [
                  "primary_data",
                  "secondary_data",
                ],
                validationData.variance || undefined,
              );
            }

            // Notify about data source performance
            await tamNotifications.notifyDataSourcePerformance(
              "internal_models",
              "Data Validation",
              executionTime4,
              true,
            );
          }

          await notificationService.sendDataFetchStatus(
            "Data Validation",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "market_opportunities": {
          await notificationService.sendDataFetchStatus(
            "Market Opportunities",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.marketOpportunities(
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Market Opportunities",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        case "generic_data_query": {
          await notificationService.sendDataFetchStatus(
            "Generic Data Query",
            "started",
          );
          const { MarketAnalysisTools } = await import(
            "./tools/market-tools.js"
          );
          result = await MarketAnalysisTools.genericDataQuery(
            processedArgs as any,
          );
          await notificationService.sendDataFetchStatus(
            "Generic Data Query",
            result ? "completed" : "failed",
            result,
          );
          break;
        }
        default:
          // This case should ideally not be reached if toolDefinition check is done correctly.
          throw new Error(`Unknown or unhandled tool: ${name}`);
      }

      // Log successful tool execution
      logger.info(`Tool executed: ${name}`, {
        args,
        // success: result.success, // Assuming result structure might change
        // cached: result.metadata?.cached
      });

      // Send completion notification
      // Assuming 'result' is the direct data or an object with an error property
      if (
        !result ||
        (typeof result === "object" &&
          Object.prototype.hasOwnProperty.call(result, "error"))
      ) {
        // Basic error check
        await notificationService.sendError({
          error: result?.error || "Unknown error during tool execution",
          tool: name,
          timestamp: new Date().toISOString(),
          details: result,
        });
      } else {
        await notificationService.sendMessage(
          "info",
          `Successfully completed ${name}`,
        );
      }

      // Format response for MCP
      // The raw JSON from data source tools is returned directly.
      // For analytical tools, the structured object is returned.
      const responseText = JSON.stringify(result, null, 2);

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error);

      // Send error notification
      await notificationService.sendError({
        error: error instanceof Error ? error.message : "Unknown error",
        tool: name,
        timestamp: new Date().toISOString(),
        details: error,
      });

      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "tam://readme",
          name: "TAM MCP Server Documentation",
          description:
            "README documentation for the Total Addressable Market (TAM) MCP Server",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://contributing",
          name: "Contributing Guidelines",
          description:
            "Comprehensive guidelines for contributing to the TAM MCP Server project",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://release-notes",
          name: "Release Notes",
          description: "Chronological change tracking and release history",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://prompt-strategies",
          name: "Business Analysis Prompt Strategies",
          description:
            "Comprehensive guide to using MCP prompts for professional business analysis",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://prompt-examples",
          name: "MCP Prompts Usage Examples",
          description:
            "Practical examples and workflows for business analysis prompts",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://prompt-reference",
          name: "MCP Prompts Complete Reference",
          description:
            "Complete reference guide for all 15 business analysis prompts",
          mimeType: "text/markdown",
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    try {
      let filePath: string;
      let content: string;

      // Get the source directory path (parent of src)
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const projectRoot = path.dirname(currentDir); // Go up from src to project root

      switch (uri) {
        case "tam://readme":
          filePath = path.join(projectRoot, "README.md");
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://contributing":
          filePath = path.join(projectRoot, "CONTRIBUTING.md");
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://release-notes":
          filePath = path.join(
            projectRoot,
            "doc",
            "reference",
            "RELEASE-NOTES.md",
          );
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://prompt-strategies":
          filePath = path.join(
            projectRoot,
            "doc",
            "guides",
            "mcp-client-prompt-strategies.md",
          );
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://prompt-examples":
          filePath = path.join(
            projectRoot,
            "doc",
            "consumer",
            "mcp-prompts-examples.md",
          );
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://prompt-reference":
          filePath = path.join(
            projectRoot,
            "doc",
            "consumer",
            "mcp-prompts-guide.md",
          );
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      logger.info(`Resource accessed: ${uri}`);

      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to read resource ${uri}:`, error);
      throw new Error(
        `Failed to read resource ${uri}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const prompts = getAllPromptDefinitions();
    logger.info(`Listed ${prompts.length} available prompts`);

    return {
      prompts,
    };
  });

  // Get prompt content
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const promptDefinition = getPromptDefinition(name);

    if (!promptDefinition) {
      logger.warn(`Attempted to get unknown prompt: ${name}`);
      throw new Error(`Unknown prompt: ${name}`);
    }

    // Validate required arguments
    const requiredArgs =
      promptDefinition.arguments?.filter((arg) => arg.required) ?? [];
    for (const requiredArg of requiredArgs) {
      if (!args || !(requiredArg.name in args)) {
        logger.warn(
          `Missing required argument ${requiredArg.name} for prompt ${name}`,
        );
        throw new Error(`Missing required argument: ${requiredArg.name}`);
      }
    }

    // Generate prompt content based on the prompt type
    const promptContent = generatePromptContent(name, args ?? {});

    logger.info(`Generated prompt: ${name}`, { args });

    return {
      description: promptDefinition.description,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: promptContent,
          },
        },
      ],
    };
  });

  // Cleanup function
  const cleanup = async () => {
    logger.info("Shutting down TAM MCP Server...");

    logger.info("TAM MCP Server shutdown complete");
  };

  // Log server startup
  logger.info("TAM MCP Server initialized", {
    version: "1.0.0",
    tools: getAllToolDefinitions().length, // Changed: Use new function
    prompts: getAllPromptDefinitions().length, // Added: Prompts count
    resources: 6, // README, CONTRIBUTING, Release Notes, Prompt Strategies, Prompt Examples, Prompt Reference
    capabilities: ["tools", "prompts", "resources", "logging", "notifications"], // Added prompts capability
    rateLimit: {
      requests: RATE_LIMIT_REQUESTS,
      window: RATE_LIMIT_WINDOW,
    },
  });

  // Log API availability status at startup
  logApiAvailabilityStatus();

  return { server, cleanup, notificationService };
}
