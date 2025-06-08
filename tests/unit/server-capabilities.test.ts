import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';

describe('Server Capabilities and Resource Support', () => {
  let server: any;
  let cleanup: any;

  beforeEach(async () => {
    const serverConfig = await createServer();
    server = serverConfig.server;
    cleanup = serverConfig.cleanup;
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize with resource capabilities', async () => {
      // Test server initialization by checking basic properties
      expect(server).toBeDefined();
      expect(server._requestHandlers).toBeDefined();
      
      // Test that resource handlers are registered (this confirms the server has resource capabilities)
      expect(server._requestHandlers.has('resources/list')).toBe(true);
      expect(server._requestHandlers.has('resources/read')).toBe(true);
    });

    it('should register resource request handlers', async () => {
      // Test that resource handlers are registered
      expect(server._requestHandlers.has('resources/list')).toBe(true);
      expect(server._requestHandlers.has('resources/read')).toBe(true);
      
      // Test resource list handler
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(listRequest);
      expect(response).toBeDefined();
      expect(response.resources).toBeDefined();
      expect(Array.isArray(response.resources)).toBe(true);
    });

    it('should maintain consistent server metadata', async () => {
      // Test server info consistency
      expect(server._serverInfo.name).toBe('tam-mcp-server');
      expect(server._serverInfo.version).toBe('1.0.0');
      
      // Test that server has expected request handlers
      expect(server._requestHandlers.size).toBeGreaterThan(0);
      expect(server._requestHandlers.has('resources/list')).toBe(true);
      expect(server._requestHandlers.has('resources/read')).toBe(true);
    });
  });

  describe('Resource Coverage', () => {
    it('should expose all documented project files as resources', async () => {
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(listRequest);
      const resourceUris = response.resources.map((r: any) => r.uri);
      
      // Should include all key documentation files
      expect(resourceUris).toContain('tam://readme');
      expect(resourceUris).toContain('tam://contributing');
      expect(resourceUris).toContain('tam://release-notes');
      
      // Should be exactly 3 resources as documented
      expect(response.resources).toHaveLength(3);
    });

    it('should provide meaningful resource descriptions', async () => {
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(listRequest);
      
      response.resources.forEach((resource: any) => {
        expect(resource.name).toBeTruthy();
        expect(resource.description).toBeTruthy();
        expect(resource.mimeType).toBe('text/markdown');
        expect(resource.uri).toMatch(/^tam:\/\//);
      });
    });
  });

  describe('MCP Protocol Compliance', () => {
    it('should follow MCP resource list response format', async () => {
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(listRequest);
      
      expect(response).toHaveProperty('resources');
      expect(Array.isArray(response.resources)).toBe(true);
      
      response.resources.forEach((resource: any) => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
      });
    });

    it('should follow MCP resource read response format', async () => {
      const readRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://readme'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(readRequest);
      
      expect(response).toHaveProperty('contents');
      expect(Array.isArray(response.contents)).toBe(true);
      expect(response.contents).toHaveLength(1);
      
      const content = response.contents[0];
      expect(content).toHaveProperty('uri');
      expect(content).toHaveProperty('mimeType');
      expect(content).toHaveProperty('text');
    });

    it('should use consistent URI scheme', async () => {
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(listRequest);
      
      response.resources.forEach((resource: any) => {
        expect(resource.uri).toMatch(/^tam:\/\/[a-z-]+$/);
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple resource requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () => {
        const request = {
          jsonrpc: '2.0' as const,
          id: Math.random(),
          method: 'resources/list',
          params: {}
        };
        return server._requestHandlers.get('resources/list')?.(request);
      });

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.resources).toHaveLength(3);
      });
      
      // Should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should maintain state consistency across requests', async () => {
      // Multiple list requests should return identical results
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response1 = await server._requestHandlers.get('resources/list')?.(request);
      const response2 = await server._requestHandlers.get('resources/list')?.(request);
      
      expect(response1).toEqual(response2);
    });
  });
});
