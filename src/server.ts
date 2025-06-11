#!/usr/bin/env node

// Load environment variables first, before any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MarketAnalysisTools } from './tools/market-tools.js';
import { logger, CacheManager, checkRateLimit } from './utils/index.js';
import { NotificationService } from './notifications/notification-service.js';

export async function createServer() {
  const server = new Server(
    {
      name: "tam-mcp-server",
      version: "1.0.0",
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
    const tools = MarketAnalysisTools.getToolDefinitions();
    logger.info(`Listed ${tools.length} available tools`);
    
    return {
      tools,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
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
      let result;
      
      // Send notification that tool execution started
      await notificationService.sendMessage('info', `Starting execution of ${name}`);
      
      switch (name) {
        case 'industry_search':
          await notificationService.sendDataFetchStatus('Industry Database', 'started');
          result = await MarketAnalysisTools.industrySearch(args as any);
          await notificationService.sendDataFetchStatus('Industry Database', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'industry_data':
          await notificationService.sendDataFetchStatus('Industry Data', 'started');
          result = await MarketAnalysisTools.industryData(args as any);
          await notificationService.sendDataFetchStatus('Industry Data', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'market_size':
          await notificationService.sendCalculationStatus('Market Size', 'started');
          result = await MarketAnalysisTools.marketSize(args as any);
          await notificationService.sendCalculationStatus('Market Size', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'tam_calculator':
          await notificationService.sendCalculationStatus('TAM Calculation', 'started');
          result = await MarketAnalysisTools.tamCalculator(args as any);
          await notificationService.sendCalculationStatus('TAM Calculation', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'sam_calculator':
          await notificationService.sendCalculationStatus('SAM Calculation', 'started');
          result = await MarketAnalysisTools.samCalculator(args as any);
          await notificationService.sendCalculationStatus('SAM Calculation', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'market_segments':
          await notificationService.sendDataFetchStatus('Market Segments', 'started');
          result = await MarketAnalysisTools.marketSegments(args as any);
          await notificationService.sendDataFetchStatus('Market Segments', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'market_forecasting':
          await notificationService.sendCalculationStatus('Market Forecasting', 'started');
          result = await MarketAnalysisTools.marketForecasting(args as any);
          await notificationService.sendCalculationStatus('Market Forecasting', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'market_comparison':
          await notificationService.sendDataFetchStatus('Market Comparison', 'started');
          result = await MarketAnalysisTools.marketComparison(args as any);
          await notificationService.sendDataFetchStatus('Market Comparison', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'data_validation':
          await notificationService.sendValidationStatus('Data Validation', 'started');
          result = await MarketAnalysisTools.dataValidation(args as any);
          await notificationService.sendValidationStatus('Data Validation', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        case 'market_opportunities':
          await notificationService.sendDataFetchStatus('Market Opportunities', 'started');
          result = await MarketAnalysisTools.marketOpportunities(args as any);
          await notificationService.sendDataFetchStatus('Market Opportunities', 
            result.success ? 'completed' : 'failed', result.data);
          break;
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Log successful tool execution
      logger.info(`Tool executed successfully: ${name}`, { 
        success: result.success,
        cached: result.metadata.cached 
      });

      // Send completion notification
      if (result.success) {
        await notificationService.sendMessage('info', `Successfully completed ${name}`);
      } else {
        await notificationService.sendError({
          error: result.error || 'Unknown error',
          tool: name,
          timestamp: new Date().toISOString(),
          details: result.data
        });
      }

      // Format response for MCP
      const responseText = result.success 
        ? JSON.stringify(result.data, null, 2)
        : `Error: ${result.error}`;

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
    
    // Log cache statistics
    const cacheStats = CacheManager.stats();
    logger.info('Cache statistics:', cacheStats);
    
    // Clear cache
    CacheManager.flush();
    
    logger.info('TAM MCP Server shutdown complete');
  };

  // Log server startup
  logger.info('TAM MCP Server initialized', {
    version: '1.0.0',
    tools: MarketAnalysisTools.getToolDefinitions().length,
    resources: 3, // README, CONTRIBUTING, Release Notes
    capabilities: ['tools', 'resources', 'logging', 'notifications'],
    rateLimit: {
      requests: RATE_LIMIT_REQUESTS,
      window: RATE_LIMIT_WINDOW
    }
  });

  return { server, cleanup, notificationService };
}
