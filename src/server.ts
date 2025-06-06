import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

import { MCPTools } from './tools/mcpTools.js';
import { Logger } from './utils/logger.js';
import { DiscoveryResponse } from './types/schemas.js';
import { 
  IndustrySearchInputSchema,
  IndustryDataInputSchema,
  MarketSizeInputSchema,
  TamCalculationInputSchema,
  SamCalculationInputSchema,
  MarketSegmentsInputSchema,
  MarketForecastInputSchema,
  MarketComparisonInputSchema,
  ValidationInputSchema,
  OpportunityAnalysisInputSchema
} from './types/schemas.js';

export class MCPServer {
  private app: express.Application;
  private logger: Logger;
  private mcpTools: MCPTools;
  private sessions: Map<string, { id: string; createdAt: Date; lastActivity: Date }>;
  private sseClients: Map<string, express.Response>;

  // Prometheus metrics with definite assignment assertions
  private httpRequestsTotal!: Counter<string>;
  private httpRequestDuration!: Histogram<string>;
  private activeConnections!: Gauge<string>;
  private toolExecutions!: Counter<string>;

  constructor(mcpTools: MCPTools, options: {
    corsOrigin?: string;
    rateLimit?: { windowMs: number; max: number };
    enableMetrics?: boolean;
  } = {}) {
    this.app = express();
    this.logger = Logger.getInstance();
    this.mcpTools = mcpTools;
    this.sessions = new Map();
    this.sseClients = new Map();

    this.initializeMetrics();
    this.setupMiddleware(options);
    this.setupRoutes();
    this.setupErrorHandling();
    this.startSessionCleanup();
  }

