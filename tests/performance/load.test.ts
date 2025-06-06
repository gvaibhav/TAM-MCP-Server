import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import request from 'supertest';
import { createMCPServer } from '../../src/server.js';
import { MCPTools } from '../../src/tools/mcpTools.js';
import { DataService } from '../../src/services/dataService.js';
import { CacheService } from '../../src/services/cacheService.js';
import type { Express } from 'express';

describe('Performance Tests', () => {
  let app: Express;
  let cacheService: CacheService;

  beforeAll(async () => {
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
      rateLimit: { windowMs: 900000, max: 10000 },
      sessionConfig: { secret: 'test-secret', maxAge: 3600000 },
      prometheus: { enabled: true, collectDefaultMetrics: false }
    });
  });

  afterAll(() => {
    cacheService.close();
  });

  describe('Response Time Performance', () => {
    it('should respond to discovery endpoint within 100ms', async () => {
      const start = performance.now();
      
      await request(app)
        .get('/mcp/discovery')
        .expect(200);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should execute industry search within 500ms', async () => {
      const start = performance.now();
      
      await request(app)
        .post('/mcp/tools/industry_search')
        .send({ query: 'technology' })
        .expect(200);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should calculate TAM within 1000ms', async () => {
      const start = performance.now();
      
      await request(app)
        .post('/mcp/tools/calculate_tam')
        .send({
          industry: 'SaaS',
          geography: 'Global'
        })
        .expect(200);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent discovery requests', async () => {
      const start = performance.now();
      
      const promises = Array.from({ length: 50 }, () =>
        request(app).get('/mcp/discovery')
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(2000); // 2 seconds for 50 requests
    });

    it('should handle 25 concurrent tool executions', async () => {
      const start = performance.now();
      
      const promises = Array.from({ length: 25 }, (_, i) =>
        request(app)
          .post('/mcp/tools/industry_search')
          .send({ query: `industry_${i}` })
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(25);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(5000); // 5 seconds for 25 tool executions
    });

    it('should handle mixed concurrent requests', async () => {
      const start = performance.now();
      
      const promises = [
        ...Array.from({ length: 10 }, () => 
          request(app).get('/mcp/discovery')
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/mcp/tools/industry_search')
            .send({ query: `test_${i}` })
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/mcp/tools/get_market_size')
            .send({
              industry: `Industry_${i}`,
              geography: 'Global',
              year: 2024
            })
        )
      ];
      
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(30);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(6000); // 6 seconds for mixed requests
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache performance improvement', async () => {
      const payload = { query: 'performance_test_cache' };
      
      // First request (cache miss)
      const start1 = performance.now();
      const response1 = await request(app)
        .post('/mcp/tools/industry_search')
        .send(payload)
        .expect(200);
      const duration1 = performance.now() - start1;
      
      expect(response1.body.metadata.cache_used).toBe(false);
      
      // Second request (cache hit)
      const start2 = performance.now();
      const response2 = await request(app)
        .post('/mcp/tools/industry_search')
        .send(payload)
        .expect(200);
      const duration2 = performance.now() - start2;
      
      expect(response2.body.metadata.cache_used).toBe(true);
      expect(duration2).toBeLessThan(duration1 * 0.5); // At least 50% faster
    });

    it('should maintain performance with cache under load', async () => {
      const queries = Array.from({ length: 20 }, (_, i) => `cache_test_${i % 5}`);
      
      // Warm up cache
      await Promise.all(
        queries.slice(0, 5).map(query =>
          request(app)
            .post('/mcp/tools/industry_search')
            .send({ query })
        )
      );
      
      // Test performance with cache hits
      const start = performance.now();
      const promises = queries.map(query =>
        request(app)
          .post('/mcp/tools/industry_search')
          .send({ query })
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(2000); // Should be fast with cache
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/mcp/tools/industry_search')
          .send({ query: `memory_test_${i}` });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Throughput Tests', () => {
    it('should maintain high throughput for simple requests', async () => {
      const requestCount = 100;
      const start = performance.now();
      
      const promises = Array.from({ length: requestCount }, () =>
        request(app).get('/mcp/health')
      );
      
      await Promise.all(promises);
      const duration = performance.now() - start;
      
      const throughput = requestCount / (duration / 1000); // requests per second
      expect(throughput).toBeGreaterThan(50); // At least 50 RPS
    });

    it('should handle sustained load', async () => {
      const batchSize = 20;
      const batches = 5;
      const results: number[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const start = performance.now();
        
        const promises = Array.from({ length: batchSize }, () =>
          request(app)
            .post('/mcp/tools/industry_search')
            .send({ query: `sustained_${batch}` })
        );
        
        await Promise.all(promises);
        const batchDuration = performance.now() - start;
        results.push(batchDuration);
      }
      
      // Performance should remain consistent across batches
      const avgDuration = results.reduce((a, b) => a + b) / results.length;
      const maxDeviation = Math.max(...results) - Math.min(...results);
      
      expect(maxDeviation).toBeLessThan(avgDuration * 0.5); // Less than 50% deviation
    });
  });

  describe('Large Payload Performance', () => {
    it('should handle moderately large requests efficiently', async () => {
      const largeQuery = 'artificial intelligence machine learning ' + 'keyword '.repeat(100);
      
      const start = performance.now();
      
      await request(app)
        .post('/mcp/tools/industry_search')
        .send({ 
          query: largeQuery,
          filters: {
            region: 'global',
            additional_data: 'x'.repeat(1000) // 1KB additional data
          }
        })
        .expect(200);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should handle within 1 second
    });
  });

  describe('Resource Utilization', () => {
    it('should maintain acceptable resource usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate sustained load
      const promises = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/mcp/tools/calculate_tam')
          .send({
            industry: `Industry_${i}`,
            geography: 'Global'
          })
      );
      
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory usage should remain reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors quickly', async () => {
      const start = performance.now();
      
      const promises = Array.from({ length: 20 }, () =>
        request(app)
          .post('/mcp/tools/industry_search')
          .send({ query: '' }) // Invalid query
          .expect(400)
      );
      
      await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(500); // Error handling should be fast
    });

    it('should recover quickly from errors', async () => {
      // Generate some errors
      await Promise.all(
        Array.from({ length: 10 }, () =>
          request(app)
            .post('/mcp/tools/industry_search')
            .send({ query: '' })
            .expect(400)
        )
      );
      
      // Then test normal operation performance
      const start = performance.now();
      
      await request(app)
        .post('/mcp/tools/industry_search')
        .send({ query: 'recovery_test' })
        .expect(200);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // Should not be impacted by previous errors
    });
  });
});
