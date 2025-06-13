#!/usr/bin/env node

// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  // ToolDefinition, // Removed, will use local definition
  // z, // Removed, z is imported in tool-definitions now
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod'; // Added: Import z directly for validationError typing
import { getAllToolDefinitions, getToolDefinition, getToolValidationSchema } from './tools/tool-definitions.js'; // Changed: Import local ToolDefinition
import { DataService } from './services/DataService.js'; // Added
import { logger, checkRateLimit } from './utils/index.js';
import { NotificationService } from './notifications/notification-service.js';

export async function createServer() {
  const server = new Server(
    {
      name: "tam-mcp-server",
      version: "1.0.0",
      toolDefinitionPath: './tools/tool-definitions.js' // Added: Inform SDK where to potentially load definitions if it supports it
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        logging: {},
        notifications: {},
      },
    }
  );

  // Initialize notification service
  const notificationService = new NotificationService(server);
  const dataService = new DataService(); // Added: Initialize DataService

  // Rate limiting configuration
  const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');
  const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000'); // 1 minute

  // Create logs directory if it doesn't exist
  const fs = await import('fs');
  const path = await import('path');
  const logsDir = path.join(process.cwd(), 'logs');
  
  try {
    await fs.promises.access(logsDir);
  } catch {
    await fs.promises.mkdir(logsDir, { recursive: true });
  }

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = getAllToolDefinitions(); // Changed: Use new function
    logger.info(`Listed ${tools.length} available tools`);
    
    return {
      tools,
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

    // Validate arguments using the tool's input schema
    try {
      const validationSchema = getToolValidationSchema(name);
      if (validationSchema) {
        validationSchema.parse(args);
      }
    } catch (validationError) {
      logger.warn(`Invalid arguments for tool ${name}:`, { args, error: validationError });
      return {
        content: [{
          type: "text",
          text: `Error: Invalid arguments for tool ${name}. ${ (validationError as z.ZodError).errors.map((e:any) => e.message).join(', ')}`
        }],
        isError: true
      };
    }
    
    // Rate limiting check
    const clientId = 'default'; // In production, this would be based on authentication
    const rateLimitResult = checkRateLimit(clientId, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW);
    
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

    logger.info(`Tool called: ${name}`, { args, remaining: rateLimitResult.remaining });

    if (!args) {
      return {
        content: [{
          type: "text",
          text: "Error: Missing required arguments"
        }],
        isError: true
      };
    }

    try {
      let result: any; // Using any for now, should be typed based on tool output schemas
      
      // Send notification that tool execution started
      await notificationService.sendMessage('info', `Starting execution of ${name}`);
      
      // Refactored tool dispatching to use DataService
      // This switch will now primarily call methods on dataService
      switch (name) {
        case 'alphaVantage_getCompanyOverview':
          await notificationService.sendDataFetchStatus('AlphaVantage Company Overview', 'started');
          result = await dataService.getAlphaVantageData('OVERVIEW', args as any);
          await notificationService.sendDataFetchStatus('AlphaVantage Company Overview', result ? 'completed' : 'failed', result);
          break;
        case 'alphaVantage_searchSymbols':
          await notificationService.sendDataFetchStatus('AlphaVantage Symbol Search', 'started');
          result = await dataService.getAlphaVantageData('SYMBOL_SEARCH', args as any); // Assuming DataService handles this
          await notificationService.sendDataFetchStatus('AlphaVantage Symbol Search', result ? 'completed' : 'failed', result);
          break;
        case 'bls_getSeriesData':
          await notificationService.sendDataFetchStatus('BLS Series Data', 'started');
          result = await dataService.getBlsData('fetchSeriesData', args as any);
          await notificationService.sendDataFetchStatus('BLS Series Data', result ? 'completed' : 'failed', result);
          break;
        case 'census_fetchIndustryData':
          await notificationService.sendDataFetchStatus('Census Industry Data', 'started');
          result = await dataService.getCensusData('fetchIndustryData', args as any);
          await notificationService.sendDataFetchStatus('Census Industry Data', result ? 'completed' : 'failed', result);
          break;
        case 'census_fetchMarketSize':
          await notificationService.sendDataFetchStatus('Census Market Size', 'started');
          result = await dataService.getCensusData('fetchMarketSize', args as any);
          await notificationService.sendDataFetchStatus('Census Market Size', result ? 'completed' : 'failed', result);
          break;
        case 'fred_getSeriesObservations':
          await notificationService.sendDataFetchStatus('FRED Series Observations', 'started');
          result = await dataService.getFredData(args as any); // To be implemented in DataService
          await notificationService.sendDataFetchStatus('FRED Series Observations', result ? 'completed' : 'failed', result);
          break;
        case 'imf_getDataset':
          await notificationService.sendDataFetchStatus('IMF Dataset', 'started');
          result = await dataService.getImfData('fetchImfDataset', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('IMF Dataset', result ? 'completed' : 'failed', result);
          break;
        case 'imf_getLatestObservation':
          await notificationService.sendDataFetchStatus('IMF Latest Observation', 'started');
          result = await dataService.getImfData('fetchMarketSize', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('IMF Latest Observation', result ? 'completed' : 'failed', result);
          break;
        case 'nasdaq_getDatasetTimeSeries':
          await notificationService.sendDataFetchStatus('Nasdaq Timeseries', 'started');
          result = await dataService.getNasdaqData('fetchIndustryData', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('Nasdaq Timeseries', result ? 'completed' : 'failed', result);
          break;
        case 'nasdaq_getLatestDatasetValue':
          await notificationService.sendDataFetchStatus('Nasdaq Latest Value', 'started');
          result = await dataService.getNasdaqData('fetchMarketSize', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('Nasdaq Latest Value', result ? 'completed' : 'failed', result);
          break;
        case 'oecd_getDataset':
          await notificationService.sendDataFetchStatus('OECD Dataset', 'started');
          result = await dataService.getOecdData('fetchOecdDataset', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('OECD Dataset', result ? 'completed' : 'failed', result);
          break;
        case 'oecd_getLatestObservation':
          await notificationService.sendDataFetchStatus('OECD Latest Observation', 'started');
          result = await dataService.getOecdData('fetchMarketSize', args as any); // To be implemented
          await notificationService.sendDataFetchStatus('OECD Latest Observation', result ? 'completed' : 'failed', result);
          break;
        case 'worldBank_getIndicatorData':
          await notificationService.sendDataFetchStatus('World Bank Indicator Data', 'started');
          result = await dataService.getWorldBankData(args as any); // To be implemented
          await notificationService.sendDataFetchStatus('World Bank Indicator Data', result ? 'completed' : 'failed', result);
          break;
        case 'industry_search':
          await notificationService.sendDataFetchStatus('Industry Search', 'started');
          result = await dataService.searchIndustries(args as any);
          await notificationService.sendDataFetchStatus('Industry Search', result ? 'completed' : 'failed', result);
          break;
        case 'tam_calculator':
          await notificationService.sendCalculationStatus('TAM Calculation', 'started');
          result = await dataService.calculateTam(args as any);
          await notificationService.sendCalculationStatus('TAM Calculation', result ? 'completed' : 'failed', result);
          break;
        case 'market_size_calculator':
          await notificationService.sendCalculationStatus('Market Size Calculation', 'started');
          result = await dataService.calculateMarketSize(args as any);
          await notificationService.sendCalculationStatus('Market Size Calculation', result ? 'completed' : 'failed', result);
          break;
        case 'company_financials_retriever':
          await notificationService.sendDataFetchStatus('Company Financials', 'started');
          // This tool maps to multiple AlphaVantage functions based on statementType
          result = await dataService.getCompanyFinancials(args as any); // New method in DataService
          await notificationService.sendDataFetchStatus('Company Financials', result ? 'completed' : 'failed', result);
          break;
        // Cases for old tools like 'industry_data', 'market_size', etc. are removed as they are replaced by specific tools.
        // Ensure all tools from AllToolDefinitions are handled or have a default error.
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
      if (!result || (typeof result === 'object' && result.hasOwnProperty('error'))) { // Basic error check
        await notificationService.sendError({
          error: result?.error || 'Unknown error during tool execution',
          tool: name,
          timestamp: new Date().toISOString(),
          details: result
        });
      } else {
        await notificationService.sendMessage('info', `Successfully completed ${name}`);
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
        error: error instanceof Error ? error.message : 'Unknown error',
        tool: name,
        timestamp: new Date().toISOString(),
        details: error
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          description: "README documentation for the Total Addressable Market (TAM) MCP Server",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://contributing",
          name: "Contributing Guidelines",
          description: "Comprehensive guidelines for contributing to the TAM MCP Server project",
          mimeType: "text/markdown",
        },
        {
          uri: "tam://release-notes",
          name: "Release Notes",
          description: "Chronological change tracking and release history",
          mimeType: "text/markdown",
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    try {
      let filePath: string;
      let content: string;
      
      // Get the source directory path (parent of src)
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const projectRoot = path.dirname(currentDir); // Go up from src to project root
      
      switch (uri) {
        case "tam://readme":
          filePath = path.join(projectRoot, 'README.md');
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://contributing":
          filePath = path.join(projectRoot, 'CONTRIBUTING.md');
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        case "tam://release-notes":
          filePath = path.join(projectRoot, 'doc', 'RELEASE-NOTES.md');
          content = await fs.promises.readFile(filePath, "utf-8");
          break;
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
      
      logger.info(`Resource accessed: ${uri}`);
      
      return {
        contents: [
          {
            uri: uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to read resource ${uri}:`, error);
      throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Cleanup function
  const cleanup = async () => {
    logger.info('Shutting down TAM MCP Server...');
    
    logger.info('TAM MCP Server shutdown complete');
  };

  // Log server startup
  logger.info('TAM MCP Server initialized', {
    version: '1.0.0',
    tools: getAllToolDefinitions().length, // Changed: Use new function
    resources: 3, // README, CONTRIBUTING, Release Notes
    capabilities: ['tools', 'resources', 'logging', 'notifications'],
    rateLimit: {
      requests: RATE_LIMIT_REQUESTS,
      window: RATE_LIMIT_WINDOW
    }
  });

  return { server, cleanup, notificationService };
}