  private initializeMetrics(): void {
    // Collect default Node.js metrics
    collectDefaultMetrics();

    // Custom HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type']
    });

    this.toolExecutions = new Counter({
      name: 'tool_executions_total',
      help: 'Total number of tool executions',
      labelNames: ['tool', 'status']
    });
  }

  private setupMiddleware(options: {
    corsOrigin?: string;
    rateLimit?: { windowMs: number; max: number };
    enableMetrics?: boolean;
  }): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for SSE
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: options.corsOrigin || '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'X-MCP-Version', 'X-API-Key', 'Authorization'],
      credentials: false
    }));

    // Compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '1mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: options.rateLimit?.windowMs || 60 * 1000, // 1 minute
      max: options.rateLimit?.max || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '1 minute'
      }
    });
    this.app.use(limiter);

    // Request logging and metrics middleware
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
      const startTime = Date.now();
      const sessionId = uuidv4();
      (req as any).sessionId = sessionId;
      
      this.activeConnections.inc();
      this.logger.logRequest(req, { sessionId });

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logger.logResponse(req, res, duration, { sessionId });
        this.activeConnections.dec();

        const route = req.route?.path || req.path;
        this.httpRequestsTotal.inc({
          method: req.method,
          route,
          status_code: res.statusCode.toString()
        });

        this.httpRequestDuration.observe(
          { method: req.method, route },
          duration / 1000
        );
      });

      next();
    });

    // MCP version validation middleware
    this.app.use('/mcp', (req: express.Request, res: express.Response, next: express.NextFunction): void => {
      const mcpVersion = req.headers['x-mcp-version'] as string;
      if (req.method !== 'GET' && mcpVersion !== '2024-11-05') {
        res.status(400).json({
          error: 'Unsupported MCP version',
          required: '2024-11-05',
          provided: mcpVersion || 'none'
        });
        return;
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/mcp/health', (_req: express.Request, res: express.Response) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        sessions: this.sessions.size,
        uptime: process.uptime()
      });
    });

    // Metrics endpoint
    this.app.get('/mcp/metrics', async (_req: express.Request, res: express.Response) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Discovery endpoint
    this.app.get('/mcp/discovery', (_req: express.Request, res: express.Response) => {
      const toolDefinitions = this.mcpTools.getToolDefinitions();
      const discovery: DiscoveryResponse = {
        serverInfo: {
          name: 'TAM/SAM Market Sizing Server',
          version: '1.0.0',
          description: 'A comprehensive MCP server for Total Addressable Market and Serviceable Addressable Market calculations',
          author: 'TAM-MCP-Server Team',
          license: 'MIT',
          repository: 'https://github.com/tam-mcp-server/market-sizing-mcp',
          documentation: 'https://github.com/tam-mcp-server/market-sizing-mcp/blob/main/README.md'
        },
        capabilities: {
          tools: {
            listChanged: false,
            count: toolDefinitions.length
          },
          resources: {
            listChanged: false,
            count: 0
          },
          logging: {
            level: 'info'
          },
          prompts: {
            listChanged: false,
            count: 0
          }
        },
        tools: toolDefinitions,
        transport: {
          type: 'http-streamable',
          baseUrl: `${_req.protocol}://${_req.get('host')}`,
          endpoints: {
            discovery: '/mcp/discovery',
            health: '/mcp/health',
            metrics: '/mcp/metrics',
            events: '/mcp/events',
            tools: '/mcp/tools/{tool_name}'
          }
        },
        rateLimits: {
          requestsPerMinute: 100,
          concurrentRequests: 10,
          maxPayloadSize: '1MB'
        },
        dataCompliance: {
          gdprCompliant: true,
          ccpaCompliant: true,
          dataRetention: '30 days',
          privacyPolicy: 'https://github.com/tam-mcp-server/market-sizing-mcp/blob/main/PRIVACY.md'
        }
      };
      res.json(discovery);
    });

    // Session management
    this.app.post('/mcp/session', (_req: express.Request, res: express.Response) => {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.sessions.set(sessionId, session);
      res.json(session);
    });

    // Server-Sent Events endpoint
    this.app.get('/mcp/events', (req: express.Request, res: express.Response) => {
      const sessionId = req.query.sessionId as string;
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Store client connection
      this.sseClients.set(sessionId, res);

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        this.sendSSEEvent(res, 'heartbeat', { timestamp: new Date().toISOString() });
      }, 30000);

      // Cleanup on client disconnect
      req.on('close', () => {
        clearInterval(heartbeat);
        this.sseClients.delete(sessionId);
        this.activeConnections.dec();
      });
    });

    this.setupToolRoutes();

    // Root endpoint
    this.app.get('/', (_req: express.Request, res: express.Response) => {
      res.json({
        message: 'TAM/SAM Market Sizing MCP Server',
        version: '1.0.0',
        protocol: 'MCP 2024-11-05',
        endpoints: {
          discovery: '/mcp/discovery',
          health: '/mcp/health',
          metrics: '/mcp/metrics',
          events: '/mcp/events',
          tools: '/mcp/tools/{tool_name}'
        }
      });
    });
  }

  private setupToolRoutes(): void {
    // Industry Search
    this.app.post('/mcp/tools/industry_search', async (req: express.Request, res: express.Response) => {
      await this.executeTool('industry_search', req, res, IndustrySearchInputSchema,
        (input: any) => this.mcpTools.industrySearch(input));
    });

    // Get Industry Data
    this.app.post('/mcp/tools/get_industry_data', async (req: express.Request, res: express.Response) => {
      await this.executeTool('get_industry_data', req, res, IndustryDataInputSchema,
        (input: any) => this.mcpTools.getIndustryData(input));
    });

    // Get Market Size
    this.app.post('/mcp/tools/get_market_size', async (req: express.Request, res: express.Response) => {
      await this.executeTool('get_market_size', req, res, MarketSizeInputSchema,
        (input: any) => this.mcpTools.getMarketSize(input));
    });

    // Calculate TAM
    this.app.post('/mcp/tools/calculate_tam', async (req: express.Request, res: express.Response) => {
      await this.executeTool('calculate_tam', req, res, TamCalculationInputSchema,
        (input: any) => this.mcpTools.calculateTam(input));
    });

    // Calculate SAM
    this.app.post('/mcp/tools/calculate_sam', async (req: express.Request, res: express.Response) => {
      await this.executeTool('calculate_sam', req, res, SamCalculationInputSchema,
        (input: any) => this.mcpTools.calculateSam(input));
    });

    // Get Market Segments
    this.app.post('/mcp/tools/get_market_segments', async (req: express.Request, res: express.Response) => {
      await this.executeTool('get_market_segments', req, res, MarketSegmentsInputSchema,
        (input: any) => this.mcpTools.getMarketSegments(input));
    });

    // Forecast Market
    this.app.post('/mcp/tools/forecast_market', async (req: express.Request, res: express.Response) => {
      await this.executeTool('forecast_market', req, res, MarketForecastInputSchema,
        (input: any) => this.mcpTools.forecastMarket(input));
    });

    // Compare Markets
    this.app.post('/mcp/tools/compare_markets', async (req: express.Request, res: express.Response) => {
      await this.executeTool('compare_markets', req, res, MarketComparisonInputSchema,
        (input: any) => this.mcpTools.compareMarkets(input));
    });

    // Validate Market Data
    this.app.post('/mcp/tools/validate_market_data', async (req: express.Request, res: express.Response) => {
      await this.executeTool('validate_market_data', req, res, ValidationInputSchema,
        (input: any) => this.mcpTools.validateMarketData(input));
    });

    // Get Market Opportunities
    this.app.post('/mcp/tools/get_market_opportunities', async (req: express.Request, res: express.Response) => {
      await this.executeTool('get_market_opportunities', req, res, OpportunityAnalysisInputSchema,
        (input: any) => this.mcpTools.getMarketOpportunities(input));
    });
  }

  private async executeTool<T, R>(
    toolName: string,
    req: express.Request,
    res: express.Response,
    schema: any,
    handler: (input: T) => Promise<R>
  ): Promise<void> {
    const startTime = Date.now();
    const sessionId = (req as any).sessionId;

    try {
      // Validate input
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        this.toolExecutions.inc({ tool: toolName, status: 'error' });
        res.status(400).json({
          error: 'Invalid input parameters',
          details: validationResult.error.errors
        });
        return;
      }

      // Notify SSE clients of tool execution start
      this.broadcastSSEEvent('tool_start', {
        sessionId,
        tool: toolName,
        timestamp: new Date().toISOString()
      });

      // Execute tool
      const result = await handler(validationResult.data);
      const duration = Date.now() - startTime;

      // Log successful execution
      this.logger.logToolExecution(toolName, duration, true, { sessionId });
      this.toolExecutions.inc({ tool: toolName, status: 'success' });

      // Notify SSE clients of completion
      this.broadcastSSEEvent('tool_complete', {
        sessionId,
        tool: toolName,
        data: result,
        meta: {
          executionTime: duration,
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        data: result,
        meta: {
          executionTime: duration,
          tool: toolName,
          sessionId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.logToolExecution(toolName, duration, false, {
        sessionId,
        error: errorMessage
      });
      this.toolExecutions.inc({ tool: toolName, status: 'error' });

      // Notify SSE clients of error
      this.broadcastSSEEvent('tool_error', {
        sessionId,
        tool: toolName,
        error: errorMessage,
        meta: {
          executionTime: duration,
          timestamp: new Date().toISOString()
        }
      });

      res.status(500).json({
        success: false,
        error: errorMessage,
        meta: {
          executionTime: duration,
          tool: toolName,
          sessionId,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: express.Request, res: express.Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        path: req.originalUrl,
        availableEndpoints: [
          '/mcp/discovery',
          '/mcp/health',
          '/mcp/metrics',
          '/mcp/session',
          '/mcp/events',
          '/mcp/tools/{tool_name}'
        ]
      });
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: (req as any).sessionId
      });
    });
  }

  private sendSSEEvent(res: express.Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private broadcastSSEEvent(event: string, data: any): void {
    for (const [sessionId, client] of this.sseClients) {
      try {
        this.sendSSEEvent(client, event, data);
      } catch (error) {
        // Remove dead client
        this.sseClients.delete(sessionId);
        this.logger.warn('Removed dead SSE client', { sessionId });
      }
    }
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      const expiredSessions: string[] = [];

      for (const [sessionId, session] of this.sessions) {
        const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
        if (timeSinceActivity > 30 * 60 * 1000) { // 30 minutes
          expiredSessions.push(sessionId);
        }
      }

      for (const sessionId of expiredSessions) {
        this.sessions.delete(sessionId);
        this.sseClients.delete(sessionId);
        this.logger.debug('Session expired and cleaned up', { sessionId });
      }

      if (expiredSessions.length > 0) {
        this.logger.info('Cleaned up expired sessions', { count: expiredSessions.length });
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      this.logger.info('MCP Server started', {
        port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

/**
 * Factory function to create MCP server
 */
export function createMCPServer(mcpTools: MCPTools, options?: {
  corsOrigin?: string;
  rateLimit?: { windowMs: number; max: number };
  enableMetrics?: boolean;
}): MCPServer {
  return new MCPServer(mcpTools, options);
}
