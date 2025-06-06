import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createMCPServer } from '../../src/server.js';
import { MCPTools } from '../../src/tools/mcpTools.js';
import { DataService } from '../../src/services/dataService.js';
import { CacheService } from '../../src/services/cacheService.js';
import type { Express } from 'express';

describe('MCP Server Integration Tests', () => {
  let app: Express;
  let cacheService: CacheService;

  beforeAll(async () => {
    // Set up test server
    cacheService = new CacheService({ ttl: 300 });
    const dataService = new DataService({ 
      cacheService,
      apiKeys: {}
    });
    const mcpTools = new MCPTools(dataService, cacheService);

    app = createMCPServer({
      mcpTools,
      cacheService,
      corsOrigin: '*',
      rateLimit: { windowMs: 900000, max: 1000 }, // Higher limits for testing
      sessionConfig: { secret: 'test-secret', maxAge: 3600000 },
      prometheus: { enabled: true, collectDefaultMetrics: false }
    });
  });

  afterAll(() => {
    cacheService.close();
  });

  describe('GET /mcp/discovery', () => {
    it('should return server capabilities', async () => {
      const response = await request(app)
        .get('/mcp/discovery')
        .expect(200);

      expect(response.body.protocol_version).toBe('2024-11-05');
      expect(response.body.server_info.name).toBe('market-sizing-mcp');
      expect(Array.isArray(response.body.capabilities.tools)).toBe(true);
      expect(response.body.capabilities.tools).toHaveLength(10);
    });

    it('should include transport capabilities', async () => {
      const response = await request(app)
        .get('/mcp/discovery')
        .expect(200);

      expect(response.body.capabilities.transports).toContain('http_sse');
      expect(response.body.capabilities.experimental).toBeDefined();
    });
  });

  describe('POST /mcp/session', () => {
    it('should create new session', async () => {
      const response = await request(app)
        .post('/mcp/session')
        .send({
          client_info: {
            name: 'test-client',
            version: '1.0.0'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session_id).toBeDefined();
      expect(response.body.server_info).toBeDefined();
    });

    it('should validate client info', async () => {
      const response = await request(app)
        .post('/mcp/session')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Tool Execution Endpoints', () => {
    describe('POST /mcp/tools/industry_search', () => {
      it('should execute industry search successfully', async () => {
        const response = await request(app)
          .post('/mcp/tools/industry_search')
          .send({
            query: 'artificial intelligence',
            filters: { region: 'global' }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.industries).toBeDefined();
        expect(Array.isArray(response.body.data.industries)).toBe(true);
      });

      it('should return validation error for empty query', async () => {
        const response = await request(app)
          .post('/mcp/tools/industry_search')
          .send({ query: '' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /mcp/tools/calculate_tam', () => {
      it('should calculate TAM successfully', async () => {
        const response = await request(app)
          .post('/mcp/tools/calculate_tam')
          .send({
            industry: 'SaaS',
            geography: 'North America',
            timeframe: '2024'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.tam_usd).toBeGreaterThan(0);
        expect(response.body.data.methodology).toBeDefined();
      });

      it('should handle invalid geography', async () => {
        const response = await request(app)
          .post('/mcp/tools/calculate_tam')
          .send({
            industry: 'SaaS',
            geography: 'InvalidLocation'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /mcp/tools/forecast_market', () => {
      it('should generate market forecast', async () => {
        const response = await request(app)
          .post('/mcp/tools/forecast_market')
          .send({
            industry: 'Cloud Computing',
            base_year: 2024,
            forecast_years: 3,
            methodology: 'compound_growth'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.forecast)).toBe(true);
        expect(response.body.data.forecast).toHaveLength(3);
      });
    });

    describe('POST /mcp/tools/compare_markets', () => {
      it('should compare multiple markets', async () => {
        const response = await request(app)
          .post('/mcp/tools/compare_markets')
          .send({
            markets: [
              { industry: 'SaaS', geography: 'US' },
              { industry: 'SaaS', geography: 'Europe' }
            ],
            metrics: ['market_size', 'growth_rate']
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.comparisons)).toBe(true);
      });
    });
  });

  describe('GET /mcp/events', () => {
    it('should establish SSE connection', async () => {
      const response = await request(app)
        .get('/mcp/events')
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should send heartbeat events', (done) => {
      const req = request(app)
        .get('/mcp/events')
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk.toString();
            if (data.includes('event: heartbeat')) {
              callback(null, data);
              done();
            }
          });
        });

      req.end();
    });
  });

  describe('GET /mcp/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/mcp/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.services).toBeDefined();
    });

    it('should include service status', async () => {
      const response = await request(app)
        .get('/mcp/health')
        .expect(200);

      expect(response.body.services.cache).toBe('healthy');
      expect(response.body.services.data_service).toBe('healthy');
      expect(response.body.version).toBeDefined();
    });
  });

  describe('GET /mcp/metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/mcp/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make requests up to the limit
      const promises = Array.from({ length: 50 }, () =>
        request(app).get('/mcp/discovery')
      );

      const results = await Promise.all(promises);
      
      // All should succeed (within limit)
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });

  describe('CORS Handling', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/mcp/discovery')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/mcp/discovery')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/mcp/tools/industry_search')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        query: 'test',
        data: 'x'.repeat(20 * 1024 * 1024) // 20MB
      };

      const response = await request(app)
        .post('/mcp/tools/industry_search')
        .send(largePayload)
        .expect(413);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should maintain session state across requests', async () => {
      // Create session
      const sessionResponse = await request(app)
        .post('/mcp/session')
        .send({
          client_info: { name: 'test-client', version: '1.0.0' }
        })
        .expect(200);

      const sessionId = sessionResponse.body.session_id;

      // Use session in subsequent request
      const toolResponse = await request(app)
        .post('/mcp/tools/industry_search')
        .set('X-Session-ID', sessionId)
        .send({ query: 'fintech' })
        .expect(200);

      expect(toolResponse.body.success).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache tool responses', async () => {
      const payload = { query: 'blockchain technology' };

      // First request
      const response1 = await request(app)
        .post('/mcp/tools/industry_search')
        .send(payload)
        .expect(200);

      expect(response1.body.metadata.cache_used).toBe(false);

      // Second request should use cache
      const response2 = await request(app)
        .post('/mcp/tools/industry_search')
        .send(payload)
        .expect(200);

      expect(response2.body.metadata.cache_used).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/mcp/tools/get_market_size')
        .send({
          industry: 'Software',
          geography: 'Global',
          year: 2024
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 3 seconds max
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post('/mcp/tools/industry_search')
          .send({ query: `test_${i}` })
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(10000); // 10 seconds max for 20 requests
    });
  });
});
