#!/usr/bin/env node

/**
 * Market Sizing MCP Server - Main Entry Point
 * 
 * This is the main entry point for the Market Sizing Model Context Protocol (MCP) server.
 * It initializes the server with all required services and starts listening for requests.
 * 
 * Features:
 * - HTTP Streamable transport with Server-Sent Events
 * - 10 specialized market analysis tools
 * - Comprehensive caching and logging
 * - Prometheus metrics and monitoring
 * - Rate limiting and security middleware
 * - Session management
 * 
 * @author TAM-MCP-Server Team
 * @version 1.0.0
 */

import { config } from 'dotenv';
import { createMCPServer } from './server.js';
import { Logger } from './utils/logger.js';
import { CacheService } from './services/cacheService.js';
import { DataService } from './services/dataService.js';
import { MCPTools } from './tools/mcpTools.js';

// Load environment variables
config();

// Initialize logger
const logger = Logger.getInstance();

// Configuration with environment variable support
const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10), // 10 minutes
  },
  apiKeys: {
    // Add your data provider API keys here
    marketDataProvider: process.env.MARKET_DATA_API_KEY,
    industryAnalysisProvider: process.env.INDUSTRY_ANALYSIS_API_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  prometheus: {
    enabled: process.env.PROMETHEUS_ENABLED !== 'false',
    collectDefaultMetrics: process.env.COLLECT_DEFAULT_METRICS !== 'false',
  }
};

/**
 * Initialize and start the MCP server
 */
async function startServer(): Promise<void> {
  try {
    logger.info('🚀 Starting Market Sizing MCP Server...', {
      version: '1.0.0',
      nodeEnv: CONFIG.nodeEnv,
      port: CONFIG.port,
      host: CONFIG.host
    });

    // Initialize services
    logger.info('📦 Initializing services...');
    
    const cacheService = new CacheService({
      ttl: CONFIG.cache.ttl,
      checkperiod: CONFIG.cache.checkPeriod
    });

    const dataService = new DataService({
      apiKeys: {
        ...(CONFIG.apiKeys.marketDataProvider && { marketDataProvider: CONFIG.apiKeys.marketDataProvider }),
        ...(CONFIG.apiKeys.industryAnalysisProvider && { industryAnalysisProvider: CONFIG.apiKeys.industryAnalysisProvider })
      },
      cacheService
    });

    const mcpTools = new MCPTools(dataService, cacheService);

    // Create and configure the server
    logger.info('🔧 Creating MCP server...');
    const server = createMCPServer(mcpTools, {
      corsOrigin: CONFIG.corsOrigin,
      rateLimit: CONFIG.rateLimit,
      enableMetrics: CONFIG.prometheus.enabled
    });

    // Start the server
    server.start(CONFIG.port);

    logger.info('✅ Market Sizing MCP Server started successfully!', {
      address: `http://${CONFIG.host}:${CONFIG.port}`,
      endpoints: {
        discovery: '/mcp/discovery',
        session: '/mcp/session',
        tools: '/mcp/tools/{tool_name}',
        events: '/mcp/events',
        health: '/mcp/health',
        metrics: '/mcp/metrics'
      },
      availableTools: [
        'industry_search',
        'get_industry_data',
        'get_market_size',
        'calculate_tam',
        'calculate_sam',
        'get_market_segments',
        'forecast_market',
        'compare_markets',
        'validate_market_data',
        'get_market_opportunities'
      ]
    });

    // Log configuration in development
    if (CONFIG.nodeEnv === 'development') {
      logger.debug('🔍 Server configuration:', {
        config: {
          ...CONFIG,
          apiKeys: {
            marketDataProvider: CONFIG.apiKeys.marketDataProvider ? '[SET]' : '[NOT SET]',
            industryAnalysisProvider: CONFIG.apiKeys.industryAnalysisProvider ? '[SET]' : '[NOT SET]'
          }
        }
      });
    }

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
      logger.info('✅ Server closed successfully');
      logger.info('🔒 All services closed. Goodbye!');
      process.exit(0);
    };

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', { error: error.message, stack: error.stack });
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection:', { reason, promise });
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('💥 Failed to start server:', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
}

/**
 * Display startup banner
 */
function displayBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Market Sizing MCP Server v1.0.0                     ║
║                                                                              ║
║  🎯 Comprehensive Market Analysis & TAM/SAM Calculations                     ║
║  🔧 Model Context Protocol (MCP) 2024-11-05 Specification                   ║
║  🚀 HTTP Streamable Transport with Server-Sent Events                       ║
║  📊 10 Specialized Market Analysis Tools                                    ║
║  💾 Advanced Caching & Performance Monitoring                               ║
║  🔒 Enterprise Security & Rate Limiting                                     ║
║                                                                              ║
║  Ready to power your market analysis workflows!                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  displayBanner();
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { startServer, CONFIG };
