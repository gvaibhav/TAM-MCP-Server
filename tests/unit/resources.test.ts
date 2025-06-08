import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';

describe('Unit Resource Handlers', () => {
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

  describe('Resource List Handler', () => {
    it('should return list of available resources', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(request);
      
      expect(response).toBeDefined();
      expect(response.resources).toBeInstanceOf(Array);
      expect(response.resources.length).toBe(3);
      
      // Verify each resource has required properties
      response.resources.forEach((resource: any) => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        expect(resource.mimeType).toBe('text/markdown');
      });
    });

    it('should include expected resources', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(request);
      const uris = response.resources.map((r: any) => r.uri);
      
      expect(uris).toContain('tam://readme');
      expect(uris).toContain('tam://contributing');
      expect(uris).toContain('tam://release-notes');
    });
  });

  describe('Resource Read Handler', () => {
    it('should read README resource', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://readme'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      expect(response).toBeDefined();
      expect(response.contents).toBeInstanceOf(Array);
      expect(response.contents.length).toBe(1);
      
      const content = response.contents[0];
      expect(content.uri).toBe('tam://readme');
      expect(content.mimeType).toBe('text/markdown');
      expect(content.text).toBeTruthy();
      expect(content.text).toContain('Market Sizing MCP Server');
    });

    it('should handle invalid URI gracefully', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://nonexistent'
        }
      };

      try {
        await server._requestHandlers.get('resources/read')?.(request);
        expect.fail('Should have thrown an error for invalid URI');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message || error.toString()).toMatch(/not found|invalid|unknown/i);
      }
    });
  });
});
